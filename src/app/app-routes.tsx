"use client";

import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StudyProvider } from "./study-context";
import { TutorialPage } from "./tutorial-page";
import { MainStudyPage } from "./main-study-page";
import { ThankYouPage } from "./thank-you-page";
import { v4 as uuidv4 } from "uuid";

// Utility for generating and managing user ID
const getUserId = () => {
  let cookieName = "studyUserId";
  try {
    let userId = localStorage.getItem(cookieName);
    if (!userId) {
      userId = uuidv4();
      localStorage.setItem(cookieName, userId);
    }
    return userId;
  } catch (error) {
    console.error("Error retrieving user ID:", error);
    let userId = uuidv4();
    localStorage.setItem(cookieName, userId);
    return userId;
  }
};

export const App: React.FC = () => {
  const [userId] = useState(getUserId());

  return (
    <StudyProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
          <Routes>
            <Route
              path="/tutorial"
              element={<TutorialPage userId={userId} />}
            />
            <Route path="/study" element={<MainStudyPage userId={userId} />} />
            <Route
              path="/thank-you"
              element={<ThankYouPage userId={userId} />}
            />
            <Route path="*" element={<Navigate to="/tutorial" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </StudyProvider>
  );
};
