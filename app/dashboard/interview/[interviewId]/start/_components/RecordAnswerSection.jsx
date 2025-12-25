"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useContext, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { WebCamContext } from "@/app/dashboard/layout";

const RecordAnswerSection = ({
  mockInterviewQuestion,
  activeQuestionIndex,
  interviewData,
}) => {
  const { user } = useUser();
  const { webCamEnabled, setWebCamEnabled } = useContext(WebCamContext);

  const [userAnswer, setUserAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const hasSubmittedRef = useRef(false);

  // 🔁 Auto-submit AFTER recording finishes
  useEffect(() => {
    if (!isRecording && userAnswer.length > 10 && !hasSubmittedRef.current) {
      hasSubmittedRef.current = true;
      submitAnswer();
    }
  }, [isRecording, userAnswer]);

  // 🎙️ Start Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: "audio/webm",
        });
        await sendForTranscription(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast("Recording started 🎙️");
    } catch (err) {
      console.error("Mic error:", err);
      toast("Microphone permission denied");
    }
  };

  // ⏹ Stop Recording
  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  // 🧠 Send audio → Gemini
  const sendForTranscription = async (audioBlob) => {
    setLoading(true);

    const formData = new FormData();
    formData.append("audio", audioBlob);

    try {
      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      // ✅ LOG WHAT USER SPOKE
      console.log("🎧 User spoke:", data.text);

      if (!data.text || data.text.length < 5) {
        toast("Could not understand speech");
        setLoading(false);
        return;
      }

      setUserAnswer(data.text);
    } catch (err) {
      console.error("Transcription failed:", err);
      toast("Speech recognition failed");
    }

    setLoading(false);
  };

  // 💾 Save Answer
  const submitAnswer = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mockId: interviewData.mockId,
          question: mockInterviewQuestion[activeQuestionIndex]?.Question,
          correctAns: mockInterviewQuestion[activeQuestionIndex]?.Answer,
          userAnswer,
          userEmail: user?.primaryEmailAddress?.emailAddress,
        }),
      });

      if (res.ok) {
        toast("Answer saved ✅");
      } else {
        toast("Failed to save answer ❌");
      }
    } catch (err) {
      console.error("Save answer error:", err);
      toast("Server error while saving");
    }

    setUserAnswer("");
    hasSubmittedRef.current = false;
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="bg-black p-5 rounded-lg">
        {webCamEnabled ? (
          <Webcam mirrored width={300} height={250} />
        ) : (
          <Image src="/globe.svg" width={200} height={200} alt="cam" />
        )}
      </div>

      <div className="flex gap-4">
        <Button onClick={() => setWebCamEnabled((p) => !p)}>
          {webCamEnabled ? "Close WebCam" : "Enable WebCam"}
        </Button>

        <Button
          variant="outline"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
        >
          {isRecording ? (
            <MicOff className="text-red-500" />
          ) : (
            <Mic className="text-green-600" />
          )}
        </Button>
      </div>

      {/* Optional Debug UI */}
      {userAnswer && (
        <div className="mt-3 text-sm text-gray-600 max-w-md text-center">
          <strong>Recognized:</strong> {userAnswer}
        </div>
      )}
    </div>
  );
};

export default RecordAnswerSection;
