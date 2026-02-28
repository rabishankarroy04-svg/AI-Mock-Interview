"use client";
import { Button } from "@/components/ui/button"; // Adjust import path if needed
import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Mic, MicOff, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

const RecordAnswerSection = ({
  activeQuestionIndex,
  savedAnswer,
  onAnswerChange,
}) => {
  const [userAnswer, setUserAnswer] = useState(savedAnswer || "");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  useEffect(() => {
    setUserAnswer(savedAnswer || "");
    if (isRecording) stopRecording();

    // Cleanup media streams on unmount
    return () => stopMediaTracks();
  }, [activeQuestionIndex, savedAnswer]);

  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await sendForTranscription(audioBlob);
        setIsRecording(false);
        stopMediaTracks(); // Turn off mic
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success("Recording started... Speak now.");
    } catch (err) {
      console.error(err);
      toast.error("Microphone access denied. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const sendForTranscription = async (audioBlob) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("audio", audioBlob);

    try {
      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Transcription failed");

      const data = await res.json();
      const textResult = data.text || "";

      setUserAnswer(textResult);
      onAnswerChange(activeQuestionIndex, textResult);
      toast.success("Voice transcribed successfully!");
    } catch (error) {
      console.error(error);
      toast.error(
        "Failed to transcribe audio. You can type your answer instead.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 border p-5 rounded-xl bg-slate-50 shadow-sm">
      <div className="bg-black p-4 rounded-xl flex justify-center w-full max-w-md shadow-inner">
        <Webcam
          mirrored
          width={400}
          height={300}
          videoConstraints={{ facingMode: "user" }}
        />
      </div>

      <Button
        variant={isRecording ? "destructive" : "outline"}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={loading}
        className="flex items-center gap-2 h-12 px-6 rounded-full transition-all"
      >
        {loading ? (
          <LoaderCircle className="animate-spin" />
        ) : isRecording ? (
          "Stop Recording"
        ) : (
          "Record Answer"
        )}
        {isRecording ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>

      <div className="flex flex-col gap-2 w-full max-w-md">
        <div className="flex justify-between items-center">
          <label className="text-sm font-bold text-slate-600">
            Answer for Question #{activeQuestionIndex + 1}
          </label>
          {loading && (
            <span className="text-xs text-blue-500 animate-pulse font-medium">
              AI Transcribing...
            </span>
          )}
        </div>
        <textarea
          className="border border-slate-300 rounded-xl p-4 w-full h-40 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 bg-white"
          placeholder="Your transcribed text will appear here. You can also type or edit your answer directly..."
          value={userAnswer}
          onChange={(e) => {
            setUserAnswer(e.target.value);
            onAnswerChange(activeQuestionIndex, e.target.value);
          }}
        />
      </div>
    </div>
  );
};

export default RecordAnswerSection;
