"use client";

import React, {
  useEffect,
  useState,
  useContext,
  use,
  useCallback,
} from "react";
import {
  Lightbulb,
  WebcamIcon,
  ShieldCheck,
  Camera,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Webcam from "react-webcam";
import Link from "next/link";
import { WebCamContext } from "@/app/dashboard/layout";
import { toast } from "sonner";

const StatusItem = ({ label, ok }) => (
  <div className="flex justify-between items-center text-sm p-2 rounded-lg bg-white border border-slate-100 shadow-sm">
    <span className="text-slate-600 font-medium">{label}</span>
    {ok ? (
      <span className="text-green-600 flex items-center gap-1 font-bold">
        <CheckCircle2 className="w-4 h-4" /> Ready
      </span>
    ) : (
      <span className="text-red-500 font-bold">✖ Required</span>
    )}
  </div>
);

const Interview = ({ params }) => {
  const { interviewId } = use(params);
  const { webCamEnabled, setWebCamEnabled } = useContext(WebCamContext);

  const [interviewData, setInterviewData] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Memoized constraints to prevent unnecessary re-renders of the Webcam component
  const videoConstraints = React.useMemo(
    () => ({
      width: 1280,
      height: 720,
      facingMode: "user",
    }),
    [],
  );

  const canStartInterview = webCamEnabled && cameraReady && isFullscreen;

  // 1. Initial Checks (Mobile & Fullscreen)
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    setIsFullscreen(!!document.fullscreenElement);

    // Reset webcam on mount to ensure a fresh state
    setWebCamEnabled(false);
    setCameraReady(false);
  }, [setWebCamEnabled]);

  // 2. Data Fetching
  useEffect(() => {
    if (!interviewId) return;
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/interview/${interviewId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setInterviewData(data);
      } catch (err) {
        toast.error("Error loading interview data.");
        console.error(err);
      }
    };
    fetchData();
  }, [interviewId]);

  // 3. Fullscreen Management
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement || document.webkitFullscreenElement
      );
      setIsFullscreen(isFs);

      if (!isFs) {
        setWebCamEnabled(false);
        setCameraReady(false);
        toast.info("Fullscreen exited. Please re-enable camera to proceed.");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, [setWebCamEnabled]);

  const enterFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) await element.requestFullscreen();
      else if (element.webkitRequestFullscreen)
        await element.webkitRequestFullscreen();
    } catch (err) {
      toast.error("Please enable fullscreen in your browser settings.");
    }
  };

  // 4. Camera Callbacks
  const onUserMedia = useCallback(() => {
    setCameraReady(true);
    toast.success("Camera connected successfully!");
  }, []);

  const onUserMediaError = useCallback(() => {
    setWebCamEnabled(false);
    setCameraReady(false);
    toast.error(
      "Camera access denied. Please check site permissions in your browser.",
    );
  }, [setWebCamEnabled]);

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center gap-4 px-6">
        <h2 className="text-2xl font-bold text-slate-800">Desktop Required</h2>
        <p className="text-slate-500 max-w-sm">
          Proctoring features (AI monitoring & Fullscreen) require a desktop
          browser for a secure session.
        </p>
      </div>
    );
  }

  if (!interviewData)
    return (
      <div className="flex items-center justify-center h-screen animate-pulse text-slate-400">
        Preparing your session...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-extrabold text-4xl tracking-tight">
          Interview Setup
        </h2>
        <p className="text-slate-500">
          Complete the checklist below to begin your session.
        </p>
      </div>

      {/* Warning Alert */}
      <div className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl flex gap-3 items-center shadow-sm">
        <ShieldCheck className="w-6 h-6 text-rose-600" />
        <p className="text-sm font-medium">
          <strong>Proctoring Active:</strong> This interview is monitored. Do
          not switch tabs or exit fullscreen.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* LEFT SECTION */}
        <div className="space-y-6">
          <div className="p-8 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Job Role
                </p>
                <h2 className="text-lg font-bold text-slate-800">
                  {interviewData.jobPosition}
                </h2>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Experience
                </p>
                <h2 className="text-lg font-bold text-slate-800">
                  {interviewData.jobExperience} Years
                </h2>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Description
              </p>
              <p className="text-slate-600 text-sm line-clamp-3">
                {interviewData.jobDesc}
              </p>
            </div>
          </div>

          <div className="p-6 border rounded-2xl bg-indigo-50 border-indigo-100 flex gap-4">
            <Lightbulb className="w-8 h-8 text-indigo-600 shrink-0" />
            <div>
              <h3 className="font-bold text-indigo-900">
                Important Information
              </h3>
              <p className="text-indigo-700/80 text-sm mt-1 leading-relaxed">
                {process.env.NEXT_PUBLIC_INFORMATION ||
                  "Ensure you are in a quiet, well-lit environment. AI monitoring will flag excessive head movements or tab switching."}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-700 ml-1">
              Readiness Checklist
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatusItem
                label="Webcam Stream"
                ok={webCamEnabled && cameraReady}
              />
              <StatusItem label="Secure Mode" ok={isFullscreen} />
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: CAMERA */}
        <div className="flex flex-col gap-6">
          <div className="relative group aspect-video bg-slate-900 rounded-3xl overflow-hidden border-4 border-white shadow-2xl ring-1 ring-slate-200">
            {webCamEnabled ? (
              <Webcam
                onUserMedia={onUserMedia}
                onUserMediaError={onUserMediaError}
                mirrored
                className="h-full w-full object-cover"
                videoConstraints={videoConstraints}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                <div className="p-6 bg-slate-800 rounded-full">
                  <WebcamIcon className="w-12 h-12 text-slate-400" />
                </div>
                <p className="text-sm font-medium">
                  Camera preview is currently hidden
                </p>
              </div>
            )}

            {cameraReady && (
              <div className="absolute top-6 left-6 flex items-center gap-2 bg-rose-600 text-white px-4 py-1.5 rounded-full text-[11px] font-bold shadow-lg animate-in fade-in zoom-in">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />{" "}
                LIVE PREVIEW
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {!webCamEnabled ? (
              <Button
                size="lg"
                className="w-full h-14 text-md"
                onClick={() => setWebCamEnabled(true)}
              >
                <Camera className="mr-2 w-5 h-5" /> Initialize Camera
              </Button>
            ) : (
              <Button
                size="lg"
                variant="secondary"
                className="w-full h-14 text-md text-green-700 border-green-200 bg-green-50"
                disabled
              >
                <CheckCircle2 className="mr-2 w-5 h-5" /> Camera Ready
              </Button>
            )}

            {!isFullscreen ? (
              <Button
                size="lg"
                variant="destructive"
                className="w-full h-14 text-md"
                onClick={enterFullscreen}
              >
                Enable Secure Fullscreen
              </Button>
            ) : (
              <Button
                size="lg"
                variant="secondary"
                className="w-full h-14 text-md text-green-700 border-green-200 bg-green-50"
                disabled
              >
                <CheckCircle2 className="mr-2 w-5 h-5" /> Secure Mode Active
              </Button>
            )}

            <div className="pt-2">
              <Link
                href={
                  canStartInterview
                    ? `/dashboard/interview/${interviewId}/start`
                    : "#"
                }
              >
                <Button
                  size="lg"
                  className={`w-full h-20 text-xl font-bold shadow-xl transition-all ${
                    canStartInterview
                      ? "bg-indigo-600 hover:bg-indigo-700 scale-100"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed scale-95 shadow-none"
                  }`}
                  disabled={!canStartInterview}
                >
                  Start Professional Interview
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
