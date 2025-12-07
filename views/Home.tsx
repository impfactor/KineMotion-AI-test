import React from 'react';
import { ViewState, AnalysisResult } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { getHistory, clearHistory } from '../services/storageService';

interface Props {
  onChangeView: (view: ViewState) => void;
  onSelectResult: (result: AnalysisResult) => void;
}

export const Home: React.FC<Props> = ({ onChangeView, onSelectResult }) => {
  const [history, setHistory] = React.useState<AnalysisResult[]>([]);

  React.useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleDeleteHistory = () => {
      if(window.confirm("確定要刪除所有歷史紀錄嗎？")) {
          clearHistory();
          setHistory([]);
      }
  }

  return (
    <div className="flex flex-col h-full space-y-6 pb-20">
      <div className="text-center space-y-2 pt-8">
        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          KineMotion AI
        </h1>
        <p className="text-slate-500">專業運動表現評估與傷害預防</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Button onClick={() => onChangeView(ViewState.SETUP)} fullWidth>
          <div className="flex items-center justify-center space-x-2">
            <span>+</span>
            <span>新增測試</span>
          </div>
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex justify-between items-end mb-2 px-1">
            <h2 className="text-xl font-bold text-slate-800">歷史紀錄</h2>
            {history.length > 0 && (
                <button onClick={handleDeleteHistory} className="text-xs text-red-500 underline">清除</button>
            )}
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {history.length === 0 ? (
            <div className="text-center text-slate-400 py-10 border border-dashed border-slate-300 rounded-xl">
              尚無測試紀錄
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onSelectResult(item)}
                className="bg-white hover:bg-slate-50 transition-colors p-4 rounded-lg border-l-4 border-primary shadow-sm cursor-pointer active:scale-[0.99] border border-slate-100"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-0.5 rounded font-bold mb-1">
                      {item.config.protocol}
                    </span>
                    <p className="text-slate-800 font-medium">{new Date(item.date).toLocaleString('zh-TW')}</p>
                    <p className="text-slate-500 text-sm">
                      高度: <span className="text-slate-900 font-bold">{item.metrics.jumpHeight.toFixed(1)} cm</span>
                      {item.config.protocol === 'DJ' && ` | RSI: ${item.metrics.rsi?.toFixed(2)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">{item.user.id}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};