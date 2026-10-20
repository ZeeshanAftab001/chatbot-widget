export default `
:host{all:initial}
*{box-sizing:border-box}
.root{--p:#3b3fd8;--bg:#fff;--fg:#17181c;--muted:#6a6f7b;--line:#e4e6ec;--soft:#f3f4f7;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:var(--fg)}
.root.dark{--bg:#16171b;--fg:#eceef2;--muted:#9298a5;--line:#2b2d34;--soft:#212329}
button,textarea{font:inherit;color:inherit}
button{cursor:pointer}
:focus-visible{outline:2px solid var(--p);outline-offset:2px}

.wrap{position:fixed;bottom:20px;z-index:2147483000;display:flex;flex-direction:column;gap:12px}
.wrap.right{right:20px;align-items:flex-end}
.wrap.left{left:20px;align-items:flex-start}

.launcher{height:44px;padding:0 20px;border:0;border-radius:22px;background:var(--p);color:#fff;font-weight:600;
  box-shadow:0 6px 18px rgba(0,0,0,.2);transition:transform .15s}
.launcher:active{transform:scale(.97)}

.panel{width:384px;height:min(640px,calc(100vh - 100px));display:flex;flex-direction:column;background:var(--bg);
  border:1px solid var(--line);border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.22);overflow:hidden;animation:pop .18s ease-out}
@keyframes pop{from{opacity:0;transform:translateY(8px) scale(.98)}}

header{display:flex;align-items:center;justify-content:space-between;padding:12px 8px 12px 16px;border-bottom:1px solid var(--line)}
header strong{font-size:15px}
.actions{display:flex;gap:2px}
.icon{display:grid;place-items:center;width:32px;height:32px;border:0;border-radius:8px;background:none;color:var(--muted)}
.icon:hover{background:var(--soft);color:var(--fg)}

.msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:16px}
.m{max-width:92%;overflow-wrap:anywhere}
.m p{margin:0 0 8px}.m p:last-child{margin:0}
.m ul,.m ol{margin:0 0 8px;padding-left:20px}
.m code{background:var(--soft);padding:1px 5px;border-radius:4px;font-size:13px}
.m a{color:var(--p)}
.m.user{align-self:flex-end;max-width:84%;background:var(--p);color:#fff;padding:8px 12px;border-radius:14px 14px 4px 14px;white-space:pre-wrap}

.src{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.src a{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:2px 10px;border:1px solid var(--line);
  border-radius:12px;color:var(--muted);font-size:12px;text-decoration:none}
.src a:hover{color:var(--fg);border-color:var(--muted)}

.typing{display:inline-flex;gap:4px;padding:6px 0}
.typing i{width:6px;height:6px;border-radius:50%;background:var(--muted);animation:dot 1.1s infinite ease-in-out}
.typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}
@keyframes dot{0%,80%,100%{opacity:.25}40%{opacity:1}}

.err{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;background:var(--soft);color:var(--fg);font-size:13px}
.err button{margin-left:auto;border:1px solid var(--line);border-radius:8px;background:var(--bg);padding:2px 10px}

.chips{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px 12px}
.chips button{border:1px solid var(--line);border-radius:14px;background:var(--bg);padding:5px 12px}
.chips button:hover{border-color:var(--p);color:var(--p)}

.composer{display:flex;align-items:flex-end;gap:8px;padding:12px 16px;border-top:1px solid var(--line)}
.composer textarea{flex:1;resize:none;max-height:120px;border:1px solid var(--line);border-radius:12px;padding:9px 12px;background:var(--bg);line-height:1.4}
.composer textarea:focus{outline:none;border-color:var(--p)}
.send{display:grid;place-items:center;flex:none;width:38px;height:38px;border:0;border-radius:50%;background:var(--p);color:#fff}
.send:disabled{opacity:.35;cursor:default}

.foot{padding:0 16px 10px;text-align:center;font-size:11px;color:var(--muted)}

@media (max-width:520px){
  .wrap{bottom:16px}.wrap.right{right:16px}.wrap.left{left:16px}
  .panel{position:fixed;inset:0;width:100%;height:100%;border-radius:0;border:0}
  .wrap.open .launcher{display:none}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;
