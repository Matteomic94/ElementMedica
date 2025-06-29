import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Filter, Search, Download, FileText, ChevronRight, PenSquare, Upload, XCircle } from 'lucide-react';
import EntityListLayout from '../../components/layouts/EntityListLayout';
import ResizableTable from '../../components/shared/ResizableTable';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Button, 
  ActionButton,
  ColumnSelector,
  AddEntityDropdown,
  BatchEditButton
} from '../../components/shared/ui';
import { ViewModeToggle } from '../../design-system/molecules/ViewModeToggle';
import { HeaderPanel } from '../../design-system/organisms/HeaderPanel';
import { FilterPanel } from '../../design-system/organisms/FilterPanel';
import { Dropdown } from '../../design-system/molecules';
import type { Course } from '../../types/courses';
import { CourseCreate } from '../../services/courses';
import CourseImport from '../../components/courses/CourseImport';
import { useToast } from '../../hooks/useToast';
import { exportToCsv } from '../../utils/csvExport';
import { createCourse, updateCourse, getCourses, deleteCourse } from '../../services/courses';
import EntityCard from '../../components/shared/cards/EntityCard';

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // States
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [activeSort, setActiveSort] = useState<{ field: string, direction: 'asc' | 'desc' } | undefined>(undefined);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(() => {
    return (localStorage.getItem('coursesViewMode') as 'table' | 'grid') || 'table';
  });
  
  // Visibilità e ordine delle colonne con persistenza in localStorage
  const loadSavedHiddenColumns = () => {
    try {
      const saved = localStorage.getItem('courses-hidden-columns');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  const loadSavedColumnOrder = () => {
    try {
      const saved = localStorage.getItem('courses-column-order');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  };

  const [hiddenColumns, setHiddenColumns] = useState<string[]>(loadSavedHiddenColumns());
  const [columnOrder, setColumnOrder] = useState<Record<string, number>>(loadSavedColumnOrder());

  const handleColumnVisibilityChange = (newHiddenColumns: string[]) => {
    setHiddenColumns(newHiddenColumns);
    localStorage.setItem('courses-hidden-columns', JSON.stringify(newHiddenColumns));
  };

  const handleColumnOrderChange = (newColumnOrder: Record<string, number>) => {
    setColumnOrder(newColumnOrder);
    localStorage.setItem('courses-column-order', JSON.stringify(newColumnOrder));
  };
  
  // Opzioni di filtro
  const filterOptions = [
    {
      label: 'Categoria',
      value: 'category',
      options: Array.from(new Set(courses.map(c => c.category || ''))).filter(Boolean).map(category => ({
        label: category,
        value: category
      }))
    },
    {
      label: 'Durata',
      value: 'duration',
      options: [
        { label: '< 4 ore', value: 'short' },
        { label: '4-8 ore', value: 'medium' },
        { label: '> 8 ore', value: 'long' }
      ]
    }
  ];

  // Opzioni di ordinamento
  const sortOptions = [
    { label: 'Titolo (A-Z)', value: 'title-asc' },
    { label: 'Titolo (Z-A)', value: 'title-desc' },
    { label: 'Durata (crescente)', value: 'duration-asc' },
    { label: 'Durata (decrescente)', value: 'duration-desc' }
  ];
  
  // Fetch data
  useEffect(() => {
    fetchCourses();
    localStorage.setItem('coursesViewMode', viewMode);
  }, [viewMode]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses();
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      showToast({
        message: `Errore durante il caricamento dei corsi: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleOpenCreateForm = () => {
    navigate('/courses/create');
  };

  const handleEditCourse = (course: Course) => {
    navigate(`/courses/${course.id}/edit`);
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo corso?')) {
      try {
        await deleteCourse(id);
        showToast({
          message: 'Corso eliminato con successo',
          type: 'success'
        });
        fetchCourses();
      } catch (error) {
        console.error('Errore durante l\'eliminazione del corso:', error);
        showToast({
          message: `Errore durante l'eliminazione del corso: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
          type: 'error'
        });
      }
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(filteredCourses.map(c => c.id));
      setSelectAll(true);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Sei sicuro di voler eliminare ${selectedIds.length} corsi selezionati?`)) return;
    
    try {
      await Promise.all(
        selectedIds.map(id => deleteCourse(id))
      );
      showToast({
        message: `${selectedIds.length} corsi eliminati con successo`,
        type: 'success'
      });
      setSelectedIds([]);
      setSelectionMode(false);
      fetchCourses();
    } catch (error) {
      console.error('Errore durante l\'eliminazione dei corsi:', error);
      showToast({
        message: `Errore durante l'eliminazione dei corsi: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        type: 'error'
      });
    }
  };

  // Filter and search
  let filteredCourses = courses;

  // Apply category filter
  if (activeFilters.category) {
    filteredCourses = filteredCourses.filter(
      course => course.category === activeFilters.category
    );
  }

  // Apply duration filter
  if (activeFilters.duration) {
    filteredCourses = filteredCourses.filter(course => {
      const duration = typeof course.duration === 'string' ? parseInt(course.duration, 10) : Number(course.duration || 0);
      if (activeFilters.duration === 'short') return duration < 4;
      if (activeFilters.duration === 'medium') return duration >= 4 && duration <= 8;
      if (activeFilters.duration === 'long') return duration > 8;
      return true;
    });
  }

  // Apply search
  if (searchTerm) {
    const lowercaseSearchTerm = searchTerm.toLowerCase();
    filteredCourses = filteredCourses.filter(
      course => 
        (course.title || '').toLowerCase().includes(lowercaseSearchTerm) || 
        (course.description || '').toLowerCase().includes(lowercaseSearchTerm) ||
        (course.category || '').toLowerCase().includes(lowercaseSearchTerm) ||
        (course.code || '').toLowerCase().includes(lowercaseSearchTerm)
    );
  }

  // Apply sort
  const handleSort = (key: string, direction: 'asc' | 'desc' | null) => {
    if (key === 'title') {
      key = 'title';
    }
    setSortKey(key);
    setSortDirection(direction);
  };

  const [sortKey, setSortKey] = useState<string>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');

  const sortedCourses = React.useMemo(() => {
    if (!sortDirection) return filteredCourses;
    
    return [...filteredCourses].sort((a, b) => {
      const valueA = a[sortKey as keyof Course];
      const valueB = b[sortKey as keyof Course];
      
      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return sortDirection === 'asc' ? -1 : 1;
      if (valueB == null) return sortDirection === 'asc' ? 1 : -1;
      
      const compareValueA = typeof valueA === 'string' ? valueA.toLowerCase() : valueA;
      const compareValueB = typeof valueB === 'string' ? valueB.toLowerCase() : valueB;
      
      if (compareValueA < compareValueB) return sortDirection === 'asc' ? -1 : 1;
      if (compareValueA > compareValueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCourses, sortKey, sortDirection]);

  // Definizione delle intestazioni CSV per l'esportazione
  const csvHeaders = {
    'title': 'Corso',
    'code': 'Codice',
    'category': 'Categoria',
    'duration': 'DurataCorso',
    'validityYears': 'AnniValidita',
    'renewalDuration': 'DurataCorsoAggiornamento',
    'price': 'EuroPersona',
    'certifications': 'Certificazioni',
    'maxPeople': 'MaxPersone',
    'regulation': 'Normativa',
    'contents': 'Contenuti',
    'description': 'Descrizione'
  };
  
  // Handler per il download del template CSV
  const handleDownloadTemplate = () => {
    const templateData = [{
      'Corso': 'Nome del corso',
      'Codice': 'ABC123',
      'Categoria': 'Categoria corso',
      'DurataCorso': '8',
      'AnniValidita': '5',
      'DurataCorsoAggiornamento': '4',
      'EuroPersona': '150',
      'Certificazioni': 'Tipo certificazione',
      'MaxPersone': '20',
      'Normativa': 'Riferimento normativo',
      'Contenuti': 'Descrizione contenuti',
      'Descrizione': 'Descrizione dettagliata'
    }];
    
    // Intestazioni per il template sono le chiavi dell'oggetto templateData[0]
    const templateHeaders = Object.keys(templateData[0]).reduce((obj, key) => {
      obj[key] = key;
      return obj;
    }, {} as Record<string, string>);
    
    exportToCsv(templateData, templateHeaders, 'template_corsi.csv', ';');
  };
  
  // Handler per l'apertura del modale di importazione
  const handleOpenImport = () => {
    setIsImportOpen(true);
  };

  // Handler per il download dei dati in formato CSV
  const handleDownloadCsv = () => {
    // Prepara i dati per l'esportazione
    const csvData = filteredCourses.map(course => ({
      id: course.id,
      title: course.title || '',
      description: course.description || '',
      category: course.category || '',
      duration: course.duration || 0,
      price: course.price || 0,
      code: course.code || ''
    }));

    // Esegue l'esportazione
    exportToCsv(csvData, csvHeaders, 'corsi.csv', ';');
  };

  // Columns for table view
  const columns = [
    ...(selectionMode ? [
      {
        key: 'select',
        label: '',
        sortable: false,
        width: 50,
        renderCell: (row: Course) => (
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
      renderCell: (row: Course) => {
        return (
          <ActionButton
            actions={[
              { 
                label: 'Modifica', 
                icon: <Pencil className="h-4 w-4" />, 
                onClick: (e?: React.MouseEvent<Element>) => {
                  if (e) e.stopPropagation();
                  navigate(`/courses/${row.id}/edit`);
                },
                variant: 'default',
              },
              {
                label: 'Elimina',
                icon: <Trash2 className="h-4 w-4" />,
                onClick: (e?: React.MouseEvent<Element>) => {
                  if (e) e.stopPropagation();
                  handleDeleteCourse(row.id);
                },
                variant: 'danger',
              },
              {
                label: 'Esporta',
                icon: <Download className="h-4 w-4" />,
                onClick: (e?: React.MouseEvent<Element>) => {
                  if (e) e.stopPropagation();
                  const csvHeaders = {
                    'ID': 'id',
                    'Titolo': 'title',
                    'Descrizione': 'description',
                    'Categoria': 'category',
                    'Durata (ore)': 'duration',
                    'Prezzo': 'price',
                    'Codice': 'code'
                  };
                  exportToCsv([row], csvHeaders, `${row.title.replace(/\s+/g, '_')}.csv`);
                },
                variant: 'default',
              }
            ]}
            asPill={true}
            className="h-8"
          />
        );
      }
    },
    {
      key: 'title',
      label: 'Titolo',
      sortable: true,
      width: 250,
      renderCell: (course: Course) => (
        <div className="max-w-full">
          <div className="font-medium line-clamp-2 whitespace-normal" title={course.title}>
            {course.title}
          </div>
        </div>
      ),
    },
    {
      key: 'code',
      label: 'Codice',
      sortable: true,
      width: 120,
      renderCell: (course: Course) => (
        <div>
          {course.code ? (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
              {course.code}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Categoria',
      sortable: true,
      width: 150,
      renderCell: (course: Course) => (
        <div>
          {course.category ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {course.category}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'duration',
      label: 'Durata',
      sortable: true,
      width: 100,
      renderCell: (course: Course) => (
        <div>{course.duration ? `${course.duration} ore` : '-'}</div>
      ),
    },
    {
      key: 'validityYears',
      label: 'Validità',
      sortable: true,
      width: 100,
      renderCell: (course: Course) => (
        <div>{course.validityYears ? `${course.validityYears} anni` : '-'}</div>
      ),
    },
    {
      key: 'renewalDuration',
      label: 'Durata Agg.',
      sortable: true,
      width: 120,
      renderCell: (course: Course) => (
        <div>{course.renewalDuration ? `${course.renewalDuration} ore` : '-'}</div>
      ),
    },
    {
      key: 'pricePerPerson',
      label: 'Prezzo/Persona',
      sortable: true,
      width: 140,
      renderCell: (course: Course) => (
        <div>{course.pricePerPerson ? `€${Number(course.pricePerPerson).toFixed(2)}` : '-'}</div>
      ),
    },
    {
      key: 'maxPeople',
      label: 'Max Persone',
      sortable: true,
      width: 130,
      renderCell: (course: Course) => (
        <div>{course.maxPeople || '-'}</div>
      ),
    },
    {
      key: 'certifications',
      label: 'Certificazioni',
      sortable: true,
      width: 160,
      renderCell: (course: Course) => (
        <div className="truncate" title={course.certifications || ''}>
          {course.certifications || '-'}
        </div>
      ),
    },
    {
      key: 'regulation',
      label: 'Normativa',
      sortable: true,
      width: 160,
      renderCell: (course: Course) => (
        <div className="truncate" title={course.regulation || ''}>
          {course.regulation || '-'}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Descrizione',
      sortable: true,
      width: 300,
      renderCell: (course: Course) => (
        <div className="truncate" title={course.description || ''}>
          {course.description || '-'}
        </div>
      ),
    },
    {
      key: 'contents',
      label: 'Contenuti',
      sortable: true,
      width: 300,
      renderCell: (course: Course) => (
        <div className="truncate" title={course.contents || ''}>
          {course.contents || '-'}
        </div>
      ),
    },
  ];

  // Opzioni per il dropdown Aggiungi
  const addOptions = [
    {
      label: 'Aggiungi corso singolo',
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
    <EntityListLayout 
      title="Corsi" 
      subtitle="Gestisci i corsi di formazione"
      headerContent={
        <div className="flex flex-wrap items-center justify-between mb-4">
          <div>
            <p className="text-gray-500">Gestisci i corsi, visualizza i dettagli e crea nuovi corsi.</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <ViewModeToggle
              viewMode={viewMode}
              onChange={(mode) => setViewMode(mode)}
              gridLabel="Griglia"
              tableLabel="Tabella"
            />
            
            <AddEntityDropdown
              label="Aggiungi Corso"
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
              placeholder="Cerca corsi..."
              className="h-10"
              onFilterClick={() => {}} 
              filtersActive={Object.keys(activeFilters).length > 0}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <FilterPanel 
              filterOptions={filterOptions}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
              sortOptions={[]}
              activeSort={activeSort}
              onSortChange={setActiveSort}
            />
            
            <ColumnSelector
              columns={columns.map(col => ({
                key: col.key,
                label: col.label,
                required: col.key === 'actions' || col.key === 'title'
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
                    const selectedCourses = courses.filter(c => selectedIds.includes(c.id));
                    exportToCsv(selectedCourses, csvHeaders, 'corsi_selezionati.csv', ';');
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
          </div>
        </div>
      }
    >
      <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
        {/* Table view */}
        {viewMode === 'table' ? (
          <ResizableTable
            columns={columns}
            data={sortedCourses}
            onSort={handleSort}
            sortKey={sortKey}
            sortDirection={sortDirection}
            hiddenColumns={hiddenColumns}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            onColumnOrderChange={handleColumnOrderChange}
            columnOrder={columnOrder}
            tableName="courses"
            onRowClick={(row) => {
              if (!selectionMode) {
                navigate(`/courses/${row.id}`);
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
            {sortedCourses.map(course => (
              <div 
                key={course.id} 
                className="bg-white rounded-lg shadow overflow-hidden relative flex flex-col h-full cursor-pointer hover:shadow-md transition-all duration-200" 
                onClick={() => {
                  if (!selectionMode) {
                    navigate(`/courses/${course.id}`);
                  }
                }}
              >
                {/* Checkbox in alto a destra quando in modalità selezione */}
                {selectionMode && (
                  <div 
                    className={`absolute top-2 right-2 h-5 w-5 rounded border ${
                      selectedIds.includes(course.id) ? 'bg-blue-500 border-blue-600' : 'bg-white border-gray-300'
                    } flex items-center justify-center z-10`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(course.id);
                    }}
                  >
                    {selectedIds.includes(course.id) && (
                      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"></path>
                      </svg>
                    )}
                  </div>
                )}
                
                {/* Header with icon */}
                <div className="flex items-center p-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  
                  <div className="ml-3 flex-grow min-w-0">
                    <h3 className="text-base font-semibold text-gray-800 line-clamp-2 whitespace-normal">
                      {course.title}
                    </h3>
                    {course.category && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {course.category}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {course.code && (
                    <div className="ml-2">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {course.code}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Course details */}
                <div className="px-4 pb-3 space-y-1.5 flex-grow">
                  {course.duration && (
                    <div className="flex items-baseline text-sm">
                      <span className="flex items-center">
                        <FileText className="mr-2 h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-500">Durata:</span>
                      </span>
                      <span className="ml-2 text-gray-700">{course.duration} ore</span>
                    </div>
                  )}
                  
                  {course.validityYears && (
                    <div className="flex items-baseline text-sm">
                      <span className="flex items-center">
                        <FileText className="mr-2 h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-500">Validità:</span>
                      </span>
                      <span className="ml-2 text-gray-700">{course.validityYears} anni</span>
                    </div>
                  )}
                  
                  {course.pricePerPerson && Number(course.pricePerPerson) > 0 && (
                    <div className="flex items-baseline text-sm">
                      <span className="flex items-center">
                        <FileText className="mr-2 h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-500">Prezzo:</span>
                      </span>
                      <span className="ml-2 text-gray-700">€{Number(course.pricePerPerson).toFixed(2)}</span>
                    </div>
                  )}
                  
                  {course.maxPeople && Number(course.maxPeople) > 0 && (
                    <div className="flex items-baseline text-sm">
                      <span className="flex items-center">
                        <FileText className="mr-2 h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-500">Max:</span>
                      </span>
                      <span className="ml-2 text-gray-700">{course.maxPeople} persone</span>
                    </div>
                  )}
                  
                  {course.description && (
                    <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {course.description}
                    </div>
                  )}
                </div>
                
                {/* Footer con pulsanti di azione */}
                <div className="px-4 py-3 bg-white border-t border-gray-200 flex justify-end items-center mt-auto" style={{position: 'relative', maxWidth: '100%'}}>
                  <ActionButton
                    actions={[
                      { 
                        label: 'Modifica', 
                        icon: <Pencil className="h-4 w-4" />, 
                        onClick: (e) => {
                          if (e) e.stopPropagation();
                          navigate(`/courses/${course.id}/edit`);
                        },
                        variant: 'default',
                      },
                      { 
                        label: 'Elimina', 
                        icon: <Trash2 className="h-4 w-4" />, 
                        onClick: (e) => {
                          if (e) e.stopPropagation();
                          handleDeleteCourse(course.id);
                        },
                        variant: 'danger',
                      },
                      {
                        label: 'Esporta', 
                        icon: <Download className="h-4 w-4" />, 
                        onClick: (e) => {
                          if (e) e.stopPropagation();
                          const csvHeaders = {
                            'Titolo': 'title',
                            'Descrizione': 'description',
                            'Categoria': 'category',
                            'Durata (ore)': 'duration',
                            'Prezzo': 'price',
                            'Codice': 'code'
                          };
                          exportToCsv([course], csvHeaders, `${course.title.replace(/\s+/g, '_')}.csv`);
                        },
                        variant: 'default',
                      },
                      {
                        label: 'Visualizza', 
                        icon: <ChevronRight className="h-4 w-4" />, 
                        onClick: (e) => {
                          if (e) e.stopPropagation();
                          navigate(`/courses/${course.id}`);
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

        {isImportOpen && (
          <CourseImport
            onClose={() => setIsImportOpen(false)}
            onImport={async (data, overwriteIds) => {
              try {
                // Controlla se i dati sono vuoti
                if (!Array.isArray(data) || data.length === 0) {
                  showToast({
                    message: "Nessun corso da importare",
                    type: "warning"
                  });
                  return;
                }

                // Conta quanti corsi sono stati importati con successo
                let successCount = 0;
                let errorCount = 0;

                // Ottimizzazione: Creiamo tutti i corsi in batch per una maggiore efficienza
                // Prepariamo gli oggetti corso correttamente formattati
                const coursesToImport = data.map(rawCourse => {
                  // Create a completely new object to avoid reference issues
                  const course: Record<string, any> = {};
                  
                  // String fields - explicit conversions
                  course.title = String(rawCourse.title || '');
                  course.code = String(rawCourse.code || '');
                  
                  // Optional string fields
                  if (rawCourse.description) course.description = String(rawCourse.description);
                  if (rawCourse.category) course.category = String(rawCourse.category);
                  if (rawCourse.certifications) course.certifications = String(rawCourse.certifications);
                  if (rawCourse.regulation) course.regulation = String(rawCourse.regulation);
                  if (rawCourse.contents) course.contents = String(rawCourse.contents);
                  
                  // Numeric fields - efficiente conversione
                  if (rawCourse.duration !== undefined) {
                    const numValue = Number(String(rawCourse.duration).replace(/[^\d]/g, ''));
                    course.duration = !isNaN(numValue) ? numValue : 0;
                  }
                  
                  if (rawCourse.validityYears !== undefined) {
                    const numValue = Number(String(rawCourse.validityYears).replace(/[^\d]/g, ''));
                    course.validityYears = !isNaN(numValue) ? numValue : 0;
                  }
                  
                  if (rawCourse.pricePerPerson !== undefined) {
                    const numValue = Number(String(rawCourse.pricePerPerson).replace(/[^\d]/g, ''));
                    course.pricePerPerson = !isNaN(numValue) ? numValue : undefined;
                  }
                  
                  if (rawCourse.maxPeople !== undefined) {
                    const numValue = Number(String(rawCourse.maxPeople).replace(/[^\d]/g, ''));
                    course.maxPeople = !isNaN(numValue) ? numValue : undefined;
                  }
                  
                  if (rawCourse.price !== undefined) {
                    const numValue = Number(String(rawCourse.price).replace(/[^\d]/g, ''));
                    course.price = !isNaN(numValue) ? numValue : undefined;
                  }
                  
                  // Special handling for renewalDuration as a string
                  if (rawCourse.renewalDuration !== undefined) {
                    course.renewalDuration = String(rawCourse.renewalDuration);
                  }
                  
                  // Controlla se è un aggiornamento (ha ID)
                  if (rawCourse._id || rawCourse.id) {
                    course.id = rawCourse._id || rawCourse.id;
                  }
                  
                  return course;
                });
                
                // Dividiamo in corsi da aggiornare e corsi da creare
                const updateCourses = coursesToImport.filter(course => course.id);
                const createCourses = coursesToImport.filter(course => !course.id);
                
                // Importa in batch usando Promise.all per parallelizzare
                const results = await Promise.all([
                  // Gestire creazione di nuovi corsi in batch
                  ...createCourses.map(course => 
                    createCourse(course as CourseCreate)
                      .then(() => { successCount++; return true; })
                      .catch(() => { errorCount++; return false; })
                  ),
                  
                  // Gestire aggiornamento corsi esistenti in batch
                  ...updateCourses.map(course => {
                    const { id, ...updateData } = course;
                    return updateCourse(id, updateData)
                      .then(() => { successCount++; return true; })
                      .catch(() => { errorCount++; return false; });
                  })
                ]);
                
                // Feedback all'utente
                showToast({
                  message: `Importazione completata: ${successCount} corsi importati, ${errorCount} errori`,
                  type: successCount > 0 ? 'success' : 'warning'
                });
                
                // Ricarica i dati
                await fetchCourses();
                
                // Chiudi il modale
                setIsImportOpen(false);
                
              } catch (error: unknown) {
                // Prova comunque a recuperare dati
                try {
                  await fetchCourses();
                } catch (e) {
                  // Ignora errori di recupero dati
                }
                
                showToast({
                  message: `Errore durante l'importazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
                  type: 'error'
                });
              }
            }}
            existingCourses={courses}
          />
        )}
      </div>
    </EntityListLayout>
  );
};

export default CoursesPage;