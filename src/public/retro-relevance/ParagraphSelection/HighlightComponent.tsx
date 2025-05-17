// src/components/ParagraphSelection/HighlightComponent.tsx
import React, { useState, useEffect } from 'react';
import { TextSelection } from '../retro-types';
import { Box } from '@mantine/core';
import { spacingResolver } from '@mantine/core/lib/core/Box/style-props/resolvers/spacing-resolver/spacing-resolver';

interface HighlightComponentProps {
  selection: TextSelection;
  contentRef: React.RefObject<HTMLDivElement | null>;
  onClick: () => void;
}

const HighlightComponent: React.FC<HighlightComponentProps> = ({
  selection,
  contentRef,
  onClick
}) => {
  const [highlightRects, setHighlightRects] = useState<DOMRect[]>([]);

  // Get highlight class based on relevance level
  const getHighlightClass = (): string => {
    const baseClass = "pointer-events-auto ml-4 mt-3.5 p-3.5 absolute rounded-sm";

    switch (selection.relevanceLevel) {
      case 'high':
        return `${baseClass} bg-red-200/60 hover:bg-red-300/80`;
      case 'medium':
        return `${baseClass} bg-yellow-200/60 hover:bg-yellow-300/80`;
      case 'low':
        return `${baseClass} bg-green-200/60 hover:bg-green-300/80`;
      default:
        return `${baseClass} bg-gray-200/60 hover:bg-gray-300/80`;
    }
  };

  // console.log("HighlightComponent rendered with selection:", selection.startIndex, selection.endIndex, selection.relevanceLevel);

  const getMantineHighlightStyles = (rect: DOMRect) => {
    const baseStyles = {
      //   position: 'absolute',
      left: `${rect.left}px`,
      top: `${rect.top - 500}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: 10,
      cursor: 'pointer',
      //   borderRadius: 'var(--mantine-radius-md)',
      //   border: '1px solid var(--mantine-color-blue-light)',

      pointerEvents: "auto" as const, // Ensure TypeScript recognizes valid CSS values
      // marginLeft: "1rem", // ml-4
      // marginTop: "0.875rem", // mt-3.5
      padding: "0.875rem", // p-3.5
      position: "absolute" as const, // Specify as const to avoid TypeScript error
      borderRadius: 'var(--mantine-radius-md)', // rounded-sm
      transition: "background-color 0.2s ease",
    };

    switch (selection.relevanceLevel) {
      case "high":
        return {
          ...baseStyles,
          backgroundColor: "rgba(254, 202, 202, 0.6)", // bg-red-200/60
          "&:hover": { backgroundColor: "rgba(252, 165, 165, 0.8)" }, // hover:bg-red-300/80
        };
      case "medium":
        return {
          ...baseStyles,
          backgroundColor: "rgba(254, 240, 138, 0.6)", // bg-yellow-200/60
          "&:hover": { backgroundColor: "rgba(253, 230, 138, 0.8)" }, // hover:bg-yellow-300/80
        };
      case "low":
        return {
          ...baseStyles,
          backgroundColor: "rgba(187, 247, 208, 0.6)", // bg-green-200/60
          "&:hover": { backgroundColor: "rgba(134, 239, 172, 0.8)" }, // hover:bg-green-300/80
        };
      default:
        return {
          ...baseStyles,
          backgroundColor: "rgba(229, 231, 235, 0.6)", // bg-gray-200/60
          "&:hover": { backgroundColor: "rgba(209, 213, 219, 0.8)" }, // hover:bg-gray-300/80
        };
    }
  };


  // Calculate highlight positions whenever the selection or content changes
  useEffect(() => {
    if (!contentRef.current || !selection.elements) return;

    // This function resolves a node path to an actual DOM node
    const resolveNodePath = (path: number[], root: HTMLElement): Node | null => {
      // Start from the paragraph root element
      let current: Node = root;
      // console.group('Node Path Resolution');
      // console.log('Starting at root:', root.tagName);
      // console.log('Path to resolve:', path);

      try {
        // Follow the path indices to find the node
        for (let i = 0; i < path.length; i++) {
          const index = path[i];
          // console.log(`Step ${i}: Looking for child ${index} of`, current.nodeName);

          if (current.childNodes && index < current.childNodes.length) {
            current = current.childNodes[index];
            // console.log(`Step ${i}: Found node:`, current.nodeName,
            //   current.nodeType === Node.TEXT_NODE ?
            //     `"${current.textContent?.substring(0, 20)}..."` : '');
          } else {
            // console.error(`Step ${i}: Failed - Node has ${current.childNodes?.length || 0} children, tried to access index ${index}`);
            console.groupEnd();
            return null;
          }
        }
        // console.log('Resolution successful');
        // console.groupEnd();
        return current;
      } catch (error) {
        // console.error('Error in path resolution:', error);
        // console.groupEnd();
        return null;
      }
    };

    // Calculate client rects for all elements in the selection
    const calculateHighlightRects = () => {
      if (!contentRef.current || !selection.elements) return [];

      const paragraphId = contentRef.current.dataset.paragraphId;
      
      const containerRect = contentRef.current.getBoundingClientRect();
      const rects: DOMRect[] = [];

      // Ensure highlights are only applied to the correct paragraph (but for some reason this breaks multi node highlights.)
      // console.log("🚀 ~ calculateHighlightRects ~ selection.ParentParagraphID:", selection.ParentParagraphID)
      // console.log("🚀 ~ calculateHighlightRects ~ contentRef.current?.dataset.paragraphId:", paragraphId)
      if (selection.ParentParagraphID !== paragraphId) {
        return [];
      }

      // Process each element in the selection
      selection.elements?.forEach(el => {
        // Resolve the node from its path
        const node = contentRef.current ? resolveNodePath(el.path, contentRef.current) : null;
        if (!node) return;

        // Create a range for this element
        const range = document.createRange();

        try {
          if (el.isFullySelected) {
            // Select the entire text node
            range.selectNodeContents(node);
          } else {
            const textContentLength = node.textContent?.length || 0;

            // Validate offsets before setting the range
            const startOffset = Math.min(el.startOffset || 0, textContentLength);
            const endOffset = Math.min(el.endOffset || 0, textContentLength);
            // console.log("🚀 ~ calculateHighlightRects ~ textContentLength:", textContentLength, "start:", startOffset, "end:", endOffset)

            if (startOffset <= textContentLength && endOffset <= textContentLength) {
              range.setStart(node, startOffset);
              range.setEnd(node, endOffset);
            } else {
              console.warn("Invalid range offsets: startOffset or endOffset exceeds textContentLength.");
              return;
            }
          }
          
          // // In HighlightComponent.ts, in calculateHighlightRects:
          // console.group('Highlight Calculation');
          // console.log('Selection:', selection);
          // console.log('Selection Paragraph ID:', selection.ParentParagraphID);
          // console.log('Current Paragraph ID:', contentRef.current?.dataset.paragraphId);
          // console.log('Match?', selection.ParentParagraphID === contentRef.current?.dataset.paragraphId);
          // console.log('Elements to highlight:', selection.elements);
          // console.groupEnd();
          
          // // And when resolving nodes:
          // console.log('Resolving node path:', el.path);
          // console.log('Found node:', node ? node.textContent?.substring(0, 20) + '...' : 'NULL');

          // Get client rects for this range
          const clientRects = range.getClientRects();

          // Convert client rects to positions relative to the container
          for (let i = 0; i < clientRects.length; i++) {
            const rect = clientRects[i];

            // Skip extremely small rects which might be artifacts
            if (rect.width < 2 || rect.height < 2) continue;

            // Adjust coordinates to be relative to the container
            const adjustedRect = new DOMRect(
              rect.left - containerRect.left,
              rect.top - containerRect.top,
              rect.width,
              rect.height
            );

            rects.push(adjustedRect);
          }
        } catch (error) {
          console.error("Error processing range for node:", node, error);
        }
      });

      return rects;
    };

    // Calculate highlights initially
    const calculatedRects = calculateHighlightRects();
    setHighlightRects(calculatedRects);

    // Recalculate on resize
    const handleResize = () => {
      const newRects = calculateHighlightRects();
      setHighlightRects(newRects);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [selection, contentRef]);

  // Handle click on the highlight
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  // Fallback to text search if we can't resolve the highlight positions
  useEffect(() => {
    if (highlightRects.length === 0 && selection.selectedText && contentRef.current) {
      // Try to find the selection text in the content
      const textFinder = (node: Node): boolean => {
        if (node.nodeType === Node.TEXT_NODE) {
          const content = node.textContent || '';
          const index = content.indexOf(selection.selectedText);

          if (index !== -1) {
            // Create a range for this text
            const range = document.createRange();
            range.setStart(node, index);
            range.setEnd(node, index + selection.selectedText.length);

            // Get the highlight rects
            const containerRect = contentRef.current!.getBoundingClientRect();
            const clientRects = range.getClientRects();

            // Convert to relative positions
            const newRects = Array.from(clientRects).map(rect =>
              new DOMRect(
                rect.left - containerRect.left,
                rect.top - containerRect.top,
                rect.width,
                rect.height
              )
            );

            if (newRects.length > 0) {
              setHighlightRects(newRects);
              return true;
            }
          }
        }

        // Recursively check child nodes
        for (let i = 0; i < node.childNodes.length; i++) {
          if (textFinder(node.childNodes[i])) {
            return true;
          }
        }

        return false;
      };

      // Try to find the text in the content
      textFinder(contentRef.current);
    }
  }, [selection.selectedText, contentRef, highlightRects.length]);

  return (
    <>
      {highlightRects.map((rect, index) => (
        <Box
          key={`${selection.id}-${index}`}
          style={getMantineHighlightStyles(rect)}
          data-selection-id={selection.id}
          onClick={handleClick}
        />
      ))}
    </>
  );
};

export default HighlightComponent;