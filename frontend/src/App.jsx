import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { apiRequest } from './lib/api';
import Home from './pages/Home';
import Admin from './pages/Admin';
import BoardRoom from './pages/BoardRoom';
import CandidateRoom from './pages/CandidateRoom';
import Join from './pages/Join';
import NotFound from './pages/NotFound';

function Header() {
  const [backendConnected, setBackendConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const data = await apiRequest('/health');
        if (isMounted) {
          setBackendConnected(data?.status === 'ok' && data?.db === 'ok');
        }
      } catch {
        if (isMounted) {
          setBackendConnected(false);
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="bg-gov-navy-950 text-white border-b border-gov-navy-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="text-base sm:text-lg font-semibold tracking-tight hover:text-gov-gray-200 transition-colors"
        >
          Recruitment &amp; Assessment Centre · Boardroom Simulator
        </Link>
        <div className="flex items-center">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
              backendConnected
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                : 'bg-rose-950 text-rose-300 border-rose-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full mr-1.5 ${
                backendConnected ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            {backendConnected ? 'Backend: connected' : 'Backend: not connected'}
          </span>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gov-gray-50">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/board/:code" element={<BoardRoom />} />
            <Route path="/candidate/:code" element={<CandidateRoom />} />
            <Route path="/board/:sessionId" element={<BoardRoom />} />
            <Route path="/candidate/:sessionId" element={<CandidateRoom />} />
            <Route path="/join" element={<Join />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
