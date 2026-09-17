import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const TESTER_EMAILS = [
  // INSERISCI QUI LE EMAIL DEI TESTER
  "bibitoeuro@gmail.com",
];

export default function Avventura() {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Caricamento...
      </div>
    );
  }

  // Non loggato
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Controllo tester
  const isTester = TESTER_EMAILS.includes(
    user.email?.toLowerCase()
  );

  if (!isTester) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="text-4xl font-black mb-4">
        🌍 AVVENTURA
      </div>

      <div className="text-slate-400">
        Area privata per i tester
      </div>

      <div className="mt-8 px-6 py-4 rounded-xl border border-white/10 bg-white/5">
        Mondo di Sognatori — TEST BUILD
      </div>
    </div>
  );
}