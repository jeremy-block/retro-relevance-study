// useParagraphData.ts
import { useState, useCallback } from "react";
import { Paragraph, TextSelection } from "../../retro-relevance/retro-types";

interface ApiParagraphNew {
  id: string;
  type: "depricated";
  filename: number;
  text: string;
  selections: TextSelection[];
}

interface BaseSummary {
  summary_id: number;
  filename: string;
  content_text: string;
}

interface ApiSequence {
  success: boolean;
  block_id: number;
  block_label: string;
  block_version: number;
  summaries: BaseSummary[];
  sequence: ApiParagraphNew[];
}

const apiBaseUrl = "https://indie.cise.ufl.edu/retro-relevance-new/api";

export const useParagraphData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialParagraphs, setInitialParagraphs] = useState<Paragraph[]>([]);

  const _GET_options = {
    method: "GET",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
  };
  
  // Access key implementation with rotation based on day of month
  const getAccessKey = useCallback(() => {
    const accessKeys = [
      "experiment-key-1-research-2025",
      "experiment-key-2-research-2025",
      "experiment-key-3-research-2025",
      "experiment-key-4-research-2025",
      "experiment-key-5-research-2025",
    ];

    const dayOfMonth = new Date().getUTCDate();
    const keyIndex = dayOfMonth % accessKeys.length;
    return accessKeys[keyIndex];
  }, []);

  const fetchData = useCallback(
    async (url: string, options: RequestInit): Promise<any> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        return await response.json();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getParticipantId = useCallback(() => {
    //todo make sure we get the actual participant ID from the useStoreSelector
    return "6820d66c-d66c-d66c-d66c-00006820d66c";
    // let id = sessionStorage.getItem("participant_id");
    // if (!id) {
    //   id = "p_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    //   sessionStorage.setItem("participant_id", id);
    // }
    // return id;
  }, []);

  const fetchParagraphById = useCallback(
    async (id: string): Promise<Paragraph | null> => {
      const accessKey = getAccessKey();
      const participantId = getParticipantId();

      const url = `${apiBaseUrl}/get_item.php?id=${id}&access_key=${accessKey}`;
      const data = await fetchData(url, { mode: "cors" });
      console.log("🚀 ~ data:", data);
      if (data?.paragraph) {
        return {
          id: data.paragraph.id,
          text: data.paragraph.text,
          selections: data.paragraph.selections || [],
        };
      }
      return null;
    },
    [getAccessKey, getParticipantId, fetchData]
  );

  // Fetch a sequence of alternating paragraph types for the experiment
  const fetchExperimentSequence = useCallback(
    async (previousId?: string): Promise<Paragraph[]> => {
      const accessKey = getAccessKey();
      const participantId = getParticipantId();
      let url = `${apiBaseUrl}/get_full_block.php?access_key=${accessKey}&participant_id=${participantId}`;
      if (previousId) {
        url += `&previousId=${previousId}`;
      }
      const data = await fetchData(url, { mode: "cors" });
      console.log("🚀 ~ data:", data);
      if (data?.sequence) {
        // Convert API response to Paragraph type
        const formattedParagraphs: Paragraph[] = data.sequence.map(
          (p: ApiParagraphNew) => ({
            id: p.id,
            text: p.text,
            selections: p.selections || [],
          })
        );
        setInitialParagraphs(formattedParagraphs);
        return formattedParagraphs;
      }
      return [];
    },
    [getAccessKey, getParticipantId, fetchData, setInitialParagraphs]
  );

  return {
    loading,
    error,
    initialParagraphs,
    setInitialParagraphs,
    fetchParagraphById,
    fetchExperimentSequence,
    getParticipantId,
  };
};
