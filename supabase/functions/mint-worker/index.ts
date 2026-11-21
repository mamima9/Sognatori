import { createClient } from "npm:@supabase/supabase-js@2";
import {
  createPublicClient,
  createWalletClient,
  http,
  getAddress,
  defineChain,
  privateKeyToAccount,
} from "npm:viem@2";
import { base, baseSepolia } from "npm:viem@2/chains";

const ABI = [
  { type: "function", name: "mintCard", stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "definitionIndex", type: "uint8" },
      { name: "serialNumber", type: "uint8" },
    ], outputs: [{ name: "tokenId", type: "uint256" }] },
  { type: "function", name: "ownerOf", stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "address" }] },
] as const;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const secret = Deno.env.get("MINT_WORKER_SECRET");
  if (!secret || req.headers.get("x-mint-worker-secret") !== secret) {
    return json({ error: "UNAUTHORIZED" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const contractAddress = getAddress(Deno.env.get("NFT_CONTRACT_ADDRESS")!);
  const account = privateKeyToAccount(Deno.env.get("NFT_MINTER_PRIVATE_KEY") as `0x${string}`);
  const batchSize = Math.min(Math.max(Number((await req.json().catch(() => ({}))).limit ?? 10), 1), 25);

  const { data: jobs, error: claimError } = await supabase.rpc("nft_claim_mint_jobs", { p_limit: batchSize });
  if (claimError) return json({ error: "QUEUE_CLAIM_FAILED", detail: claimError.message }, 500);

  const results = [];
  for (const job of jobs ?? []) {
    try {
      const isMainnet = Number(job.chain_id) === 8453;
      const chain = isMainnet ? base : baseSepolia;
      const rpcUrl = Deno.env.get(isMainnet ? "BASE_MAINNET_RPC_URL" : "BASE_SEPOLIA_RPC_URL");
      if (!rpcUrl) throw new Error("MISSING_BASE_RPC_URL");

      const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
      const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });
      const tokenId = BigInt(job.token_id);
      const recipient = getAddress(job.recipient_address);

      // Idempotency: a previous attempt may have mined successfully but timed out before DB confirmation.
      let currentOwner: string | null = null;
      try {
        currentOwner = await publicClient.readContract({
          address: contractAddress, abi: ABI, functionName: "ownerOf", args: [tokenId],
        });
      } catch {
        currentOwner = null; // ERC-721 ownerOf reverts when the token has not been minted.
      }

      let txHash: `0x${string}` | null = null;
      if (currentOwner) {
        if (currentOwner.toLowerCase() !== recipient.toLowerCase()) {
          await supabase.from("nft_mint_jobs").update({
            status: "NEEDS_REVIEW",
            last_error: "TOKEN_ALREADY_MINTED_TO_DIFFERENT_OWNER",
            updated_at: new Date().toISOString(),
          }).eq("id", job.id);
          results.push({ id: job.id, status: "NEEDS_REVIEW" });
          continue;
        }
      } else {
        txHash = await walletClient.writeContract({
          address: contractAddress,
          abi: ABI,
          functionName: "mintCard",
          args: [recipient, Number(job.definition_index), Number(job.serial_number)],
        });
        await supabase.from("nft_mint_jobs").update({
          status: "SUBMITTED", tx_hash: txHash, updated_at: new Date().toISOString(),
        }).eq("id", job.id);

        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, confirmations: 2 });
        if (receipt.status !== "success") throw new Error("MINT_TRANSACTION_REVERTED");
      }

      const confirmedOwner = await publicClient.readContract({
        address: contractAddress, abi: ABI, functionName: "ownerOf", args: [tokenId],
      });
      if (confirmedOwner.toLowerCase() !== recipient.toLowerCase()) {
        throw new Error("ONCHAIN_OWNER_MISMATCH");
      }

      const { error: finishError } = await supabase.from("nft_mint_jobs").update({
        status: "MINTED",
        tx_hash: txHash,
        minted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_error: null,
      }).eq("id", job.id);
      if (finishError) throw finishError;
      results.push({ id: job.id, status: "MINTED", txHash });
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNKNOWN_MINT_ERROR";
      const terminal = Number(job.attempt_count) >= 8;
      const delayMinutes = Math.min(2 ** Number(job.attempt_count), 360);
      await supabase.from("nft_mint_jobs").update({
        status: terminal ? "NEEDS_REVIEW" : "FAILED",
        next_attempt_at: new Date(Date.now() + delayMinutes * 60_000).toISOString(),
        last_error: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      }).eq("id", job.id);
      results.push({ id: job.id, status: terminal ? "NEEDS_REVIEW" : "FAILED", error: message });
    }
  }

  return json({ processed: results.length, results });
});
