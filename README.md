# Sentra widget (Preact)

Embeddable chat UI for Sentra AI. Renders in a Shadow DOM, ~10 KB gzipped.

## Run
    npm install
    npm run dev      # dev page at index.html, uses mock replies (data-mock="true")
    npm run build    # -> dist/widget.js

## Embed
    <script src="https://cdn.sentra.ai/widget.js" data-site-key="pk_live_xxx" async></script>

Optional attributes: data-api-url, data-position (left|right), data-color, data-theme (light|dark|auto), data-mock.

## JS API
    Sentra.open() / close() / toggle()
    Sentra.setContext({ productId: 42 })      // sent with every message
    Sentra.identify({ token: "<JWT from host site>" })

## Backend contract the widget expects
- GET  /v1/config   -> { name, welcome, placeholder, launcherLabel, primaryColor, theme, position, suggestions[], branding }
- POST /v1/session  body { conversationId, identity } -> { token }   (header X-Sentra-Site-Key)
- POST /v1/chat     body { conversationId, message, context } (Authorization: Bearer <token>)
    -> text/event-stream, frames: data: {"delta":"..."} | data: {"sources":[{"title","url"}]} | data: {"error":"..."} | data: [DONE]
- 401 on any call = session expired; the widget requests a new session and retries once.
