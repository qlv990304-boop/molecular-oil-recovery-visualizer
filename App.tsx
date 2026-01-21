import React, { useState, useCallback } from 'react';
import { Layout } from './components/Layout';
import { VisualPanel } from './components/VisualPanel';
import { ExplanationPanel } from './components/ExplanationPanel';
import { generateExplanationAndPrompt } from './services/geminiService';
import { VisualState, TextState, SimulationConfig } from './types';

const DEFAULT_TOPIC = "计秉玉分子采油原理 (Ji Bingyu Molecular Oil Recovery)";

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>(DEFAULT_TOPIC);
  const [baseConfig, setBaseConfig] = useState<SimulationConfig | null>(null);
  const [visualState, setVisualState] = useState<VisualState>({
    isLoading: false,
    config: null,
    error: null,
  });
  const [textState, setTextState] = useState<TextState>({
    isLoading: false,
    content: null,
    error: null
  });

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;

    setTextState({ isLoading: true, content: null, error: null });
    setVisualState({ isLoading: true, config: null, error: null });
    setBaseConfig(null);

    try {
      const { explanation, simulationParams } = await generateExplanationAndPrompt(topic);
      
      setTextState({ isLoading: false, content: explanation, error: null });
      setBaseConfig(simulationParams);
      setVisualState({ isLoading: false, config: simulationParams, error: null });

    } catch (err: any) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setTextState(prev => ({ ...prev, isLoading: false, error: prev.error || errorMessage }));
      setVisualState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
    }
  }, [topic]);

  // Create derived configs
  const wettabilityConfig = baseConfig ? { ...baseConfig, mechanism: 'wettability' } as SimulationConfig : null;
  const tensionConfig = baseConfig ? { ...baseConfig, mechanism: 'tension' } as SimulationConfig : null;
  const emulsificationConfig = baseConfig ? { ...baseConfig, mechanism: 'emulsification' } as SimulationConfig : null;

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[calc(100vh-140px)]">
        {/* Left Column: Text & Input */}
        <div className="lg:col-span-1 flex flex-col space-y-4 h-full">
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Topic</h2>
            <div className="flex flex-col gap-2">
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={handleGenerate}
                disabled={visualState.isLoading || textState.isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-5 py-2.5 transition-colors disabled:bg-slate-400"
              >
                {visualState.isLoading ? 'Generating...' : 'Start Simulation'}
              </button>
            </div>
          </div>
          <div className="flex-grow overflow-hidden">
             <ExplanationPanel content={textState.content} isLoading={textState.isLoading} />
          </div>
        </div>

        {/* Right Column: 3 Vertical Panels */}
        <div className="lg:col-span-2 grid grid-rows-3 gap-4 h-full">
           <div className="relative">
             <VisualPanel 
                config={wettabilityConfig} 
                isLoading={visualState.isLoading} 
                label="Mechanism 1: Wettability Alteration (润湿性改变)"
                description="Surfactants form a film on the rock surface, causing viscous oil (initially stuck) to detach and slide off."
             />
           </div>
           <div className="relative">
             <VisualPanel 
                config={tensionConfig} 
                isLoading={visualState.isLoading}
                label="Mechanism 2: Interfacial Tension Reduction (界面张力降低)"
                description="Oil droplets deform and squeeze through narrow rock pore throats due to reduced surface tension."
             />
           </div>
           <div className="relative">
             <VisualPanel 
                config={emulsificationConfig} 
                isLoading={visualState.isLoading}
                label="Mechanism 3: Emulsification & Stripping (乳化与剥离)"
                description="Active molecules attack large oil blobs, breaking them into tiny emulsified droplets that flow easily."
             />
           </div>
        </div>
      </div>
    </Layout>
  );
};

export default App;