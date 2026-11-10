const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Curilens-Token",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/heic", "image/heif"];
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function readToken(req: Request): string | null {
  const explicit = req.headers.get("X-Curilens-Token");
  if (explicit) return explicit.trim();
  const auth = req.headers.get("Authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method === "GET") {
    return json({ status: "ok", service: "curilens-share" });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceHeaders = {
      "Authorization": `Bearer ${serviceRoleKey}`,
      "apikey": serviceRoleKey,
    };

    const token = readToken(req);
    if (!token || !token.startsWith("cl_")) {
      return json({ error: "Missing or invalid connection token." }, 401);
    }

    const tokenHash = await sha256Hex(token);
    const tokenLookup = await fetch(
      `${supabaseUrl}/rest/v1/intake_tokens?select=id,user_id&token_hash=eq.${tokenHash}&revoked_at=is.null&limit=1`,
      { headers: serviceHeaders }
    );
    if (!tokenLookup.ok) {
      return json({ error: "Could not verify connection token." }, 500);
    }
    const tokenRows = await tokenLookup.json();
    const intake = tokenRows[0];
    if (!intake) {
      return json({ error: "Connection token is invalid or has been revoked." }, 401);
    }

    await fetch(`${supabaseUrl}/rest/v1/intake_tokens?id=eq.${intake.id}`, {
      method: "PATCH",
      headers: { ...serviceHeaders, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify({ last_used_at: new Date().toISOString() }),
    });

    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return json({ error: "No image provided. Expected multipart/form-data with an 'image' field." }, 400);
    }

    if (!ACCEPTED_TYPES.includes(imageFile.type)) {
      return json({ error: "Unsupported file type. Accepted: PNG, JPEG, WebP, HEIC." }, 400);
    }

    if (imageFile.size > MAX_FILE_SIZE) {
      return json({ error: "File too large. Maximum size is 10MB." }, 400);
    }

    const ext = EXTENSION_BY_TYPE[imageFile.type] || "png";
    const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const storagePath = `${intake.user_id}/${fileName}`;

    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/screenshots/${storagePath}`,
      {
        method: "POST",
        headers: { ...serviceHeaders, "Content-Type": imageFile.type },
        body: imageFile,
      }
    );

    if (!uploadResponse.ok) {
      return json({ error: "Failed to store screenshot." }, 500);
    }

    const createResponse = await fetch(`${supabaseUrl}/rest/v1/analyses`, {
      method: "POST",
      headers: {
        ...serviceHeaders,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        user_id: intake.user_id,
        image_path: storagePath,
        status: "pending",
      }),
    });

    if (!createResponse.ok) {
      return json({ error: "Failed to create analysis record." }, 500);
    }

    const [analysis] = await createResponse.json();
    const analysisId = analysis.id;

    EdgeRuntime.waitUntil(
      fetch(`${supabaseUrl}/functions/v1/analyze`, {
        method: "POST",
        headers: { ...serviceHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, imagePath: storagePath }),
      }).catch(() => undefined)
    );

    return json({ analysisId, status: "processing" });
  } catch {
    return json({ error: "Internal server error" }, 500);
  }
});
