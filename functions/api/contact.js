// functions/api/contact.js
export async function onRequestOptions(context) {
  const origin = context.request.headers.get("Origin") || "*";
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function onRequestPost(context) {
  const { request } = context;
  const origin = request.headers.get("Origin") || "*";

  const TO_EMAIL = "jaa.marcelin@gmail.com";
  const FROM_DOMAIN = "les-ateliers-du-coeur.com";
  const ALLOWED_ORIGIN = "https://les-ateliers-du-coeur.com";

  if (origin !== "null" && ALLOWED_ORIGIN && origin !== ALLOWED_ORIGIN) {
    return json({ ok: false, error: "Origin not allowed" }, 403, origin);
  }

  if (!(request.headers.get("content-type") || "").includes("application/json")) {
    return json({ ok: false, error: "Invalid content-type" }, 400, origin);
  }

  let data;
  try { data = await request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400, origin); }

  if (typeof data.website === "string" && data.website.trim() !== "") {
    return json({ ok: true, flagged: true }, 200, origin);
  }

  const nom = (data.nom || "").trim();
  const email = (data.email || "").trim();
  const message = (data.message || "").trim();
  const consent = Boolean(data.consent);

  if (!nom || !email || !message || !consent) return json({ ok: false, error: "Missing fields" }, 422, origin);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: "Invalid email" }, 422, origin);

  const payload = {
    personalizations: [{ to: [{ email: TO_EMAIL }] }],
    from: { email: `webform@${FROM_DOMAIN}`, name: "Formulaire — Les Ateliers du Cœur" },
    reply_to: { email, name: nom },
    subject: "Nouveau message — Les Ateliers du Cœur",
    content: [{ type: "text/plain", value: `Nom: ${nom}\nEmail: ${email}\nConsentement: ${consent ? "oui" : "non"}\n\nMessage:\n${message}` }]
  };

  try {
    const resp = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      const details = await resp.text();
      return json({ ok: false, error: "Mail relay failed", details }, 502, origin);
    }
    return json({ ok: true }, 200, origin);
  } catch {
    return json({ ok: false, error: "Network error" }, 500, origin);
  }
}

function corsHeaders(origin) {
  return new Headers({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8"
  });
}
function json(obj, status = 200, origin = "*") {
  return new Response(JSON.stringify(obj), { status, headers: corsHeaders(origin) });
}
