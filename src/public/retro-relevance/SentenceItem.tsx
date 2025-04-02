// src/components/TextEditor/SentenceItem.tsx
import React, { useState, useRef, useEffect } from 'react';
import { markdownToHtml } from './utils/markdownUtils';
import { Button, ButtonGroup, CloseButton, Group, Paper, Textarea, UnstyledButton } from '@mantine/core';
import { DraggableProvided } from '@hello-pangea/dnd';

interface SentenceItemProps {
  provided: DraggableProvided;
  id: string;
  text: string;
  focused: boolean;
  //todo update the type of text to match the new structure
  // sentenceItem: {
  //   metadata: {id: string, isListItem: boolean, indentLevel: number }, text: string;
  // }
  onChange: (id: string, newText: string, oldText: string) => void;
  onRemove: (id: string, oldText: string, reason: string) => void;
  onAddAfter: () => void;
  onFocus: (id: string | null) => void;
}

const SentenceItem = React.forwardRef<HTMLDivElement, SentenceItemProps>(({
  provided,
  id,
  text,
  focused,
  onChange,
  onRemove,
  onAddAfter,
  onFocus,
}, ref) => {
  const [editText, setEditText] = useState(text);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removeReason, setRemoveReason] = useState('');

  // Ensure only one item is focused at a time
  useEffect(() => {
    if (focused && editorRef.current) {
      editorRef.current.focus();
    }
  }, [focused]);
  // Start editing
  const handleStartEdit = () => {
    onFocus(id);  // This tells the parent to set the focus to this sentence
  };
  // Save changes
  const handleSave = () => {
    console.log("🚀 ~ handleSave ~ text:", text, editText)
    // if (text !== editText) {
    onChange(id, editText, text);
    // }
    // onFocus(null);  // Clear focus when done editing
  };

  // Handle key press
  // todo handle up and down arrow keys for navigation (maybe with shift key)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
      setTimeout(() => onAddAfter(), 0);
    } else if (e.key === 'Escape') {
      setEditText(text);
      onFocus(null);
    }
  };

  // Confirm sentence removal
  const handleRemoveConfirm = () => {
    if (removeReason) {
      onRemove(id, text, removeReason);
      setShowRemoveDialog(false);
      setRemoveReason('');
    }
  };

  // Render HTML from markdown
  const renderHtml = () => {
    if (!text) return { __html: '<span class="text-gray-400 italic">Blank line - Please click to edit</span>' };
    return { __html: markdownToHtml(text) };
  };

  return (
    <div
      ref={ref}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className="bg-white border rounded p-1 pl-6 hover:shadow-md relative group">
      {focused ? (
        <Group justify="space-between" mt="xs">
          <Textarea
            ref={editorRef}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onClick={handleStartEdit}
            onKeyDown={handleKeyDown}
            rows={Math.max(2, editText.split('\n').length)}
          />
          <div className="flex justify-end mt-2 space-x-2">
            <Button
              size="compact-md"
              variant="light"
              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </Group>
      ) : (
        <Paper p={0}
          // todo change color of background when about to remove a sentence: use showRemoveDialog
          className="absolute top-0 left-0 w-6 h-6 bg-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-bl cursor-grab"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
          </svg>
          <UnstyledButton
            onClick={handleStartEdit}
            className="cursor-text markdown-content"
          // style={{ minHeight: '1.5rem' }}
          >
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={renderHtml()}
            />
          </UnstyledButton>
          <CloseButton size={"xs"}
            className="absolute top-0 right-0 w-6 h-6 bg-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-bl"
            onClick={() => (text.trim() ? setShowRemoveDialog(true) : onRemove(id, text, 'empty'))}
            title="Remove sentence"
          />
        </Paper>
      )}

      {showRemoveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-3">Why are you removing this sentence?</h3>
            <div className="mb-4 space-y-2">
              {['inaccurate', 'irrelevant', 'other'].map((reason) => (
                <label key={reason} className="flex items-center">
                  <input
                    type="radio"
                    name="removeReason"
                    value={reason}
                    checked={removeReason === reason}
                    onChange={() => setRemoveReason(reason)}
                    className="mr-2"
                  />
                  <span>{reason.charAt(0).toUpperCase() + reason.slice(1)}</span>
                </label>
              ))}
            </div>
            <ButtonGroup className="flex justify-end space-x-2">
              <Button
                size='compact-md'
                variant='subtle'
                className="px-4 py-2 border rounded hover:bg-gray-100"
                onClick={() => setShowRemoveDialog(false)}>
                Cancel
              </Button>
              <Button
                size='compact-md'
                variant='outline'
                color='red'
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                onClick={handleRemoveConfirm}
                disabled={!removeReason}
              >
                Remove
              </Button>
            </ButtonGroup>
          </div>
        </div>
      )}
    </div>
  );
});

export default SentenceItem;
