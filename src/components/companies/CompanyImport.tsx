import React, { useState } from 'react';
import GenericImport, { defaultProcessFile } from '../shared/GenericImport';
import { applyTitleCaseToFields } from '../../utils/textFormatters';
import { useToast } from '../../hooks/useToast';

interface CompanyImportProps {
  onImport: (companies: any[], overwriteIds?: string[]) => Promise<void>;
  onClose: () => void;
  existingCompanies?: any[];
}

// Definizione della mappatura dei campi CSV
const csvHeaderMap: Record<string, string> = {
  'Ragione Sociale': 'ragione_sociale',
  'Codice ATECO': 'codice_ateco',
  'P.IVA': 'piva',
  'Codice Fiscale': 'codice_fiscale',
  'SDI': 'sdi',
  'PEC': 'pec',
  'IBAN': 'iban',
  'Sede Azienda': 'sede_azienda',
  'Città': 'citta',
  'Provincia': 'provincia',
  'CAP': 'cap',
  'Persona di Riferimento': 'persona_riferimento',
  'Mail': 'mail',
  'Telefono': 'telefono',
  'Note': 'note',
};

// Campi da formattare in title case
const titleCaseFields = [
  'ragione_sociale',
  'sede_azienda',
  'citta',
  'persona_riferimento'
];

// Validazione personalizzata per le aziende
const validateCompany = (company: any): string[] => {
  const errors: string[] = [];
  
  if (!company.ragione_sociale) {
    errors.push('Ragione Sociale obbligatoria');
  } else if (company.ragione_sociale.length > 250) {
    errors.push('Ragione Sociale troppo lunga (max 250 caratteri)');
  }
  
  // Verifica che ci sia almeno uno tra P.IVA e Codice Fiscale
  if (!company.piva && !company.codice_fiscale) {
    errors.push('P.IVA o Codice Fiscale obbligatori');
  }
  
  // Verifica della P.IVA (se presente)
  if (company.piva) {
    if (company.piva.length < 8 || company.piva.length > 13) {
      errors.push('P.IVA non valida (deve essere tra 8 e 13 caratteri)');
    }
    
    // Verifica che contenga solo numeri
    if (!/^\d+$/.test(company.piva)) {
      errors.push('P.IVA deve contenere solo numeri');
    }
  }
  
  // Verifica del Codice Fiscale SOLO se non c'è una P.IVA valida
  if (!company.piva && company.codice_fiscale) {
    // Se il codice fiscale è per un'azienda (11 caratteri) o una persona (16 caratteri)
    if (company.codice_fiscale.length !== 16 && company.codice_fiscale.length !== 11) {
      errors.push('Codice Fiscale non valido (deve essere 16 caratteri per persone fisiche o 11 per aziende)');
    }
  }
  
  // Verifica campi che potrebbero causare errori 500
  if (company.sdi && company.sdi.length > 7) {
    errors.push('Codice SDI troppo lungo (max 7 caratteri)');
  }
  
  if (company.pec && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.pec)) {
    errors.push('Formato PEC non valido');
  }
  
  if (company.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.mail)) {
    errors.push('Formato Mail non valido');
  }
  
  if (company.telefono && !/^[\d\s+\-().]+$/.test(company.telefono)) {
    errors.push('Formato Telefono non valido (sono consentiti solo numeri, spazi e caratteri +-(). )');
  }
  
  // Verifica lunghezza eccessiva per campi comuni
  const maxLengthFields: [string, number][] = [
    ['sede_azienda', 250],
    ['citta', 100],
    ['provincia', 50],
    ['cap', 10],
    ['persona_riferimento', 100],
    ['note', 1000]
  ];
  
  maxLengthFields.forEach(([field, maxLength]) => {
    if (company[field] && company[field].length > maxLength) {
      errors.push(`Il campo ${field} è troppo lungo (max ${maxLength} caratteri)`);
    }
  });
  
  return errors;
};

/**
 * Componente per l'importazione di aziende da file CSV
 */
