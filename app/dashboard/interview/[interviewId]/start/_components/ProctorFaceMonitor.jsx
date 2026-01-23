"use client";

import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useProctor } from "./ProctorContext";
import { LoaderCircle, AlertTriangle, CheckCircle, ScanFace, MoveHorizontal, MoveVertical, Ruler } from "lucide-react";

/* ================= ULTRA CONFIG ================= */
const DETECTION_INTERVAL = 100; // 10 FPS
const CALIBRATION_FRAMES = 30;  // 3 seconds
const VIOLATION_BUFFER = 15;    // ~1.5 sec buffer
const EMA_ALPHA = 0.2;          // 0.1 = Very Smooth (Slow), 0.5 = Twitchy. 0.2 is the Sweet Spot.

// Thresholds (Relative to Calibration)
const THRESHOLD_YAW = 12;     // Looking Left/Right
const THRESHOLD_PITCH = 15;   // Looking Up/Down
const THRESHOLD_DIST_MIN = 0.7; // 70% of baseline size (Too Far)
const THRESHOLD_DIST_MAX = 1.4; // 140% of baseline size (Too Close)

export default function ProctorFaceMonitor({ className, style }) {
  const webcamRef = useRef(null);
  const { deduct } = useProctor();

  // --- STATE ---
  const [status, setStatus] = useState("Initializing"); 
  const [message, setMessage] = useState("Loading Neural Net...");
  const [hasError, setHasError] = useState(false);
  const [debugData, setDebugData] = useState({ yaw: 0, pitch: 0 }); // Optional: For visual debug

  // --- REFS (Logic Memory) ---
  const isCalibrated = useRef(false);
  const calibrationBuffer = useRef([]);
  const baseline = useRef({ yaw: 0, pitch: 0, width: 0 }); // "Home" position
  
  // Smoothing Memory (Previous Frames)
  const smooth = useRef({ yaw: 0, pitch: 0, width: 0 });
  
  const lastRunTime = useRef(0);
  const violationCounter = useRef(0);
  const currentStatusRef = useRef("Initializing");

  useEffect(() => {
    let faceMesh = null;
    let camera = null;
    let isActive = true;

    const initProctoring = async () => {
      try {
        const faceMeshModule = await import("@mediapipe/face_mesh");
        const cameraUtils = await import("@mediapipe/camera_utils");
        const FaceMesh = faceMeshModule.FaceMesh || faceMeshModule.default?.FaceMesh;
        const Camera = cameraUtils.Camera || cameraUtils.default?.Camera;

        if (!FaceMesh || !Camera) throw new Error("Modules failed to load");

        // 1. Setup Model
        faceMesh = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true, // Crucial for Iris tracking (High Precision)
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        faceMesh.onResults(onResults);

        // 2. Start Camera Loop
        const checkCamera = () => {
            if (!isActive) return;
            const video = webcamRef.current?.video;
            
            if (video && video.readyState === 4 && video.videoWidth > 0) {
                 camera = new Camera(video, {
                    onFrame: async () => {
                        if (!isActive) return;
                        const now = Date.now();
                        // Throttling
                        if (now - lastRunTime.current < DETECTION_INTERVAL) return;
                        lastRunTime.current = now;
                        await faceMesh.send({ image: video });
                    },
                    width: 640,
                    height: 480,
                 });
                 camera.start();
                 updateStatus("Calibrating", "Sit comfortably & look at screen...");
            } else {
                setTimeout(checkCamera, 200);
            }
        };
        checkCamera();

      } catch (err) {
        console.error("Proctor Init Error:", err);
        setHasError(true);
      }
    };

    // --- MAIN DETECTION LOGIC ---
    const onResults = (results) => {
        if (!isActive) return;

        // A. FACE LOSS CHECK
        if (!results.multiFaceLandmarks?.length) {
            handleViolation("Violation", "Face not visible");
            return;
        }

        const lm = results.multiFaceLandmarks[0];

        // B. RAW METRICS CALCULATION
        // 33=LeftEyeOuter, 263=RightEyeOuter, 1=NoseTip, 152=Chin
        const nose = lm[1];
        const chin = lm[152];
        const leftEye = lm[33];
        const rightEye = lm[263];

        // 1. Yaw (Turn): Horizontal distance between eyes
        const rawYaw = (rightEye.x - leftEye.x) * 100;
        
        // 2. Pitch (Nod): Vertical distance between nose and chin
        const rawPitch = (chin.y - nose.y) * 100;

        // 3. Distance (Depth): Width of face (Eyes distance is a good proxy)
        // We use Math.hypot for diagonal accuracy, though x-diff is usually enough
        const rawWidth = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y) * 100;

        // C. CALIBRATION PHASE
        if (!isCalibrated.current) {
            calibrationBuffer.current.push({ yaw: rawYaw, pitch: rawPitch, width: rawWidth });
            
            if (calibrationBuffer.current.length > CALIBRATION_FRAMES) {
                // Compute Averages
                const avg = (key) => calibrationBuffer.current.reduce((a, b) => a + b[key], 0) / calibrationBuffer.current.length;
                
                baseline.current = {
                    yaw: avg("yaw"),
                    pitch: avg("pitch"),
                    width: avg("width")
                };

                // Initialize smooth values to baseline so we don't jump
                smooth.current = { ...baseline.current };
                
                isCalibrated.current = true;
                updateStatus("Focused", "Monitoring Active");
            }
            return;
        }

        // D. SMOOTHING ENGINE (EMA)
        // New = (Raw * Alpha) + (Old * (1 - Alpha))
        smooth.current.yaw = (rawYaw * EMA_ALPHA) + (smooth.current.yaw * (1 - EMA_ALPHA));
        smooth.current.pitch = (rawPitch * EMA_ALPHA) + (smooth.current.pitch * (1 - EMA_ALPHA));
        smooth.current.width = (rawWidth * EMA_ALPHA) + (smooth.current.width * (1 - EMA_ALPHA));

        // Optional: Update debug UI for dev
        // setDebugData({ yaw: smooth.current.yaw, pitch: smooth.current.pitch });

        // E. THRESHOLD CHECKS
        const dYaw = Math.abs(smooth.current.yaw - baseline.current.yaw);
        const dPitch = Math.abs(smooth.current.pitch - baseline.current.pitch);
        const widthRatio = smooth.current.width / baseline.current.width;

        let violationType = null;

        if (dYaw > THRESHOLD_YAW) violationType = "Looking Away (Side)";
        else if (dPitch > THRESHOLD_PITCH) violationType = "Looking Away (Up/Down)";
        else if (widthRatio < THRESHOLD_DIST_MIN) violationType = "Too Far Back";
        else if (widthRatio > THRESHOLD_DIST_MAX) violationType = "Too Close";

        if (violationType) {
            handleViolation("Violation", violationType);
        } else {
            // F. RECOVERY
            // Recover 2x faster than we penalize to feel responsive
            violationCounter.current = Math.max(0, violationCounter.current - 2);
            if (violationCounter.current === 0) {
                updateStatus("Focused", "Focused");
            }
        }
    };

    const handleViolation = (statusKey, msg) => {
        violationCounter.current++;
        // Buffer allows short glances (e.g. thinking)
        if (violationCounter.current > VIOLATION_BUFFER) {
            updateStatus("Violation", msg);
            
            // Deduct points every 20 frames (~2 seconds) of sustained violation
            if (violationCounter.current % 20 === 0) {
                deduct(2, msg);
            }
        }
    };

    const updateStatus = (newStatus, msg) => {
        if (currentStatusRef.current !== newStatus || message !== msg) {
            currentStatusRef.current = newStatus;
            setStatus(newStatus);
            setMessage(msg);
        }
    };

    initProctoring();

    return () => {
        isActive = false;
        if(camera) camera.stop();
        if(faceMesh) faceMesh.close();
    };
  }, [deduct]);

  // --- RENDER ---
  return (
    <div className={`relative w-full h-full bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800 ${className}`} style={style}>
      
      <Webcam
        ref={webcamRef}
        mirrored
        audio={false}
        className="w-full h-full object-cover opacity-90"
        videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
        onUserMediaError={() => setHasError(true)}
      />

      {/* STATUS PILL */}
      <div className={`absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border shadow-lg transition-all duration-300 z-20 
        ${status === "Violation" ? "bg-red-500/90 border-red-400 text-white animate-pulse" : 
          status === "Focused" ? "bg-emerald-500/80 border-emerald-400 text-white" :
          "bg-blue-500/80 border-blue-400 text-white"}`}
      >
        {status === "Violation" && <AlertTriangle className="w-4 h-4" />}
        {status === "Focused" && <CheckCircle className="w-4 h-4" />}
        {status === "Calibrating" && <ScanFace className="w-4 h-4 animate-pulse" />}
        
        <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">
            {message}
        </span>
      </div>

      {/* CALIBRATION GUIDE */}
      {status === "Calibrating" && (
         <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-48 h-64 border-2 border-dashed border-blue-400/50 rounded-[40%] opacity-50 relative">
                 <div className="absolute top-1/2 left-0 w-full h-px bg-blue-400/30" /> {/* Eye Line */}
                 <div className="absolute top-0 left-1/2 h-full w-px bg-blue-400/30" /> {/* Center Line */}
            </div>
         </div>
      )}

      {/* ERROR / LOADING */}
      {(status === "Initializing" || hasError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30">
            {hasError ? (
                <>
                    <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                    <p className="text-red-400 font-bold">Camera Access Failed</p>
                    <p className="text-slate-500 text-xs mt-2">Check permissions</p>
                </>
            ) : (
                <>
                    <LoaderCircle className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                    <p className="text-slate-300 font-mono text-xs tracking-widest uppercase">Initializing Neural Net</p>
                </>
            )}
        </div>
      )}

      {/* DEBUG METRICS (Optional: Enable if you want to see raw data) */}
      {/* <div className="absolute bottom-2 left-2 text-[10px] text-green-400 font-mono bg-black/50 p-1 rounded">
         Y: {Math.round(debugData.yaw)} | P: {Math.round(debugData.pitch)}
      </div> 
      */}

    </div>
  );
}