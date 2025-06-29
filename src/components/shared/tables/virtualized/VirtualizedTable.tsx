import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useTranslation } from 'react-i18next';
import SortableColumn, { SortDirection } from '../SortableColumn';
import Pagination from '../../ui/Pagination';
import useSorting from '../../../../hooks/useSorting';
import usePagination from '../../../../hooks/usePagination';

export interface VirtualizedTableColumn<T = any> {
  key: string;
  label: string;
  width?: number;
  minWidth?: number;
  sortable?: boolean;
  sortKey?: string;
  renderHeader?: (col: VirtualizedTableColumn<T>) => React.ReactNode;
  renderCell?: (row: T, rowIndex: number) => React.ReactNode;
}

interface VirtualizedTableProps<T = any> {
  columns: VirtualizedTableColumn<T>[];
  data: T[];
  className?: string;
  tableClassName?: string;
  theadClassName?: string;
  tbodyClassName?: string;
  trClassName?: (row: T, index: number) => string;
  onRowClick?: (row: T, index: number) => void;
  keyExtractor?: (row: T, index: number) => string | number;
  rowHeight?: number;
  maxHeight?: number | string;
  pagination?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  stickyHeader?: boolean;
  loadingOverlay?: boolean;
  selectionMode?: boolean;
  selectedIds?: string[];
  onSelectRow?: (row: T, selected: boolean) => void;
  idExtractor?: (row: T) => string;
}

const VirtualizedTable = <T extends object>({
  columns,
  data,
  className = '',
  tableClassName = '',
  theadClassName = '',
  tbodyClassName = '',
  trClassName = () => '',
  onRowClick,
  keyExtractor = (_, index) => index,
  rowHeight = 50,
  maxHeight = 400,
  pagination = true,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  emptyMessage,
  stickyHeader = false,
  loadingOverlay = false,
  selectionMode = false,
  selectedIds = [],
  onSelectRow,
  idExtractor = (row: any) => row.id,
}: VirtualizedTableProps<T>) => {
  const { t } = useTranslation();
  const listRef = useRef<List>(null);
  const tableBodyRef = useRef<HTMLDivElement>(null);
  
  // Default empty message with translation
  const defaultEmptyMessage = useMemo(() => t('common.noData'), [t]);
  
  // Use provided or default empty message
  const displayEmptyMessage = emptyMessage || defaultEmptyMessage;

  // Gestione ordinamento
  const { sortedData, sortKey, sortDirection, setSorting } = useSorting<T>({
    data,
  });
  
  // Gestione paginazione
  const {
    paginatedData,
    totalPages,
    currentPage,
    pageSize,
    totalItems,
    goToPage,
    setPageSize,
  } = usePagination<T>({
    data: sortedData,
    pageSize: initialPageSize,
  });
  
  // Determina i dati da visualizzare
  const displayData = pagination ? paginatedData : sortedData;
  
  // Handler per il click sull'header della colonna
  const handleSortColumn = (colKey: string, direction: SortDirection) => {
    setSorting(colKey, direction);
  };
  
  // Rendering dell'header per una colonna
  const renderColumnHeader = (column: VirtualizedTableColumn<T>) => {
    if (column.renderHeader) {
      return column.renderHeader(column);
    }
    
    const sortableKey = column.sortKey || column.key;
    
    if (column.sortable) {
      return (
        <SortableColumn
          label={column.label}
          sortKey={sortableKey}
          currentSortKey={sortKey || undefined}
          currentDirection={sortDirection}
          onSort={handleSortColumn}
        />
      );
    }
    
    return column.label;
  };
  
  // Reset scroll position when page changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo(0);
    }
  }, [currentPage]);
  
  // Handler for row rendering
  const rowRenderer = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const row = displayData[index];
      const rowId = idExtractor(row);
      const isSelected = selectedIds.includes(rowId);
      
      if (!row) return null;
      
      return (
        <div 
          style={{ 
            ...style, 
            display: 'flex',
            borderBottom: '1px solid #e5e7eb'
          }}
          className={`hover:bg-gray-50 ${trClassName(row, index)} ${isSelected ? 'bg-blue-50' : ''}`}
          onClick={() => onRowClick && onRowClick(row, index)}
        >
          {columns.map((column) => {
            const flexBasis = column.width ? `${column.width}px` : 'auto';
            const minWidth = column.minWidth ? `${column.minWidth}px` : '100px';
            
            return (
              <div
                key={`${keyExtractor(row, index)}-${column.key}`}
                className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 flex items-center"
                style={{ 
                  flexBasis,
                  minWidth,
                  flexGrow: column.width ? 0 : 1 
                }}
              >
                {column.renderCell ? column.renderCell(row, index) : 
                  (row as any)[column.key] !== undefined ? String((row as any)[column.key]) : ''}
              </div>
            );
          })}
        </div>
      );
    },
    [displayData, columns, keyExtractor, trClassName, onRowClick, selectedIds, idExtractor]
  );

  // Handler per il cambio pagina
  const handlePageChange = (page: number) => {
    goToPage(page);
  };
  
  // Handler per il cambio dimensione pagina
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
  };
  
  return (
    <div className={`w-full relative ${className}`}>
      {/* Loading overlay */}
      {loadingOverlay && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Tabella */}
      <div className="w-full overflow-x-auto">
        <div className={`w-full ${tableClassName}`}>
          <div className={`bg-gray-50 ${stickyHeader ? 'sticky top-0 z-10' : ''} ${theadClassName}`}>
            <div className="flex border-b border-gray-200">
              {columns.map((column) => {
                const flexBasis = column.width ? `${column.width}px` : 'auto';
                const minWidth = column.minWidth ? `${column.minWidth}px` : '100px';
                
                return (
                  <div
                    key={column.key}
                    style={{ 
                      flexBasis,
                      minWidth,
                      flexGrow: column.width ? 0 : 1 
                    }}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {renderColumnHeader(column)}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div ref={tableBodyRef} className={`${tbodyClassName}`}>
            {displayData.length > 0 ? (
              <List
                ref={listRef}
                height={typeof maxHeight === 'number' ? maxHeight : 400}
                itemCount={displayData.length}
                itemSize={rowHeight}
                width="100%"
                className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              >
                {rowRenderer}
              </List>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                {displayEmptyMessage}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Paginazione */}
      {pagination && totalPages > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={pageSizeOptions}
          totalItems={totalItems}
        />
      )}
    </div>
  );
};

export default VirtualizedTable; 