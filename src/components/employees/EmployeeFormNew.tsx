import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Building, Calendar, Briefcase, FileText } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import EntityFormLayout from '../shared/form/EntityFormLayout';
import EntityFormField from '../shared/form/EntityFormField';
import EntityFormGrid, { EntityFormSection, EntityFormFullWidthField } from '../shared/form/EntityFormGrid';

interface Company {
  id: string;
  ragione_sociale: string;
}

interface EmployeeFormNewProps {
  /** Dati del dipendente in caso di modifica */
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    codice_fiscale: string;
    birth_date?: string;
    residence_address?: string;
    residence_city?: string;
    province?: string;
    postal_code?: string;
    company_id?: string;
    title?: string;
    email?: string;
    phone?: string;
    notes?: string;
    status?: string;
    hired_date?: string;
    photo_url?: string;
    companyId?: string;
  };
  /** Lista delle aziende disponibili */
  companies: Company[];
  /** Callback chiamata al completamento del salvataggio */
  onSuccess: () => void;
  /** Callback chiamata alla chiusura del form */
  onClose: () => void;
}

const TAX_CODE_REGEX = /^[a-zA-Z]{6}[0-9]{2}[abcdehlmprstABCDEHLMPRST]{1}[0-9]{2}([a-zA-Z]{1}[0-9]{3})[a-zA-Z]{1}$/;

/**
 * Estrae la data di nascita dal codice fiscale
 */
