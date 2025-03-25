// src/components/SelectionContextMenu.tsx
import React from 'react';

interface SelectionContextMenuProps {
  position: { x: number, y: number } | null;
  onSelectRelevance: (level: string) => void;
  onRemove: () => void;
  onCancel: () => void;
  showRemoveOption?: boolean;
}

const SelectionContextMenu: React.FC<SelectionContextMenuProps> = ({
  position,
  onSelectRelevance,
  onRemove,
  onCancel,
  showRemoveOption = false,
}) => {
  if (!position) return null;

  return (
    <div
      id="selection-context-menu"
      className="context-menu absolute z-50 bg-white rounded-md shadow-lg py-1 w-48 border border-gray-200"
      style={{ top: position.y, left: position.x }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-1 text-sm font-medium text-gray-700">Relevance Level:</div>
      <button 
        onClick={() => onSelectRelevance('high')}
        className="flex w-full px-4 py-2 text-sm text-left hover:bg-gray-100 items-center"
      >
        <span className="w-4 h-4 mr-2 bg-red-200 rounded-full"></span>
        High
      </button>
      <button 
        onClick={() => onSelectRelevance('medium')}
        className="flex w-full px-4 py-2 text-sm text-left hover:bg-gray-100 items-center"
      >
        <span className="w-4 h-4 mr-2 bg-yellow-200 rounded-full"></span>
        Medium
      </button>
      <button 
        onClick={() => onSelectRelevance('low')}
        className="flex w-full px-4 py-2 text-sm text-left hover:bg-gray-100 items-center"
      >
        <span className="w-4 h-4 mr-2 bg-green-200 rounded-full"></span>
        Low
      </button>
      <div className="border-t border-gray-200 my-1"></div>
          {showRemoveOption && (
              <button
                  onClick={onRemove}
                  className="flex w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100"
              >
                  Remove Selection
              </button>
          )}
      <button 
        onClick={onCancel}
        className="flex w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
      >
        Cancel
      </button>
    </div>
  );
};

export default SelectionContextMenu;