
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
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
import TestRandom from '@/pages/TestRandom';
import Profile from '@/pages/Profile';
import Avventura from '@/pages/Avventura';
import CooperativeCity14 from '@/pages/CooperativeCity14';
import Amargenta3D from '@/pages/Amargenta3D';
import TelegramAuthGate from '@/components/TelegramAuthGate';

const AuthenticatedApp = () => {
  const { user, isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const location = useLocation();
  // Arabnite è pubblica; Amargenta resta riservata all'account sviluppatore.
  const isArabnitePublicEntry = new URLSearchParams(location.search).get("world") === "arabnite";
  // I due mondi 3D sono riservati esclusivamente all'account Bibito.
  const canAccessAmargenta3D = String(user?.user_metadata?.username || "").trim().toLowerCase() === "bibito";
  const { lang, setLang, t } = useLanguage();

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
     <Routes>
      <Route path="/sognatori" element={<SognatoriStats />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
       <Route path="/" element={<Home />} />
        <Route path="/lore" element={<Lore />} />
        <Route path="/typechart" element={<TypeChart />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/multiplayer" element={<Multiplayer />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/test-random" element={<TestRandom />} />
           <Route path="/profilo" element={<Profile />} />
        </Route>
        <Route path="/avventura" element={<Avventura />} />
        <Route path="/avventura-coop" element={<CooperativeCity14 />} />
        <Route path="/amargenta-3d" element={isArabnitePublicEntry || canAccessAmargenta3D ? <Amargenta3D /> : (
          <div className="min-h-screen flex items-center justify-center bg-[#18221e] text-[#f4ead8] p-6">
            <div className="max-w-md text-center rounded-2xl border border-[#d8b77d66] bg-[#243229] p-8 shadow-2xl">
              <div className="text-4xl mb-4">🔒</div>
              <h1 className="text-2xl font-black tracking-wide text-[#e7c28c]">AMARGENTA</h1>
              <p className="mt-3 text-sm leading-6 text-[#e8ddc9]">La città segreta è custodita da un patto personale. L'accesso a questo prototipo 3D è riservato agli account autorizzati.</p>
              <a href="/avventura" className="inline-flex mt-6 rounded-xl border border-[#d8b77d] px-5 py-3 font-bold text-[#f4ead8] hover:bg-[#ffffff12]">Torna ad Avventura</a>
            </div>
          </div>
        )} />
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
            <TelegramAuthGate>
              <AuthenticatedApp />
            </TelegramAuthGate>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App