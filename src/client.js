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
.ci-regionbar{display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2)}
.ci-regionbar label{color:var(--dsw-alias-label-tertiary);line-height:32px;flex:none}
.ci-combo{position:relative;width:min(280px,100%)}
.ci-combo input{height:32px;width:100%;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:0 8px;font:inherit;background:var(--dsw-alias-bg-layer-1);color:inherit;box-sizing:border-box}
.ci-combo input:focus{outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent)}
.ci-combo-list{position:absolute;left:0;right:0;top:36px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;max-height:200px;overflow:auto;z-index:3;margin:0;padding:4px 0;list-style:none}
.ci-combo-list li{padding:6px 10px;cursor:pointer;font-size:13px}
.ci-combo-list li.on,.ci-combo-list li:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-brand-primary)}
.ci-combo-id{color:var(--dsw-alias-label-tertiary);margin-left:8px;font-size:12px}
.ci-tool-left{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ci-crumbs{display:flex;flex-wrap:wrap;align-items:center;gap:4px;padding:8px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:13px;color:var(--dsw-alias-label-secondary)}
.ci-crumbs button{background:none;border:0;padding:0;font:inherit;color:var(--dsw-alias-brand-primary);cursor:pointer}
.ci-crumbs span{color:var(--dsw-alias-label-caption)}
.ci-file-name{display:inline-flex;align-items:center;gap:6px;min-width:0}
.ci-more{position:relative;display:inline-block}
.ci-more-list{position:absolute;right:0;top:22px;min-width:140px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:4px 0;z-index:4;box-shadow:var(--dsw-alias-shadow)}
.ci-more-list button{display:block;width:100%;text-align:left;background:none;border:0;padding:6px 12px;font:inherit;cursor:pointer;color:inherit}
.ci-more-list button:hover{background:var(--dsw-alias-interactive-bg-hover)}
.ci-more-list button.danger{color:var(--dsw-alias-state-error-primary)}
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
              disabled: busy || !!field.disabled,
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

    const COS_REGION_FALLBACK = [
      { id: "ap-beijing", label: "北京", aliases: ["bj", "beijing"] },
      { id: "ap-shanghai", label: "上海", aliases: ["sh", "shanghai"] },
      { id: "ap-guangzhou", label: "广州", aliases: ["gz", "guangzhou"] },
      { id: "ap-chengdu", label: "成都", aliases: ["cd", "chengdu"] },
      { id: "ap-chongqing", label: "重庆", aliases: ["cq", "chongqing"] },
      { id: "ap-nanjing", label: "南京", aliases: ["nj", "nanjing"] },
      { id: "ap-hongkong", label: "中国香港", aliases: ["hk", "hongkong", "香港"] },
      { id: "ap-singapore", label: "新加坡", aliases: ["sg", "singapore"] },
      { id: "ap-tokyo", label: "东京", aliases: ["jp", "tokyo"] },
      { id: "na-ashburn", label: "弗吉尼亚", aliases: ["ashburn", "virginia"] },
    ];

    function normRegion(value) {
      return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
    }

    function regionTokens(region) {
      const id = normRegion(region.id);
      return [id, id.replace(/-/g, ""), id.replace(/^ap-/, ""), normRegion(region.label)]
        .concat((region.aliases || []).map(normRegion))
        .filter(Boolean);
    }

    function matchCosRegion(region, needle) {
      const q = normRegion(needle);
      if (!q) return true;
      return regionTokens(region).some((token) => token.includes(q));
    }

    function resolveCosRegion(raw, regions) {
      const q = normRegion(raw);
      if (!q) return null;
      return (regions || []).find((region) => regionTokens(region).includes(q)) || null;
    }

    function displayRegion(region) {
      return region ? `${region.label}（${region.id}）` : "";
    }

    function formatBytes(bytes) {
      const n = Number(bytes);
      if (!Number.isFinite(n)) return "-";
      if (n < 1024) return `${n} B`;
      if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
      return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    }

    function storageLabel(value) {
      const raw = String(value || "STANDARD").toUpperCase();
      if (raw === "STANDARD") return "标准存储";
      if (raw === "STANDARD_IA") return "低频存储";
      if (raw === "INTELLIGENT_TIERING") return "智能分层";
      if (raw === "ARCHIVE") return "归档存储";
      return raw;
    }

    function prefixCrumbs(prefix) {
      const parts = String(prefix || "").split("/").filter(Boolean);
      const crumbs = [{ label: "根目录", prefix: "" }];
      let acc = "";
      for (const part of parts) {
        acc += `${part}/`;
        crumbs.push({ label: part, prefix: acc });
      }
      return crumbs;
    }

    function readFileAsBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("读取文件失败"));
        reader.onload = () => {
          const text = String(reader.result || "");
          const idx = text.indexOf(",");
          resolve(idx >= 0 ? text.slice(idx + 1) : text);
        };
        reader.readAsDataURL(file);
      });
    }

    function CosRegionCombo({ regions, input, selected, open, highlight, onInput, onPick, onOpen, onHighlight }) {
      const items = (regions || []).filter((region) => matchCosRegion(region, input));
      return h("div", { className: "ci-regionbar" },
        h("label", { htmlFor: "ci-cos-region" }, "地域"),
        h("div", { className: "ci-combo" },
          h("input", {
            id: "ci-cos-region",
            type: "text",
            placeholder: "输入地域名称或 ID 补全",
            autoComplete: "off",
            value: selected && !open ? displayRegion(selected) : input,
            onChange: (e) => onInput(e.target.value),
            onFocus: () => onOpen(true),
            onBlur: () => setTimeout(() => onOpen(false), 150),
            onKeyDown: (e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                onHighlight(Math.min(items.length - 1, highlight + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                onHighlight(Math.max(0, highlight - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const hit = items[highlight] || items[0];
                if (hit) onPick(hit);
              } else if (e.key === "Escape") onOpen(false);
            },
          }),
          open && items.length ? h("ul", { className: "ci-combo-list", role: "listbox" },
            items.map((region, idx) => h("li", {
              key: region.id,
              className: idx === highlight ? "on" : "",
              onMouseDown: (e) => { e.preventDefault(); onPick(region); },
            }, region.label, h("span", { className: "ci-combo-id" }, region.id))),
          ) : null,
        ),
      );
    }

    function CosBucketTable({ items, pendingId, onOpen, onDelete }) {
      const rows = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!rows.length) return h("div", { className: "ci-empty" }, "该地域下没有存储桶");
      return h("div", { className: "ci-table-wrap" }, h("table", { className: "ci-table" },
        h("thead", null, h("tr", null,
          h("th", null, "名称"),
          h("th", null, "地域"),
          h("th", null, "创建时间"),
          h("th", null, "访问权限"),
          h("th", null, "操作"),
        )),
        h("tbody", null, rows.map((item) => h("tr", { key: item.id },
          h("td", null, h("button", {
            type: "button",
            className: "ci-name",
            disabled: pendingId === item.id,
            onClick: () => onOpen(item),
          }, item.title)),
          h("td", null, cellValue(item, "地域") || item.description || "-"),
          h("td", null, cellValue(item, "创建时间") || "-"),
          h("td", null, cellValue(item, "访问权限") || "-"),
          h("td", { className: "ci-ops-cell" }, h("button", {
            type: "button",
            className: "ci-link danger",
            disabled: pendingId === item.id,
            onClick: () => onDelete(item),
          }, "删除")),
        ))),
      ));
    }

    function CosFileTable({ entries, pendingKey, moreKey, onEnter, onStat, onDownload, onMore, onRename, onPresign, onDelete }) {
      const rows = Array.isArray(entries) ? entries : [];
      if (!rows.length) return h("div", { className: "ci-empty" }, "当前目录为空");
      return h("div", { className: "ci-table-wrap" }, h("table", { className: "ci-table" },
        h("thead", null, h("tr", null,
          h("th", null, "文件名"),
          h("th", null, "大小"),
          h("th", null, "存储类型"),
          h("th", null, "最后修改时间"),
          h("th", null, "操作"),
        )),
        h("tbody", null, rows.map((row) => h("tr", { key: row.key },
          h("td", null, h("span", { className: "ci-file-name" },
            row.kind === "folder"
              ? h("button", { type: "button", className: "ci-name", onClick: () => onEnter(row) }, "📁 ", row.name)
              : h("span", null, "📄 ", row.name),
          )),
          h("td", null, row.kind === "folder" ? "-" : formatBytes(row.size)),
          h("td", null, row.kind === "folder" ? "-" : storageLabel(row.storageClass)),
          h("td", null, row.kind === "folder" ? "-" : (row.lastModified || "-")),
          h("td", { className: "ci-ops-cell" }, h("div", { className: "ci-ops" },
            row.kind === "folder"
              ? [
                h("button", { key: "in", type: "button", className: "ci-link", onClick: () => onEnter(row) }, "进入"),
                h("button", { key: "del", type: "button", className: "ci-link danger", onClick: () => onDelete(row) }, "删除"),
              ]
              : [
                h("button", { key: "st", type: "button", className: "ci-link", disabled: pendingKey === row.key, onClick: () => onStat(row) }, "详情"),
                h("button", { key: "dl", type: "button", className: "ci-link", onClick: () => onDownload(row) }, "下载"),
                h("span", { key: "more", className: "ci-more" },
                  h("button", { type: "button", className: "ci-link", onClick: () => onMore(moreKey === row.key ? "" : row.key) }, "更多"),
                  moreKey === row.key ? h("div", { className: "ci-more-list" },
                    h("button", { type: "button", onClick: () => onRename(row) }, "重命名"),
                    h("button", { type: "button", onClick: () => onPresign(row) }, "复制临时链接"),
                    h("button", { type: "button", className: "danger", onClick: () => onDelete(row) }, "删除"),
                  ) : null,
                ),
              ],
          )),
        ))),
      ));
    }

    function CosConsoleView({ payload, args, skipConfirm, onSkipConfirm }) {
      const pageSize = Math.max(1, Number(args.limit) || 12);
      const [regions, setRegions] = useState(COS_REGION_FALLBACK);
      const [input, setInput] = useState("");
      const [selected, setSelected] = useState(null);
      const [open, setOpen] = useState(false);
      const [highlight, setHighlight] = useState(0);
      const [rows, setRows] = useState([]);
      const [total, setTotal] = useState(0);
      const [offset, setOffset] = useState(0);
      const [hasMore, setHasMore] = useState(false);
      const [listBusy, setListBusy] = useState(false);
      const [listErr, setListErr] = useState("");
      const [draftQ, setDraftQ] = useState("");
      const [activeQ, setActiveQ] = useState("");
      const [session, setSession] = useState(null);
      const [pendingId, setPendingId] = useState("");
      const [pendingKey, setPendingKey] = useState("");
      const [moreKey, setMoreKey] = useState("");
      const [form, setForm] = useState(null);
      const [confirm, setConfirm] = useState(null);
      const [busy, setBusy] = useState(false);
      const [err, setErr] = useState("");
      const [stat, setStat] = useState(null);
      const fileRef = useRef(null);
      const seq = useRef(0);
      useEffect(() => {
        api("meta", {}).then((d) => {
          const mods = Array.isArray(d.modules) ? d.modules : [];
          const cos = mods.find((m) => m && m.kind === "cos" && Array.isArray(m.regions) && m.regions.length);
          if (cos) setRegions(cos.regions);
          if (onSkipConfirm) onSkipConfirm(!!d.skipConfirm);
        }).catch(() => {});
      }, []);
      const seedSig = `${payload?.kind || ""}|${args.region || ""}|${(payload?.items || []).map((i) => i.id).join(",")}`;
      useEffect(() => {
        const hinted = resolveCosRegion(args.region, regions);
        if (hinted) {
          setSelected(hinted);
          setInput(displayRegion(hinted));
          if (payload?.kind === "cos" && Array.isArray(payload.items)) {
            setRows(payload.items);
            setTotal(Number(payload.total) || payload.items.length);
            setOffset(Number(payload.offset) || 0);
            setHasMore(!!payload.hasMore);
          }
        }
      }, [seedSig, regions]);
      const fetchBuckets = async (region, nextOffset, q) => {
        const n = ++seq.current;
        setListBusy(true);
        setListErr("");
        try {
          const result = await api("query", {
            kind: "cos",
            region: region.id,
            query: q || "",
            offset: nextOffset,
            limit: pageSize,
          });
          if (n !== seq.current) return;
          setRows(result.items || []);
          setTotal(Number(result.total) || (result.items || []).length);
          setHasMore(!!result.hasMore);
          setOffset(Number(result.offset) || nextOffset);
          setActiveQ(q || "");
        } catch (e) {
          if (n !== seq.current) return;
          setListErr(publicErrorMessage(e));
        } finally {
          if (n === seq.current) setListBusy(false);
        }
      };
      const pickRegion = (region) => {
        setSelected(region);
        setInput(displayRegion(region));
        setOpen(false);
        setSession(null);
        fetchBuckets(region, 0, "");
      };
      const onRegionInput = (value) => {
        setInput(value);
        setSelected(null);
        setRows([]);
        setTotal(0);
        setSession(null);
        setOpen(true);
        setHighlight(0);
        setListErr("");
      };
      const loadFiles = async (item, prefix, marker) => {
        setPendingId(item.id);
        setSession((cur) => ({ item, prefix, marker: marker || "", loading: true, detail: cur && cur.item?.id === item.id ? cur.detail : null }));
        try {
          const detail = await api("detail", {
            moduleId: item.moduleId,
            id: item.id,
            title: item.title,
            bucket: item.title,
            region: selected?.id || args.region,
            prefix: prefix || "",
            marker: marker || "",
          });
          setSession({ item, prefix: detail.prefix || prefix || "", loading: false, detail });
        } catch (e) {
          setSession({ item, prefix: prefix || "", loading: false, detail: null, error: publicErrorMessage(e) });
        } finally {
          setPendingId("");
        }
      };
      const run = async (action, extra) => {
        if (!selected && action.id !== "bucket.create") throw new Error("缺少合法地域，请先选择地域");
        setBusy(true);
        setErr("");
        try {
          const result = await api("action", {
            moduleId: extra.moduleId || session?.item?.moduleId || "tencent.cos",
            id: extra.id || session?.item?.id || "",
            action: action.id,
            payload: {
              region: selected?.id || extra.region,
              bucket: extra.bucket || session?.item?.title,
              prefix: extra.prefix != null ? extra.prefix : session?.prefix,
              ...extra.payload,
            },
          });
          setForm(null);
          setConfirm(null);
          setMoreKey("");
          if (action.id === "object.stat") setStat(result.data || null);
          else if (action.id === "object.presign" || action.id === "object.download") {
            const url = result.data && result.data.url;
            if (action.id === "object.download" && url && typeof window !== "undefined") window.open(url, "_blank", "noopener");
            if (action.id === "object.presign" && url && navigator.clipboard) {
              await navigator.clipboard.writeText(url);
              setStat({ copied: true, expiresSec: result.data.expiresSec });
            } else if (action.id === "object.presign") setStat({ url, expiresSec: result.data?.expiresSec });
          } else if (session?.item) await loadFiles(session.item, session.prefix || "");
          else if (selected) await fetchBuckets(selected, 0, activeQ);
          return result;
        } catch (e) {
          setErr(publicErrorMessage(e));
          throw e;
        } finally {
          setBusy(false);
        }
      };
      const request = async (action, extra, text) => {
        let skip = skipConfirm;
        try {
          const d = await api("meta", {});
          skip = !!d.skipConfirm;
          if (onSkipConfirm) onSkipConfirm(skip);
        } catch { /* keep */ }
        const must = action.confirm === "always" || (action.confirm === "default" && !skip);
        if (!must) {
          try { await run(action, extra); } catch { /* err shown */ }
          return;
        }
        setConfirm({ action, extra, text, danger: action.confirm === "always" });
      };
      const counted = Number(total) || rows.length;
      const pages = Math.max(1, Math.ceil(counted / pageSize) || 1);
      const extra = hasMore && offset + rows.length >= counted ? 1 : 0;
      const pageCount = Math.max(pages, Math.floor(offset / pageSize) + 1 + extra);
      const page = Math.floor(offset / pageSize) + 1;
      const fileEntries = (session?.detail?.entries || []).filter((row) => {
        const q = String(draftQ || "").trim().toLowerCase();
        if (!q || session) {
          if (session && q) return String(row.name || "").toLowerCase().includes(q);
        }
        return true;
      });
      const crumbs = prefixCrumbs(session?.prefix || session?.detail?.prefix || "");
      return [
        session ? h("div", { key: "crumb", className: "ci-crumb" },
          h("button", { type: "button", className: "ci-back", onClick: () => { setSession(null); setDraftQ(""); setErr(""); } }, "返回"),
          h("span", { className: "ci-head-t" }, session.item.title),
        ) : h(CosRegionCombo, {
          key: "region",
          regions,
          input,
          selected,
          open,
          highlight,
          onInput: onRegionInput,
          onPick: pickRegion,
          onOpen: setOpen,
          onHighlight: setHighlight,
        }),
        session ? h("div", { key: "path", className: "ci-crumbs" },
          crumbs.map((crumb, idx) => [
            idx ? h("span", { key: "s" + idx }, "/") : null,
            h("button", {
              key: crumb.prefix || "root",
              type: "button",
              onClick: () => loadFiles(session.item, crumb.prefix),
            }, crumb.label),
          ]),
        ) : null,
        h("div", { key: "bar", className: "ci-bar" },
          h("div", { className: "ci-tool-left" },
            session ? [
              h("button", {
                key: "up",
                type: "button",
                className: "ci-mini primary",
                onClick: () => fileRef.current && fileRef.current.click(),
              }, "上传文件"),
              h("button", {
                key: "folder",
                type: "button",
                className: "ci-mini",
                onClick: () => setForm({ kind: "folder", title: "创建文件夹", name: "" }),
              }, "创建文件夹"),
              h("input", {
                key: "file",
                ref: fileRef,
                type: "file",
                style: { display: "none" },
                onChange: async (e) => {
                  const file = e.target.files && e.target.files[0];
                  e.target.value = "";
                  if (!file) return;
                  if (file.size > 20 * 1024 * 1024) {
                    setErr("上传文件不能超过 20MB");
                    return;
                  }
                  try {
                    const contentBase64 = await readFileAsBase64(file);
                    await run({ id: "object.upload", label: "上传文件", confirm: "default" }, {
                      payload: { name: file.name, contentBase64, contentType: file.type || "application/octet-stream" },
                    });
                  } catch { /* err shown */ }
                },
              }),
            ] : h("button", {
              type: "button",
              className: "ci-mini primary",
              disabled: !selected,
              onClick: () => setForm({ kind: "bucket", title: "创建存储桶", name: "", region: selected?.id }),
            }, "创建存储桶"),
          ),
          h("div", { className: "ci-search-wrap" },
            h(SearchIcon),
            h("input", {
              className: "ci-search",
              type: "search",
              placeholder: session ? "搜索文件名" : "请输入存储桶名称",
              value: draftQ,
              onChange: (e) => {
                setDraftQ(e.target.value);
                if (!session && selected) fetchBuckets(selected, 0, e.target.value);
              },
            }),
          ),
          session ? h("button", {
            type: "button",
            className: "ci-mini",
            onClick: () => loadFiles(session.item, session.prefix || ""),
          }, "刷新") : null,
        ),
        err ? h("div", { key: "err", className: "ci-err" }, err) : null,
        listErr ? h("div", { key: "lerr", className: "ci-err" }, listErr) : null,
        !session && !selected ? h("div", { key: "need-region", className: "ci-empty" }, "请输入并选择地域，再查看该地域下的存储桶。") : null,
        !session && selected && listBusy ? h("div", { key: "load", className: "ci-load" }, h(Spin), "加载列表…") : null,
        !session && selected && !listBusy ? h(CosBucketTable, {
          key: "buckets",
          items: rows,
          pendingId,
          onOpen: (item) => { setDraftQ(""); loadFiles(item, ""); },
          onDelete: (item) => request(
            { id: "bucket.delete", label: "删除", confirm: "always" },
            { moduleId: item.moduleId, id: item.id, bucket: item.title, payload: { bucket: item.title } },
            `确定删除空存储桶 ${item.title}？非空桶会失败。`,
          ),
        }) : null,
        !session && selected ? h(Pager, {
          key: "pager",
          total: counted,
          page,
          pages: pageCount,
          busy: listBusy,
          onPage: (next) => fetchBuckets(selected, (next - 1) * pageSize, activeQ),
        }) : null,
        session && session.loading ? h("div", { key: "fload", className: "ci-load" }, h(Spin), "加载文件列表…") : null,
        session && session.error && !session.detail ? h("div", { key: "ferr", className: "ci-err" }, session.error) : null,
        session && !session.loading && session.detail ? h(CosFileTable, {
          key: "files",
          entries: fileEntries,
          pendingKey,
          moreKey,
          onEnter: (row) => loadFiles(session.item, row.key),
          onStat: async (row) => {
            setPendingKey(row.key);
            try {
              await run({ id: "object.stat", label: "详情", confirm: "default" }, { payload: { key: row.key } });
            } catch { /* err */ }
            finally { setPendingKey(""); }
          },
          onDownload: (row) => run({ id: "object.download", label: "下载", confirm: "default" }, { payload: { key: row.key } }).catch(() => {}),
          onMore: setMoreKey,
          onRename: (row) => { setMoreKey(""); setForm({ kind: "rename", title: "重命名", name: row.name, key: row.key }); },
          onPresign: (row) => { setMoreKey(""); run({ id: "object.presign", label: "复制临时链接", confirm: "default" }, { payload: { key: row.key } }).catch(() => {}); },
          onDelete: (row) => {
            setMoreKey("");
            request(
              { id: row.kind === "folder" ? "folder.delete" : "object.delete", label: "删除", confirm: "always" },
              { payload: { key: row.key } },
              row.kind === "folder"
                ? `确定删除文件夹 ${row.name} 及其下全部对象？此操作不可撤销。`
                : `确定删除文件 ${row.name}？此操作不可撤销。`,
            );
          },
        }) : null,
        form ? h(RecordForm, {
          key: "form",
          action: {
            id: form.kind,
            label: form.title,
            fields: form.kind === "bucket"
              ? [
                { key: "name", label: "名称", placeholder: "bucket-1250000000" },
                { key: "region", label: "所属地域", disabled: true },
              ]
              : [{ key: "name", label: form.kind === "rename" ? "新名称" : "名称" }],
          },
          initial: form.kind === "bucket" ? { name: form.name, region: displayRegion(selected) } : { name: form.name || "" },
          busy,
          err,
          onCancel: () => { if (!busy) setForm(null); },
          onSubmit: async (draft) => {
            if (form.kind === "bucket") {
              await request(
                { id: "bucket.create", label: "创建存储桶", confirm: "default" },
                { payload: { name: draft.name, region: selected?.id } },
                `确认在 ${selected?.label || ""} 创建存储桶 ${draft.name}？创建后地域不可改。`,
              );
              return;
            }
            if (form.kind === "folder") {
              await request(
                { id: "folder.create", label: "创建文件夹", confirm: "default" },
                { payload: { name: draft.name } },
                `确认创建文件夹 ${draft.name}？`,
              );
              return;
            }
            await request(
              { id: "object.rename", label: "重命名", confirm: "default" },
              { payload: { key: form.key, name: draft.name } },
              `确认重命名为 ${draft.name}？`,
            );
          },
        }) : null,
        stat ? h("div", {
          key: "stat",
          className: "ci-modal-mask",
          onClick: (e) => { if (e.target === e.currentTarget) setStat(null); },
        }, h("div", { className: "ci-modal", role: "dialog" },
          h("h3", null, stat.copied ? "临时链接" : "详情"),
          stat.copied ? h("p", null, `已复制到剪贴板，约 ${Math.round((stat.expiresSec || 900) / 60)} 分钟有效。`) : null,
          stat.url && !stat.copied ? h("p", null, "链接已生成，请尽快使用，约 15 分钟有效。") : null,
          !stat.copied && !stat.url ? ["名称", "大小", "存储类型", "修改时间", "对象地址"].map((label) => {
            const map = { 名称: stat.name, 大小: stat.sizeLabel, 存储类型: stat.storageClass, 修改时间: stat.lastModified, 对象地址: stat.url || stat.address };
            return h("p", { key: label }, `${label}：${map[label] || "-"}`);
          }) : null,
          h("div", { className: "ci-modal-actions" },
            h("button", { type: "button", className: "ci-mini primary", onClick: () => setStat(null) }, "关闭"),
          ),
        )) : null,
        h(ConfirmDialog, {
          key: "confirm",
          open: !!confirm,
          title: confirm?.action?.label,
          text: confirm?.text,
          busy,
          danger: !!confirm?.danger,
          onCancel: () => { if (!busy) setConfirm(null); },
          onConfirm: () => confirm && run(confirm.action, confirm.extra).catch(() => {}),
        }),
      ];
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
      if (kind === "cos") {
        return h(CiBoundary, null, h("div", { className: "ci-root ci-tool" },
          h("div", { className: "ci-panel" },
            h(CosConsoleView, {
              payload,
              args,
              skipConfirm,
              onSkipConfirm: setSkipConfirm,
            }),
          ),
        ));
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