const extractBirthDateFromCF = (cf: string): string | null => {
  if (!cf || cf.length < 11) return null;
  const months = ['A','B','C','D','E','H','L','M','P','R','S','T'];
  const year = parseInt(cf.substr(6, 2), 10);
  const currentYear = new Date().getFullYear() % 100;
  const fullYear = year > currentYear ? 1900 + year : 2000 + year;
  const monthCode = cf.substr(8, 1).toUpperCase();
  const month = months.indexOf(monthCode) + 1;
  let day = parseInt(cf.substr(9, 2), 10);
  if (day > 40) day -= 40;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

// Fix the date format for Prisma compatibility
const formatDateForPrisma = (dateString?: string): string | undefined => {
  if (!dateString) return undefined;
  // Check if the date already has time information
  if (dateString.includes('T')) return dateString;
  // Add time part to convert YYYY-MM-DD to YYYY-MM-DDT00:00:00Z (ISO-8601)
  return `${dateString}T00:00:00Z`;
};

/**
 * Form moderno ed elegante per la creazione e modifica di un dipendente
 */
const EmployeeFormNew: React.FC<EmployeeFormNewProps> = ({
  employee,
  companies,
  onSuccess,
  onClose,
}) => {
  // Stato per i dati del form
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    codice_fiscale: '',
    birth_date: '',
    residence_address: '',
    residence_city: '',
    province: '',
    postal_code: '',
    company_id: '',
    title: '',
    email: '',
    phone: '',
    notes: '',
    status: 'Active',
    hired_date: '',
    photo_url: '',
  });
  
  // Stato per gli errori
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Stato per il salvataggio
  const [isSaving, setIsSaving] = useState(false);
  
  // Stato per errori generali
  const [generalError, setGeneralError] = useState('');
  
  // Hook per le notifiche toast
  const { showToast } = useToast();
  
  // Using a ref to track if we've already initialized the form
  const initializedRef = useRef(false);
  
  // Inizializza i dati del form se stiamo modificando un dipendente esistente
  useEffect(() => {
    // Only initialize data if we have employee data AND we haven't initialized yet
    if (employee && !initializedRef.current) {
      console.log("Setting employee data:", employee);
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        codice_fiscale: employee.codice_fiscale || '',
        birth_date: employee.birth_date ? employee.birth_date.substring(0, 10) : '', // Ensure date format is YYYY-MM-DD
        residence_address: employee.residence_address || '',
        residence_city: employee.residence_city || '',
        province: employee.province || '',
        postal_code: employee.postal_code || '',
        company_id: employee.company_id || employee.companyId || '',
        title: employee.title || '',
        email: employee.email || '',
        phone: employee.phone || '',
        notes: employee.notes || '',
        status: employee.status || 'Active',
        hired_date: employee.hired_date ? employee.hired_date.substring(0, 10) : '', // Ensure date format is YYYY-MM-DD
        photo_url: employee.photo_url || '',
      });
      initializedRef.current = true;
    }
  }, [employee]);
  
  // Estrai la data di nascita dal codice fiscale quando questo cambia
  useEffect(() => {
    if (formData.codice_fiscale && formData.codice_fiscale.length >= 11) {
      const extracted = extractBirthDateFromCF(formData.codice_fiscale);
      if (extracted) {
        setFormData(prev => ({ ...prev, birth_date: extracted }));
        
        // Rimuovi eventuali errori sulla data di nascita
        if (errors.birth_date) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.birth_date;
            return newErrors;
          });
        }
      }
    }
  }, [formData.codice_fiscale, errors.birth_date]);
  
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
  
  // Gestisce il caricamento di una foto
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch('http://localhost:4000/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Errore durante il caricamento dell\'immagine');
      }
      
      const data = await response.json();
      
      if (data.url) {
        setFormData(prev => ({ ...prev, photo_url: data.url }));
      }
    } catch (error) {
      showToast({ 
        message: `Errore: ${error instanceof Error ? error.message : 'Errore durante il caricamento dell\'immagine'}`, 
        type: 'error' 
      });
    }
  };
  
  // Valida i dati del form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validazione campi obbligatori
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Il Nome è obbligatorio';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Il Cognome è obbligatorio';
    }
    
    if (!formData.codice_fiscale.trim()) {
      newErrors.codice_fiscale = 'Il Codice Fiscale è obbligatorio';
    } else if (!TAX_CODE_REGEX.test(formData.codice_fiscale)) {
      newErrors.codice_fiscale = 'Formato Codice Fiscale non valido';
    }
    
    if (!formData.company_id) {
      newErrors.company_id = 'L\'Azienda è obbligatoria';
    }
    
    // Validazione email
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato email non valido';
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
        birth_date: formatDateForPrisma(formData.birth_date),
        hired_date: formatDateForPrisma(formData.hired_date),
      };
      
      console.log("Payload being sent to API:", payload);
      
      // Determina l'URL e il metodo in base a se stiamo creando o modificando
      const url = employee 
        ? `http://localhost:4000/employees/${employee.id}` 
        : 'http://localhost:4000/employees';
      const method = employee ? 'PUT' : 'POST';
      
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
        message: employee ? 'Dipendente aggiornato con successo' : 'Dipendente creato con successo', 
        type: 'success' 
      });
      
      // Chiama il callback di successo
      onSuccess();
    } catch (error) {
      console.error('Error saving employee:', error);
      setGeneralError(error instanceof Error ? error.message : 'Errore durante il salvataggio');
      
      // Mostra notifica di errore
        showToast({ 
        message: `Errore: ${error instanceof Error ? error.message : 'Errore durante il salvataggio'}`, 
          type: 'error' 
        });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Gestisce la rimozione della foto
  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photo_url: '' }));
  };
  
  return (
    <EntityFormLayout
      title={employee ? 'Modifica Dipendente' : 'Nuovo Dipendente'}
      subtitle={employee ? `Modifica i dati di ${formData.first_name} ${formData.last_name}` : 'Inserisci i dati del nuovo dipendente'}
      onSubmit={handleSubmit}
      onClose={onClose}
      isSaving={isSaving}
      error={generalError}
      submitLabel={employee ? 'Aggiorna' : 'Crea'}
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-3/4">
          <EntityFormSection title="Dati Anagrafici" description="Informazioni personali del dipendente">
        <EntityFormGrid columns={2}>
          <EntityFormField
            name="first_name"
            label="Nome"
            value={formData.first_name}
            onChange={handleChange}
            required
            leftIcon={<User size={18} />}
            error={errors.first_name}
          />
          
          <EntityFormField
            name="last_name"
            label="Cognome"
            value={formData.last_name}
            onChange={handleChange}
            required
            leftIcon={<User size={18} />}
            error={errors.last_name}
          />
          
          <EntityFormField
            name="codice_fiscale"
            label="Codice Fiscale"
            value={formData.codice_fiscale}
            onChange={handleChange}
            required
                leftIcon={<FileText size={18} />}
            error={errors.codice_fiscale}
          />
          
          <EntityFormField
            name="birth_date"
            label="Data di Nascita"
            type="date"
            value={formData.birth_date}
            onChange={handleChange}
            leftIcon={<Calendar size={18} />}
            error={errors.birth_date}
                helpText="Estratta automaticamente dal codice fiscale"
          />
        </EntityFormGrid>
      </EntityFormSection>
      
      <EntityFormSection title="Residenza" description="Indirizzo di residenza del dipendente">
        <EntityFormGrid columns={2}>
          <EntityFormField
            name="residence_address"
            label="Indirizzo"
            value={formData.residence_address}
            onChange={handleChange}
            leftIcon={<MapPin size={18} />}
            error={errors.residence_address}
          />
          
          <EntityFormField
            name="residence_city"
            label="Città"
            value={formData.residence_city}
            onChange={handleChange}
            leftIcon={<MapPin size={18} />}
            error={errors.residence_city}
          />
          
          <EntityFormField
            name="province"
            label="Provincia"
            value={formData.province}
            onChange={handleChange}
            leftIcon={<MapPin size={18} />}
            error={errors.province}
          />
          
          <EntityFormField
            name="postal_code"
            label="CAP"
            value={formData.postal_code}
            onChange={handleChange}
            leftIcon={<MapPin size={18} />}
            error={errors.postal_code}
          />
        </EntityFormGrid>
      </EntityFormSection>
      
          <EntityFormSection title="Lavoro" description="Informazioni lavorative del dipendente">
        <EntityFormGrid columns={2}>
          <EntityFormField
            name="company_id"
            label="Azienda"
            type="select"
            value={formData.company_id}
            onChange={handleChange}
            required
                leftIcon={<Building size={18} />}
            error={errors.company_id}
            options={companies.map(company => ({
              value: company.id,
              label: company.ragione_sociale
            }))}
          />
          
          <EntityFormField
            name="title"
                label="Ruolo / Mansione"
            value={formData.title}
            onChange={handleChange}
            leftIcon={<Briefcase size={18} />}
            error={errors.title}
          />
          
          <EntityFormField
            name="hired_date"
            label="Data Assunzione"
            type="date"
            value={formData.hired_date}
            onChange={handleChange}
            leftIcon={<Calendar size={18} />}
            error={errors.hired_date}
          />
          
          <EntityFormField
            name="status"
            label="Stato"
            type="select"
            value={formData.status}
            onChange={handleChange}
                leftIcon={<User size={18} />}
                error={errors.status}
            options={[
              { value: 'Active', label: 'Attivo' },
              { value: 'Inactive', label: 'Inattivo' },
                  { value: 'OnLeave', label: 'In Aspettativa' },
                  { value: 'Terminated', label: 'Cessato' }
            ]}
          />
        </EntityFormGrid>
      </EntityFormSection>
      
          <EntityFormSection title="Contatti" description="Informazioni di contatto del dipendente">
        <EntityFormGrid columns={2}>
          <EntityFormField
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            leftIcon={<Mail size={18} />}
            error={errors.email}
          />
          
          <EntityFormField
            name="phone"
            label="Telefono"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            leftIcon={<Phone size={18} />}
            error={errors.phone}
          />
        </EntityFormGrid>
      </EntityFormSection>
      
      <EntityFormSection title="Note Aggiuntive">
        <EntityFormGrid columns={1}>
          <EntityFormField
            name="notes"
            label="Note"
            type="textarea"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            error={errors.notes}
          />
        </EntityFormGrid>
      </EntityFormSection>
          </div>
        
        <div className="w-full md:w-1/4">
          <EntityFormSection title="Foto" description="Foto del dipendente">
            <div className="flex flex-col items-center space-y-4">
        {formData.photo_url ? (
          <div className="relative">
            <img 
              src={formData.photo_url} 
                    alt={`${formData.first_name} ${formData.last_name}`} 
                    className="w-48 h-48 object-cover rounded-lg border border-gray-300"
            />
            <button
              type="button"
              onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    title="Rimuovi foto"
            >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
                  <User size={64} className="text-gray-400" />
          </div>
        )}
        
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Carica Foto</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handlePhotoChange} 
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
      </div>
            </div>
      </EntityFormSection>
          </div>
          </div>
    </EntityFormLayout>
  );
};

export default EmployeeFormNew; 