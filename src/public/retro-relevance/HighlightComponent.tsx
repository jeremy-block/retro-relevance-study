// // src/components/ParagraphSelection/HighlightComponent.tsx
// import React, { useState, useEffect } from 'react';
// import { TextSelection } from '../../types';

// interface HighlightComponentProps {
//   selection: TextSelection;
//   contentRef: React.RefObject<HTMLDivElement | null>;
//   onClick: () => void;
// }

// const HighlightComponent: React.FC<HighlightComponentProps> = ({
//   selection,
//   contentRef,
//   onClick
// }) => {
//   const [highlightRects, setHighlightRects] = useState<DOMRect[]>([]);
  
//   // Get highlight class based on relevance level
//   const getHighlightClass = (): string => {
//     const baseClass = "pointer-events-auto ml-4 mt-3.5 p-3.5 absolute rounded-sm";
    
//     switch (selection.relevanceLevel) {
//       case 'high':
//         return `${baseClass} bg-red-200/60 hover:bg-red-300/80`;
//       case 'medium':
//         return `${baseClass} bg-yellow-200/60 hover:bg-yellow-300/80`;
//       case 'low':
//         return `${baseClass} bg-green-200/60 hover:bg-green-300/80`;
//       default:
//         return `${baseClass} bg-gray-200/60 hover:bg-gray-300/80`;
//     }
//   };
  
//   // Calculate highlight positions whenever the selection or content changes
//   useEffect(() => {
//     if (!contentRef.current || !selection.elements) return;
    
//     // This function resolves a node path to an actual DOM node
//     const resolveNodePath = (path: number[], root: HTMLElement): Node | null => {
//       let current: Node = root;
      
//       for (let i = 0; i < path.length; i++) {
//         const index = path[i];
//         if (index < 0 || index >= current.childNodes.length) {
//           return null;
//         }
//         current = current.childNodes[index];
//       }
      
//       return current;
//     };
    
//     // Calculate client rects for all elements in the selection
//     const calculateHighlightRects = () => {
//       const container = contentRef.current;
//       if (!container) return [];
      
//       const containerRect = container.getBoundingClientRect();
//       const rects: DOMRect[] = [];
      
//       // Process each element in the selection
//       selection.elements?.forEach(el => {
//         // Resolve the node from its path
//         const node = resolveNodePath(el.path, container);
//         if (!node) return;
        
//         // Create a range for this element
//         const range = document.createRange();
        
//         if (el.isFullySelected) {
//           // Select the entire text node
//           range.selectNodeContents(node);
//         } else {
//           // Select only part of the text node
//           range.setStart(node, el.startOffset || 0);
//           range.setEnd(node, el.endOffset || 0);
//         }
        
//         // Get client rects for this range
//         const clientRects = range.getClientRects();
        
//         // Convert client rects to positions relative to the container
//         for (let i = 0; i < clientRects.length; i++) {
//           const rect = clientRects[i];
          
//           // Skip extremely small rects which might be artifacts
//           if (rect.width < 2 || rect.height < 2) continue;
          
//           // Adjust coordinates to be relative to the container
//           const adjustedRect = new DOMRect(
//             rect.left - containerRect.left,
//             rect.top - containerRect.top,
//             rect.width,
//             rect.height
//           );
          
//           rects.push(adjustedRect);
//         }
//       });
      
//       return rects;
//     };
    
//     // Calculate highlights initially
//     const calculatedRects = calculateHighlightRects();
//     setHighlightRects(calculatedRects);
    
//     // Recalculate on resize
//     const handleResize = () => {
//       const newRects = calculateHighlightRects();
//       setHighlightRects(newRects);
//     };
    
//     window.addEventListener('resize', handleResize);
    
//     return () => {
//       window.removeEventListener('resize', handleResize);
//     };
//   }, [selection, contentRef]);
  
//   // Handle click on the highlight
//   const handleClick = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     onClick();
//   };
  
//   // Fallback to text search if we can't resolve the highlight positions
//   useEffect(() => {
//     if (highlightRects.length === 0 && selection.selectedText && contentRef.current) {
//       // Try to find the selection text in the content
//       const textFinder = (node: Node): boolean => {
//         if (node.nodeType === Node.TEXT_NODE) {
//           const content = node.textContent || '';
//           const index = content.indexOf(selection.selectedText);
          
//           if (index !== -1) {
//             // Create a range for this text
//             const range = document.createRange();
//             range.setStart(node, index);
//             range.setEnd(node, index + selection.selectedText.length);
            
//             // Get the highlight rects
//             const containerRect = contentRef.current!.getBoundingClientRect();
//             const clientRects = range.getClientRects();
            
//             // Convert to relative positions
//             const newRects = Array.from(clientRects).map(rect => 
//               new DOMRect(
//                 rect.left - containerRect.left,
//                 rect.top - containerRect.top,
//                 rect.width,
//                 rect.height
//               )
//             );
            
//             if (newRects.length > 0) {
//               setHighlightRects(newRects);
//               return true;
//             }
//           }
//         }
        
//         // Recursively check child nodes
//         for (let i = 0; i < node.childNodes.length; i++) {
//           if (textFinder(node.childNodes[i])) {
//             return true;
//           }
//         }
        
//         return false;
//       };
      
//       // Try to find the text in the content
//       textFinder(contentRef.current);
//     }
//   }, [selection.selectedText, contentRef, highlightRects.length]);
  
//   return (
//     <>
//       {highlightRects.map((rect, index) => (
//         <div
//           key={`${selection.id}-${index}`}
//           className={getHighlightClass()}
//           style={{
//             left: `${rect.left}px`,
//             top: `${rect.top}px`,
//             width: `${rect.width}px`,
//             height: `${rect.height}px`,
//             zIndex: 10
//           }}
//           data-selection-id={selection.id}
//           onClick={handleClick}
//         />
//       ))}
//     </>
//   );
// };

// export default HighlightComponent;