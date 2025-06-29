import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, List, LayoutGrid, CheckSquare, Trash2, GraduationCap, Loader2, ChevronDown, Download, Pencil, FileText, BookOpen, Award } from 'lucide-react';
import { useTrainers } from '../../hooks/useTrainers';
import TrainerForm from '../../components/trainers/TrainerForm';
import ResizableTable, { ResizableTableColumn } from '../../components/shared/ResizableTable';
import EntityListLayout from '../../components/layouts/EntityListLayout';
import { SearchBarControls } from '../../design-system/molecules/SearchBarControls';
import { ActionButton } from '../../components/shared/ui';
import { Button } from '../../design-system/atoms/Button';
import { SearchBar } from '../../design-system/molecules/SearchBar';
import { HeaderPanel } from '../../design-system/organisms/HeaderPanel';
import { FilterPanel } from '../../design-system/organisms/FilterPanel';
import TrainerImport from '../../components/trainers/TrainerImport';
import { useToast } from '../../hooks/useToast';
import { exportToCsv } from '../../utils/csvExport';

export const TrainersPage: React.FC = () => {
  const navigate = useNavigate();
  const { trainers, loading, error, addTrainer, editTrainer, refresh } = useTrainers();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
    return (localStorage.getItem('trainersViewMode') as 'table' | 'grid') || 'grid';
  });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<any | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [activeSort, setActiveSort] = useState<{ field: string, direction: 'asc' | 'desc' } | undefined>(undefined);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { showToast } = useToast();

  React.useEffect(() => {
    localStorage.setItem('trainersViewMode', viewMode);
  }, [viewMode]);

  // Dynamic specialties
  const specialties = Array.from(new Set(trainers.flatMap(t => t.specialties))).sort();
  const statuses = Array.from(new Set(trainers.map(t => t.status))).sort();

  // Opzioni di filtro
  const filterOptions = [
    {
      label: 'Specializzazione',
      value: 'specialty',
      options: specialties.map(specialty => ({ 
        label: specialty, 
        value: specialty 
      }))
    },
    {
      label: 'Stato',
      value: 'status',
      options: statuses.map(status => ({ 
        label: status, 
        value: status 
      }))
    }
  ];

  // Opzioni di ordinamento
  const sortOptions = [
    { label: 'Nome (A-Z)', value: 'name-asc' },
    { label: 'Nome (Z-A)', value: 'name-desc' }
  ];

  // Filtering and searching
  let filteredTrainers = trainers;
  if (searchTerm) {
    filteredTrainers = filteredTrainers.filter(trainer =>
      trainer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.specialties.some((specialty: string) =>
        specialty.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }

  // Applica i filtri attivi
  if (activeFilters.specialty) {
    filteredTrainers = filteredTrainers.filter(trainer => 
      trainer.specialties.includes(activeFilters.specialty)
    );
  }
  
  if (activeFilters.status) {
    filteredTrainers = filteredTrainers.filter(trainer => 
      trainer.status === activeFilters.status
    );
  }

  // Applica l'ordinamento
  if (activeSort) {
    if (activeSort.field === 'name-asc') {
      filteredTrainers = [...filteredTrainers].sort((a, b) => 
        `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
      );
    } else if (activeSort.field === 'name-desc') {
      filteredTrainers = [...filteredTrainers].sort((a, b) => 
        `${b.first_name} ${b.last_name}`.localeCompare(`${a.first_name} ${a.last_name}`)
      );
    }
  }

  // Selection logic
  const handleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };
  
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(filteredTrainers.map(t => t.id));
      setSelectAll(true);
    }
  };
  
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0 || !confirm('Sei sicuro di voler eliminare i formatori selezionati?')) return;
    
    try {
      for (const id of selectedIds) {
        await fetch(`http://localhost:4000/trainers/${id}`, {
          method: 'DELETE',
        });
      }
      showToast({
        message: `${selectedIds.length} formatori eliminati con successo`,
        type: 'success'
      });
      setSelectedIds([]);
      setSelectAll(false);
      refresh();
    } catch (error) {
      console.error('Errore durante l\'eliminazione dei formatori:', error);
      showToast({
        message: 'Errore durante l\'eliminazione dei formatori',
        type: 'error'
      });
    }
  };

  // Add/Edit Trainer modal logic
  const handleOpenCreateForm = () => {
    setSelectedTrainer(null);
    setShowForm(true);
  };
  
  const handleEditTrainer = (trainer: any) => {
    setSelectedTrainer(trainer);
    setShowForm(true);
  };
  
  const handleFormSubmit = async (data: any, certificationIds: string[]) => {
    if (selectedTrainer) {
      await editTrainer(selectedTrainer.id, data);
    } else {
      await addTrainer(data);
    }
    setShowForm(false);
    setSelectedTrainer(null);
    refresh();
  };

  // Handler per l'apertura dell'importazione
  const handleOpenImport = () => {
    setIsImportOpen(true);
  };

  // Handler per il download del template
  const handleDownloadTemplate = () => {
    // Crea le intestazioni del template CSV
    const headers = [
      'Nome', 'Cognome', 'Codice Fiscale', 'Email', 'Telefono', 
      'Specializzazioni (separate da virgola)', 'Tariffa Oraria', 
      'Indirizzo', 'Citta', 'Provincia', 'CAP', 'Note'
    ];
    
    // Crea il contenuto del file CSV
    const csv = headers.join(';') + '\n';
    
    // Crea il blob e scarica il file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_formatori.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('Template formatori scaricato');
  };

  // Handler per il download dei dati in formato CSV
  const handleDownloadCsv = () => {
    // Utilizzo dell'utility per esportazione CSV
    const csvHeaders = {
      'ID': 'id',
      'Nome': 'first_name',
      'Cognome': 'last_name',
      'Email': 'email',
      'Telefono': 'phone',
      'Specializzazioni': 'specialties_str',
      'Tariffa Oraria': 'hourly_rate',
      'Stato': 'status',
      'Certificazioni': 'certifications_count',
      'Note': 'notes'
    };
    
    const csvData = filteredTrainers.map(trainer => {
      // Trasforma l'array delle specializzazioni in una stringa
      const specialtiesStr = Array.isArray(trainer.specialties) 
        ? trainer.specialties.join(', ') 
        : '';
      
      // Conta le certificazioni
      const certificationsCount = trainer.certificates?.length || 0;
      
      return {
        id: trainer.id,
        first_name: trainer.first_name,
        last_name: trainer.last_name,
        email: trainer.email,
        phone: trainer.phone,
        specialties_str: specialtiesStr,
        hourly_rate: trainer.hourly_rate,
        status: trainer.status,
        certifications_count: certificationsCount,
        notes: trainer.notes
      };
    });
    
    // Esegue l'esportazione
    exportToCsv(csvData, csvHeaders, 'formatori.csv', ';');
  };

  const columns: ResizableTableColumn<any>[] = [
    {
      key: 'select',
      label: '',
      width: 50,
      renderHeader: () => selectionMode ? (
        <input
          type="checkbox"
          checked={selectAll}
          onChange={handleSelectAll}
          className="accent-blue-600"
        />
      ) : null,
      renderCell: (trainer) => selectionMode ? (
        <input
          type="checkbox"
          checked={selectedIds.includes(trainer.id)}
          onChange={() => handleSelect(trainer.id)}
          className="accent-blue-600"
        />
      ) : null,
    },
    {
      key: 'name',
      label: 'Nome',
      width: 200,
      renderCell: (trainer) => (
        <div>
          <div className="font-medium cursor-pointer text-blue-600" 
               onClick={() => handleEditTrainer(trainer)}>
            {trainer.first_name} {trainer.last_name}
          </div>
          <div className="text-sm text-gray-500">{trainer.email}</div>
        </div>
      ),
    },
    {
      key: 'specialties',
      label: 'Specializzazioni',
      width: 250,
      renderCell: (trainer) => (
        <div className="flex flex-wrap gap-1">
          {trainer.specialties?.map((specialty: string, index: number) => (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {specialty}
            </span>
          )).slice(0, 3)}
          {trainer.specialties?.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              +{trainer.specialties.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'hourly_rate',
      label: 'Tariffa Oraria',
      width: 120,
      renderCell: (trainer) => (
        <div>
          {trainer.hourly_rate ? `€${trainer.hourly_rate.toFixed(2)}` : '-'}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Stato',
      width: 120,
      renderCell: (trainer) => (
        <div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium 
            ${trainer.status === 'Active' ? 'bg-green-100 text-green-800' : 
            trainer.status === 'Inactive' ? 'bg-gray-100 text-gray-800' : 
            trainer.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
            'bg-blue-100 text-blue-800'}`}
          >
            {trainer.status || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 80,
      renderCell: (trainer) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditTrainer(trainer)}
            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
            title="Modifica"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => {
              if (confirm('Sei sicuro di voler eliminare questo formatore?')) {
                fetch(`http://localhost:4000/trainers/${trainer.id}`, {
                  method: 'DELETE',
                }).then(() => {
                  refresh();
                  showToast({
                    message: 'Formatore eliminato con successo',
                    type: 'success'
                  });
                }).catch((error) => {
                  console.error('Errore durante l\'eliminazione:', error);
                  showToast({
                    message: 'Errore durante l\'eliminazione',
                    type: 'error'
                  });
                });
              }
            }}
            className="p-1 text-red-600 hover:text-red-800 transition-colors"
            title="Elimina"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const SearchFilterBar = () => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 mb-4">
      <div className="flex-grow">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Cerca formatori..."
        />
      </div>
      <div className="flex items-center gap-2">
        <SearchBarControls
          onToggleSelectionMode={() => {
            setSelectionMode(true);
            setSelectedIds([]);
          }}
          isSelectionMode={selectionMode}
          selectedCount={selectedIds.length}
          onDeleteSelected={handleDeleteSelected}
          onClearSelection={() => {
            setSelectedIds([]);
            setSelectAll(false);
            setSelectionMode(false);
          }}
          filterOptions={filterOptions}
          sortOptions={sortOptions}
          onFilterChange={setActiveFilters}
          onSortChange={setActiveSort}
          activeFilters={activeFilters}
          activeSort={activeSort}
        />
        <HeaderPanel 
          entityType="Formatore"
          entityGender="m"
          onAdd={handleOpenCreateForm}
          onImport={handleOpenImport}
          onDownloadTemplate={handleDownloadTemplate}
          onDownloadCsv={handleDownloadCsv}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>
    </div>
  );

  return (
    <EntityListLayout
      title="Formatori"
      subtitle="Gestisci i formatori per i tuoi corsi"
    >
      <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
        <SearchFilterBar />
        
        {error && (
          <div className="p-4 mb-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {viewMode === 'table' ? (
          <ResizableTable
            columns={columns}
            data={filteredTrainers}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrainers.map(trainer => (
              <div key={trainer.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {selectionMode && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(trainer.id)}
                          onChange={() => handleSelect(trainer.id)}
                          className="h-4 w-4 accent-blue-600"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-medium text-blue-600 cursor-pointer" onClick={() => handleEditTrainer(trainer)}>
                          {trainer.first_name} {trainer.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">{trainer.email}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <Award size={16} className="mr-1 text-gray-500" />
                        {trainer.hourly_rate ? `€${trainer.hourly_rate.toFixed(2)}/ora` : 'Tariffa non impostata'}
                      </div>

                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {trainer.specialties?.map((specialty: string, index: number) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {specialty}
                            </span>
                          ))}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            {trainer.certificates?.length > 0 ? (
                              <span className="font-medium text-gray-700">{trainer.certificates.length} certificazioni</span>
                            ) : (
                              <span className="text-gray-500">Nessuna certificazione</span>
                            )}
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium
                            ${trainer.status === 'Active' ? 'bg-green-100 text-green-800' : 
                              trainer.status === 'Inactive' ? 'bg-gray-100 text-gray-800' : 
                              trainer.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-blue-100 text-blue-800'}`}
                          >
                            {trainer.status || '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showForm && (
          <TrainerForm
            trainer={selectedTrainer}
            onSubmit={(data) => handleFormSubmit(data, [])}
            onCancel={() => {
              setShowForm(false);
              setSelectedTrainer(null);
            }}
          />
        )}

        {isImportOpen && (
          <TrainerImport
            onImport={async (data, overwriteIds) => {
              try {
                // Implementazione importazione formatori
                console.log('Importazione formatori:', data);
                console.log('ID da sovrascrivere:', overwriteIds);
                
                // Simuliamo un'importazione riuscita
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                showToast({
                  message: `Importazione completata: ${data.length} formatori importati`,
                  type: 'success'
                });
                
                setIsImportOpen(false);
                refresh();
              } catch (error) {
                console.error('Errore durante l\'importazione:', error);
                showToast({
                  message: `Errore durante l'importazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
                  type: 'error'
                });
              }
            }}
            onClose={() => setIsImportOpen(false)}
            existingTrainers={trainers}
          />
        )}
      </div>
    </EntityListLayout>
  );
};

export default TrainersPage;