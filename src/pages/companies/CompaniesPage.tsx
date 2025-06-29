import React, { useState, useEffect } from 'react';
import { Pencil, Plus, ChevronDown, Download, Upload, Calendar, Users, Trash2, Columns, Building2, FileText, MapPin, ChevronRight, XCircle } from 'lucide-react';
import EntityListLayout from '../../components/layouts/EntityListLayout';
import { Link, useNavigate } from 'react-router-dom';
import ResizableTable from '../../components/shared/ResizableTable';
import { createCompany, updateCompany, deleteCompany } from '../../services/companies';
import CompanyImport from '../../components/companies/CompanyImport';
import { useCompanies } from '../../hooks/useCompanies';
import { getEmployeesByCompany } from '../../services/employees';
import {
  ActionButton,
  ColumnSelector,
  AddEntityDropdown,
  BatchEditButton
} from '../../components/shared/ui';
import { Button } from '../../design-system/atoms/Button';
import { ViewModeToggle } from '../../design-system/molecules/ViewModeToggle';
import { SelectionPills } from '../../design-system/molecules/SelectionPills';
import { HeaderPanel } from '../../design-system/organisms/HeaderPanel';
import { FilterPanel } from '../../design-system/organisms/FilterPanel';
import { Dropdown } from '../../design-system/molecules';
import { exportToCsv } from '../../utils/csvExport';
import { useToast } from '../../hooks/useToast';
import { saveViewMode } from '../../services/userPreferences';
import EntityCard from '../../components/shared/cards/EntityCard';

// Definisci il tipo per Company
interface Company {
  id: string;
  ragione_sociale: string;
  sede_azienda?: string;
  citta?: string;
  provincia?: string;
  cap?: string;
  piva?: string;
  codice_fiscale?: string;
  codice_ateco?: string;
  sdi?: string;
  pec?: string;
  iban?: string;
  persona_riferimento?: string;
  telefono?: string;
  email?: string;
  created_at: string;
  updated_at: string;
  dipendenti?: { id: string }[];
}

