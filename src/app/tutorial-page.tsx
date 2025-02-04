import React from 'react';
import { useNavigate } from 'react-router-dom';

export const TutorialPage: React.FC<{ userId: string }> = ({ userId }) => {
  const navigate = useNavigate();

  const handleStartStudy = () => {
    navigate('/study');
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Retro-Relevance Study Tutorial
      </h1>
      
      <div className="space-y-4">
        <section>
          <h2 className="text-xl font-semibold mb-2">Study Overview</h2>
          <p>
            In this study, you will be reviewing paragraphs and marking the relevance 
            of text selections. You can select text by clicking and dragging 
            with your mouse.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-2">Relevance Levels</h2>
          <ul className="list-disc pl-5">
            <li>High Relevance: Extremely important information</li>
            <li>Relevant: Significant and useful information</li>
            <li>Somewhat Relevant: Marginally useful information</li>
            <li>Irrelevant: Not useful for the context</li>
            <li>Incorrect: Factually wrong or misleading information</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-2">How to Participate</h2>
          <ol className="list-decimal pl-5">
            <li>Read the paragraph carefully</li>
            <li>Select text by clicking and dragging</li>
            <li>Choose a relevance level from the context menu</li>
            <li>Repeat for multiple paragraphs</li>
          </ol>
        </section>
      </div>
      
      <div className="mt-8 text-center">
        <button 
          onClick={handleStartStudy}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Start Study
        </button>
      </div>
    </div>
  );
};
