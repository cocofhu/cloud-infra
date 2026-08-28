window.__ModuleLoader__.load({
  id: "@cocofhu/cloud-infra",
  factory: (require) => {
    const React = require("react");
    const h = React.createElement;
    const { useEffect, useState, useRef } = React;

    const CSS = `
.ci-root,.ci-tool{font-family:inherit;color:var(--dsw-alias-label-primary);width:100%;max-width:100%;min-width:0;box-sizing:border-box;padding:2px 0 6px}
.ci-panel{border:1px solid var(--dsw-alias-border-l2,#e5e7eb);border-radius:12px;background:var(--dsw-alias-bg-layer-3,#fff);overflow:hidden;width:100%;max-width:100%;min-width:0;box-sizing:border-box}
.ci-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;min-width:0;flex-wrap:wrap}
.ci-bar-left{display:flex;align-items:baseline;gap:8px;min-width:0}
.ci-bar-title{font-size:14px;font-weight:650;line-height:22px;color:var(--dsw-alias-label-primary)}
.ci-bar-count{color:var(--dsw-alias-label-tertiary,#6b7280);font-size:12px}
.ci-search-wrap{position:relative;width:min(260px,100%);flex:none}
.ci-search-ico{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--dsw-alias-label-caption,#9ca3af);pointer-events:none}
.ci-search{width:100%;height:32px;border:1px solid var(--dsw-alias-border-l2,#e5e7eb);border-radius:8px;padding:0 28px 0 32px;font:inherit;font-size:13px;background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;box-sizing:border-box;appearance:none;-webkit-appearance:none}
.ci-search::-webkit-search-cancel-button,.ci-search::-webkit-search-decoration{appearance:none;-webkit-appearance:none;display:none}
.ci-search:focus{outline:none;border-color:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#2563eb);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary-new-colorprimary-new-color,#2563eb) 16%,transparent)}
.ci-search-x{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:22px;height:22px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;font:inherit;line-height:1}
.ci-search-x:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.06));color:var(--dsw-alias-label-primary)}
.ci-list{background:var(--dsw-alias-bg-layer-1,#fff);border-top:1px solid var(--dsw-alias-border-l1,#f3f4f6);overflow:auto;width:100%;min-width:0}
.ci-list.busy{opacity:.65;pointer-events:none}
.ci-row{display:grid;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid var(--dsw-alias-border-l1,#f3f4f6);min-width:0;box-sizing:border-box}
.ci-row.head{background:var(--dsw-alias-bg-layer-2,rgba(15,23,42,.03));color:var(--dsw-alias-label-tertiary,#6b7280);font-size:12px;font-weight:500;padding:8px 14px}
.ci-row:last-child{border-bottom:0}
.ci-row:not(.head):hover{background:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.04))}
.ci-cell{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary,#4b5563)}
.ci-row.head .ci-cell{color:var(--dsw-alias-label-tertiary,#6b7280)}
.ci-cell.num{font-variant-numeric:tabular-nums}
.ci-name{font-weight:500;color:var(--dsw-alias-label-primary);background:none;border:0;padding:0;cursor:pointer;font:inherit;font-size:13px;text-align:left;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ci-name:hover{color:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#2563eb)}
.ci-ops{display:flex;align-items:center;gap:12px}
.ci-link{background:none;border:0;padding:0;margin:0;cursor:pointer;font:inherit;font-size:13px;color:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#2563eb)}
.ci-link:hover{text-decoration:underline}
.ci-link:disabled{opacity:.45;cursor:wait;text-decoration:none}
.ci-link.danger{color:var(--dsw-alias-state-error-primary,#b91c1c)}
.ci-status{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;font-size:12px}
.ci-dot{display:inline-block;width:6px;height:6px;min-width:6px;min-height:6px;border-radius:50%;flex:none;overflow:hidden}
.ci-dot.enable{background:#00a870}
.ci-dot.pause{background:#e37318}
.ci-dot.error{background:#d54941}
.ci-dot.unknown{background:#9ca3af}
.ci-empty{padding:36px 16px;text-align:center;color:var(--dsw-alias-label-caption,#9ca3af);font-size:13px;background:var(--dsw-alias-bg-layer-1,#fff);border-top:1px solid var(--dsw-alias-border-l1,#f3f4f6)}
.ci-footbar{display:flex;align-items:center;justify-content:space-between;padding:8px 16px;border-top:1px solid var(--dsw-alias-border-l1,#f3f4f6);background:var(--dsw-alias-bg-layer-1,#fff)}
.ci-page{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;font-size:12px;color:var(--dsw-alias-label-tertiary,#6b7280);flex-wrap:wrap}
.ci-page-btns{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.ci-page-btn{min-width:28px;height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2,#e5e7eb);background:var(--dsw-alias-bg-layer-3,#fff);border-radius:8px;cursor:pointer;font:inherit;color:inherit}
.ci-page-btn:hover:not(:disabled):not(.active){border-color:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#2563eb);color:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#2563eb)}
.ci-page-btn.active{background:var(--dsw-alias-button-primary-fill,#2563eb);color:var(--dsw-alias-label-primary-foreground,#fff);border-color:transparent}
.ci-page-btn:disabled{opacity:.4;cursor:default}
.ci-hint{color:var(--dsw-alias-label-caption);font-size:12px;line-height:18px;margin:0 0 10px}
.ci-badge{display:inline-block;margin-right:6px;padding:1px 6px;border-radius:999px;background:var(--dsw-alias-markdown-tag,#f3f4f6);font-size:10px;color:var(--dsw-alias-label-secondary)}
.ci-st{font-size:11px;padding:1px 6px;border-radius:999px}
.ci-st.enable{background:var(--dsw-alias-state-success-tertiary,#ecfdf5);color:var(--dsw-alias-state-success-primary,#047857)}
.ci-st.pause{background:var(--dsw-alias-state-warn-tertiary,#fff7ed);color:var(--dsw-alias-state-warn-label,#c2410c)}
.ci-st.error{background:var(--dsw-alias-interactive-bg-hover-danger,#fef2f2);color:var(--dsw-alias-state-error-primary,#b91c1c)}
.ci-foot{color:var(--dsw-alias-label-caption,#9ca3af);font-size:11px;line-height:16px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ci-overlay{position:fixed;inset:0;z-index:2147483000;background:var(--dsw-alias-bg-mask-3,rgba(15,23,42,.48));display:flex;align-items:center;justify-content:center;padding:24px 16px;box-sizing:border-box}
.ci-drawer{position:relative;width:min(840px,100%);height:min(86vh,860px);max-height:min(86vh,860px);margin:0 auto;background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 18px 50px rgba(15,23,42,.28)}
.ci-close{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-3);cursor:pointer;font-size:18px;z-index:2;color:var(--dsw-alias-label-secondary)}
.ci-close:hover{background:var(--dsw-alias-interactive-bg-hover,#f3f4f6)}
.ci-head{padding:18px 48px 16px 18px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-shrink:0}
.ci-head h2{margin:0 0 6px;font-size:18px;line-height:1.35}
.ci-body{flex:1;min-height:0;overflow:auto;padding:12px 18px 20px}
.ci-chips{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 16px}
.ci-chip{font-size:12px;padding:5px 8px;border-radius:7px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-caption)}
.ci-chip b{color:var(--dsw-alias-label-primary);margin-left:4px;font-weight:600}
.ci-sec{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px}
.ci-sec-t{font-size:13px;font-weight:650}
.ci-table-wrap{width:100%;overflow:auto}
.ci-table{width:100%;min-width:560px;border-collapse:collapse;font-size:13px}
.ci-table th,.ci-table td{text-align:left;padding:10px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);vertical-align:middle}
.ci-table th{color:var(--dsw-alias-label-tertiary);font-weight:500;font-size:12px}
.ci-table td{word-break:break-all;color:var(--dsw-alias-label-secondary)}
.ci-table td.ci-ops-cell{white-space:nowrap;word-break:normal}
.ci-table tbody tr:hover td{background:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.04))}
.ci-rec-page{margin-top:10px;padding-top:4px}
.ci-mini{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);color:var(--dsw-alias-label-primary);border-radius:8px;padding:5px 12px;cursor:pointer;font:inherit;font-size:13px}
.ci-mini.primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border-color:transparent}
.ci-mini.danger{color:var(--dsw-alias-state-error-primary)}
.ci-actions{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}
.ci-err{color:var(--dsw-alias-state-error-primary);font-size:12px;margin:8px 0}
.ci-load{display:flex;align-items:center;justify-content:center;padding:28px;color:var(--dsw-alias-label-caption)}
.ci-modal-mask{position:fixed;inset:0;z-index:2147483645;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(16,28,36,.42)}
.ci-modal{width:min(420px,100%);background:var(--dsw-alias-bg-layer-1,#fff);border:1px solid var(--dsw-alias-border-l2);border-radius:14px;padding:18px}
.ci-modal h3{margin:0 0 8px;font-size:16px}
.ci-modal p{margin:0 0 14px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:1.55}
.ci-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
.ci-cfg-item{list-style:none;margin:0;padding:0;min-width:0}
.ci-cfg{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;overflow:hidden;box-sizing:border-box;width:100%;min-width:0}
.ci-cfg[open]{background:var(--dsw-alias-bg-layer-2)}
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
.ci-cfg-f input[type=text],.ci-cfg-f input[type=password],.ci-cfg-f input[type=number]{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);height:34px;font:inherit;border-radius:8px;padding:0 12px;font-size:13px}
.ci-cfg-hint{margin:0;color:var(--dsw-alias-label-caption);font-size:12px}
.ci-cfg-src{display:flex;flex-wrap:wrap;gap:10px 16px}
.ci-cfg-src label{display:flex;gap:6px;align-items:center;font-weight:400;cursor:pointer}
.ci-cfg-ft{border-top:1px solid var(--dsw-alias-border-l2);justify-content:flex-end;gap:8px;padding:12px 0 4px;display:flex}
.ci-cfg-save{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border:1px solid transparent;border-radius:8px;padding:5px 14px;font:inherit;cursor:pointer}
.ci-cfg-disc{background:var(--dsw-alias-button-elevated-fill);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);border-radius:8px;padding:5px 14px;font:inherit;cursor:pointer}
.ci-cfg-save:disabled,.ci-cfg-disc:disabled{opacity:.4;cursor:default}
.ci-field{display:flex;flex-direction:column;gap:4px;margin:0 0 10px}
.ci-field input,.ci-field select{height:34px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:inherit;padding:0 10px;font:inherit}
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
        h("span", {
          className: "ci-dot " + status,
          style: { width: 6, height: 6, display: "inline-block", borderRadius: "50%", flex: "none" },
        }),
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
      return h("div", { className: "ci-page" },
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
      );
    }

    function ResourceTable({ items, pendingId, onOpen, extraCols, showProvider, busy, emptyHint }) {
      extraCols = Array.isArray(extraCols) ? extraCols : [];
      const rows = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!rows.length) return h("div", { className: "ci-empty" }, emptyHint || "没有资源");
      const nameLabel = rows.every((row) => row.kind === "domain") ? "域名" : "名称";
      const template = [
        "minmax(140px,1.8fr)",
        showProvider ? "64px" : null,
        "84px",
        ...extraCols.map((label) => label === "记录数" ? "64px" : "minmax(72px,0.7fr)"),
        "64px",
      ].filter(Boolean).join(" ");
      const head = [
        h("div", { key: "n", className: "ci-cell" }, nameLabel),
        showProvider ? h("div", { key: "p", className: "ci-cell" }, "云厂商") : null,
        h("div", { key: "s", className: "ci-cell" }, "状态"),
        extraCols.map((label) => h("div", { key: label, className: "ci-cell" }, label)),
        h("div", { key: "o", className: "ci-cell" }, "操作"),
      ];
      return h("div", { className: "ci-list" + (busy ? " busy" : "") },
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

    function ConfirmDialog({ open, title, text, busy, danger, onCancel, onConfirm }) {
      if (!open) return null;
      const node = h("div", { className: "ci-modal-mask", role: "dialog" },
        h("div", { className: "ci-modal" },
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
      const node = h("div", { className: "ci-modal-mask" },
        h("div", { className: "ci-modal" },
          h("h3", null, action.label),
          fields.map((field) => h("div", { className: "ci-field", key: field.key },
            h("label", null, field.label),
            h("input", {
              type: "text",
              placeholder: field.placeholder || "",
              value: draft[field.key] || "",
              onChange: (e) => setDraft({ ...draft, [field.key]: e.target.value }),
            }),
          )),
          err ? h("p", { className: "ci-err" }, err) : null,
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

    function Drawer({ item, detail, loading, error, skipConfirm, onClose, onReload }) {
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
          setErr(e.message || String(e));
        } finally {
          setBusy(false);
        }
      };
      const request = (action, payload, text) => {
        const must = action.confirm === "always" || (action.confirm === "default" && !skipConfirm);
        if (!must) return run(action, payload);
        setConfirm({ action, payload, text, danger: action.confirm === "always" });
      };
      const node = h("div", { className: "ci-overlay", onClick: (e) => { if (e.target === e.currentTarget) onClose(); } },
        h("div", { className: "ci-drawer" },
          h("button", { type: "button", className: "ci-close", onClick: onClose }, "×"),
          h("div", { className: "ci-head" },
            h("h2", null, item.title),
            h("div", { className: "ci-foot" },
              h(StatusCell, { status: item.status }),
              item.badges?.length ? " · " + item.badges.join(" · ") : "",
            ),
          ),
          h("div", { className: "ci-body" },
            loading ? h("div", { className: "ci-load" }, "加载详情…") : null,
            !loading && error && !detail ? h("div", { className: "ci-err" }, error) : null,
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
          ),
        ),
      );
      return [
        createPortal(node, document.body),
        form ? h(RecordForm, {
          action: form.action,
          initial: form.initial,
          busy,
          err,
          onCancel: () => setForm(null),
          onSubmit: (draft) => request(form.action, { ...form.initial, ...draft }, `确认${form.action.label}？`),
        }) : null,
        h(ConfirmDialog, {
          open: !!confirm,
          title: confirm?.action?.label,
          text: confirm?.text,
          busy,
          danger: !!confirm?.danger,
          onCancel: () => setConfirm(null),
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
      useEffect(() => {
        let live = true;
        api("meta", {}).then((d) => { if (live) setSkipConfirm(!!d.skipConfirm); }).catch(() => {});
        return () => { live = false; };
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
          setListErr(e.message || String(e));
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
        try {
          const detail = await api("detail", { moduleId: item.moduleId, id: item.id, title: item.title });
          setSession({ item, loading: false, detail });
        } catch (e) {
          setSession({ item, loading: false, detail: null, error: e.message });
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
      const errors = payload?.errors || [];
      if (!fromTool?.length && !rows.length && !activeQ && !draftQ) {
        const msg = errors.map((e) => e.message).join("；");
        return msg ? h("div", { className: "ci-err" }, msg) : null;
      }
      const extraCols = columnLabels(rows);
      const showProvider = new Set((Array.isArray(rows) ? rows : []).map((item) => item && item.provider)).size > 1;
      return h(CiBoundary, null, h("div", { className: "ci-root ci-tool" },
        h("div", { className: "ci-panel" },
          h("div", { className: "ci-bar" },
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
                disabled: listBusy,
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
          listErr ? h("div", { className: "ci-err", style: { margin: "0 14px 8px" } }, listErr) : null,
          h(ResourceTable, {
            items: rows,
            pendingId,
            onOpen: openItem,
            extraCols,
            showProvider,
            busy: listBusy,
            emptyHint: activeQ ? `没有匹配「${activeQ}」的资源` : "没有资源",
          }),
          h("div", { className: "ci-footbar" },
            h(Pager, {
              total: counted,
              page,
              pages: pageCount,
              busy: listBusy,
              onPage: goPage,
            }),
          ),
        ),
        session ? h(Drawer, {
          item: session.item,
          detail: session.detail,
          loading: session.loading,
          error: session.error,
          skipConfirm,
          onClose: () => setSession(null),
          onReload: reload,
        }) : null,
      ));
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
      useEffect(() => {
        let live = true;
        api("config", {}).then((d) => {
          if (!live) return;
          setMeta(configToMeta(d));
          const next = configToDraft(d);
          setSaved(next);
          setDraft(next);
        }).catch((e) => { if (live) setErr(e.message || String(e)); });
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
        } catch (e) {
          setErr(e.message || String(e));
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
              h("label", null, "产品模块"),
              h("div", { className: "ci-cfg-src" },
                modules.map((module) => h("label", { key: module.id },
                  h("input", {
                    type: "checkbox",
                    checked: draft.modules[module.id] !== false,
                    onChange: () => setDraft({
                      ...draft,
                      modules: { ...draft.modules, [module.id]: draft.modules[module.id] === false },
                    }),
                  }),
                  module.title || module.id,
                )),
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
