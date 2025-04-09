// useParagraphData.ts
import { useState, useCallback } from 'react';
import { Paragraph, TextSelection } from '../../retro-relevance/retro-types';

interface ApiParagraph {
  id: string;
  type: 'narrative' | 'list';
  text: string;
  selections: TextSelection[];
}

export const useParagraphData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paragraphData, setParagraphData] = useState<Paragraph[]>([]);
  
  const apiBaseUrl = 'https://indie.cise.ufl.edu/retro-relevance';
  
  // Access key implementation with rotation based on day of month
  const getAccessKey = useCallback(() => {
    const accessKeys = [
      'experiment-key-1-research-2023',
      'experiment-key-2-research-2023',
      'experiment-key-3-research-2023',
      'experiment-key-4-research-2023',
      'experiment-key-5-research-2023'
    ];
    
    const dayOfMonth = new Date().getDate();
    const keyIndex = dayOfMonth % accessKeys.length;
    return accessKeys[keyIndex];
  }, []);

  // Generate or retrieve participant ID for tracking
  const getParticipantId = useCallback(() => {
    let id = sessionStorage.getItem('participant_id');
    if (!id) {
      id = 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('participant_id', id);
    }
    return id;
  }, []);

  // Fetch a specific paragraph by ID
  const fetchParagraphById = useCallback(async (id: string): Promise<Paragraph | null> => {
    try {
      setLoading(true);
      const accessKey = getAccessKey();
      const participantId = getParticipantId();
      
      const response = await fetch(
        `${apiBaseUrl}/get_paragraph.php?id=${id}&access_key=${accessKey}&participant_id=${participantId}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch paragraph: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.paragraph) {
        // Convert API format to component format
        return {
          id: data.paragraph.id,
          text: data.paragraph.text,
          selections: data.paragraph.selections || []
        };
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, getAccessKey, getParticipantId]);

  // Fetch paragraphs by type (narrative or list)
  const fetchParagraphsByType = useCallback(async (
    type: 'narrative' | 'list', 
    count: number = 1
  ): Promise<Paragraph[]> => {
    try {
      setLoading(true);
      const accessKey = getAccessKey();
      const participantId = getParticipantId();
      
      const response = await fetch(
        `${apiBaseUrl}/get_random_by_type.php?type=${type}&count=${count}&access_key=${accessKey}&participant_id=${participantId}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch paragraphs: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.paragraphs) {
        // Map API format to component format
        const formatted = data.paragraphs.map((p: ApiParagraph) => ({
          id: p.id,
          content: p.text,
          selections: p.selections || []
        }));
        
        return formatted;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, getAccessKey, getParticipantId]);

  // Fetch a sequence of alternating paragraph types for the experiment
  const fetchExperimentSequence = useCallback(async (previousId?: string): Promise<Paragraph[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const accessKey = getAccessKey();
      const participantId = getParticipantId();
      
      // Build query parameters
      const params = new URLSearchParams({
        access_key: accessKey,
        participant_id: participantId
      });
      
      if (previousId) {
        params.append('previousId', previousId);
      }
      
      const response = await fetch(`${apiBaseUrl}/get_sequence.php?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sequence: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.sequence) {
        // Convert API response to Paragraph type
        const formattedParagraphs: Paragraph[] = data.sequence.map((p: ApiParagraph) => ({
          id: p.id,
          content: p.text,
          selections: p.selections || []
        }));
        
        // Update state
        setParagraphData(formattedParagraphs);
        return formattedParagraphs;
      } else {
        throw new Error('Invalid response format or empty sequence');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching experiment sequence:', errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, getAccessKey, getParticipantId]);

  // Return all the necessary data and methods
  return {
    loading,
    error,
    paragraphData,
    setParagraphData,
    fetchParagraphById,
    fetchParagraphsByType,
    fetchExperimentSequence,
    getParticipantId
  };
};