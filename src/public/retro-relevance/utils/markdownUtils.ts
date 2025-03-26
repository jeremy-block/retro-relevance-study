// src/utils/markdownUtils.ts
import MarkdownIt from 'markdown-it';
// import TurndownService from 'turndown';

const md = new MarkdownIt({
  html: true,  // Enable HTML tags
  breaks: true, // Convert '\n' in paragraphs into <br>
  linkify: true, // Autoconvert URL-like text to links
  typographer: true, // Enable some language-neutral replacement + quotes beautification
});
/**
 * Converts markdown text to HTML
 */
export const markdownToHtml = (markdownText: string): string => {
  // console.log("🚀 ~ markdownToHtml ~ markdownText:", markdownText)
  return md.render(markdownText);
};

/**
 * Converts HTML back to markdown
 */
export const htmlToMarkdownold = (html: string): string => {
  // This is a simplified implementation
  // For a real app, consider using a library like turndown
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<h[1-6]>(.*?)<\/h[1-6]>/gi, '## $1\n\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<a href="(.*?)">(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<[^>]*>/g, '');
};


// /**
//  * Converts HTML back to markdown using turndown library
//  */
// export const htmlToMarkdown = (html: string): string => {
//   const turndownService = new TurndownService({
//     headingStyle: 'atx',
//     codeBlockStyle: 'fenced',
//     emDelimiter: '*'
//   });
  
//   // Customize rules if needed
//   turndownService.addRule('lineBreaks', {
//     filter: ['br'],
//     replacement: () => '\n'
//   });

//   // Add ability to handle special rule for list items
// turndownService.addRule('listItems', {
//   filter: ['ul', 'ol'],
//   replacement: function(content, node) {
//     const listType = node.nodeName.toLowerCase() === 'ol' ? 'ordered' : 'unordered';
//     const items = content.trim().split('\n').map(item => {
//       return listType === 'ordered' ? 
//         `1. ${item.trim()}` : 
//         `- ${item.trim()}`;
//     }).join('\n');
//     return '\n\n' + items + '\n\n';
//   }
// });
  
//   return turndownService.turndown(html);
// };

/**
 * Splits text into sentences using a robust algorithm
 * that considers abbreviations, quotes, and markdown
 */
export const splitIntoSentencesOld = (text: string): string[] => {
  // Define abbreviations to avoid false splitting
  const abbreviations = ['mr.', 'mrs.', 'dr.', 'prof.', 'inc.', 'i.e.', 'e.g.', 'etc.', 'vs.', 'fig.'];
  
  // Function to check if a period is part of an abbreviation
  const isAbbreviation = (position: number): boolean => {
    const textLower = text.toLowerCase();
    for (const abbr of abbreviations) {
      if (position >= abbr.length - 1 && 
          textLower.substr(position - (abbr.length - 1), abbr.length) === abbr) {
        return true;
      }
    }
    return false;
  };

  // Characters that can end a sentence
  const sentenceEnders = ['.', '!', '?'];
  const sentences: string[] = [];
  let currentSentence = '';
  let inQuote = false;
  let inCode = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = i < text.length - 1 ? text[i + 1] : '';
    
    // Handle code blocks and inline code
    if (char === '`') {
      inCode = !inCode;
    }
    
    // Handle quotes
    if (char === '"' || char === "'") {
      inQuote = !inQuote;
    }
    
    // Add character to current sentence
    currentSentence += char;
    
    // Check for sentence end
    if (sentenceEnders.includes(char) && !inCode) {
      // Check if this is a real sentence end or an abbreviation
      if (!isAbbreviation(i) && 
          (nextChar === ' ' || nextChar === '\n' || nextChar === '' || nextChar === '"')) {
        // End of sentence
        sentences.push(currentSentence.trim());
        currentSentence = '';
        continue;
      }
    }
    
    // Handle markdown line breaks as sentence breaks
    if (char === '\n' && nextChar === '\n') {
      if (currentSentence.trim()) {
        sentences.push(currentSentence.trim());
        currentSentence = '';
      }
    }
  }
  
  // Don't forget the last sentence if there is one
  if (currentSentence.trim()) {
    sentences.push(currentSentence.trim());
  }
  
  return sentences;
};


