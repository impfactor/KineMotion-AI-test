import React, { useMemo } from 'react';
import { ViewState, AnalysisResult } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { generateAIAdvice } from '../services/physicsEngine';
import { saveResult } from '../services/storageService';
// Import Recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  result: AnalysisResult;
  onChangeView: (view: ViewState) => void;
}

export const Analysis: React.FC<Props> = ({ result, onChangeView }) => {
  // Generate advice on mount (or here via useMemo)
  const advice = useMemo(() => {
      return generateAIAdvice(result.metrics, result.config.protocol);
  }, [result]);

  const handleSave = () => {
      saveResult({...result, aiAdvice: advice});
      alert("儲存成功！");
  };

  return (
    <div className="flex flex-col h-full space-y-4 pb-20">
       <div className="flex items-center justify-between">
         <Button variant="ghost" className="!p-2" onClick={() => onChangeView(ViewState.HOME)}>
            ← 返回
         </Button>
         <h2 className="text-xl font-bold text-slate-800">生物力學報告</h2>
         <Button variant="ghost" className="!p-2 text-primary border-primary/20" onClick={handleSave}>
            💾 儲存
         </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 px-1">
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
            <Card className="text-center !p-3 bg-white shadow-sm border-slate-100">
                <div className="text-slate-400 text-xs uppercase">跳躍高度</div>
                <div className="text-3xl font-black text-primary">{result.metrics.jumpHeight} <span className="text-sm font-normal text-slate-600">cm</span></div>
            </Card>
            <Card className="text-center !p-3 bg-white shadow-sm border-slate-100">
                <div className="text-slate-400 text-xs uppercase">騰空時間</div>
                <div className="text-3xl font-black text-slate-800">{result.metrics.flightTime} <span className="text-sm font-normal text-slate-400">ms</span></div>
            </Card>
            <Card className="text-center !p-3 bg-white shadow-sm border-slate-100">
                <div className="text-slate-400 text-xs uppercase">最大膝屈曲</div>
                <div className="text-3xl font-black text-secondary">{result.metrics.maxKneeFlexion}°</div>
            </Card>
             <Card className="text-center !p-3 bg-white shadow-sm border-slate-100">
                <div className="text-slate-400 text-xs uppercase">RSI 指數</div>
                <div className="text-3xl font-black text-slate-800">{result.metrics.rsi ?? '-'}</div>
            </Card>
        </div>

        {/* AI Advisor */}
        <Card title="AI 教練建議" className="border-l-4 border-l-secondary bg-emerald-50/50">
            <ul className="space-y-3">
                {advice.map((item, idx) => (
                    <li key={idx} className="flex items-start text-sm text-slate-700">
                        <span className="text-secondary mr-2">🤖</span>
                        {item}
                    </li>
                ))}
            </ul>
        </Card>

        {/* Charts */}
        <Card title="運動學分析 (膝關節角度)">
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.charts.kneeAngle}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="time" type="number" hide />
                        <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={10} />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b'}}
                            itemStyle={{color: '#0891b2'}}
                            labelStyle={{display: 'none'}}
                        />
                        <Line type="monotone" dataKey="value" stroke="#0891b2" strokeWidth={3} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-slate-400 mt-2">X軸: 時間 (s) | Y軸: 角度 (deg)</p>
        </Card>

        <Card title="動力學推估 (地面反作用力)">
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.charts.grf}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                         <XAxis dataKey="time" hide />
                        <YAxis stroke="#94a3b8" fontSize={10} />
                        <Tooltip 
                            contentStyle={{backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b'}}
                            itemStyle={{color: '#059669'}}
                            labelStyle={{display: 'none'}}
                        />
                        <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} dot={false} fill="#059669" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
             <p className="text-xs text-center text-slate-400 mt-2">基於體重與加速度推算 (Newtons)</p>
        </Card>
      </div>
    </div>
  );
};