import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ParagraphComponent } from "./paragraph-component";
import { useStudyContext } from "./study-context";

export const MainStudyPage: React.FC<{ userId: string }> = ({ userId }) => {
  const navigate = useNavigate();
  const { state, dispatch } = useStudyContext();
  const [error, setError] = useState<string | null>(null);

  // Handle navigation between paragraphs
  const handleNextParagraph = () => {
    const { currentParagraphIndex } = state.studyMode;

    // Validate current paragraph selections
    const currentParagraphId = state.paragraphs[currentParagraphIndex].id;
    const currentSelections = state.selections[currentParagraphId] || [];

    if (currentSelections.length === 0) {
      setError(
        "Please mark at least one region of relevance before continuing."
      );
      return;
    }

    // Move to next paragraph or finish study
    if (currentParagraphIndex < state.paragraphs.length - 1) {
      dispatch({
        type: "SET_STUDY_MODE",
        payload: { currentParagraphIndex: currentParagraphIndex + 1 },
      });
      setError(null);
    } else {
      // Save final data and navigate to thank you page
      saveStudyData();
      navigate("/thank-you");
    }
  };

  // Data saving utility
  const saveStudyData = async () => {
    try {
      const dataToSave = {
        userId,
        selections: state.selections,
        paragraphEdits: state.paragraphEdits,
        timestamp: Date.now(),
      };

      // In a real implementation, this would be an API call
      const response = await fetch("/api/save-study-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        throw new Error("Failed to save study data");
      }

      // Fallback: Local file save
      const dataStr = JSON.stringify(dataToSave, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
        dataStr
      )}`;

      const link = document.createElement("a");
      link.setAttribute("href", dataUri);
      link.setAttribute("download", `${userId}-study-data.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error saving study data:", err);
    }
  };

  // Current paragraph
  const { currentParagraphIndex } = state.studyMode;
  const currentParagraph = state.paragraphs[currentParagraphIndex];

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">
          Paragraph {currentParagraphIndex + 1} of {state.paragraphs.length}
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <ParagraphComponent
        paragraphId={currentParagraph.id}
        content={currentParagraph.content}
      />

      <div className="mt-6 flex justify-between">
        {currentParagraphIndex > 0 && (
          <button
            onClick={() =>
              dispatch({
                type: "SET_STUDY_MODE",
                payload: { currentParagraphIndex: currentParagraphIndex - 1 },
              })
            }
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Previous Paragraph
          </button>
        )}

        <button
          onClick={handleNextParagraph}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {currentParagraphIndex === state.paragraphs.length - 1
            ? "Finish Study"
            : "Next Paragraph"}
        </button>
      </div>

      <div className="mt-4 flex justify-center space-x-2">
        {state.paragraphs.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full ${
              index === currentParagraphIndex ? "bg-blue-500" : "bg-gray-300"
            }`}
            onClick={() =>
              dispatch({
                type: "SET_STUDY_MODE",
                payload: { currentParagraphIndex: index },
              })
            }
          />
        ))}
      </div>
    </div>
  );
};
