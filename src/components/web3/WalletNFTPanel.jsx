import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/AuthContext";

const TARGET_CHAIN_ID = Number(import.meta.env.VITE_BASE_CHAIN_ID || 84532);
const CHAIN = TARGET_CHAIN_ID === 8453
  ? { chainId: "0x2105", chainName: "Base", rpcUrls: ["https://mainnet.base.org"], blockExplorerUrls: ["https://basescan.org"], nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 } }
  : { chainId: "0x14a34", chainName: "Base Sepolia", rpcUrls: ["https://sepolia.base.org"], blockExplorerUrls: ["https://sepolia.basescan.org"], nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 } };

const STATUS_LABELS = {
  PENDING_WALLET: "In attesa di collegare il wallet",
  QUEUED: "In coda per il mint",
  PROCESSING: "Mint in elaborazione",
  SUBMITTED: "Transazione inviata",
  MINTED: "NFT su Base",
  FAILED: "Mint da ritentare",
  NEEDS_REVIEW: "Verifica manuale necessaria",
};

export default function WalletNFTPanel() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    if (!user) return;
    const [{ data: walletData, error: walletError }, { data: jobData, error: jobError }] = await Promise.all([
      supabase.from("player_wallets").select("address,chain_id,status,verified_at").maybeSingle(),
      supabase.from("nft_mint_jobs").select("id,status,token_id,tx_hash,definition_index,serial_number,created_at").order("created_at", { ascending: false }).limit(100),
    ]);
    if (walletError) throw walletError;
    if (jobError) throw jobError;
    setWallet(walletData);
    setJobs(jobData || []);
  }, [user]);

  useEffect(() => {
    refresh().catch((err) => setError(err.message || "Impossibile caricare i dati Web3."));
  }, [refresh]);

  const connectWallet = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const provider = window.ethereum;
      if (!provider?.request) throw new Error("Installa o apri un wallet EVM compatibile, ad esempio MetaMask o Coinbase Wallet.");
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const address = String(accounts?.[0] || "").toLowerCase();
      if (!address) throw new Error("Nessun indirizzo wallet restituito.");

      try {
        await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN.chainId }] });
      } catch (switchError) {
        if (switchError?.code !== 4902) throw switchError;
        await provider.request({ method: "wallet_addEthereumChain", params: [CHAIN] });
      }

      const { data: challenge, error: challengeError } = await supabase.functions.invoke("wallet-link", {
        body: { action: "challenge", address, chainId: TARGET_CHAIN_ID, provider: "injected" },
      });
      if (challengeError) throw challengeError;

      const signature = await provider.request({
        method: "personal_sign",
        params: [challenge.message, address],
      });

      const { data: verification, error: verifyError } = await supabase.functions.invoke("wallet-link", {
        body: { action: "verify", address, chainId: TARGET_CHAIN_ID, challengeId: challenge.challengeId, signature, provider: "injected" },
      });
      if (verifyError) throw verifyError;
      if (!verification?.verified) throw new Error("Verifica wallet non riuscita.");

      setNotice("Wallet verificato. Le carte in attesa sono state messe in coda per il mint.");
      await refresh();
    } catch (err) {
      setError(err?.message || "Collegamento wallet non riuscito.");
    } finally {
      setBusy(false);
    }
  };

  const minted = jobs.filter((job) => job.status === "MINTED").length;
  const pending = jobs.filter((job) => job.status !== "MINTED").length;
  const explorer = TARGET_CHAIN_ID === 8453 ? "https://basescan.org" : "https://sepolia.basescan.org";

  return (
    <section className="rounded-3xl bg-white/5 border border-cyan-300/20 p-6 mb-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300 font-bold">Sognatori Web3</div>
          <h2 className="text-xl font-black mt-1">Wallet & NFT su Base</h2>
        </div>
        <span className="text-xs rounded-full px-3 py-1 bg-cyan-300/10 text-cyan-200 border border-cyan-300/20">
          {TARGET_CHAIN_ID === 8453 ? "Base Mainnet" : "Base Sepolia · Test"}
        </span>
      </div>

      <p className="text-sm text-slate-400 mb-4">
        Le carte si ottengono normalmente nel gioco. Il mint avviene progressivamente e solo dopo la verifica del wallet. Non serve collegare il wallet per continuare a giocare.
      </p>

      {wallet?.status === "VERIFIED" ? (
        <div className="rounded-2xl bg-black/20 border border-white/10 p-4 mb-4">
          <div className="text-xs text-slate-400 mb-1">Wallet verificato</div>
          <div className="font-mono text-sm break-all">{wallet.address}</div>
          <div className="text-xs text-emerald-300 mt-2">Rete: {wallet.chain_id === 8453 ? "Base" : "Base Sepolia"}</div>
        </div>
      ) : (
        <button onClick={connectWallet} disabled={busy} className="w-full sm:w-auto px-5 py-3 rounded-xl bg-cyan-300 text-slate-950 font-black disabled:opacity-50">
          {busy ? "Collegamento..." : "Collega e verifica wallet"}
        </button>
      )}

      {notice && <p className="text-sm text-emerald-300 mt-3">{notice}</p>}
      {error && <p className="text-sm text-rose-300 mt-3">{error}</p>}

      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="rounded-2xl bg-black/20 p-4">
          <div className="text-2xl font-black text-cyan-200">{minted}</div>
          <div className="text-xs text-slate-400">NFT confermati</div>
        </div>
        <div className="rounded-2xl bg-black/20 p-4">
          <div className="text-2xl font-black text-amber-200">{pending}</div>
          <div className="text-xs text-slate-400">In attesa / elaborazione</div>
        </div>
      </div>

      {jobs.length > 0 && (
        <div className="mt-5 space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">Ultime carte</h3>
            <button onClick={() => refresh().catch((err) => setError(err.message))} className="text-xs text-cyan-200 underline">Aggiorna</button>
          </div>
          {jobs.slice(0, 8).map((job) => (
            <div key={job.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm font-bold">Carta #{job.definition_index} · {String(job.serial_number).padStart(3, "0")}/100</div>
                <div className="text-xs text-slate-400">Token ID {job.token_id}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-xs ${job.status === "MINTED" ? "text-emerald-300" : "text-amber-200"}`}>{STATUS_LABELS[job.status] || job.status}</div>
                {job.status === "MINTED" && job.tx_hash && (
                  <a className="text-xs text-cyan-200 underline" href={`${explorer}/tx/${job.tx_hash}`} target="_blank" rel="noreferrer">Apri transazione</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-slate-500 mt-4">
        Il collegamento richiede una firma gratuita di verifica; non autorizza pagamenti né trasferimenti. In questa fase il wallet usa il provider EVM già installato sul dispositivo.
      </p>
    </section>
  );
}
