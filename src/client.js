window.__ModuleLoader__.load({
  id: "@cocofhu/cloud-infra",
  factory: (require) => {
    const React = require("react");
    const h = React.createElement;
    const { useEffect, useState, useRef } = React;

    const CSS = `
.ci-root,.ci-tool{font-family:inherit;color:var(--dsw-alias-label-primary);width:100%;max-width:100%;min-width:0;box-sizing:border-box;padding:2px 0 6px}
.ci-panel{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden;width:100%;max-width:100%;min-width:0;box-sizing:border-box}
.ci-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;min-width:0;flex-wrap:wrap}
.ci-bar-left{display:flex;align-items:baseline;gap:8px;min-width:0}
.ci-bar-title{font-size:14px;font-weight:650;line-height:22px;color:var(--dsw-alias-label-primary)}
.ci-bar-count{color:var(--dsw-alias-label-tertiary);font-size:12px}
.ci-search-wrap{position:relative;width:min(220px,100%);flex:none}
.ci-search-ico{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--dsw-alias-label-caption);pointer-events:none}
.ci-search{width:100%;height:32px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:0 28px 0 32px;font:inherit;font-size:13px;background:var(--dsw-alias-bg-layer-2);color:inherit;box-sizing:border-box;appearance:none;-webkit-appearance:none}
.ci-search::-webkit-search-cancel-button,.ci-search::-webkit-search-decoration{appearance:none;-webkit-appearance:none;display:none}
.ci-search:focus{outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent)}
.ci-search-x{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:22px;height:22px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;font:inherit;line-height:1}
.ci-search-x:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.ci-list{border-top:1px solid var(--dsw-alias-border-l1);overflow:auto;width:100%;min-width:0}
.ci-row{display:grid;align-items:center;gap:8px;padding:9px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);min-width:0;box-sizing:border-box}
.ci-row.head{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:500;padding:8px 14px}
.ci-row:last-child{border-bottom:0}
.ci-row:not(.head):hover{background:var(--dsw-alias-interactive-bg-hover)}
.ci-cell{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}
.ci-row.head .ci-cell{color:var(--dsw-alias-label-tertiary)}
.ci-cell.num{font-variant-numeric:tabular-nums}
.ci-name{font-weight:550;color:var(--dsw-alias-label-primary);background:none;border:0;padding:0;cursor:pointer;font:inherit;font-size:13px;text-align:left;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ci-name:hover{color:var(--dsw-alias-brand-primary)}
.ci-ops{display:flex;align-items:center;gap:10px;white-space:nowrap}
.ci-link{background:none;border:0;padding:0;margin:0;cursor:pointer;font:inherit;font-size:13px;color:var(--dsw-alias-brand-primary)}
.ci-link:hover{text-decoration:underline}
.ci-link:disabled{opacity:.45;cursor:wait;text-decoration:none}
.ci-link.danger{color:var(--dsw-alias-state-error-primary)}
.ci-status{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;font-size:12px}
.ci-dot{display:inline-block;width:6px;height:6px;min-width:6px;min-height:6px;border-radius:50%;flex:none;overflow:hidden;background:var(--dsw-alias-state-success-primary)}
.ci-dot.enable{background:var(--dsw-alias-state-success-primary)}
.ci-dot.pause{background:var(--dsw-alias-state-warn-label)}
.ci-dot.error{background:var(--dsw-alias-state-error-primary)}
.ci-dot.unknown{background:var(--dsw-alias-label-caption)}
.ci-empty{padding:36px 16px;text-align:center;color:var(--dsw-alias-label-caption);font-size:13px;border-top:1px solid var(--dsw-alias-border-l1)}
.ci-footbar{display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-top:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary);font-size:12px}
.ci-page{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;font-size:12px;color:var(--dsw-alias-label-tertiary);flex-wrap:wrap}
.ci-page-btns{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.ci-page-btn{min-width:28px;height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:8px;cursor:pointer;font:inherit;color:inherit}
.ci-page-btn:hover:not(:disabled):not(.active){border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.ci-page-btn.active{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border-color:transparent}
.ci-page-btn:disabled{opacity:.4;cursor:default}
.ci-hint{color:var(--dsw-alias-label-caption);font-size:12px;line-height:18px;margin:0 0 10px}
.ci-badge{display:inline-block;margin-right:6px;padding:1px 6px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);font-size:10px;color:var(--dsw-alias-label-secondary)}
.ci-st{font-size:11px;padding:1px 6px;border-radius:999px}
.ci-st.enable{background:var(--dsw-alias-state-success-tertiary);color:var(--dsw-alias-state-success-primary)}
.ci-st.pause{background:var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-state-warn-label)}
.ci-st.error{background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-label-primary-foreground)}
.ci-crumb{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.ci-back{height:28px;padding:0 10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);border-radius:8px;cursor:pointer;font:inherit;color:inherit}
.ci-back:hover{background:var(--dsw-alias-interactive-bg-hover)}
.ci-head-t{font-weight:650;font-size:14px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ci-chips{display:flex;flex-wrap:wrap;gap:6px;padding:10px 14px 4px}
.ci-chip{font-size:12px;padding:4px 8px;border-radius:7px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-caption)}
.ci-chip b{color:var(--dsw-alias-label-primary);margin-left:4px;font-weight:600}
.ci-sec{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 14px}
.ci-sec-t{font-size:13px;font-weight:650}
.ci-table-wrap{width:100%;overflow:auto}
.ci-table{width:100%;min-width:520px;border-collapse:collapse;font-size:13px}
.ci-table th,.ci-table td{text-align:left;padding:8px 12px;border-top:1px solid var(--dsw-alias-border-l1);vertical-align:middle}
.ci-table th{color:var(--dsw-alias-label-tertiary);font-weight:500;font-size:12px}
.ci-table td{word-break:break-all;color:var(--dsw-alias-label-secondary)}
.ci-table td.ci-ops-cell{white-space:nowrap;word-break:normal}
.ci-table tbody tr:hover td{background:var(--dsw-alias-interactive-bg-hover)}
.ci-rec-page{margin:0}
.ci-mini{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);color:var(--dsw-alias-label-primary);border-radius:8px;padding:5px 12px;cursor:pointer;font:inherit;font-size:13px}
.ci-mini.primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border-color:transparent}
.ci-mini.danger{color:var(--dsw-alias-state-error-primary)}
.ci-mini:disabled{opacity:.4;cursor:default}
.ci-actions{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}
.ci-err{color:var(--dsw-alias-state-error-primary);font-size:12px;margin:8px 14px}
.ci-load{display:flex;align-items:center;justify-content:center;padding:36px 16px;color:var(--dsw-alias-label-caption);border-top:1px solid var(--dsw-alias-border-l1)}
.ci-spin{display:inline-block;width:12px;height:12px;border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);border-radius:50%;animation:ci-spin .7s linear infinite;vertical-align:-1px;margin-right:6px}
@keyframes ci-spin{to{transform:rotate(360deg)}}
.ci-modal-mask{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;padding:20px;background:var(--dsw-alias-bg-mask-3);box-sizing:border-box}
.ci-modal-mask.stacked{z-index:41}
.ci-modal{width:min(400px,100%);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:14px;padding:16px;box-shadow:var(--dsw-alias-shadow);box-sizing:border-box}
.ci-modal h3{margin:0 0 8px;font-size:16px}
.ci-modal p{margin:0 0 12px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.55}
.ci-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
.ci-cfg-item{list-style:none;margin:0;padding:0;min-width:0}
.ci-cfg{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);border-radius:12px;overflow:hidden;box-sizing:border-box;width:100%;min-width:0}
.ci-cfg-h{display:flex;align-items:center;gap:12px;cursor:pointer;list-style:none;padding:14px 16px;box-sizing:border-box;min-width:0}
.ci-cfg-h::-webkit-details-marker,.ci-cfg-h::marker{display:none;content:none}
.ci-cfg-t{flex:1;display:flex;flex-direction:column;gap:4px;min-width:0}
.ci-cfg-n{font-size:15px;font-weight:600;line-height:1.4}
.ci-cfg-d{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}
.ci-cfg-ch{color:var(--dsw-alias-label-tertiary);flex:none;width:14px;height:14px;margin-left:auto;transition:transform .16s;display:block;pointer-events:none;overflow:visible}
.ci-cfg-ch-open{transform:rotate(180deg)}
.ci-cfg-b{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding:8px 0 12px}
.ci-cfg-f{display:flex;flex-direction:column;gap:6px;padding:10px 0;border-top:1px solid var(--dsw-alias-border-l1)}
.ci-cfg-f:first-child{border-top:0}
.ci-cfg-f label{font-size:13px;font-weight:500;color:var(--dsw-alias-label-secondary)}
.ci-cfg-f input[type=text],.ci-cfg-f input[type=password],.ci-cfg-f input[type=number]{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);height:34px;font:inherit;border-radius:8px;padding:0 12px;font-size:13px}
.ci-cfg-f input:focus{outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent)}
.ci-cfg-row{display:grid;grid-template-columns:9.5em 1fr;align-items:center;gap:10px;margin:0;padding:0;width:100%;min-width:0;max-width:100%;box-sizing:border-box;float:none;position:static;vertical-align:stretch}
.ci-cfg-row>label{display:block;width:auto;min-width:0;max-width:100%;margin:0;padding:0;box-sizing:border-box;float:none;position:static;vertical-align:middle;line-height:1.4;overflow-wrap:anywhere;white-space:normal;font-size:13px;font-weight:500;color:var(--dsw-alias-label-secondary)}
.ci-cfg-row>input[type=text],.ci-cfg-row>input[type=password],.ci-cfg-row>input[type=number]{display:block;width:100%;min-width:0;max-width:100%;margin:0;box-sizing:border-box;float:none;position:static;vertical-align:middle}
.ci-cfg-hint{margin:0;color:var(--dsw-alias-label-caption);font-size:12px}
.ci-cfg-src{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;float:none;position:static}
.ci-cfg-src>input[type=checkbox]{float:none;position:static;vertical-align:middle;margin:0}
.ci-cfg-src label{display:flex;gap:6px;align-items:center;font-weight:400;cursor:pointer}
.ci-cfg-mod-hint{margin:0 0 8px;color:var(--dsw-alias-label-caption);font-size:12px;line-height:1.5;font-weight:400}
.ci-cfg-mod-q{width:100%;height:34px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font:inherit;font-size:13px;box-sizing:border-box;margin-bottom:8px;appearance:none;-webkit-appearance:none}
.ci-cfg-mod-q::-webkit-search-cancel-button,.ci-cfg-mod-q::-webkit-search-decoration{appearance:none;-webkit-appearance:none;display:none}
.ci-cfg-mod-q:focus{outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent)}
.ci-cfg-mod-list{max-height:196px;overflow-y:auto;overflow-x:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-3);padding:4px 0}
.ci-cfg-mod-row{display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;font-size:13px;font-weight:400;color:var(--dsw-alias-label-primary);min-width:0;margin:0}
.ci-cfg-mod-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.ci-cfg-mod-row input{accent-color:var(--dsw-alias-brand-primary);width:15px;height:15px;flex:none}
.ci-cfg-mod-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1}
.ci-cfg-mod-empty{padding:8px 12px;color:var(--dsw-alias-label-caption);font-size:13px}
.ci-cfg-mod-meta{margin-top:6px;color:var(--dsw-alias-label-caption);font-size:12px;font-weight:400}
.ci-cfg-ft{border-top:1px solid var(--dsw-alias-border-l2);justify-content:flex-end;gap:8px;padding:12px 0 4px;display:flex}
.ci-cfg-save{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border:1px solid transparent;border-radius:8px;padding:5px 14px;font:inherit;cursor:pointer}
.ci-cfg-disc{background:var(--dsw-alias-button-elevated-fill);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);border-radius:8px;padding:5px 14px;font:inherit;cursor:pointer}
.ci-cfg-save:disabled,.ci-cfg-disc:disabled{opacity:.4;cursor:default}
.ci-field{display:flex;flex-direction:column;gap:4px;margin:0 0 8px}
.ci-field input,.ci-field select{height:32px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:inherit;padding:0 10px;font:inherit}
.ci-field input:focus,.ci-field select:focus{outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent)}
.ci-image{--ci-title:var(--dsw-alias-label-primary,#0f1419);--ci-text:var(--dsw-alias-label-secondary,#3b4250);--ci-muted:var(--dsw-alias-label-tertiary,#5c6570);--ci-faint:var(--dsw-alias-label-caption,#8b939e);width:100%;max-width:100%;min-width:0;color:var(--ci-text)}
html[data-theme=light] .ci-image,.ci-image[data-theme=light]{--ci-title:#0f1419}
html[data-theme=dark] .ci-image,.ci-image[data-theme=dark]{--ci-title:#f7f8fb}
@media (prefers-color-scheme: dark){html:not([data-theme=light]) .ci-image{--ci-title:var(--dsw-alias-label-primary,#f7f8fb)}}
.ci-image-head{padding:16px 16px 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.ci-image-title{margin:0;font-size:16px;font-weight:650;line-height:22px;color:var(--ci-title)}
.ci-image-sub{margin:4px 0 12px;color:var(--ci-muted);font-size:12px}
.ci-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.ci-chip-sel{height:32px;padding:0 10px 0 12px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--ci-title);font:inherit;display:flex;align-items:center;gap:8px}
.ci-chip-sel span{color:var(--ci-muted);font-size:12px}
.ci-chip-sel select{border:0;background:transparent;color:var(--ci-title);font:inherit;outline:none;max-width:160px}
.ci-search-wide{display:flex;align-items:center;gap:10px;height:40px;padding:0 14px;border-radius:12px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2)}
.ci-search-wide:focus-within{border-color:var(--dsw-alias-brand-primary)}
.ci-search-wide svg{flex:none;color:var(--ci-muted)}
.ci-search-wide input{flex:1;min-width:0;border:0;outline:none;background:transparent;color:var(--ci-title);font:inherit}
.ci-search-wide input::placeholder{color:var(--ci-faint)}
.ci-tabs{display:flex;gap:6px;padding:10px 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.ci-tab{height:30px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:var(--ci-muted);font:inherit;cursor:pointer}
.ci-tab.on{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent);color:var(--dsw-alias-brand-primary);font-weight:600}
.ci-image-body{padding:16px}
.ci-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media(max-width:640px){.ci-grid{grid-template-columns:1fr}}
.ci-ic{text-align:left;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);border-radius:14px;padding:14px;cursor:pointer;min-height:124px;color:var(--ci-text);width:100%;font:inherit}
.ci-ic:hover{border-color:var(--dsw-alias-brand-primary)}
.ci-ic.on{border-color:var(--dsw-alias-brand-primary);box-shadow:inset 0 0 0 1px var(--dsw-alias-brand-primary)}
.ci-ic-ico{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent);margin-bottom:10px;color:var(--dsw-alias-brand-primary)}
.ci-ic h3{margin:0 0 8px;font-size:15px;font-weight:700;letter-spacing:.01em;color:var(--ci-title);-webkit-text-fill-color:var(--ci-title)}
html[data-theme=light] .ci-ic h3{color:#0f1419;-webkit-text-fill-color:#0f1419}
html[data-theme=dark] .ci-ic h3{color:#f7f8fb;-webkit-text-fill-color:#f7f8fb}
.ci-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.ci-tag{font-size:11px;padding:2px 7px;border-radius:999px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);color:var(--ci-muted)}
.ci-tag.ok{background:var(--dsw-alias-state-success-tertiary);border-color:transparent;color:var(--dsw-alias-state-success-primary)}
.ci-tag.blue{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent);border-color:transparent;color:var(--dsw-alias-brand-primary)}
.ci-ic-meta{font-size:12px;color:var(--ci-muted);word-break:break-all}
.ci-warn{padding:10px 12px;border-radius:10px;background:var(--dsw-alias-state-warn-tertiary);color:var(--dsw-alias-state-warn-label);font-size:12px;line-height:1.5;margin:0 0 4px}
.ci-copied{margin:8px 0 0;color:var(--dsw-alias-state-success-primary);font-size:12px}
`;

    const CSS_ID = "cloud-infra-style";
    function ensureCss() {
      if (typeof document === "undefined") return () => {};
      let s = document.getElementById(CSS_ID);
      if (!s) {
        s = document.createElement("style");
        s.id = CSS_ID;
        document.head.appendChild(s);
      }
      s.textContent = CSS;
      return () => {};
    }

    const fallbackPortal = (node) => node;
    let createPortal = fallbackPortal;
    try {
      const rd = require("react-dom");
      if (rd && typeof rd.createPortal === "function") createPortal = rd.createPortal;
    } catch { /* overlay still works without portal */ }

    const PLUGIN_SCRIPT_PATH = "/plugins/@cocofhu/cloud-infra/client.js";
    const CONFIG_EVENT = "cloud-infra-config";
    const SECRET_RE = /AKID[0-9A-Za-z]{8,}|LTAI[0-9A-Za-z]{8,}|sk-[A-Za-z0-9]{16,}|-----BEGIN |\bsecret(?:id|key)\b\s*[:=]/i;

    function prefixFromPluginUrl(src) {
      try {
        const path = new URL(src, typeof location !== "undefined" ? location.href : "http://local/").pathname;
        const idx = path.indexOf(PLUGIN_SCRIPT_PATH);
        if (idx <= 0) return "";
        return path.slice(0, idx).replace(/\/+$/, "");
      } catch { return ""; }
    }

    function prefixFromPathname(pathname) {
      const first = String(pathname || "/").split("/").filter(Boolean)[0];
      if (!first || !/^[A-Za-z0-9_-]{16,}$/.test(first)) return "";
      return "/" + first;
    }

    function sitePrefix() {
      if (typeof document !== "undefined") {
        for (const s of document.getElementsByTagName("script")) {
          const prefix = s.src ? prefixFromPluginUrl(s.src) : "";
          if (prefix) return prefix;
        }
      }
      return typeof location !== "undefined" ? prefixFromPathname(location.pathname) : "";
    }

    function pluginUrl(path) {
      const suffix = path.startsWith("/") ? path : "/" + path;
      return sitePrefix() + suffix;
    }

    function publicErrorMessage(err) {
      const raw = err instanceof Error ? err.message : String(err ?? "");
      const message = raw.replace(/\s+/g, " ").trim();
      if (!message) return "云厂商请求失败";
      if (SECRET_RE.test(message)) return "云厂商请求失败";
      return message;
    }

    async function api(method, payload) {
      const res = await fetch(pluginUrl("/cloud-infra"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ method, ...payload }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.ok === false) throw new Error(body.error || "HTTP " + res.status);
      return body;
    }

    function parseToolArgs(props) {
      const block = props?.block;
      const raw = (block && "kind" in block ? block.call?.argsRaw : block?.argsRaw) || "";
      if (!raw || typeof raw !== "string") return {};
      try { return JSON.parse(raw); } catch { return {}; }
    }

    function pickPayload(props) {
      const found = [];
      const visit = (node, depth) => {
        if (!node || depth > 8) return;
        if (typeof node !== "object") return;
        if (Array.isArray(node)) {
          for (const x of node) visit(x, depth + 1);
          return;
        }
        if (node.kind === "cloud-infra-query" && Array.isArray(node.items)) found.push(node);
        else if (Array.isArray(node.items) && node.items[0] && node.items[0].moduleId) found.push(node);
        for (const key of ["meta", "presentationMeta", "result", "content", "block", "call", "output"]) {
          if (node[key]) visit(node[key], depth + 1);
        }
      };
      visit(props, 0);
      return found[0] || null;
    }

    function ChevronDown({ className }) {
      return h("svg", {
        className,
        width: 14,
        height: 14,
        viewBox: "0 0 14 14",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        "aria-hidden": "true",
      }, h("path", {
        d: "M3 5l4 4 4-4",
        stroke: "currentColor",
        strokeWidth: "1.5",
        strokeLinecap: "round",
      }));
    }

    function statusText(status) {
      if (status === "enable") return "已启用";
      if (status === "pause") return "已暂停";
      if (status === "error") return "异常";
      return status || "";
    }

    function recordStatus(status) {
      const value = String(status || "").toLowerCase();
      if (value === "enable") return "enable";
      if (value === "disable" || value === "pause") return "pause";
      return value || "";
    }

    function SearchIcon() {
      return h("svg", {
        className: "ci-search-ico",
        width: 14,
        height: 14,
        viewBox: "0 0 14 14",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        "aria-hidden": "true",
      },
        h("circle", { cx: "6", cy: "6", r: "4.2", stroke: "currentColor", strokeWidth: "1.4" }),
        h("path", { d: "M9.2 9.2L12 12", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round" }),
      );
    }

    function Spin() {
      return h("span", { className: "ci-spin", "aria-hidden": "true" });
    }

    function inferColumns(item) {
      if (Array.isArray(item && item.columns) && item.columns.length) return item.columns;
      const out = [];
      for (const badge of (item && item.badges) || []) {
        const text = String(badge || "");
        const rec = text.match(/^(\d+)\s*条记录$/);
        if (rec) out.push({ label: "记录数", value: rec[1] });
        else if (text) out.push({ label: "套餐", value: text });
      }
      const desc = String((item && item.description) || "");
      if (/DNSERROR|DNS 异常/i.test(desc) && !out.some((col) => col.label === "DNS状态")) {
        out.unshift({ label: "DNS状态", value: "异常" });
      }
      return out;
    }

    function columnLabels(items) {
      const seen = [];
      for (const item of Array.isArray(items) ? items : []) {
        for (const col of inferColumns(item)) {
          if (col && col.label && !seen.includes(col.label)) seen.push(col.label);
        }
      }
      return seen;
    }

    function cellValue(item, label) {
      const col = inferColumns(item).find((c) => c && c.label === label);
      return col && col.value != null ? String(col.value) : "";
    }

    function pageWindow(current, pages) {
      const total = Math.min(Math.max(1, Number(pages) || 1), 99);
      const cur = Math.min(Math.max(1, Number(current) || 1), total);
      if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
      const start = Math.max(1, Math.min(cur - 2, total - 4));
      const end = Math.min(total, Math.max(cur + 2, 5));
      const out = [];
      if (start > 1) {
        out.push(1);
        if (start > 2) out.push("...");
      }
      for (let i = start; i <= end; i++) out.push(i);
      if (end < total) {
        if (end < total - 1) out.push("...");
        out.push(total);
      }
      return out;
    }

    function StatusCell({ status }) {
      if (!status) return h("span", null, "-");
      return h("span", { className: "ci-status" },
        h("span", { className: "ci-dot " + status }),
        statusText(status),
      );
    }

    class CiBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { error: null };
      }
      static getDerivedStateFromError(error) {
        return { error };
      }
      render() {
        if (this.state.error) {
          return h("div", { className: "ci-err" }, "云资源界面出错：" + (this.state.error.message || String(this.state.error)));
        }
        return this.props.children;
      }
    }

    function Pager({ total, page, pages, busy, onPage }) {
      if (!total && pages <= 1) return null;
      return h("div", { className: "ci-footbar" },
        h("div", { className: "ci-page" },
          h("span", null, `共 ${total} 条`),
          pages > 1 ? h("div", { className: "ci-page-btns" },
            h("button", {
              type: "button",
              className: "ci-page-btn",
              disabled: busy || page <= 1,
              onClick: () => onPage(page - 1),
            }, "上一页"),
            pageWindow(page, pages).map((item, idx) => item === "..."
              ? h("span", { key: "e" + idx }, "...")
              : h("button", {
                key: item,
                type: "button",
                className: "ci-page-btn" + (item === page ? " active" : ""),
                disabled: busy || item === page,
                onClick: () => onPage(item),
              }, String(item))),
            h("button", {
              type: "button",
              className: "ci-page-btn",
              disabled: busy || page >= pages,
              onClick: () => onPage(page + 1),
            }, "下一页"),
          ) : null,
        ),
      );
    }

    function ResourceTable({ items, pendingId, onOpen, extraCols, showProvider, emptyHint }) {
      extraCols = Array.isArray(extraCols) ? extraCols : [];
      const rows = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!rows.length) return h("div", { className: "ci-empty" }, emptyHint || "没有资源");
      const nameLabel = rows.every((row) => row.kind === "domain") ? "域名" : "名称";
      const template = [
        "minmax(120px,1.7fr)",
        showProvider ? "64px" : null,
        "84px",
        ...extraCols.map((label) => label === "记录数" ? "64px" : "minmax(72px,0.8fr)"),
        "52px",
      ].filter(Boolean).join(" ");
      const head = [
        h("div", { key: "n", className: "ci-cell" }, nameLabel),
        showProvider ? h("div", { key: "p", className: "ci-cell" }, "云厂商") : null,
        h("div", { key: "s", className: "ci-cell" }, "状态"),
        extraCols.map((label) => h("div", { key: label, className: "ci-cell" }, label)),
        h("div", { key: "o", className: "ci-cell" }, "操作"),
      ];
      return h("div", { className: "ci-list" },
        h("div", { className: "ci-row head", style: { gridTemplateColumns: template } }, head),
        rows.map((item) => h("div", {
          key: item.id,
          className: "ci-row",
          style: { gridTemplateColumns: template },
        },
          h("div", { className: "ci-cell" }, h("button", {
            type: "button",
            className: "ci-name",
            title: item.title,
            disabled: pendingId === item.id,
            onClick: () => onOpen(item),
          }, item.title)),
          showProvider ? h("div", { className: "ci-cell" }, item.provider) : null,
          h("div", { className: "ci-cell" }, h(StatusCell, { status: item.status })),
          extraCols.map((label) => h("div", {
            key: label,
            className: "ci-cell" + (label === "记录数" ? " num" : ""),
          }, cellValue(item, label) || "-")),
          h("div", { className: "ci-cell ci-ops" }, h("button", {
            type: "button",
            className: "ci-link",
            disabled: pendingId === item.id,
            onClick: () => onOpen(item),
          }, pendingId === item.id ? "加载中" : (item.openLabel || "解析"))),
        )),
      );
    }

    function useOverlayKeys(open, busy, onClose, capture) {
      const box = useRef(null);
      useEffect(() => {
        if (!open) return;
        const root = box.current;
        const first = root && root.querySelector("input,button,select,textarea");
        if (first && typeof first.focus === "function") first.focus();
        const onKey = (e) => {
          if (e.key !== "Escape") return;
          if (busy) return;
          e.preventDefault();
          e.stopPropagation();
          onClose();
        };
        document.addEventListener("keydown", onKey, !!capture);
        return () => document.removeEventListener("keydown", onKey, !!capture);
      }, [open, busy, onClose, capture]);
      return box;
    }

    function ConfirmDialog({ open, title, text, warn, busy, danger, onCancel, onConfirm }) {
      const box = useOverlayKeys(open, busy, onCancel, true);
      if (!open) return null;
      const node = h("div", {
        className: "ci-modal-mask stacked",
        role: "presentation",
        onClick: (e) => { if (!busy && e.target === e.currentTarget) onCancel(); },
      },
        h("div", { className: "ci-modal", role: "dialog", "aria-modal": "true", ref: box },
          h("h3", null, title || "确认"),
          h("p", null, text),
          warn ? h("div", { className: "ci-warn" }, warn) : null,
          h("div", { className: "ci-modal-actions" },
            h("button", { type: "button", className: "ci-mini", disabled: busy, onClick: onCancel }, "取消"),
            h("button", {
              type: "button",
              className: "ci-mini primary" + (danger ? " danger" : ""),
              disabled: busy,
              onClick: onConfirm,
            }, busy ? "处理中" : "确认"),
          ),
        ),
      );
      return createPortal(node, document.body);
    }

    function RecordForm({ action, initial, onCancel, onSubmit, busy, err }) {
      const fields = action.fields || [
        { key: "host", label: "主机" },
        { key: "type", label: "类型" },
        { key: "value", label: "记录值" },
        { key: "line", label: "线路", placeholder: "默认" },
        { key: "ttl", label: "TTL" },
      ];
      const [draft, setDraft] = useState(() => {
        const out = {};
        for (const field of fields) out[field.key] = initial?.[field.key] || "";
        return out;
      });
      const box = useOverlayKeys(true, busy, onCancel, false);
      const node = h("div", {
        className: "ci-modal-mask",
        role: "presentation",
        onClick: (e) => { if (!busy && e.target === e.currentTarget) onCancel(); },
      },
        h("div", { className: "ci-modal", role: "dialog", "aria-modal": "true", ref: box },
          h("h3", null, action.label),
          fields.map((field) => h("div", { className: "ci-field", key: field.key },
            h("label", null, field.label),
            h("input", {
              type: "text",
              placeholder: field.placeholder || "",
              value: draft[field.key] || "",
              disabled: busy,
              onChange: (e) => setDraft({ ...draft, [field.key]: e.target.value }),
            }),
          )),
          err ? h("p", { className: "ci-err", style: { margin: "0 0 8px" } }, err) : null,
          h("div", { className: "ci-modal-actions" },
            h("button", { type: "button", className: "ci-mini", disabled: busy, onClick: onCancel }, "取消"),
            h("button", {
              type: "button",
              className: "ci-mini primary",
              disabled: busy,
              onClick: () => onSubmit(draft),
            }, busy ? "提交中" : "保存"),
          ),
        ),
      );
      return createPortal(node, document.body);
    }

    function DetailView({ item, detail, loading, error, skipConfirm, onBack, onReload, onSkipConfirm }) {
      const [form, setForm] = useState(null);
      const [confirm, setConfirm] = useState(null);
      const [busy, setBusy] = useState(false);
      const [err, setErr] = useState("");
      const [recPage, setRecPage] = useState(1);
      const records = detail?.records || [];
      const recSize = 20;
      const recPages = Math.max(1, Math.ceil(records.length / recSize));
      const recSlice = records.slice((recPage - 1) * recSize, recPage * recSize);
      useEffect(() => { setRecPage(1); }, [item.id, records.length]);
      const showLine = records.some((row) => row.line);
      const actions = detail?.card?.actions || item.actions || [];
      const createAction = actions.find((it) => it.id === "record.create") || { id: "record.create", label: "添加记录", confirm: "default" };
      const run = async (action, payload) => {
        setBusy(true);
        setErr("");
        try {
          await api("action", {
            moduleId: item.moduleId,
            id: item.id,
            action: action.id,
            payload: {
              domain: item.title,
              domainId: String(item.id).split(":").pop(),
              ...payload,
            },
          });
          setForm(null);
          setConfirm(null);
          await onReload();
        } catch (e) {
          setErr(publicErrorMessage(e));
        } finally {
          setBusy(false);
        }
      };
      const request = async (action, payload, text) => {
        let skip = skipConfirm;
        try {
          const d = await api("meta", {});
          skip = !!d.skipConfirm;
          if (onSkipConfirm) onSkipConfirm(skip);
        } catch { /* keep last known skipConfirm */ }
        const must = action.confirm === "always" || (action.confirm === "default" && !skip);
        if (!must) return run(action, payload);
        setConfirm({ action, payload, text, danger: action.confirm === "always" });
      };
      return [
        h("div", { key: "crumb", className: "ci-crumb" },
          h("button", { type: "button", className: "ci-back", onClick: onBack }, "返回"),
          h("span", { className: "ci-head-t", title: item.title }, item.title),
        ),
        loading ? h("div", { key: "load", className: "ci-load" }, h(Spin), "加载详情…") : null,
        !loading && error && !detail ? h("div", { key: "ferr", className: "ci-err" }, error) : null,
        !loading && detail ? [
          h("div", { key: "chips", className: "ci-chips" },
            (detail.fields || []).map((row) => h("span", { key: row.label, className: "ci-chip" },
              row.label,
              h("b", null, row.value),
            )),
          ),
          h("div", { key: "sec", className: "ci-sec" },
            h("span", { className: "ci-sec-t" }, "解析记录"),
            h("button", {
              type: "button",
              className: "ci-mini primary",
              onClick: () => setForm({ action: createAction, initial: { host: "", type: "A", value: "", line: "默认", ttl: "600" } }),
            }, createAction.label),
          ),
          err ? h("p", { key: "err", className: "ci-err" }, err) : null,
          records.length ? [
            h("div", { key: "tb", className: "ci-table-wrap" }, h("table", { className: "ci-table" },
              h("thead", null, h("tr", null,
                h("th", null, "主机记录"),
                h("th", null, "记录类型"),
                h("th", null, "记录值"),
                showLine ? h("th", null, "线路") : null,
                h("th", null, "TTL"),
                h("th", null, "状态"),
                h("th", null, "操作"),
              )),
              h("tbody", null, recSlice.map((row) => h("tr", { key: row.id },
                h("td", null, row.host),
                h("td", null, row.type),
                h("td", null, row.value),
                showLine ? h("td", null, row.line || "") : null,
                h("td", null, row.ttl != null ? String(row.ttl) : ""),
                h("td", null, h(StatusCell, { status: recordStatus(row.status) })),
                h("td", { className: "ci-ops-cell" }, h("div", { className: "ci-ops" },
                  h("button", {
                    type: "button",
                    className: "ci-link",
                    onClick: () => setForm({
                      action: { id: "record.update", label: "修改记录", confirm: "default" },
                      initial: { host: row.host, type: row.type, value: row.value, line: row.line || "默认", ttl: row.ttl != null ? String(row.ttl) : "", recordId: row.id },
                    }),
                  }, "修改"),
                  h("button", {
                    type: "button",
                    className: "ci-link",
                    onClick: () => request(
                      { id: "record.status", label: "启停记录", confirm: "default" },
                      { recordId: row.id, status: String(row.status || "").toLowerCase() === "enable" ? "DISABLE" : "ENABLE" },
                      `将 ${row.host} ${row.type} 设为 ${String(row.status || "").toLowerCase() === "enable" ? "暂停" : "启用"}？`,
                    ),
                  }, String(row.status || "").toLowerCase() === "enable" ? "暂停" : "启用"),
                  h("button", {
                    type: "button",
                    className: "ci-link danger",
                    onClick: () => request(
                      { id: "record.delete", label: "删除记录", confirm: "always" },
                      { recordId: row.id },
                      `确定删除 ${row.host} ${row.type} ${row.value}？此操作不可撤销。`,
                    ),
                  }, "删除"),
                )),
              ))),
            )),
            h("div", { key: "rec-page", className: "ci-rec-page" }, h(Pager, {
              total: records.length,
              page: recPage,
              pages: recPages,
              busy: false,
              onPage: setRecPage,
            })),
          ] : h("div", { key: "empty", className: "ci-empty" }, "没有解析记录"),
        ] : null,
        form ? h(RecordForm, {
          key: "form",
          action: form.action,
          initial: form.initial,
          busy,
          err,
          onCancel: () => { if (!busy) setForm(null); },
          onSubmit: (draft) => request(form.action, { ...form.initial, ...draft }, `确认${form.action.label}？`),
        }) : null,
        h(ConfirmDialog, {
          key: "confirm",
          open: !!confirm,
          title: confirm?.action?.label,
          text: confirm?.text,
          busy,
          danger: !!confirm?.danger,
          onCancel: () => { if (!busy) setConfirm(null); },
          onConfirm: () => confirm && run(confirm.action, confirm.payload),
        }),
      ];
    }

    const TCR_REGIONS = [
      { id: "ap-guangzhou", label: "广州" },
      { id: "ap-shanghai", label: "上海" },
      { id: "ap-beijing", label: "北京" },
      { id: "ap-nanjing", label: "南京" },
      { id: "ap-chengdu", label: "成都" },
    ];
    const PERSONAL_DOMAIN = "ccr.ccs.tencentyun.com";
    const DIGEST_WARNING = "注意：删除指定版本可能同时删除相同镜像 ID（SHA256）的其它版本。";

    function inferImageRegion(query, fallback) {
      const text = String(query || "");
      const pairs = [
        [/广州|guangzhou/i, "ap-guangzhou"],
        [/上海|shanghai/i, "ap-shanghai"],
        [/北京|beijing/i, "ap-beijing"],
        [/南京|nanjing/i, "ap-nanjing"],
        [/成都|chengdu/i, "ap-chengdu"],
      ];
      for (const [re, id] of pairs) {
        if (re.test(text)) return id;
      }
      return fallback || "ap-guangzhou";
    }

    function imageCol(item, label) {
      const col = (item && item.columns || []).find((c) => c && c.label === label);
      return col && col.value != null ? String(col.value) : "";
    }

    function imageDomain(item) {
      return imageCol(item, "访问域名") || String((item && item.description) || "") || PERSONAL_DOMAIN;
    }

    function imageEdition(item) {
      return imageCol(item, "类型") || ((item && item.badges) || []).find((b) => /个人版|企业版/.test(String(b))) || "企业版";
    }

    function hitKw(kw, ...values) {
      const q = String(kw || "").trim().toLowerCase();
      if (!q) return true;
      return values.some((v) => String(v || "").toLowerCase().includes(q));
    }

    function ImageIcon() {
      return h("div", { className: "ci-ic-ico", "aria-hidden": "true" },
        h("svg", { width: 18, height: 18, viewBox: "0 0 18 18", fill: "none" },
          h("rect", { x: 3, y: 4, width: 12, height: 10, rx: 2, stroke: "currentColor", strokeWidth: "1.4" }),
          h("path", { d: "M6 8h6M6 11h4", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round" }),
        ),
      );
    }

    function SearchWideIcon() {
      return h("svg", { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" },
        h("circle", { cx: 7, cy: 7, r: 4.4, stroke: "currentColor", strokeWidth: "1.5" }),
        h("path", { d: "M10.4 10.4L13.2 13.2", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }),
      );
    }

    function ImageToolView({ payload, args, fromTool, initialQuery }) {
      const provider = String(args.provider || "");
      const errors = payload?.errors || [];
      const [region, setRegion] = useState(payload?.region || inferImageRegion(initialQuery, "ap-guangzhou"));
      const [instances, setInstances] = useState(Array.isArray(fromTool) ? fromTool : []);
      const [instanceId, setInstanceId] = useState((fromTool && fromTool[0] && fromTool[0].id) || "");
      const [view, setView] = useState("inst");
      const [nsFilter, setNsFilter] = useState("");
      const [namespaces, setNamespaces] = useState([]);
      const [repos, setRepos] = useState([]);
      const [tags, setTags] = useState([]);
      const [repo, setRepo] = useState(null);
      const [fields, setFields] = useState([]);
      const [draftQ, setDraftQ] = useState(initialQuery || "");
      const [busy, setBusy] = useState(false);
      const [err, setErr] = useState(errors.map((e) => e.message).join("；"));
      const [copied, setCopied] = useState("");
      const [confirm, setConfirm] = useState(null);
      const [actBusy, setActBusy] = useState(false);
      const seq = useRef(0);
      const debounce = useRef(0);
      const current = (Array.isArray(instances) ? instances : []).find((item) => item && item.id === instanceId) || instances[0];

      const toolSig = fromTool
        ? `${payload?.region || ""}|${fromTool.map((i) => i.id).join(",")}|${initialQuery}`
        : "";
      useEffect(() => {
        if (!fromTool) return;
        setInstances(fromTool);
        if (payload?.region) setRegion(payload.region);
        if (fromTool[0]?.id) setInstanceId(fromTool[0].id);
        setDraftQ(initialQuery || "");
        setErr(errors.map((e) => e.message).join("；"));
      }, [toolSig]);
      useEffect(() => () => { if (debounce.current) clearTimeout(debounce.current); }, []);

      const loadInstances = async (nextRegion, keepId) => {
        const n = ++seq.current;
        setBusy(true);
        setErr("");
        try {
          const result = await api("query", { kind: "image", query: "", provider, region: nextRegion, limit: 80 });
          if (n !== seq.current) return;
          const items = result.items || [];
          setInstances(items);
          const nextId = keepId && items.some((item) => item.id === keepId) ? keepId : (items[0]?.id || "");
          setInstanceId(nextId);
          if (result.errors?.length) setErr(result.errors.map((e) => e.message).join("；"));
        } catch (e) {
          if (n !== seq.current) return;
          setErr(publicErrorMessage(e));
          setInstances([]);
          setInstanceId("");
        } finally {
          if (n === seq.current) setBusy(false);
        }
      };

      const loadDetail = async (nextView, nextInstance, extra) => {
        if (!nextInstance) {
          setNamespaces([]);
          setRepos([]);
          setTags([]);
          return;
        }
        const n = ++seq.current;
        setBusy(true);
        setErr("");
        try {
          const item = (instances || []).find((row) => row && row.id === nextInstance);
          const detail = await api("detail", {
            moduleId: item?.moduleId || "tencent.image",
            id: nextInstance,
            region,
            view: nextView,
            query: extra?.query || "",
            namespace: extra?.namespace || "",
            repository: extra?.repository || "",
          });
          if (n !== seq.current) return;
          const table = (detail.tables || [])[0] || { rows: [] };
          const rows = table.rows || [];
          if (nextView === "namespaces") setNamespaces(rows);
          else if (nextView === "tags") setTags(rows);
          else setRepos(rows);
          setFields(detail.fields || []);
        } catch (e) {
          if (n !== seq.current) return;
          setErr(publicErrorMessage(e));
        } finally {
          if (n === seq.current) setBusy(false);
        }
      };

      const changeRegion = (next) => {
        setRegion(next);
        setView("inst");
        setRepo(null);
        setNsFilter("");
        setDraftQ("");
        setCopied("");
        loadInstances(next);
      };

      const selectInstance = (item, nextView) => {
        setInstanceId(item.id);
        setRepo(null);
        setNsFilter("");
        setDraftQ("");
        setCopied("");
        setView(nextView || "repo");
        if ((nextView || "repo") !== "inst") loadDetail(nextView === "ns" ? "namespaces" : "repos", item.id, {});
      };

      const changeView = (next) => {
        setView(next);
        setCopied("");
        if (next === "inst") return;
        if (next === "detail") return;
        setRepo(null);
        loadDetail(next === "ns" ? "namespaces" : "repos", instanceId, { namespace: nsFilter, query: "" });
      };

      const openRepo = (row) => {
        const namespace = row.cells?.namespace || "";
        const full = row.cells?.name || row.id;
        const name = full.includes("/") ? full.slice(full.indexOf("/") + 1) : full;
        setRepo({ id: row.id, namespace, name, full });
        setDraftQ("");
        setView("detail");
        loadDetail("tags", instanceId, { namespace, repository: name });
      };

      const onDraft = (value) => {
        setDraftQ(value);
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(() => {
          if (view === "ns") loadDetail("namespaces", instanceId, { query: value });
          else if (view === "repo") loadDetail("repos", instanceId, { namespace: nsFilter, query: value });
          else if (view === "detail" && repo) loadDetail("tags", instanceId, { namespace: repo.namespace, repository: repo.name, query: value });
        }, 400);
      };

      const placeholder = view === "inst"
        ? "搜索实例名称"
        : view === "ns"
          ? "搜索命名空间"
          : view === "detail"
            ? "搜索镜像版本"
            : "搜索仓库名称";

      const filteredInstances = (instances || []).filter((item) => hitKw(
        draftQ,
        item.title,
        item.description,
        imageEdition(item),
        imageDomain(item),
        ...(item.badges || []),
      ));
      const nsNames = [...new Set((namespaces.length ? namespaces : repos).map((row) => row.cells?.namespace || row.cells?.name).filter(Boolean))];

      const copyPull = async (tag) => {
        if (!current || !repo) return;
        const personal = imageEdition(current) === "个人版";
        const cmd = `docker pull ${personal ? PERSONAL_DOMAIN : imageDomain(current)}/${repo.namespace}/${repo.name}:${tag}`;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(cmd);
          setCopied(cmd);
        } catch {
          setCopied(cmd);
        }
      };

      const runDelete = async (payload) => {
        setActBusy(true);
        setErr("");
        try {
          await api("action", {
            moduleId: current?.moduleId || "tencent.image",
            id: instanceId,
            action: "image.delete",
            payload,
          });
          setConfirm(null);
          if (repo) await loadDetail("tags", instanceId, { namespace: repo.namespace, repository: repo.name, query: draftQ });
        } catch (e) {
          setErr(publicErrorMessage(e));
        } finally {
          setActBusy(false);
        }
      };

      const askDelete = (row) => {
        const tag = row.cells?.version || row.id;
        const full = repo ? `${repo.namespace}/${repo.name}:${tag}` : tag;
        setConfirm({
          tag,
          text: `确定删除 ${full}？此操作不可撤销。`,
          warn: DIGEST_WARNING,
          payload: {
            region,
            instanceId,
            namespace: repo?.namespace,
            repository: repo?.name,
            tag,
            publicDomain: imageDomain(current),
          },
        });
      };

      const body = () => {
        if (busy) return h("div", { className: "ci-load" }, h(Spin), "加载中…");
        if (view === "inst") {
          if (!filteredInstances.length) return h("div", { className: "ci-empty" }, draftQ ? "没有匹配的实例" : "该地域没有实例");
          return h("div", { className: "ci-grid" }, filteredInstances.map((item) => h("button", {
            key: item.id,
            type: "button",
            className: "ci-ic" + (item.id === instanceId ? " on" : ""),
            onClick: () => selectInstance(item, "repo"),
          },
            h(ImageIcon),
            h("h3", null, item.title),
            h("div", { className: "ci-tags" },
              h("span", { className: "ci-tag ok" }, item.status === "enable" ? "运行中" : (item.status || "未知")),
              h("span", { className: "ci-tag blue" }, imageEdition(item)),
            ),
            h("div", { className: "ci-ic-meta" }, imageDomain(item)),
          )));
        }
        if (view === "ns") {
          const rows = (namespaces || []).filter((row) => hitKw(draftQ, row.cells?.name, row.cells?.access));
          if (!rows.length) return h("div", { className: "ci-empty" }, "没有匹配的命名空间");
          return h("div", { className: "ci-table-wrap" }, h("table", { className: "ci-table" },
            h("thead", null, h("tr", null, h("th", null, "名称"), h("th", null, "访问级别"))),
            h("tbody", null, rows.map((row) => h("tr", { key: row.id },
              h("td", null, row.cells?.name || row.id),
              h("td", null, h("span", { className: "ci-tag" }, row.cells?.access || "私有")),
            ))),
          ));
        }
        if (view === "detail") {
          const rows = (tags || []).filter((row) => hitKw(draftQ, row.cells?.version, row.cells?.digest));
          return [
            h("div", { key: "crumb", className: "ci-crumb", style: { padding: 0, border: 0, marginBottom: 14 } },
              h("button", { type: "button", className: "ci-back", onClick: () => { setRepo(null); setDraftQ(""); changeView("repo"); } }, "返回"),
              h("span", { className: "ci-head-t" }, repo?.full || "版本管理"),
            ),
            fields.length ? h("div", { key: "chips", className: "ci-chips", style: { padding: 0 } },
              fields.map((row) => h("span", { key: row.label, className: "ci-chip" }, row.label, h("b", null, row.value))),
            ) : null,
            copied ? h("p", { key: "copied", className: "ci-copied" }, "已复制：" + copied) : null,
            rows.length ? h("div", { key: "tb", className: "ci-table-wrap" }, h("table", { className: "ci-table" },
              h("thead", null, h("tr", null,
                h("th", null, "镜像版本"),
                h("th", null, "镜像ID"),
                h("th", null, "大小"),
                h("th", null, "更新时间"),
                h("th", null, "操作"),
              )),
              h("tbody", null, rows.map((row) => h("tr", { key: row.id },
                h("td", null, row.cells?.version || row.id),
                h("td", null, row.cells?.digest || "-"),
                h("td", null, row.cells?.size || "-"),
                h("td", null, row.cells?.updated || "-"),
                h("td", { className: "ci-ops-cell" }, h("div", { className: "ci-ops" },
                  h("button", { type: "button", className: "ci-link", onClick: () => copyPull(row.cells?.version || row.id) }, "拉取指令"),
                  h("button", { type: "button", className: "ci-link danger", onClick: () => askDelete(row) }, "删除"),
                )),
              ))),
            )) : h("div", { key: "empty", className: "ci-empty" }, "没有匹配的镜像版本"),
          ];
        }
        const rows = (repos || []).filter((row) => (nsFilter ? row.cells?.namespace === nsFilter : true) && hitKw(draftQ, row.cells?.name, row.cells?.namespace));
        if (!rows.length) return h("div", { className: "ci-empty" }, "没有匹配的仓库");
        return h("div", { className: "ci-table-wrap" }, h("table", { className: "ci-table" },
          h("thead", null, h("tr", null,
            h("th", null, "仓库名称"),
            h("th", null, "命名空间"),
            h("th", null, "类型"),
          )),
          h("tbody", null, rows.map((row) => h("tr", { key: row.id },
            h("td", null, h("button", { type: "button", className: "ci-link", onClick: () => openRepo(row) }, row.cells?.name || row.id)),
            h("td", null, row.cells?.namespace || ""),
            h("td", null, h("span", { className: "ci-tag" }, row.cells?.access || "私有")),
          ))),
        ));
      };

      return h("div", { className: "ci-root ci-tool" },
        h("div", { className: "ci-panel ci-image" },
          h("div", { className: "ci-image-head" },
            h("h1", { className: "ci-image-title" }, "容器镜像"),
            h("p", { className: "ci-image-sub" }, "当前范围内的实例、仓库与版本"),
            h("div", { className: "ci-filters" },
              h("label", { className: "ci-chip-sel" },
                h("span", null, "地域"),
                h("select", { value: region, onChange: (e) => changeRegion(e.target.value) },
                  TCR_REGIONS.map((item) => h("option", { key: item.id, value: item.id }, item.label)),
                ),
              ),
              h("label", { className: "ci-chip-sel" },
                h("span", null, "实例"),
                h("select", {
                  value: instanceId,
                  onChange: (e) => {
                    const item = instances.find((row) => row.id === e.target.value);
                    if (item) selectInstance(item, view === "inst" ? "repo" : view);
                  },
                },
                  instances.length
                    ? instances.map((item) => h("option", { key: item.id, value: item.id }, item.title))
                    : h("option", { value: "" }, "无实例"),
                ),
              ),
              view === "repo" && nsNames.length ? h("label", { className: "ci-chip-sel" },
                h("span", null, "命名空间"),
                h("select", {
                  value: nsFilter,
                  onChange: (e) => {
                    setNsFilter(e.target.value);
                    loadDetail("repos", instanceId, { namespace: e.target.value, query: draftQ });
                  },
                },
                  h("option", { value: "" }, "全部"),
                  nsNames.map((name) => h("option", { key: name, value: name }, name)),
                ),
              ) : null,
            ),
            h("label", { className: "ci-search-wide" },
              h(SearchWideIcon),
              h("input", {
                type: "search",
                placeholder,
                value: draftQ,
                onChange: (e) => onDraft(e.target.value),
              }),
            ),
          ),
          h("div", { className: "ci-tabs" },
            h("button", { type: "button", className: "ci-tab" + (view === "inst" ? " on" : ""), onClick: () => changeView("inst") }, "实例"),
            h("button", { type: "button", className: "ci-tab" + (view === "ns" ? " on" : ""), onClick: () => changeView("ns") }, "命名空间"),
            h("button", { type: "button", className: "ci-tab" + (view === "repo" || view === "detail" ? " on" : ""), onClick: () => changeView("repo") }, "镜像仓库"),
          ),
          err ? h("div", { className: "ci-err" }, err) : null,
          h("div", { className: "ci-image-body" }, body()),
        ),
        h(ConfirmDialog, {
          open: !!confirm,
          title: "删除镜像版本",
          text: confirm?.text,
          warn: confirm?.warn,
          busy: actBusy,
          danger: true,
          onCancel: () => { if (!actBusy) setConfirm(null); },
          onConfirm: () => confirm && runDelete(confirm.payload),
        }),
      );
    }

    function SearchToolView(props) {
      useEffect(() => ensureCss(), []);
      const payload = pickPayload(props);
      const args = parseToolArgs(props);
      const fromTool = Array.isArray(payload?.items) ? payload.items : null;
      const running = !!(props?.block && !("kind" in props.block));
      const kind = payload?.kind || args.kind || "domain";
      const provider = String(args.provider || "");
      const pageSize = Math.max(1, Number(args.limit) || 12);
      const initialQuery = payload?.query != null ? String(payload.query) : String(args.query || "");
      const [skipConfirm, setSkipConfirm] = useState(false);
      const [session, setSession] = useState(null);
      const [pendingId, setPendingId] = useState("");
      const [rows, setRows] = useState(fromTool || []);
      const [total, setTotal] = useState(Number(payload?.total) || (fromTool || []).length);
      const [offset, setOffset] = useState(Number(payload?.offset) || 0);
      const [hasMore, setHasMore] = useState(!!payload?.hasMore);
      const [listBusy, setListBusy] = useState(false);
      const [listErr, setListErr] = useState("");
      const [draftQ, setDraftQ] = useState(initialQuery);
      const [activeQ, setActiveQ] = useState(initialQuery);
      const seq = useRef(0);
      const debounce = useRef(0);
      const refreshSkip = () => {
        api("meta", {}).then((d) => setSkipConfirm(!!d.skipConfirm)).catch(() => {});
      };
      useEffect(() => {
        refreshSkip();
        if (typeof window === "undefined") return;
        const onCfg = () => refreshSkip();
        window.addEventListener(CONFIG_EVENT, onCfg);
        return () => window.removeEventListener(CONFIG_EVENT, onCfg);
      }, []);
      const toolSig = fromTool
        ? `${Number(payload?.offset) || 0}|${fromTool.map((i) => i.id).join(",")}|${payload?.total}|${payload?.hasMore}|${initialQuery}`
        : "";
      useEffect(() => {
        if (!fromTool) return;
        setRows(fromTool);
        setTotal(Number(payload?.total) || fromTool.length);
        setOffset(Number(payload?.offset) || 0);
        setHasMore(!!payload?.hasMore);
        setDraftQ(initialQuery);
        setActiveQ(initialQuery);
        setListErr("");
      }, [toolSig]);
      useEffect(() => () => { if (debounce.current) clearTimeout(debounce.current); }, []);
      const fetchList = async (nextOffset, q) => {
        const n = ++seq.current;
        setListBusy(true);
        setListErr("");
        try {
          const result = await api("query", {
            query: q,
            kind,
            provider,
            offset: nextOffset,
            limit: pageSize,
          });
          if (n !== seq.current) return;
          setRows(result.items || []);
          setTotal(Number(result.total) || (result.items || []).length);
          setHasMore(!!result.hasMore);
          setOffset(Number(result.offset) || nextOffset);
          setActiveQ(q);
        } catch (e) {
          if (n !== seq.current) return;
          setListErr(publicErrorMessage(e));
        } finally {
          if (n === seq.current) setListBusy(false);
        }
      };
      const runSearch = (q) => {
        const next = String(q || "").trim();
        if (debounce.current) {
          clearTimeout(debounce.current);
          debounce.current = 0;
        }
        fetchList(0, next);
      };
      const onDraft = (value) => {
        setDraftQ(value);
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(() => runSearch(value), 400);
      };
      const counted = Number(total) || rows.length;
      const pages = Math.max(1, Math.ceil(counted / pageSize) || 1);
      const extra = hasMore && offset + rows.length >= counted ? 1 : 0;
      const pageCount = Math.max(pages, Math.floor(offset / pageSize) + 1 + extra);
      const page = Math.floor(offset / pageSize) + 1;
      const goPage = (next) => fetchList((next - 1) * pageSize, String(activeQ || "").trim());
      const openItem = async (item) => {
        setPendingId(item.id);
        setSession({ item, loading: true, detail: null });
        refreshSkip();
        try {
          const detail = await api("detail", { moduleId: item.moduleId, id: item.id, title: item.title });
          setSession({ item, loading: false, detail });
        } catch (e) {
          setSession({ item, loading: false, detail: null, error: publicErrorMessage(e) });
        } finally {
          setPendingId("");
        }
      };
      const reload = async () => {
        if (!session?.item) return;
        const detail = await api("detail", { moduleId: session.item.moduleId, id: session.item.id, title: session.item.title });
        setSession((cur) => cur ? { ...cur, detail, loading: false } : cur);
      };
      if (running) return null;
      if (kind === "image") {
        return h(CiBoundary, null, h(ImageToolView, {
          payload,
          args,
          fromTool,
          initialQuery,
        }));
      }
      const errors = payload?.errors || [];
      if (!fromTool?.length && !rows.length && !activeQ && !draftQ) {
        const msg = errors.map((e) => e.message).join("；");
        return msg ? h("div", { className: "ci-err" }, msg) : null;
      }
      const extraCols = columnLabels(rows);
      const showProvider = new Set((Array.isArray(rows) ? rows : []).map((item) => item && item.provider)).size > 1;
      return h(CiBoundary, null, h("div", { className: "ci-root ci-tool" },
        h("div", { className: "ci-panel" },
          session ? h(DetailView, {
            item: session.item,
            detail: session.detail,
            loading: session.loading,
            error: session.error,
            skipConfirm,
            onBack: () => setSession(null),
            onReload: reload,
            onSkipConfirm: setSkipConfirm,
          }) : [
            h("div", { key: "bar", className: "ci-bar" },
              h("div", { className: "ci-bar-left" },
                h("span", { className: "ci-bar-title" }, kind === "domain" ? "域名解析" : "云资源"),
                h("span", { className: "ci-bar-count" }, `${counted} 条`),
              ),
              h("div", { className: "ci-search-wrap" },
                h(SearchIcon),
                h("input", {
                  className: "ci-search",
                  type: "search",
                  placeholder: kind === "domain" ? "请输入域名关键字" : "搜索",
                  value: draftQ,
                  onChange: (e) => onDraft(e.target.value),
                  onKeyDown: (e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      runSearch(draftQ);
                    }
                  },
                }),
                draftQ ? h("button", {
                  type: "button",
                  className: "ci-search-x",
                  disabled: listBusy,
                  onClick: () => { setDraftQ(""); runSearch(""); },
                  "aria-label": "清空",
                }, "×") : null,
              ),
            ),
            listErr ? h("div", { key: "lerr", className: "ci-err" }, listErr) : null,
            listBusy ? h("div", { key: "load", className: "ci-load" }, h(Spin), "加载列表…") : h(ResourceTable, {
              key: "table",
              items: rows,
              pendingId,
              onOpen: openItem,
              extraCols,
              showProvider,
              emptyHint: (activeQ || draftQ) ? `没有匹配「${activeQ || draftQ}」的资源` : "没有资源",
            }),
            h(Pager, {
              key: "pager",
              total: counted,
              page,
              pages: pageCount,
              busy: listBusy,
              onPage: goPage,
            }),
          ],
        ),
      ));
    }

    function matchModule(module, q) {
      const needle = String(q || "").trim().toLowerCase();
      if (!needle) return true;
      const title = String(module.title || "").toLowerCase();
      const id = String(module.id || "").toLowerCase();
      return title.includes(needle) || id.includes(needle);
    }

    function configToDraft(d) {
      const providers = {};
      const list = (d.providers || []).filter((item) => item && item.id);
      for (const item of list) {
        const values = {};
        const fields = item.fields || Object.keys(item.values || {}).map((key) => ({ key }));
        for (const field of fields) values[field.key] = "";
        providers[item.id] = { enabled: item.enabled !== false, values, configured: !!item.configured };
      }
      return {
        maxResults: d.maxResults || 12,
        timeoutMs: d.timeoutMs || 20000,
        skipConfirm: !!d.skipConfirm,
        providers,
        modules: Array.isArray(d.modules)
          ? Object.fromEntries(d.modules.map((m) => [m.id, m.enabled !== false]))
          : { ...(d.modules || {}) },
      };
    }

    function configToMeta(d) {
      return {
        providers: d.providers || [],
        modules: Array.isArray(d.modules)
          ? d.modules
          : Object.entries(d.modules || {}).map(([id, enabled]) => ({ id, enabled, implemented: true, title: id })),
      };
    }

    function ConfigCard() {
      useEffect(() => ensureCss(), []);
      const [open, setOpen] = useState(false);
      const [meta, setMeta] = useState({ providers: [], modules: [] });
      const [saved, setSaved] = useState(null);
      const [draft, setDraft] = useState(null);
      const [saving, setSaving] = useState(false);
      const [err, setErr] = useState("");
      const [modQ, setModQ] = useState("");
      useEffect(() => {
        let live = true;
        api("config", {}).then((d) => {
          if (!live) return;
          setMeta(configToMeta(d));
          const next = configToDraft(d);
          setSaved(next);
          setDraft(next);
        }).catch((e) => { if (live) setErr(publicErrorMessage(e)); });
        return () => { live = false; };
      }, []);
      const dirty = !!(draft && saved && JSON.stringify(draft) !== JSON.stringify(saved));
      const save = async () => {
        if (!draft) return;
        setSaving(true);
        setErr("");
        try {
          const providers = {};
          for (const [id, bucket] of Object.entries(draft.providers)) {
            const next = { enabled: bucket.enabled };
            for (const [key, value] of Object.entries(bucket.values || {})) {
              if (String(value || "").trim()) next[key] = String(value).trim();
            }
            providers[id] = next;
          }
          const d = await api("config", {
            save: true,
            maxResults: draft.maxResults,
            timeoutMs: draft.timeoutMs,
            skipConfirm: draft.skipConfirm,
            providers,
            modules: draft.modules,
          });
          setMeta(configToMeta(d));
          const next = configToDraft(d);
          setSaved(next);
          setDraft(next);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent(CONFIG_EVENT, { detail: { skipConfirm: !!next.skipConfirm } }));
          }
        } catch (e) {
          setErr(publicErrorMessage(e));
        } finally {
          setSaving(false);
        }
      };
      if (!draft) {
        return h("li", { className: "ci-cfg-item" },
          h("details", { className: "ci-cfg" },
            h("summary", { className: "ci-cfg-h" },
              h("span", { className: "ci-cfg-t" },
                h("span", { className: "ci-cfg-n" }, "云资源"),
                h("span", { className: "ci-cfg-d" }, err || "加载配置…"),
              ),
            ),
          ),
        );
      }
      const modules = (meta.modules || []).filter((m) => m.implemented !== false);
      const visibleModules = modules.filter((m) => matchModule(m, modQ));
      const enabledModCount = modules.filter((m) => draft.modules[m.id] !== false).length;
      const filtering = !!String(modQ || "").trim();
      return h("li", { className: "ci-cfg-item" },
        h("details", {
          className: "ci-cfg",
          open,
          onToggle: (e) => setOpen(e.currentTarget.open),
        },
          h("summary", { className: "ci-cfg-h" },
            h("span", { className: "ci-cfg-t" },
              h("span", { className: "ci-cfg-n" }, "云资源"),
              h("span", { className: "ci-cfg-d" }, "配置各云厂商 AccessKey，查询域名与解析记录。"),
            ),
            dirty ? h("span", { className: "ci-badge" }, "未保存") : null,
            h(ChevronDown, { className: "ci-cfg-ch" + (open ? " ci-cfg-ch-open" : "") }),
          ),
          h("div", { className: "ci-cfg-b" },
            (meta.providers || []).map((provider) => {
              const bucket = draft.providers[provider.id] || { enabled: true, values: {}, configured: false };
              return h("div", { key: provider.id, className: "ci-cfg-f" },
                h("label", null, provider.title),
                h("label", { className: "ci-cfg-src" },
                  h("input", {
                    type: "checkbox",
                    checked: bucket.enabled !== false,
                    onChange: () => setDraft({
                      ...draft,
                      providers: {
                        ...draft.providers,
                        [provider.id]: { ...bucket, enabled: !bucket.enabled },
                      },
                    }),
                  }),
                  "启用",
                ),
                (provider.fields || []).map((field) => h("div", { key: field.key, className: "ci-cfg-row" },
                  h("label", { htmlFor: `ci-${provider.id}-${field.key}` }, field.label),
                  h("input", {
                    id: `ci-${provider.id}-${field.key}`,
                    type: field.secret ? "password" : "text",
                    placeholder: bucket.configured ? "已保存，留空则保持原值" : (field.placeholder || ""),
                    autoComplete: "off",
                    value: bucket.values?.[field.key] || "",
                    onChange: (e) => setDraft({
                      ...draft,
                      providers: {
                        ...draft.providers,
                        [provider.id]: {
                          ...bucket,
                          values: { ...bucket.values, [field.key]: e.target.value },
                        },
                      },
                    }),
                  }),
                )),
              );
            }),
            modules.length ? h("div", { className: "ci-cfg-f" },
              h("label", { htmlFor: "ci-mod-q" }, "产品模块"),
              h("p", { className: "ci-cfg-mod-hint" }, "勾选后参与对话查询。条目增多时在框内滚动，不撑高整张设置卡。"),
              h("input", {
                id: "ci-mod-q",
                className: "ci-cfg-mod-q",
                type: "search",
                placeholder: "筛选模块名称",
                value: modQ,
                onChange: (e) => setModQ(e.target.value),
              }),
              h("div", { className: "ci-cfg-mod-list" },
                visibleModules.length
                  ? visibleModules.map((module) => h("label", { key: module.id, className: "ci-cfg-mod-row" },
                    h("input", {
                      type: "checkbox",
                      checked: draft.modules[module.id] !== false,
                      onChange: () => setDraft({
                        ...draft,
                        modules: { ...draft.modules, [module.id]: draft.modules[module.id] === false },
                      }),
                    }),
                    h("span", { className: "ci-cfg-mod-title", title: module.title || module.id }, module.title || module.id),
                  ))
                  : h("div", { className: "ci-cfg-mod-empty" }, "没有匹配的模块"),
              ),
              h("div", { className: "ci-cfg-mod-meta" },
                `已启用 ${enabledModCount} / ${modules.length}` + (filtering ? " · 筛选中" : ""),
              ),
            ) : null,
            h("div", { className: "ci-cfg-f" },
              h("div", { className: "ci-cfg-row" },
                h("label", { htmlFor: "ci-max" }, "每页条数"),
                h("input", {
                  id: "ci-max",
                  type: "number",
                  min: 1,
                  max: 80,
                  value: draft.maxResults,
                  onChange: (e) => setDraft({ ...draft, maxResults: Number(e.target.value) || 12 }),
                }),
              ),
            ),
            h("div", { className: "ci-cfg-f" },
              h("label", { className: "ci-cfg-src" },
                h("input", {
                  type: "checkbox",
                  checked: !!draft.skipConfirm,
                  onChange: () => setDraft({ ...draft, skipConfirm: !draft.skipConfirm }),
                }),
                "写操作免确认（删除仍会确认）",
              ),
            ),
            h("div", { className: "ci-cfg-ft" },
              err ? h("p", { className: "ci-err", style: { flex: 1, margin: 0 } }, err) : null,
              h("button", { type: "button", className: "ci-cfg-disc", disabled: !dirty || saving, onClick: () => setDraft(saved) }, "放弃修改"),
              h("button", { type: "button", className: "ci-cfg-save", disabled: !dirty || saving, onClick: save }, saving ? "保存中" : "保存"),
            ),
          ),
        ),
      );
    }

    const inject = ["slots"];
    function apply(ctx) {
      const slots = ctx.get ? ctx.get("slots") : ctx.slots;
      if (!slots) return;
      try { ctx.effect(() => ensureCss(), "cloud-infra-style"); } catch { /* style still injected by views */ }
      const register = (options, component) => {
        const next = { ...options };
        if (next.id == null && next.key != null) next.id = String(next.key);
        if (next.key == null && next.id != null) next.key = next.id;
        return slots.register(next, component);
      };
      slots.inject("tool.call.toolview", () => register(
        { name: "tool.call.toolview", key: "cloud_infra_query" },
        SearchToolView,
      ));
      slots.inject("settings.plugin.item", () => register(
        { name: "settings.plugin.item", key: "cloud-infra", order: 40 },
        ConfigCard,
      ));
    }

    return { inject, apply, SearchToolView, ConfigCard };
  },
});
