
import { lazy, Suspense } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import ProtectedRoute from '@/components/ProtectedRoute';
import GlobalMusicPlayer from '@/components/game/GlobalMusicPlayer';
import { LanguageProvider } from '@/lib/i18n';
import { useLanguage } from '@/lib/i18n';
import TelegramAuthGate from '@/components/TelegramAuthGate';

const PageNotFound = lazy(() => import('./lib/PageNotFound'))
const Home = lazy(() => import('@/pages/Home'))
const Lore = lazy(() => import('@/pages/Lore'))
const TypeChart = lazy(() => import('@/pages/TypeChart'))
const Multiplayer = lazy(() => import('@/pages/Multiplayer'))
const Rankings = lazy(() => import('@/pages/Rankings'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const SognatoriStats = lazy(() => import('@/pages/SognatoriStats'))
const TestRandom = lazy(() => import('@/pages/TestRandom'))
const Profile = lazy(() => import('@/pages/Profile'))
const Avventura = lazy(() => import('@/pages/Avventura'))
const CooperativeCity14 = lazy(() => import('@/pages/CooperativeCity14'))
const Amargenta3D = lazy(() => import('@/pages/Amargenta3D'))

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
<Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-[#18221e] text-[#f4ead8]"><div className="text-center"><div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-[#d8b77d] border-t-transparent"/><p className="font-semibold tracking-wide">Caricamento...</p></div></div>}>
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
      </Suspense>
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