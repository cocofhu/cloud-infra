window.__ModuleLoader__.load({
  id: "@cocofhu/cloud-infra",
  factory: (require) => {
    const React = require("react");
    const h = React.createElement;
    const { useEffect, useState, useRef } = React;

    const CSS = `
.ci-root,.ci-tool{font-family:inherit;color:var(--dsw-alias-label-primary);width:100%;max-width:100%;min-width:0;box-sizing:border-box;padding:2px 0 6px}
.ci-panel{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden;width:100%;max-width:100%;min-width:0;box-sizing:border-box}
.ci-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;min-width:0;flex-wrap:nowrap}
.ci-bar-left{display:flex;align-items:baseline;gap:8px;min-width:0;flex-shrink:0;white-space:nowrap}
.ci-bar-title{font-size:14px;font-weight:650;line-height:22px;color:var(--dsw-alias-label-primary)}
.ci-bar-count{color:var(--dsw-alias-label-tertiary);font-size:12px}
.ci-search-wrap{position:relative;flex:1 1 160px;min-width:128px;max-width:220px;width:auto}
.ci-search-ico{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--dsw-alias-label-caption);pointer-events:none}
.ci-search{width:100%;height:32px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:0 28px 0 32px;font:inherit;font-size:13px;background:var(--dsw-alias-bg-layer-2);color:inherit;box-sizing:border-box;appearance:none;-webkit-appearance:none}
.ci-search::-webkit-search-cancel-button,.ci-search::-webkit-search-decoration{appearance:none;-webkit-appearance:none;display:none}
.ci-search:focus{outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent)}
.ci-search-x{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:22px;height:22px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;font:inherit;line-height:1}
.ci-search-x:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.ci-list{border-top:1px solid var(--dsw-alias-border-l1);overflow-x:hidden;overflow-y:auto;width:100%;max-width:100%;min-width:0}
.ci-row{display:grid;align-items:center;gap:8px;padding:9px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);min-width:0;width:100%;max-width:100%;box-sizing:border-box}
.ci-row.head{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:500;padding:8px 14px}
.ci-row:last-child{border-bottom:0}
.ci-row:not(.head):hover,.ci-row:not(.head).open{background:var(--dsw-alias-interactive-bg-hover)}
.ci-row:not(.head).open{position:relative;z-index:4}
.ci-cell{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary)}
.ci-cell.ci-ops-cell{overflow:visible;min-width:0;background:inherit}
.ci-row.head .ci-cell{color:var(--dsw-alias-label-tertiary)}
.ci-cell.num{font-variant-numeric:tabular-nums}
.ci-name{font-weight:550;color:var(--dsw-alias-label-primary);background:none;border:0;padding:0;cursor:pointer;font:inherit;font-size:13px;text-align:left;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ci-name:hover{color:var(--dsw-alias-brand-primary)}
.ci-ops{display:flex;align-items:center;gap:8px;flex-wrap:nowrap;white-space:nowrap;background:inherit}
.ci-ops > *{flex-shrink:0}
.ci-link{appearance:none;-webkit-appearance:none;background:transparent;border:0;padding:0;margin:0;cursor:pointer;font:inherit;font-size:13px;color:var(--dsw-alias-brand-primary)}
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
.ci-sec-empty{display:flex;align-items:center;gap:8px;padding:0 14px 14px;font-size:13px;color:var(--dsw-alias-label-secondary);line-height:22px}
.ci-table-wrap{width:100%;overflow:auto}
.ci-table{width:100%;min-width:520px;border-collapse:collapse;font-size:13px}
.ci-table th,.ci-table td{text-align:left;padding:8px 12px;border-top:1px solid var(--dsw-alias-border-l1);vertical-align:middle}
.ci-table th{color:var(--dsw-alias-label-tertiary);font-weight:500;font-size:12px}
.ci-table td{word-break:break-all;color:var(--dsw-alias-label-secondary)}
.ci-table td.ci-ops-cell{white-space:nowrap;word-break:normal}
.ci-table tbody tr:hover td{background:var(--dsw-alias-interactive-bg-hover)}
.ci-rec-page{margin:0}
.ci-mini{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);color:var(--dsw-alias-label-primary);border-radius:8px;padding:5px 12px;cursor:pointer;font:inherit;font-size:13px;white-space:nowrap;flex-shrink:0}
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
.ci-groups{display:flex;gap:16px;padding:0 14px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.ci-group{background:none;border:0;border-bottom:2px solid transparent;padding:8px 0;margin-bottom:-1px;cursor:pointer;font:inherit;font-size:13px;color:var(--dsw-alias-label-tertiary)}
.ci-group.active{color:var(--dsw-alias-brand-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:600}
.ci-bar-actions{display:flex;align-items:center;gap:8px;flex-wrap:nowrap;min-width:0;flex:1;justify-content:flex-end}
.ci-dl{display:grid;grid-template-columns:120px 1fr;gap:6px 10px;padding:0 14px 14px;font-size:13px}
.ci-dl span{color:var(--dsw-alias-label-tertiary)}
.ci-dl b{font-weight:600;color:var(--dsw-alias-label-primary);word-break:break-all}
.ci-more{position:relative;display:inline-flex;background:inherit}
.ci-more-menu{position:fixed;z-index:60;min-width:128px;padding:6px 0;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background-color:Canvas;box-shadow:0 8px 24px rgba(0,0,0,.16);overflow:hidden;isolation:isolate}
.ci-more-menu::before{content:"";position:absolute;inset:0;background:var(--dsw-alias-button-elevated-fill,var(--dsw-alias-bg-layer-1));pointer-events:none;border-radius:inherit}
.ci-more-item{display:block;width:100%;text-align:left;background:transparent;border:0;padding:6px 12px;cursor:pointer;font:inherit;font-size:13px;color:var(--dsw-alias-label-primary);position:relative;z-index:1}
.ci-more-item:hover{background:var(--dsw-alias-interactive-bg-hover)}
.ci-more-item.danger{color:var(--dsw-alias-state-error-primary)}
.ci-field textarea{min-height:88px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:inherit;padding:8px 10px;font:inherit;resize:vertical}
.ci-field textarea:focus{outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent)}
.ci-check{display:flex;align-items:flex-start;gap:8px;padding:7px 0;font-size:13px;line-height:1.4}
.ci-modal.wide{width:min(560px,100%)}
.ci-renew{margin-left:6px}
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

    function isCloudInfraPayload(node) {
      if (!node || typeof node !== "object" || Array.isArray(node)) return false;
      if (!Array.isArray(node.items)) return false;
      if (node.kind === "cloud-infra-query") return true;
      if (node.resourceKind === "cert" || node.resourceKind === "domain" || node.resourceKind === "auto") return true;
      if (node.items[0] && node.items[0].moduleId) return true;
      if (Array.isArray(node.errors) && (node.kind === "cert" || node.kind === "domain" || node.kind === "auto")) return true;
      return false;
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
        if (isCloudInfraPayload(node)) found.push(node);
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

    function certMeta(item) {
      return (item && item.meta) || {};
    }

    function certCol(item, label) {
      const col = (item.columns || []).find((c) => c && c.label === label);
      if (col && col.value != null) return String(col.value);
      return String(certMeta(item)[label] || "");
    }

    function triggerDownload(filename, content, contentType) {
      const raw = String(content || "");
      if (!raw) throw new Error("没有可下载的内容");
      if (/-----BEGIN /i.test(raw)) throw new Error("下载内容含 PEM，不支持明文下发，请使用 zip 包下载");
      const binary = atob(raw);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: contentType || "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "certificate.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    function FieldInput({ label, value, onChange, placeholder, type, disabled }) {
      return h("div", { className: "ci-field" },
        h("label", null, label),
        type === "textarea"
          ? h("textarea", { value: value || "", placeholder: placeholder || "", disabled, onChange: (e) => onChange(e.target.value) })
          : type === "select"
            ? h("select", { value: value || "", disabled, onChange: (e) => onChange(e.target.value) }, (placeholder || []).map((opt) => h("option", { key: opt.value, value: opt.value }, opt.label)))
            : h("input", { type: type || "text", value: value || "", placeholder: placeholder || "", disabled, onChange: (e) => onChange(e.target.value) }),
      );
    }

    function MoreMenu({ item, open, onToggle, onClose, onAction }) {
      const meta = certMeta(item);
      const status = Number(meta.status);
      const items = [];
      if (status === 1) items.push({ id: "cert.replace", label: "重颁发" }, { id: "cert.revoke", label: "吊销", danger: true });
      if (meta.cancelable) {
        items.push({ id: "cert.verify", label: "查看验证状态" });
        items.push({ id: "cert.cancel", label: "取消审核" });
      } else {
        items.push({ id: "cert.delete", label: "删除", danger: true });
      }
      const btn = useRef(null);
      const menuRef = useRef(null);
      const [pos, setPos] = useState(null);
      useEffect(() => {
        if (!open) {
          setPos(null);
          return;
        }
        const place = () => {
          const el = btn.current;
          if (!el || typeof el.getBoundingClientRect !== "function") return;
          const r = el.getBoundingClientRect();
          const width = 140;
          const vw = typeof window !== "undefined" ? window.innerWidth : r.right;
          const vh = typeof window !== "undefined" ? window.innerHeight : 800;
          const left = Math.max(8, Math.min(r.right - width, vw - width - 8));
          const height = items.length * 32 + 12;
          const top = r.bottom + 4 + height > vh - 8 ? Math.max(8, r.top - height - 4) : r.bottom + 4;
          setPos({ top, left, width });
        };
        place();
        const onDoc = (e) => {
          const t = e.target;
          if (btn.current && btn.current.contains(t)) return;
          if (menuRef.current && menuRef.current.contains(t)) return;
          onClose();
        };
        const onKey = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, true);
        return () => {
          document.removeEventListener("mousedown", onDoc);
          document.removeEventListener("keydown", onKey);
          window.removeEventListener("resize", place);
          window.removeEventListener("scroll", place, true);
        };
      }, [open, items.length, onClose]);
      const menu = open && pos
        ? createPortal(h("div", {
          className: "ci-more-menu",
          role: "menu",
          ref: menuRef,
          style: { top: pos.top + "px", left: pos.left + "px", minWidth: pos.width + "px" },
        }, items.map((row) => h("button", {
          key: row.id,
          type: "button",
          role: "menuitem",
          className: "ci-more-item" + (row.danger ? " danger" : ""),
          onMouseDown: (e) => e.stopPropagation(),
          onClick: (e) => { e.stopPropagation(); onAction(row); },
        }, row.label))), document.body)
        : null;
      return h("span", { className: "ci-more" },
        h("button", {
          type: "button",
          className: "ci-link",
          ref: btn,
          "aria-haspopup": "menu",
          "aria-expanded": open ? "true" : "false",
          onMouseDown: (e) => e.stopPropagation(),
          onClick: (e) => { e.preventDefault(); e.stopPropagation(); onToggle(); },
        }, "更多"),
        menu,
      );
    }

    function CertOps({ item, pendingId, moreId, setMoreId, onDeploy, onDownload, onMore }) {
      const meta = certMeta(item);
      const busy = pendingId === item.id;
      return h("div", { className: "ci-ops" },
        meta.deployable ? h("button", { type: "button", className: "ci-link", disabled: busy, onClick: () => onDeploy(item) }, "部署") : null,
        meta.downloadable ? h("button", { type: "button", className: "ci-link", disabled: busy, onClick: () => onDownload(item) }, busy ? "下载中" : "下载") : null,
        h(MoreMenu, {
          item,
          open: moreId === item.id,
          onToggle: () => setMoreId(moreId === item.id ? "" : item.id),
          onClose: () => setMoreId(""),
          onAction: (row) => { setMoreId(""); onMore(item, row); },
        }),
      );
    }

    function CertTable({ items, pendingId, moreId, setMoreId, onOpen, emptyHint, onDeploy, onDownload, onMore }) {
      const rows = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!rows.length) return h("div", { className: "ci-empty" }, emptyHint || "没有证书");
      const template = "minmax(0,1.1fr) minmax(0,1.3fr) minmax(0,0.8fr) minmax(0,1fr) minmax(0,0.9fr) minmax(0,1fr) 128px";
      const head = ["证书 ID", "绑定域名", "备注", "类型/品牌", "状态", "有效期", "操作"];
      return h("div", { className: "ci-list" },
        h("div", { className: "ci-row head", style: { gridTemplateColumns: template } },
          head.map((label) => h("div", { key: label, className: "ci-cell" }, label)),
        ),
        rows.map((item) => {
          const meta = certMeta(item);
          return h("div", { key: item.id, className: "ci-row" + (moreId === item.id ? " open" : ""), style: { gridTemplateColumns: template } },
            h("div", { className: "ci-cell" }, h("button", {
              type: "button",
              className: "ci-name",
              title: item.title,
              disabled: pendingId === item.id,
              onClick: () => onOpen(item),
            }, item.title)),
            h("div", { className: "ci-cell" }, h("button", {
              type: "button",
              className: "ci-name",
              title: meta.domain || certCol(item, "绑定域名"),
              disabled: pendingId === item.id,
              onClick: () => onOpen(item),
            }, meta.domain || certCol(item, "绑定域名") || "—")),
            h("div", { className: "ci-cell" }, meta.alias || certCol(item, "备注") || "—"),
            h("div", { className: "ci-cell" }, meta.productName ? `${certCol(item, "类型/品牌")}` : certCol(item, "类型/品牌") || "—"),
            h("div", { className: "ci-cell" },
              meta.statusName || certCol(item, "状态") || "—",
              meta.renewable ? h("button", { type: "button", className: "ci-link ci-renew", onClick: () => onMore(item, { id: "cert.renew", label: "快速续期" }) }, "快速续期") : null,
            ),
            h("div", { className: "ci-cell" }, meta.validTo || certCol(item, "有效期") || "—"),
            h("div", { className: "ci-cell ci-ops-cell" }, h(CertOps, { item, pendingId, moreId, setMoreId, onDeploy, onDownload, onMore })),
          );
        }),
      );
    }

    const CERT_SECTION_TITLES = {
      basic: "基本信息",
      domains: "域名信息",
      validation: "域名验证",
      chain: "证书链摘要",
      bound: "关联云资源",
    };

    function CertSection({ section, onRetry }) {
      const fields = section.fields || [];
      const rows = section.rows || [];
      const empty = !fields.length && !rows.length;
      const title = CERT_SECTION_TITLES[section.id] || section.title;
      return [
        h("div", { key: section.id + "-t", className: "ci-sec" }, h("span", { className: "ci-sec-t" }, title)),
        empty
          ? h("div", { key: section.id + "-e", className: "ci-sec-empty" },
            h("span", null, section.empty || "暂无"),
            onRetry ? h("button", { type: "button", className: "ci-link", onClick: onRetry }, "重试") : null,
          )
          : h("div", { key: section.id + "-d", className: "ci-dl" },
            fields.flatMap((row) => [h("span", { key: section.id + row.label }, row.label), h("b", { key: section.id + row.label + "v" }, row.value || "—")]),
            rows.flatMap((row, idx) => [h("span", { key: section.id + "r" + idx }, row.label), h("b", { key: section.id + "rv" + idx }, row.value || "—")]),
          ),
      ];
    }

    function ApplyCertDialog({ busy, err, onCancel, onSubmit }) {
      const [draft, setDraft] = useState({ domain: "", verifyType: "DNS_AUTO", algorithm: "RSA", alias: "" });
      const box = useOverlayKeys(true, busy, onCancel, false);
      const set = (key) => (value) => setDraft({ ...draft, [key]: value });
      return createPortal(h("div", {
        className: "ci-modal-mask",
        role: "presentation",
        onClick: (e) => { if (!busy && e.target === e.currentTarget) onCancel(); },
      },
        h("div", { className: "ci-modal", role: "dialog", "aria-modal": "true", ref: box },
          h("h3", null, "申请免费证书"),
          h("p", null, "仅支持单域名，不支持 IP 与泛域名。提交后进入验证域名。"),
          h(FieldInput, { label: "绑定域名", value: draft.domain, onChange: set("domain"), placeholder: "www.example.com", disabled: busy }),
          h(FieldInput, {
            label: "验证方式",
            type: "select",
            value: draft.verifyType,
            onChange: set("verifyType"),
            placeholder: [
              { value: "DNS_AUTO", label: "自动 DNS" },
              { value: "DNS", label: "手动 DNS" },
              { value: "FILE", label: "文件验证" },
            ],
            disabled: busy,
          }),
          h(FieldInput, {
            label: "算法",
            type: "select",
            value: draft.algorithm,
            onChange: set("algorithm"),
            placeholder: [
              { value: "RSA", label: "RSA（默认）" },
              { value: "ECC", label: "ECC" },
            ],
            disabled: busy,
          }),
          h(FieldInput, { label: "备注名", value: draft.alias, onChange: set("alias"), placeholder: "最多 200 字", disabled: busy }),
          err ? h("p", { className: "ci-err", style: { margin: "0 0 8px" } }, err) : null,
          h("div", { className: "ci-modal-actions" },
            h("button", { type: "button", className: "ci-mini", disabled: busy, onClick: onCancel }, "取消"),
            h("button", { type: "button", className: "ci-mini primary", disabled: busy, onClick: () => onSubmit(draft) }, busy ? "提交中" : "下一步：验证域名"),
          ),
        ),
      ), document.body);
    }

    function VerifyCertDialog({ item, verifyType, busy, err, status, onCancel, onCheck, onComplete, onOpenDetail }) {
      const auto = String(verifyType || "").toUpperCase() === "DNS_AUTO";
      const box = useOverlayKeys(true, busy, onCancel, false);
      return createPortal(h("div", {
        className: "ci-modal-mask",
        role: "presentation",
        onClick: (e) => { if (!busy && e.target === e.currentTarget) onCancel(); },
      },
        h("div", { className: "ci-modal", role: "dialog", "aria-modal": "true", ref: box },
          h("h3", null, "验证域名"),
          h("p", null, auto
            ? "已提交自动 DNS。请确认域名在 DNSPod 托管；可查看验证状态，签发后即可部署。"
            : "请按详情中的主机记录或文件完成验证，然后查看验证状态。校验通过后将提交完成审核。"),
          status ? h("p", { className: "ci-hint" }, status) : null,
          err ? h("p", { className: "ci-err", style: { margin: "0 0 8px" } }, err) : null,
          h("div", { className: "ci-modal-actions" },
            h("button", { type: "button", className: "ci-mini", disabled: busy, onClick: onCancel }, "关闭"),
            h("button", { type: "button", className: "ci-mini", disabled: busy, onClick: () => onOpenDetail(item) }, "查看详情"),
            h("button", { type: "button", className: "ci-mini primary", disabled: busy, onClick: onCheck }, busy ? "检查中" : "查看验证状态"),
            !auto ? h("button", { type: "button", className: "ci-mini primary", disabled: busy, onClick: onComplete }, "完成审核") : null,
          ),
        ),
      ), document.body);
    }

    function ReplaceCertDialog({ item, verifyType, busy, err, onCancel, onSubmit }) {
      const initial = String(verifyType || certMeta(item).verifyType || "DNS").toUpperCase();
      const [draft, setDraft] = useState({
        verifyType: initial === "FILE" || initial === "DNS" || initial === "DNS_AUTO" ? initial : "DNS",
      });
      const box = useOverlayKeys(true, busy, onCancel, false);
      return createPortal(h("div", {
        className: "ci-modal-mask",
        role: "presentation",
        onClick: (e) => { if (!busy && e.target === e.currentTarget) onCancel(); },
      },
        h("div", { className: "ci-modal", role: "dialog", "aria-modal": "true", ref: box },
          h("h3", null, "重颁发证书"),
          h("p", null, "请确认验证方式。默认沿用当前证书的验证方式，不要在无提示时改用自动 DNS。"),
          h(FieldInput, {
            label: "验证方式",
            type: "select",
            value: draft.verifyType,
            onChange: (value) => setDraft({ ...draft, verifyType: value }),
            placeholder: [
              { value: "DNS_AUTO", label: "自动 DNS" },
              { value: "DNS", label: "手动 DNS" },
              { value: "FILE", label: "文件验证" },
            ],
            disabled: busy,
          }),
          err ? h("p", { className: "ci-err", style: { margin: "0 0 8px" } }, err) : null,
          h("div", { className: "ci-modal-actions" },
            h("button", { type: "button", className: "ci-mini", disabled: busy, onClick: onCancel }, "取消"),
            h("button", { type: "button", className: "ci-mini primary", disabled: busy, onClick: () => onSubmit(draft) }, busy ? "提交中" : "确定重颁发"),
          ),
        ),
      ), document.body);
    }

    function UploadCertDialog({ busy, err, onCancel, onSubmit }) {
      const [draft, setDraft] = useState({
        standard: "intl",
        certificateType: "SVR",
        alias: "",
        publicKey: "",
        privateKey: "",
        encryptPublicKey: "",
        encryptPrivateKey: "",
      });
      const box = useOverlayKeys(true, busy, onCancel, false);
      const set = (key) => (value) => setDraft({ ...draft, [key]: value });
      return createPortal(h("div", {
        className: "ci-modal-mask",
        role: "presentation",
        onClick: (e) => { if (!busy && e.target === e.currentTarget) onCancel(); },
      },
        h("div", { className: "ci-modal wide", role: "dialog", "aria-modal": "true", ref: box },
          h("h3", null, "上传证书"),
          h(FieldInput, {
            label: "证书标准",
            type: "select",
            value: draft.standard,
            onChange: set("standard"),
            placeholder: [
              { value: "intl", label: "国际标准" },
              { value: "sm2", label: "国密 SM2" },
            ],
            disabled: busy,
          }),
          h(FieldInput, {
            label: "证书类型",
            type: "select",
            value: draft.certificateType,
            onChange: set("certificateType"),
            placeholder: [
              { value: "SVR", label: "服务端" },
              { value: "CA", label: "CA" },
            ],
            disabled: busy,
          }),
          h(FieldInput, { label: "备注名", value: draft.alias, onChange: set("alias"), disabled: busy }),
          h(FieldInput, { label: "签名证书", type: "textarea", value: draft.publicKey, onChange: set("publicKey"), placeholder: "粘贴证书 PEM", disabled: busy }),
          h(FieldInput, { label: "签名私钥", type: "textarea", value: draft.privateKey, onChange: set("privateKey"), placeholder: draft.certificateType === "CA" ? "CA 可不填私钥" : "服务端必填", disabled: busy }),
          draft.standard === "sm2" ? [
            h(FieldInput, { key: "ec", label: "加密证书", type: "textarea", value: draft.encryptPublicKey, onChange: set("encryptPublicKey"), disabled: busy }),
            h(FieldInput, { key: "ek", label: "加密私钥", type: "textarea", value: draft.encryptPrivateKey, onChange: set("encryptPrivateKey"), disabled: busy }),
          ] : null,
          err ? h("p", { className: "ci-err", style: { margin: "0 0 8px" } }, err) : null,
          h("div", { className: "ci-modal-actions" },
            h("button", { type: "button", className: "ci-mini", disabled: busy, onClick: onCancel }, "取消"),
            h("button", { type: "button", className: "ci-mini primary", disabled: busy, onClick: () => onSubmit(draft) }, busy ? "上传中" : "上传"),
          ),
        ),
      ), document.body);
    }

    function DeployDialog({ item, busy, err, onCancel, onLoadHosts, onSubmit, onLoadRecords, onRetry }) {
      const products = [
        { id: "clb", label: "CLB" }, { id: "cdn", label: "CDN" }, { id: "waf", label: "WAF" },
        { id: "teo", label: "EdgeOne" }, { id: "cos", label: "COS" }, { id: "tke", label: "TKE" },
        { id: "live", label: "LIVE" }, { id: "vod", label: "VOD" }, { id: "ddos", label: "DDoS" },
        { id: "lighthouse", label: "Lighthouse" }, { id: "tcb", label: "TCB" }, { id: "apigateway", label: "API 网关" },
      ];
      const [resourceType, setResourceType] = useState("cdn");
      const [instances, setInstances] = useState([]);
      const [picked, setPicked] = useState({});
      const [records, setRecords] = useState([]);
      const [stepErr, setStepErr] = useState("");
      const box = useOverlayKeys(true, busy, onCancel, false);
      const load = async (type) => {
        setStepErr("");
        try {
          const data = await onLoadHosts(item, type);
          setInstances(data.instances || []);
          setPicked({});
        } catch (e) {
          setInstances([]);
          setStepErr(publicErrorMessage(e));
        }
      };
      useEffect(() => { load(resourceType); }, [resourceType]);
      useEffect(() => {
        onLoadRecords(item).then((data) => setRecords(data.records || [])).catch(() => setRecords([]));
      }, [item.id]);
      const selected = instances.filter((row) => picked[row.instanceId]);
      return createPortal(h("div", {
        className: "ci-modal-mask",
        role: "presentation",
        onClick: (e) => { if (!busy && e.target === e.currentTarget) onCancel(); },
      },
        h("div", { className: "ci-modal wide", role: "dialog", "aria-modal": "true", ref: box },
          h("h3", null, "部署证书"),
          h("p", null, "选择云产品后勾选与证书域名匹配的实例，无需手填实例 ID。"),
          h(FieldInput, {
            label: "云产品",
            type: "select",
            value: resourceType,
            onChange: setResourceType,
            placeholder: products,
            disabled: busy,
          }),
          stepErr || err ? h("p", { className: "ci-err", style: { margin: "0 0 8px" } }, stepErr || err) : null,
          instances.length
            ? instances.map((row) => h("label", { key: row.instanceId, className: "ci-check" },
              h("input", {
                type: "checkbox",
                checked: !!picked[row.instanceId],
                disabled: busy,
                onChange: () => setPicked({ ...picked, [row.instanceId]: !picked[row.instanceId] }),
              }),
              h("span", null, [row.name, row.domain, row.instanceId].filter(Boolean).join(" · ")),
            ))
            : h("div", { className: "ci-empty", style: { border: 0 } }, busy ? "加载匹配实例…" : "暂无匹配实例"),
          records.length ? [
            h("div", { key: "rt", className: "ci-sec", style: { padding: "8px 0" } }, h("span", { className: "ci-sec-t" }, "部署记录")),
            records.map((row, idx) => h("div", { key: idx, className: "ci-check" },
              h("span", null, [row.resourceType, row.instanceId, row.statusName || row.status, row.createTime].filter(Boolean).join(" · ")),
              row.deployRecordId ? h("button", {
                type: "button",
                className: "ci-link",
                disabled: busy,
                onClick: () => onRetry(item, row),
              }, "重试") : null,
            )),
          ] : null,
          h("div", { className: "ci-modal-actions" },
            h("button", { type: "button", className: "ci-mini", disabled: busy, onClick: onCancel }, "取消"),
            h("button", {
              type: "button",
              className: "ci-mini primary",
              disabled: busy || !selected.length,
              onClick: () => onSubmit(item, resourceType, selected.map((row) => row.instanceId)),
            }, busy ? "部署中" : `部署已选 ${selected.length} 台`),
          ),
        ),
      ), document.body);
    }

    function CertDetailView({ item, detail, loading, error, skipConfirm, onBack, onReload, onSkipConfirm, onCertAction }) {
      const [confirm, setConfirm] = useState(null);
      const [busy, setBusy] = useState(false);
      const [err, setErr] = useState("");
      const [verifyMsg, setVerifyMsg] = useState("");
      const sections = (detail && detail.sections) || [];
      const meta = (detail && detail.card && detail.card.meta) || certMeta(item);
      const applying = !!meta.cancelable;
      const verifyType = String(meta.verifyType || "");
      const autoDns = verifyType.toUpperCase() === "DNS_AUTO";
      const run = async (action, payload) => {
        setBusy(true);
        setErr("");
        try {
          const result = await onCertAction(item, action, payload);
          setConfirm(null);
          if (action.id !== "cert.download") await onReload();
          return result;
        } catch (e) {
          setErr(publicErrorMessage(e));
          throw e;
        } finally {
          setBusy(false);
        }
      };
      const checkVerify = async () => {
        try {
          const result = await run({ id: "cert.verify", label: "查看验证状态", confirm: "default" }, {
            verifyType,
            completeIfManual: true,
          });
          const data = (result && result.data) || {};
          if (data.completed) setVerifyMsg("验证已通过，已提交完成审核。");
          else if (data.passed) setVerifyMsg("域名验证已通过，等待签发。");
          else setVerifyMsg("尚未通过验证，请确认 DNS/文件记录后重试。");
        } catch { /* run already setErr */ }
      };
      return [
        h("div", { key: "crumb", className: "ci-crumb" },
          h("button", { type: "button", className: "ci-back", onClick: onBack }, "返回"),
          h("span", { className: "ci-head-t", title: item.title }, "证书详情 · " + item.title),
        ),
        loading ? h("div", { key: "load", className: "ci-load" }, h(Spin), "加载详情…") : null,
        !loading && error && !detail ? h("div", { key: "ferr", className: "ci-err" }, error) : null,
        !loading && detail ? [
          err ? h("p", { key: "err", className: "ci-err" }, err) : null,
          sections.length
            ? sections.map((section) => h(CertSection, {
              key: section.id,
              section,
              onRetry: section.id === "bound" && /可重试/.test(section.empty || "") ? onReload : undefined,
            }))
            : h("div", { key: "empty", className: "ci-empty" }, "没有详情字段"),
          applying ? h("div", { key: "va", className: "ci-actions", style: { padding: "4px 14px 8px" } },
            h("button", {
              type: "button",
              className: "ci-mini primary",
              disabled: busy || loading,
              onClick: checkVerify,
            }, busy ? "检查中" : "查看验证状态"),
            !autoDns ? h("button", {
              type: "button",
              className: "ci-mini",
              disabled: busy || loading,
              onClick: () => run({ id: "cert.complete", label: "完成审核", confirm: "default" }, {}),
            }, "完成审核") : null,
          ) : null,
          applying && autoDns ? h("p", { key: "auto-hint", className: "ci-hint", style: { padding: "0 14px 8px" } }, "自动 DNS 将等待签发，无需手动完成审核。") : null,
          verifyMsg ? h("p", { key: "vmsg", className: "ci-hint", style: { padding: "0 14px 10px" } }, verifyMsg) : null,
        ] : null,
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

    function DetailView(props) {
      if (props.item && props.item.kind === "cert") return h(CertDetailView, props);
      return h(DomainDetailView, props);
    }

    function DomainDetailView({ item, detail, loading, error, skipConfirm, onBack, onReload, onSkipConfirm }) {
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

    function SearchToolView(props) {
      useEffect(() => ensureCss(), []);
      const payload = pickPayload(props);
      const args = parseToolArgs(props);
      const fromTool = Array.isArray(payload?.items) ? payload.items : null;
      const running = !!(props?.block && !("kind" in props.block));
      const kind = payload?.resourceKind
        || (payload?.kind && payload.kind !== "cloud-infra-query" ? payload.kind : "")
        || args.kind
        || "domain";
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
      const [group, setGroup] = useState("");
      const [moreId, setMoreId] = useState("");
      const [wizard, setWizard] = useState(null);
      const [wizardBusy, setWizardBusy] = useState(false);
      const [wizardErr, setWizardErr] = useState("");
      const [confirm, setConfirm] = useState(null);
      const seq = useRef(0);
      const debounce = useRef(0);
      const groupRef = useRef("");
      const isCert = kind === "cert";
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
            group: isCert ? (groupRef.current || group || "") : "",
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
      const certPayload = (item, extra) => ({
        certificateId: certMeta(item).certificateId || String(item.id || "").split(":").pop(),
        domain: certMeta(item).domain || item.description,
        ...extra,
      });
      const runCertAction = async (item, action, extra) => {
        const result = await api("action", {
          moduleId: item.moduleId,
          id: item.id,
          action: action.id || action,
          payload: certPayload(item, extra),
        });
        if ((action.id || action) === "cert.download") {
          const data = result.data || {};
          triggerDownload(data.filename, data.content, data.contentType);
        }
        return result;
      };
      const changeGroup = (next) => {
        groupRef.current = next;
        setGroup(next);
        fetchList(0, String(activeQ || "").trim());
      };
      const askConfirm = (item, row, text) => {
        setConfirm({
          item,
          action: { id: row.id, label: row.label, confirm: "always" },
          payload: {},
          text,
          danger: row.id === "cert.delete" || row.id === "cert.revoke",
        });
      };
      const onMore = (item, row) => {
        if (row.id === "cert.delete") {
          return askConfirm(item, row, "温馨提示：删除后不可恢复。已关联云资源或待验证证书可能无法删除。确定删除该证书？");
        }
        if (row.id === "cert.revoke") return askConfirm(item, row, "确定吊销该证书？吊销后不可继续部署。");
        if (row.id === "cert.replace") {
          return setWizard({ type: "replace", item, verifyType: certMeta(item).verifyType || "DNS" });
        }
        if (row.id === "cert.cancel") return askConfirm(item, row, "确定取消审核？取消后可删除该申请。");
        if (row.id === "cert.renew") return askConfirm(item, row, "确定对免费证书执行快速续期？");
        if (row.id === "cert.verify") {
          return setWizard({ type: "verify", item, verifyType: certMeta(item).verifyType, status: "" });
        }
        setWizard({ type: row.id, item });
      };
      const onDownload = async (item) => {
        setPendingId(item.id);
        setListErr("");
        try {
          await runCertAction(item, { id: "cert.download" }, {});
        } catch (e) {
          setListErr(publicErrorMessage(e));
        } finally {
          setPendingId("");
        }
      };
      if (running) return null;
      const errors = payload?.errors || [];
      const payloadErr = errors.map((e) => e && e.message).filter(Boolean).join("；");
      if (!isCert && !fromTool?.length && !rows.length && !activeQ && !draftQ) {
        const msg = payloadErr;
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
            onCertAction: runCertAction,
          }) : [
            h("div", { key: "bar", className: "ci-bar" },
              h("div", { className: "ci-bar-left" },
                h("span", { className: "ci-bar-title" }, isCert ? "我的证书" : (kind === "domain" ? "域名解析" : "云资源")),
                h("span", { className: "ci-bar-count" }, `${counted} 条`),
              ),
              h("div", { className: "ci-bar-actions" },
                isCert ? [
                  h("button", { key: "apply", type: "button", className: "ci-mini", onClick: () => { setWizardErr(""); setWizard({ type: "apply" }); } }, "申请免费证书"),
                  h("button", { key: "upload", type: "button", className: "ci-mini", onClick: () => { setWizardErr(""); setWizard({ type: "upload" }); } }, "上传证书"),
                ] : null,
                h("div", { key: "search", className: "ci-search-wrap" },
                  h(SearchIcon),
                  h("input", {
                    className: "ci-search",
                    type: "search",
                    placeholder: isCert ? "搜索证书 ID / 备注 / 域名" : (kind === "domain" ? "请输入域名关键字" : "搜索"),
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
            ),
            isCert ? h("div", { key: "groups", className: "ci-groups" },
              [
                { id: "", label: "全部" },
                { id: "applying", label: "申请中" },
                { id: "issued", label: "已签发" },
                { id: "expired", label: "已过期" },
              ].map((tab) => h("button", {
                key: tab.id || "all",
                type: "button",
                className: "ci-group" + (group === tab.id ? " active" : ""),
                onClick: () => changeGroup(tab.id),
              }, tab.label)),
            ) : null,
            listErr || payloadErr ? h("div", { key: "lerr", className: "ci-err" }, listErr || payloadErr) : null,
            listBusy ? h("div", { key: "load", className: "ci-load" }, h(Spin), "加载列表…") : (
              isCert
                ? h(CertTable, {
                  key: "table",
                  items: rows,
                  pendingId,
                  moreId,
                  setMoreId,
                  onOpen: openItem,
                  onDeploy: (item) => { setWizardErr(""); setWizard({ type: "deploy", item }); },
                  onDownload,
                  onMore,
                  emptyHint: (activeQ || draftQ) ? `没有匹配「${activeQ || draftQ}」的证书` : "没有证书",
                })
                : h(ResourceTable, {
                  key: "table",
                  items: rows,
                  pendingId,
                  onOpen: openItem,
                  extraCols,
                  showProvider,
                  emptyHint: (activeQ || draftQ) ? `没有匹配「${activeQ || draftQ}」的资源` : "没有资源",
                })
            ),
            h(Pager, {
              key: "pager",
              total: counted,
              page,
              pages: pageCount,
              busy: listBusy,
              onPage: goPage,
            }),
          ],
          wizard && wizard.type === "apply" ? h(ApplyCertDialog, {
            key: "apply",
            busy: wizardBusy,
            err: wizardErr,
            onCancel: () => { if (!wizardBusy) setWizard(null); },
            onSubmit: async (draft) => {
              setWizardBusy(true);
              setWizardErr("");
              try {
                const result = await api("action", {
                  moduleId: rows[0]?.moduleId || "tencent.cert",
                  id: rows[0]?.id || "tencent.cert:",
                  action: "cert.apply",
                  payload: draft,
                });
                await fetchList(0, String(activeQ || "").trim());
                const id = result.data && result.data.certificateId;
                const item = id
                  ? { id: `tencent.cert:${id}`, moduleId: "tencent.cert", kind: "cert", title: id, meta: { certificateId: id, verifyType: draft.verifyType, cancelable: true } }
                  : null;
                if (item) setWizard({ type: "verify", item, verifyType: draft.verifyType, status: "" });
                else setWizard(null);
              } catch (e) {
                setWizardErr(publicErrorMessage(e));
              } finally {
                setWizardBusy(false);
              }
            },
          }) : null,
          wizard && wizard.type === "verify" && wizard.item ? h(VerifyCertDialog, {
            key: "verify",
            item: wizard.item,
            verifyType: wizard.verifyType || certMeta(wizard.item).verifyType,
            busy: wizardBusy,
            err: wizardErr,
            status: wizard.status,
            onCancel: () => { if (!wizardBusy) setWizard(null); },
            onOpenDetail: (item) => {
              setWizard(null);
              openItem(item);
            },
            onCheck: async () => {
              setWizardBusy(true);
              setWizardErr("");
              try {
                const result = await runCertAction(wizard.item, { id: "cert.verify" }, {
                  verifyType: wizard.verifyType || certMeta(wizard.item).verifyType,
                  completeIfManual: true,
                });
                const data = (result && result.data) || {};
                let status = "尚未通过验证，请确认 DNS/文件记录后重试。";
                if (data.completed) status = "验证已通过，已提交完成审核。";
                else if (data.passed) status = "域名验证已通过，等待签发。";
                setWizard({ ...wizard, status });
                await fetchList(0, String(activeQ || "").trim());
              } catch (e) {
                setWizardErr(publicErrorMessage(e));
              } finally {
                setWizardBusy(false);
              }
            },
            onComplete: async () => {
              setWizardBusy(true);
              setWizardErr("");
              try {
                await runCertAction(wizard.item, { id: "cert.complete" }, {});
                setWizard({ ...wizard, status: "已提交完成审核。" });
                await fetchList(0, String(activeQ || "").trim());
              } catch (e) {
                setWizardErr(publicErrorMessage(e));
              } finally {
                setWizardBusy(false);
              }
            },
          }) : null,
          wizard && wizard.type === "replace" && wizard.item ? h(ReplaceCertDialog, {
            key: "replace",
            item: wizard.item,
            verifyType: wizard.verifyType || certMeta(wizard.item).verifyType,
            busy: wizardBusy,
            err: wizardErr,
            onCancel: () => { if (!wizardBusy) setWizard(null); },
            onSubmit: async (draft) => {
              setWizardBusy(true);
              setWizardErr("");
              try {
                await runCertAction(wizard.item, { id: "cert.replace" }, { verifyType: draft.verifyType });
                setWizard(null);
                await fetchList(offset, String(activeQ || "").trim());
                if (session?.item) await reload();
              } catch (e) {
                setWizardErr(publicErrorMessage(e));
              } finally {
                setWizardBusy(false);
              }
            },
          }) : null,
          wizard && wizard.type === "upload" ? h(UploadCertDialog, {
            key: "upload",
            busy: wizardBusy,
            err: wizardErr,
            onCancel: () => { if (!wizardBusy) setWizard(null); },
            onSubmit: async (draft) => {
              setWizardBusy(true);
              setWizardErr("");
              try {
                await api("action", {
                  moduleId: rows[0]?.moduleId || "tencent.cert",
                  id: rows[0]?.id || "tencent.cert:",
                  action: "cert.upload",
                  payload: draft,
                });
                setWizard(null);
                await fetchList(0, String(activeQ || "").trim());
              } catch (e) {
                setWizardErr(publicErrorMessage(e));
              } finally {
                setWizardBusy(false);
              }
            },
          }) : null,
          wizard && wizard.type === "deploy" && wizard.item ? h(DeployDialog, {
            key: "deploy",
            item: wizard.item,
            busy: wizardBusy,
            err: wizardErr,
            onCancel: () => { if (!wizardBusy) setWizard(null); },
            onLoadHosts: async (item, resourceType) => {
              const result = await runCertAction(item, { id: "cert.hosts" }, { resourceType });
              return result.data || { instances: [] };
            },
            onLoadRecords: async (item) => {
              const result = await runCertAction(item, { id: "cert.deploy.records" }, {});
              return result.data || { records: [] };
            },
            onRetry: async (item, row) => {
              setWizardBusy(true);
              try {
                await runCertAction(item, { id: "cert.deploy.retry" }, { deployRecordId: row.deployRecordId });
              } catch (e) {
                setWizardErr(publicErrorMessage(e));
              } finally {
                setWizardBusy(false);
              }
            },
            onSubmit: async (item, resourceType, instanceIds) => {
              setWizardBusy(true);
              setWizardErr("");
              try {
                await runCertAction(item, { id: "cert.deploy" }, { resourceType, instanceIds });
                const rec = await runCertAction(item, { id: "cert.deploy.records" }, { resourceType });
                return rec;
              } catch (e) {
                setWizardErr(publicErrorMessage(e));
              } finally {
                setWizardBusy(false);
              }
            },
          }) : null,
          h(ConfirmDialog, {
            key: "confirm",
            open: !!confirm,
            title: confirm?.action?.label,
            text: confirm?.text,
            busy: wizardBusy,
            danger: !!confirm?.danger,
            onCancel: () => { if (!wizardBusy) setConfirm(null); },
            onConfirm: async () => {
              if (!confirm) return;
              setWizardBusy(true);
              try {
                await runCertAction(confirm.item, confirm.action, confirm.payload);
                setConfirm(null);
                await fetchList(offset, String(activeQ || "").trim());
                if (session?.item) await reload();
              } catch (e) {
                setListErr(publicErrorMessage(e));
              } finally {
                setWizardBusy(false);
              }
            },
          }),
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
