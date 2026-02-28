"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- PROCTOR COMPONENTS ---
import { ProctorProvider } from "./_components/ProctorContext";
import ProctorBrowserMonitor from "./_components/ProctorBrowserMonitor";
import ProctorFaceMonitor from "./_components/ProctorFaceMonitor";
import ExamTimer from "./_components/ExamTimer";
// --------------------------

import QuestionSection from "./_components/QuestionSection";
import RecordAnswerSection from "./_components/RecordAnswerSection";
import { toast } from "sonner";

export default function StartInterview() {
  const { interviewId } = useParams();
  const router = useRouter();

  const [interviewData, setInterviewData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/interview/${interviewId}`)
      .then((res) => res.json())
      .then((data) => {
        setInterviewData(data);
        const parsedQuestions =
          typeof data.jsonMockResp === "string"
            ? JSON.parse(data.jsonMockResp)
            : data.jsonMockResp;
        setQuestions(parsedQuestions);
      })
      .catch((err) => {
        console.error("Failed to load interview:", err);
        toast.error("Error loading interview data.");
      });
  }, [interviewId]);

  const onAnswerChange = (qIdx, val) => {
    setAnswers((prev) => ({ ...prev, [qIdx]: val }));
  };

  const endInterview = async () => {
    setLoading(true);
    try {
      // Logic: Save all answers to DB
      for (let i = 0; i < questions.length; i++) {
        await fetch("/api/interview/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mockId: interviewData.mockId,
            question: questions[i].Question || questions[i].question,
            correctAns: questions[i].Answer || questions[i].answer,
            userAnswer: answers[i] || "",
            userEmail: interviewData.createdBy,
          }),
        });
      }

      toast.success("Interview submitted successfully!");
      // Use router.replace to prevent going back to the start page
      router.replace(`/dashboard/interview/${interviewId}/feedback`);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving answers.");
    } finally {
      setLoading(false);
    }
  };

  if (!interviewData)
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <LoaderCircle className="animate-spin w-10 h-10 text-primary" />
        <p className="text-slate-500 font-medium">
          Initializing secure session...
        </p>
      </div>
    );

  return (
    <ProctorProvider interviewId={interviewId}>
      {/* BACKGROUND MONITORS (Non-Visual) */}
      <ProctorBrowserMonitor />
      <ProctorFaceMonitor />

      {/* UI ELEMENTS */}
      <ExamTimer minutes={15} />

      <div className="p-5 md:p-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Question List & Current Question */}
          <QuestionSection
            mockInterviewQuestion={questions}
            activeQuestionIndex={index}
          />

          {/* Right: Camera & Voice Recording */}
          <RecordAnswerSection
            activeQuestionIndex={index}
            savedAnswer={answers[index] || ""}
            onAnswerChange={onAnswerChange}
          />
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-between items-center mt-12 bg-white p-4 rounded-xl border shadow-sm">
          <Button
            variant="outline"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
            className="w-32"
          >
            Previous
          </Button>

          <div className="text-sm font-bold text-slate-400">
            Question {index + 1} of {questions.length}
          </div>

          {index < questions.length - 1 ? (
            <Button onClick={() => setIndex(index + 1)} className="w-32">
              Next
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={endInterview}
              disabled={loading}
              className="w-40 font-bold"
            >
              {loading ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                "Finish Interview"
              )}
            </Button>
          )}
        </div>
      </div>
    </ProctorProvider>
  );
}
