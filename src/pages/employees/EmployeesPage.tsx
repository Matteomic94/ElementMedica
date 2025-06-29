import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Users, FileText, Download, Upload, User, Building2, ChevronRight, XCircle } from 'lucide-react';
import { EmployeeForm } from '../../components/employees/EmployeeForm';
import EntityListLayout from '../../components/layouts/EntityListLayout';
import ResizableTable from '../../components/shared/ResizableTable';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../design-system/atoms/Button';
import { SearchBarControls } from '../../design-system/molecules/SearchBarControls';
import {
  ActionButton,
  ColumnSelector,
  AddEntityDropdown,
  BatchEditButton
} from '../../components/shared/ui';
import { ViewModeToggle } from '../../design-system/molecules/ViewModeToggle';
import { SelectionPills } from '../../design-system/molecules/SelectionPills';
import { HeaderPanel } from '../../design-system/organisms/HeaderPanel';
import { FilterPanel } from '../../design-system/organisms/FilterPanel';
import { Dropdown } from '../../design-system/molecules';
import EmployeeImport from '../../components/employees/EmployeeImport';
import { useToast } from '../../hooks/useToast';
import { exportToCsv } from '../../utils/csvExport';
import { saveViewMode } from '../../services/userPreferences';
import EntityCard from '../../components/shared/cards/EntityCard';

// Definizione del tipo Employee
interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  codice_fiscale: string;
  companyId: string;
  company_id?: string; // Per compatibilità con il form
  departmentId?: string;
  title?: string;
  company?: {
    id: string;
    ragione_sociale: string;
  };
  department?: {
    id: string;
    name: string;
  };
  photo_url?: string;
  created_at: string;
  updated_at?: string;
  birth_date?: string;
}

