"use client";

import { Lightbulb, Volume2 } from "lucide-react";
import React, { useState } from "react";

const QuestionSection = ({ mockInterviewQuestion, activeQuestionIndex }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const textToSpeech = (text) => {
    if (!text || isPlaying) return;

    if ("speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(text);

      setIsPlaying(true);

      speech.onend = () => {
        setIsPlaying(false);
      };

      speech.onerror = () => {
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(speech);
    } else {
      alert("Sorry, your browser does not support text to speech.");
    }
  };

  if (!mockInterviewQuestion) return null;

  return (
    <div className="flex flex-col justify-between p-5 border rounded-lg my-1 bg-secondary">
      {/* Question selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {mockInterviewQuestion.map((_, index) => (
          <h2
            key={index}
            className={`p-2 rounded-full text-center text-xs md:text-sm cursor-pointer md:block hidden ${
              activeQuestionIndex === index
                ? "bg-black text-white"
                : "bg-secondary"
            }`}
          >
            Question #{index + 1}
          </h2>
        ))}
      </div>

      {/* Question text */}
      <h2 className="my-5 text-md md:text-lg">
        {mockInterviewQuestion[activeQuestionIndex]?.Question}
      </h2>

      {/* Volume button + playing badge */}
      <div className="flex items-center gap-3">
        <Volume2
          className={`cursor-pointer w-6 h-6 ${
            isPlaying ? "opacity-50 pointer-events-none" : ""
          }`}
          onClick={() =>
            textToSpeech(mockInterviewQuestion[activeQuestionIndex]?.Question)
          }
        />

        {isPlaying && (
          <div className="bg-black text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
            <span className="animate-pulse">🔊</span>
            Playing
          </div>
        )}
      </div>

      {/* Note */}
      <div className="border rounded-lg p-5 bg-blue-100 mt-10 md:block hidden">
        <h2 className="flex gap-2 items-center text-blue-800">
          <Lightbulb />
          <strong>Note:</strong>
        </h2>
        <h2 className="text-sm text-blue-600 my-2">
          {process.env.NEXT_PUBLIC_QUESTION_NOTE}
        </h2>
      </div>
    </div>
  );
};

export default QuestionSection;
