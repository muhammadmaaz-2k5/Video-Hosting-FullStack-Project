import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const PUBLIC_KEY = Deno.env.get("VITE_IMAGEKIT_PUBLIC_KEY") ?? "";
const PRIVATE_KEY = Deno.env.get("IMAGEKIT_PRIVATE_KEY") ?? "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    return new Response(
      JSON.stringify({ error: "ImageKit keys not configured" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const expiry = Math.floor(Date.now() / 1000) + 2400; // 40 minutes
  const token = crypto.randomUUID();

  // Signature = HMAC-SHA1(PRIVATE_KEY, expiry + token)
  const dataToSign = `${expiry}${token}`;
  const signature = await hmacSha1Hex(dataToSign, PRIVATE_KEY);

  return new Response(
    JSON.stringify({
      publicKey: PUBLIC_KEY,
      token,
      expiry,
      signature,
    }),
    { headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});

async function hmacSha1Hex(data: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
