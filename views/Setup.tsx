import React from 'react';
import { ViewState, JumpProtocol, DetectionMethod, CameraAngle, UserProfile, TestConfig } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

interface Props {
  onChangeView: (view: ViewState) => void;
  onConfigComplete: (user: UserProfile, config: TestConfig) => void;
}

export const Setup: React.FC<Props> = ({ onChangeView, onConfigComplete }) => {
  const [user, setUser] = React.useState<UserProfile>({
    id: 'Guest',
    height: 175,
    weight: 70,
    age: 25,
    gender: 'Male'
  });

  const [config, setConfig] = React.useState<TestConfig>({
    protocol: JumpProtocol.CMJ,
    method: DetectionMethod.CAMERA,
    cameraAngle: CameraAngle.SAGITTAL,
    dropHeight: 40
  });

  const handleSubmit = () => {
    onConfigComplete(user, config);
    onChangeView(ViewState.CAPTURE);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center space-x-2">
         <Button variant="ghost" className="!p-2" onClick={() => onChangeView(ViewState.HOME)}>
            ←
         </Button>
         <h2 className="text-xl font-bold text-slate-800">參數設定</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        <Card title="受測者資料">
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs text-slate-500 mb-1">身高 (cm)</label>
                <input 
                    type="number" 
                    value={user.height} 
                    onChange={(e) => setUser({...user, height: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:border-primary outline-none focus:ring-1 focus:ring-primary"
                />
            </div>
            <div>
                <label className="block text-xs text-slate-500 mb-1">體重 (kg)</label>
                <input 
                    type="number" 
                    value={user.weight} 
                    onChange={(e) => setUser({...user, weight: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:border-primary outline-none focus:ring-1 focus:ring-primary"
                />
            </div>
            <div>
                <label className="block text-xs text-slate-500 mb-1">年齡</label>
                <input 
                    type="number" 
                    value={user.age} 
                    onChange={(e) => setUser({...user, age: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:border-primary outline-none focus:ring-1 focus:ring-primary"
                />
            </div>
            <div>
                <label className="block text-xs text-slate-500 mb-1">性別</label>
                <select 
                    value={user.gender} 
                    onChange={(e) => setUser({...user, gender: e.target.value as 'Male' | 'Female'})}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:border-primary outline-none focus:ring-1 focus:ring-primary"
                >
                    <option value="Male">男</option>
                    <option value="Female">女</option>
                </select>
            </div>
          </div>
        </Card>

        <Card title="跳躍模式">
          <div className="flex flex-col space-y-2">
            {[JumpProtocol.CMJ, JumpProtocol.SJ, JumpProtocol.DJ].map((p) => (
              <button
                key={p}
                onClick={() => setConfig({...config, protocol: p})}
                className={`p-3 rounded-lg border text-left transition-all ${
                  config.protocol === p 
                  ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' 
                  : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold block">{p}</span>
                <span className="text-xs opacity-80">
                    {p === 'CMJ' && '標準反向跳 - 評估 SSC 效率'}
                    {p === 'SJ' && '靜止深蹲跳 - 評估純向心爆發力'}
                    {p === 'DJ' && '落下跳 - 評估 RSI 反應肌力'}
                </span>
              </button>
            ))}
          </div>
          {config.protocol === JumpProtocol.DJ && (
              <div className="mt-4">
                  <label className="block text-xs text-slate-500 mb-1">落下高度 (cm)</label>
                  <input 
                    type="number" 
                    value={config.dropHeight} 
                    onChange={(e) => setConfig({...config, dropHeight: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900"
                  />
              </div>
          )}
        </Card>

        <Card title="檢測設定">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs text-slate-500 mb-2">檢測方法</label>
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => setConfig({...config, method: DetectionMethod.CAMERA})}
                            className={`flex-1 py-2 rounded ${config.method === DetectionMethod.CAMERA ? 'bg-secondary text-white' : 'bg-slate-100 border border-slate-300 text-slate-500'}`}
                        >
                            相機 (AI)
                        </button>
                        <button 
                             onClick={() => setConfig({...config, method: DetectionMethod.IMU})}
                             className={`flex-1 py-2 rounded ${config.method === DetectionMethod.IMU ? 'bg-secondary text-white' : 'bg-slate-100 border border-slate-300 text-slate-500'}`}
                        >
                            傳感器 (IMU)
                        </button>
                    </div>
                </div>
                {config.method === DetectionMethod.CAMERA && (
                     <div>
                        <label className="block text-xs text-slate-500 mb-2">相機視角</label>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => setConfig({...config, cameraAngle: CameraAngle.SAGITTAL})}
                                className={`flex-1 py-2 rounded ${config.cameraAngle === CameraAngle.SAGITTAL ? 'bg-primary text-white' : 'bg-slate-100 border border-slate-300 text-slate-500'}`}
                            >
                                側面 (矢狀面)
                            </button>
                            <button 
                                onClick={() => setConfig({...config, cameraAngle: CameraAngle.FRONTAL})}
                                className={`flex-1 py-2 rounded ${config.cameraAngle === CameraAngle.FRONTAL ? 'bg-primary text-white' : 'bg-slate-100 border border-slate-300 text-slate-500'}`}
                            >
                                正面 (冠狀面)
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            {config.cameraAngle === CameraAngle.SAGITTAL ? "適合分析：跳躍高度、髖/膝屈曲角度。" : "適合分析：膝外翻 (Knee Valgus)、左右對稱性。"}
                        </p>
                     </div>
                )}
            </div>
        </Card>
      </div>

      <Button onClick={handleSubmit} fullWidth>
        下一步：進入檢測
      </Button>
    </div>
  );
};