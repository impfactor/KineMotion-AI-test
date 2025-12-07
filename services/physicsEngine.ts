import { Point, TimeSeriesData } from '../types';

/**
 * MATH UTILITIES
 */
export const toDegrees = (rad: number) => (rad * 180) / Math.PI;

// Calculate angle between three points (A-B-C), typically used for joints like Hip-Knee-Ankle
export const calculateJointAngle = (a: Point, b: Point, c: Point): number => {
  // Vector BA
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  // Vector BC
  const v2 = { x: c.x - b.x, y: c.y - b.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (mag1 * mag2 === 0) return 180;

  const angleRad = Math.acos(dot / (mag1 * mag2));
  return toDegrees(angleRad);
};

/**
 * IMU PROCESSOR (Sensor Fusion Simulation)
 * Since we can't easily access raw hardware sensors in a simple web preview without HTTPS/Permissions,
 * this class encapsulates the logic described in the prompt.
 */
export class IMUProcessor {
  private alpha = 0.98; // Complementary filter constant
  private pitch = 0;
  private roll = 0;
  private velocity = 0;
  private position = 0;

  // Sensor Fusion: Complementary Filter
  // theta_new = alpha * (theta_old + gyro * dt) + (1 - alpha) * accel
  updateOrientation(
    accel: { x: number; y: number; z: number },
    gyro: { x: number; y: number; z: number },
    dt: number
  ) {
    // Integrate gyro
    const pitchGyro = this.pitch + gyro.x * dt;
    const rollGyro = this.roll + gyro.y * dt;

    // Accel angles
    const pitchAccel = Math.atan2(accel.y, accel.z);
    const rollAccel = Math.atan2(-accel.x, Math.sqrt(accel.y * accel.y + accel.z * accel.z));

    // Fuse
    this.pitch = this.alpha * pitchGyro + (1 - this.alpha) * pitchAccel;
    this.roll = this.alpha * rollGyro + (1 - this.alpha) * rollAccel;

    return { pitch: this.pitch, roll: this.roll };
  }

  // Estimate GRF from Vertical Acceleration (Global Z)
  // F = m * (a + g)
  calculateGRF(verticalAccel: number, mass: number): number {
    const g = 9.81;
    return mass * (verticalAccel + g);
  }
}

/**
 * VISION ENGINE ALGORITHMS
 */

// Flight Time Method: H = (g * t^2) / 8
// Returns height in CM
export const calculateJumpHeightFlightTime = (flightTimeMs: number): number => {
    const t = flightTimeMs / 1000;
    const g = 9.81;
    return ((g * Math.pow(t, 2)) / 8) * 100;
};

// RSI Calculation
export const calculateRSI = (jumpHeightCm: number, contactTimeMs: number): number => {
    if (contactTimeMs <= 0) return 0;
    // RSI = Jump Height (m) / Contact Time (s)
    // Input is cm and ms, so: (cm/100) / (ms/1000) = (cm/ms) * 10
    return (jumpHeightCm / 100) / (contactTimeMs / 1000);
};

// Asymmetry Calculation
export const calculateAsymmetry = (left: number, right: number): number => {
    const avg = (left + right) / 2;
    if (avg === 0) return 0;
    return ((right - left) / avg) * 100;
};

// Generate AI Advice based on metrics
export const generateAIAdvice = (
    metrics: { jumpHeight: number; rsi?: number; maxKneeFlexion: number; asymmetry?: number },
    protocol: string
): string[] => {
    const advice: string[] = [];

    // Knee Flexion Analysis
    if (metrics.maxKneeFlexion < 60) {
        advice.push("膝關節屈曲不足 (<60°): 您在起跳準備階段下蹲過淺，限制了彈性位能的儲存。建議練習全範圍深蹲，增加離心階段的深度。");
    } else if (metrics.maxKneeFlexion > 110) {
        advice.push("深蹲過深 (>110°): 過深的下蹲可能會延長轉折時間，降低 SSC (伸展-縮短循環) 效率。嘗試縮短下蹲幅度以加快反應速度。");
    } else {
        advice.push("膝關節活動度良好: 您的下蹲深度適中，有利於力量傳遞。");
    }

    // Protocol Specific
    if (protocol === 'DJ' && metrics.rsi) {
        if (metrics.rsi < 1.5) {
            advice.push("RSI 偏低: 顯示反應肌力不足。建議從低強度的增強式訓練（如腳踝跳）開始，專注於縮短觸地時間。");
        } else if (metrics.rsi > 2.5) {
            advice.push("RSI 優異: 您的反應力量水平極佳，可嘗試更高強度的落下跳或單腳增強式訓練。");
        }
    }

    if (metrics.asymmetry && Math.abs(metrics.asymmetry) > 10) {
        const side = metrics.asymmetry > 0 ? "右側" : "左側";
        advice.push(`高風險警告: 檢測到${side}肢體明顯強勢 (不對稱 > 10%)。建議暫停高強度雙腳跳躍，優先進行單邊肌力訓練以平衡兩側差異，降低受傷風險。`);
    }

    if (protocol === 'CMJ') {
         advice.push("CMJ 建議: 若要提升高度，請專注於「髖鉸鏈」(Hip Hinge) 動作的爆發力，而不僅僅是依賴股四頭肌。");
    }

    return advice;
};
