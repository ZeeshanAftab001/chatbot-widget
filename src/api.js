const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const DEFAULT_CONFIG = {
  name: "Sentra AI",
  welcome: "Hi, I'm Sentra. Ask me anything about this site.",
  placeholder: "Ask a question",
  launcherLabel: "Ask Sentra",
  primaryColor: "#3b3fd8",
  theme: "light", // light | dark | auto
  position: "right", // right | left
  suggestions: [],
  branding: true,
};

async function* mockStream(message, signal) {
  const text = `This is a **demo reply** from mock mode.\n\nYou asked: "${message}"\n\n- Answers will come from your knowledge base\n- Sources appear under each answer`;
  for (const part of text.split(/(\s+)/)) {
    if (signal?.aborted) return;
    await sleep(25);
    yield { delta: part };
  }
  yield { sources: [{ title: "Example source", url: "https://example.com" }] };
}

export function createApi({ apiUrl, siteKey, mock }) {
  let token = null;
  let identity = null;
  let convId = null;

  async function request(path, opts = {}, retried = false) {
    const res = await fetch(apiUrl + path, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        "X-Sentra-Site-Key": siteKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    // Session token expired: get a new one and retry once
    if (res.status === 401 && token && !retried) {
      await api.startSession(convId);
      return request(path, opts, true);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  }

  const api = {
    async getConfig() {
      if (mock) return {};
      return (await request("/v1/config")).json();
    },
    async startSession(conversationId) {
      convId = conversationId;
      if (mock) return;
      token = null;
      const res = await request("/v1/session", {
        method: "POST",
        body: JSON.stringify({ conversationId, identity }),
      });
      token = (await res.json()).token;
    },
    async identify(next) {
      identity = next; // e.g. { token: "<JWT signed by the host site>" }
      if (convId && !mock) await api.startSession(convId);
    },
    // Yields events: { delta } | { sources: [{title,url}] } | { error }
    async *chat({ conversationId, message, context, signal }) {
      if (mock) return yield* mockStream(message, signal);
      const res = await request("/v1/chat", {
        method: "POST",
        signal,
        body: JSON.stringify({ conversationId, message, context }),
      });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) return;
        buf += dec.decode(value, { stream: true });
        const frames = buf.split("\n\n");
        buf = frames.pop();
        for (const f of frames) {
          const line = f.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") return;
          try { yield JSON.parse(payload); } catch { /* ignore malformed frame */ }
        }
      }
    },
  };
  return api;
}
