// src/components/ParagraphSelection/ParagraphSelection.tsx
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
// import { useNavWLog } from '../../hooks/useNavWLog';
// import { RootState } from '../../store';
// import ParagraphHeader from './ParagraphHeader';
// import ParagraphContentWithSelections from './ParagraphContentWithSelections';

const ParagraphSelection: React.FC = () => {
  // const navigate = useNavWLog();
  // const { userId } = useSelector((state: RootState) => state.user);
  // const paragraphs = useSelector((state: RootState) => state.content.paragraphs);
  
  // useEffect(() => {
  //   if (!userId || !(paragraphs ?? []).length) {
  //     navigate('/admin');
  //   }
  // }, [userId, paragraphs, navigate]);
  
  // if (!userId || !paragraphs || paragraphs.length === 0) {
  //   return <div className="container mx-auto p-6">Loading...</div>;
  // }
  
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      {/* <ParagraphHeader /> */}
      
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        {/* <ParagraphContentWithSelections /> */}
        
        {/* Selection Legend */}
        <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <h4 className="font-medium mb-2">Relevance Levels:</h4>
          <div className="flex space-x-4">
            <div className="flex items-center">
              <span className="w-4 h-4 bg-red-200 rounded inline-block mr-2"></span>
              <span>High - The text is highly relevant to a future analyst</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-yellow-200 rounded inline-block mr-2"></span>
              <span>Medium - the text might be relevant to a future analyst</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-green-200 rounded inline-block mr-2"></span>
              <span>Low - The text might not be relevant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParagraphSelection;