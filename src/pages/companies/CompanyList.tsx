import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, CheckSquare, LayoutGrid, List, Search, Filter, ChevronDown, Building2, Loader2 } from 'lucide-react';
import EntityListLayout from '../../components/layouts/EntityListLayout';
import { useCompanies } from '../../hooks/useCompanies';
import { Company } from '../../types';
import CompanyImport from '../../components/companies/CompanyImport';
import { createCompany } from '../../services/companies';
import ReactDOM from 'react-dom';

export default function CompanyList() {
  const { companies: companiesRaw, loading, error, removeCompany, refresh } = useCompanies();
  const companies: Company[] = companiesRaw as Company[];
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
    return (localStorage.getItem('companiesViewMode') as 'table' | 'grid') || 'table';
  });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState<string | null>(null);
  
  const industries = Array.from(new Set(companies.map(c => c.industry))).filter(Boolean).sort();
  const locations = Array.from(new Set(companies.map(c => c.location))).filter(Boolean).sort();
  const statuses = Array.from(new Set(companies.map(c => c.status))).filter(Boolean).sort();

  let filteredCompanies = companies;
  if (searchTerm) {
    filteredCompanies = filteredCompanies.filter(company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.industry || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  if (filterIndustry) {
    filteredCompanies = filteredCompanies.filter(company => company.industry === filterIndustry);
  }
  if (filterStatus) {
    filteredCompanies = filteredCompanies.filter(company => company.status === filterStatus);
  }
  if (filterLocation) {
    filteredCompanies = filteredCompanies.filter(company => company.location === filterLocation);
  }

  React.useEffect(() => {
    localStorage.setItem('companiesViewMode', viewMode);
  }, [viewMode]);

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(filteredCompanies.map((c) => c.id));
      setSelectAll(true);
    }
  };

  // Bulk delete selected companies
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm('Are you sure you want to delete the selected companies?')) return;
    try {
      await Promise.all(selectedIds.map(id => removeCompany(id)));
      setSelectedIds([]);
      setSelectAll(false);
      refresh();
    } catch (err) {
      alert('Error deleting selected companies');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Error loading companies</h2>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const ViewControls = () => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setSelectionMode(m => !m)}
        className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition ${
          selectionMode ? 'bg-blue-100 text-blue-700 border-blue-400' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
      >
        <CheckSquare className="h-4 w-4" />
        Modify
      </button>
      <div className="flex items-center bg-gray-100 rounded-lg p-1 relative">
        <button
          onClick={() => setViewMode('grid')}
          className={`relative z-10 px-3 py-2 rounded-lg flex items-center transition ${
            viewMode === 'grid' ? 'text-blue-700' : 'text-gray-500'
          }`}
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="ml-2 text-sm font-medium">Card</span>
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`relative z-10 px-3 py-2 rounded-lg flex items-center transition ${
            viewMode === 'table' ? 'text-blue-700' : 'text-gray-500'
          }`}
        >
          <List className="h-5 w-5" />
          <span className="ml-2 text-sm font-medium">Table</span>
        </button>
        <span
          className={`absolute top-1 left-1 h-8 w-[calc(50%-0.25rem)] bg-white rounded-lg shadow transition-transform duration-300 ${
            viewMode === 'table' ? 'translate-x-full' : ''
          }`}
          style={{ zIndex: 0 }}
        />
      </div>
    </div>
  );

  const filterContent = (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filterIndustry}
          onChange={e => setFilterIndustry(e.target.value)}
        >
          <option value="">All Industries</option>
          {industries.map(ind => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filterLocation}
          onChange={e => setFilterLocation(e.target.value)}
        >
          <option value="">All Locations</option>
          {locations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2 md:col-span-3 flex justify-end space-x-2">
        <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50" onClick={() => { setFilterIndustry(''); setFilterStatus(''); setFilterLocation(''); }}>
          Reset
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={() => setFilterActive(false)}>
          Apply Filters
        </button>
      </div>
    </div>
  );

  const AddCompanyDropdown = () => (
    <div className="relative">
      <button
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none"
        onClick={() => setDropdownOpen((open) => !open)}
        type="button"
      >
        <Plus className="h-5 w-5" />
        Add Company
        <ChevronDown className="h-4 w-4 ml-1" />
      </button>
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={() => { setDropdownOpen(false); window.location.href = '/companies/new'; }}
          >
            Add Single Company
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={() => { setDropdownOpen(false); setImportModalOpen(true); }}
          >
            Import from CSV
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
            onClick={() => {
              setDropdownOpen(false);
              // Download template logic
              const headers = [
                'Ragione Sociale', 'Codice ATECO', 'P.IVA', 'Codice Fiscale', 'SDI', 'PEC', 'IBAN', 'Sede Azienda', 'Città', 'Provincia', 'CAP', 'Persona di Riferimento', 'Mail', 'Telefono', 'Note'
              ];
              const csv = headers.join(';') + '\n';
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'template_companies.csv';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download Template
          </button>
        </div>
      )}
    </div>
  );

  // New RowActionsDropdown implementation
  const RowActionsDropdown = ({ company, openId, setOpenId, onDetail, onEdit, onDelete }: { company: any, openId: string | null, setOpenId: React.Dispatch<React.SetStateAction<string | null>>, onDetail: () => void, onEdit: () => void, onDelete: () => void }) => {
    const btnRef = useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState<{top: number, left: number} | null>(null);
    useEffect(() => {
      if (String(openId) === String(company.id) && btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
      }
    }, [openId, company.id]);
    // useEffect(() => {
    //   if (String(openId) !== String(company.id)) return;
    //   const handleClick = (e: MouseEvent) => {
    //     if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
    //       setOpenId(null);
    //     }
    //   };
    //   window.addEventListener('mousedown', handleClick);
    //   return () => window.removeEventListener('mousedown', handleClick);
    // }, [openId, setOpenId, company.id]);
    const menu = String(openId) === String(company.id) && menuPos ? (console.log('RENDER MENU for', company.id), ReactDOM.createPortal(
      <div
        className="fixed min-w-[8rem] w-fit bg-white border border-gray-200 rounded-xl shadow-lg z-[2000] animate-fade-in p-1"
        style={{ top: menuPos.top, left: menuPos.left }}
      >
        <button className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-100 rounded-xl flex items-center gap-2 transition-colors duration-150 font-normal" onClick={e => { e.stopPropagation(); setOpenId(null); onDetail(); }}><span>🔍</span> Dettagli</button>
        <button className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-100 flex items-center gap-2 transition-colors duration-150 font-normal" onClick={e => { e.stopPropagation(); setOpenId(null); onEdit(); }}><span>✏️</span> Modifica</button>
        <button className="w-full text-left px-4 py-2 hover:bg-red-100 focus:bg-red-200 text-red-700 rounded-xl flex items-center gap-2 transition-colors duration-150 font-normal" onClick={e => { e.stopPropagation(); setOpenId(null); onDelete(); }}><span>🗑️</span> Elimina</button>
      </div>,
      document.body
    )) : null;
    return (
      <>
        <div className="relative overflow-visible" style={{ zIndex: 1000 }}>
          <button
            ref={btnRef}
            className="w-[91.3px] h-[28px] px-0 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-normal shadow hover:bg-blue-200 transition text-sm focus:outline-none"
            onClick={e => { e.stopPropagation(); console.log('CLICK', String(company.id), String(openId)); setOpenId(String(openId) === String(company.id) ? null : String(company.id)); }}
            type="button"
          >
            Azioni
            <ChevronDown className="h-4 w-4 ml-1" />
          </button>
        </div>
        {menu}
      </>
    );
  };

  return (
    <>
      {importModalOpen && (
        <CompanyImport
          onImport={async (imported) => {
            let errorCount = 0;
            for (const row of imported) {
              try {
                // Map CSV fields to backend fields as needed
                await createCompany({
                  name: row.ragione_sociale,
                  ateco_code: row.codice_ateco,
                  vat_number: row.piva,
                  fiscal_code: row.codice_fiscale,
                  sdi: row.sdi,
                  pec: row.pec,
                  iban: row.iban,
                  address: row.sede_azienda,
                  city: row.citta,
                  province: row.provincia,
                  postal_code: row.cap,
                  contact_person: row.persona_riferimento,
                  email: row.mail,
                  phone: row.telefono,
                  notes: row.note,
                  // Add any other required fields with defaults if needed
                });
              } catch (e) {
                errorCount++;
              }
            }
            setImportModalOpen(false);
            refresh();
            if (errorCount > 0) {
              alert(`Importazione completata con ${errorCount} errori.`);
            }
          }}
          onClose={() => setImportModalOpen(false)}
          existingCompanies={companies}
        />
      )}
      <EntityListLayout
        title="Companies"
        subtitle="Manage all companies and their details"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterActive={filterActive}
        onToggleFilter={() => setFilterActive(f => !f)}
        sortBy={''}
        onSortChange={() => {}}
        filterContent={filterContent}
        extraControls={
          <div className="flex gap-2 items-center">
            <ViewControls />
            <AddCompanyDropdown />
          </div>
        }
      >
        {selectionMode && (
          <div className="flex items-center gap-2 mb-4">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200"
              onClick={handleSelectAll}
            >
              <CheckSquare className="h-4 w-4" />
              {selectAll ? 'Deselect All' : 'Select All'}
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow disabled:opacity-50"
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0}
            >
              Delete Selected
            </button>
          </div>
        )}
        {viewMode === 'table' ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  {selectionMode && (
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={e => {
                      if (!(e.target as HTMLElement).closest('a,button,input')) navigate(`/companies/${company.id}`);
                    }}
                  >
                    {selectionMode && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(company.id)}
                          onChange={ev => { ev.stopPropagation(); handleSelect(company.id); }}
                          onClick={ev => ev.stopPropagation()}
                        />
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <RowActionsDropdown
                        company={company}
                        openId={actionsDropdownOpen === company.id ? company.id : null}
                        setOpenId={setActionsDropdownOpen}
                        onDetail={() => navigate(`/companies/${company.id}`)}
                        onEdit={() => navigate(`/companies/${company.id}/edit`)}
                        onDelete={async () => {
                          if (window.confirm('Are you sure you want to delete this company?')) {
                            await removeCompany(company.id);
                            refresh();
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{company.name}</div>
                      <div className="text-gray-500 text-sm">{company.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{company.industry}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{company.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                        company.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{company.contact_person}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.map((company) => (
              <div key={company.id} className="relative cursor-pointer" onClick={() => navigate(`/companies/${company.id}`)}>
                {selectionMode && (
                  <input
                    type="checkbox"
                    className="absolute top-3 left-3 z-10 w-5 h-5"
                    checked={selectedIds.includes(company.id)}
                    onChange={ev => { ev.stopPropagation(); handleSelect(company.id); }}
                    onClick={ev => ev.stopPropagation()}
                  />
                )}
                <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                  <Building2 className="h-16 w-16 text-white opacity-50" />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800">{company.name}</h3>
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <span className="mr-4">{company.industry}</span>
                    <span>{company.employees} employees</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      company.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {company.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {company.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </EntityListLayout>
    </>
  );
}