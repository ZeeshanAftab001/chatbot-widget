import { render } from "preact";
import { App } from "./App.jsx";
import { createApi } from "./api.js";
import css from "./styles.js";

function boot() {
  if (window.Sentra) return;

  // currentScript works for the built IIFE; the query is the fallback for the Vite dev page
  const el = document.currentScript?.dataset.siteKey
    ? document.currentScript
    : document.querySelector("script[data-site-key]");
  const ds = el?.dataset || {};
  if (!ds.siteKey) return console.warn("[Sentra] Missing data-site-key on the script tag.");

  const apiUrl = (ds.apiUrl || (el.src ? new URL(el.src).origin : "")).replace(/\/$/, "");
  const api = createApi({ apiUrl, siteKey: ds.siteKey, mock: ds.mock === "true" });
  const controller = { context: {}, setOpen: null, toggle: null };

  // Optional local overrides; the server config is the source of truth otherwise
  const overrides = {};
  if (ds.position) overrides.position = ds.position;
  if (ds.color) overrides.primaryColor = ds.color;
  if (ds.theme) overrides.theme = ds.theme;

  const start = () => {
    const host = document.createElement("div");
    host.id = "sentra-widget";
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = css;
    const mount = document.createElement("div");
    shadow.append(style, mount);
    document.body.appendChild(host);
    render(<App api={api} siteKey={ds.siteKey} controller={controller} overrides={overrides} />, mount);
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start) : start();

  window.Sentra = {
    open: () => controller.setOpen?.(true),
    close: () => controller.setOpen?.(false),
    toggle: () => controller.toggle?.(),
    setContext: (c) => { controller.context = { ...controller.context, ...c }; },
    identify: (identity) => api.identify(identity),
  };
}

boot();
