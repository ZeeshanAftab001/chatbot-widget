import { useState, useEffect, useRef } from "preact/hooks";
import { DEFAULT_CONFIG } from "./api.js";
import { renderMarkdown } from "./markdown.js";

const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

const svg = (d) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>
);
const XIcon = () => svg(<path d="M18 6 6 18M6 6l12 12" />);
const PlusIcon = () => svg(<path d="M12 5v14M5 12h14" />);
const SendIcon = () => svg(<path d="M12 19V5M5 12l7-7 7 7" />);
const StopIcon = () => svg(<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />);

export function App({ api, siteKey, controller, overrides }) {
  const convKey = `sentra:${siteKey}:conv`;
  const msgKey = `sentra:${siteKey}:msgs`;

  const [cfg, setCfg] = useState({ ...DEFAULT_CONFIG, ...overrides });
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState(() => { try { return JSON.parse(store.get(msgKey) || "[]"); } catch { return []; } });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(null); // text of the message that failed, for retry

  const convId = useRef(store.get(convKey) || uid());
  const session = useRef(null);
  const abort = useRef(null);
  const msgsRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    store.set(convKey, convId.current);
    controller.setOpen = setOpen;
    controller.toggle = () => setOpen((o) => !o);
    api.getConfig().then((c) => setCfg({ ...DEFAULT_CONFIG, ...c, ...overrides })).catch(() => {});
  }, []);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  useEffect(() => {
    const el = msgsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    if (!busy) store.set(msgKey, JSON.stringify(msgs.slice(-50)));
  }, [msgs, open, failed]);

  const dark = cfg.theme === "dark" || (cfg.theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);

  async function send(raw) {
    const text = raw.trim();
    if (!text || busy) return;
    setFailed(null);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setMsgs((cur) => [...cur, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setBusy(true);
    const ctl = new AbortController();
    abort.current = ctl;
    try {
      await (session.current ||= api.startSession(convId.current));
      const context = { url: location.href, title: document.title, ...controller.context };
      for await (const ev of api.chat({ conversationId: convId.current, message: text, context, signal: ctl.signal })) {
        if (ev.error) throw new Error(ev.error);
        setMsgs((cur) => {
          const copy = cur.slice();
          const last = { ...copy[copy.length - 1] };
          if (ev.delta) last.content += ev.delta;
          if (ev.sources) last.sources = ev.sources;
          copy[copy.length - 1] = last;
          return copy;
        });
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        session.current = null;
        setFailed(text);
        setMsgs((cur) => (cur[cur.length - 1]?.content ? cur : cur.slice(0, -2)));
      }
    } finally {
      setMsgs((cur) => { const l = cur[cur.length - 1]; return l?.role === "assistant" && !l.content ? cur.slice(0, -1) : cur; });
      setBusy(false);
      abort.current = null;
    }
  }

  function reset() {
    abort.current?.abort();
    convId.current = uid();
    store.set(convKey, convId.current);
    session.current = null;
    setMsgs([]); setFailed(null); setInput("");
  }

  const onInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <div class={`root ${dark ? "dark" : ""}`} style={{ "--p": cfg.primaryColor }}>
      <div class={`wrap ${cfg.position} ${open ? "open" : ""}`}>
        {open && (
          <section class="panel" role="dialog" aria-label={cfg.name} onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
            <header>
              <strong>{cfg.name}</strong>
              <div class="actions">
                <button class="icon" onClick={reset} aria-label="Start new chat" title="New chat"><PlusIcon /></button>
                <button class="icon" onClick={() => setOpen(false)} aria-label="Close chat" title="Close"><XIcon /></button>
              </div>
            </header>

            <div class="msgs" ref={msgsRef} aria-live="polite">
              <div class="m bot" dangerouslySetInnerHTML={{ __html: renderMarkdown(cfg.welcome) }} />
              {msgs.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} class="m user">{m.content}</div>
                ) : (
                  <div key={i} class="m bot">
                    {m.content
                      ? <div dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
                      : <span class="typing" role="status" aria-label="Sentra is typing"><i /><i /><i /></span>}
                    {m.sources?.length > 0 && (
                      <div class="src">
                        {m.sources.filter((s) => /^https?:\/\//.test(s.url)).slice(0, 4).map((s) => (
                          <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title || s.url}</a>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
              {failed && (
                <div class="err" role="alert">
                  Couldn't reach Sentra. Check your connection and try again.
                  <button onClick={() => send(failed)}>Retry</button>
                </div>
              )}
            </div>

            {msgs.length === 0 && cfg.suggestions?.length > 0 && (
              <div class="chips">
                {cfg.suggestions.slice(0, 4).map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}
              </div>
            )}

            <form class="composer" onSubmit={(e) => { e.preventDefault(); send(input); }}>
              <textarea ref={inputRef} rows={1} value={input} placeholder={cfg.placeholder} aria-label="Message" onInput={onInput} onKeyDown={onKey} />
              {busy
                ? <button type="button" class="send" onClick={() => abort.current?.abort()} aria-label="Stop response"><StopIcon /></button>
                : <button class="send" disabled={!input.trim()} aria-label="Send message"><SendIcon /></button>}
            </form>
            {cfg.branding && <div class="foot">Powered by Sentra AI</div>}
          </section>
        )}
        <button class="launcher" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? "Close" : cfg.launcherLabel}
        </button>
      </div>
    </div>
  );
}
