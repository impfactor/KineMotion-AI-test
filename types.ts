export enum ViewState {
  HOME = 'HOME',
  SETUP = 'SETUP',
  CAPTURE = 'CAPTURE',
  ANALYSIS = 'ANALYSIS',
}

export enum JumpProtocol {
  CMJ = 'CMJ', // Countermovement Jump
  SJ = 'SJ',   // Squat Jump
  DJ = 'DJ',   // Drop Jump
}

export enum DetectionMethod {
  CAMERA = 'CAMERA',
  IMU = 'IMU',
}

export enum CameraAngle {
  SAGITTAL = 'SAGITTAL', // Side view
  FRONTAL = 'FRONTAL',   // Front view
}

export interface UserProfile {
  id: string;
  height: number; // cm
  weight: number; // kg
  age: number;
  gender: 'Male' | 'Female';
}

export interface TestConfig {
  protocol: JumpProtocol;
  method: DetectionMethod;
  cameraAngle: CameraAngle;
  dropHeight?: number; // cm, for DJ
}

export interface Point {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface TimeSeriesData {
  time: number; // seconds
  value: number; // generic value (angle, force, etc)
}

export interface AnalysisResult {
  id: string;
  date: string;
  config: TestConfig;
  user: UserProfile;
  metrics: {
    jumpHeight: number; // cm
    flightTime: number; // ms
    contactTime?: number; // ms (DJ only)
    rsi?: number; // Reactive Strength Index
    maxKneeFlexion: number; // degrees
    asymmetry?: number; // %
    peakPower?: number; // Watts (Estimated)
  };
  charts: {
    grf: TimeSeriesData[];
    kneeAngle: TimeSeriesData[];
    hipAngle?: TimeSeriesData[];
  };
  aiAdvice: string[];
}