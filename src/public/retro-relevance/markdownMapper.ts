// // src/utils/markdownMapper.ts
// import MarkdownIt from 'markdown-it';

// export interface TokenWithPosition {
//   token: any;
//   start: number;
//   end: number;
//   children?: TokenWithPosition[];
// }

// // Generate tokens with their positions in the original markdown text
// export function tokenizeWithPositions(markdownText: string): TokenWithPosition[] {
//   const md = new MarkdownIt();
//   const tokens = md.parse(markdownText, {});
//   return mapTokensToPositions(tokens, markdownText);
// }

// // Recursive function to map tokens to their positions
// function mapTokensToPositions(tokens: any[], markdownText: string, startPos: number = 0): TokenWithPosition[] {
//   let position = startPos;
//   const result: TokenWithPosition[] = [];
  
//   for (const token of tokens) {
//     // Skip tokens with no content
//     if (!token.content && token.type !== 'fence' && token.type !== 'code_block') {
//       continue;
//     }
    
//     let tokenStart = position;
//     // For code blocks and fences, find the start position including markers
//     if (token.type === 'fence' || token.type === 'code_block') {
//       // Look for the code block markers in the text
//       const pattern = token.type === 'fence' ? 
//         new RegExp(`\`\`\`[^\\n]*\\n${escapeRegExp(token.content)}`) : 
//         new RegExp(`    ${escapeRegExp(token.content)}`);
//       const match = pattern.exec(markdownText.slice(position));
//       if (match) {
//         tokenStart = position + match.index;
//         position = tokenStart + match[0].length;
//       } else {
//         position += token.content.length;
//       }
//     } else {
//       position = markdownText.indexOf(token.content, position);
//       if (position === -1) {
//         // If content not found, use current position as a fallback
//         position = tokenStart;
//       }
//       tokenStart = position;
//       position += token.content.length;
//     }
    
//     const tokenWithPos: TokenWithPosition = {
//       token,
//       start: tokenStart,
//       end: position,
//     };
    
//     // Handle nested tokens recursively
//     if (token.children && token.children.length > 0) {
//       tokenWithPos.children = mapTokensToPositions(
//         token.children, 
//         token.content, 
//         0
//       );
//     }
    
//     result.push(tokenWithPos);
//   }
  
//   return result;
// }

// // Helper function to escape special regex characters
// function escapeRegExp(string: string): string {
//   return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// }

// // Map HTML position to original markdown position
// export function mapHtmlIndexToMarkdown(
//   htmlIndex: number,
//   htmlText: string,
//   markdownText: string,
//   tokens: TokenWithPosition[]
// ): number | null {
//   // Get plaintext from HTML
//   const tempDiv = document.createElement('div');
//   tempDiv.innerHTML = htmlText;
//   // const plainText = tempDiv.textContent || tempDiv.innerText || '';
  
//   // Find the token that contains this position in the plaintext
//   for (const tokenWithPos of tokens) {
//     // Check if the index is within this token's range in the plaintext
//     if (htmlIndex >= tokenWithPos.start && htmlIndex < tokenWithPos.end) {
//       // Calculate the relative offset within the token
//       const offset = htmlIndex - tokenWithPos.start;
      
//       // For tokens with children, recursively map the position
//       if (tokenWithPos.children && tokenWithPos.children.length > 0) {
//         const childResult = mapHtmlIndexToMarkdown(
//           offset,
//           tokenWithPos.token.content,
//           markdownText.substring(tokenWithPos.start, tokenWithPos.end),
//           tokenWithPos.children
//         );
        
//         if (childResult !== null) {
//           return tokenWithPos.start + childResult;
//         }
//       }
      
//       // Return the position in the original markdown
//       return tokenWithPos.start + offset;
//     }
//   }
  
//   return null;
// }