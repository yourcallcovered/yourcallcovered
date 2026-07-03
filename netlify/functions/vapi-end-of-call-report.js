exports.handler = async (event) => {
  try {
    const payload = JSON.parse(event.body || "{}");
    const call = payload?.message?.call || payload?.call || payload;
    const summary = call?.analysis?.summary || "(No summary available)";
    const callerNumber = call?.customer?.number || "(unknown)";
    const startedAt = call?.startedAt || null;
    const endedAt = call?.endedAt || null;
    const durationSeconds = startedAt && endedAt
      ? Math.max(0, Math.round((new Date(endedAt) - new Date(startedAt)) / 1000))
      : null;
    const subject = `New Call — YourCallCovered — ${callerNumber}`;
    const text = [
      `Caller: ${callerNumber}`,
      startedAt ? `Time: ${startedAt}` : null,
      durationSeconds != null ? `Duration: ${durationSeconds} seconds` : null,
      ``,
      `Summary:`,
      summary
    ].filter(Boolean).join("\n");
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const TO_EMAIL = "yourcallcovered@gmail.com";
    const FROM_EMAIL = process.env.FROM_EMAIL;
    if (!SENDGRID_API_KEY || !FROM_EMAIL) {
      return { statusCode: 500, body: "Missing env vars" };
    }
    const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: TO_EMAIL }], subject }],
        from: { email: FROM_EMAIL },
        content: [{ type: "text/plain", value: text }]
      })
    });
    if (!resp.ok) {
      const errText = await resp.text();
      return { statusCode: 500, body: `SendGrid error: ${resp.status} ${errText}` };
    }
    return { statusCode: 200, body: "ok" };
  } catch (e) {
    return { statusCode: 500, body: `Error: ${e.message}` };
  }
};
