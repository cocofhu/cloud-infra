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
.ci-cfg-hint{margin:0;color:var(--dsw-alias-label-caption);font-size:12px}
.ci-cfg-src{display:flex;flex-wrap:wrap;gap:10px 16px}
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
.ci-field textarea{min-height:72px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:inherit;padding:8px 10px;font:inherit;resize:vertical}
.ci-filters{display:flex;flex-wrap:wrap;gap:8px;padding:0 14px 10px;align-items:center}
.ci-filters select,.ci-filters input,.ci-region{height:32px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:inherit;padding:0 10px;font:inherit;font-size:13px}
.ci-type-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;padding:14px}
.ci-type-card{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:14px;background:var(--dsw-alias-bg-layer-2);text-align:left;cursor:pointer;font:inherit;color:inherit}
.ci-type-card:hover:not(:disabled){border-color:var(--dsw-alias-brand-primary)}
.ci-type-card:disabled,.ci-type-card.closed{opacity:.7;cursor:default}
.ci-type-card h4{margin:0 0 6px;font-size:14px}
.ci-type-card p{margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5}
.ci-steps{display:flex;gap:8px;padding:10px 14px;flex-wrap:wrap}
.ci-step{font-size:12px;color:var(--dsw-alias-label-tertiary)}
.ci-step.on{color:var(--dsw-alias-brand-primary);font-weight:650}
.ci-wizard{padding:8px 14px 16px}
.ci-side{display:grid;grid-template-columns:168px 1fr;min-height:360px}
.ci-side-nav{border-right:1px solid var(--dsw-alias-border-l1);padding:8px}
.ci-side-btn{display:block;width:100%;text-align:left;border:0;background:transparent;color:inherit;font:inherit;font-size:13px;padding:8px 10px;border-radius:8px;cursor:pointer}
.ci-side-btn.on,.ci-side-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}
.ci-side-main{min-width:0;padding:8px 0 16px}
.ci-block{margin:0 14px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:10px 12px}
.ci-block h4{margin:0 0 8px;font-size:13px}
.ci-np-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;padding:0 14px 14px}
.ci-np-card{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:12px;background:var(--dsw-alias-bg-layer-2)}
.ci-np-id{background:none;border:0;padding:0;color:var(--dsw-alias-brand-primary);cursor:pointer;font:inherit;font-size:13px}
.ci-more{position:relative}
.ci-menu{position:absolute;right:0;top:22px;z-index:5;min-width:140px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:4px;box-shadow:var(--dsw-alias-shadow)}
.ci-menu button{display:block;width:100%;text-align:left;border:0;background:transparent;color:inherit;font:inherit;font-size:13px;padding:6px 8px;border-radius:6px;cursor:pointer}
.ci-menu button:hover{background:var(--dsw-alias-interactive-bg-hover)}
.ci-check{display:flex;align-items:center;gap:8px;font-size:13px;margin:8px 0}
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

    function ConfirmDialog({ open, title, text, busy, danger, onCancel, onConfirm }) {
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

    const TKE_REGIONS = [
      { id: "ap-guangzhou", label: "广州" },
      { id: "ap-shanghai", label: "上海" },
      { id: "ap-nanjing", label: "南京" },
      { id: "ap-beijing", label: "北京" },
      { id: "ap-chengdu", label: "成都" },
      { id: "ap-chongqing", label: "重庆" },
      { id: "ap-hongkong", label: "香港" },
      { id: "ap-singapore", label: "新加坡" },
      { id: "ap-jakarta", label: "雅加达" },
      { id: "ap-tokyo", label: "东京" },
      { id: "ap-seoul", label: "首尔" },
      { id: "ap-bangkok", label: "曼谷" },
      { id: "na-siliconvalley", label: "硅谷" },
      { id: "na-ashburn", label: "弗吉尼亚" },
      { id: "eu-frankfurt", label: "法兰克福" },
    ];
    const CLUSTER_TYPES = [
      { id: "", label: "全部类型" },
      { id: "MANAGED_CLUSTER", label: "标准集群" },
      { id: "INDEPENDENT_CLUSTER", label: "独立集群" },
      { id: "SERVERLESS_CLUSTER", label: "弹性集群" },
      { id: "EDGE_CLUSTER", label: "边缘集群" },
      { id: "EXTERNAL_CLUSTER", label: "注册集群" },
    ];
    const CLUSTER_STATUS = [
      { id: "", label: "全部状态" },
      { id: "Running", label: "运行中" },
      { id: "Initializing", label: "创建中" },
      { id: "Idling", label: "空闲" },
      { id: "Abnormal", label: "异常" },
    ];
    const SIDEBAR_PAGES = [
      { id: "basic", title: "基本信息" },
      { id: "nodes", title: "节点管理" },
      { id: "pools", title: "节点池" },
      { id: "namespaces", title: "命名空间" },
      { id: "addons", title: "组件管理" },
      { id: "rbac", title: "授权管理" },
      { id: "policy", title: "策略管理" },
      { id: "ops", title: "运维功能" },
    ];
    const CREATE_TYPES = [
      { id: "MANAGED_CLUSTER", title: "标准集群", desc: "托管 Master，四步向导创建，可先建空集群。" },
      { id: "SERVERLESS_CLUSTER", title: "弹性集群", desc: "新建入口已关闭。存量仍可管理；请改用标准集群并添加超级节点。", closed: true },
      { id: "EDGE_CLUSTER", title: "边缘集群", desc: "适用于边缘节点的官方创建向导。" },
      { id: "EXTERNAL_CLUSTER", title: "注册集群", desc: "将已有 Kubernetes 集群注册到 TKE。" },
    ];

    function col(item, label) {
      return cellValue(item, label);
    }

    function ClusterListTable({ items, pendingId, menuId, onOpen, onMenu, onProtect, onDelete }) {
      const rows = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!rows.length) return h("div", { className: "ci-empty" }, "请选择地域后查看该地域集群，或当前筛选无数据");
      const template = "minmax(160px,1.6fr) 84px minmax(88px,0.8fr) 64px minmax(88px,0.8fr) minmax(120px,1fr) 72px";
      return h("div", { className: "ci-list" },
        h("div", { className: "ci-row head", style: { gridTemplateColumns: template } },
          h("div", { className: "ci-cell" }, "集群 ID/名称"),
          h("div", { className: "ci-cell" }, "状态"),
          h("div", { className: "ci-cell" }, "Kubernetes 版本"),
          h("div", { className: "ci-cell" }, "节点数"),
          h("div", { className: "ci-cell" }, "所在网络"),
          h("div", { className: "ci-cell" }, "创建时间"),
          h("div", { className: "ci-cell" }, "操作"),
        ),
        rows.map((item) => h("div", { key: item.id, className: "ci-row", style: { gridTemplateColumns: template } },
          h("div", { className: "ci-cell" },
            h("button", {
              type: "button",
              className: "ci-name",
              title: col(item, "集群ID") || item.title,
              disabled: pendingId === item.id,
              onClick: () => onOpen(item),
            }, col(item, "集群ID") || item.title),
            h("div", { style: { fontSize: 12, color: "var(--dsw-alias-label-tertiary)" } }, item.title),
          ),
          h("div", { className: "ci-cell" }, h(StatusCell, { status: item.status })),
          h("div", { className: "ci-cell" }, col(item, "Kubernetes 版本") || "-"),
          h("div", { className: "ci-cell num" }, col(item, "节点数") || "0"),
          h("div", { className: "ci-cell" }, col(item, "所在网络") || "-"),
          h("div", { className: "ci-cell" }, col(item, "创建时间") || "-"),
          h("div", { className: "ci-cell ci-ops" },
            h("div", { className: "ci-more" },
              h("button", { type: "button", className: "ci-link", onClick: () => onMenu(menuId === item.id ? "" : item.id) }, "更多"),
              menuId === item.id ? h("div", { className: "ci-menu" },
                h("button", { type: "button", onClick: () => onProtect(item) }, "关闭删除保护"),
                h("button", { type: "button", className: "ci-link danger", onClick: () => onDelete(item) }, "删除"),
              ) : null,
            ),
          ),
        )),
      );
    }

    function CreateWizard({ createType, onBack, onCreated, region, busy, setBusy, setErr }) {
      const [step, setStep] = useState(1);
      const [draft, setDraft] = useState({
        clusterName: "",
        clusterVersion: "1.28.3",
        runtime: "containerd",
        vpcId: "",
        clusterCidr: "172.16.0.0/16",
        serviceCidr: "10.200.0.0/22",
        addons: "",
        sla: false,
      });
      const steps = createType === "MANAGED_CLUSTER"
        ? ["集群信息", "网络", "组件", "确认"]
        : ["集群信息", "网络", "确认"];
      const max = steps.length;
      const set = (key, value) => setDraft({ ...draft, [key]: value });
      const submit = async () => {
        setBusy(true);
        setErr("");
        try {
          await api("action", {
            moduleId: "tencent.tke",
            action: "cluster.create",
            region,
            payload: {
              region,
              clusterType: createType,
              clusterName: draft.clusterName,
              clusterVersion: draft.clusterVersion,
              runtime: draft.runtime,
              vpcId: draft.vpcId,
              clusterCidr: draft.clusterCidr,
              serviceCidr: draft.serviceCidr,
              addons: String(draft.addons || "").split(/[,\s]+/).filter(Boolean),
              sla: draft.sla === true,
            },
          });
          onCreated();
        } catch (e) {
          setErr(publicErrorMessage(e));
        } finally {
          setBusy(false);
        }
      };
      return [
        h("div", { key: "crumb", className: "ci-crumb" },
          h("button", { type: "button", className: "ci-back", onClick: onBack }, "返回"),
          h("span", { className: "ci-head-t" }, "新建 · " + (CREATE_TYPES.find((x) => x.id === createType)?.title || "")),
        ),
        h("div", { key: "steps", className: "ci-steps" }, steps.map((label, idx) => h("span", {
          key: label,
          className: "ci-step" + (step === idx + 1 ? " on" : ""),
        }, `${idx + 1}. ${label}`))),
        h("div", { key: "wiz", className: "ci-wizard" },
          step === 1 ? [
            h("div", { className: "ci-field", key: "n" }, h("label", null, "集群名称"), h("input", { value: draft.clusterName, onChange: (e) => set("clusterName", e.target.value) })),
            h("div", { className: "ci-field", key: "v" }, h("label", null, "Kubernetes 版本"), h("input", { value: draft.clusterVersion, onChange: (e) => set("clusterVersion", e.target.value) })),
            h("div", { className: "ci-field", key: "r" }, h("label", null, "运行时"), h("input", { value: draft.runtime, onChange: (e) => set("runtime", e.target.value) })),
          ] : null,
          step === 2 ? [
            h("div", { className: "ci-field", key: "vpc" }, h("label", null, "VPC"), h("input", { value: draft.vpcId, placeholder: "vpc-xxxxxxxx", onChange: (e) => set("vpcId", e.target.value) })),
            h("div", { className: "ci-field", key: "cc" }, h("label", null, "容器网段"), h("input", { value: draft.clusterCidr, onChange: (e) => set("clusterCidr", e.target.value) })),
            h("div", { className: "ci-field", key: "sc" }, h("label", null, "Service 网段"), h("input", { value: draft.serviceCidr, onChange: (e) => set("serviceCidr", e.target.value) })),
          ] : null,
          createType === "MANAGED_CLUSTER" && step === 3 ? [
            h("p", { className: "ci-hint", key: "hint" }, "组件可跳过。空集群可以不含 Worker 节点。"),
            h("div", { className: "ci-field", key: "ad" }, h("label", null, "组件（可选，逗号分隔）"), h("input", { value: draft.addons, placeholder: "CBS, COS", onChange: (e) => set("addons", e.target.value) })),
          ] : null,
          step === max ? [
            h("p", { className: "ci-hint", key: "sum" }, `将在 ${region} 创建${CREATE_TYPES.find((x) => x.id === createType)?.title || "集群"}「${draft.clusterName || "-"}」，版本 ${draft.clusterVersion}。`),
            h("label", { className: "ci-check", key: "sla" },
              h("input", { type: "checkbox", checked: !!draft.sla, onChange: (e) => set("sla", e.target.checked) }),
              "我已阅读并同意腾讯云 TKE 服务等级协议（SLA）",
            ),
          ] : null,
          h("div", { className: "ci-modal-actions", key: "nav" },
            step > 1 ? h("button", { type: "button", className: "ci-mini", disabled: busy, onClick: () => setStep(step - 1) }, "上一步") : null,
            createType === "MANAGED_CLUSTER" && step === 3 ? h("button", { type: "button", className: "ci-mini", disabled: busy, onClick: () => setStep(4) }, "跳过") : null,
            step < max ? h("button", { type: "button", className: "ci-mini primary", disabled: busy, onClick: () => setStep(step + 1) }, "下一步")
              : h("button", { type: "button", className: "ci-mini primary", disabled: busy || !draft.sla, onClick: submit }, busy ? "提交中" : "确定创建"),
          ),
        ),
      ];
    }

    function DeleteWizard({ item, region, onBack, onDone, busy, setBusy, setErr }) {
      const [step, setStep] = useState(1);
      const [retainCbs, setRetainCbs] = useState(true);
      const [mode, setMode] = useState("retain");
      const [riskAck, setRiskAck] = useState(false);
      const submit = async () => {
        setBusy(true);
        setErr("");
        try {
          await api("action", {
            moduleId: item.moduleId,
            id: item.id,
            action: "cluster.delete",
            region,
            payload: { region, clusterId: col(item, "集群ID"), instanceDeleteMode: mode, retainCbs, riskAck: true },
          });
          onDone();
        } catch (e) {
          setErr(publicErrorMessage(e));
        } finally {
          setBusy(false);
        }
      };
      return [
        h("div", { key: "crumb", className: "ci-crumb" },
          h("button", { type: "button", className: "ci-back", onClick: onBack }, "返回"),
          h("span", { className: "ci-head-t" }, "删除集群 · " + item.title),
        ),
        h("div", { key: "wiz", className: "ci-wizard" },
          step === 1 ? h("p", { className: "ci-hint" }, "删除前请先关闭删除保护。若仍存在普通、原生或超级节点，将禁止删除。") : null,
          step === 2 ? [
            h("p", { className: "ci-hint", key: "h" }, "删除项确认：选择保留或销毁关联资源。"),
            h("label", { className: "ci-check", key: "m1" }, h("input", { type: "radio", checked: mode === "retain", onChange: () => setMode("retain") }), "保留已有节点实例"),
            h("label", { className: "ci-check", key: "m2" }, h("input", { type: "radio", checked: mode === "terminate", onChange: () => setMode("terminate") }), "销毁按量节点实例"),
            h("label", { className: "ci-check", key: "d" }, h("input", { type: "checkbox", checked: retainCbs, onChange: (e) => setRetainCbs(e.target.checked) }), "保留 CBS 云盘"),
          ] : null,
          step === 3 ? h("label", { className: "ci-check" },
            h("input", { type: "checkbox", checked: riskAck, onChange: (e) => setRiskAck(e.target.checked) }),
            "我已知晓风险，集群删除后不可恢复",
          ) : null,
          h("div", { className: "ci-modal-actions", key: "nav" },
            step > 1 ? h("button", { type: "button", className: "ci-mini", disabled: busy, onClick: () => setStep(step - 1) }, "上一步") : null,
            step < 3 ? h("button", { type: "button", className: "ci-mini primary", disabled: busy, onClick: () => setStep(step + 1) }, "下一步")
              : h("button", { type: "button", className: "ci-mini primary danger", disabled: busy || !riskAck, onClick: submit }, busy ? "删除中" : "确定删除"),
          ),
        ),
      ];
    }

    function ClusterDetail({ item, detail, loading, error, region, skipConfirm, onBack, onReload, onAction }) {
      const [page, setPage] = useState("basic");
      const [nodeQ, setNodeQ] = useState({ ip: "", label: "", unschedulable: "", status: "" });
      const pages = (detail && detail.pages) || SIDEBAR_PAGES;
      const blocks = (detail && detail.blocks) || [];
      const cards = (detail && detail.cards) || {};
      const flags = (detail && detail.flags) || {};
      const nodes = (cards.nodes || []).filter((row) => {
        if (nodeQ.ip && !String((row.columns || []).find((c) => c.label === "IP")?.value || "").includes(nodeQ.ip)) return false;
        if (nodeQ.status && String(row.status || "").toLowerCase() !== nodeQ.status.toLowerCase()) return false;
        if (nodeQ.unschedulable) {
          const locked = row.flags && row.flags.unschedulable;
          if (nodeQ.unschedulable === "yes" && !locked) return false;
          if (nodeQ.unschedulable === "no" && locked) return false;
        }
        if (nodeQ.label && !JSON.stringify(row).toLowerCase().includes(nodeQ.label.toLowerCase())) return false;
        return true;
      });
      return [
        h("div", { key: "crumb", className: "ci-crumb" },
          h("button", { type: "button", className: "ci-back", onClick: onBack }, "返回"),
          h("span", { className: "ci-head-t", title: item.title }, item.title),
        ),
        loading ? h("div", { key: "load", className: "ci-load" }, h(Spin), "加载详情…") : null,
        !loading && error && !detail ? h("div", { key: "ferr", className: "ci-err" }, error) : null,
        !loading && detail ? h("div", { key: "side", className: "ci-side" },
          h("div", { className: "ci-side-nav" }, pages.map((nav) => h("button", {
            key: nav.id,
            type: "button",
            className: "ci-side-btn" + (page === nav.id ? " on" : ""),
            onClick: () => setPage(nav.id),
          }, nav.title))),
          h("div", { className: "ci-side-main" },
            page === "basic" ? blocks.map((block) => h("div", { key: block.id, className: "ci-block" },
              h("h4", null, block.title),
              h("div", { className: "ci-chips" }, (block.fields || []).map((row) => h("span", { key: row.label, className: "ci-chip" }, row.label, h("b", null, row.value)))),
              block.id === "cluster" ? h("div", { className: "ci-actions" },
                h("button", { type: "button", className: "ci-mini", onClick: () => onAction("cluster.upgrade.master", { version: window.prompt("Master 目标版本", String(flags.kubernetesVersion || "")) }, "确认升级 Master？") }, "Master 升级"),
                h("button", { type: "button", className: "ci-mini", onClick: () => onAction("cluster.upgrade.node", { version: window.prompt("Node 目标版本", String(flags.kubernetesVersion || "")), upgradeType: window.prompt("升级方式 reset=重装滚动，in-place=原地滚动", "reset") }, "确认升级 Node？") }, "Node 升级"),
                h("button", { type: "button", className: "ci-mini", onClick: () => onAction("cluster.protection", { enable: !flags.deletionProtection }, flags.deletionProtection ? "关闭删除保护？" : "开启删除保护？") }, flags.deletionProtection ? "关闭删除保护" : "开启删除保护"),
              ) : null,
              block.id === "apiserver" ? h("div", { className: "ci-actions" },
                h("button", { type: "button", className: "ci-mini", onClick: () => onAction("cluster.endpoint", { scope: "intranet", enable: !flags.intranet }, flags.intranet ? "关闭内网访问？" : "开启内网访问？") }, flags.intranet ? "关闭内网" : "开启内网"),
                h("button", { type: "button", className: "ci-mini", onClick: () => onAction("cluster.endpoint", { scope: "internet", enable: !flags.internet }, flags.internet ? "关闭外网访问？" : "开启外网访问？") }, flags.internet ? "关闭外网" : "开启外网"),
                flags.kubeconfigAvailable ? h("button", { type: "button", className: "ci-mini primary", onClick: () => onAction("cluster.kubeconfig", {}, "", { copy: true }) }, "复制 kubeconfig") : null,
                flags.kubeconfigAvailable ? h("button", { type: "button", className: "ci-mini", onClick: () => onAction("cluster.kubeconfig", {}, "", { download: true }) }, "下载 kubeconfig") : null,
              ) : null,
            )) : null,
            page === "nodes" ? [
              h("div", { key: "nf", className: "ci-filters" },
                h("input", { placeholder: "Label", value: nodeQ.label, onChange: (e) => setNodeQ({ ...nodeQ, label: e.target.value }) }),
                h("input", { placeholder: "IP", value: nodeQ.ip, onChange: (e) => setNodeQ({ ...nodeQ, ip: e.target.value }) }),
                h("select", { value: nodeQ.unschedulable, onChange: (e) => setNodeQ({ ...nodeQ, unschedulable: e.target.value }) },
                  h("option", { value: "" }, "封锁：全部"),
                  h("option", { value: "yes" }, "已封锁"),
                  h("option", { value: "no" }, "未封锁"),
                ),
                h("input", { placeholder: "节点状态", value: nodeQ.status, onChange: (e) => setNodeQ({ ...nodeQ, status: e.target.value }) }),
                h("button", { type: "button", className: "ci-mini", onClick: () => onAction("node.addExisted", { instanceIds: window.prompt("已有节点 InstanceId，逗号分隔") }, "确认添加已有节点？") }, "添加已有节点"),
                h("button", { type: "button", className: "ci-mini primary", onClick: () => onAction("node.create", { runInstancePara: {} }, "确认新建节点？") }, "新建节点"),
              ),
              nodes.length ? h("div", { key: "nt", className: "ci-table-wrap" }, h("table", { className: "ci-table" },
                h("thead", null, h("tr", null, h("th", null, "实例 ID"), h("th", null, "IP"), h("th", null, "封锁"), h("th", null, "状态"), h("th", null, "操作"))),
                h("tbody", null, nodes.map((row) => h("tr", { key: row.id },
                  h("td", null, row.id),
                  h("td", null, (row.columns || []).find((c) => c.label === "IP")?.value || "-"),
                  h("td", null, row.flags && row.flags.unschedulable ? "是" : "否"),
                  h("td", null, row.status || "-"),
                  h("td", { className: "ci-ops-cell" }, h("div", { className: "ci-ops" },
                    h("button", { type: "button", className: "ci-link", onClick: () => onAction(row.flags && row.flags.unschedulable ? "node.uncordon" : "node.cordon", { instanceId: row.id, nodeName: row.id }, row.flags && row.flags.unschedulable ? "取消封锁？" : "封锁该节点？") }, row.flags && row.flags.unschedulable ? "取消封锁" : "封锁"),
                    h("button", { type: "button", className: "ci-link", onClick: () => onAction("node.drain", { instanceId: row.id }, `确定驱逐 ${row.id}？`, { always: true }) }, "驱逐"),
                    h("button", { type: "button", className: "ci-link danger", onClick: () => onAction("node.remove", { instanceId: row.id }, `确定移除 ${row.id}？`, { always: true }) }, "移除"),
                  )),
                ))),
              )) : h("div", { key: "ne", className: "ci-empty" }, "没有节点"),
            ] : null,
            page === "pools" ? [
              h("div", { key: "pa", className: "ci-sec" },
                h("span", { className: "ci-sec-t" }, "节点池名片"),
                h("button", { type: "button", className: "ci-mini primary", onClick: () => {
                  const poolType = window.prompt("节点池类型：Regular / Native / Super", "Regular");
                  if (!poolType) return;
                  const name = window.prompt("节点池名称");
                  if (!name) return;
                  onAction("nodepool.create", { poolType, name, desired: Number(window.prompt("期望节点数", "0") || 0) }, "确认新建节点池？");
                } }, "新建节点池"),
              ),
              (cards.nodePools || []).length ? h("div", { key: "pg", className: "ci-np-grid" }, (cards.nodePools || []).map((pool) => h("div", { key: pool.id, className: "ci-np-card" },
                h("button", { type: "button", className: "ci-np-id", onClick: () => onAction("nodepool.scale", { nodePoolId: pool.id, desired: Number(window.prompt("期望节点数", String(pool.flags?.desired || 0))) }, "确认调整数量？") }, pool.id),
                h("div", { className: "ci-head-t" }, pool.title),
                h("div", { className: "ci-hint" }, (pool.badges || []).join(" · ")),
                h("div", { className: "ci-chips" }, (pool.columns || []).map((row) => h("span", { key: row.label, className: "ci-chip" }, row.label, h("b", null, row.value)))),
                h("div", { className: "ci-ops" },
                  h("button", { type: "button", className: "ci-link", onClick: () => onAction("nodepool.scale", { nodePoolId: pool.id, desired: Number(window.prompt("期望节点数", String(pool.flags?.desired || 0))) }, "确认调整数量？") }, "调整数量"),
                  h("button", { type: "button", className: "ci-link", onClick: () => onAction("nodepool.autoscale", { nodePoolId: pool.id, enable: !pool.flags?.autoscaling }, pool.flags?.autoscaling ? "关闭弹性伸缩？" : "开启弹性伸缩？") }, "弹性伸缩"),
                  h("button", { type: "button", className: "ci-link", onClick: () => onAction("nodepool.protection", { nodePoolId: pool.id, enable: !pool.flags?.deletionProtection }, "切换节点池删除保护？") }, "删除保护"),
                  h("button", { type: "button", className: "ci-link danger", onClick: () => onAction("nodepool.delete", { nodePoolId: pool.id }, `删除节点池 ${pool.title}？`, { always: true }) }, "删除"),
                ),
              ))) : h("div", { key: "pe", className: "ci-empty" }, "没有节点池"),
            ] : null,
            page === "namespaces" ? [
              h("div", { key: "ns", className: "ci-sec" },
                h("span", { className: "ci-sec-t" }, "命名空间"),
                h("button", { type: "button", className: "ci-mini primary", onClick: () => {
                  const name = window.prompt("命名空间名称");
                  if (!name) return;
                  const cpu = window.prompt("CPU 配额（可空）", "");
                  onAction("namespace.create", { name, quota: cpu ? { cpu } : {} }, "确认新建命名空间？");
                } }, "新建"),
              ),
              (cards.namespaces || []).length ? h("div", { key: "nl", className: "ci-table-wrap" }, h("table", { className: "ci-table" },
                h("thead", null, h("tr", null, h("th", null, "名称"), h("th", null, "状态"), h("th", null, "操作"))),
                h("tbody", null, (cards.namespaces || []).map((row) => h("tr", { key: row.id },
                  h("td", null, row.title),
                  h("td", null, row.status || "-"),
                  h("td", null, h("button", { type: "button", className: "ci-link danger", onClick: () => onAction("namespace.delete", { name: row.id }, `删除命名空间 ${row.title}？`, { always: true }) }, "删除")),
                ))),
              )) : h("div", { key: "ne2", className: "ci-empty" }, "没有命名空间"),
            ] : null,
            page === "addons" ? [
              h("div", { key: "as", className: "ci-sec" },
                h("span", { className: "ci-sec-t" }, "组件管理"),
                h("button", { type: "button", className: "ci-mini primary", onClick: () => {
                  const name = window.prompt("组件名称");
                  if (!name) return;
                  onAction("addon.install", { name, version: window.prompt("版本（可空）", "") }, "确认安装组件？");
                } }, "安装组件"),
              ),
              (cards.addons || []).length ? h("div", { key: "al", className: "ci-table-wrap" }, h("table", { className: "ci-table" },
                h("thead", null, h("tr", null, h("th", null, "组件"), h("th", null, "版本"), h("th", null, "状态"), h("th", null, "操作"))),
                h("tbody", null, (cards.addons || []).map((row) => h("tr", { key: row.id },
                  h("td", null, row.title),
                  h("td", null, (row.columns || []).find((c) => c.label === "版本")?.value || "-"),
                  h("td", null, row.status || "-"),
                  h("td", { className: "ci-ops-cell" }, h("div", { className: "ci-ops" },
                    h("button", { type: "button", className: "ci-link", onClick: () => onAction("addon.upgrade", { name: row.id, version: window.prompt("目标版本") }, "确认升级组件？") }, "升级"),
                    h("button", { type: "button", className: "ci-link danger", onClick: () => onAction("addon.uninstall", { name: row.id }, `卸载 ${row.title}？`, { always: true }) }, "卸载"),
                  )),
                ))),
              )) : h("div", { key: "ae", className: "ci-empty" }, "没有组件"),
            ] : null,
            page === "rbac" ? [
              h("div", { key: "rs", className: "ci-sec" },
                h("span", { className: "ci-sec-t" }, "授权管理"),
                h("button", { type: "button", className: "ci-mini primary", onClick: () => {
                  const user = window.prompt("子账号 UIN / 用户");
                  if (!user) return;
                  onAction("rbac.bind", { user, role: window.prompt("预设角色", "tke:admin") }, "确认绑定预设角色？");
                } }, "绑定角色"),
              ),
              (cards.bindings || []).length ? h("div", { key: "rl", className: "ci-table-wrap" }, h("table", { className: "ci-table" },
                h("thead", null, h("tr", null, h("th", null, "绑定"), h("th", null, "角色"), h("th", null, "操作"))),
                h("tbody", null, (cards.bindings || []).map((row) => h("tr", { key: row.id },
                  h("td", null, row.title),
                  h("td", null, (row.columns || []).find((c) => c.label === "角色")?.value || "-"),
                  h("td", null, h("button", { type: "button", className: "ci-link danger", onClick: () => onAction("rbac.unbind", { name: row.id }, `解除 ${row.title}？`, { always: true }) }, "解除")),
                ))),
              )) : h("div", { key: "re", className: "ci-empty" }, "没有授权绑定"),
            ] : null,
            page === "policy" ? ((cards.policies || []).length ? h("div", { className: "ci-table-wrap" }, h("table", { className: "ci-table" },
              h("thead", null, h("tr", null, h("th", null, "策略"), h("th", null, "状态"), h("th", null, "操作"))),
              h("tbody", null, (cards.policies || []).map((row) => h("tr", { key: row.id },
                h("td", null, row.title),
                h("td", null, row.flags && row.flags.enabled ? "已开启" : "已关闭"),
                h("td", null, h("button", { type: "button", className: "ci-link", onClick: () => onAction("policy.toggle", { name: row.id, enable: !(row.flags && row.flags.enabled), confirmed: true }, row.flags && row.flags.enabled ? "关闭该预置策略？需二次确认。" : "开启该预置策略？", { always: !!(row.flags && row.flags.enabled) }) }, row.flags && row.flags.enabled ? "关闭" : "开启")),
              ))),
            )) : h("div", { className: "ci-empty" }, "没有预置策略")) : null,
            page === "ops" ? h("div", { className: "ci-block" },
              h("h4", null, "运维功能"),
              h("p", { className: "ci-hint" }, "仅开关集群审计与事件投递，不内嵌 CLS 大盘，也不把日志正文打进对话。"),
              h("div", { className: "ci-actions" },
                h("button", { type: "button", className: "ci-mini", onClick: () => onAction("ops.audit", { enable: !flags.audit }, flags.audit ? "关闭集群审计？" : "开启集群审计？") }, flags.audit ? "关闭审计" : "开启审计"),
                h("button", { type: "button", className: "ci-mini", onClick: () => onAction("ops.event", { enable: !flags.event }, flags.event ? "关闭事件投递？" : "开启事件投递？") }, flags.event ? "关闭事件投递" : "开启事件投递"),
              ),
            ) : null,
          ),
        ) : null,
      ];
    }

    function ClusterConsole({ payload, args, running, skipConfirm, onSkipConfirm }) {
      useEffect(() => ensureCss(), []);
      const fromTool = Array.isArray(payload?.items) ? payload.items : null;
      const provider = String(args.provider || "");
      const pageSize = Math.max(1, Number(args.limit) || 12);
      const initialQuery = payload?.query != null ? String(payload.query) : String(args.query || "");
      const [region, setRegion] = useState(String(payload?.region || args.region || ""));
      const [filters, setFilters] = useState({ clusterType: "", status: "", vpcId: "", tag: "" });
      const [rows, setRows] = useState(fromTool || []);
      const [total, setTotal] = useState(Number(payload?.total) || (fromTool || []).length);
      const [offset, setOffset] = useState(Number(payload?.offset) || 0);
      const [hasMore, setHasMore] = useState(!!payload?.hasMore);
      const [listBusy, setListBusy] = useState(false);
      const [listErr, setListErr] = useState("");
      const [draftQ, setDraftQ] = useState(initialQuery);
      const [activeQ, setActiveQ] = useState(initialQuery);
      const [pendingId, setPendingId] = useState("");
      const [menuId, setMenuId] = useState("");
      const [screen, setScreen] = useState("list");
      const [createType, setCreateType] = useState("");
      const [session, setSession] = useState(null);
      const [deleteItem, setDeleteItem] = useState(null);
      const [busy, setBusy] = useState(false);
      const [err, setErr] = useState("");
      const [confirm, setConfirm] = useState(null);
      const seq = useRef(0);
      const fetchList = async (nextOffset, q, nextRegion, nextFilters) => {
        const usedRegion = nextRegion != null ? nextRegion : region;
        if (!usedRegion) {
          setRows([]);
          setTotal(0);
          setListErr("");
          return;
        }
        const n = ++seq.current;
        setListBusy(true);
        setListErr("");
        try {
          const result = await api("query", {
            query: q,
            kind: "cluster",
            provider,
            region: usedRegion,
            filters: nextFilters || filters,
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
      useEffect(() => {
        if (region) fetchList(0, String(activeQ || draftQ || "").trim(), region, filters);
      }, [region]);
      const openItem = async (item) => {
        setPendingId(item.id);
        setSession({ item, loading: true, detail: null });
        setScreen("detail");
        try {
          const detail = await api("detail", { moduleId: item.moduleId, id: item.id, title: item.title, region });
          setSession({ item, loading: false, detail });
        } catch (e) {
          setSession({ item, loading: false, detail: null, error: publicErrorMessage(e) });
        } finally {
          setPendingId("");
        }
      };
      const reload = async () => {
        if (!session?.item) return;
        const detail = await api("detail", { moduleId: session.item.moduleId, id: session.item.id, title: session.item.title, region });
        setSession((cur) => cur ? { ...cur, detail, loading: false } : cur);
      };
      const runAction = async (action, payload, opts) => {
        const target = session?.item || deleteItem;
        setBusy(true);
        setErr("");
        try {
          const result = await api("action", {
            moduleId: target?.moduleId || "tencent.tke",
            id: target?.id || "",
            action,
            region,
            payload: { region, clusterId: target ? col(target, "集群ID") : "", ...payload },
          });
          if (opts && opts.copy && result.data && result.data.kubeconfig && navigator.clipboard) {
            await navigator.clipboard.writeText(String(result.data.kubeconfig));
          }
          if (opts && opts.download && result.data && result.data.kubeconfig) {
            const blob = new Blob([String(result.data.kubeconfig)], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = String(result.data.filename || "cluster.kubeconfig");
            a.click();
            URL.revokeObjectURL(url);
          }
          setConfirm(null);
          if (session?.item) await reload();
          else await fetchList(offset, activeQ, region, filters);
        } catch (e) {
          setErr(publicErrorMessage(e));
        } finally {
          setBusy(false);
        }
      };
      const requestAction = async (action, payload, text, opts) => {
        let skip = skipConfirm;
        try {
          const d = await api("meta", {});
          skip = !!d.skipConfirm;
          if (onSkipConfirm) onSkipConfirm(skip);
        } catch { /* keep */ }
        const always = !!(opts && opts.always);
        if (always || (!skip && text)) {
          setConfirm({ action, payload, text, opts, danger: always });
          return;
        }
        return runAction(action, payload, opts);
      };
      if (running) return null;
      const counted = Number(total) || rows.length;
      const pages = Math.max(1, Math.ceil(counted / pageSize) || 1);
      const extra = hasMore && offset + rows.length >= counted ? 1 : 0;
      const pageCount = Math.max(pages, Math.floor(offset / pageSize) + 1 + extra);
      const page = Math.floor(offset / pageSize) + 1;
      return h("div", { className: "ci-root ci-tool" },
        h("div", { className: "ci-panel" },
          screen === "create" && createType ? h(CreateWizard, {
            createType,
            region,
            busy,
            setBusy,
            setErr,
            onBack: () => { setScreen("list"); setCreateType(""); },
            onCreated: () => { setScreen("list"); setCreateType(""); fetchList(0, activeQ, region, filters); },
          }) : null,
          screen === "create" && !createType ? [
            h("div", { key: "crumb", className: "ci-crumb" },
              h("button", { type: "button", className: "ci-back", onClick: () => setScreen("list") }, "返回"),
              h("span", { className: "ci-head-t" }, "选择集群类型"),
            ),
            h("div", { key: "cards", className: "ci-type-grid" }, CREATE_TYPES.map((card) => h("button", {
              key: card.id,
              type: "button",
              className: "ci-type-card" + (card.closed ? " closed" : ""),
              disabled: !!card.closed,
              onClick: () => { if (!card.closed) setCreateType(card.id); },
            }, h("h4", null, card.title), h("p", null, card.desc)))),
          ] : null,
          screen === "delete" && deleteItem ? h(DeleteWizard, {
            item: deleteItem,
            region,
            busy,
            setBusy,
            setErr,
            onBack: () => { setScreen("list"); setDeleteItem(null); },
            onDone: () => { setScreen("list"); setDeleteItem(null); fetchList(0, activeQ, region, filters); },
          }) : null,
          screen === "detail" && session ? h(ClusterDetail, {
            item: session.item,
            detail: session.detail,
            loading: session.loading,
            error: session.error,
            region,
            skipConfirm,
            onBack: () => { setSession(null); setScreen("list"); },
            onReload: reload,
            onAction: requestAction,
          }) : null,
          screen === "list" ? [
            h("div", { key: "bar", className: "ci-bar" },
              h("div", { className: "ci-bar-left" },
                h("span", { className: "ci-bar-title" }, "集群"),
                h("span", { className: "ci-bar-count" }, `${counted} 条`),
              ),
              h("div", { className: "ci-ops" },
                h("select", {
                  className: "ci-region",
                  value: region,
                  onChange: (e) => { setRegion(e.target.value); setOffset(0); },
                }, [h("option", { key: "", value: "" }, "选择地域"), ...TKE_REGIONS.map((item) => h("option", { key: item.id, value: item.id }, `${item.label}（${item.id}）`))]),
                h("button", { type: "button", className: "ci-mini", disabled: listBusy || !region, onClick: () => fetchList(offset, activeQ, region, filters) }, "刷新"),
                h("button", { type: "button", className: "ci-mini primary", disabled: !region, onClick: () => { setCreateType(""); setScreen("create"); } }, "新建"),
              ),
            ),
            h("div", { key: "filters", className: "ci-filters" },
              h("input", { className: "ci-search", style: { width: 160, paddingLeft: 10 }, placeholder: "名称", value: draftQ, onChange: (e) => setDraftQ(e.target.value), onKeyDown: (e) => { if (e.key === "Enter") fetchList(0, draftQ, region, filters); } }),
              h("select", { value: filters.clusterType, onChange: (e) => { const next = { ...filters, clusterType: e.target.value }; setFilters(next); fetchList(0, draftQ, region, next); } }, CLUSTER_TYPES.map((item) => h("option", { key: item.id, value: item.id }, item.label))),
              h("select", { value: filters.status, onChange: (e) => { const next = { ...filters, status: e.target.value }; setFilters(next); fetchList(0, draftQ, region, next); } }, CLUSTER_STATUS.map((item) => h("option", { key: item.id, value: item.id }, item.label))),
              h("input", { placeholder: "VPC", value: filters.vpcId, onChange: (e) => setFilters({ ...filters, vpcId: e.target.value }), onBlur: () => fetchList(0, draftQ, region, filters) }),
              h("input", { placeholder: "标签", value: filters.tag, onChange: (e) => setFilters({ ...filters, tag: e.target.value }), onBlur: () => fetchList(0, draftQ, region, filters) }),
            ),
            listErr || err ? h("div", { key: "lerr", className: "ci-err" }, listErr || err) : null,
            listBusy ? h("div", { key: "load", className: "ci-load" }, h(Spin), "加载列表…") : h(ClusterListTable, {
              key: "table",
              items: rows,
              pendingId,
              menuId,
              onOpen: openItem,
              onMenu: setMenuId,
              onProtect: (item) => requestAction("cluster.protection", { enable: false, clusterId: col(item, "集群ID") }, "关闭删除保护？"),
              onDelete: (item) => { setDeleteItem(item); setScreen("delete"); setMenuId(""); },
            }),
            h(Pager, { key: "pager", total: counted, page, pages: pageCount, busy: listBusy, onPage: (next) => fetchList((next - 1) * pageSize, activeQ, region, filters) }),
          ] : null,
          h(ConfirmDialog, {
            key: "confirm",
            open: !!confirm,
            title: confirm?.action || "确认",
            text: confirm?.text,
            busy,
            danger: !!confirm?.danger,
            onCancel: () => { if (!busy) setConfirm(null); },
            onConfirm: () => confirm && runAction(confirm.action, confirm.payload, confirm.opts),
          }),
        ),
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
      if (kind === "cluster") {
        return h(CiBoundary, null, h(ClusterConsole, {
          payload,
          args,
          running,
          skipConfirm,
          onSkipConfirm: setSkipConfirm,
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
              h("span", { className: "ci-cfg-d" }, "配置各云厂商 AccessKey，查询域名与 TKE 集群。地域在资源列表中选择，不写入设置。"),
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
                (provider.fields || []).map((field) => h("div", { key: field.key },
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