export const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyFilter = searchParams.get('company');
  const { showToast } = useToast();
  
  // States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [activeSort, setActiveSort] = useState<{ field: string, direction: 'asc' | 'desc' } | undefined>(undefined);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string>('last_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');
  
  // Visibilità e ordine delle colonne con persistenza in localStorage
  const loadSavedHiddenColumns = () => {
    try {
      const saved = localStorage.getItem('employees-hidden-columns');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  const loadSavedColumnOrder = () => {
    try {
      const saved = localStorage.getItem('employees-column-order');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  };

  const [hiddenColumns, setHiddenColumns] = useState<string[]>(loadSavedHiddenColumns());
  const [columnOrder, setColumnOrder] = useState<Record<string, number>>(loadSavedColumnOrder());

  const handleColumnVisibilityChange = (newHiddenColumns: string[]) => {
    // Update local state
    setHiddenColumns(newHiddenColumns);
    
    // Ensure it's saved to localStorage
    localStorage.setItem('employees-hidden-columns', JSON.stringify(newHiddenColumns));
  };

  const handleColumnOrderChange = (newColumnOrder: Record<string, number>) => {
    // Update local state
    setColumnOrder(newColumnOrder);
    
    // Ensure it's saved to localStorage
    localStorage.setItem('employees-column-order', JSON.stringify(newColumnOrder));
  };
  
  // Headers per l'esportazione CSV
  const csvHeaders = {
    "Nome": "first_name",
    "Cognome": "last_name",
    "Email": "email",
    "Telefono": "phone",
    "Codice Fiscale": "codice_fiscale",
    "Azienda": "company.ragione_sociale",
    "Dipartimento": "department.name",
    "Ruolo": "title",
    "Data di Nascita": "birth_date",
    "Creato il": "created_at",
  };
  
  // Opzioni di filtro
  const filterOptions = [
    {
      label: 'Azienda',
      value: 'company',
      options: companies.map(company => ({ 
        label: company.ragione_sociale, 
        value: company.id 
      }))
    }
  ];

  // Opzioni di ordinamento
  const sortOptions = [
    { label: 'Nome', value: 'firstName' },
    { label: 'Cognome', value: 'lastName' },
    { label: 'Email', value: 'email' },
    { label: 'Azienda', value: 'company' }
  ];
  
  // Fetch data
  useEffect(() => {
    fetchEmployees();
    fetchCompanies();
  }, []);

  useEffect(() => {
    localStorage.setItem('employeesViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    // Save hidden columns to local storage whenever they change
    localStorage.setItem('employees-hidden-columns', JSON.stringify(hiddenColumns));
  }, [hiddenColumns]);

  useEffect(() => {
    // Save column order to local storage whenever it changes
    localStorage.setItem('employees-column-order', JSON.stringify(columnOrder));
  }, [columnOrder]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/employees');
      const data = await response.json();
      setEmployees(data || []);
      setSelectedIds([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch('http://localhost:4000/companies');
      const data = await response.json();
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  // Handlers
  const handleOpenCreateForm = () => {
    navigate('/employees/create');
  };

  const handleEditEmployee = (employee: Employee) => {
    // Converti l'employee al formato compatibile con EmployeeForm
    const employeeForForm = {
      ...employee,
      company_id: employee.companyId,
    };
    setSelectedEmployee(employeeForForm);
    setShowForm(true);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await fetch(`http://localhost:4000/employees/${id}`, {
          method: 'DELETE',
        });
        fetchEmployees();
        showToast({
          message: 'Dipendente eliminato con successo',
          type: 'success'
        });
      } catch (error) {
        console.error('Error deleting employee:', error);
        showToast({
          message: 'Errore nell\'eliminazione del dipendente',
          type: 'error'
        });
      }
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    fetchEmployees();
  };

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
      setSelectedIds(filteredEmployees.map((e) => e.id));
      setSelectAll(true);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm('Are you sure you want to delete the selected employees?')) return;
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`http://localhost:4000/employees/${id}`, { method: 'DELETE' })
        )
      );
      setSelectedIds([]);
      fetchEmployees();
      showToast({
        message: `${selectedIds.length} dipendenti eliminati con successo`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting selected employees:', error);
      showToast({
        message: 'Errore nell\'eliminazione dei dipendenti selezionati',
        type: 'error'
      });
    }
  };

  // Filter and search
  let filteredEmployees = employees;

  // Apply company filter from URL
  if (companyFilter) {
    filteredEmployees = filteredEmployees.filter(
      (employee) => employee.companyId === companyFilter
    );
  }

  // Apply company filter from active filters
  if (activeFilters.company) {
    filteredEmployees = filteredEmployees.filter(
      (employee) => employee.companyId === activeFilters.company
    );
  }

  // Apply search
  if (searchTerm) {
    const lowercaseSearchTerm = searchTerm.toLowerCase();
    filteredEmployees = filteredEmployees.filter(
      (employee) =>
        `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(lowercaseSearchTerm) ||
        (employee.email || '').toLowerCase().includes(lowercaseSearchTerm) ||
        (employee.codice_fiscale || '').toLowerCase().includes(lowercaseSearchTerm)
    );
  }

  // Apply sort
  const handleSort = (key: string, direction: 'asc' | 'desc' | null) => {
    setSortKey(key);
    setSortDirection(direction);
  };

  // Definizione delle colonne
  const columns = [
    ...(selectionMode ? [
      {
        key: 'select',
        label: '',
        sortable: false,
        width: 50,
        renderCell: (row: Employee) => (
          <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selectedIds.includes(row.id)}
              onChange={() => handleSelect(row.id)}
              className="h-4 w-4 accent-blue-600"
            />
          </div>
        ),
        renderHeader: () => (
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
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
      renderCell: (row: Employee) => (
        <ActionButton
          actions={[
            {
              label: 'Modifica',
              icon: <Pencil className="h-4 w-4" />,
              onClick: (e?: React.MouseEvent<Element>) => {
                if (e) e.stopPropagation();
                navigate(`/employees/${row.id}/edit`);
              },
              variant: 'default',
            },
            {
              label: 'Elimina',
              icon: <Trash2 className="h-4 w-4" />,
              onClick: (e?: React.MouseEvent<Element>) => {
                if (e) e.stopPropagation();
                handleDeleteEmployee(row.id);
              },
              variant: 'danger',
            },
            {
              label: 'Esporta',
              icon: <Download className="h-4 w-4" />,
              onClick: (e?: React.MouseEvent<Element>) => {
                if (e) e.stopPropagation();
                exportToCsv([row], csvHeaders, `${row.last_name}_${row.first_name}.csv`);
              },
              variant: 'default',
            },
          ]}
          asPill={true}
        />
      )
    },
    {
      key: 'last_name',
      label: 'Cognome',
      sortable: true,
      width: 120,
    },
    {
      key: 'first_name',
      label: 'Nome',
      sortable: true,
      width: 130,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      width: 180,
    },
    {
      key: 'phone',
      label: 'Telefono',
      sortable: true,
      width: 150,
    },
    { 
      key: 'company', 
      label: 'Azienda', 
      sortable: true,
      width: 250,
      renderCell: (row: Employee) => row.company?.ragione_sociale || 'N/A',
    },
    {
      key: 'department',
      label: 'Dipartimento',
      sortable: true,
      width: 150,
      renderCell: (row: Employee) => row.department?.name || 'N/A',
    },
    {
      key: 'codice_fiscale',
      label: 'Codice Fiscale',
      sortable: true,
      width: 150,
    },
    {
      key: 'birth_date',
      label: 'Data di Nascita',
      sortable: true,
      width: 120,
      renderCell: (row: Employee) => {
        if (!row.birth_date) return '';
        return new Date(row.birth_date).toLocaleDateString('it-IT');
      }
    },
    {
      key: 'created_at',
      label: 'Creato il',
      sortable: true,
      width: 120,
      renderCell: (row: Employee) => {
        if (!row.created_at) return '';
        return new Date(row.created_at).toLocaleDateString('it-IT');
      }
    },
    {
      key: 'title',
      label: 'Ruolo',
      sortable: true,
      width: 150,
    },
  ];

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0;
    
    let aValue, bValue;
    
    if (sortKey === 'company') {
      aValue = a.company?.ragione_sociale;
      bValue = b.company?.ragione_sociale;
    } else if (sortKey === 'department') {
      aValue = a.department?.name;
      bValue = b.department?.name;
    } else {
      aValue = a[sortKey as keyof Employee];
      bValue = b[sortKey as keyof Employee];
    }
    
    if (!aValue && !bValue) return 0;
    if (!aValue) return sortDirection === 'asc' ? 1 : -1;
    if (!bValue) return sortDirection === 'asc' ? -1 : 1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    return sortDirection === 'asc'
      ? (aValue > bValue ? 1 : -1)
      : (aValue > bValue ? -1 : 1);
  });

  // Handler per l'apertura dell'importazione
  const handleOpenImport = () => {
    setIsImportOpen(true);
  };

  // Handler per il download del template
  const handleDownloadTemplate = () => {
    // Crea le intestazioni del template CSV
    const headers = Object.keys(csvHeaders).join(';');
    const csv = headers + '\n';
    
    // Crea il blob e scarica il file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_dipendenti.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handler per il download dei dati in formato CSV
  const handleDownloadCsv = () => {
    exportToCsv(employees, csvHeaders, 'employees.csv');
  };

  // Update view mode with persistence
  const handleViewModeChange = (mode: 'table' | 'grid') => {
    setViewMode(mode);
    // Save to both localStorage and backend
    saveViewMode('employees', mode).catch(() => {
      // Silent fallback to localStorage if API fails
    });
  };

  // Opzioni per il dropdown Aggiungi
  const addOptions = [
    {
      label: 'Aggiungi dipendente',
      icon: <Plus className="h-4 w-4" />,
      onClick: handleOpenCreateForm
    },
    {
      label: 'Importa da CSV',
      icon: <Upload className="h-4 w-4" />,
      onClick: handleOpenImport
    },
    {
      label: 'Scarica template CSV',
      icon: <FileText className="h-4 w-4" />,
      onClick: handleDownloadTemplate
    }
  ];

  return (
    <div>
      <EntityListLayout title="Dipendenti">
        <div className="flex flex-wrap items-center justify-between mb-4">
          <div>
            <p className="text-gray-500">Gestisci i dipendenti, visualizza i dettagli e crea nuovi dipendenti.</p>
        </div>
          
          <div className="flex items-center space-x-3">
            <ViewModeToggle
              viewMode={viewMode}
              onChange={handleViewModeChange}
              gridLabel="Griglia"
              tableLabel="Tabella"
              className="h-10"
            />
            
            <AddEntityDropdown
              label="Aggiungi Dipendente"
              options={addOptions}
              icon={<Plus className="h-4 w-4" />}
              variant="primary"
            />
        </div>
                  </div>
        
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
                onClick: handleOpenImport
              },
              {
                label: 'Scarica template CSV',
                icon: <Download className="h-4 w-4" />,
                onClick: handleDownloadTemplate
              },
              {
                label: 'Esporta tutto',
                icon: <Download className="h-4 w-4" />,
                onClick: handleDownloadCsv
                        }
                      ]}
                    />
                </div>

        {/* Barra di ricerca e filtri */}
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:items-center md:justify-between mb-6">
          <div className="w-full md:max-w-xs">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Cerca dipendenti..."
              className="h-10"
            />
                  </div>
          
          <div className="flex items-center gap-2">
            <FilterPanel />
            
            <ColumnSelector
              columns={columns.map(col => ({
                key: col.key,
                label: col.label,
                required: col.key === 'actions' || col.key === 'last_name' || col.key === 'first_name'
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
              selectedCount={selectedIds.length}
              className="h-10"
              variant={selectionMode ? "primary" : "outline"}
              actions={[
                {
                  label: 'Elimina selezionati',
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: handleDeleteSelected,
                  variant: 'danger'
                },
                {
                  label: 'Esporta selezionati',
                  icon: <Download className="h-4 w-4" />,
                  onClick: () => {
                    const selectedEmployees = employees.filter(e => selectedIds.includes(e.id));
                    exportToCsv(selectedEmployees, csvHeaders, 'dipendenti_selezionati.csv');
                  },
                  variant: 'default'
                },
                {
                  label: 'Annulla selezione',
                  icon: <XCircle className="h-4 w-4" />,
                  onClick: () => {
                    setSelectedIds([]);
                    setSelectionMode(false);
                  },
                  variant: 'default'
                }
              ]}
            />
            
            {companyFilter && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/employees')}
                className="h-10"
              >
                Rimuovi filtro azienda
              </Button>
            )}
          </div>
        </div>
        
        {employees.length === 0 && !loading ? (
          <div className="text-center my-8">
            <p className="text-gray-500 mb-4">Non ci sono dipendenti disponibili.</p>
            <Button 
              variant="primary" 
              onClick={handleOpenCreateForm}
              className="inline-flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Aggiungi dipendente
          </Button>
        </div>
        ) : (
          <div className="mb-6">
          {viewMode === 'table' ? (
        <ResizableTable
          columns={columns}
              data={sortedEmployees}
              onSort={handleSort}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onRowClick={(row) => {
                if (!selectionMode) {
                  navigate(`/employees/${row.id}`);
                }
              }}
              rowClassName={(row) => selectionMode ? '' : 'cursor-pointer hover:bg-gray-50'}
              hiddenColumns={hiddenColumns}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              onColumnOrderChange={handleColumnOrderChange}
              columnOrder={columnOrder}
              tableName="employees"
              tableProps={{
                className: "border rounded-md overflow-hidden shadow-sm"
              }}
        />
      ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {sortedEmployees.map(employee => (
            <div 
              key={employee.id} 
              className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 flex flex-col relative"
              onClick={() => {
                if (!selectionMode) {
                  navigate(`/employees/${employee.id}`);
                }
              }}>
              
              {/* Checkbox di selezione quando in modalità selezione */}
              {selectionMode && (
                <div 
                  className={`absolute top-2 right-2 h-5 w-5 rounded border ${
                    selectedIds.includes(employee.id) ? 'bg-blue-500 border-blue-600' : 'bg-white border-gray-300'
                  } flex items-center justify-center z-10`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(employee.id);
                  }}
                >
                  {selectedIds.includes(employee.id) && (
                    <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                  )}
                </div>
              )}
              
              {/* Header with icon */}
              <div className="flex items-center p-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                
                <div className="ml-3 flex-grow min-w-0">
                  <h3 className="text-base font-semibold text-gray-800 truncate">
                  {employee.first_name} {employee.last_name}
                </h3>
                  <div className="text-sm text-gray-500 truncate">
                    {employee.email}
              </div>
                </div>
              </div>
              
              {/* Employee details */}
              <div className="px-4 pb-3 space-y-1.5 flex-grow">
                {employee.codice_fiscale && (
                  <div className="flex items-baseline text-sm">
                    <span className="flex items-center">
                      <FileText className="mr-2 h-3.5 w-3.5 text-gray-400" />
                      <span className="text-gray-500">Cod. Fiscale:</span>
                    </span>
                    <span className="ml-2 text-gray-700 truncate">{employee.codice_fiscale}</span>
                  </div>
                )}
                
                {employee.company && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Building2 className="mr-2 h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{employee.company.ragione_sociale}</span>
                  </div>
                )}
                
                {employee.department && (
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText className="mr-2 h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{employee.department.name}</span>
                  </div>
                )}
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
                        navigate(`/employees/${employee.id}/edit`);
                      },
                      variant: 'default',
                    },
                    {
                      label: 'Elimina',
                      icon: <Trash2 className="h-4 w-4" />,
                      onClick: (e) => {
                        if (e) e.stopPropagation();
                        handleDeleteEmployee(employee.id);
                      },
                      variant: 'danger',
                    },
                    {
                      label: 'Visualizza', 
                      icon: <ChevronRight className="h-4 w-4" />, 
                      onClick: (e) => {
                        if (e) e.stopPropagation();
                        navigate(`/employees/${employee.id}`);
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
        </div>
      )}

      {isImportOpen && (
        <EmployeeImport
          onClose={() => setIsImportOpen(false)}
          onImport={async (data, overwriteIds) => {
            try {
              // Process the imported employees
              const importResults = {
                created: 0,
                updated: 0,
                failed: 0
              };
              
              for (const employee of data) {
                try {
                  if (employee._id) {
                    // Update existing employee
                    await fetch(`http://localhost:4000/employees/${employee._id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(employee),
                      });
                    importResults.updated++;
                  } else {
                    // Create new employee
                    await fetch('http://localhost:4000/employees', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(employee),
                    });
                    importResults.created++;
                  }
                } catch (err) {
                  console.error('Error processing employee:', employee, err);
                  importResults.failed++;
                }
              }
              
                showToast({
                message: `Importazione completata: ${importResults.created} dipendenti creati, ${importResults.updated} aggiornati, ${importResults.failed} falliti`,
                type: importResults.failed > 0 ? 'warning' : 'success'
              });
              
              // Refresh data after import
              fetchEmployees();
              
              // Close the import modal
              setIsImportOpen(false);
            } catch (error) {
              console.error('Error during import:', error);
              showToast({
                message: `Errore durante l'importazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
                type: 'error'
              });
            }
          }}
          existingEmployees={employees}
          existingCompanies={companies}
        />
      )}

        {showForm && selectedEmployee && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-screen overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Modifica Dipendente</h2>
              <EmployeeForm
                employee={selectedEmployee}
                onSubmit={handleFormSubmit}
                onCancel={() => setShowForm(false)}
                companies={companies}
              />
            </div>
          </div>
      )}
    </EntityListLayout>
    </div>
  );
}; 

export default EmployeesPage;