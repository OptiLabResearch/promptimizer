export async function onRequestPost({ request, env }) {
  if (!env.ANALYTICS) {
    return json({ ok: false, error: "Analytics Engine binding 'ANALYTICS' is not configured." }, 500);
  }

  try {
    const body = await request.json();
    const { event, sessionId, visitorId, pasteToCopyTime } = body;

    if (!event) {
      return json({ ok: false, error: "Missing required parameter: event" }, 400);
    }

    env.ANALYTICS.writeDataPoint({
      blobs: [
        String(event).substring(0, 100),
        String(sessionId || "").substring(0, 100),
        String(visitorId || "").substring(0, 100),
      ],
      doubles: [
        typeof pasteToCopyTime === 'number' ? pasteToCopyTime : 0,
      ],
      indexes: [
        String(visitorId || "").substring(0, 96),
      ]
    });

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
