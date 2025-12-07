import React, { useEffect, useRef, useState } from 'react';
import { ViewState, TestConfig, UserProfile, AnalysisResult, DetectionMethod, Point } from '../types';
import { Button } from '../components/Button';
import { calculateJointAngle, toDegrees } from '../services/physicsEngine';

// Global declaration for MediaPipe
declare global {
  interface Window {
    Pose: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    POSE_CONNECTIONS: any;
  }
}

interface Props {
  user: UserProfile;
  config: TestConfig;
  onChangeView: (view: ViewState) => void;
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export const Capture: React.FC<Props> = ({ user, config, onChangeView, onAnalysisComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imuCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState("等待設備權限...");
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [realtimeAngle, setRealtimeAngle] = useState(0);
  
  // Data Collection Refs
  const timeSeriesRef = useRef<{time: number, kneeAngle: number, hipAngle?: number}[]>([]);
  const startTimeRef = useRef<number>(0);
  const maxFlexionRef = useRef<number>(0);
  
  // MediaPipe objects
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  // IMU Simulation & Real Data Refs
  const imuAnimationFrameRef = useRef<number>(0);
  const imuDataHistoryRef = useRef<number[]>(new Array(150).fill(0));
  const latestSensorValueRef = useRef<number>(0);
  const lastSensorTimestampRef = useRef<number>(0);

  // Initialize MediaPipe or IMU
  useEffect(() => {
    if (config.method === DetectionMethod.CAMERA) {
      initCamera();
    } else {
      initIMU();
    }

    return () => {
      if (cameraRef.current) cameraRef.current.stop();
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
      if (imuAnimationFrameRef.current) cancelAnimationFrame(imuAnimationFrameRef.current);
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.method, facingMode]);

  const handleDeviceMotion = (event: DeviceMotionEvent) => {
    if (event.accelerationIncludingGravity) {
      const { x, y, z } = event.accelerationIncludingGravity;
      
      // Upgrade: Use Vector Magnitude (Sqrt(x^2+y^2+z^2))
      // This ensures 1G (9.81) is detected regardless of phone orientation (vertical/flat)
      const xVal = x || 0;
      const yVal = y || 0;
      const zVal = z || 0;
      
      const magnitude = Math.sqrt(xVal * xVal + yVal * yVal + zVal * zVal);

      // Low pass filter for smoothing sensor noise
      const alpha = 0.8; 
      // Force = Mass * Acceleration
      const currentForce = magnitude * user.weight;
      
      latestSensorValueRef.current = alpha * latestSensorValueRef.current + (1 - alpha) * currentForce;
      lastSensorTimestampRef.current = Date.now();
    }
  };

  const initCamera = async () => {
    setStatusText("初始化視覺引擎...");
    
    if (!window.Pose || !window.Camera) {
      setStatusText("錯誤：無法載入 AI 模型庫");
      return;
    }

    const pose = new window.Pose({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults(onPoseResults);
    poseRef.current = pose;

    if (videoRef.current) {
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await pose.send({image: videoRef.current});
          }
        },
        width: 640,
        height: 480,
        facingMode: facingMode
      });
      cameraRef.current = camera;
      await camera.start();
      setStatusText("準備就緒");
    }
  };

  const initIMU = () => {
    setStatusText("需要傳感器權限");
    // Add real sensor listener
    window.addEventListener('devicemotion', handleDeviceMotion);
    // Start Real-time Chart Loop
    drawIMUChart();
  };

  const drawIMUChart = () => {
      if (!imuCanvasRef.current) return;
      const ctx = imuCanvasRef.current.getContext('2d');
      if (!ctx) return;
      
      const width = imuCanvasRef.current.width;
      const height = imuCanvasRef.current.height;

      // Determine Source: Real Sensor or Simulation
      const now = Date.now();
      const isSensorActive = (now - lastSensorTimestampRef.current) < 500 && lastSensorTimestampRef.current !== 0;
      
      let val = 0;
      const baseForce = user.weight * 9.81; // Body weight in Newtons (1G)

      if (isSensorActive) {
          val = latestSensorValueRef.current;
      } else {
          // SIMULATION LOGIC
          if (isRecording) {
            // Simulate a jump curve based on elapsed time
            const elapsed = now - startTimeRef.current;
            
            // Phase 1: Quiet Standing (0-1s)
            // Phase 2: Unweighing (Countermovement) (~1.2s)
            // Phase 3: Propulsion (Push off) (~1.5s)
            // Phase 4: Flight (0 force) (~1.8s)
            // Phase 5: Landing (Impact) (~2.2s)
            
            if (elapsed < 1000) {
                 val = baseForce + (Math.random() - 0.5) * 50; 
            } else if (elapsed >= 1000 && elapsed < 1300) {
                 val = baseForce * 0.4; // Drop
            } else if (elapsed >= 1300 && elapsed < 1600) {
                 val = baseForce * 2.2; // Peak Force
            } else if (elapsed >= 1600 && elapsed < 2000) {
                 val = 0; // Flight
            } else if (elapsed >= 2000 && elapsed < 2300) {
                 val = baseForce * 3.5; // Landing Impact
            } else {
                 val = baseForce + (Math.random() - 0.5) * 50;
            }
          } else {
             // IDLE SIMULATION
             // Base ~1G, Noise +/- 50N
             // Adding a subtle sine wave to make it look "alive" even if static
             val = baseForce + (Math.sin(now / 300) * 20) + (Math.random() - 0.5) * 30;
          }
      }

      // Update Buffer
      imuDataHistoryRef.current.shift();
      imuDataHistoryRef.current.push(val);

      // Draw
      ctx.clearRect(0, 0, width, height);
      
      // Scaling: Max view is approx 3.5 * BW
      const maxRange = baseForce * 3.5;
      const scaleY = (v: number) => {
          const y = height - (v / maxRange) * height;
          return Math.max(0, Math.min(height, y)); // Clamp
      };

      // 0 Line (Bottom)
      const y0 = scaleY(0);
      ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(width, y0); 
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1; ctx.stroke();
      
      // 1 BW Line (Standing Baseline)
      const yBW = scaleY(baseForce);
      ctx.beginPath(); ctx.moveTo(0, yBW); ctx.lineTo(width, yBW); 
      ctx.strokeStyle = '#64748b'; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
      
      // Draw Data Line Area
      ctx.beginPath();
      ctx.moveTo(0, scaleY(imuDataHistoryRef.current[0]));
      
      const step = width / (imuDataHistoryRef.current.length - 1);
      
      for(let i=1; i<imuDataHistoryRef.current.length; i++) {
          const x = i * step;
          const y = scaleY(imuDataHistoryRef.current[i]);
          ctx.lineTo(x, y);
      }
      
      ctx.strokeStyle = '#06b6d4'; // Cyan 500
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Current Value Text
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText(`1.0 BW`, 5, yBW - 5);
      
      // Instant Value
      ctx.textAlign = "right";
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`${Math.round(val)} N`, width - 10, 30);
      
      ctx.textAlign = "left";
      if (isSensorActive) {
          ctx.fillStyle = '#4ade80'; // Green
          ctx.font = '12px sans-serif';
          ctx.fillText("● 傳感器連線中", 10, 30);
      } else {
          ctx.fillStyle = '#f59e0b'; // Amber
          ctx.font = '12px sans-serif';
          ctx.fillText("● 模擬模式", 10, 30);
      }

      imuAnimationFrameRef.current = requestAnimationFrame(drawIMUChart);
  };

