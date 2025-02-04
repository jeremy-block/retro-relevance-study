import React, { useState } from "react";
import { useStudyContext } from "./study-context";

export const ThankYouPage: React.FC<{ userId: string }> = ({ userId }) => {
  const { state, exportData } = useStudyContext();
  const [feedback, setFeedback] = useState("");

  const handleFeedbackSubmit = async () => {
    if (feedback.trim()) {
      try {
        // In a real implementation, this would be an API call
        const feedbackData = {
          userId,
          feedback,
          timestamp: Date.now(),
        };

        // Simulate file download for feedback
        const dataStr = JSON.stringify(feedbackData, null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
          dataStr
        )}`;

        const link = document.createElement("a");
        link.setAttribute("href", dataUri);
        link.setAttribute("download", `${userId}-feedback.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Feedback submission error:", error);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-lg text-center">
      <h1 className="text-3xl font-bold mb-6">Thank You!</h1>

      <div className="mb-6">
        <p className="text-lg">
          You have completed the Retro-Relevance Study. Your contributions are
          valuable to our research.
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={exportData}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 mr-4"
        >
          Download Study Data
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Optional Feedback</h2>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share your thoughts about the study (optional)"
          className="w-full p-4 border rounded-lg h-32"
        />
        <button
          onClick={handleFeedbackSubmit}
          className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Submit Feedback
        </button>
      </div>

      <div className="text-sm text-gray-600">Study User ID: {userId}</div>
    </div>
  );
};
