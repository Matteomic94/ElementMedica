import React, { useState, useEffect, useRef } from 'react';
import { Building2, Mail, Phone, Map, Hash, FileText, CreditCard, User } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { API_BASE_URL } from '../../config/api';

import EntityFormLayout from '../shared/form/EntityFormLayout';
import EntityFormField from '../shared/form/EntityFormField';
import EntityFormGrid, { EntityFormSection, EntityFormFullWidthField } from '../shared/form/EntityFormGrid';

interface CompanyFormNewProps {
  /** Dati dell'azienda in caso di modifica */
  company?: {
    id: string;
    ragione_sociale: string;
    codice_ateco?: string;
    piva?: string;
    codice_fiscale?: string;
    sdi?: string;
    pec?: string;
    iban?: string;
    sede_azienda?: string;
    citta?: string;
    provincia?: string;
    cap?: string;
    persona_riferimento?: string;
    mail?: string;
    telefono?: string;
    note?: string;
  };
  /** Callback chiamata al completamento del salvataggio */
  onSuccess: () => void;
  /** Callback chiamata alla chiusura del form */
  onClose: () => void;
}

/**
 * Form moderno ed elegante per la creazione e modifica di un'azienda
 */
const CompanyFormNew: React.FC<CompanyFormNewProps> = ({
  company,
  onSuccess,
  onClose,
}) => {
  // Stato per i dati del form
  const [formData, setFormData] = useState({
    ragione_sociale: '',
    codice_ateco: '',
    piva: '',
    codice_fiscale: '',
    sdi: '',
    pec: '',
    iban: '',
    sede_azienda: '',
    citta: '',
    provincia: '',
    cap: '',
    persona_riferimento: '',
    mail: '',
    telefono: '',
    note: '',
  });
  
  // Stato per gli errori
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Stato per il salvataggio
  const [isSaving, setIsSaving] = useState(false);
  
  // Stato per errori generali
  const [generalError, setGeneralError] = useState('');
  
  // Hook per le notifiche toast
  const { showToast } = useToast();
  
  // Inizializza i dati del form se stiamo modificando un'azienda esistente
  // Using a ref to track if we've already initialized the form
  const initializedRef = useRef(false);
  
  useEffect(() => {
    // Only initialize data if we have company data AND we haven't initialized yet
    if (company && !initializedRef.current) {
      console.log("Setting company data:", company);
      setFormData({
        ragione_sociale: company.ragione_sociale || '',
        codice_ateco: company.codice_ateco || '',
        piva: company.piva || '',
        codice_fiscale: company.codice_fiscale || '',
        sdi: company.sdi || '',
        pec: company.pec || '',
        iban: company.iban || '',
        sede_azienda: company.sede_azienda || '',
        citta: company.citta || '',
        provincia: company.provincia || '',
        cap: company.cap || '',
        persona_riferimento: company.persona_riferimento || '',
        mail: company.mail || '',
        telefono: company.telefono || '',
        note: company.note || '',
      });
      initializedRef.current = true;
    }
  }, [company]);
  
  // Gestisce il cambio dei valori nei campi
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name} = ${value}`); // Add logging for debugging
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Rimuovi l'errore per questo campo se presente
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Valida i dati del form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validazione campi obbligatori
    if (!formData.ragione_sociale.trim()) {
      newErrors.ragione_sociale = 'La Ragione Sociale è obbligatoria';
    }
    
    // Almeno uno tra P.IVA e Codice Fiscale deve essere presente
    if (!formData.piva.trim() && !formData.codice_fiscale.trim()) {
      newErrors.piva = 'Almeno uno tra P.IVA e Codice Fiscale deve essere inserito';
      newErrors.codice_fiscale = 'Almeno uno tra P.IVA e Codice Fiscale deve essere inserito';
    }
    
    // Validazione P.IVA (se presente)
    if (formData.piva.trim() && (formData.piva.length < 8 || formData.piva.length > 13)) {
      newErrors.piva = 'La P.IVA deve essere compresa tra 8 e 13 caratteri';
    }
    
    // Validazione sede aziendale
    if (!formData.sede_azienda.trim()) {
      newErrors.sede_azienda = 'La Sede Aziendale è obbligatoria';
    }
    
    // Validazione persona di riferimento
    if (!formData.persona_riferimento.trim()) {
      newErrors.persona_riferimento = 'La Persona di Riferimento è obbligatoria';
    }
    
    // Validazione email
    if (formData.mail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.mail)) {
        newErrors.mail = 'Formato email non valido';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Gestisce l'invio del form
  const handleSubmit = async () => {
    setGeneralError('');
    
    // Valida il form
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    console.log("Form data being submitted:", formData);
    
    try {
      // Prepara i dati da inviare
      const payload = {
        ...formData,
      };
      
      console.log("Payload being sent to API:", payload);
      
      // Determina l'URL e il metodo in base a se stiamo creando o modificando
      const url = company 
        ? `${API_BASE_URL}/companies/${company.id}` 
        : `${API_BASE_URL}/companies`;
      const method = company ? 'PUT' : 'POST';
      
      // Invia la richiesta
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      // Gestisci la risposta
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Errore durante il salvataggio');
      }
      
      // Mostra notifica di successo
      showToast({
        message: company ? 'Azienda aggiornata con successo' : 'Azienda creata con successo',
        type: 'success'
      });
      
      // Chiama il callback di successo
      onSuccess();
    } catch (error) {
      console.error('Error saving company:', error);
      setGeneralError(error instanceof Error ? error.message : 'Errore durante il salvataggio');
      showToast({
        message: `Errore: ${error instanceof Error ? error.message : 'Errore durante il salvataggio'}`,
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <EntityFormLayout
      title={company ? 'Modifica Azienda' : 'Nuova Azienda'}
      subtitle={company ? `Modifica i dati dell'azienda ${company.ragione_sociale}` : 'Inserisci i dati della nuova azienda'}
      onSubmit={handleSubmit}
      onClose={onClose}
      isSaving={isSaving}
      error={generalError}
      submitLabel={company ? 'Salva Modifiche' : 'Aggiungi Azienda'}
      cancelLabel="Annulla"
    >
      <EntityFormSection title="Informazioni Generali" description="Dati principali dell'azienda">
        <EntityFormGrid>
          <EntityFormField
            label="Ragione Sociale"
            name="ragione_sociale"
            value={formData.ragione_sociale}
            onChange={handleChange}
            error={errors.ragione_sociale}
            required
            icon={<Building2 className="h-5 w-5 text-gray-400" />}
          />
          
          <EntityFormField
            label="Codice Ateco"
            name="codice_ateco"
            value={formData.codice_ateco}
            onChange={handleChange}
            error={errors.codice_ateco}
            icon={<Hash className="h-5 w-5 text-gray-400" />}
          />
          
          <EntityFormField
            label="Partita IVA"
            name="piva"
            value={formData.piva}
            onChange={handleChange}
            error={errors.piva}
            icon={<FileText className="h-5 w-5 text-gray-400" />}
          />
          
          <EntityFormField
            label="Codice Fiscale"
            name="codice_fiscale"
            value={formData.codice_fiscale}
            onChange={handleChange}
            error={errors.codice_fiscale}
            icon={<FileText className="h-5 w-5 text-gray-400" />}
          />
          
          <EntityFormField
            label="Codice SDI"
            name="sdi"
            value={formData.sdi}
            onChange={handleChange}
            error={errors.sdi}
            icon={<Hash className="h-5 w-5 text-gray-400" />}
          />
          
          <EntityFormField
            label="PEC"
            name="pec"
            value={formData.pec}
            onChange={handleChange}
            error={errors.pec}
            icon={<Mail className="h-5 w-5 text-gray-400" />}
          />
          
          <EntityFormField
            label="IBAN"
            name="iban"
            value={formData.iban}
            onChange={handleChange}
            error={errors.iban}
            icon={<CreditCard className="h-5 w-5 text-gray-400" />}
          />
        </EntityFormGrid>
      </EntityFormSection>
      
      <EntityFormSection title="Sede e Contatti" description="Informazioni sulla sede e i contatti dell'azienda">
        <EntityFormGrid>
          <EntityFormField
            label="Sede Aziendale"
            name="sede_azienda"
            value={formData.sede_azienda}
            onChange={handleChange}
            error={errors.sede_azienda}
            required
            icon={<Building2 className="h-5 w-5 text-gray-400" />}
          />
          
          <EntityFormField
            label="Città"
            name="citta"
            value={formData.citta}
            onChange={handleChange}
            error={errors.citta}
            icon={<Map className="h-5 w-5 text-gray-400" />}
          />
          
          <EntityFormField
            label="Provincia"
            name="provincia"
            value={formData.provincia}
            onChange={handleChange}
            error={errors.provincia}
            icon={<Map className="h-5 w-5 text-gray-400" />}
          />
          
          <EntityFormField
            label="CAP"
            name="cap"
            value={formData.cap}
            onChange={handleChange}
            error={errors.cap}
            icon={<Hash className="h-5 w-5 text-gray-400" />}
          />
          
          <EntityFormField
            label="Persona di Riferimento"
            name="persona_riferimento"
            value={formData.persona_riferimento}
            onChange={handleChange}
            error={errors.persona_riferimento}
            required
            icon={<User className="h-5 w-5 text-gray-400" />}
          />
          
          <EntityFormField
            label="Email"
            name="mail"
            value={formData.mail}
            onChange={handleChange}
            error={errors.mail}
            icon={<Mail className="h-5 w-5 text-gray-400" />}
          />
          
          <EntityFormField
            label="Telefono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            error={errors.telefono}
            icon={<Phone className="h-5 w-5 text-gray-400" />}
          />
        </EntityFormGrid>
      </EntityFormSection>
      
      <EntityFormSection title="Note Aggiuntive" description="Informazioni aggiuntive sull'azienda">
        <EntityFormFullWidthField>
          <EntityFormField 
            label="Note"
            name="note"
            value={formData.note}
            onChange={handleChange}
            error={errors.note}
            multiline
            rows={4}
          />
        </EntityFormFullWidthField>
      </EntityFormSection>
    </EntityFormLayout>
  );
};

export default CompanyFormNew; 