// Esportazione nominale del componente
export const CompaniesPage: React.FC = () => {
  const navigate = useNavigate();
  const { companies: companiesData, loading, refresh: refreshCompanies, error } = useCompanies();
  const { showToast } = useToast();
  
  // Cast delle aziende al tipo corretto
  const companies = companiesData as unknown as Company[];

  // Stato per la ricerca e selezione
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Stato per il conteggio dei dipendenti per azienda
  const [employeeCounts, setEmployeeCounts] = useState<Record<string, number>>({});

  // Stato per il modal di importazione
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Stato per la selezione multipla
  const [selectionMode, setSelectionMode] = useState(false);

  // Handler per navigare alla pagina di creazione azienda
  const handleAddNewCompany = () => {
    navigate('/companies/create');
  };

  // Ottieni aziende filtrate
  const filteredCompanies = companies.filter(company => 
    company.ragione_sociale?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Gestione dell'ordinamento
  const [sortKey, setSortKey] = useState<string>('ragione_sociale');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');

  // Visibilità e ordine delle colonne con persistenza in localStorage
  const loadSavedHiddenColumns = () => {
    try {
      const saved = localStorage.getItem('companies-hidden-columns');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  const loadSavedColumnOrder = () => {
    try {
      const saved = localStorage.getItem('companies-column-order');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  };

  const [hiddenColumns, setHiddenColumns] = useState<string[]>(loadSavedHiddenColumns());
  const [columnOrder, setColumnOrder] = useState<Record<string, number>>(loadSavedColumnOrder());

  const handleSort = (key: string, direction: 'asc' | 'desc' | null) => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const handleColumnVisibilityChange = (newHiddenColumns: string[]) => {
    setHiddenColumns(newHiddenColumns);
    // Save to localStorage
    localStorage.setItem('companies-hidden-columns', JSON.stringify(newHiddenColumns));
  };

  const handleColumnOrderChange = (newColumnOrder: Record<string, number>) => {
    setColumnOrder(newColumnOrder);
    // Save to localStorage
    localStorage.setItem('companies-column-order', JSON.stringify(newColumnOrder));
  };

  // Add effect hooks to save preferences when they change
  useEffect(() => {
    // Save hidden columns to local storage whenever they change
    localStorage.setItem('companies-hidden-columns', JSON.stringify(hiddenColumns));
  }, [hiddenColumns]);

  useEffect(() => {
    // Save column order to local storage whenever it changes
    localStorage.setItem('companies-column-order', JSON.stringify(columnOrder));
  }, [columnOrder]);

  // Carica il conteggio dei dipendenti per ogni azienda
  useEffect(() => {
    const fetchEmployeeCounts = async () => {
      const counts: Record<string, number> = {};
      
      // Per ogni azienda, recupera i dipendenti e conta quanti ne ha
      for (const company of companies) {
        try {
          const employees = await getEmployeesByCompany(company.id);
          counts[company.id] = employees.length;
        } catch (error) {
          console.error(`Error fetching employees for company ${company.id}:`, error);
          counts[company.id] = 0;
        }
      }
      
      setEmployeeCounts(counts);
    };
    
    if (companies.length > 0) {
      fetchEmployeeCounts();
    }
  }, [companies]);

  // Headers per l'esportazione CSV
  const csvHeaders = {
    "Nome Azienda": "ragione_sociale",
    "Indirizzo": "sede_azienda",
    "Città": "citta",
    "Provincia": "provincia",
    "CAP": "cap",
    "P.IVA": "piva",
    "Codice Fiscale": "codice_fiscale",
    "Codice ATECO": "codice_ateco",
    "SDI": "sdi",
    "PEC": "pec",
    "IBAN": "iban",
    "Persona di Riferimento": "persona_riferimento",
    "Telefono": "telefono",
    "Email": "email",
    "Creato il": "created_at",
    "Aggiornato il": "updated_at"
  };

  // Definizione delle colonne - include TUTTE le proprietà dell'entità
  const columns = [
    ...(selectionMode ? [
      {
        key: 'select',
        label: '',
        sortable: false,
        width: 50,
        renderCell: (row: Company) => (
          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selectedCompanyIds.includes(row.id)}
              onChange={() => {
                setSelectedCompanyIds(prev => 
                  prev.includes(row.id) ? prev.filter(id => id !== row.id) : [...prev, row.id]
                );
              }}
              className="h-4 w-4 accent-blue-600"
            />
          </div>
        ),
        renderHeader: () => (
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={selectedCompanyIds.length === sortedCompanies.length && sortedCompanies.length > 0}
              onChange={() => {
                if (selectedCompanyIds.length === sortedCompanies.length) {
                  setSelectedCompanyIds([]);
                } else {
                  setSelectedCompanyIds(sortedCompanies.map(c => c.id));
                }
              }}
              className="h-4 w-4 accent-blue-600"
            />
          </div>
        )
      }
    ] : []),
    {
      key: 'actions',
      label: 'Azioni',
      sortable: false,
      width: 150,
      renderCell: (row: Company) => (
        <ActionButton
          actions={[
            { 
              label: 'Modifica', 
              icon: <Pencil className="h-4 w-4" />, 
              onClick: (e?: React.MouseEvent<Element>) => {
                if (e) e.stopPropagation();
                navigate(`/companies/${row.id}/edit`);
              },
              variant: 'default',
            },
            {
              label: 'Elimina',
              icon: <Trash2 className="h-4 w-4" />,
              onClick: (e?: React.MouseEvent<Element>) => {
                if (e) e.stopPropagation();
                handleDeleteCompany(row.id);
              },
              variant: 'danger',
            },
            {
              label: 'Esporta',
              icon: <Download className="h-4 w-4" />,
              onClick: (e?: React.MouseEvent<Element>) => {
                if (e) e.stopPropagation();
                exportToCsv([row], csvHeaders, `${row.ragione_sociale.replace(/\s+/g, '_')}.csv`);
              },
              variant: 'default',
            }
          ]}
          asPill={true}
        />
      )
    },
    {
      key: 'ragione_sociale',
      label: 'Nome Azienda',
      sortable: true,
      width: 300,
    },
    {
      key: 'sede_azienda',
      label: 'Indirizzo',
      sortable: true,
      width: 180,
    },
    {
      key: 'citta',
      label: 'Città',
      sortable: true,
      width: 120,
    },
    {
      key: 'provincia',
      label: 'Provincia',
      sortable: true,
      width: 100,
    },
    {
      key: 'cap',
      label: 'CAP',
      sortable: true,
      width: 90,
    },
    {
      key: 'num_dipendenti',
      label: 'Dipendenti',
      sortable: true,
      width: 120,
      renderCell: (row: Company) => (
        <div className="flex items-center">
          <span>{employeeCounts[row.id] || 0}</span>
        </div>
      ),
    },
    {
      key: 'piva',
      label: 'P.IVA',
      sortable: true,
      width: 120,
    },
    {
      key: 'codice_fiscale',
      label: 'Codice Fiscale',
      sortable: true,
      width: 130,
    },
    {
      key: 'codice_ateco',
      label: 'Codice ATECO',
      sortable: true,
      width: 130,
    },
    {
      key: 'sdi',
      label: 'SDI',
      sortable: true,
      width: 90,
    },
    {
      key: 'pec',
      label: 'PEC',
      sortable: true,
      width: 180,
    },
    {
      key: 'iban',
      label: 'IBAN',
      sortable: true,
      width: 180,
    },
    {
      key: 'persona_riferimento',
      label: 'Persona di Riferimento',
      sortable: true,
      width: 180,
    },
    {
      key: 'telefono',
      label: 'Telefono',
      sortable: true,
      width: 120,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      width: 180,
    },
    {
      key: 'created_at',
      label: 'Creato il',
      sortable: true,
      width: 150,
      renderCell: (row: Company) => new Date(row.created_at).toLocaleDateString('it-IT')
    },
    {
      key: 'updated_at',
      label: 'Aggiornato il',
      sortable: true,
      width: 150,
      renderCell: (row: Company) => new Date(row.updated_at).toLocaleDateString('it-IT')
    },
  ];

  // Funzione per il download del template CSV
  const handleDownloadTemplate = () => {
    const template = [{
      ragione_sociale: 'Azienda Esempio SRL',
      sede_azienda: 'Via Roma 123',
      citta: 'Milano',
      provincia: 'MI',
      cap: '20100',
      piva: '12345678901',
      codice_fiscale: 'XYZABC12D34E567F',
      codice_ateco: '12345',
      sdi: 'ABCDEF1',
      pec: 'info@aziendaesempio.it',
      iban: 'IT12A1234567890123456789012',
      persona_riferimento: 'Mario Rossi',
      telefono: '+39 123 456 7890',
      email: 'mario.rossi@aziendaesempio.it'
    }];
    
    exportToCsv(template, csvHeaders, 'template_aziende.csv');
  };

  // Funzione per l'eliminazione di un'azienda
  const handleDeleteCompany = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa azienda?')) {
      try {
        await deleteCompany(id);
        showToast({ message: 'Azienda eliminata con successo', type: 'success' });
        refreshCompanies();
      } catch (error) {
        console.error('Error deleting company:', error);
        showToast({ message: 'Errore durante l\'eliminazione dell\'azienda', type: 'error' });
      }
    }
  };

  // Hook personalizzato per ordinare i dati
  const useSort = (data: Company[], key: string, direction: 'asc' | 'desc' | null) => {
    return React.useMemo(() => {
      if (!direction) return data;
      
      return [...data].sort((a, b) => {
        // Handle null or undefined values
        const valueA = a[key as keyof Company];
        const valueB = b[key as keyof Company];
        
        if (valueA == null && valueB == null) return 0;
        if (valueA == null) return direction === 'asc' ? -1 : 1;
        if (valueB == null) return direction === 'asc' ? 1 : -1;
        
        // Convert to appropriate types for comparison
        const compareValueA = typeof valueA === 'string'
          ? valueA.toLowerCase()
          : valueA;
          
        const compareValueB = typeof valueB === 'string'
          ? valueB.toLowerCase()
          : valueB;
        
        // Compare values
        if (compareValueA < compareValueB) return direction === 'asc' ? -1 : 1;
        if (compareValueA > compareValueB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }, [data, key, direction]);
  };
  
  // State for selected company for deletion
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const sortedCompanies = useSort(filteredCompanies, sortKey, sortDirection);

  // Funzione per cambiare la modalità di visualizzazione
  const handleViewModeChange = (mode: 'table' | 'grid') => {
    setViewMode(mode);
    // Save to local storage
    saveViewMode('companies', mode);
  };

  // Opzioni per il dropdown Aggiungi
  const addOptions = [
    {
      label: 'Aggiungi azienda singola',
      icon: <Plus className="h-4 w-4" />,
      onClick: handleAddNewCompany
    },
    {
      label: 'Importa da CSV',
      icon: <Upload className="h-4 w-4" />,
      onClick: () => setIsImportModalOpen(true)
    },
    {
      label: 'Scarica template CSV',
      icon: <FileText className="h-4 w-4" />,
      onClick: handleDownloadTemplate
    }
  ];

  // Aggiungere la funzione handleDeleteSelected
  const handleDeleteSelected = async () => {
    if (selectedCompanyIds.length === 0) return;
    
    if (!window.confirm(`Sei sicuro di voler eliminare ${selectedCompanyIds.length} aziende selezionate?`)) return;
    
    try {
      // Elimina tutte le aziende selezionate in parallelo
      await Promise.all(
        selectedCompanyIds.map(id => deleteCompany(id))
      );
      
      showToast({
        message: `${selectedCompanyIds.length} aziende eliminate con successo`,
        type: 'success'
      });
      
      // Resetta la selezione e aggiorna la lista
      setSelectedCompanyIds([]);
      setSelectionMode(false);
      refreshCompanies();
    } catch (error) {
      console.error('Errore durante l\'eliminazione delle aziende:', error);
      showToast({
        message: `Errore durante l'eliminazione delle aziende: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        type: 'error'
      });
    }
  };

    return (
    <EntityListLayout
      title="Aziende"
      headerContent={
        <div className="flex flex-wrap items-center justify-between mb-4">
              <div>
            <p className="text-gray-500">Gestisci le aziende, visualizza i dettagli e crea nuove aziende.</p>
              </div>
          
          <div className="flex items-center space-x-3">
            <ViewModeToggle
              viewMode={viewMode}
              onChange={handleViewModeChange}
              gridLabel="Griglia"
              tableLabel="Tabella"
            />
            
            <AddEntityDropdown
              label="Aggiungi Azienda"
              options={addOptions}
              icon={<Plus className="h-4 w-4" />}
              variant="primary"
            />
          </div>
      </div>
      }
      searchBarContent={
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:items-center md:justify-between mb-6">
          <div className="w-full md:max-w-xs">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Cerca aziende..."
              onFilterClick={() => {}}
              filtersActive={false}
        />
      </div>
      
      <div className="flex items-center gap-2">
            <FilterPanel />
            
            <ColumnSelector
              columns={columns.map(col => ({
                key: col.key,
                label: col.label,
                required: col.key === 'actions' || col.key === 'ragione_sociale'
              }))}
              hiddenColumns={hiddenColumns}
              onChange={handleColumnVisibilityChange}
              onOrderChange={handleColumnOrderChange}
              columnOrder={columnOrder}
              buttonClassName="h-10"
            />

            <BatchEditButton
              selectionMode={selectionMode}
              onToggleSelectionMode={() => setSelectionMode(!selectionMode)}
              selectedCount={selectedCompanyIds.length}
              className="h-10"
              variant={selectionMode ? "primary" : "outline"}
              actions={[
                {
                  label: 'Elimina selezionate',
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: handleDeleteSelected,
                  variant: 'danger'
                },
                {
                  label: 'Esporta selezionate',
                  icon: <Download className="h-4 w-4" />,
                  onClick: () => {
                    const selectedCompanies = companies.filter(c => selectedCompanyIds.includes(c.id));
                    exportToCsv(selectedCompanies, csvHeaders, 'aziende_selezionate.csv');
                  },
                  variant: 'default'
                },
                {
                  label: 'Annulla selezione',
                  icon: <XCircle className="h-4 w-4" />,
                  onClick: () => {
                    setSelectedCompanyIds([]);
                    setSelectionMode(false);
                  },
                  variant: 'default'
                }
              ]}
            />
      </div>
    </div>
      }
    >
      {/* Menu di azioni dropdown per mobile */}
      <div className="mb-4 md:hidden">
        <Dropdown
          variant="outline"
          label="Altre azioni"
          className="w-full"
          actions={[
            {
              label: 'Importa da CSV',
              icon: <Upload className="h-4 w-4" />,
              onClick: () => setIsImportModalOpen(true)
            },
            {
              label: 'Scarica template CSV',
              icon: <Download className="h-4 w-4" />,
              onClick: handleDownloadTemplate
            },
            {
              label: 'Esporta tutto',
              icon: <Download className="h-4 w-4" />,
              onClick: () => exportToCsv(companies, csvHeaders, 'aziende.csv')
            }
          ]}
        />
      </div>
      
      {isImportModalOpen && (
        <CompanyImport 
          onClose={() => setIsImportModalOpen(false)}
          onImport={async (data, overwriteIds) => {
            try {
              // Process the imported companies
              for (const company of data) {
                try {
                  if (company.id) {
                    // Update existing company
                    await updateCompany(company.id, company);
                  } else {
                    // Create new company
                    await createCompany(company);
                  }
                } catch (err) {
                  console.error('Error processing company:', company, err);
                }
              }
              
              showToast({ message: 'Importazione completata', type: 'success' });
              setIsImportModalOpen(false);
              refreshCompanies();
            } catch (error) {
              showToast({ message: `Errore: ${error instanceof Error ? error.message : 'Sconosciuto'}`, type: 'error' });
            }
          }}
          existingCompanies={companies}
        />
      )}
      
      {/* Visualizzazione Tabella o Griglia in base alla modalità selezionata */}
      {viewMode === 'table' ? (
        <ResizableTable
          columns={columns}
          data={sortedCompanies}
          onSort={handleSort}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          hiddenColumns={hiddenColumns}
          onColumnOrderChange={handleColumnOrderChange}
          columnOrder={columnOrder}
          tableName="companies"
          onRowClick={(row) => {
            if (!selectionMode) {
              navigate(`/companies/${row.id}`);
            }
          }}
          rowClassName={(row) => selectionMode ? '' : 'cursor-pointer hover:bg-gray-50'}
          zebra={true}
          tableProps={{
            className: "border rounded-md overflow-hidden shadow-sm"
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sortedCompanies.map(company => (
            <div 
              key={company.id} 
              className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 flex flex-col relative"
              onClick={() => {
                if (!selectionMode) {
                  navigate(`/companies/${company.id}`);
                }
              }}
            >
              {/* Checkbox per la selezione quando in modalità selezione */}
              {selectionMode && (
                <div 
                  className={`absolute top-2 right-2 h-5 w-5 rounded border ${selectedCompanyIds.includes(company.id) ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'} z-10`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCompanyIds(prev => 
                      prev.includes(company.id) ? prev.filter(id => id !== company.id) : [...prev, company.id]
                    );
                  }}
                >
                  {selectedCompanyIds.includes(company.id) && (
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              )}
              
              {/* Header with icon */}
              <div className="flex items-center p-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                
                <div className="ml-3 flex-grow min-w-0">
                  <h3 className="text-base font-semibold text-gray-800 truncate">
                    {company.ragione_sociale}
                  </h3>
                </div>
              </div>
              
              {/* Company details */}
              <div className="px-4 pb-3 space-y-1.5 flex-grow">
                {company.citta && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="mr-2 h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{company.citta} {company.provincia ? `(${company.provincia})` : ''}</span>
                  </div>
                )}
                
                {company.piva && (
                  <div className="flex items-baseline text-sm">
                    <span className="flex items-center">
                      <FileText className="mr-2 h-3.5 w-3.5 text-gray-400" />
                      <span className="text-gray-500">P.IVA:</span>
                    </span>
                    <span className="ml-2 text-gray-700">{company.piva}</span>
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="mr-2 h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{employeeCounts[company.id] || 0} dipendenti</span>
                </div>
              </div>
              
              {/* Footer with action buttons */}
              <div className="px-4 py-3 bg-white border-t border-gray-200 flex justify-end items-center mt-auto" style={{position: 'relative', maxWidth: '100%'}}>
                <ActionButton
                  actions={[
                    { 
                      label: 'Modifica', 
                      icon: <Pencil className="h-4 w-4" />, 
                      onClick: (e) => {
                        if (e) e.stopPropagation();
                        navigate(`/companies/${company.id}/edit`);
                      },
                      variant: 'default',
                    },
                    { 
                      label: 'Elimina', 
                      icon: <Trash2 className="h-4 w-4" />, 
                      onClick: (e) => {
                        if (e) e.stopPropagation();
                        handleDeleteCompany(company.id);
                      },
                      variant: 'danger',
                    },
                    {
                      label: 'Visualizza', 
                      icon: <ChevronRight className="h-4 w-4" />, 
                      onClick: (e) => {
                        if (e) e.stopPropagation();
                        navigate(`/companies/${company.id}`);
                      },
                      variant: 'default',
                    }
                  ]}
                  asPill={true}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </EntityListLayout>
  );
};

export default CompaniesPage;