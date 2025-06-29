import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface CompanyFormProps {
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
  onSubmit: () => void;
  onClose: () => void;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({ company, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    ragione_sociale: company?.ragione_sociale || '',
    codice_ateco: company?.codice_ateco || '',
    piva: company?.piva || '',
    codice_fiscale: company?.codice_fiscale || '',
    sdi: company?.sdi || '',
    pec: company?.pec || '',
    iban: company?.iban || '',
    sede_azienda: company?.sede_azienda || '',
    citta: company?.citta || '',
    provincia: company?.provincia || '',
    cap: company?.cap || '',
    persona_riferimento: company?.persona_riferimento || '',
    mail: company?.mail || '',
    telefono: company?.telefono || '',
    note: company?.note || '',
  });

  useEffect(() => {
    if (company) {
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
    }
  }, [company]);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
      };
      let response;
      if (company) {
        response = await fetch(`http://localhost:4000/companies/${company.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('http://localhost:4000/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (!response.ok) {
        const errorText = await response.text();
        alert('Error: ' + errorText);
        return;
      }
      onSubmit();
      navigate('/companies');
    } catch (error) {
      alert('Error saving company: ' + error);
      console.error('Error saving company:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ragione Sociale</label>
          <input
            type="text"
            name="ragione_sociale"
            value={formData.ragione_sociale}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Codice ATECO</label>
          <input
            type="text"
            name="codice_ateco"
            value={formData.codice_ateco}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">P.IVA</label>
          <input
            type="text"
            name="piva"
            value={formData.piva}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Codice Fiscale</label>
          <input
            type="text"
            name="codice_fiscale"
            value={formData.codice_fiscale}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">SDI</label>
          <input
            type="text"
            name="sdi"
            value={formData.sdi}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">PEC</label>
          <input
            type="text"
            name="pec"
            value={formData.pec}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">IBAN</label>
          <input
            type="text"
            name="iban"
            value={formData.iban}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Sede Azienda</label>
          <input
            type="text"
            name="sede_azienda"
            value={formData.sede_azienda}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Città</label>
          <input
            type="text"
            name="citta"
            value={formData.citta}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Provincia</label>
          <input
            type="text"
            name="provincia"
            value={formData.provincia}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">CAP</label>
          <input
            type="text"
            name="cap"
            value={formData.cap}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Persona di Riferimento</label>
          <input
            type="text"
            name="persona_riferimento"
            value={formData.persona_riferimento}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mail</label>
          <input
            type="email"
            name="mail"
            value={formData.mail}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Telefono</label>
          <input
            type="text"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Note</label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {company ? 'Aggiorna Azienda' : 'Aggiungi Azienda'}
        </button>
      </div>
    </form>
  );
};