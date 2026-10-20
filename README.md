# Sentra widget (Preact)

Embeddable chat UI for [Sentra AI](https://github.com/ZeeshanAftab001/chatbot-widget). It is a single JavaScript file (about 10 KB gzipped) that renders inside a Shadow DOM, so the host website's CSS cannot break it and the widget's CSS cannot leak out.

Websites only paste a script tag. Everything else (name, colors, welcome text, knowledge) is configured on the Sentra side.

## Quick start

Add this before `</body>` on any page:

```html
<script
  src="https://cdn.jsdelivr.net/gh/ZeeshanAftab001/chatbot-widget@1.0.0/dist/widget.js"
  data-site-key="pk_live_xxx"
  data-api-url="https://api.yourdomain.com"
  async></script>
```

To try the UI without a backend, use mock mode (canned streaming replies):

```html
<script
  src="https://cdn.jsdelivr.net/gh/ZeeshanAftab001/chatbot-widget@1.0.0/dist/widget.js"
  data-site-key="demo"
  data-mock="true"
  async></script>
```

Note: the URL must be in the `src` attribute, and `data-site-key` is required. Without it the widget logs a warning and does not start.

## Script tag attributes

| Attribute | Required | Description |
|---|---|---|
| `data-site-key` | Yes | Public site key that identifies the tenant/bot |
| `data-api-url` | Recommended | Base URL of the Sentra backend. Defaults to the origin the script was loaded from, which is wrong when served from a CDN |
| `data-position` | No | `left` or `right` (overrides server config) |
| `data-color` | No | Accent color, for example `#3b3fd8` (overrides server config) |
| `data-theme` | No | `light`, `dark` or `auto` (overrides server config) |
| `data-mock` | No | `true` returns demo replies and needs no backend |

The server config from `GET /v1/config` is the source of truth. The `data-*` overrides exist for local testing.

## JavaScript API

```js
Sentra.open();                              // also: Sentra.close(), Sentra.toggle()
Sentra.setContext({ productId: 42 });       // merged into the context sent with every message
Sentra.identify({ token: "<JWT from host site>" });  // logged-in user, token signed by the host's backend
```

Each message automatically includes `url` and `title` of the current page in its context.

## Development

```bash
npm install
npm run dev       # dev page (index.html) in mock mode
npm run build     # produces dist/widget.js
npm run preview   # serve the production build locally
```

### Project structure

```
src/
  main.jsx      reads script attributes, mounts the Shadow DOM, exposes window.Sentra
  App.jsx       launcher, chat panel, streaming, retry, suggestions, persistence
  api.js        config, session, streaming chat (SSE), mock mode
  markdown.js   small safe markdown renderer (escapes HTML, http/https links only)
  styles.js     all CSS, themed with CSS variables
index.html      dev page standing in for a customer website
dist/widget.js  built output, committed so jsDelivr can serve it
```

## Releasing

`dist/widget.js` is committed because jsDelivr serves files straight from this repo.

```bash
npm run build
git add -A
git commit -m "Release 1.0.1"
git tag v1.0.1
git push origin main --tags
```

Customers can pin how they receive updates through the version in the URL:

| URL version | Meaning |
|---|---|
| `@1.0.1` | Exact version, never changes. Best for production |
| `@1` | Latest `1.x.x`, so patches and minor updates arrive automatically |
| `@main` | Branch head, cached for hours. For testing only |

Never change the contents of a published tag. Publish a new tag instead. To refresh the CDN cache while testing `@main`, open `https://purge.jsdelivr.net/gh/ZeeshanAftab001/chatbot-widget@main/dist/widget.js` once.

### Other hosting options

The widget is a static file, so it can also be served from your own domain (for example Hostinger or GitHub Pages at `cdn.yourdomain.com/v1/widget.js`). Only the `src` in the snippet changes.

## Backend contract

The widget expects these endpoints on `data-api-url`.

### `GET /v1/config`

Header: `X-Sentra-Site-Key`

```json
{
  "name": "Sentra AI",
  "welcome": "Hi, I'm Sentra. Ask me anything about this site.",
  "placeholder": "Ask a question",
  "launcherLabel": "Ask Sentra",
  "primaryColor": "#3b3fd8",
  "theme": "light",
  "position": "right",
  "suggestions": ["What can you help with?"],
  "branding": true
}
```

All fields are optional. Missing ones fall back to the defaults above.

### `POST /v1/session`

Header: `X-Sentra-Site-Key`. Body: `{ "conversationId": "...", "identity": null | { ... } }`
Response: `{ "token": "..." }`

The backend should check the request `Origin` against the tenant's allowed domains before issuing a short-lived token.

### `POST /v1/chat`

Headers: `X-Sentra-Site-Key`, `Authorization: Bearer <token>`
Body: `{ "conversationId": "...", "message": "...", "context": { "url": "...", "title": "...", ... } }`

Response: `text/event-stream`. Each frame is one of:

```
data: {"delta":"partial text"}
data: {"sources":[{"title":"Page title","url":"https://example.com/page"}]}
data: {"error":"message"}
data: [DONE]
```

### Errors

A `401` on any call means the session token expired. The widget requests a new session and retries once. If the retry fails, the user sees an error with a Retry button.

## Behavior notes

- The conversation ID and the last 50 messages are kept in `localStorage`, scoped per site key. If storage is blocked, the widget still works for the current page view.
- Assistant replies are rendered through the built-in markdown renderer, and source links are only shown for `http` and `https` URLs.
- If your API sits behind Nginx or another proxy, disable response buffering on the chat route (`proxy_buffering off;` in Nginx), otherwise streaming arrives all at once.
- Allow your widget origin and customer domains in the backend's CORS settings. The script file itself needs no CORS headers, but the API calls do.

## Roadmap

- Per-message feedback (thumbs up/down)
- Human handoff
- Product cards and other rich replies
- Translations
- `@sentra/react` wrapper