const CompanyImport: React.FC<CompanyImportProps> = ({
  onImport,
  onClose,
  existingCompanies = []
}) => {
  const [importData, setImportData] = useState<any[]>([]);
  const { showToast } = useToast();

  // Funzione personalizzata per processare il file CSV
  const customProcessFile = async (file: File): Promise<any[]> => {
    try {
      // Processa il file e ottieni i dati grezzi
      const processedData = await defaultProcessFile(file, csvHeaderMap);
      
      // Applica il Title Case ai campi specificati
      const formattedData = processedData.map(company => {
        return applyTitleCaseToFields(company, titleCaseFields);
      });
      
      // Verifica la presenza di dati basilari
      if (formattedData.length === 0) {
        throw new Error('Il file non contiene dati validi');
      }
      
      // Conta quante righe hanno la ragione sociale
      const validRowsCount = formattedData.filter(c => c.ragione_sociale).length;
      if (validRowsCount === 0) {
        throw new Error('Nessuna riga contiene la Ragione Sociale, che è un campo obbligatorio');
      }
      
      // Verifica che almeno il 50% delle righe contenga la ragione sociale
      if (validRowsCount < formattedData.length / 2) {
        showToast({
          message: `Attenzione: solo ${validRowsCount} su ${formattedData.length} righe contengono la Ragione Sociale`,
          type: 'warning'
        });
      }
      
      // Cerca corrispondenze con aziende esistenti tramite P.IVA o Codice Fiscale
      const dataWithIds = formattedData.map(company => {
        // Se l'azienda ha P.IVA o Codice Fiscale, cerca corrispondenze
        if (company.piva || company.codice_fiscale) {
          // Cerca per P.IVA
          if (company.piva) {
            const existingByPiva = existingCompanies.find(existing => 
              existing.piva && existing.piva.trim() === company.piva.trim()
            );
            
            if (existingByPiva) {
              return { ...company, id: existingByPiva.id, _isExisting: true };
            }
          }
          
          // Cerca per Codice Fiscale
          if (company.codice_fiscale) {
            const existingByCF = existingCompanies.find(existing => 
              existing.codice_fiscale && 
              existing.codice_fiscale.trim().toUpperCase() === company.codice_fiscale.trim().toUpperCase()
            );
            
            if (existingByCF) {
              return { ...company, id: existingByCF.id, _isExisting: true };
            }
          }
        }
        
        return company;
      });
      
      setImportData(dataWithIds);
      return dataWithIds;
    } catch (error) {
      console.error('Errore durante il processing del file:', error);
      throw error;
    }
  };

  // Custom import handler che aggiunge maggiore sicurezza
  const handleImport = async (data: any[], overwriteIds?: string[]) => {
    try {
      // Prepara l'array finale con tutti i dati
      const finalData = data.map(company => {
        // Assicurati che i dati siano ben formattati e puliti
        const cleanCompany = { ...company };
        
        // Rimuovi proprietà tecniche
        Object.keys(cleanCompany).forEach(key => {
          if (key.startsWith('_')) {
            delete cleanCompany[key];
          }
        });
        
        // Assicurati che i campi numerici siano effettivamente numeri
        if (cleanCompany.cap && !isNaN(cleanCompany.cap)) {
          cleanCompany.cap = String(cleanCompany.cap).padStart(5, '0').slice(0, 5);
        }
        
        // Rimuovi spazi extra e formatta
        Object.keys(cleanCompany).forEach(key => {
          if (typeof cleanCompany[key] === 'string') {
            cleanCompany[key] = cleanCompany[key].trim();
          }
        });
        
        return cleanCompany;
      });
      
      // Chiamata alla funzione di import originale
      await onImport(finalData, overwriteIds);
      
      // Chiudiamo la finestra solo in caso di successo
      onClose();
    } catch (error: any) {
      console.error('Errore durante l\'importazione:', error);
      
      // Propaga l'errore al componente padre senza chiudere la finestra
      throw error;
    }
  };

  return (
    <GenericImport
      entityType="aziende"
      uniqueField="piva"
      onImport={handleImport}
      onClose={onClose}
      existingEntities={existingCompanies}
      csvHeaderMap={csvHeaderMap}
      title="Importa Aziende"
      subtitle="Carica un file CSV con i dati delle aziende da importare"
      customValidation={validateCompany}
      csvDelimiter=";"
      customProcessFile={customProcessFile}
    />
  );
};

export default CompanyImport; 