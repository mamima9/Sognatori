import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyMessage, isAddress, getAddress } from "npm:viem@2";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return response({ error: "METHOD_NOT_ALLOWED" }, 405);

  const authorization = req.headers.get("Authorization") ?? "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "");
  if (!accessToken) return response({ error: "AUTH_REQUIRED" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authClient = createClient(supabaseUrl, anonKey);
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: { user }, error: authError } = await authClient.auth.getUser(accessToken);
  if (authError || !user) return response({ error: "AUTH_REQUIRED" }, 401);

  try {
    const body = await req.json();
    const action = String(body.action ?? "");
    const address = String(body.address ?? "").toLowerCase();
    const chainId = Number(body.chainId);

    if (!isAddress(address) || ![8453, 84532].includes(chainId)) {
      return response({ error: "INVALID_WALLET_OR_CHAIN" }, 400);
    }

    if (action === "challenge") {
      const challengeId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
      const message = [
        "Sognatori wallet verification",
        `User: ${user.id}`,
        `Address: ${address}`,
        `Chain ID: ${chainId}`,
        `Challenge: ${challengeId}`,
        `Expires: ${expiresAt}`,
        "This signature links this wallet to your Sognatori account. It does not authorize transactions.",
      ].join("\n");

      const { error } = await admin.from("nft_wallet_challenges").insert({
        id: challengeId,
        user_id: user.id,
        address,
        chain_id: chainId,
        message,
        expires_at: expiresAt,
      });
      if (error) throw error;
      return response({ challengeId, message, expiresAt });
    }

    if (action === "verify") {
      const challengeId = String(body.challengeId ?? "");
      const signature = String(body.signature ?? "");
      if (!challengeId || !signature) return response({ error: "MISSING_SIGNATURE" }, 400);

      const { data: challenge, error } = await admin
        .from("nft_wallet_challenges")
        .select("*")
        .eq("id", challengeId)
        .eq("user_id", user.id)
        .is("consumed_at", null)
        .maybeSingle();
      if (error) throw error;
      if (!challenge || new Date(challenge.expires_at).getTime() <= Date.now()) {
        return response({ error: "CHALLENGE_EXPIRED_OR_USED" }, 400);
      }
      if (challenge.address !== address || challenge.chain_id !== chainId) {
        return response({ error: "CHALLENGE_WALLET_MISMATCH" }, 400);
      }

      const valid = await verifyMessage({
        address: getAddress(address),
        message: challenge.message,
        signature: signature as `0x${string}`,
      });
      if (!valid) return response({ error: "INVALID_SIGNATURE" }, 401);

      const { error: consumeError } = await admin
        .from("nft_wallet_challenges")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", challengeId)
        .is("consumed_at", null);
      if (consumeError) throw consumeError;

      const { error: walletError } = await admin.from("player_wallets").upsert({
        user_id: user.id,
        address,
        chain_id: chainId,
        provider: String(body.provider ?? "injected").slice(0, 40),
        status: "VERIFIED",
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (walletError) throw walletError;

      return response({ verified: true, address, chainId });
    }

    return response({ error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    console.error("wallet-link error", error);
    return response({ error: "INTERNAL_ERROR" }, 500);
  }
});