  const requestIMUPermission = async () => {
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
          try {
              const response = await (DeviceMotionEvent as any).requestPermission();
              if (response === 'granted') {
                  setStatusText("傳感器已連接");
                  window.addEventListener('devicemotion', handleDeviceMotion);
              } else {
                  setStatusText("傳感器權限被拒絕");
              }
          } catch (e) {
              console.error(e);
              setStatusText("錯誤: " + e);
          }
      } else {
          setStatusText("傳感器已準備 (非 iOS 設備)");
      }
  };

  const onPoseResults = (results: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    
    // Mirror for selfie mode
    if (facingMode === 'user') {
        ctx.scale(-1, 1);
        ctx.translate(-width, 0);
    }

    if (results.poseLandmarks) {
        // Draw Skeleton with Solid Lines and Filled Points (No Outline)
        // Draw Connectors
        if (window.drawConnectors) {
            window.drawConnectors(ctx, results.poseLandmarks, window.POSE_CONNECTIONS,
                {color: '#0891b2', lineWidth: 4}); // Solid Cyan Line
        }
        
        // Draw Landmarks
        if (window.drawLandmarks) {
             window.drawLandmarks(ctx, results.poseLandmarks,
                {
                    color: '#ef4444', 
                    fillColor: '#ef4444', 
                    lineWidth: 0, 
                    radius: 5
                });
        }

        // Biomechanics Logic
        const landmarks = results.poseLandmarks;
        const hipIdx = 24; 
        const kneeIdx = 26;
        const ankleIdx = 28;

        const hip = landmarks[hipIdx];
        const knee = landmarks[kneeIdx];
        const ankle = landmarks[ankleIdx];

        if (hip && knee && ankle && hip.visibility > 0.5 && ankle.visibility > 0.5) {
            const angle = calculateJointAngle(
                {x: hip.x, y: hip.y},
                {x: knee.x, y: knee.y},
                {x: ankle.x, y: ankle.y}
            );
            setRealtimeAngle(Math.round(angle));

            if (isRecording) {
                const t = (Date.now() - startTimeRef.current) / 1000;
                timeSeriesRef.current.push({
                    time: t,
                    kneeAngle: angle
                });
            }
        }
    }
    ctx.restore();
  };

  const toggleRecording = () => {
    if (isRecording) {
        stopTest();
    } else {
        startTest();
    }
  };

  const startTest = () => {
      setIsRecording(true);
      startTimeRef.current = Date.now();
      timeSeriesRef.current = [];
      maxFlexionRef.current = 0;
      setStatusText("檢測中... 請執行動作");
  };

  const stopTest = () => {
      setIsRecording(false);
      setStatusText("檢測完成，正在分析...");
      performAnalysis();
  };

  const performAnalysis = () => {
      let minRawAngle = 180;
      timeSeriesRef.current.forEach(d => {
          if (d.kneeAngle < minRawAngle) minRawAngle = d.kneeAngle;
      });
      const maxFlexion = 180 - minRawAngle;

      const mockJumpHeight = Math.random() * 15 + 25; 
      const mockFlightTime = Math.sqrt((mockJumpHeight * 8) / 9.81) * 10;
      const mockContactTime = 250;

      const result: AnalysisResult = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          config: config,
          user: user,
          metrics: {
              jumpHeight: parseFloat(mockJumpHeight.toFixed(1)),
              flightTime: parseFloat(mockFlightTime.toFixed(0)),
              maxKneeFlexion: parseFloat(maxFlexion.toFixed(1)),
              rsi: config.protocol === 'DJ' ? parseFloat((mockJumpHeight / mockContactTime * 10).toFixed(2)) : undefined,
              asymmetry: Math.random() * 10 - 2, 
          },
          charts: {
              kneeAngle: timeSeriesRef.current.length > 10 ? timeSeriesRef.current.map(d => ({time: d.time, value: d.kneeAngle})) : generateMockCurve(),
              grf: generateMockGRF()
          },
          aiAdvice: []
      };
      
      onAnalysisComplete(result);
      onChangeView(ViewState.ANALYSIS);
  };

  const generateMockCurve = () => {
      const arr = [];
      for(let i=0; i<50; i++) {
          arr.push({time: i*0.05, value: 180 - Math.sin(i*0.1)*80}); 
      }
      return arr;
  };

  const generateMockGRF = () => {
      const arr = [];
      for(let i=0; i<50; i++) {
          let val = 9.81 * user.weight; 
          if (i > 10 && i < 15) val *= 0.5;
          if (i >= 15 && i < 25) val *= 2.5; 
          if (i >= 25 && i < 35) val = 0; 
          if (i >= 35 && i < 40) val *= 4; 
          arr.push({time: i*0.05, value: val});
      }
      return arr;
  };

  const toggleCamera = () => {
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 relative">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
        <Button variant="ghost" className="!p-2 text-white border-white/20 hover:bg-white/10" onClick={() => onChangeView(ViewState.SETUP)}>
            ←
        </Button>
        <div className="text-right">
            <div className="text-secondary font-mono font-bold text-lg drop-shadow-md">{statusText}</div>
            <div className="text-xs text-gray-300">{config.protocol} - {config.cameraAngle}</div>
            {config.method === DetectionMethod.CAMERA && (
                <div className="text-cyan-400 font-mono text-xl mt-1 drop-shadow-md">{realtimeAngle}° <span className="text-xs text-gray-400">膝角</span></div>
            )}
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
         {config.method === DetectionMethod.CAMERA ? (
             <>
                {/* Video Layer */}
                <video 
                    ref={videoRef} 
                    className={`absolute h-full w-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                    playsInline 
                    muted
                />
                {/* Canvas Layer - Explicit Z-Index to ensure it's on top */}
                <canvas 
                    ref={canvasRef} 
                    className="absolute h-full w-full object-cover z-10"
                    width={640}
                    height={480}
                />
             </>
         ) : (
             <div className="text-center p-8 w-full flex flex-col items-center">
                 <div className="text-6xl mb-4">📱</div>
                 <h3 className="text-xl font-bold mb-4 text-white">IMU 模式</h3>
                 <p className="text-gray-400 mb-6 text-sm">即時地面反作用力 (GRF) 監測</p>
                 
                 {/* Realtime GRF Chart Canvas */}
                 <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-inner w-full max-w-sm overflow-hidden">
                    <canvas 
                        ref={imuCanvasRef}
                        width={350}
                        height={200}
                        className="w-full h-auto block"
                    />
                 </div>
                 <p className="text-xs text-gray-500 mt-2 mb-6">X軸: 時間 | Y軸: Force (N)</p>

                 <Button onClick={requestIMUPermission} variant="secondary" className="mb-4">
                     授權傳感器
                 </Button>
             </div>
         )}
      </div>

      {/* Controls */}
      <div className="bg-white p-6 pb-10 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-20">
        <div className="flex justify-between items-center mb-4">
             <div className="w-12"></div> {/* Spacer */}
             <div className="text-slate-500 text-xs">
                 {isRecording ? <span className="text-red-500 animate-pulse font-bold">● REC</span> : "準備就緒"}
             </div>
             {config.method === DetectionMethod.CAMERA && (
                <button onClick={toggleCamera} className="bg-slate-100 p-2 rounded-full border border-slate-200">
                    📷 翻轉
                </button>
             )}
        </div>
        
        <div className="flex gap-4">
            {!isRecording ? (
                <Button variant="primary" fullWidth onClick={toggleRecording} className="h-16 text-lg shadow-cyan-500/30">
                    開始檢測
                </Button>
            ) : (
                <Button variant="danger" fullWidth onClick={toggleRecording} className="h-16 text-lg animate-pulse border-2 border-red-400 shadow-red-500/30">
                    停止並分析
                </Button>
            )}
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
            {config.protocol === 'CMJ' && "提示：雙手插腰，盡全力垂直跳高"}
            {config.protocol === 'SJ' && "提示：蹲下靜止 2 秒後，盡全力向上跳"}
            {config.protocol === 'DJ' && "提示：從箱上落下，觸地瞬間盡快跳起"}
        </p>
      </div>
    </div>
  );
};