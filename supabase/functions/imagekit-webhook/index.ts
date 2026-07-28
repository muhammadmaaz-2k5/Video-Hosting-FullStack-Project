import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Imagekit-Signature, X-Imagekit-Timestamp",
};

const WEBHOOK_SECRET = Deno.env.get("IMAGEKIT_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Verify webhook signature (if secret is configured)
    const signature = req.headers.get("X-Imagekit-Signature") ?? "";
    const timestamp = req.headers.get("X-Imagekit-Timestamp") ?? "";

    const body = await req.text();

    if (WEBHOOK_SECRET) {
      if (!signature || !timestamp) {
        return new Response(
          JSON.stringify({ error: "Missing signature headers" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      // Validate timestamp (reject if older than 5 minutes)
      const now = Math.floor(Date.now() / 1000);
      const ts = parseInt(timestamp, 10);
      if (isNaN(ts) || Math.abs(now - ts) > 300) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired timestamp" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      // Verify HMAC-SHA1 signature
      const expectedSignature = await hmacSha1Hex(body + timestamp, WEBHOOK_SECRET);
      if (signature !== expectedSignature) {
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
    }

    const event = JSON.parse(body);
    const eventType = event.type ?? event.event ?? "unknown";
    const data = event.data ?? event;

    // Initialize Supabase admin client
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Extract media info from the webhook payload
    const fileId: string | undefined = data.fileId ?? data.file_id;
    const name: string | undefined = data.name ?? data.fileName;
    const url: string | undefined = data.url ?? data.filePath;
    const thumbnailUrl: string | undefined = data.thumbnailUrl ?? data.thumbnail;
    const fileType: string | undefined = data.type ?? data.fileType;
    const height: number | undefined = data.height;
    const width: number | undefined = data.width;
    const size: number | undefined = data.size ?? data.fileSize;

    // Match the webhook to an existing video/image row by storage_path or metadata
    // The app stores the source URL in storage_path when cloning/uploading

    // Try to find a matching video record
    if (url) {
      const { data: video } = await supabase
        .from("videos")
        .select("id, status, title")
        .or(`storage_path.ilike.%${url}%,storage_path.ilike.%${fileId ?? url}%`)
        .limit(1)
        .single();

      if (video) {
        const update: Record<string, unknown> = { status: "ready", updated_at: new Date().toISOString() };
        if (thumbnailUrl) update.poster_url = thumbnailUrl;
        if (size) update.size_bytes = size;

        await supabase.from("videos").update(update).eq("id", video.id);

        // Log activity
        await supabase.from("activity").insert({
          type: "upload",
          message: `Video "${video.title}" finished processing`,
          meta: { source: "imagekit", event: eventType, fileId },
        });

        return new Response(
          JSON.stringify({ success: true, action: "video_ready", id: video.id }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      // Try images table
      const { data: image } = await supabase
        .from("images")
        .select("id, status, title")
        .or(`storage_path.ilike.%${url}%,storage_path.ilike.%${fileId ?? url}%`)
        .limit(1)
        .single();

      if (image) {
        const update: Record<string, unknown> = { status: "ready", updated_at: new Date().toISOString() };
        if (thumbnailUrl) update.thumbnail_url = thumbnailUrl;
        if (size) update.size_bytes = size;

        await supabase.from("images").update(update).eq("id", image.id);

        return new Response(
          JSON.stringify({ success: true, action: "image_ready", id: image.id }),
          { headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
    }

    // Generic event — just acknowledge
    return new Response(
      JSON.stringify({
        success: true,
        action: "acknowledged",
        event: eventType,
        name,
        fileType,
        dimensions: width && height ? `${width}x${height}` : null,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
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