/**
 * Splits text into sentences with metadata for markdown elements
 */
export const splitIntoSentencesAndMetadata = (text: string): Array<{text: string, metadata: {isListItem: boolean, indentLevel: number}}> => {
  // Define abbreviations to avoid false splitting
  const abbreviations = ['mr.', 'mrs.', 'dr.', 'prof.', 'inc.', 'i.e.', 'e.g.', 'etc.', 'vs.', 'fig.'];
  
  // Function to check if a period is part of an abbreviation
  const isAbbreviation = (position: number): boolean => {
    const textBeforePeriod = text.substring(Math.max(0, position - 10), position + 1).toLowerCase();
    return abbreviations.some(abbr => textBeforePeriod.endsWith(abbr));
  };
  
  const sentences: Array<{text: string, metadata: {isListItem: boolean, indentLevel: number}}> = [];
  let currentSentence = '';
  let inCodeBlock = false;
  let inQuote = false;
  
  // Helper to add the current sentence with metadata
  const addCurrentSentence = (indentLevel = 0, isListItem = false) => {
    if (currentSentence.trim()) {
      sentences.push({
        text: currentSentence.trim(),
        metadata: {
          isListItem,
          indentLevel
        }
      });
      currentSentence = '';
    }
  };
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1] || '';
    
    // Toggle code block state
    if (char === '`' && text.substr(i, 3) === '```') {
      inCodeBlock = !inCodeBlock;
      currentSentence += '```';
      i += 2;
      continue;
    }
    
    // Don't split sentences inside code blocks
    if (inCodeBlock) {
      currentSentence += char;
      continue;
    }
    
    // Check for list items
    if ((char === '-' || char === '*' || char === '+' || /^\d+\./.test(text.substr(i, 3))) && 
        (i === 0 || text[i - 1] === '\n')) {
      // Calculate indent level based on spaces/tabs before the list marker
      let indentLevel = 0;
      let j = i - 1;
      while (j >= 0 && (text[j] === ' ' || text[j] === '\t')) {
        indentLevel += text[j] === '\t' ? 4 : 1;
        j--;
      }
      
      // Add previous sentence if there is one
      addCurrentSentence();
      
      // Start new sentence as list item
      currentSentence += char;
      
      // If we finish this list item and start a new one, we'll add with isListItem=true
      const listItemMatch = text.substr(i).match(/^([*+-]|\d+\.)\s(.*?)($|\n)/);
      if (listItemMatch) {
        currentSentence += listItemMatch[0].substring(1);
        i += listItemMatch[0].length - 1;
        addCurrentSentence(Math.floor(indentLevel / 2), true);
        continue;
      }
    }
    
    // Regular sentence processing
    currentSentence += char;
    
    if (char === '.' || char === '!' || char === '?') {
      // Check if this is a real sentence end (not abbreviation, etc.)
      if (
        !isAbbreviation(i) && 
        !/\d+\.\d+/.test(text.substr(Math.max(0, i - 5), 7)) && // Not a decimal number
        !inQuote
      ) {
        addCurrentSentence();
        continue;
      }
    }
    
    // Handle markdown line breaks as sentence breaks
    if (char === '\n' && nextChar === '\n') {
      addCurrentSentence();
    }
  }
  
  // Don't forget the last sentence if there is one
  addCurrentSentence();
  
  return sentences;
};

/**
 * Computes the difference between two strings
 */
export const computeDiffold = (oldText: string, newText: string): string => {
  if (oldText === newText) return '';
  
  // Find the position where texts start to differ
  let startPos = 0;
  while (startPos < oldText.length && startPos < newText.length && 
         oldText[startPos] === newText[startPos]) {
    startPos++;
  }
  
  // Find the position where texts end differing by going backwards
  let oldEndPos = oldText.length - 1;
  let newEndPos = newText.length - 1;
  while (oldEndPos >= startPos && newEndPos >= startPos && 
         oldText[oldEndPos] === newText[newEndPos]) {
    oldEndPos--;
    newEndPos--;
  }
  
  // Extract the changed portions
  const removed = oldText.substring(startPos, oldEndPos + 1);
  const added = newText.substring(startPos, newEndPos + 1);
  
  // Format the diff string
  return `-${removed}+${added}`;
};

