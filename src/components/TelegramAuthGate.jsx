import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

export default function TelegramAuthGate({ children }) {
  const { loginWithTelegramToken } = useAuth();
  const [telegram, setTelegram] = useState(null);
  const [mode, setMode] = useState("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    const initData = webApp?.initData;

    if (!initData) {
      setMode("web");
      return;
    }

    webApp.ready();
    webApp.expand();
    setTelegram({ initData, webApp });

    let active = true;

    const checkTelegramAccount = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "telegram-auth",
          { body: { initData, action: "status" } }
        );

        if (error) throw error;
        if (!active) return;

        if (data?.linked && data?.email && data?.token_hash) {
          await loginWithTelegramToken({
            email: data.email,
            token_hash: data.token_hash,
            type: data.type || "magiclink",
          });
          if (active) setMode("ready");
        } else {
          setMode("choose");
        }
      } catch (err) {
        console.error("Telegram account check:", err);
        if (active) {
          setError("Non riesco a verificare il collegamento Telegram. Puoi comunque scegliere come accedere.");
          setMode("choose");
        }
      }
    };

    checkTelegramAccount();

    return () => {
      active = false;
    };
    // Esegui il controllo una sola volta quando il Mini App viene aperto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const linkExistingAccount = async (session) => {
    const { data, error } = await supabase.functions.invoke(
      "telegram-auth",
      {
        body: {
          initData: telegram.initData,
          action: "link",
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (error) throw error;
    if (!data?.success) {
      throw new Error(data?.error || "Collegamento non riuscito");
    }
  };

  const handleExistingAccount = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      let session = (await supabase.auth.getSession()).data.session;

      if (!session) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        session = data.session;
      }

      if (!session) throw new Error("Sessione Sognatori non disponibile");

      await linkExistingAccount(session);
      setMessage("Account collegato! Benvenuto su Sognatori.");
      setMode("ready");
    } catch (err) {
      setError(err.message || "Accesso non riuscito");
    } finally {
      setBusy(false);
    }
  };

  const handleNewAccount = async () => {
    setBusy(true);
    setError("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "telegram-auth",
        {
          body: {
            initData: telegram.initData,
            action: "login",
          },
        }
      );

      if (error) throw error;
      if (!data?.success || !data?.email || !data?.token_hash) {
        throw new Error(data?.error || "Creazione account non riuscita");
      }

      await loginWithTelegramToken({
        email: data.email,
        token_hash: data.token_hash,
        type: data.type || "magiclink",
      });

      setMode("ready");
    } catch (err) {
      setError(err.message || "Non è stato possibile creare l'account");
    } finally {
      setBusy(false);
    }
  };

  if (mode === "web" || mode === "ready") {
    return (
      <>
        {message && (
          <div className="fixed top-4 left-1/2 z-[100] -translate-x-1/2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
            {message}
          </div>
        )}
        {children}
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black px-5 py-8 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#151515] p-6 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mb-3 text-4xl">🌙</div>
          <h1 className="text-3xl font-black tracking-wide">SOGNATORI</h1>
          <p className="mt-2 text-sm text-white/65">
            {mode === "loading"
              ? "Stiamo verificando il tuo account..."
              : "Accedi al tuo mondo di Sognatori"}
          </p>
        </div>

        {mode === "loading" ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {mode === "choose" && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setMode("existing");
                  }}
                  className="w-full rounded-xl bg-white px-4 py-4 font-bold text-black transition hover:bg-gray-200"
                  disabled={busy}
                >
                  HO GIÀ UN ACCOUNT
                  <span className="mt-1 block text-xs font-normal text-black/60">
                    Collega il tuo profilo e conserva i progressi
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleNewAccount}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-4 font-bold text-white transition hover:bg-white/15"
                  disabled={busy}
                >
                  SONO UN NUOVO GIOCATORE
                  <span className="mt-1 block text-xs font-normal text-white/60">
                    Crea automaticamente il tuo account
                  </span>
                </button>
              </div>
            )}

            {mode === "existing" && (
              <form onSubmit={handleExistingAccount} className="space-y-4">
                <label className="block text-sm font-medium">
                  Email
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-black px-3 py-3 text-white outline-none focus:border-white/60"
                    placeholder="La tua email Sognatori"
                  />
                </label>

                <label className="block text-sm font-medium">
                  Password
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/20 bg-black px-3 py-3 text-white outline-none focus:border-white/60"
                    placeholder="La tua password"
                  />
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl bg-white px-4 py-3 font-bold text-black disabled:opacity-50"
                >
                  {busy ? "COLLEGAMENTO..." : "ACCEDI E COLLEGA TELEGRAM"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setMode("choose");
                  }}
                  className="w-full py-2 text-sm text-white/60 hover:text-white"
                >
                  Indietro
                </button>
              </form>
            )}

            {busy && mode === "choose" && (
              <p className="mt-4 text-center text-sm text-white/60">
                Preparazione account in corso...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
