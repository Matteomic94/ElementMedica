import React from 'react';
import { Dropdown, DropdownAction } from '../../../design-system/molecules/Dropdown';
import { cn } from '../../../design-system/utils';
import { MoreVertical, ChevronDown } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export interface ActionButtonProps {
  /** Lista delle azioni disponibili */
  actions: DropdownAction[];
  /** Classi personalizzate aggiuntive */
  className?: string;
  /** Se mostrare il pulsante come pillola blu invece che come icona */
  asPill?: boolean;
}

/**
 * Bottone di azioni specializzato per la prima colonna delle tabelle.
 * Mostra un menu dropdown di azioni quando viene cliccato.
 */
export const ActionButton: React.FC<ActionButtonProps> = ({
  actions,
  className = '',
  asPill = false,
}) => {
  return (
    <div 
      className="relative inline-block" 
      onClick={(e) => e.stopPropagation()}
      style={{ zIndex: 100 }}
    >
      {asPill ? (
        <Dropdown
          actions={actions}
          label="Azioni"
          icon={undefined}
          showArrow={true}
          variant="outline"
          pill={true}
          className={cn(
            'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200',
            className
          )}
        />
      ) : (
        <Dropdown
          actions={actions}
          icon={<MoreVertical className="h-4 w-4" />}
          label=""
          showArrow={false}
          customStyle={true}
          className={cn(
            'text-gray-500 hover:text-gray-800 focus:text-gray-800',
            'bg-transparent hover:bg-gray-100 active:bg-gray-200',
            'w-8 h-8 p-1.5 flex items-center justify-center rounded-full',
            className
          )}
        />
      )}
    </div>
  );
};

export default ActionButton;