/**
 * Computes the difference between two strings
 * @returns Object containing added text, removed text, and net change in character count
 */
export const computeDiff = (oldText: string, newText: string): {
  added: string;
  removed: string;
  charDelta: number;
} => {
  // Find common prefix
  let i = 0;
  const minLength = Math.min(oldText.length, newText.length);
  while (i < minLength && oldText[i] === newText[i]) {
    i++;
  }
  const commonPrefix = i;
  
  // Find common suffix
  let j = 0;
  while (
    j < minLength - commonPrefix &&
    oldText[oldText.length - 1 - j] === newText[newText.length - 1 - j]
  ) {
    j++;
  }
  
  // Extract the changed parts
  const oldMiddle = oldText.substring(commonPrefix, oldText.length - j);
  const newMiddle = newText.substring(commonPrefix, newText.length - j);
  
  // Calculate character delta
  const charDelta = newText.length - oldText.length;
  
  return {
    removed: oldMiddle,
    added: newMiddle,
    charDelta
  };
};

export function parseMarkdown(markdownText: string): string {
  return md.render(markdownText);
}

// Enhanced markdown parsing that adds IDs to elements
export function parseMarkdownWithIds(markdownText: string): string {
  // Convert markdown to HTML
  const rawHtml = parseMarkdown(markdownText);
  
  // Create a temporary div to manipulate the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = rawHtml;
  
  // Add IDs to heading elements
  const addIds = (node: Element, prefix: string, index: number = 0) => {
    // Add ID to this element if it's a heading, paragraph, or list item
    const nodeName = node.nodeName.toLowerCase();
    if (/^h[1-6]$|^p$|^li$/.test(nodeName)) {
      node.id = `${prefix}-${nodeName}-${index}`;
    }
    
    // Process child elements recursively
    const children = Array.from(node.children);
    children.forEach((child, i) => {
      addIds(child, `${prefix}-${i}`, i);
    });
  };
  
  // Add IDs to all top-level elements
  Array.from(tempDiv.children).forEach((child, i) => {
    addIds(child, `node-${i}`, i);
  });
  
  // Return the enhanced HTML
  return tempDiv.innerHTML;
}

// Function to extract plain text from Markdown content
export function extractTextFromMarkdown(markdownText: string): string {
  const html = parseMarkdown(markdownText);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}


// Split text into sentences - handles common markdown syntax
export function splitIntoSentences(text: string): string[] {
  // Convert markdown to plain text to avoid issues with markdown syntax
  const plainText = extractTextFromMarkdown(text);
  
  // Split by common sentence delimiters
  const sentenceRegex = /[.!?]+(?=\s+|$)/g;
  const sentences = plainText
    .split(sentenceRegex)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  return sentences;
}

// Find the original markdown for each sentence
export function mapSentencesToMarkdown(sentences: string[], markdownText: string): { text: string, markdownSegment: string }[] {
  let result: { text: string, markdownSegment: string }[] = [];
  let remainingMarkdown = markdownText;
  
  for (const sentence of sentences) {
    // Create a regex to find this sentence in the markdown
    // This is a simplified approach and may need to be more robust
    const escapedSentence = escapeRegExp(sentence);
    const sentenceRegex = new RegExp(`[^.!?]*${escapedSentence}[.!?]*`);
    
    const match = sentenceRegex.exec(remainingMarkdown);
    if (match) {
      const matchedText = match[0];
      result.push({
        text: sentence,
        markdownSegment: matchedText
      });
      
      // Remove the matched part from the remaining markdown
      const matchIndex = remainingMarkdown.indexOf(matchedText);
      if (matchIndex !== -1) {
        remainingMarkdown = remainingMarkdown.substring(matchIndex + matchedText.length);
      }
    } else {
      // If no match is found, just use the sentence as is
      result.push({
        text: sentence,
        markdownSegment: sentence
      });
    }
  }
  
  return result;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}