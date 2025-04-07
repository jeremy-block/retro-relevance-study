// src/components/SelectionContextMenu.tsx
import { index } from 'd3';
import React from 'react';
import { Menu, Button, Divider, Text, Paper } from '@mantine/core';

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
      style={{ position: 'absolute', zIndex:15, top: position.y, left: position.x, backgroundColor: '#fff', padding:"0.4em", borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}
      onClick={(e) => e.stopPropagation()}
    >
    <Menu
      opened
      >
      <Text size="sm" color="gray" mb="xs">
        Relevance Level:
      </Text>
      <Menu.Item
        onClick={() => onSelectRelevance('high')}
        styles={{
          item: {
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            '&:hover': { backgroundColor: '#f8f9fa' },
          },
        }}
        >
        <span className="w-4 h-4 bg-red-200 rounded-full"></span>
        Critical
      </Menu.Item>
      <Menu.Item
        onClick={() => onSelectRelevance('medium')}
        styles={{
          item: {
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            '&:hover': { backgroundColor: '#f8f9fa' },
          },
        }}
        >
        <span className="w-4 h-4 bg-yellow-200 rounded-full"></span>
        Helpful
      </Menu.Item>
      <Menu.Item
        onClick={() => onSelectRelevance('low')}
        styles={{
          item: {
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            '&:hover': { backgroundColor: '#f8f9fa' },
          },
        }}
        >
        <span className="w-4 h-4 bg-green-200 rounded-full"></span>
        Optional
      </Menu.Item>
      <Divider my="xs" />
      {showRemoveOption && (
        <Menu.Item
        onClick={onRemove}
        styles={{
          item: {
            fontSize: '14px',
            color: '#e53e3e',
            '&:hover': { backgroundColor: '#f8f9fa' },
          },
        }}
        >
          Remove Selection
        </Menu.Item>
      )}
      <Menu.Item
        onClick={onCancel}
        styles={{
          item: {
            fontSize: '14px',
            '&:hover': { backgroundColor: '#f8f9fa' },
          },
        }}
        >
        Cancel
      </Menu.Item>
    </Menu>
        </div>
  );
};

export default SelectionContextMenu;