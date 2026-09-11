import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { LiveRecognition } from './pages/LiveRecognition';
import { Personalize } from './pages/Personalize';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { About } from './pages/About';
import type { SystemHealth, SettingsState } from './types';
import { fetchHealth } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [health, setHealth] = useState<SystemHealth>({
    status: 'checking',
    cnn_model_loaded: false,
    backend_connected: false,
    mediapipe_ready: false,
    inference_ready: false,
    classes_count: 36,
    personalization_active: false
  });

  const [settings, setSettings] = useState<SettingsState>({
    confidenceThreshold: 80,
    selectedCameraId: '',
    speechLanguage: 'en-US',
    speechRate: 1.0,
    enablePersonalization: true,
    showLandmarks: true,
    showBbox: true,
    showFps: true
  });

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    const h = await fetchHealth();
    setHealth(h);
  };

  return (
    <div className="flex min-h-screen bg-[#0A0E17] text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header health={health} activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {activeTab === 'home' && <Home setActiveTab={setActiveTab} />}
          {activeTab === 'live' && <LiveRecognition settings={settings} />}
          {activeTab === 'personalize' && <Personalize />}
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'settings' && <Settings settings={settings} setSettings={setSettings} />}
          {activeTab === 'about' && <About />}
        </main>
      </div>
    </div>
  );
}

export default App;
