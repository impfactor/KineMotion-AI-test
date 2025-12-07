import React, { useState } from 'react';
import { ViewState, UserProfile, TestConfig, AnalysisResult } from './types';
import { Home } from './views/Home';
import { Setup } from './views/Setup';
import { Capture } from './views/Capture';
import { Analysis } from './views/Analysis';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentConfig, setCurrentConfig] = useState<TestConfig | null>(null);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);

  // View Router Logic
  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return (
          <Home 
            onChangeView={setCurrentView} 
            onSelectResult={(result) => {
                setCurrentResult(result);
                setCurrentView(ViewState.ANALYSIS);
            }}
          />
        );
      
      case ViewState.SETUP:
        return (
          <Setup 
            onChangeView={setCurrentView}
            onConfigComplete={(user, config) => {
              setCurrentUser(user);
              setCurrentConfig(config);
            }}
          />
        );
      
      case ViewState.CAPTURE:
        if (!currentUser || !currentConfig) return <div className="p-10">Error: Missing config</div>;
        return (
          <Capture 
            user={currentUser}
            config={currentConfig}
            onChangeView={setCurrentView}
            onAnalysisComplete={(result) => {
                setCurrentResult(result);
            }}
          />
        );
      
      case ViewState.ANALYSIS:
        if (!currentResult) return <div className="p-10">Error: Missing Results</div>;
        return (
          <Analysis 
            result={currentResult}
            onChangeView={setCurrentView}
          />
        );
      
      default:
        return <Home onChangeView={setCurrentView} onSelectResult={() => {}} />;
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 text-slate-800 overflow-hidden font-sans">
      <main className="h-full max-w-md mx-auto relative bg-slate-50 md:border-x md:border-gray-200 shadow-2xl">
         <div className="h-full p-4 overflow-hidden">
            {renderView()}
         </div>
      </main>
    </div>
  );
};

export default App;