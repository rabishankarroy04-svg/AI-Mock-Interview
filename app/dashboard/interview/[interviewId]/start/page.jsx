"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QuestionSection from "./_components/QuestionSection";
import RecordAnswerSection from "./_components/RecordAnswerSection";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const StartInterview = () => {
  const { interviewId } = useParams();

  const [interviewData, setInterviewData] = useState(null);
  const [mockInterviewQuestion, setMockInterviewQuestion] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  useEffect(() => {
    if (interviewId) {
      getInterviewDetails();
    }
  }, [interviewId]);

  const getInterviewDetails = async () => {
    const res = await fetch(`/api/interview/${interviewId}`);
    const data = await res.json();

    console.log("API DATA:", data);

    setInterviewData(data);

    const parsedQuestions =
      typeof data.jsonMockResp === "string"
        ? JSON.parse(data.jsonMockResp)
        : data.jsonMockResp;

    setMockInterviewQuestion(parsedQuestions);
  };

  if (!interviewData) return <div>Loading...</div>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 mt-3">
        <QuestionSection
          mockInterviewQuestion={mockInterviewQuestion}
          activeQuestionIndex={activeQuestionIndex}
        />

        <RecordAnswerSection
          mockInterviewQuestion={mockInterviewQuestion}
          activeQuestionIndex={activeQuestionIndex}
          interviewData={interviewData}
        />
      </div>

      <div className="flex gap-3 mr-10 md:justify-end md:gap-6">
        {activeQuestionIndex > 0 && (
          <Button onClick={() => setActiveQuestionIndex((i) => i - 1)}>
            Previous Question
          </Button>
        )}

        {activeQuestionIndex < mockInterviewQuestion.length - 1 && (
          <Button onClick={() => setActiveQuestionIndex((i) => i + 1)}>
            Next Question
          </Button>
        )}

        {activeQuestionIndex === mockInterviewQuestion.length - 1 && (
          <Link href={`/dashboard/interview/${interviewData.mockId}/feedback`}>
            <Button>End Interview</Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default StartInterview;
