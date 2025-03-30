// src/components/ParagraphSelection/SelectionManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { TextSelection, HighlightableElement } from '../retro-types';
import { mapHtmlIndexToMarkdown, tokenizeWithPositions, TokenWithPosition } from '../utils/markdownMapper';

interface SelectionManagerProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
  onSelectionComplete: (selection: TextSelection) => void;
  markdownText: string;
  onSelectionStart: () => void;
  onSelectionCancel: () => void;
}

const SelectionManager: React.FC<SelectionManagerProps> = ({
  contentRef,
  onSelectionComplete,
  markdownText,
  onSelectionStart,
  onSelectionCancel
}) => {
  const [tokens, setTokens] = useState<TokenWithPosition[]>([]);
  
  // Generate tokens for the markdown text
  useEffect(() => {
    const generatedTokens = tokenizeWithPositions(markdownText);
    setTokens(generatedTokens);
  }, [markdownText]);
  
  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !contentRef.current) {
      return;
    }
    
    // Get the selected text
    const selectedText = selection.toString().trim();
    if (!selectedText) return;
    
    try {
      // Notify parent that selection has started
      onSelectionStart();
      
      // Get the selection range
      const range = selection.getRangeAt(0);
      
      // Find the path for nodes in the selection
      const selectedElements = getSerializableElementsInRange(range, contentRef.current);
      
      // Calculate HTML indices of the selection
      const htmlIndices = calculateHtmlIndices(range, contentRef.current);
      
      // Map HTML indices to markdown indices
      const startIndex = mapHtmlIndexToMarkdown(
        htmlIndices.startIndex, 
        contentRef.current.innerHTML, 
        markdownText, 
        tokens
      ) || htmlIndices.startIndex;
      
      const endIndex = mapHtmlIndexToMarkdown(
        htmlIndices.endIndex, 
        contentRef.current.innerHTML, 
        markdownText, 
        tokens
      ) || htmlIndices.endIndex;
      
      // Create selection with properly mapped indices
      const newSelection: TextSelection = {
        ParentParagraphID: "", //to be set later when a selection is made
        id: `selection-${Date.now()}`,
        startIndex,
        endIndex,
        overlapsWithPriorSelection: false, // will be updated later when updating state.
        relevanceLevel: '', // Will be set by context menu
        selectedText,
        elements: selectedElements
      };
      
      // Pass the new selection to the parent
      onSelectionComplete(newSelection);
      
      // Important: Don't clear the selection here!
      // Let it remain visible until the context menu action is taken
    } catch (error) {
      console.error("Error handling text selection:", error);
      onSelectionCancel();
      if (selection) selection.removeAllRanges();
    }
  }, [contentRef, markdownText, tokens, onSelectionStart, onSelectionComplete, onSelectionCancel]);
  
  // Find node paths for elements in a selection range
  const getSerializableElementsInRange = (range: Range, container: HTMLElement): HighlightableElement[] => {
    const elements: HighlightableElement[] = [];
    
    // Helper function to get path from root to node
    const getNodePath = (node: Node): number[] => {
      const path: number[] = [];
      let current: Node | null = node;
      
      while (current && current !== container) {
        const parent: Node | null = current.parentNode;
        if (!parent) break;
        
        const index = Array.from(parent.childNodes).indexOf(current as ChildNode);
        path.unshift(index);
        current = parent;
      }
      
      return path;
    };
    
    // If selection is within a single node
    if (range.startContainer === range.endContainer) {
      elements.push({
        nodeRef: `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        nodeType: (range.startContainer.parentElement?.tagName || 'UNKNOWN'),
        path: getNodePath(range.startContainer),
        isFullySelected: false,
        startOffset: range.startOffset,
        endOffset: range.endOffset
      });
      return elements;
    }
    
    // If selection spans multiple nodes
    const nodeWalker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let currentNode: Node | null = nodeWalker.currentNode;
    let inSelection = false;
    
    while (currentNode) {
      // Check if this node is the start container
      if (currentNode === range.startContainer) {
        inSelection = true;
        elements.push({
          nodeRef: `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          nodeType: (range.startContainer.parentElement?.tagName || 'UNKNOWN'),
          path: getNodePath(currentNode),
          isFullySelected: false,
          startOffset: range.startOffset,
          endOffset: (currentNode.textContent || "").length
        });
      }
      // Check if this node is the end container
      else if (currentNode === range.endContainer) {
        inSelection = false;
        elements.push({
          nodeRef: `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          nodeType: (range.startContainer.parentElement?.tagName || 'UNKNOWN'),
          path: getNodePath(currentNode),
          isFullySelected: false,
          startOffset: 0,
          endOffset: range.endOffset
        });
        break;
      }
      // Add nodes that are fully contained in the selection
      else if (inSelection) {
        elements.push({
          nodeRef: `node-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          nodeType: (range.startContainer.parentElement?.tagName || 'UNKNOWN'),
          path: getNodePath(currentNode),
          isFullySelected: true
        });
      }
      
      currentNode = nodeWalker.nextNode();
    }
    
    return elements;
  };
  
  // Calculate HTML indices
  const calculateHtmlIndices = (
    range: Range, 
    container: HTMLElement
  ): { startIndex: number, endIndex: number } => {
    // Create a mapping of nodes to their text offsets
    const nodeOffsets: Map<Node, number> = new Map();
    let totalOffset = 0;
    
    // Function to calculate text offsets for each node
    const calculateOffsets = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        nodeOffsets.set(node, totalOffset);
        totalOffset += node.textContent?.length || 0;
      }
      
      const children = node.childNodes;
      for (let i = 0; i < children.length; i++) {
        calculateOffsets(children[i]);
      }
    };
    
    // Calculate offsets starting from the container
    calculateOffsets(container);
    
    // Find the nodes in our map that correspond to the range
    const startNode = range.startContainer;
    const endNode = range.endContainer;
    
    // Get offsets of the start and end nodes
    const startNodeOffset = nodeOffsets.get(startNode) || 0;
    const endNodeOffset = nodeOffsets.get(endNode) || 0;
    
    // Calculate absolute positions
    const startIndex = startNodeOffset + range.startOffset;
    const endIndex = endNodeOffset + range.endOffset;
    
    return { startIndex, endIndex };
  };
  
  // Attach the mouse up event handler
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;
    
    contentElement.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      contentElement.removeEventListener('mouseup', handleMouseUp);
    };
  }, [contentRef, handleMouseUp]);
  
  return null; // Component doesn't render anything
};

export default SelectionManager;