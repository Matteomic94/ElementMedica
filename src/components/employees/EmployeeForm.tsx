import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Employee {
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
}

interface EmployeeFormProps {
  employee?: Employee;
  companies: any[];
  onSubmit: () => void;
  onCancel: () => void;
}

interface Company {
  id: string;
  name: string;
  ragione_sociale?: string;
}

const TAX_CODE_REGEX = /^[a-zA-Z]{6}[0-9]{2}[abcdehlmprstABCDEHLMPRST]{1}[0-9]{2}([a-zA-Z]{1}[0-9]{3})[a-zA-Z]{1}$/;

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

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ 
  employee, 
  companies: externalCompanies, 
  onSubmit,
  onCancel 
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState<Partial<Employee>>({
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
  const [error, setError] = useState('');

  useEffect(() => {
    if (externalCompanies && externalCompanies.length > 0) {
      setCompanies(externalCompanies);
    } else {
      fetchCompanies();
    }
    if (employee) {
      setFormData(employee);
    }
  }, [employee, externalCompanies]);

  useEffect(() => {
    if (formData.codice_fiscale && formData.codice_fiscale.length >= 11) {
      const extracted = extractBirthDateFromCF(formData.codice_fiscale);
      if (extracted) {
        setFormData((prev) => ({ ...prev, birth_date: extracted }));
        setError('');
      } else {
        setError('Codice Fiscale non valido o data di nascita non estraibile');
      }
    }
  }, [formData.codice_fiscale]);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('http://localhost:4000/companies');
      const data = await res.json();
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.first_name || !formData.last_name || !formData.codice_fiscale || !formData.company_id) {
      setError('Nome, Cognome, Codice Fiscale e Azienda sono obbligatori');
      return;
    }
    if (!TAX_CODE_REGEX.test(formData.codice_fiscale)) {
      setError('Codice Fiscale non valido');
      return;
    }
    try {
      const url = employee
        ? `http://localhost:4000/employees/${employee.id}`
        : 'http://localhost:4000/employees';
      const method = employee ? 'PUT' : 'POST';
      const body = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        codice_fiscale: formData.codice_fiscale,
        birth_date: formData.birth_date ? new Date(formData.birth_date) : undefined,
        residence_address: formData.residence_address,
        residence_city: formData.residence_city,
        province: formData.province,
        postal_code: formData.postal_code,
        companyId: formData.company_id,
        title: formData.title,
        email: formData.email,
        phone: formData.phone,
        notes: formData.notes,
        status: formData.status,
        hired_date: formData.hired_date ? new Date(formData.hired_date) : undefined,
        photo_url: formData.photo_url || undefined,
      };
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {
        setError('Un altro dipendente ha già questo Codice Fiscale.');
        return;
      }
      if (!res.ok) throw new Error('Failed to save employee');
      onSubmit();
    } catch (error) {
      setError('Errore durante il salvataggio');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('photo', file);
    const res = await fetch('http://localhost:4000/upload', {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    if (data.url) {
      setFormData((prev) => ({ ...prev, photo_url: data.url }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center mb-4">
        {formData.photo_url ? (
          <img src={formData.photo_url} alt="Foto dipendente" className="w-24 h-24 rounded-full object-cover mb-2 border" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-2 text-2xl text-gray-400">?
          </div>
        )}
        <label className="block">
          <span className="sr-only">Carica foto</span>
          <input type="file" accept="image/*" onChange={handlePhotoChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </label>
        {formData.photo_url && (
          <button type="button" className="text-xs text-red-500 mt-1" onClick={() => setFormData((prev) => ({ ...prev, photo_url: '' }))}>
            Rimuovi foto
          </button>
        )}
      </div>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          {employee ? 'Edit Employee' : 'Add Employee'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
            Cognome
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label htmlFor="codice_fiscale" className="block text-sm font-medium text-gray-700">
            Codice Fiscale
          </label>
          <input
            type="text"
            id="codice_fiscale"
            name="codice_fiscale"
            value={formData.codice_fiscale || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
            disabled={!!employee}
          />
          {formData.codice_fiscale && (
            <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
              TAX_CODE_REGEX.test(formData.codice_fiscale) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {TAX_CODE_REGEX.test(formData.codice_fiscale) ? 'Codice Fiscale valido' : 'Codice Fiscale non valido'}
            </span>
          )}
        </div>
        <div>
          <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
            Data di Nascita
          </label>
          <input
            type="date"
            id="birth_date"
            name="birth_date"
            value={formData.birth_date || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="residence_address" className="block text-sm font-medium text-gray-700">
            Via di Residenza
          </label>
          <input
            type="text"
            id="residence_address"
            name="residence_address"
            value={formData.residence_address || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="residence_city" className="block text-sm font-medium text-gray-700">
            Comune di Residenza
          </label>
          <input
            type="text"
            id="residence_city"
            name="residence_city"
            value={formData.residence_city || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="province" className="block text-sm font-medium text-gray-700">
            Provincia
          </label>
          <input
            type="text"
            id="province"
            name="province"
            value={formData.province || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
            CAP
          </label>
          <input
            type="text"
            id="postal_code"
            name="postal_code"
            value={formData.postal_code || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="company_id" className="block text-sm font-medium text-gray-700">
            Azienda
          </label>
          <select
            id="company_id"
            name="company_id"
            value={formData.company_id || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Seleziona azienda</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>{company.ragione_sociale || company.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Profilo Professionale
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Mail
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Telefono
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Note
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={2}
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Stato
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="Active">Attivo</option>
            <option value="Inactive">Non attivo</option>
          </select>
        </div>
        <div>
          <label htmlFor="hired_date" className="block text-sm font-medium text-gray-700">
            Data di Assunzione
          </label>
          <input
            type="date"
            id="hired_date"
            name="hired_date"
            value={formData.hired_date || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow"
        >
          {employee ? 'Update' : 'Add'} Employee
        </button>
      </div>
    </form>
  );
}; 