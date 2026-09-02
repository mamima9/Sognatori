import { useState } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Home from '@/pages/Home';
import Lore from '@/pages/Lore';
import TypeChart from '@/pages/TypeChart';
import Multiplayer from '@/pages/Multiplayer';
import Rankings from '@/pages/Rankings';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import GlobalMusicPlayer from '@/components/game/GlobalMusicPlayer';
import { LanguageProvider } from '@/lib/i18n';
import { useLanguage } from '@/lib/i18n';
import SognatoriStats from '@/pages/SognatoriStats';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [isAuction, setIsAuction] = useState(false);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Render the main app
 return (
    <>
    {!isAuction && (
  <div className="fixed bottom-2 left-2 z-[101] flex items-center gap-1 rounded-full bg-slate-900/90 backdrop-blur border border-white/10 shadow-lg px-2 py-1.5">
    <span className="text-[9px] text-slate-400 uppercase tracking-widest mr-1">
      {t("home.language")}
    </span>

    <button
      onClick={() => setLang("it")}
      className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${
        lang === "it"
          ? "bg-amber-500 text-slate-950"
          : "bg-white/10 text-slate-300 hover:bg-white/20"
      }`}
    >
      IT
    </button>

    <button
      onClick={() => setLang("en")}
      className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${
        lang === "en"
          ? "bg-amber-500 text-slate-950"
          : "bg-white/10 text-slate-300 hover:bg-white/20"
      }`}
    >
      EN
    </button>
  </div>
)}  
     

      <Routes>
      <Route path="/sognatori" element={<SognatoriStats />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
  path="/"
  element={<Home onAuctionChange={setIsAuction} />}
/>
        <Route path="/lore" element={<Lore />} />
        <Route path="/typechart" element={<TypeChart />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/multiplayer" element={<Multiplayer />} />
          <Route path="/rankings" element={<Rankings />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <GlobalMusicPlayer />
    </>
  );
};


function App() {

  return (
    <LanguageProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App