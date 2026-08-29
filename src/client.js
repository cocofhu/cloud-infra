window.__ModuleLoader__.load({
  id: "@cocofhu/cloud-infra",
  factory: (require) => {
    const React = require("react");
    const h = React.createElement;
    const { useEffect, useState, useRef } = React;

    const CSS = `
.ci-root,.ci-tool{font-family:inherit;color:var(--dsw-alias-label-primary);width:100%;max-width:100%;min-width:0;box-sizing:border-box;padding:2px 0 6px}
.ci-panel{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden;width:100%;max-width:100%;min-width:0;box-sizing:border-box}
.ci-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;min-width:0;flex-wrap:nowrap;overflow-x:auto}
.ci-bar-left{display:flex;align-items:center;gap:8px;flex:none;min-width:0}
.ci-bar-title{font-size:14px;font-weight:650;line-height:22px;color:var(--dsw-alias-label-primary)}
.ci-bar-count{color:var(--dsw-alias-label-tertiary);font-size:12px}
.ci-search-wrap{position:relative;flex:1 1 160px;min-width:128px;max-width:220px;width:auto}
.ci-search-ico{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--dsw-alias-label-caption);pointer-events:none}
.ci-search{width:100%;height:32px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:0 28px 0 32px;font:inherit;font-size:13px;background:var(--dsw-alias-bg-layer-2);color:inherit;box-sizing:border-box;appearance:none;-webkit-appearance:none}
.ci-search::-webkit-search-cancel-button,.ci-search::-webkit-search-decoration{appearance:none;-webkit-appearance:none;display:none}
.ci-search:focus{outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent)}
.ci-search-x{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:22px;height:22px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;font:inherit;line-height:1}
.ci-search-x:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.ci-list{border-top:1px solid var(--dsw-alias-border-l1);overflow-x:auto;overflow-y:auto;width:100%;max-width:100%;min-width:0}
.ci-row{display:grid;align-items:center;gap:8px;padding:9px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);min-width:0;width:100%;box-sizing:border-box}
.ci-cert-list .ci-row{min-width:860px}
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
.ci-crumb{display:flex;align-items:center;gap:8px;padding:8px 12px 8px 8px;border-bottom:1px solid var(--dsw-alias-border-l1);min-width:0}
.ci-back{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;background:transparent;border-radius:8px;cursor:pointer;color:var(--dsw-alias-label-secondary);flex:none}
.ci-back:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}
.ci-back:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.ci-crumb-meta{display:flex;align-items:center;gap:8px;min-width:0;flex:1}
.ci-head-t{font-weight:650;font-size:14px;line-height:22px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ci-crumb .ci-status{flex:none;height:22px;padding:0 8px;border-radius:999px;background:var(--dsw-alias-bg-layer-2)}
.ci-chips{display:flex;flex-wrap:wrap;gap:6px;padding:10px 14px 4px}
.ci-chip{font-size:12px;padding:4px 8px;border-radius:7px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-caption)}
.ci-chip b{color:var(--dsw-alias-label-primary);margin-left:4px;font-weight:600}
.ci-sec{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 14px}
.ci-sec-t{font-size:13px;font-weight:650}
.ci-sec-empty{display:flex;align-items:center;gap:8px;padding:0 14px 14px;font-size:13px;color:var(--dsw-alias-label-secondary);line-height:22px}
.ci-table-wrap{width:100%;max-width:100%;min-width:0;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch}
.ci-table{width:100%;min-width:520px;border-collapse:collapse;font-size:13px}
.ci-table th,.ci-table td{text-align:left;padding:8px 12px;border-top:1px solid var(--dsw-alias-border-l1);vertical-align:middle;white-space:nowrap;word-break:normal}
.ci-table th{color:var(--dsw-alias-label-tertiary);font-weight:500;font-size:12px}
.ci-panel:not(.ci-image) .ci-table td {word-break:break-all;color:var(--dsw-alias-label-secondary)}
.ci-table td.ci-ops-cell{white-space:nowrap;word-break:normal}
.ci-table tbody tr:hover td{background:var(--dsw-alias-interactive-bg-hover)}
.ci-rec-page{margin:0}
.ci-mini{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);color:var(--dsw-alias-label-primary);border-radius:8px;padding:5px 12px;cursor:pointer;font:inherit;font-size:13px;white-space:nowrap;flex-shrink:0}
.ci-mini.primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border-color:transparent}
.ci-mini.danger{color:var(--dsw-alias-state-error-primary)}
.ci-mini:disabled{opacity:.4;cursor:default}
.ci-actions{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 12px}
.ci-err{color:var(--dsw-alias-state-error-primary);font-size:12px;margin:8px 14px}
.ci-root .ci-err,.ci-panel .ci-err{color:var(--dsw-alias-state-error-primary);font-size:12px;font-weight:400;line-height:18px;margin:8px 14px}
.ci-load{display:flex;align-items:center;justify-content:center;padding:36px 16px;color:var(--dsw-alias-label-caption);border-top:1px solid var(--dsw-alias-border-l1)}
.ci-list-body{min-height:160px}
.ci-list-body .ci-load{min-height:160px;box-sizing:border-box}
.ci-spin{display:inline-block;width:12px;height:12px;border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);border-radius:50%;animation:ci-spin .7s linear infinite;vertical-align:-1px;margin-right:6px}
@keyframes ci-spin{to{transform:rotate(360deg)}}
.ci-monitor{border-top:1px solid var(--dsw-alias-border-l1);padding:10px 14px 14px;min-width:0}
.ci-monitor-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.ci-monitor-title{font-size:13px;font-weight:650;color:var(--dsw-alias-label-primary)}
.ci-monitor-ranges{display:inline-flex;gap:4px;padding:2px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-2)}
.ci-monitor-range{border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:20px;padding:2px 10px;border-radius:7px;cursor:pointer}
.ci-monitor-range:hover{color:var(--dsw-alias-label-primary)}
.ci-monitor-range.active{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}
.ci-monitor-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
.ci-monitor-chart{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:10px 12px 6px;min-width:0;box-sizing:border-box}
.ci-monitor-chart-h{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:4px;min-width:0}
.ci-monitor-chart-t{font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ci-monitor-chart-v{font-size:13px;font-weight:650;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;white-space:nowrap}
.ci-monitor-chart-v i{font-style:normal;font-size:11px;font-weight:400;color:var(--dsw-alias-label-tertiary);margin-left:2px}
.ci-monitor-chart-box{width:100%;height:180px;min-width:0}
.ci-monitor-empty{display:flex;align-items:center;justify-content:center;height:180px;color:var(--dsw-alias-label-caption);font-size:12px}
.ci-monitor-note{padding:16px 4px;text-align:center;color:var(--dsw-alias-label-caption);font-size:13px}
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
.ci-groups{display:flex;gap:16px;padding:0 14px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.ci-groups .ci-group{background:none;border:0;border-bottom:2px solid transparent;padding:8px 0;margin-bottom:-1px;cursor:pointer;font:inherit;font-size:13px;color:var(--dsw-alias-label-tertiary)}
.ci-groups .ci-group.active{color:var(--dsw-alias-brand-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:600}
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
label.ci-check,div.ci-check{display:flex;align-items:flex-start;gap:8px;padding:7px 0;font-size:13px;line-height:1.4}
.ci-modal.wide{width:min(560px,100%)}
.ci-renew{margin-left:6px}
.ci-select{height:32px;width:auto;max-width:180px;flex:none;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:0 8px;font:inherit;font-size:13px;background:var(--dsw-alias-bg-layer-2);color:inherit;box-sizing:border-box}
.ci-select:focus{outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent)}
.ci-ghost{height:30px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);border-radius:8px;padding:0 10px;cursor:pointer;font:inherit;color:inherit}
.ci-ghost.on{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}
.ci-id{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0}
.ci-id-sub{color:var(--dsw-alias-label-tertiary);font-size:12px;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.ci-ip{display:block;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.ci-scroll{width:100%;overflow:auto}
.ci-dense{width:100%;min-width:980px;border-collapse:collapse;font-size:13px}
.ci-dense th,.ci-dense td{text-align:left;padding:10px 12px;border-top:1px solid var(--dsw-alias-border-l1);vertical-align:top;white-space:nowrap}
.ci-dense th{color:var(--dsw-alias-label-tertiary);font-weight:500;font-size:12px;background:var(--dsw-alias-bg-layer-2)}
.ci-dense tbody tr:hover td{background:var(--dsw-alias-interactive-bg-hover)}
.ci-more{position:relative;display:inline-block}
.ci-menu{position:absolute;right:0;top:22px;z-index:3;min-width:88px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;box-shadow:var(--dsw-alias-shadow);padding:4px 0}
.ci-menu button{display:block;width:100%;text-align:left;padding:8px 12px;border:0;background:transparent;cursor:pointer;font:inherit;color:inherit}
.ci-menu button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.ci-menu button:disabled{color:var(--dsw-alias-label-caption);cursor:default}
.ci-group{padding:10px 14px 4px;color:var(--dsw-alias-label-tertiary);font-weight:650;background:var(--dsw-alias-bg-layer-2);border-top:1px solid var(--dsw-alias-border-l1)}
.ci-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;padding:12px 14px}
.ci-card{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:12px;background:var(--dsw-alias-bg-layer-1);min-width:0}
.ci-card-h{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.ci-card-t{font-size:14px;font-weight:650;margin:0;min-width:0;overflow:hidden;text-overflow:ellipsis;background:none;border:0;padding:0;cursor:pointer;font:inherit;color:inherit;text-align:left}
.ci-card-t:hover{color:var(--dsw-alias-brand-primary)}
.ci-kv{margin-top:8px;color:var(--dsw-alias-label-tertiary);font-size:12px}
.ci-kv b{color:var(--dsw-alias-label-primary);font-weight:550}
.ci-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 24px;padding:0 16px 16px}
.ci-f{color:var(--dsw-alias-label-tertiary);font-size:12px}
.ci-f b{display:block;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:550;margin-top:2px}
.ci-sec-t{font-size:13px;font-weight:650;padding:12px 16px 4px}
.ci-power{margin-left:auto;display:flex;gap:6px;flex-wrap:wrap}
.ci-tabs{display:flex;align-items:stretch;gap:0;border-bottom:1px solid var(--dsw-alias-border-l1);padding:0 10px;overflow-x:auto;background:var(--dsw-alias-bg-layer-1)}
.ci-tab{border:0;background:none;padding:10px 14px;cursor:pointer;font:inherit;font-size:13px;color:var(--dsw-alias-label-secondary);border-bottom:2px solid transparent;white-space:nowrap;flex:none}
.ci-tab:hover{color:var(--dsw-alias-brand-primary)}
.ci-tab.on{color:var(--dsw-alias-brand-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:650}
.ci-tab.active{color:var(--dsw-alias-brand-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:650}
.ci-agree{display:flex;align-items:flex-start;gap:8px;margin:8px 0 0;font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary)}
.ci-agree a{color:var(--dsw-alias-brand-primary)}
.ci-switch{display:inline-flex;align-items:center;gap:6px;background:none;border:0;padding:0;margin:0;cursor:pointer;font:inherit;font-size:13px;color:var(--dsw-alias-brand-primary)}
.ci-switch:disabled{opacity:.45;cursor:not-allowed}
.ci-hint-inline{color:var(--dsw-alias-label-caption);font-size:12px;padding:8px 14px 12px}
.ci-cart-list{margin:0 0 12px;padding:0;list-style:none}
.ci-cart-list li{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:13px}
.ci-modal.wide{width:min(560px,100%)}
.ci-modal.wizard{width:min(720px,100%);max-height:80vh;min-height:480px;padding:0;display:flex;flex-direction:column;overflow:hidden}
.ci-wiz-head{padding:18px 24px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none}
.ci-wiz-head h3{margin:0 0 14px;font-size:18px}
.ci-wiz-steps{display:flex;align-items:center;gap:0}
.ci-wiz-step{display:flex;align-items:center;gap:8px;color:var(--dsw-alias-label-tertiary);font-size:13px;white-space:nowrap}
.ci-wiz-step.on,.ci-wiz-step.done{color:var(--dsw-alias-label-primary)}
.ci-wiz-step.on{font-weight:650}
.ci-wiz-n{width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:650;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary)}
.ci-wiz-step.on .ci-wiz-n{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground)}
.ci-wiz-step.done .ci-wiz-n{background:var(--dsw-alias-state-success-tertiary);color:var(--dsw-alias-state-success-primary)}
.ci-wiz-line{flex:1;height:1px;background:var(--dsw-alias-border-l1);margin:0 10px;min-width:12px}
.ci-wiz-body{padding:18px 24px;overflow:auto;flex:1;min-height:280px}
.ci-wiz-foot{padding:12px 24px 18px;border-top:1px solid var(--dsw-alias-border-l1);display:flex;justify-content:flex-end;gap:8px;flex:none}
.ci-wiz-foot .ci-mini{height:34px;padding:0 16px}
.ci-wiz-sec{font-size:13px;font-weight:650;margin:16px 0 8px;color:var(--dsw-alias-label-primary)}
.ci-wiz-sec:first-child{margin-top:0}
.ci-opt{display:flex;align-items:flex-start;gap:10px;padding:12px 0;border-top:1px solid var(--dsw-alias-border-l1);cursor:pointer}
.ci-opt:first-of-type{border-top:0}
.ci-opt input{margin-top:2px;flex:none}
.ci-opt-t{font-size:13px;font-weight:550;color:var(--dsw-alias-label-primary)}
.ci-opt-d{margin:2px 0 0;font-size:12px;color:var(--dsw-alias-label-caption);line-height:18px}
.ci-cart-table{width:100%;border-collapse:collapse;font-size:13px}
.ci-cart-table th,.ci-cart-table td{padding:10px 8px 10px 0;border-bottom:1px solid var(--dsw-alias-border-l1);text-align:left;vertical-align:middle}
.ci-cart-table th{color:var(--dsw-alias-label-tertiary);font-weight:500;font-size:12px}
.ci-cart-table td.num,.ci-cart-table .sum{font-variant-numeric:tabular-nums}
.ci-cart-table .sum{font-weight:650;font-size:14px;border-bottom:0}
.ci-kv.review,.ci-kv:has(.ci-kv-k){display:grid;grid-template-columns:108px 1fr;gap:8px 12px;padding:12px 14px 14px}
.ci-kv.review{padding:0;gap:10px 16px}
.ci-kv-k{font-size:12px;line-height:20px;color:var(--dsw-alias-label-tertiary)}
.ci-kv-v{font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary);word-break:break-all}
.ci-sec-list{padding:2px 0 8px}
.ci-sec-list .ci-sec{align-items:center;justify-content:space-between;gap:16px;padding:14px}
.ci-sec-list .ci-sec + .ci-sec{border-top:1px solid var(--dsw-alias-border-l1)}
.ci-sec-meta{min-width:0;flex:1}
.ci-sec-d{margin:4px 0 0;color:var(--dsw-alias-label-caption);font-size:12px;line-height:18px}
.ci-toggle{width:36px;height:20px;border:0;border-radius:999px;background:var(--dsw-alias-bg-layer-3);cursor:pointer;flex:none;padding:2px}
.ci-toggle.on{background:var(--dsw-alias-brand-primary)}
.ci-toggle:disabled{opacity:.4;cursor:not-allowed}
.ci-toggle i{display:block;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-alias-shadow);transform:translateX(0);transition:transform .16s}
.ci-toggle.on i{transform:translateX(16px)}
.ci-pane-load{min-height:160px;display:flex;align-items:center;justify-content:center;gap:2px;color:var(--dsw-alias-label-caption);border-top:1px solid var(--dsw-alias-border-l1);font-size:13px}
.ci-tab:disabled{cursor:wait;opacity:1}
.ci-subnav{display:flex;flex-wrap:wrap;gap:6px;padding:8px 14px;background:var(--dsw-alias-bg-layer-2);border-bottom:1px solid var(--dsw-alias-border-l1)}
.ci-subnav-item{height:26px;padding:0 10px;border:0;border-radius:999px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;font-size:12px;display:inline-flex;align-items:center;gap:4px}
.ci-subnav-item.on{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-weight:600;box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l2)}
.ci-subnav-item:disabled{cursor:wait}
.ci-kv{display:grid;grid-template-columns:140px 1fr 140px 1fr;gap:10px 16px;padding:16px 14px}
.ci-k{color:var(--dsw-alias-label-tertiary)}
.ci-sub{display:block;color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400}
.ci-drop{position:relative}
.ci-drop-menu{position:absolute;right:0;top:100%;z-index:5;min-width:168px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:4px 0;box-shadow:var(--dsw-alias-shadow)}
.ci-drop-item{display:block;width:100%;text-align:left;border:0;background:transparent;padding:8px 12px;font:inherit;cursor:pointer;color:inherit}
.ci-drop-item:hover{background:var(--dsw-alias-interactive-bg-hover)}
.ci-tools{display:flex;flex-wrap:nowrap;gap:8px;align-items:center;min-width:0}
.ci-sel{height:32px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:inherit;padding:0 8px;font:inherit;flex:none}
.ci-sql{width:100%;min-height:120px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:inherit;padding:8px;font:inherit;box-sizing:border-box;resize:vertical}
.ci-dmc{display:grid;grid-template-columns:minmax(140px,200px) 1fr;min-height:280px}
.ci-tree{border-right:1px solid var(--dsw-alias-border-l1);padding:8px;overflow:auto}
.ci-tree button{display:block;width:100%;text-align:left;border:0;background:transparent;padding:4px 6px;font:inherit;cursor:pointer;color:inherit}
.ci-tree button:hover{color:var(--dsw-alias-brand-primary)}
.ci-login-box{width:min(360px,100%);margin:24px auto;padding:8px 4px}
.ci-check{width:15px;height:15px;accent-color:var(--dsw-alias-brand-primary)}
.ci-idcell{display:flex;flex-direction:column;gap:2px;min-width:0}
.ci-pane{padding:12px 14px}
.ci-subtabs{display:flex;gap:8px;margin:0 0 12px}
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
.ci-form-panel{margin:0 14px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:10px 12px;background:var(--dsw-alias-bg-layer-2)}
.ci-form-title{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;font-weight:650;margin:0 0 8px}
.ci-form-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px}
.ci-menu.ci-menu-portal{position:fixed;right:auto;top:auto}
.ci-check input[type=checkbox],input.ci-check{width:15px;height:15px;accent-color:var(--dsw-alias-brand-primary)}
.ci-regionbar{display:flex;align-items:center;gap:8px;flex:none;padding:0;border:0;background:transparent}
.ci-regionbar label{color:var(--dsw-alias-label-secondary);line-height:32px;flex:none;font-size:13px;font-weight:400}
.ci-combo{position:relative;width:240px;flex:none}
.ci-combo input{height:32px;width:100%;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:0 8px;font:inherit;font-size:13px;line-height:32px;background:var(--dsw-alias-bg-layer-1);color:inherit;box-sizing:border-box}
.ci-combo input:focus{outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent)}
.ci-combo-list{position:absolute;left:0;right:0;top:36px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;max-height:200px;overflow:auto;z-index:3;margin:0;padding:4px 0;list-style:none}
.ci-combo-list li{padding:6px 10px;cursor:pointer;font-size:13px}
.ci-combo-list li.on,.ci-combo-list li:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-brand-primary)}
.ci-combo-id{color:var(--dsw-alias-label-tertiary);margin-left:8px;font-size:12px}
.ci-tool-left{display:flex;align-items:center;gap:8px;flex-wrap:nowrap;flex:none}
.ci-crumbs{display:flex;flex-wrap:wrap;align-items:center;gap:4px;padding:8px 14px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:13px;color:var(--dsw-alias-label-secondary)}
.ci-crumbs button{background:none;border:0;padding:0;font:inherit;color:var(--dsw-alias-brand-primary);cursor:pointer}
.ci-crumbs span{color:var(--dsw-alias-label-caption)}
.ci-file-name{display:inline-flex;align-items:center;gap:6px;min-width:0}
.ci-more-list{position:absolute;right:0;top:22px;min-width:140px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:4px 0;z-index:4;box-shadow:var(--dsw-alias-shadow)}
.ci-more-list button{display:block;width:100%;text-align:left;background:none;border:0;padding:6px 12px;font:inherit;cursor:pointer;color:inherit}
.ci-more-list button:hover{background:var(--dsw-alias-interactive-bg-hover)}
.ci-more-list button.danger{color:var(--dsw-alias-state-error-primary)}
.ci-search-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap}
.ci-search-bar-main{display:flex;align-items:center;gap:10px;min-width:0;flex:1}
.ci-search-meta{min-width:0}
.ci-search-sub{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
.ci-name-stack{display:flex;flex-direction:column;gap:2px;min-width:0}
.ci-query{display:grid;grid-template-columns:minmax(0,1fr) 168px;gap:10px;padding:12px;border-bottom:1px solid var(--dsw-alias-border-l1);align-items:stretch}
.ci-query-side{display:flex;flex-direction:column;gap:6px;min-width:0}
.ci-query .ci-tiny{margin:0 0 6px}
.ci-cql{width:100%;min-height:72px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:8px;background:var(--dsw-alias-bg-layer-2);color:inherit;font:inherit;resize:vertical;box-sizing:border-box}
.ci-cql:focus,.ci-cls .ci-region:focus{outline:none;border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent)}
.ci-hist{display:flex;align-items:flex-end;gap:2px;height:56px;padding:8px 12px;background:var(--dsw-alias-bg-layer-2);border-bottom:1px solid var(--dsw-alias-border-l1)}
.ci-hist i{flex:1;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 42%,transparent);border-radius:2px 2px 0 0;min-height:2px}
.ci-split{display:grid;grid-template-columns:minmax(108px,140px) minmax(0,1fr);min-width:0}
.ci-log-pane{min-width:0;overflow:auto;max-height:360px}
.ci-fields{border-right:1px solid var(--dsw-alias-border-l1);padding:8px;background:var(--dsw-alias-bg-layer-2);min-width:0}
.ci-fields button{display:block;width:100%;text-align:left;border:0;background:none;padding:5px 6px;cursor:pointer;border-radius:6px;font:inherit;color:inherit}
.ci-fields button:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-brand-primary)}
.ci-log{padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.ci-log-hd{display:flex;justify-content:space-between;gap:8px;color:var(--dsw-alias-label-tertiary);font-size:12px}
.ci-cls .ci-kv{display:inline-block;margin:4px 6px 0 0;background:var(--dsw-alias-bg-layer-2);border-radius:6px;padding:1px 6px;font-size:12px}
.ci-raw{font-family:ui-monospace,Menlo,monospace;font-size:12px;margin-top:4px;word-break:break-all}
.ci-tiny{font-size:12px;color:var(--dsw-alias-label-tertiary)}
.ci-table-scroll{overflow-x:auto;overflow-y:hidden;width:100%;max-width:100%;min-width:0;-webkit-overflow-scrolling:touch}
.ci-cls .ci-table{width:max-content;min-width:100%;border-collapse:collapse}
.ci-foot-note{display:flex;justify-content:space-between;gap:8px;padding:8px 12px;color:var(--dsw-alias-label-tertiary);font-size:12px;border-top:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap}
.ci-cls{--cls-blue:#0052d9;--cls-blue-h:#266fe8;--cls-line:#e7e7e7;--cls-head:#f3f3f3;--cls-sub:#888}
.ci-cls .ci-panel{border-color:var(--cls-line)}
.ci-cls .ci-name,.ci-cls .ci-link{color:var(--cls-blue)}
.ci-cls .ci-name:hover,.ci-cls .ci-link:hover{color:var(--cls-blue-h)}
.ci-cls .ci-table th{background:var(--cls-head);color:#111;font-weight:600;border-top:0;border-bottom:1px solid var(--cls-line)}
.ci-cls .ci-table td{border-top:1px solid var(--cls-line);padding:10px 12px}
.ci-cls .ci-mini.primary{background:var(--cls-blue);color:var(--dsw-alias-label-primary-foreground);border-radius:3px;height:32px;padding:0 16px;font-size:14px;border:0}
.ci-cls .ci-mini.primary:hover:not(:disabled){background:var(--cls-blue-h)}
.ci-cls .ci-back{border-radius:3px;border-color:var(--cls-line);background:var(--dsw-alias-bg-layer-1);height:32px}
.ci-cls .ci-region,.ci-cls .ci-search{border-radius:3px;border-color:var(--cls-line);background:var(--dsw-alias-bg-layer-1)}
.ci-cls .ci-cql{border-radius:3px;border-color:var(--cls-line);background:var(--dsw-alias-bg-layer-1);min-height:64px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px}
.ci-cls-mode{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 8px}
.ci-cls-tag{height:22px;padding:0 8px;border:1px solid var(--cls-line);border-radius:3px;font-size:12px;line-height:20px;color:#111;background:var(--dsw-alias-bg-layer-1)}
.ci-cls-tag.on{border-color:var(--cls-blue);color:var(--cls-blue);background:#f2f3ff}
.ci-cls-hint{font-size:12px;color:var(--cls-sub)}
.ci-cls-filter{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--cls-sub);flex:none}
.ci-cls-dist{padding:8px 12px 6px;border-bottom:1px solid var(--cls-line);background:#fafafa}
.ci-cls-dist-h{display:flex;justify-content:space-between;align-items:center;margin:0 0 6px;font-size:12px;color:var(--cls-sub)}
.ci-cls .ci-hist{height:44px;padding:0;background:transparent;border:0}
.ci-cls .ci-hist i{background:var(--cls-blue);opacity:.55;min-height:2px}
.ci-cls-tabs{display:flex;align-items:flex-end;gap:4px;padding:0 12px;border-bottom:1px solid var(--cls-line);background:var(--dsw-alias-bg-layer-1)}
.ci-cls-tab{height:36px;padding:0 14px;border:0;background:none;font:inherit;font-size:14px;color:#666}
.ci-cls-tab.on{color:var(--cls-blue);font-weight:600;box-shadow:inset 0 -2px 0 var(--cls-blue)}
.ci-cls .ci-split{grid-template-columns:minmax(120px,160px) minmax(0,1fr);min-height:200px}
.ci-cls .ci-fields{background:#fafafa}
.ci-cls .ci-log-hd span:first-child{color:var(--cls-blue);font-variant-numeric:tabular-nums}
.ci-cls .ci-page-btn.active{background:var(--cls-blue);color:var(--dsw-alias-label-primary-foreground);border-color:var(--cls-blue)}
.ci-empty-search{border-top:0;padding:48px 16px}
@media(max-width:640px){.ci-query,.ci-split{grid-template-columns:1fr}.ci-fields{border-right:0;border-bottom:1px solid var(--dsw-alias-border-l1)}}


.ci-image{--ci-title:var(--dsw-alias-label-primary,#0f1419);--ci-text:var(--dsw-alias-label-secondary,#3b4250);--ci-muted:var(--dsw-alias-label-tertiary,#5c6570);--ci-faint:var(--dsw-alias-label-caption,#8b939e);width:100%;max-width:100%;min-width:0;color:var(--ci-text)}
html[data-theme=light] .ci-image,.ci-image[data-theme=light]{--ci-title:#0f1419;color-scheme:light}
html[data-theme=dark] .ci-image,.ci-image[data-theme=dark]{--ci-title:#f7f8fb;color-scheme:dark}
@media (prefers-color-scheme: dark){html:not([data-theme=light]) .ci-image{--ci-title:var(--dsw-alias-label-primary,#f7f8fb);color-scheme:dark}}
.ci-image-head{padding:16px 16px 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.ci-image-title{margin:0;font-size:16px;font-weight:650;line-height:22px;color:var(--ci-title)}
.ci-image-sub{margin:4px 0 12px;color:var(--ci-muted);font-size:12px}
.ci-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.ci-chip-sel{height:32px;padding:0 10px 0 12px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--ci-title);font:inherit;display:flex;align-items:center;gap:8px}
.ci-chip-sel span{color:var(--ci-muted);font-size:12px}
.ci-chip-sel select{border:0;background:transparent;color:var(--ci-title);font:inherit;outline:none;max-width:200px;color-scheme:inherit}
.ci-chip-sel select option,.ci-field select option,.ci-root select option{background-color:Field;color:FieldText}
[data-theme=light] .ci-chip-sel select,[data-theme=light] .ci-field select{color-scheme:light}
[data-theme=dark] .ci-chip-sel select,[data-theme=dark] .ci-field select{color-scheme:dark}
[data-theme=light] .ci-chip-sel select option,[data-theme=light] .ci-field select option{background-color:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}
[data-theme=dark] .ci-chip-sel select option,[data-theme=dark] .ci-field select option{background-color:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
@media (prefers-color-scheme: dark){html:not([data-theme=light]) .ci-chip-sel select,html:not([data-theme=light]) .ci-field select{color-scheme:dark}html:not([data-theme=light]) .ci-chip-sel select option,html:not([data-theme=light]) .ci-field select option{background-color:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}}
.ci-search-wide{display:flex;align-items:center;gap:10px;height:40px;padding:0 14px;border-radius:12px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2)}
.ci-search-wide:focus-within{border-color:var(--dsw-alias-brand-primary)}
.ci-search-wide svg{flex:none;color:var(--ci-muted)}
.ci-search-wide input{flex:1;min-width:0;border:0;outline:none;background:transparent;color:var(--ci-title);font:inherit}
.ci-search-wide input::placeholder{color:var(--ci-faint)}
.ci-image .ci-tabs{display:flex;gap:6px;padding:10px 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.ci-image .ci-tab{height:30px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:var(--ci-muted);font:inherit;font-size:13px;line-height:30px;font-weight:400;cursor:pointer}
.ci-image .ci-tab.on{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent);color:var(--dsw-alias-brand-primary);font-weight:600}
.ci-image-body{padding:14px 16px 16px;min-width:0;overflow-x:auto}
.ci-image-body>.ci-empty,.ci-image .ci-empty{border-top:0;padding:28px 8px}
.ci-image .ci-crumb{padding:0;border:0;margin:0 0 12px;gap:10px;min-width:0}
.ci-image .ci-back{height:28px;padding:0 10px;font-size:12px;color:var(--ci-title);flex:none}
.ci-detail-titles{min-width:0;flex:1}
.ci-detail-meta{margin:2px 0 0;font-size:12px;line-height:18px;color:var(--ci-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ci-copied{display:flex;align-items:flex-start;gap:8px;margin:0 0 12px;padding:8px 10px;border-radius:8px;background:var(--dsw-alias-state-success-tertiary);color:var(--dsw-alias-state-success-primary);font-size:12px;line-height:18px;word-break:break-all}
.ci-copied b{font-weight:600;flex:none}
.ci-copied code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;font-weight:400}
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

    // echarts 由构建期全量打包进本文件(见 scripts/bundle-client.mjs),
    // 构建产物在加载本 module 前会把 echarts UMD 挂到 window.echarts / globalThis.echarts。
    // 这里只做解析与缓存,不做任何运行时网络加载。
    const echartsGlobal = () => {
      if (typeof window !== "undefined" && window.echarts && typeof window.echarts.init === "function") return window.echarts;
      if (typeof globalThis !== "undefined" && globalThis.echarts && typeof globalThis.echarts.init === "function") return globalThis.echarts;
      return null;
    };
    let echartsPromise = null;
    function loadEcharts() {
      const lib = echartsGlobal();
      if (lib) return Promise.resolve(lib);
      if (echartsPromise) return echartsPromise;
      // 兼容极端场景(echarts 段在本模块之后异步注入):轮询一个短窗口后失败兜底
      echartsPromise = new Promise((resolve, reject) => {
        let waited = 0;
        const tick = () => {
          const found = echartsGlobal();
          if (found) {
            echartsPromise = Promise.resolve(found);
            resolve(found);
            return;
          }
          waited += 50;
          if (waited >= 3000) {
            const err = new Error("echarts 未打包进构建产物");
            echartsPromise = null;
            reject(err);
            return;
          }
          setTimeout(tick, 50);
        };
        tick();
      });
      return echartsPromise;
    }

    function fmtMonitorTime(ts, range) {
      const d = new Date(Number(ts) * 1000);
      if (!Number.isFinite(d.getTime())) return "";
      const p = (n) => String(n).padStart(2, "0");
      const hm = `${p(d.getHours())}:${p(d.getMinutes())}`;
      if (range === "24h") return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${hm}`;
      return hm;
    }

    function fmtMonitorValue(value, unit) {
      if (value == null || !Number.isFinite(Number(value))) return "-";
      const n = Number(value);
      const abs = Math.abs(n);
      const text = abs >= 1000 ? String(Math.round(n * 10) / 10) : String(Math.round(n * 100) / 100);
      return unit ? `${text} ${unit}` : text;
    }

    function MonitorChart({ title, unit, series, color, height, range }) {
      const box = useRef(null);
      const chartRef = useRef(null);
      const [failed, setFailed] = useState(false);
      const points = (series && Array.isArray(series.timestamps) ? series.timestamps : [])
        .map((ts, i) => [Number(ts) * 1000, series.values ? series.values[i] : null])
        .filter((row) => Number.isFinite(row[0]));
      const latest = series && Array.isArray(series.values)
        ? [...series.values].reverse().find((v) => v != null && Number.isFinite(Number(v)))
        : null;
      useEffect(() => {
        let dead = false;
        let chart = chartRef.current;
        if (!box.current) return;
        if (!points.length) {
          if (chart) { chart.dispose(); chartRef.current = null; }
          return;
        }
        loadEcharts().then((lib) => {
          if (dead || !box.current) return;
          chart = chartRef.current;
          if (!chart) {
            chart = lib.init(box.current);
            chartRef.current = chart;
          }
          chart.setOption({
            animation: false,
            grid: { left: 8, right: 10, top: 12, bottom: 4, containLabel: true },
            tooltip: {
              trigger: "axis",
              valueFormatter: (v) => fmtMonitorValue(v, unit),
            },
            xAxis: {
              type: "time",
              axisLabel: {
                fontSize: 10,
                hideOverlap: true,
                formatter: (ms) => fmtMonitorTime(ms / 1000, range),
              },
              axisLine: { lineStyle: { color: "rgba(128,128,128,.35)" } },
            },
            yAxis: {
              type: "value",
              scale: true,
              splitLine: { lineStyle: { color: "rgba(128,128,128,.18)" } },
              axisLabel: { fontSize: 10, formatter: (v) => fmtMonitorValue(v, "") },
            },
            series: [{
              type: "line",
              name: title,
              showSymbol: false,
              smooth: true,
              connectNulls: true,
              lineStyle: { width: 1.6, color },
              itemStyle: { color },
              areaStyle: { opacity: 0.08, color },
              data: points,
            }],
          }, { notMerge: true });
        }).catch(() => { if (!dead) setFailed(true); });
        const onResize = () => { try { chartRef.current && chartRef.current.resize(); } catch { /* keep */ } };
        window.addEventListener("resize", onResize);
        return () => {
          dead = true;
          window.removeEventListener("resize", onResize);
        };
      }, [title, unit, color, range, points.length, points.length ? points[0][0] : 0, points.length ? points[points.length - 1][0] : 0]);
      useEffect(() => () => {
        if (chartRef.current) { try { chartRef.current.dispose(); } catch { /* keep */ } chartRef.current = null; }
      }, []);
      return h("div", { className: "ci-monitor-chart" },
        h("div", { className: "ci-monitor-chart-h" },
          h("span", { className: "ci-monitor-chart-t", title }, title),
          h("span", { className: "ci-monitor-chart-v" },
            latest != null ? fmtMonitorValue(latest, "") : "-",
            unit ? h("i", null, unit) : null,
          ),
        ),
        failed
          ? h("div", { className: "ci-monitor-empty" }, "图表组件加载失败")
          : !points.length
            ? h("div", { className: "ci-monitor-empty" }, "暂无监控数据")
            : h("div", { className: "ci-monitor-chart-box", ref: box, style: height ? { height } : undefined }),
      );
    }

    const MONITOR_RANGES = [
      { id: "1h", label: "1小时" },
      { id: "6h", label: "6小时" },
      { id: "24h", label: "24小时" },
    ];

    // 后端 series[].key 与 MetricDef.key 对齐(经 fetchMonitorSeries 回填),
    // 这里以 key 为主键挂载,同时按 metricName 反查兼容旧结构,保证 MonitorPanel 取 map[m.key] 一定能命中。
    function buildMonitorSeriesMap(metrics, series) {
      const map = {};
      const defs = Array.isArray(metrics) ? metrics : [];
      const rows = Array.isArray(series) ? series : [];
      for (const row of rows) {
        if (!row) continue;
        if (row.key) {
          map[String(row.key)] = row;
          continue;
        }
        const def = defs.find((m) => m && (m.metricName === row.metric || m.key === row.metric));
        if (def) map[String(def.key)] = row;
        else if (row.metric) map[String(row.metric)] = row;
      }
      return map;
    }

    function MonitorPanel({ metrics, seriesMap, range, onRangeChange, note }) {
      const cur = MONITOR_RANGES.some((row) => row.id === range) ? range : "1h";
      const list = Array.isArray(metrics) ? metrics : [];
      const map = seriesMap && typeof seriesMap === "object" ? seriesMap : {};
      const empty = !list.length || list.every((m) => {
        const s = map[m.key];
        return !s || !Array.isArray(s.timestamps) || !s.timestamps.length;
      });
      return h("div", { className: "ci-monitor" },
        h("div", { className: "ci-monitor-bar" },
          h("span", { className: "ci-monitor-title" }, "实例监控"),
          h("span", { className: "ci-monitor-ranges" }, MONITOR_RANGES.map((row) =>
            h("button", {
              key: row.id,
              type: "button",
              className: "ci-monitor-range" + (row.id === cur ? " active" : ""),
              onClick: () => { if (row.id !== cur && onRangeChange) onRangeChange(row.id); },
            }, row.label),
          )),
        ),
        note ? h("div", { className: "ci-monitor-note" }, note) : null,
        !note && empty ? h("div", { className: "ci-monitor-note" }, "暂无监控数据") : null,
        !note && !empty ? h("div", { className: "ci-monitor-grid" }, list.map((m) =>
          h(MonitorChart, {
            key: m.key,
            title: m.label || m.key,
            unit: m.unit || "",
            color: m.color || "#3a7bff",
            range: cur,
            series: map[m.key] || { timestamps: [], values: [] },
          }),
        )) : null,
      );
    }


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

    function isQueryPayload(node) {
      return isCloudInfraPayload(node);
    }

    function isCloudInfraPayload(node) {
      if (!node || typeof node !== "object" || Array.isArray(node)) return false;
      if (node.kind === "cls" || node.resourceKind === "cls" || Array.isArray(node.logs)) return true;
      if (!Array.isArray(node.items)) return false;
      if (node.kind === "cloud-infra-query" || node.kind === "image" || node.resourceKind === "image") return true;
      if (node.resourceKind === "cert" || node.resourceKind === "domain" || node.resourceKind === "auto" || node.resourceKind === "cls") return true;
      if (node.items[0] && node.items[0].moduleId) return true;
      if (Array.isArray(node.errors) && node.errors.length) return true;
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

    function ChevronLeft() {
      return h("svg", {
        width: 16,
        height: 16,
        viewBox: "0 0 16 16",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        "aria-hidden": "true",
      },
        h("path", {
          d: "M10 3.25 5.25 8 10 12.75",
          stroke: "currentColor",
          strokeWidth: "1.5",
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }),
      );
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

    function SearchField({ value, onChange, onSubmit, placeholder }) {
      return h("div", { className: "ci-search-wrap" },
        h(SearchIcon),
        h("input", {
          className: "ci-search",
          type: "search",
          placeholder: placeholder || "搜索 ID / 名称 / IP",
          value: value || "",
          onChange: (e) => onChange && onChange(e.target.value),
          onKeyDown: (e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            onSubmit && onSubmit(e.target.value);
          },
        }),
        value ? h("button", {
          type: "button",
          className: "ci-search-x",
          onClick: () => {
            onChange && onChange("");
            onSubmit && onSubmit("");
          },
          "aria-label": "清空",
        }, "×") : null,
      );
    }

    function ListPane({ busy, children }) {
      return h("div", { className: "ci-list-body" },
        busy
          ? h("div", { className: "ci-load", "aria-live": "polite" }, h(Spin), "加载列表…")
          : children,
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

    function StatusCell({ status, label }) {
      if (!status && !label) return h("span", null, "-");
      return h("span", { className: "ci-status" },
        h("span", { className: "ci-dot " + (status || "") }),
        label || statusText(status),
      );
    }

    function isInstanceKind(kind) {
      return kind === "cvm" || kind === "lighthouse";
    }

    function defaultRegionName(names) {
      const list = (Array.isArray(names) ? names : []).filter(Boolean);
      return list.find((name) => /广州/.test(name) || name === "ap-guangzhou") || list[0] || "华南地区（广州）";
    }

    function RegionSelect({ regions, value, onChange }) {
      const names = Array.from(new Set((Array.isArray(regions) ? regions : []).filter(Boolean)));
      const current = value || defaultRegionName(names);
      return h("select", {
        className: "ci-select",
        value: current,
        onChange: (e) => onChange && onChange(e.target.value),
      },
        h("option", { value: "all" }, "全部地域"),
        names.map((name) => h("option", { key: name, value: name }, name)),
      );
    }

    function KindTabs({ showCvm, showLh, value, onChange }) {
      if (!(showCvm && showLh)) return null;
      return h("div", { className: "ci-tabs" },
        h("button", {
          type: "button",
          className: "ci-tab" + (value === "cvm" ? " on" : ""),
          onClick: () => onChange && onChange("cvm"),
        }, "云服务器"),
        h("button", {
          type: "button",
          className: "ci-tab" + (value === "lighthouse" ? " on" : ""),
          onClick: () => onChange && onChange("lighthouse"),
        }, "轻量应用服务器"),
      );
    }

    function instancePower(item) {
      const label = String((item && item.stateLabel) || "");
      const running = label === "运行中" || (!label && item && item.status === "enable");
      const stopped = label === "已关机" || (!label && item && item.status === "pause");
      return {
        start: !stopped,
        stop: !running,
        reboot: !running,
      };
    }

    function groupByRegion(items) {
      const groups = [];
      const index = new Map();
      for (const item of Array.isArray(items) ? items : []) {
        const key = item.regionName || item.region || "其他地域";
        if (!index.has(key)) {
          index.set(key, groups.length);
          groups.push({ region: key, items: [] });
        }
        groups[index.get(key)].items.push(item);
      }
      return groups;
    }

    function matchLocalInstance(item, q) {
      const needle = String(q || "").trim().toLowerCase();
      if (!needle) return true;
      const cols = Array.isArray(item.columns) ? item.columns.map((col) => col && col.value) : [];
      return [item.title, item.instanceId, item.id, item.privateIp, item.publicIp].concat(cols)
        .some((value) => String(value || "").toLowerCase().includes(needle));
    }

    function usableInstanceQuery(q) {
      const text = String(q || "").trim();
      if (!text) return "";
      if (/\s/.test(text) && /[\u4e00-\u9fff]/.test(text)) return "";
      return text;
    }

    function actionLabel(id) {
      if (id === "instance.start") return "开机";
      if (id === "instance.stop") return "关机";
      if (id === "instance.reboot") return "重启";
      return id;
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
      const template = "minmax(110px,1.1fr) minmax(140px,1.3fr) minmax(72px,0.8fr) minmax(110px,1fr) minmax(88px,0.9fr) minmax(130px,1fr) 128px";
      const head = ["证书 ID", "绑定域名", "备注", "类型/品牌", "状态", "有效期", "操作"];
      return h("div", { className: "ci-list ci-cert-list" },
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
          h("button", { type: "button", className: "ci-back", onClick: onBack, title: "返回", "aria-label": "返回" }, h(ChevronLeft)),
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
      { id: "ap-beijing", label: "北京", aliases: ["bj", "beijing", "pek"] },
      { id: "ap-beijing-fsi", label: "北京金融", aliases: ["beijing-fsi"] },
      { id: "ap-nanjing", label: "南京", aliases: ["nj", "nanjing"] },
      { id: "ap-shanghai", label: "上海", aliases: ["sh", "shanghai"] },
      { id: "ap-shanghai-fsi", label: "上海金融", aliases: ["shanghai-fsi"] },
      { id: "ap-guangzhou", label: "广州", aliases: ["gz", "guangzhou", "canton"] },
      { id: "ap-shenzhen-fsi", label: "深圳金融", aliases: ["sz-fsi", "shenzhen-fsi"] },
      { id: "ap-chengdu", label: "成都", aliases: ["cd", "chengdu"] },
      { id: "ap-chongqing", label: "重庆", aliases: ["cq", "chongqing"] },
      { id: "ap-hongkong", label: "中国香港", aliases: ["hk", "hongkong", "hong kong", "香港"] },
      { id: "ap-singapore", label: "新加坡", aliases: ["sg", "singapore"] },
      { id: "ap-mumbai", label: "孟买", aliases: ["in", "mumbai", "india"] },
      { id: "ap-jakarta", label: "雅加达", aliases: ["id", "jakarta"] },
      { id: "ap-seoul", label: "首尔", aliases: ["kr", "seoul"] },
      { id: "ap-bangkok", label: "曼谷", aliases: ["th", "bangkok"] },
      { id: "ap-tokyo", label: "东京", aliases: ["jp", "tokyo"] },
      { id: "na-siliconvalley", label: "硅谷", aliases: ["usw", "siliconvalley", "silicon valley"] },
      { id: "na-ashburn", label: "弗吉尼亚", aliases: ["use", "ashburn", "virginia"] },
      { id: "na-toronto", label: "多伦多", aliases: ["ca", "toronto"] },
      { id: "sa-saopaulo", label: "圣保罗", aliases: ["br", "saopaulo", "sao paulo"] },
      { id: "eu-frankfurt", label: "法兰克福", aliases: ["de", "frankfurt"] },
    ];

    function normRegion(value) {
      return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
    }

    function regionTokens(region) {
      const id = normRegion(region.id);
      const compact = id.replace(/-/g, "");
      const withoutAp = id.replace(/^ap-/, "");
      return [id, compact, withoutAp, withoutAp.replace(/-/g, ""), normRegion(region.label)]
        .concat((region.aliases || []).map(normRegion))
        .filter(Boolean);
    }

    function isPresignStat(stat) {
      return !!(stat && (stat.copied === true || (stat.copied === false && stat.expiresSec)));
    }

    function detailStatRows(stat) {
      if (!stat || isPresignStat(stat)) return [];
      return [
        ["名称", stat.name],
        ["大小", stat.sizeLabel],
        ["存储类型", stat.storageClass],
        ["修改时间", stat.lastModified],
        ["对象地址", stat.address],
      ];
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

    const DEFAULT_COS_REGION_ID = "ap-guangzhou";

    function defaultCosRegion(regions) {
      return (regions || []).find((region) => region.id === DEFAULT_COS_REGION_ID) || null;
    }

    function formatFileTime(raw) {
      if (!raw) return "-";
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return String(raw).replace("T", " ").replace(/Z$/, "");
      const pad = (n) => String(n).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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
      const comboNeedle = selected && input === displayRegion(selected) ? "" : input;
      const items = (regions || []).filter((region) => matchCosRegion(region, comboNeedle));
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
            onFocus: (e) => {
              const idx = selected ? items.findIndex((region) => region.id === selected.id) : 0;
              onHighlight(Math.max(0, idx));
              onOpen(true);
              if (e.target && e.target.select) e.target.select();
            },
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
          h("td", null, row.kind === "folder" ? "-" : formatFileTime(row.lastModified)),
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
      const [input, setInput] = useState(() => displayRegion(defaultCosRegion(COS_REGION_FALLBACK)));
      const [selected, setSelected] = useState(() => defaultCosRegion(COS_REGION_FALLBACK));
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
      const fileSeq = useRef(0);
      const searchTimer = useRef(0);
      useEffect(() => {
        api("meta", {}).then((d) => {
          const mods = Array.isArray(d.modules) ? d.modules : [];
          const cos = mods.find((m) => m && m.kind === "cos" && Array.isArray(m.regions) && m.regions.length);
          if (cos) setRegions(cos.regions);
          if (onSkipConfirm) onSkipConfirm(!!d.skipConfirm);
        }).catch(() => {});
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
      }, []);
      const seedSig = `${payload?.kind || ""}|${args.region || ""}|${(payload?.items || []).map((i) => i.id).join(",")}`;
      const payloadErrSig = (Array.isArray(payload?.errors) ? payload.errors : []).map((e) => e && e.message).join("；");
      const booted = useRef(false);
      useEffect(() => {
        setSelected((cur) => {
          if (!cur) return cur;
          return (regions || []).find((region) => region.id === cur.id) || cur;
        });
      }, [regions]);
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
      useEffect(() => {
        if (payloadErrSig) setListErr(payloadErrSig);
      }, [payloadErrSig]);
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
          const errs = Array.isArray(result.errors) ? result.errors.map((e) => e && e.message).filter(Boolean) : [];
          if (errs.length) {
            setListErr(errs.join("；"));
            setRows(result.items || []);
            setTotal(Number(result.total) || (result.items || []).length);
            setHasMore(false);
            setOffset(Number(result.offset) || nextOffset);
            setActiveQ(q || "");
            return;
          }
          setRows(result.items || []);
          setTotal(Number(result.total) || (result.items || []).length);
          setHasMore(!!result.hasMore);
          setOffset(Number(result.offset) || nextOffset);
          setActiveQ(q || "");
        } catch (e) {
          if (n !== seq.current) return;
          setListErr(publicErrorMessage(e));
          setRows([]);
        } finally {
          if (n === seq.current) setListBusy(false);
        }
      };
      useEffect(() => {
        if (booted.current) return;
        if (resolveCosRegion(args.region, regions)) return;
        if (!selected) return;
        booted.current = true;
        fetchBuckets(selected, 0, "");
      }, [selected, regions]);
      const pickRegion = (region) => {
        fileSeq.current += 1;
        setSelected(region);
        setInput(displayRegion(region));
        setOpen(false);
        setSession(null);
        fetchBuckets(region, 0, "");
      };
      const onRegionInput = (value) => {
        fileSeq.current += 1;
        setInput(value);
        setSelected(null);
        setRows([]);
        setTotal(0);
        setSession(null);
        setOpen(true);
        setHighlight(0);
      };
      const loadFiles = async (item, prefix, opts) => {
        const n = ++fileSeq.current;
        const marker = opts && opts.marker ? String(opts.marker) : "";
        const page = Math.max(1, Number(opts && opts.page) || 1);
        const markers = Array.isArray(opts && opts.markers) && opts.markers.length ? opts.markers : [""];
        setPendingId(item.id);
        setSession((cur) => {
          const sameDir = cur && cur.item?.id === item.id && (cur.prefix || "") === (prefix || "");
          return {
            item,
            prefix,
            marker,
            page,
            markers,
            loading: true,
            detail: sameDir ? cur.detail : null,
            entries: sameDir ? (cur.entries || []) : [],
            hasMore: sameDir ? cur.hasMore : false,
            nextMarker: sameDir ? (cur.nextMarker || "") : "",
          };
        });
        try {
          const detail = await api("detail", {
            moduleId: item.moduleId,
            id: item.id,
            title: item.title,
            bucket: item.title,
            region: selected?.id || args.region,
            prefix: prefix || "",
            marker,
          });
          if (n !== fileSeq.current) return;
          setSession({
            item,
            prefix: detail.prefix || prefix || "",
            marker,
            page,
            markers,
            loading: false,
            detail,
            entries: detail.entries || [],
            hasMore: !!detail.hasMore,
            nextMarker: detail.nextMarker || "",
          });
        } catch (e) {
          if (n !== fileSeq.current) return;
          setSession({ item, prefix: prefix || "", page, markers, loading: false, detail: null, error: publicErrorMessage(e), entries: [], hasMore: false, nextMarker: "" });
        } finally {
          if (n === fileSeq.current) setPendingId("");
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
          if (action.id === "object.stat") setStat({ ...(result.data || {}), kind: "stat" });
          else if (action.id === "object.presign" || action.id === "object.download") {
            const url = result.data && result.data.url;
            if (action.id === "object.download" && url && typeof window !== "undefined") window.open(url, "_blank", "noopener");
            if (action.id === "object.presign" && url) {
              let copied = false;
              try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  await navigator.clipboard.writeText(url);
                  copied = true;
                }
              } catch { copied = false; }
              setStat(copied
                ? { kind: "presign", copied: true, expiresSec: result.data.expiresSec }
                : { kind: "presign", url, expiresSec: result.data?.expiresSec, copied: false });
            }
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
      const fileEntries = (session?.entries || session?.detail?.entries || []).filter((row) => {
        const q = String(draftQ || "").trim().toLowerCase();
        if (session && q) return String(row.name || "").toLowerCase().includes(q);
        return true;
      });
      const crumbs = prefixCrumbs(session?.prefix || session?.detail?.prefix || "");
      const showFiles = !!(session && (session.detail || (session.entries || []).length) && (!session.loading || (session.entries || []).length));
      return [
        session ? h("div", { key: "crumb", className: "ci-crumb" },
          h("button", { type: "button", className: "ci-back", onClick: () => { setSession(null); setDraftQ(""); setErr(""); } }, "返回"),
          h("span", { className: "ci-head-t" }, session.item.title),
        ) : null,
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
          session ? null : h(CosRegionCombo, {
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
                const value = e.target.value;
                setDraftQ(value);
                if (!session && selected) {
                  if (searchTimer.current) clearTimeout(searchTimer.current);
                  searchTimer.current = setTimeout(() => fetchBuckets(selected, 0, value), 300);
                }
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
        listErr ? h("div", { key: "lerr", className: "ci-err", id: "ci-cos-cred-err" }, listErr) : null,
        !session && !selected && !listErr ? h("div", { key: "need-region", className: "ci-empty" }, "请输入并选择地域，再查看该地域下的存储桶。") : null,
        !session && selected && listBusy ? h("div", { key: "load", className: "ci-load" }, h(Spin), "加载列表…") : null,
        !session && selected && !listBusy && !(listErr && !rows.length) ? h(CosBucketTable, {
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
        !session && selected && !(listErr && !rows.length) ? h(Pager, {
          key: "pager",
          total: counted,
          page,
          pages: pageCount,
          busy: listBusy,
          onPage: (next) => fetchBuckets(selected, (next - 1) * pageSize, activeQ),
        }) : null,
        session && session.loading && !(session.entries || []).length ? h("div", { key: "fload", className: "ci-load" }, h(Spin), "加载文件列表…") : null,
        session && session.error && !session.detail ? h("div", { key: "ferr", className: "ci-err" }, session.error) : null,
        session && draftQ && session.hasMore ? h("p", { key: "search-hint", className: "ci-hint" }, "仅搜索当前页的文件，可先翻到其它页") : null,
        showFiles ? h(CosFileTable, {
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
        showFiles && (session.hasMore || (session.page || 1) > 1) ? h("div", { key: "file-more", className: "ci-footbar", id: "ci-cos-file-pager" },
          h("div", { className: "ci-page" },
            h("div", { className: "ci-page-btns" },
              h("button", {
                id: "ci-cos-file-prev",
                type: "button",
                className: "ci-page-btn",
                disabled: !!session.loading || busy || (session.page || 1) <= 1,
                onClick: () => {
                  const page = Math.max(1, (session.page || 1) - 1);
                  const markers = (session.markers || [""]).slice(0, page);
                  loadFiles(session.item, session.prefix || "", { marker: markers[page - 1] || "", page, markers });
                },
              }, "上一页"),
              session.hasMore && !session.nextMarker
                ? h("span", { className: "ci-hint" }, "列表已截断，但未返回下一页标记")
                : h("button", {
                  id: "ci-cos-file-next",
                  type: "button",
                  className: "ci-page-btn",
                  disabled: !!session.loading || busy || !session.hasMore || !session.nextMarker,
                  onClick: () => {
                    const page = (session.page || 1) + 1;
                    const markers = [...(session.markers || [""]).slice(0, session.page || 1), session.nextMarker];
                    loadFiles(session.item, session.prefix || "", { marker: session.nextMarker, page, markers });
                  },
                }, "下一页"),
            ),
          ),
        ) : null,
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
          h("h3", null, isPresignStat(stat) ? "临时链接" : "详情"),
          stat.copied === true ? h("p", null, `已复制到剪贴板，约 ${Math.round((stat.expiresSec || 900) / 60)} 分钟有效。`) : null,
          stat.copied === false && stat.expiresSec ? [
            h("p", { key: "hint" }, "剪贴板不可用，请手动复制。约 15 分钟有效。"),
            h("input", {
              key: "url",
              id: "ci-cos-presign-url",
              className: "ci-search",
              readOnly: true,
              value: stat.url,
              onFocus: (e) => e.target.select(),
            }),
            h("button", {
              key: "copy",
              type: "button",
              className: "ci-mini",
              onClick: async () => {
                try {
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(stat.url);
                    setStat({ kind: "presign", copied: true, expiresSec: stat.expiresSec });
                  }
                } catch { /* keep input visible */ }
              },
            }, "复制"),
          ] : null,
          !isPresignStat(stat) ? detailStatRows(stat).map(([label, value]) => h("p", { key: label }, `${label}：${value || "-"}`)) : null,
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

    const CDB_OFFICIAL_TABS = ["实例详情","实例监控","账号管理","数据库管理","安全组","备份恢复","日志中心","只读实例","数据库代理","数据安全","连接检查"];
    const CDB_TAB_GROUPS = [
      { label: "实例", tabs: ["实例详情", "实例监控", "连接检查"] },
      { label: "访问", tabs: ["账号管理", "数据库管理"] },
      { label: "安全", tabs: ["安全组", "数据安全"] },
      { label: "运维", tabs: ["备份恢复", "日志中心", "只读实例", "数据库代理"] },
    ];
    function cdbTabGroup(name) {
      return CDB_TAB_GROUPS.find((g) => g.tabs.includes(name)) || CDB_TAB_GROUPS[0];
    }
    const CDB_REGIONS = [
      { id: "ap-guangzhou", name: "广州" },
      { id: "ap-shanghai", name: "上海" },
      { id: "ap-nanjing", name: "南京" },
      { id: "ap-beijing", name: "北京" },
      { id: "ap-chengdu", name: "成都" },
      { id: "ap-chongqing", name: "重庆" },
      { id: "ap-hongkong", name: "香港" },
      { id: "ap-singapore", name: "新加坡" },
      { id: "ap-jakarta", name: "雅加达" },
      { id: "ap-seoul", name: "首尔" },
      { id: "ap-tokyo", name: "东京" },
      { id: "ap-bangkok", name: "曼谷" },
      { id: "ap-mumbai", name: "孟买" },
      { id: "na-siliconvalley", name: "硅谷" },
      { id: "na-ashburn", name: "弗吉尼亚" },
      { id: "sa-saopaulo", name: "圣保罗" },
      { id: "eu-frankfurt", name: "法兰克福" },
    ];

    function regionName(id) {
      return (CDB_REGIONS.find((row) => row.id === id) || {}).name || id || "";
    }

    function cdbMeta(item) {
      return (item && item.meta) || {};
    }

    function isWriteSql(sql) {
      const stripped = String(sql || "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\n]*/g, "").trim();
      return /^(insert|update|delete|replace|drop|alter|create|truncate|grant|revoke|rename|load|call|lock|unlock|set\s+global|set\s+persist)\b/i.test(stripped);
    }

    function isDestructiveSql(sql) {
      const stripped = String(sql || "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\n]*/g, "").trim();
      return /^(drop|truncate|delete|alter)\b/i.test(stripped);
    }

    function pickDmcEndpoint(meta) {
      const row = meta || {};
      const wanOpen = String(row.wanStatus) === "2";
      if (wanOpen && row.wanDomain) {
        return { host: row.wanDomain, port: Number(row.wanPort) || 3306, wanOpen: true, viaWan: true };
      }
      return { host: row.vip || "", port: Number(row.port) || 3306, wanOpen: false, viaWan: false };
    }

    function destroyProtectOn(item) {
      return String(cdbMeta(item).destroyProtect || "").toLowerCase() === "on";
    }

    function CdbTable({ items, pendingId, selected, onToggle, onLogin, onManage, onMore, moreId, moreMenus }) {
      const rows = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!rows.length) return h("div", { className: "ci-empty" }, "没有实例");
      const cols = ["实例 ID / 名称", "运行状态", "可用区", "数据库版本", "配置", "内网地址", "计费模式", "操作"];
      return h("div", { className: "ci-table-wrap" }, h("table", { className: "ci-table" },
        h("thead", null, h("tr", null,
          h("th", null, ""),
          cols.map((label) => h("th", { key: label }, label)),
        )),
        h("tbody", null, rows.map((item) => h("tr", { key: item.id },
          h("td", null, h("input", {
            className: "ci-check",
            type: "checkbox",
            checked: !!(selected && selected[item.id]),
            onChange: () => onToggle(item),
          })),
          h("td", null, h("div", { className: "ci-idcell" },
            h("button", { type: "button", className: "ci-name", onClick: () => onManage(item) }, item.title),
            h("span", { className: "ci-sub" }, item.description || ""),
          )),
          h("td", null, h("span", { className: "ci-status" },
            h("span", { className: "ci-dot " + (item.status || "unknown") }),
            cellValue(item, "运行状态") || "-",
          )),
          h("td", null, cellValue(item, "可用区") || "-"),
          h("td", null, cellValue(item, "数据库版本") || "-"),
          h("td", null, cellValue(item, "配置") || "-"),
          h("td", null, cellValue(item, "内网地址") || "-"),
          h("td", null, cellValue(item, "计费模式") || "-"),
          h("td", { className: "ci-ops-cell" }, h("div", { className: "ci-ops" },
            h("button", { type: "button", className: "ci-link", disabled: pendingId === item.id, onClick: () => onLogin(item) }, "登录"),
            h("button", { type: "button", className: "ci-link", disabled: pendingId === item.id, onClick: () => onManage(item) }, pendingId === item.id ? [h(Spin), "加载中"] : "管理"),
            h("span", { className: "ci-drop" },
              h("button", { type: "button", className: "ci-link", onClick: () => onMore(item) }, "更多"),
              moreId === item.id ? h("div", { className: "ci-drop-menu" }, (moreMenus || []).map((row) => h("button", {
                key: row.id,
                type: "button",
                className: "ci-drop-item" + (row.danger ? " ci-link danger" : ""),
                onClick: () => row.onClick(item),
              }, typeof row.label === "function" ? row.label(item) : row.label))) : null,
            ),
          )),
        ))),
      ));
    }

    function GenericForm({ title, fields, initial, busy, err, onCancel, onSubmit }) {
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
          h("h3", null, title),
          fields.map((field) => h("div", { className: "ci-field", key: field.key },
            h("label", null, field.label),
            h("input", {
              type: field.secret ? "password" : "text",
              placeholder: field.placeholder || "",
              value: draft[field.key] || "",
              disabled: busy,
              autoComplete: "off",
              onChange: (e) => setDraft({ ...draft, [field.key]: e.target.value }),
            }),
          )),
          err ? h("p", { className: "ci-err", style: { margin: "0 0 8px" } }, err) : null,
          h("div", { className: "ci-modal-actions" },
            h("button", { type: "button", className: "ci-mini", disabled: busy, onClick: onCancel }, "取消"),
            h("button", { type: "button", className: "ci-mini primary", disabled: busy, onClick: () => onSubmit(draft) }, busy ? "提交中" : "确定"),
          ),
        ),
      );
      return createPortal(node, document.body);
    }

    function NoticeDialog({ open, title, text, onClose }) {
      if (!open) return null;
      return h(ConfirmDialog, {
        open: true,
        title: title || "说明",
        text,
        busy: false,
        onCancel: onClose,
        onConfirm: onClose,
      });
    }

    function CdbManageView({ item, detail, loading, error, skipConfirm, tab, onTab, onBack, onReload, onSkipConfirm, onLogin }) {
      const [form, setForm] = useState(null);
      const [confirm, setConfirm] = useState(null);
      const [busy, setBusy] = useState(false);
      const [err, setErr] = useState("");
      const extra = detail?.extra || {};
      const tabData = extra.tabData || {};
      const run = async (action, payload) => {
        setBusy(true);
        setErr("");
        try {
          const result = await api("action", {
            moduleId: item.moduleId,
            id: item.id,
            action: action.id,
            payload: {
              region: cdbMeta(item).region || extra.region,
              instanceId: extra.instanceId || item.title,
              ...payload,
            },
          });
          setForm(null);
          setConfirm(null);
          if (action.id === "dmc.login") return result;
          await onReload(tab);
          return result;
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
        } catch { /* keep */ }
        const must = action.confirm === "always" || (action.confirm === "default" && !skip);
        if (!must) return run(action, payload);
        setConfirm({ action, payload, text, danger: action.confirm === "always" });
      };
      const region = cdbMeta(item).region || extra.region || "";
      const group = cdbTabGroup(tab);
      const body = !detail ? null : (() => {
        if (tab === "实例详情") {
          return [
            h("div", { key: "kv", className: "ci-kv" }, (detail.fields || []).map((row) => [
              h("div", { key: row.label + "k", className: "ci-k" }, row.label),
              h("div", { key: row.label + "v" },
                row.value,
                row.label === "实例名称" ? h("button", { type: "button", className: "ci-link", style: { marginLeft: 8 }, onClick: () => setForm({
                  title: "修改实例名称",
                  fields: [{ key: "instanceName", label: "实例名称" }],
                  initial: { instanceName: cdbMeta(item).instanceName || item.description || "" },
                  action: { id: "instance.rename", label: "修改实例名称", confirm: "default" },
                }) }, "修改") : null,
                row.label === "内网地址" ? h("button", { type: "button", className: "ci-link", style: { marginLeft: 8 }, onClick: () => setForm({
                  title: "修改端口",
                  fields: [{ key: "port", label: "端口", placeholder: "3306" }],
                  initial: { port: cdbMeta(item).port || "3306" },
                  action: { id: "instance.port", label: "修改端口", confirm: "default" },
                }) }, "修改端口") : null,
                row.label === "外网地址" ? h("button", {
                  type: "button",
                  className: "ci-link",
                  style: { marginLeft: 8 },
                  onClick: () => request(
                    { id: extra.wanOpen ? "instance.closeWan" : "instance.openWan", label: extra.wanOpen ? "关闭外网连接地址" : "开启外网连接地址", confirm: "default" },
                    {},
                    extra.wanOpen ? "确认关闭外网连接地址？" : "确认开启外网连接地址？",
                  ),
                }, extra.wanOpen ? "关闭外网连接地址" : "开启外网连接地址") : null,
              ),
            ])),
          ];
        }
        if (tab === "实例监控") {
          const seriesMap = buildMonitorSeriesMap(tabData.metrics, tabData.series);
          return h(MonitorPanel, {
            metrics: Array.isArray(tabData.metrics) ? tabData.metrics : [],
            seriesMap,
            range: tabData.range || "1h",
            note: tabData.note || (extra.tabError && !tabData.series ? "无法拉取监控数据，请检查 CAM 云监控权限" : ""),
            onRangeChange: (range) => onReload("实例监控", { range }),
          });
        }
        if (tab === "账号管理") {
          const accounts = tabData.accounts || [];
          return [
            h("div", { key: "sec", className: "ci-sec" },
              h("span", { className: "ci-sec-t" }, "账号管理"),
              h("button", { type: "button", className: "ci-mini primary", onClick: () => setForm({
                title: "创建账号",
                fields: [{ key: "user", label: "账号" }, { key: "host", label: "主机", placeholder: "%" }, { key: "password", label: "密码", secret: true }],
                initial: { host: "%" },
                action: { id: "account.create", label: "创建账号", confirm: "default" },
              }) }, "创建账号"),
            ),
            accounts.length ? h("div", { key: "tb", className: "ci-table-wrap" }, h("table", { className: "ci-table" },
              h("thead", null, h("tr", null, h("th", null, "账号"), h("th", null, "Host"), h("th", null, "操作"))),
              h("tbody", null, accounts.map((row, idx) => h("tr", { key: (row.User || "") + (row.Host || "") + idx },
                h("td", null, row.User || ""),
                h("td", null, row.Host || ""),
                h("td", { className: "ci-ops-cell" }, h("div", { className: "ci-ops" },
                  h("button", { type: "button", className: "ci-link", onClick: () => setForm({
                    title: "重置密码",
                    fields: [{ key: "password", label: "新密码", secret: true }],
                    initial: { user: row.User, host: row.Host },
                    action: { id: "account.password", label: "重置密码", confirm: "always" },
                  }) }, "重置密码"),
                  h("button", { type: "button", className: "ci-link", onClick: () => setForm({
                    title: "修改权限",
                    fields: [{ key: "privileges", label: "全局权限", placeholder: "SELECT,INSERT,UPDATE,DELETE" }],
                    initial: { user: row.User, host: row.Host },
                    action: { id: "account.privileges", label: "修改权限", confirm: "default" },
                  }) }, "修改权限"),
                  h("button", { type: "button", className: "ci-link", onClick: () => setForm({
                    title: "修改授权主机",
                    fields: [{ key: "newHost", label: "新主机" }],
                    initial: { user: row.User, host: row.Host, newHost: row.Host },
                    action: { id: "account.host", label: "修改授权主机", confirm: "default" },
                  }) }, "修改主机"),
                  h("button", { type: "button", className: "ci-link danger", onClick: () => request(
                    { id: "account.delete", label: "删除账号", confirm: "always" },
                    { user: row.User, host: row.Host },
                    `确定删除账号 ${row.User}@${row.Host}？`,
                  ) }, "删除"),
                )),
              ))),
            )) : h("div", { key: "empty", className: "ci-empty" }, "没有账号"),
          ];
        }
        if (tab === "数据库管理") {
          const dbs = tabData.databases || [];
          const params = tabData.parameters || [];
          return h("div", { className: "ci-pane" },
            tabData.readonlyHint ? h("p", { className: "ci-hint" }, tabData.readonlyHint) : null,
            h("div", { className: "ci-subtabs" },
              h("span", { className: "ci-sec-t" }, "数据库列表"),
              h("button", { type: "button", className: "ci-mini", onClick: () => onLogin(item) }, extra.dmc ? "进入 DMC 库表" : "先登录 DMC"),
            ),
            dbs.length ? h("div", { className: "ci-table-wrap" }, h("table", { className: "ci-table" },
              h("thead", null, h("tr", null, h("th", null, "数据库"), h("th", null, "字符集"), h("th", null, "操作"))),
              h("tbody", null, dbs.map((row) => h("tr", { key: row.DatabaseName || row.DbName },
                h("td", null, row.DatabaseName || row.DbName || ""),
                h("td", null, row.CharacterSet || row.CharacterSetName || "-"),
                h("td", null, h("button", { type: "button", className: "ci-link", onClick: () => onLogin(item, row.DatabaseName || row.DbName) }, extra.dmc ? "库表管理" : "请先登录")),
              ))),
            )) : h("div", { className: "ci-empty" }, extra.dmc ? "没有数据库" : "库列表需实例支持，或先登录 DMC"),
            h("div", { className: "ci-sec" }, h("span", { className: "ci-sec-t" }, "参数设置")),
            params.length ? h("div", { className: "ci-table-wrap" }, h("table", { className: "ci-table" },
              h("thead", null, h("tr", null, h("th", null, "参数"), h("th", null, "当前值"), h("th", null, "操作"))),
              h("tbody", null, params.slice(0, 80).map((row) => h("tr", { key: row.Name },
                h("td", null, row.Name || ""),
                h("td", null, row.CurrentValue != null ? String(row.CurrentValue) : "-"),
                h("td", null, h("button", { type: "button", className: "ci-link", onClick: () => setForm({
                  title: "修改参数",
                  fields: [{ key: "value", label: row.Name || "参数值" }],
                  initial: { name: row.Name, value: row.CurrentValue != null ? String(row.CurrentValue) : "" },
                  action: { id: "param.modify", label: "修改参数", confirm: "default" },
                }) }, "修改")),
              ))),
            )) : h("div", { className: "ci-empty" }, "没有可展示的参数"),
          );
        }
        if (tab === "安全组") {
          const groups = tabData.groups || [];
          return h("div", { className: "ci-pane" },
            h("div", { className: "ci-sec" }, h("span", { className: "ci-sec-t" }, "安全组")),
            groups.length ? h("div", { className: "ci-table-wrap" }, h("table", { className: "ci-table" },
              h("thead", null, h("tr", null, h("th", null, "安全组 ID"), h("th", null, "名称"))),
              h("tbody", null, groups.map((row) => h("tr", { key: row.SecurityGroupId },
                h("td", null, row.SecurityGroupId || ""),
                h("td", null, row.SecurityGroupName || ""),
              ))),
            )) : h("div", { className: "ci-empty" }, "未绑定安全组"),
          );
        }
        if (tab === "备份恢复") {
          const backups = tabData.backups || [];
          return h("div", { className: "ci-pane" },
            h("div", { className: "ci-sec" },
              h("span", { className: "ci-sec-t" }, "备份恢复"),
              h("button", { type: "button", className: "ci-mini primary", onClick: () => request({ id: "backup.create", label: "手动备份", confirm: "default" }, {}, "确认发起手动备份？") }, "手动备份"),
            ),
            backups.length ? h("div", { className: "ci-table-wrap" }, h("table", { className: "ci-table" },
              h("thead", null, h("tr", null, h("th", null, "备份 ID"), h("th", null, "类型"), h("th", null, "时间"), h("th", null, "操作"))),
              h("tbody", null, backups.map((row) => h("tr", { key: row.BackupId },
                h("td", null, String(row.BackupId ?? "")),
                h("td", null, row.Way || row.Type || ""),
                h("td", null, row.Date || row.StartTime || ""),
                h("td", null, /manual|手动/i.test(String(row.Way || row.Type || "")) ? h("button", {
                  type: "button",
                  className: "ci-link danger",
                  onClick: () => request({ id: "backup.delete", label: "删除手动备份", confirm: "always" }, { backupId: row.BackupId }, "确定删除该手动备份？"),
                }, "删除") : "-"),
              ))),
            )) : h("div", { className: "ci-empty" }, "没有备份"),
          );
        }
        if (tab === "日志中心") {
          const slow = tabData.slowLogs || [];
          const errors = tabData.errorLogs || [];
          const logError = extra.tabError || tabData.tabError;
          const logTable = (rows, empty) => rows.length ? h("div", { className: "ci-table-wrap" }, h("table", { className: "ci-table" },
            h("thead", null, h("tr", null, h("th", null, "时间"), h("th", null, "SQL / 内容"), h("th", null, "用户"))),
            h("tbody", null, rows.slice(0, 50).map((row, idx) => h("tr", { key: idx },
              h("td", null, row.time || row.Timestamp || "-"),
              h("td", { title: row.sql || row.SqlText || "" }, row.sql || row.SqlText || row.Content || "-"),
              h("td", null, row.user || row.UserName || "-"),
            ))),
          )) : h("div", { className: "ci-empty" }, empty);
          return h("div", { className: "ci-pane" },
            logError ? h("p", { className: "ci-hint" }, logError) : null,
            h("p", { className: "ci-hint" }, "慢查询在日志中心，不是顶栏页签。"),
            h("div", { className: "ci-sec-t" }, "慢日志"),
            logTable(slow, tabData.slowLogError || "没有慢日志"),
            h("div", { className: "ci-sec-t" }, "错误日志"),
            logTable(errors, tabData.errorLogError || "没有错误日志"),
          );
        }
        if (tab === "只读实例") {
          const rows = tabData.readonlyInstances || [];
          return rows.length ? h("div", { className: "ci-table-wrap" }, h("table", { className: "ci-table" },
            h("thead", null, h("tr", null, h("th", null, "实例 ID"), h("th", null, "名称"), h("th", null, "地址"))),
            h("tbody", null, rows.map((row) => h("tr", { key: row.InstanceId },
              h("td", null, row.InstanceId || ""),
              h("td", null, row.InstanceName || ""),
              h("td", null, row.Vip ? `${row.Vip}:${row.Vport || 3306}` : "-"),
            ))),
          )) : h("div", { className: "ci-empty" }, tabData.empty || "暂无只读实例");
        }
        if (tab === "数据库代理" || tab === "数据安全") {
          const openedLabel = (value) => value === true ? "已开通" : value === false ? "未开通" : "未查询到开通状态";
          return h("div", { className: "ci-pane" },
            h("p", null, tab === "数据库代理" ? (tabData.opened ? "已开通数据库代理" : (tabData.proxy && tabData.proxy.note) || "未开通数据库代理") : "数据安全开通状态"),
            tab === "数据安全" ? h("div", { className: "ci-kv" },
              h("div", { className: "ci-k" }, "审计"),
              h("div", null, openedLabel(tabData.auditOpened)),
              h("div", { className: "ci-k" }, "加密"),
              h("div", null, openedLabel(tabData.encryptionOpened)),
              h("div", { className: "ci-k" }, "说明"),
              h("div", null, tabData.note || "仅在接口返回明确字段时展示已开通。"),
            ) : null,
          );
        }
        if (tab === "连接检查") {
          const inner = tabData.inner || {};
          const outer = tabData.outer || {};
          return h("div", { className: "ci-pane" },
            h("div", { className: "ci-kv" },
              h("div", { className: "ci-k" }, "内网"),
              h("div", null, inner.ok ? `连通 ${inner.latencyMs}ms` : (inner.error || "失败")),
              h("div", { className: "ci-k" }, "外网"),
              h("div", null, outer.ok ? `连通 ${outer.latencyMs}ms` : (outer.error || "失败")),
            ),
            h("button", { type: "button", className: "ci-mini", onClick: () => onReload(tab) }, "重新检查"),
          );
        }
        return h("div", { className: "ci-empty" }, extra.tabError || "没有内容");
      })();
      return [
        h("div", { key: "crumb", className: "ci-crumb" },
          h("button", { type: "button", className: "ci-back", onClick: onBack }, "返回实例列表"),
          h("span", { className: "ci-head-t" }, item.title),
          h("span", { className: "ci-sub" }, `${item.description || ""} · ${regionName(region)}`),
        ),
        h("div", { key: "nav" },
          h("div", { className: "ci-tabs" }, CDB_TAB_GROUPS.map((g) => h("button", {
            key: g.label,
            type: "button",
            className: "ci-tab" + (g.label === group.label ? " on" : ""),
            onClick: () => {
              if (g.label === group.label) return;
              onTab(g.tabs[0]);
            },
          }, g.label))),
          h("div", { className: "ci-subnav" }, group.tabs.map((name) => h("button", {
            key: name,
            type: "button",
            className: "ci-subnav-item" + (name === tab ? " on" : ""),
            disabled: loading && name === tab,
            onClick: () => { if (name !== tab) onTab(name); },
          }, loading && name === tab ? h(Spin) : null, name))),
        ),
        loading ? h("div", { key: "load", className: "ci-pane-load" }, h(Spin), "加载中…") : null,
        !loading && error && !detail ? h("div", { key: "ferr", className: "ci-err" }, error) : null,
        err ? h("p", { key: "err", className: "ci-err" }, err) : null,
        !loading && detail ? body : null,
        form ? h(GenericForm, {
          key: "form",
          title: form.title,
          fields: form.fields,
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

    function DmcWorkbench({ item, skipConfirm, onBack, onSkipConfirm, initialDb }) {
      const meta = cdbMeta(item);
      const [user, setUser] = useState("root");
      const [password, setPassword] = useState("");
      const [session, setSession] = useState(null);
      const [sql, setSql] = useState("SELECT 1");
      const [result, setResult] = useState(null);
      const [dbs, setDbs] = useState([]);
      const [tables, setTables] = useState([]);
      const [db, setDb] = useState(initialDb || "");
      const [rows, setRows] = useState(null);
      const [busy, setBusy] = useState(false);
      const [err, setErr] = useState("");
      const [confirm, setConfirm] = useState(null);
      const [form, setForm] = useState(null);
      const endpoint = pickDmcEndpoint(meta);
      const payloadBase = () => ({
        region: meta.region,
        instanceId: item.title,
        host: endpoint.host,
        port: endpoint.port,
        vip: meta.vip,
        wanStatus: meta.wanStatus,
        wanDomain: meta.wanDomain,
        wanPort: meta.wanPort,
      });
      const run = async (action, payload) => {
        setBusy(true);
        setErr("");
        try {
          const out = await api("action", {
            moduleId: item.moduleId,
            id: item.id,
            action,
            payload: { ...payloadBase(), ...payload },
          });
          setConfirm(null);
          return out;
        } catch (e) {
          setErr(publicErrorMessage(e));
        } finally {
          setBusy(false);
        }
      };
      const requestWrite = async (action, payload, text) => {
        let skip = skipConfirm;
        try {
          const d = await api("meta", {});
          skip = !!d.skipConfirm;
          if (onSkipConfirm) onSkipConfirm(skip);
        } catch { /* keep */ }
        const always = (action === "dmc.row.write" && payload && payload.op === "delete")
          || isDestructiveSql(payload && payload.sql);
        if (skip && !always) return run(action, payload);
        setConfirm({ action, payload, text, danger: true });
      };
      const login = async () => {
        const out = await run("dmc.login", { user, password });
        if (!out || !out.ok) return;
        setPassword("");
        setSession(out.data);
        const schema = await run("dmc.schema", {});
        if (schema && schema.data) setDbs(schema.data.databases || []);
      };
      const loadTables = async (name) => {
        setDb(name);
        const schema = await run("dmc.schema", { database: name });
        if (schema && schema.data) setTables(schema.data.tables || []);
      };
      const loadRows = async (table) => {
        const out = await run("dmc.rows", { database: db, table, limit: 50, offset: 0 });
        if (out && out.data) setRows({ table, ...out.data });
      };
      const execSql = async () => {
        if (isWriteSql(sql)) {
          const out = await requestWrite("dmc.sql", { sql, database: db }, "该 SQL 会修改数据，确认执行？");
          if (out && out.data) setResult(out.data);
          return;
        }
        const out = await run("dmc.sql", { sql, database: db });
        if (out && out.data) setResult(out.data);
      };
      if (!session) {
        return [
          h("div", { key: "crumb", className: "ci-crumb" },
            h("button", { type: "button", className: "ci-back", onClick: onBack }, "返回实例列表"),
            h("span", { className: "ci-head-t" }, "登录数据库（DMC）"),
          ),
          h("div", { key: "login", className: "ci-login-box" },
            h("h3", null, "登录数据库（DMC）"),
            h("div", { className: "ci-field" }, h("label", null, "数据库类型"), h("select", { className: "ci-sel", disabled: true }, h("option", null, "MySQL"))),
            h("div", { className: "ci-field" }, h("label", null, "地域"), h("select", { className: "ci-sel", disabled: true }, h("option", null, regionName(meta.region)))),
            h("div", { className: "ci-field" }, h("label", null, "实例"), h("select", { className: "ci-sel", disabled: true }, h("option", null, `${item.title} / ${item.description || ""}`))),
            h("div", { className: "ci-field" }, h("label", null, "登录方式"), h("select", { className: "ci-sel", disabled: true }, h("option", null, "密码登录"))),
            h("div", { className: "ci-field" }, h("label", null, "账号"), h("input", { value: user, autoComplete: "off", onChange: (e) => setUser(e.target.value) })),
            h("div", { className: "ci-field" }, h("label", null, "密码"), h("input", { type: "password", value: password, autoComplete: "off", onChange: (e) => setPassword(e.target.value) })),
            err ? h("p", { className: "ci-err" }, err) : null,
            h("div", { className: "ci-modal-actions" },
              h("button", { type: "button", className: "ci-mini", onClick: onBack }, "取消"),
              h("button", { type: "button", className: "ci-mini primary", disabled: busy, onClick: login }, busy ? "登录中" : "登录"),
            ),
            h("p", { className: "ci-hint", style: { marginTop: 10 } }, endpoint.wanOpen
              ? "将优先使用外网地址登录。账密不写设置。"
              : "未开外网时需插件主机可达内网；可先在管理页开启外网再登录。账密不写设置。"),
          ),
        ];
      }
      return [
        h("div", { key: "crumb", className: "ci-crumb" },
          h("button", { type: "button", className: "ci-back", onClick: onBack }, "返回实例列表"),
          h("span", { className: "ci-head-t" }, "SQL 窗口"),
          h("span", { className: "ci-sub" }, `${item.title} · ${session.user}`),
          h("button", { type: "button", className: "ci-mini", onClick: () => run("dmc.logout", {}).then(() => setSession(null)) }, "退出登录"),
        ),
        err ? h("p", { key: "err", className: "ci-err" }, err) : null,
        h("div", { key: "dmc", className: "ci-dmc" },
          h("div", { className: "ci-tree" },
            h("div", { className: "ci-sec-t" }, "库表目录"),
            dbs.map((name) => h("button", { key: name, type: "button", onClick: () => loadTables(name) }, name)),
            tables.map((name) => h("button", { key: "t" + name, type: "button", onClick: () => loadRows(name) }, db ? `${db}.${name}` : name)),
          ),
          h("div", { className: "ci-pane" },
            h("textarea", { className: "ci-sql", value: sql, onChange: (e) => setSql(e.target.value) }),
            h("div", { className: "ci-actions" },
              h("button", { type: "button", className: "ci-mini primary", disabled: busy, onClick: execSql }, "执行"),
            ),
            result ? [
              result.affected != null ? h("p", { key: "aff", className: "ci-hint" }, `影响 ${result.affected} 行`) : null,
              result.columns && result.columns.length ? h("div", { key: "tb", className: "ci-table-wrap" }, h("table", { className: "ci-table" },
                h("thead", null, h("tr", null, result.columns.map((col) => h("th", { key: col }, col)))),
                h("tbody", null, (result.rows || []).map((row, idx) => h("tr", { key: idx }, (row || []).map((cell, cidx) => h("td", { key: cidx }, cell == null ? "NULL" : String(cell)))))),
              )) : null,
            ] : null,
            rows ? [
              h("div", { key: "rs", className: "ci-sec" },
                h("span", { className: "ci-sec-t" }, `表 ${rows.table}`),
                h("button", { type: "button", className: "ci-mini", onClick: () => setForm({
                  title: "插入行",
                  fields: (rows.columns || []).map((col) => ({ key: col, label: col })),
                  table: rows.table,
                  op: "insert",
                }) }, "插入"),
              ),
              h("div", { key: "rt", className: "ci-table-wrap" }, h("table", { className: "ci-table" },
                h("thead", null, h("tr", null, (rows.columns || []).map((col) => h("th", { key: col }, col)), h("th", null, "操作"))),
                h("tbody", null, (rows.rows || []).map((row, idx) => {
                  const rec = {};
                  (rows.columns || []).forEach((col, i) => { rec[col] = row[i]; });
                  return h("tr", { key: idx },
                    (row || []).map((cell, cidx) => h("td", { key: cidx }, cell == null ? "NULL" : String(cell))),
                    h("td", { className: "ci-ops-cell" }, h("div", { className: "ci-ops" },
                      h("button", { type: "button", className: "ci-link", onClick: () => setForm({
                        title: "改行",
                        fields: (rows.columns || []).map((col) => ({ key: col, label: col })),
                        initial: rec,
                        table: rows.table,
                        op: "update",
                        where: rec,
                      }) }, "改行"),
                      h("button", { type: "button", className: "ci-link danger", onClick: () => requestWrite("dmc.row.write", {
                        database: db,
                        table: rows.table,
                        op: "delete",
                        where: rec,
                      }, "确认删除该行？") }, "删除"),
                    )),
                  );
                })),
              )),
            ] : null,
          ),
        ),
        form ? h(GenericForm, {
          key: "rowform",
          title: form.title,
          fields: form.fields,
          initial: form.initial,
          busy,
          err,
          onCancel: () => { if (!busy) setForm(null); },
          onSubmit: (draft) => requestWrite("dmc.row.write", {
            database: db,
            table: form.table,
            op: form.op,
            values: draft,
            where: form.where || {},
          }, `确认${form.title}？`).then((out) => {
            if (out && out.ok) {
              setForm(null);
              if (form.table) loadRows(form.table);
            }
          }),
        }) : null,
        h(ConfirmDialog, {
          key: "confirm",
          open: !!confirm,
          title: "写操作确认",
          text: confirm?.text,
          busy,
          danger: true,
          onCancel: () => { if (!busy) setConfirm(null); },
          onConfirm: async () => {
            const out = await run(confirm.action, confirm.payload);
            if (out && out.data && confirm.action === "dmc.sql") setResult(out.data);
            if (out && out.ok && confirm.action === "dmc.row.write" && rows) loadRows(rows.table);
          },
        }),
      ];
    }

    function MoreMenu({ item, disabled, onAction }) {
      const [open, setOpen] = useState(false);
      const box = useRef(null);
      const power = instancePower(item);
      useEffect(() => {
        if (!open) return;
        const onDoc = (e) => {
          if (box.current && !box.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("click", onDoc);
        return () => document.removeEventListener("click", onDoc);
      }, [open]);
      return h("div", { className: "ci-more", ref: box },
        h("button", {
          type: "button",
          className: "ci-link",
          disabled,
          onClick: (e) => { e.stopPropagation(); setOpen(!open); },
        }, "更多"),
        open ? h("div", { className: "ci-menu" },
          [
            ["instance.start", power.start],
            ["instance.stop", power.stop],
            ["instance.reboot", power.reboot],
          ].map(([id, off]) => h("button", {
            key: id,
            type: "button",
            disabled: !!off,
            onClick: () => { setOpen(false); onAction(item, id); },
          }, actionLabel(id))),
        ) : null,
      );
    }

    function MainIpv4({ item }) {
      const pri = item.privateIp || "-";
      const pub = item.publicIp || "-";
      return [
        h("span", { key: "pri", className: "ci-ip" }, "内网：" + pri),
        h("span", { key: "pub", className: "ci-ip" }, "弹性：" + pub),
      ];
    }

    function CvmConsole({ items, pendingId, onOpen, onAction, emptyHint, region, regions, onRegion, q, onQuery, onSubmit, busy }) {
      const [localRegion, setLocalRegion] = useState("华南地区（广州）");
      const [localQ, setLocalQ] = useState("");
      const regionValue = onRegion ? (region || defaultRegionName(regions)) : localRegion;
      const qValue = onQuery ? (q || "") : localQ;
      const regionNames = Array.from(new Set([
        ...(Array.isArray(regions) ? regions : []),
        ...(items || []).map((row) => row.regionName || row.region).filter(Boolean),
      ]));
      const rows = onRegion || onQuery
        ? (items || [])
        : (items || []).filter((row) => {
          if (regionValue && (row.regionName || row.region) !== regionValue) return false;
          return matchLocalInstance(row, qValue);
        });
      const setRegion = (next) => {
        if (onRegion) onRegion(next);
        else setLocalRegion(next);
      };
      const setQ = (next) => {
        if (onQuery) onQuery(next);
        else setLocalQ(next);
      };
      return [
        h("div", { key: "bar", className: "ci-bar" },
          h("div", { className: "ci-bar-left" },
            h("span", { className: "ci-bar-title" }, "实例"),
            h(RegionSelect, { regions: regionNames, value: regionValue, onChange: setRegion }),
          ),
          h(SearchField, {
            value: qValue,
            onChange: setQ,
            onSubmit: onSubmit,
            placeholder: "搜索 ID / 名称 / IP",
          }),
        ),
        h(ListPane, { key: "body", busy },
          rows.length ? h("div", { className: "ci-scroll" }, h("table", { className: "ci-dense" },
          h("thead", null, h("tr", null,
            ["ID/名称", "状态", "可用区", "实例类型", "操作系统", "实例配置", "主IPv4地址", "实例计费模式", "操作"]
              .map((label) => h("th", { key: label }, label)),
          )),
          h("tbody", null, rows.map((item) => h("tr", { key: item.id },
            h("td", null, h("div", { className: "ci-id" },
              h("button", {
                type: "button",
                className: "ci-name",
                disabled: pendingId === item.id,
                onClick: () => onOpen(item),
              }, item.instanceId || item.id),
              h("span", { className: "ci-id-sub" }, item.title),
            )),
            h("td", null, h(StatusCell, { status: item.status, label: item.stateLabel })),
            h("td", null, cellValue(item, "可用区") || "-"),
            h("td", null, cellValue(item, "实例类型") || "-"),
            h("td", null, cellValue(item, "操作系统") || "-"),
            h("td", null, cellValue(item, "实例配置") || "-"),
            h("td", null, h(MainIpv4, { item })),
            h("td", null, cellValue(item, "实例计费模式") || "-"),
            h("td", null, h(MoreMenu, { item, disabled: pendingId === item.id, onAction })),
          ))),
        )) : h("div", { className: "ci-empty" }, emptyHint || (qValue ? `没有匹配「${qValue}」的实例` : "没有匹配的实例")),
        ),
      ];
    }

    function LhConsole({ items, pendingId, onOpen, onAction, emptyHint, region, regions, onRegion, q, onQuery, onSubmit, busy }) {
      const regionValue = region || defaultRegionName(regions);
      const qValue = onQuery ? (q || "") : "";
      const rows = Array.isArray(items) ? items : [];
      return [
        h("div", { key: "bar", className: "ci-bar" },
          h("div", { className: "ci-bar-left" },
            h("span", { className: "ci-bar-title" }, "服务器"),
            h(RegionSelect, { regions, value: regionValue, onChange: onRegion }),
          ),
          h(SearchField, {
            value: qValue,
            onChange: onQuery,
            onSubmit: onSubmit,
            placeholder: "搜索 ID / 名称 / IP",
          }),
        ),
        h(ListPane, { key: "body", busy },
          rows.length ? h("div", { className: "ci-scroll" }, h("table", { className: "ci-dense" },
          h("thead", null, h("tr", null,
            ["ID/名称", "状态", "地域", "公网 IP", "套餐", "到期时间", "操作"].map((label) => h("th", { key: label }, label)),
          )),
          h("tbody", null, rows.map((item) => h("tr", { key: item.id },
            h("td", null, h("div", { className: "ci-id" },
              h("button", {
                type: "button",
                className: "ci-name",
                disabled: pendingId === item.id,
                onClick: () => onOpen(item),
              }, item.instanceId || item.id),
              h("span", { className: "ci-id-sub" }, item.title),
            )),
            h("td", null, h(StatusCell, { status: item.status, label: item.stateLabel })),
            h("td", null, item.regionName || item.region || "-"),
            h("td", null, item.publicIp || cellValue(item, "公网 IP") || "-"),
            h("td", null, cellValue(item, "套餐") || "-"),
            h("td", null, cellValue(item, "到期时间") || "-"),
            h("td", null, h(MoreMenu, { item, disabled: pendingId === item.id, onAction })),
          ))),
        )) : h("div", { className: "ci-empty" }, emptyHint || "没有资源"),
        ),
      ];
    }

    function InstanceDetailView({ item, detail, loading, error, skipConfirm, onBack, onReload, onTab, tab, onSkipConfirm }) {
      const [confirm, setConfirm] = useState(null);
      const [busy, setBusy] = useState(false);
      const [err, setErr] = useState("");
      const card = detail?.card || item;
      const groups = detail?.groups || [];
      const power = instancePower(card);
      const extra = detail?.extra || {};
      const tabData = extra.tabData || {};
      const activeTab = tab || "实例详情";
      const run = async (actionId) => {
        setBusy(true);
        setErr("");
        try {
          await api("action", {
            moduleId: item.moduleId,
            id: item.id,
            action: actionId,
            payload: {
              instanceId: card.instanceId || item.instanceId,
              region: card.region || item.region,
            },
          });
          setConfirm(null);
          await onReload();
        } catch (e) {
          setErr(publicErrorMessage(e));
        } finally {
          setBusy(false);
        }
      };
      const request = async (actionId) => {
        let skip = skipConfirm;
        try {
          const d = await api("meta", {});
          skip = !!d.skipConfirm;
          if (onSkipConfirm) onSkipConfirm(skip);
        } catch { /* keep last known skipConfirm */ }
        if (skip) return run(actionId);
        setConfirm({
          action: { id: actionId, label: actionLabel(actionId), confirm: "default" },
          text: `确认${actionLabel(actionId)} ${card.title || item.title}？`,
        });
      };
      return [
        h("div", { key: "crumb", className: "ci-crumb" },
          h("button", { type: "button", className: "ci-back", onClick: onBack, title: "返回", "aria-label": "返回" }, h(ChevronLeft)),
          h("div", { className: "ci-crumb-meta" },
            h("span", { className: "ci-head-t", title: card.title }, card.title),
            h(StatusCell, { status: card.status, label: card.stateLabel }),
          ),
          h("div", { className: "ci-power" },
            h("button", {
              type: "button",
              className: "ci-mini",
              disabled: busy || power.start,
              onClick: () => request("instance.start"),
            }, "开机"),
            h("button", {
              type: "button",
              className: "ci-mini",
              disabled: busy || power.stop,
              onClick: () => request("instance.stop"),
            }, "关机"),
            h("button", {
              type: "button",
              className: "ci-mini primary",
              disabled: busy || power.reboot,
              onClick: () => request("instance.reboot"),
            }, "重启"),
          ),
        ),
        h("div", { key: "tabs", className: "ci-tabs" }, ["实例详情", "实例监控"].map((name) =>
          h("button", {
            key: name,
            type: "button",
            className: "ci-tab" + (name === activeTab ? " on" : ""),
            onClick: () => { if (name !== activeTab && onTab) onTab(name); },
          }, name),
        )),
        loading ? h("div", { key: "load", className: "ci-load" }, h(Spin), "加载详情…") : null,
        !loading && error && !detail ? h("div", { key: "ferr", className: "ci-err" }, error) : null,
        err ? h("p", { key: "err", className: "ci-err" }, err) : null,
        !loading && detail && activeTab === "实例监控" ? (() => {
          const seriesMap = buildMonitorSeriesMap(tabData.metrics, tabData.series);
          return h(MonitorPanel, {
            key: "monitor",
            metrics: Array.isArray(tabData.metrics) ? tabData.metrics : [],
            seriesMap,
            range: tabData.range || "1h",
            note: tabData.note || "",
            onRangeChange: (range) => onReload("实例监控", { range }),
          });
        })() : null,
        !loading && detail && activeTab !== "实例监控" ? groups.map((group) => [
          h("div", { key: group.title + "-t", className: "ci-sec-t" }, group.title),
          h("div", { key: group.title + "-g", className: "ci-grid" },
            (group.fields || []).map((row) => h("div", { key: row.label, className: "ci-f" },
              row.label,
              h("b", null, row.value),
            )),
          ),
        ]) : null,
        h(ConfirmDialog, {
          key: "confirm",
          open: !!confirm,
          title: confirm?.action?.label,
          text: confirm?.text,
          busy,
          danger: false,
          onCancel: () => { if (!busy) setConfirm(null); },
          onConfirm: () => confirm && run(confirm.action.id),
        }),
      ];
    }

    function extraOf(item, key, fallback) {
      const extras = item && item.extras;
      if (extras && extras[key] != null) return extras[key];
      return fallback;
    }

    function barTitleOf(kind) {
      if (kind === "cert") return "我的证书";
      if (kind === "registrar") return "域名注册";
      if (kind === "my-domain") return "我的域名";
      if (kind === "domain") return "域名解析";
      return "云资源";
    }

    function searchPlaceholderOf(kind) {
      if (kind === "cert") return "搜索证书 ID / 备注 / 域名";
      if (kind === "registrar") return "请输入域名或后缀";
      if (kind === "my-domain" || kind === "domain") return "请输入域名关键字";
      return "搜索";
    }

    function canAddCart(item) {
      if (!item) return false;
      if (extraOf(item, "available", false) === true) return true;
      return item.openLabel === "立即加购";
    }

    function actionHint(item) {
      return extraOf(item, "actionHint", "") || item.openLabel || cellValue(item, "状态") || "已被注册";
    }

    function RegistrarTable({ items, pendingId, cartTitles, onAdd, emptyHint }) {
      const rows = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!rows.length) return h("div", { className: "ci-empty" }, emptyHint || "请输入域名后查询");
      const template = "minmax(120px,1.7fr) 84px minmax(72px,0.8fr) 110px";
      return h("div", { className: "ci-list" },
        h("div", { className: "ci-row head", style: { gridTemplateColumns: template } },
          h("div", { className: "ci-cell" }, "域名"),
          h("div", { className: "ci-cell" }, "状态"),
          h("div", { className: "ci-cell" }, "价格"),
          h("div", { className: "ci-cell" }, "操作"),
        ),
        rows.map((item) => {
          const addable = canAddCart(item);
          const inCart = (cartTitles || []).includes(item.title);
          return h("div", { key: item.id, className: "ci-row", style: { gridTemplateColumns: template } },
            h("div", { className: "ci-cell" }, h("span", { className: "ci-name", title: item.title, style: { cursor: "default" } }, item.title)),
            h("div", { className: "ci-cell" }, cellValue(item, "状态") || item.description || "-"),
            h("div", { className: "ci-cell num" }, cellValue(item, "价格") || "-"),
            h("div", { className: "ci-cell ci-ops" }, addable
              ? h("button", {
                type: "button",
                className: "ci-link",
                disabled: pendingId === item.id || inCart,
                onClick: () => onAdd(item),
              }, inCart ? "已加购" : "立即加购")
              : h("span", { className: "ci-muted", style: { color: "var(--dsw-alias-label-caption)" } }, actionHint(item))),
          );
        }),
      );
    }

    function MyDomainTable({ items, pendingId, busyId, onOpen, onToggleRenew, emptyHint }) {
      const rows = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!rows.length) return h("div", { className: "ci-empty" }, emptyHint || "没有资源");
      const template = "minmax(120px,1.6fr) minmax(64px,0.7fr) minmax(88px,0.8fr) 88px 64px";
      return h("div", { className: "ci-list" },
        h("div", { className: "ci-row head", style: { gridTemplateColumns: template } },
          h("div", { className: "ci-cell" }, "域名"),
          h("div", { className: "ci-cell" }, "状态"),
          h("div", { className: "ci-cell" }, "到期"),
          h("div", { className: "ci-cell" }, "自动续费"),
          h("div", { className: "ci-cell" }, "操作"),
        ),
        rows.map((item) => {
          const on = extraOf(item, "autoRenew", cellValue(item, "自动续费") === "开") === true
            || extraOf(item, "autoRenew", false) === true
            || cellValue(item, "自动续费") === "开";
          return h("div", { key: item.id, className: "ci-row", style: { gridTemplateColumns: template } },
            h("div", { className: "ci-cell" }, h("button", {
              type: "button",
              className: "ci-name",
              title: item.title,
              disabled: pendingId === item.id,
              onClick: () => onOpen(item),
            }, item.title)),
            h("div", { className: "ci-cell" }, cellValue(item, "状态") || item.description || "-"),
            h("div", { className: "ci-cell num" }, cellValue(item, "到期") || item.expiresAt || "-"),
            h("div", { className: "ci-cell" }, h("button", {
              type: "button",
              className: "ci-switch",
              disabled: busyId === item.id,
              onClick: () => onToggleRenew(item, !on),
            }, on ? "开" : "关")),
            h("div", { className: "ci-cell ci-ops" }, h("button", {
              type: "button",
              className: "ci-link",
              disabled: pendingId === item.id,
              onClick: () => onOpen(item),
            }, pendingId === item.id ? "加载中" : "管理")),
          );
        }),
      );
    }

    function CheckoutWizard({
      flow, items, draft, setDraft, cart, result, busy, err, maxPeriod,
      onClose, onRemove, onBuy, onBackCart, onNext, onBackSubmit, onPay, onRefresh,
    }) {
      const open = flow === "cart" || flow === "submit" || flow === "review" || flow === "status";
      const box = useOverlayKeys(open, busy, onClose, false);
      if (!open) return null;
      const steps = [
        { id: "cart", label: "购物车" },
        { id: "submit", label: "提交订单" },
        { id: "review", label: "核对信息" },
        { id: "status", label: "完成" },
      ];
      const idx = Math.max(0, steps.findIndex((step) => step.id === flow));
      const years = Array.from({ length: maxPeriod || 10 }, (_, i) => i + 1);
      const preview = draft?.preview || {};
      const domains = preview.domains || (cart || []).map((row) => row.title);
      const period = preview.period || draft?.period;
      const total = preview.total != null
        ? preview.total
        : (cart || []).reduce((sum, row) => sum + Number(row.price || 0), 0) * Number(period || 1);
      const cartSum = (items || []).reduce((sum, row) => sum + Number(row.price || 0), 0);
      const titles = { cart: "域名购物车", submit: "提交订单", review: "核对信息", status: "操作状态" };
      let body = null;
      let foot = null;
      if (flow === "cart") {
        body = items.length
          ? h("table", { className: "ci-cart-table" },
            h("thead", null, h("tr", null,
              h("th", null, "域名"),
              h("th", null, "价格"),
              h("th", null, "操作"),
            )),
            h("tbody", null,
              items.map((row) => h("tr", { key: row.title },
                h("td", null, row.title),
                h("td", { className: "num" }, row.price ? `¥${row.price}/年` : "-"),
                h("td", null, h("button", { type: "button", className: "ci-link", disabled: busy, onClick: () => onRemove(row.title) }, "移除")),
              )),
              h("tr", null,
                h("td", { className: "sum" }, "合计"),
                h("td", { className: "sum num" }, `¥${cartSum}/年`),
                h("td", { className: "sum" }, ""),
              ),
            ),
          )
          : h("p", null, "购物车为空，不能买");
        foot = [
          h("button", { key: "close", type: "button", className: "ci-mini", disabled: busy, onClick: onClose }, "关闭"),
          h("button", {
            key: "buy",
            type: "button",
            className: "ci-mini primary",
            disabled: busy || !items.length,
            onClick: onBuy,
          }, busy ? "处理中" : "立即购买"),
        ];
      } else if (flow === "submit" && draft) {
        body = [
          h("div", { key: "period", className: "ci-field" },
            h("label", null, "时长"),
            h("select", {
              value: draft.period,
              disabled: busy,
              onChange: (e) => setDraft({ ...draft, period: Number(e.target.value) || 1 }),
            }, years.map((n) => h("option", { key: n, value: n }, `${n} 年`))),
          ),
          h("div", { key: "tpl", className: "ci-field" },
            h("label", null, "已实名信息模板"),
            (draft.templates || []).length
              ? h("select", {
                value: draft.templateId,
                disabled: busy,
                onChange: (e) => setDraft({ ...draft, templateId: e.target.value }),
              }, (draft.templates || []).map((item) => h("option", { key: item.templateId, value: item.templateId }, item.label)))
              : h("p", { className: "ci-hint" }, "没有已实名信息模板。请先到腾讯云控制台「信息模板」完成实名。"),
          ),
          h("div", { key: "sec", className: "ci-wiz-sec" }, "状态设置"),
          h("label", { key: "renew", className: "ci-opt" },
            h("input", {
              type: "checkbox",
              checked: !!draft.autoRenew,
              disabled: busy,
              onChange: () => setDraft({ ...draft, autoRenew: !draft.autoRenew }),
            }),
            h("span", null,
              h("div", { className: "ci-opt-t" }, "开启自动续费"),
              h("p", { className: "ci-opt-d" }, "到期前按续费价格从账户余额扣费。可随时在我的域名列表关闭。"),
            ),
          ),
          h("label", { key: "ulock", className: "ci-opt" },
            h("input", {
              type: "checkbox",
              checked: !!draft.updateLock,
              disabled: busy,
              onChange: () => setDraft({ ...draft, updateLock: !draft.updateLock }),
            }),
            h("span", null,
              h("div", { className: "ci-opt-t" }, "禁止更新锁"),
              h("p", { className: "ci-opt-d" }, "开启后将禁止修改域名信息、设置及 DNS 服务器。"),
            ),
          ),
          h("label", { key: "tlock", className: "ci-opt" },
            h("input", {
              type: "checkbox",
              checked: !!draft.transferLock,
              disabled: busy,
              onChange: () => setDraft({ ...draft, transferLock: !draft.transferLock }),
            }),
            h("span", null,
              h("div", { className: "ci-opt-t" }, "禁止转移锁"),
              h("p", { className: "ci-opt-d" }, "开启后将禁止该域名从腾讯云转出到其他注册商。下单时两锁可同时开。"),
            ),
          ),
          h("label", { key: "agree", className: "ci-agree", style: { marginTop: 12 } },
            h("input", {
              type: "checkbox",
              checked: !!draft.agree,
              disabled: busy,
              onChange: () => setDraft({ ...draft, agree: !draft.agree }),
            }),
            h("span", null, "我已阅读并同意", h("a", {
              href: draft.agreementUrl || "https://cloud.tencent.com/document/product/242/8458",
              target: "_blank",
              rel: "noreferrer",
            }, "《腾讯云域名注册协议》")),
          ),
        ];
        foot = [
          h("button", { key: "back", type: "button", className: "ci-mini", disabled: busy, onClick: onBackCart }, "返回购物车"),
          h("button", {
            key: "next",
            type: "button",
            className: "ci-mini primary",
            disabled: busy || !(draft.templates || []).length,
            onClick: onNext,
          }, busy ? "处理中" : "核对信息"),
        ];
      } else if (flow === "review" && draft) {
        body = h("div", { className: "ci-kv review" },
          h("div", { className: "ci-kv-k" }, "域名"),
          h("div", { className: "ci-kv-v" }, domains.join("、") || "-"),
          h("div", { className: "ci-kv-k" }, "时长"),
          h("div", { className: "ci-kv-v" }, `${period} 年`),
          h("div", { className: "ci-kv-k" }, "模板"),
          h("div", { className: "ci-kv-v" }, preview.templateLabel || draft.templateId || "-"),
          h("div", { className: "ci-kv-k" }, "自动续费"),
          h("div", { className: "ci-kv-v" }, draft.autoRenew ? "开" : "关"),
          h("div", { className: "ci-kv-k" }, "禁止更新锁"),
          h("div", { className: "ci-kv-v" }, draft.updateLock ? "开" : "关"),
          h("div", { className: "ci-kv-k" }, "禁止转移锁"),
          h("div", { className: "ci-kv-v" }, draft.transferLock ? "开" : "关"),
          h("div", { className: "ci-kv-k" }, "费用"),
          h("div", { className: "ci-kv-v sum" }, `¥${total}`),
          h("div", { className: "ci-kv-k" }, "支付"),
          h("div", { className: "ci-kv-v" }, "将从账户余额扣费。不支持微信 / QQ 钱包 / 网银。"),
        );
        foot = [
          h("button", { key: "back", type: "button", className: "ci-mini", disabled: busy, onClick: onBackSubmit }, "返回"),
          h("button", {
            key: "pay",
            type: "button",
            className: "ci-mini primary",
            disabled: busy,
            onClick: onPay,
          }, busy ? "支付中" : "账户余额支付"),
        ];
      } else {
        body = [
          h("p", { key: "st", style: { fontSize: 16, fontWeight: 650, color: "var(--dsw-alias-label-primary)" } }, result?.statusLabel || "已提交"),
          result?.reason ? h("p", { key: "rs" }, result.reason) : null,
          h("p", { key: "hint" }, result?.hint || "可到我的域名卡片刷新查看。注册不是瞬时生效。"),
        ];
        foot = [
          result?.logId ? h("button", { key: "rf", type: "button", className: "ci-mini", disabled: busy, onClick: onRefresh }, busy ? "刷新中" : "刷新状态") : null,
          h("button", { key: "done", type: "button", className: "ci-mini primary", disabled: busy, onClick: onClose }, "完成"),
        ];
      }
      const node = h("div", {
        className: "ci-modal-mask",
        role: "presentation",
        onClick: (e) => { if (!busy && e.target === e.currentTarget) onClose(); },
      },
        h("div", { className: "ci-modal wizard", role: "dialog", "aria-modal": "true", ref: box },
          h("div", { className: "ci-wiz-head" },
            h("h3", null, titles[flow] || "域名购物车"),
            h("div", { className: "ci-wiz-steps" }, steps.flatMap((step, i) => {
              const state = i < idx ? "done" : (i === idx ? "on" : "");
              const n = h("div", { key: step.id, className: "ci-wiz-step" + (state ? ` ${state}` : "") },
                h("span", { className: "ci-wiz-n" }, i + 1),
                step.label,
              );
              return i === 0 ? [n] : [h("span", { key: `l${i}`, className: "ci-wiz-line" }), n];
            })),
          ),
          h("div", { className: "ci-wiz-body" },
            body,
            err ? h("p", { className: "ci-err", style: { margin: "12px 0 0" } }, err) : null,
          ),
          h("div", { className: "ci-wiz-foot" }, foot),
        ),
      );
      return createPortal(node, document.body);
    }

    function OwnedDetailView({ item, detail, loading, error, onBack, onReload }) {
      const [tab, setTab] = useState("basic");
      const [confirm, setConfirm] = useState(null);
      const [busy, setBusy] = useState(false);
      const [err, setErr] = useState("");
      const extras = detail?.card?.extras || item.extras || {};
      const updateLock = extras.updateLock === true;
      const transferLock = extras.transferLock === true;
      const basicFields = (detail?.fields || []).filter((row) => row.label !== "禁止更新锁" && row.label !== "禁止转移锁");
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
              domainId: extras.domainId || String(item.id).split(":").pop(),
              updateLock,
              ...payload,
            },
          });
          setConfirm(null);
          await onReload();
        } catch (e) {
          setErr(publicErrorMessage(e));
        } finally {
          setBusy(false);
        }
      };
      const request = (action, payload, text) => {
        setConfirm({ action, payload, text });
      };
      return [
        h("div", { key: "crumb", className: "ci-crumb" },
          h("button", { type: "button", className: "ci-back", onClick: onBack }, "返回"),
          h("span", { className: "ci-head-t", title: item.title }, item.title),
        ),
        loading ? h("div", { key: "load", className: "ci-load" }, h(Spin), "加载详情…") : null,
        !loading && error && !detail ? h("div", { key: "ferr", className: "ci-err" }, error) : null,
        !loading && detail ? [
          h("div", { key: "tabs", className: "ci-tabs" },
            h("button", { type: "button", className: "ci-tab" + (tab === "basic" ? " active" : ""), onClick: () => setTab("basic") }, "基本信息"),
            h("button", { type: "button", className: "ci-tab" + (tab === "security" ? " active" : ""), onClick: () => setTab("security") }, "域名安全"),
          ),
          tab === "basic" ? h("div", { key: "basic", className: "ci-kv" },
            basicFields.map((row) => [
              h("div", { key: `${row.label}-k`, className: "ci-kv-k" }, row.label),
              h("div", { key: `${row.label}-v`, className: "ci-kv-v" }, row.value),
            ]),
          ) : h("div", { key: "sec", className: "ci-sec-list" },
            h("div", { className: "ci-sec" },
              h("div", { className: "ci-sec-meta" },
                h("div", { className: "ci-sec-t" }, "禁止更新锁"),
                h("p", { className: "ci-sec-d" }, "开启后将禁止修改域名信息、设置及 DNS 服务器。"),
              ),
              h("button", {
                type: "button",
                role: "switch",
                "aria-checked": updateLock,
                "aria-label": "禁止更新锁",
                className: "ci-toggle" + (updateLock ? " on" : ""),
                disabled: busy,
                onClick: () => request(
                  { id: "lock.update", label: "禁止更新锁", confirm: "always" },
                  { enabled: !updateLock },
                  `确认${updateLock ? "关闭" : "开启"} ${item.title} 禁止更新锁？`,
                ),
              }, h("i", { "aria-hidden": true })),
            ),
            h("div", { className: "ci-sec" },
              h("div", { className: "ci-sec-meta" },
                h("div", { className: "ci-sec-t" }, "禁止转移锁"),
                h("p", { className: "ci-sec-d" }, updateLock
                  ? "更新锁已开，不能改转移锁。"
                  : "开启后将禁止该域名从腾讯云转出到其他注册商。"),
              ),
              h("button", {
                type: "button",
                role: "switch",
                "aria-checked": transferLock,
                "aria-label": "禁止转移锁",
                className: "ci-toggle" + (transferLock ? " on" : ""),
                disabled: busy || updateLock,
                onClick: () => {
                  if (updateLock) {
                    setErr("更新锁已开，不能改转移锁");
                    return;
                  }
                  request(
                    { id: "lock.transfer", label: "禁止转移锁", confirm: "always" },
                    { enabled: !transferLock },
                    `确认${transferLock ? "关闭" : "开启"} ${item.title} 禁止转移锁？`,
                  );
                },
              }, h("i", { "aria-hidden": true })),
            ),
          ),
          err ? h("p", { key: "err", className: "ci-err" }, err) : null,
        ] : null,
        h(ConfirmDialog, {
          key: "confirm",
          open: !!confirm,
          title: confirm?.action?.label,
          text: confirm?.text,
          busy,
          danger: false,
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

    function isSuperPool(pool) {
      const type = String((pool && pool.flags && pool.flags.type) || "").toLowerCase();
      const badge = String((pool && pool.badges && pool.badges[0]) || "");
      return type.includes("super") || type.includes("eklet") || badge.includes("超级");
    }

    function ClusterMoreMenu({ open, onToggle, onClose, children }) {
      const btnRef = useRef(null);
      const [pos, setPos] = useState(null);
      useEffect(() => {
        if (!open) {
          setPos(null);
          return undefined;
        }
        const place = () => {
          const el = btnRef.current;
          if (!el || typeof document === "undefined") return;
          const r = el.getBoundingClientRect();
          const width = 168;
          const vw = window.innerWidth || 800;
          const left = Math.min(Math.max(8, r.right - width), Math.max(8, vw - width - 8));
          setPos({ top: r.bottom + 4, left, width });
        };
        place();
        const onDoc = (e) => {
          const t = e.target;
          if (btnRef.current && btnRef.current.contains(t)) return;
          if (t && typeof t.closest === "function" && t.closest(".ci-menu-portal")) return;
          onClose();
        };
        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, true);
        document.addEventListener("pointerdown", onDoc, true);
        return () => {
          window.removeEventListener("resize", place);
          window.removeEventListener("scroll", place, true);
          document.removeEventListener("pointerdown", onDoc, true);
        };
      }, [open, onClose]);
      const menuNode = open
        ? h("div", {
          className: "ci-menu" + (pos ? " ci-menu-portal" : ""),
          role: "menu",
          style: pos ? { top: pos.top, left: pos.left, width: pos.width, zIndex: 80 } : undefined,
        }, children)
        : null;
      const menu = pos && typeof document !== "undefined" && document.body
        ? createPortal(menuNode, document.body)
        : menuNode;
      return h("div", { className: "ci-more", ref: btnRef },
        h("button", {
          type: "button",
          className: "ci-link",
          "aria-haspopup": "menu",
          "aria-expanded": !!open,
          onPointerDown: (e) => { e.stopPropagation(); },
          onMouseDown: (e) => { e.stopPropagation(); },
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
          },
        }, "更多"),
        menu,
      );
    }

    function ClusterListTable({ items, pendingId, menuId, onOpen, onMenu, onProtect, onDelete }) {
      const rows = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!rows.length) return h("div", { className: "ci-empty" }, "请选择地域后查看该地域集群，或当前筛选无数据");
      const template = "minmax(160px,1.6fr) 84px minmax(88px,0.8fr) 64px minmax(88px,0.8fr) minmax(120px,1fr) 88px";
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
            h(ClusterMoreMenu, {
              open: menuId === item.id,
              onToggle: () => onMenu(menuId === item.id ? "" : item.id),
              onClose: () => onMenu(""),
            }, [
              h("button", {
                key: "protect",
                type: "button",
                role: "menuitem",
                onClick: (e) => { e.stopPropagation(); onProtect(item); },
              }, "关闭删除保护"),
              h("button", {
                key: "delete",
                type: "button",
                role: "menuitem",
                className: "ci-link danger",
                onClick: (e) => { e.stopPropagation(); onDelete(item); },
              }, "删除"),
            ]),
          ),
        )),
      );
    }

    function CreateWizard({ createType, onBack, onCreated, region, busy, setBusy, setErr }) {
      const [step, setStep] = useState(1);
      const [spec, setSpec] = useState("");
      const [draft, setDraft] = useState({
        clusterName: "",
        clusterVersion: "1.28.3",
        runtime: "containerd",
        vpcId: "",
        clusterCidr: "172.16.0.0/16",
        serviceCidr: "10.200.0.0/22",
        maxNodePodNum: "64",
        maxClusterServiceNum: "256",
        description: "",
        addons: "",
        sla: false,
      });
      const steps = createType === "MANAGED_CLUSTER"
        ? ["集群信息", "网络", "组件", "确认"]
        : createType === "EDGE_CLUSTER"
          ? ["集群信息", "网络", "确认"]
          : ["基本信息", "导入说明", "确认"];
      const max = steps.length;
      const set = (key, value) => setDraft({ ...draft, [key]: value });
      const submit = async () => {
        setBusy(true);
        setErr("");
        try {
          const result = await api("action", {
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
              maxNodePodNum: Number(draft.maxNodePodNum || 64) || 64,
              maxClusterServiceNum: Number(draft.maxClusterServiceNum || 256) || 256,
              description: draft.description,
              addons: String(draft.addons || "").split(/[,\s]+/).filter(Boolean),
              sla: draft.sla === true,
            },
          });
          const yaml = result && result.data && (result.data.spec || result.data.kubeconfig);
          if (createType === "EXTERNAL_CLUSTER" && yaml) {
            setSpec(String(yaml));
            return;
          }
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
          spec ? [
            h("p", { className: "ci-hint", key: "ok" }, "已生成注册配置，请在第三方集群执行后返回列表。"),
            h("textarea", { key: "spec", readOnly: true, value: spec, style: { width: "100%" } }),
            h("div", { className: "ci-modal-actions", key: "done" },
              h("button", { type: "button", className: "ci-mini primary", onClick: onCreated }, "完成"),
            ),
          ] : [
            step === 1 ? [
              h("div", { className: "ci-field", key: "n" }, h("label", null, "集群名称"), h("input", { value: draft.clusterName, onChange: (e) => set("clusterName", e.target.value) })),
              h("div", { className: "ci-field", key: "v" }, h("label", null, "Kubernetes 版本"), h("input", { value: draft.clusterVersion, onChange: (e) => set("clusterVersion", e.target.value) })),
              createType !== "EXTERNAL_CLUSTER" ? h("div", { className: "ci-field", key: "r" }, h("label", null, "运行时"), h("input", { value: draft.runtime, onChange: (e) => set("runtime", e.target.value) })) : null,
              h("div", { className: "ci-field", key: "d" }, h("label", null, "描述（可选）"), h("input", { value: draft.description, onChange: (e) => set("description", e.target.value) })),
            ] : null,
            createType !== "EXTERNAL_CLUSTER" && step === 2 ? [
              h("div", { className: "ci-field", key: "vpc" }, h("label", null, "VPC"), h("input", { value: draft.vpcId, placeholder: "vpc-xxxxxxxx", onChange: (e) => set("vpcId", e.target.value) })),
              h("div", { className: "ci-field", key: "cc" }, h("label", null, createType === "EDGE_CLUSTER" ? "Pod 网段" : "容器网段"), h("input", { value: draft.clusterCidr, onChange: (e) => set("clusterCidr", e.target.value) })),
              h("div", { className: "ci-field", key: "sc" }, h("label", null, "Service 网段"), h("input", { value: draft.serviceCidr, onChange: (e) => set("serviceCidr", e.target.value) })),
              h("div", { className: "ci-field", key: "mp" }, h("label", null, "单节点 Pod 上限"), h("input", { value: draft.maxNodePodNum, onChange: (e) => set("maxNodePodNum", e.target.value) })),
              createType === "MANAGED_CLUSTER" ? h("div", { className: "ci-field", key: "ms" }, h("label", null, "集群 Service 上限"), h("input", { value: draft.maxClusterServiceNum, onChange: (e) => set("maxClusterServiceNum", e.target.value) })) : null,
            ] : null,
            createType === "EXTERNAL_CLUSTER" && step === 2 ? [
              h("p", { className: "ci-hint", key: "imp" }, "确认后将先创建注册集群拿到 ClusterId，再调用 DescribeExternalClusterSpec 生成 YAML/注册命令，请在第三方 Kubernetes 集群执行。"),
            ] : null,
            createType === "MANAGED_CLUSTER" && step === 3 ? [
              h("p", { className: "ci-hint", key: "hint" }, "组件可跳过。空集群可以不含 Worker 节点。"),
              h("div", { className: "ci-field", key: "ad" }, h("label", null, "组件（可选，逗号分隔）"), h("input", { value: draft.addons, placeholder: "CBS, COS", onChange: (e) => set("addons", e.target.value) })),
            ] : null,
            step === max ? [
              h("p", { className: "ci-hint", key: "sum" }, `将在 ${region} ${createType === "EXTERNAL_CLUSTER" ? "注册" : "创建"}${CREATE_TYPES.find((x) => x.id === createType)?.title || "集群"}「${draft.clusterName || "-"}」${createType === "EXTERNAL_CLUSTER" ? "" : "，版本 " + draft.clusterVersion}。`),
              h("label", { className: "ci-check", key: "sla" },
                h("input", { type: "checkbox", checked: !!draft.sla, onChange: (e) => set("sla", e.target.checked) }),
                "我已阅读并同意腾讯云 TKE 服务等级协议（SLA）",
              ),
            ] : null,
            h("div", { className: "ci-modal-actions", key: "nav" },
              step > 1 ? h("button", { type: "button", className: "ci-mini", disabled: busy, onClick: () => setStep(step - 1) }, "上一步") : null,
              createType === "MANAGED_CLUSTER" && step === 3 ? h("button", { type: "button", className: "ci-mini", disabled: busy, onClick: () => setStep(4) }, "跳过") : null,
              step < max ? h("button", { type: "button", className: "ci-mini primary", disabled: busy, onClick: () => setStep(step + 1) }, "下一步")
                : h("button", { type: "button", className: "ci-mini primary", disabled: busy || !draft.sla, onClick: submit }, busy ? "提交中" : (createType === "EXTERNAL_CLUSTER" ? "生成导入配置" : "确定创建")),
            ),
          ],
        ),
      ];
    }

    function DeleteWizard({ item, region, onBack, onDone, busy, setBusy, setErr }) {
      const [step, setStep] = useState(1);
      const [retainCbs, setRetainCbs] = useState(true);
      const [mode, setMode] = useState("retain");
      const [riskAck, setRiskAck] = useState(false);
      const protectedOn = (item.badges || []).some((row) => String(row).includes("删除保护"));
      const disableProtection = async () => {
        setBusy(true);
        setErr("");
        try {
          await api("action", {
            moduleId: item.moduleId,
            id: item.id,
            action: "cluster.protection",
            region,
            payload: { region, clusterId: col(item, "集群ID"), enable: false },
          });
        } catch (e) {
          setErr(publicErrorMessage(e));
        } finally {
          setBusy(false);
        }
      };
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
          step === 1 ? [
            h("p", { className: "ci-hint", key: "h1" }, "删除前请先关闭删除保护。若仍存在普通、原生或超级节点，将禁止删除。"),
            h("p", { className: "ci-hint", key: "h2" }, protectedOn ? "当前列表标记为已开启删除保护。" : "若基本信息仍显示删除保护已开启，请先关闭后再继续。"),
            h("button", { type: "button", className: "ci-mini", key: "off", disabled: busy, onClick: disableProtection }, "关闭删除保护"),
          ] : null,
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

    function FormPanel({ title, onClose, children, onSubmit, submitLabel }) {
      return h("div", { className: "ci-form-panel" },
        h("div", { className: "ci-form-title" },
          h("span", null, title),
          h("button", { type: "button", className: "ci-link", onClick: onClose }, "取消"),
        ),
        children,
        onSubmit ? h("div", { className: "ci-modal-actions" },
          h("button", { type: "button", className: "ci-mini primary", onClick: onSubmit }, submitLabel || "提交"),
        ) : null,
      );
    }

    function Field({ label, value, onChange, placeholder }) {
      return h("div", { className: "ci-field" },
        h("label", null, label),
        h("input", { value: value || "", placeholder: placeholder || "", onChange: (e) => onChange(e.target.value) }),
      );
    }

    function ClusterDetail({ item, detail, loading, error, region, skipConfirm, onBack, onReload, onAction }) {
      const [page, setPage] = useState("basic");
      const [nodeQ, setNodeQ] = useState({ ip: "", label: "", unschedulable: "", status: "" });
      const [panel, setPanel] = useState(null);
      const pages = (detail && detail.pages) || SIDEBAR_PAGES;
      const blocks = (detail && detail.blocks) || [];
      const cards = (detail && detail.cards) || {};
      const flags = (detail && detail.flags) || {};
      const patch = (key, value) => setPanel(panel ? { ...panel, [key]: value } : panel);
      const closePanel = () => setPanel(null);
      const nodes = (cards.nodes || []).filter((row) => {
        if (nodeQ.ip && !String((row.columns || []).find((c) => c.label === "IP")?.value || "").includes(nodeQ.ip)) return false;
        if (nodeQ.status && String(row.status || "").toLowerCase() !== nodeQ.status.toLowerCase()) return false;
        if (nodeQ.unschedulable) {
          const locked = row.flags && row.flags.unschedulable;
          if (nodeQ.unschedulable === "yes" && !locked) return false;
          if (nodeQ.unschedulable === "no" && locked) return false;
        }
        if (nodeQ.label) {
          const labels = String(row.flags?.labels || (row.columns || []).find((c) => c.label === "Label")?.value || "");
          if (!labels.toLowerCase().includes(nodeQ.label.toLowerCase())) return false;
        }
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
                h("button", { type: "button", className: "ci-mini", onClick: () => setPanel({ type: "upgrade-master", version: String(flags.kubernetesVersion || "") }) }, "Master 升级"),
                h("button", { type: "button", className: "ci-mini", onClick: () => setPanel({ type: "upgrade-node", version: String(flags.kubernetesVersion || ""), upgradeType: "reset" }) }, "Node 升级"),
                h("button", { type: "button", className: "ci-mini", onClick: () => onAction("cluster.protection", { enable: !flags.deletionProtection }, flags.deletionProtection ? "关闭删除保护？" : "开启删除保护？") }, flags.deletionProtection ? "关闭删除保护" : "开启删除保护"),
              ) : null,
              block.id === "apiserver" ? h("div", { className: "ci-actions" },
                h("button", { type: "button", className: "ci-mini", onClick: () => onAction("cluster.endpoint", { scope: "intranet", enable: !flags.intranet }, flags.intranet ? "关闭内网访问？" : "开启内网访问？") }, flags.intranet ? "关闭内网" : "开启内网"),
                h("button", { type: "button", className: "ci-mini", onClick: () => onAction("cluster.endpoint", { scope: "internet", enable: !flags.internet }, flags.internet ? "关闭外网访问？" : "开启外网访问？") }, flags.internet ? "关闭外网" : "开启外网"),
                flags.kubeconfigAvailable ? h("button", { type: "button", className: "ci-mini primary", onClick: () => onAction("cluster.kubeconfig", {}, "", { copy: true }) }, "复制 kubeconfig") : null,
                flags.kubeconfigAvailable ? h("button", { type: "button", className: "ci-mini", onClick: () => onAction("cluster.kubeconfig", {}, "", { download: true }) }, "下载 kubeconfig") : null,
              ) : null,
            )) : null,
            page === "basic" && panel && panel.type === "upgrade-master" ? h(FormPanel, {
              title: "Master 升级",
              onClose: closePanel,
              submitLabel: "确认升级 Master",
              onSubmit: () => { onAction("cluster.upgrade.master", { version: panel.version }, "确认升级 Master？"); closePanel(); },
            }, h(Field, { label: "目标版本", value: panel.version, onChange: (v) => patch("version", v) })) : null,
            page === "basic" && panel && panel.type === "upgrade-node" ? h(FormPanel, {
              title: "Node 升级",
              onClose: closePanel,
              submitLabel: "确认升级 Node",
              onSubmit: () => { onAction("cluster.upgrade.node", { version: panel.version, upgradeType: panel.upgradeType }, "确认升级 Node？"); closePanel(); },
            }, [
              h(Field, { key: "v", label: "目标版本", value: panel.version, onChange: (v) => patch("version", v) }),
              h("div", { className: "ci-field", key: "m" },
                h("label", null, "升级方式"),
                h("select", { value: panel.upgradeType, onChange: (e) => patch("upgradeType", e.target.value) },
                  h("option", { value: "reset" }, "重装滚动"),
                  h("option", { value: "in-place" }, "原地滚动"),
                ),
              ),
            ]) : null,
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
                h("button", { type: "button", className: "ci-mini", onClick: () => setPanel({ type: "add-existed", instanceIds: "", securityGroupIds: "", loginKeyIds: "", password: "" }) }, "添加已有节点"),
                h("button", { type: "button", className: "ci-mini primary", onClick: () => setPanel({ type: "create-node", instanceType: "", imageId: "", vpcId: "", subnetId: "", securityGroupIds: "", zone: "", instanceCount: "1", instanceChargeType: "POSTPAID_BY_HOUR", loginKeyIds: "", password: "" }) }, "新建节点"),
              ),
              panel && panel.type === "add-existed" ? h(FormPanel, {
                key: "af",
                title: "添加已有节点",
                onClose: closePanel,
                submitLabel: "确认添加",
                onSubmit: () => {
                  onAction("node.addExisted", {
                    instanceIds: panel.instanceIds,
                    securityGroupIds: panel.securityGroupIds,
                    loginKeyIds: panel.loginKeyIds,
                    password: panel.password,
                  }, "确认添加已有节点？");
                  closePanel();
                },
              }, h("div", { className: "ci-form-grid" },
                h(Field, { label: "InstanceId（逗号分隔）", value: panel.instanceIds, onChange: (v) => patch("instanceIds", v), placeholder: "ins-xxxxxxxx" }),
                h(Field, { label: "安全组", value: panel.securityGroupIds, onChange: (v) => patch("securityGroupIds", v), placeholder: "sg-xxxxxxxx" }),
                h(Field, { label: "登录密钥", value: panel.loginKeyIds, onChange: (v) => patch("loginKeyIds", v), placeholder: "skey-xxxxxxxx" }),
                h(Field, { label: "登录密码（无密钥时）", value: panel.password, onChange: (v) => patch("password", v) }),
              )) : null,
              panel && panel.type === "create-node" ? h(FormPanel, {
                key: "cf",
                title: "新建节点",
                onClose: closePanel,
                submitLabel: "确认新建节点",
                onSubmit: () => {
                  onAction("node.create", {
                    instanceType: panel.instanceType,
                    imageId: panel.imageId,
                    vpcId: panel.vpcId,
                    subnetId: panel.subnetId,
                    securityGroupIds: panel.securityGroupIds,
                    zone: panel.zone,
                    instanceCount: Number(panel.instanceCount || 1) || 1,
                    instanceChargeType: panel.instanceChargeType,
                    loginKeyIds: panel.loginKeyIds,
                    password: panel.password,
                  }, "确认新建节点？");
                  closePanel();
                },
              }, h("div", { className: "ci-form-grid" },
                h(Field, { label: "机型", value: panel.instanceType, onChange: (v) => patch("instanceType", v), placeholder: "S5.MEDIUM2" }),
                h(Field, { label: "镜像", value: panel.imageId, onChange: (v) => patch("imageId", v), placeholder: "img-xxxxxxxx" }),
                h(Field, { label: "可用区", value: panel.zone, onChange: (v) => patch("zone", v), placeholder: "ap-guangzhou-3" }),
                h(Field, { label: "VPC", value: panel.vpcId, onChange: (v) => patch("vpcId", v), placeholder: "vpc-xxxxxxxx" }),
                h(Field, { label: "子网", value: panel.subnetId, onChange: (v) => patch("subnetId", v), placeholder: "subnet-xxxxxxxx" }),
                h(Field, { label: "安全组", value: panel.securityGroupIds, onChange: (v) => patch("securityGroupIds", v), placeholder: "sg-xxxxxxxx" }),
                h(Field, { label: "登录密钥", value: panel.loginKeyIds, onChange: (v) => patch("loginKeyIds", v), placeholder: "skey-xxxxxxxx" }),
                h(Field, { label: "登录密码（无密钥时）", value: panel.password, onChange: (v) => patch("password", v) }),
                h(Field, { label: "数量", value: panel.instanceCount, onChange: (v) => patch("instanceCount", v) }),
                h("div", { className: "ci-field" },
                  h("label", null, "计费"),
                  h("select", { value: panel.instanceChargeType, onChange: (e) => patch("instanceChargeType", e.target.value) },
                    h("option", { value: "POSTPAID_BY_HOUR" }, "按量计费"),
                    h("option", { value: "PREPAID" }, "包年包月"),
                  ),
                ),
              )) : null,
              nodes.length ? h("div", { key: "nt", className: "ci-table-wrap" }, h("table", { className: "ci-table" },
                h("thead", null, h("tr", null, h("th", null, "实例 ID"), h("th", null, "IP"), h("th", null, "封锁"), h("th", null, "状态"), h("th", null, "操作"))),
                h("tbody", null, nodes.map((row) => h("tr", { key: row.id },
                  h("td", null, row.id),
                  h("td", null, (row.columns || []).find((c) => c.label === "IP")?.value || "-"),
                  h("td", null, row.flags && row.flags.unschedulable ? "是" : "否"),
                  h("td", null, row.status || "-"),
                  h("td", { className: "ci-ops-cell" }, h("div", { className: "ci-ops" },
                    h("button", { type: "button", className: "ci-link", onClick: () => onAction(row.flags && row.flags.unschedulable ? "node.uncordon" : "node.cordon", { instanceId: row.id, nodeName: row.flags?.nodeName || row.flags?.lanIp || row.id }, row.flags && row.flags.unschedulable ? "取消封锁？" : "封锁该节点？") }, row.flags && row.flags.unschedulable ? "取消封锁" : "封锁"),
                    h("button", { type: "button", className: "ci-link", onClick: () => onAction("node.drain", { instanceId: row.id }, `确定驱逐 ${row.id}？`, { always: true }) }, "驱逐"),
                    h("button", { type: "button", className: "ci-link danger", onClick: () => onAction("node.remove", { instanceId: row.id }, `确定移除 ${row.id}？`, { always: true }) }, "移除"),
                  )),
                ))),
              )) : h("div", { key: "ne", className: "ci-empty" }, "没有节点"),
            ] : null,
            page === "pools" ? [
              h("div", { key: "pa", className: "ci-sec" },
                h("span", { className: "ci-sec-t" }, "节点池名片"),
                h("button", { type: "button", className: "ci-mini primary", onClick: () => setPanel({
                  type: "create-pool",
                  poolType: "Regular",
                  name: "",
                  vpcId: "",
                  subnetId: "",
                  instanceType: "",
                  imageId: "",
                  securityGroupIds: "",
                  desired: "0",
                  instanceChargeType: "POSTPAID_BY_HOUR",
                }) }, "新建节点池"),
              ),
              panel && panel.type === "create-pool" ? h(FormPanel, {
                key: "pf",
                title: "新建节点池",
                onClose: closePanel,
                submitLabel: "确认新建节点池",
                onSubmit: () => {
                  onAction("nodepool.create", {
                    poolType: panel.poolType,
                    name: panel.name,
                    vpcId: panel.vpcId,
                    subnetId: panel.subnetId,
                    subnetIds: panel.subnetId,
                    instanceType: panel.instanceType,
                    instanceTypes: panel.instanceType,
                    imageId: panel.imageId,
                    securityGroupIds: panel.securityGroupIds,
                    desired: Number(panel.desired || 0) || 0,
                    instanceChargeType: panel.instanceChargeType,
                  }, "确认新建节点池？");
                  closePanel();
                },
              }, [
                h("div", { className: "ci-field", key: "t" },
                  h("label", null, "节点类型"),
                  h("select", { value: panel.poolType, onChange: (e) => patch("poolType", e.target.value) },
                    h("option", { value: "Regular" }, "普通节点"),
                    h("option", { value: "Native" }, "原生节点"),
                    h("option", { value: "Super" }, "超级节点"),
                  ),
                ),
                h("div", { className: "ci-form-grid", key: "g" },
                  h(Field, { label: "名称", value: panel.name, onChange: (v) => patch("name", v) }),
                  panel.poolType !== "Super" ? h(Field, { label: "机型", value: panel.instanceType, onChange: (v) => patch("instanceType", v), placeholder: "S5.MEDIUM2" }) : null,
                  panel.poolType === "Regular" ? h(Field, { label: "镜像", value: panel.imageId, onChange: (v) => patch("imageId", v), placeholder: "img-xxxxxxxx" }) : null,
                  panel.poolType === "Regular" ? h(Field, { label: "VPC", value: panel.vpcId, onChange: (v) => patch("vpcId", v), placeholder: "vpc-xxxxxxxx" }) : null,
                  panel.poolType !== "External" ? h(Field, { label: "子网", value: panel.subnetId, onChange: (v) => patch("subnetId", v), placeholder: "subnet-xxxxxxxx" }) : null,
                  h(Field, { label: "安全组", value: panel.securityGroupIds, onChange: (v) => patch("securityGroupIds", v), placeholder: "sg-xxxxxxxx" }),
                  h(Field, { label: "期望节点数", value: panel.desired, onChange: (v) => patch("desired", v) }),
                  h("div", { className: "ci-field" },
                    h("label", null, "计费"),
                    h("select", { value: panel.instanceChargeType, onChange: (e) => patch("instanceChargeType", e.target.value) },
                      h("option", { value: "POSTPAID_BY_HOUR" }, "按量计费"),
                      h("option", { value: "PREPAID" }, "包年包月"),
                    ),
                  ),
                ),
              ]) : null,
              panel && panel.type === "pool-detail" ? h(FormPanel, {
                key: "pd",
                title: "节点池详情 · " + (panel.pool?.title || panel.pool?.id || ""),
                onClose: closePanel,
                submitLabel: isSuperPool(panel.pool) ? "关闭" : "确认调整数量",
                onSubmit: () => {
                  if (isSuperPool(panel.pool)) { closePanel(); return; }
                  onAction("nodepool.scale", {
                    nodePoolId: panel.pool.id,
                    desired: Number(panel.desired || 0),
                    poolType: panel.pool?.flags?.type || "Regular",
                  }, "确认调整数量？");
                  closePanel();
                },
              }, [
                h("p", { className: "ci-hint", key: "id" }, "节点池 ID：" + (panel.pool?.id || "")),
                isSuperPool(panel.pool)
                  ? h("p", { className: "ci-hint", key: "super" }, "超级节点池不按 ASG 期望节点数调整，请修改子网或安全组。")
                  : h(Field, { key: "d", label: "期望节点数", value: panel.desired, onChange: (v) => patch("desired", v) }),
              ]) : null,
              (cards.nodePools || []).length ? h("div", { key: "pg", className: "ci-np-grid" }, (cards.nodePools || []).map((pool) => h("div", { key: pool.id, className: "ci-np-card" },
                h("button", { type: "button", className: "ci-np-id", onClick: () => setPanel({ type: "pool-detail", pool, desired: String(pool.flags?.desired || 0) }) }, pool.id),
                h("div", { className: "ci-head-t" }, pool.title),
                h("div", { className: "ci-hint" }, (pool.badges || []).join(" · ")),
                h("div", { className: "ci-chips" }, (pool.columns || []).map((row) => h("span", { key: row.label, className: "ci-chip" }, row.label, h("b", null, row.value)))),
                h("div", { className: "ci-ops" },
                  isSuperPool(pool) ? null : h("button", { type: "button", className: "ci-link", onClick: () => setPanel({ type: "pool-detail", pool, desired: String(pool.flags?.desired || 0) }) }, "调整数量"),
                  h("button", { type: "button", className: "ci-link", onClick: () => onAction("nodepool.autoscale", { nodePoolId: pool.id, enable: !pool.flags?.autoscaling }, pool.flags?.autoscaling ? "关闭弹性伸缩？" : "开启弹性伸缩？") }, "弹性伸缩"),
                  h("button", { type: "button", className: "ci-link", onClick: () => onAction("nodepool.protection", { nodePoolId: pool.id, enable: !pool.flags?.deletionProtection }, "切换节点池删除保护？") }, "删除保护"),
                  h("button", { type: "button", className: "ci-link danger", onClick: () => onAction("nodepool.delete", { nodePoolId: pool.id }, `删除节点池 ${pool.title}？`, { always: true }) }, "删除"),
                ),
              ))) : h("div", { key: "pe", className: "ci-empty" }, "没有节点池"),
            ] : null,
            page === "namespaces" ? [
              h("div", { key: "ns", className: "ci-sec" },
                h("span", { className: "ci-sec-t" }, "命名空间"),
                h("button", { type: "button", className: "ci-mini primary", onClick: () => setPanel({ type: "create-ns", name: "", cpu: "", memory: "" }) }, "新建"),
              ),
              panel && (panel.type === "create-ns" || panel.type === "quota-ns") ? h(FormPanel, {
                key: "nsf",
                title: panel.type === "quota-ns" ? "更新配额" : "新建命名空间",
                onClose: closePanel,
                submitLabel: panel.type === "quota-ns" ? "确认更新配额" : "确认新建命名空间",
                onSubmit: () => {
                  const quota = {};
                  if (panel.cpu) quota.cpu = panel.cpu;
                  if (panel.memory) quota.memory = panel.memory;
                  onAction(panel.type === "quota-ns" ? "namespace.update" : "namespace.create", { name: panel.name, quota }, panel.type === "quota-ns" ? "确认更新配额？" : "确认新建命名空间？");
                  closePanel();
                },
              }, [
                h(Field, { key: "n", label: "名称", value: panel.name, onChange: (v) => patch("name", v) }),
                h(Field, { key: "c", label: "CPU 配额（可空）", value: panel.cpu, onChange: (v) => patch("cpu", v) }),
                h(Field, { key: "m", label: "内存配额（可空）", value: panel.memory, onChange: (v) => patch("memory", v) }),
              ]) : null,
              (cards.namespaces || []).length ? h("div", { key: "nl", className: "ci-table-wrap" }, h("table", { className: "ci-table" },
                h("thead", null, h("tr", null, h("th", null, "名称"), h("th", null, "状态"), h("th", null, "操作"))),
                h("tbody", null, (cards.namespaces || []).map((row) => h("tr", { key: row.id },
                  h("td", null, row.title),
                  h("td", null, row.status || "-"),
                  h("td", { className: "ci-ops-cell" }, h("div", { className: "ci-ops" },
                    h("button", { type: "button", className: "ci-link", onClick: () => setPanel({ type: "quota-ns", name: row.id, cpu: "", memory: "" }) }, "配额"),
                    h("button", { type: "button", className: "ci-link danger", onClick: () => onAction("namespace.delete", { name: row.id }, `删除命名空间 ${row.title}？`, { always: true }) }, "删除"),
                  )),
                ))),
              )) : h("div", { key: "ne2", className: "ci-empty" }, "没有命名空间"),
            ] : null,
            page === "addons" ? [
              h("div", { key: "as", className: "ci-sec" },
                h("span", { className: "ci-sec-t" }, "组件管理"),
                h("button", { type: "button", className: "ci-mini primary", onClick: () => setPanel({ type: "install-addon", name: "", version: "" }) }, "安装组件"),
              ),
              panel && (panel.type === "install-addon" || panel.type === "upgrade-addon") ? h(FormPanel, {
                key: "adf",
                title: panel.type === "upgrade-addon" ? "升级组件" : "安装组件",
                onClose: closePanel,
                submitLabel: panel.type === "upgrade-addon" ? "确认升级组件" : "确认安装组件",
                onSubmit: () => {
                  onAction(panel.type === "upgrade-addon" ? "addon.upgrade" : "addon.install", { name: panel.name, version: panel.version }, panel.type === "upgrade-addon" ? "确认升级组件？" : "确认安装组件？");
                  closePanel();
                },
              }, [
                h(Field, { key: "n", label: "组件名称", value: panel.name, onChange: (v) => patch("name", v), placeholder: "CBS" }),
                h(Field, { key: "v", label: "版本（可空则最新）", value: panel.version, onChange: (v) => patch("version", v) }),
              ]) : null,
              (cards.addons || []).length ? h("div", { key: "al", className: "ci-table-wrap" }, h("table", { className: "ci-table" },
                h("thead", null, h("tr", null, h("th", null, "组件"), h("th", null, "版本"), h("th", null, "状态"), h("th", null, "操作"))),
                h("tbody", null, (cards.addons || []).map((row) => h("tr", { key: row.id },
                  h("td", null, row.title),
                  h("td", null, (row.columns || []).find((c) => c.label === "版本")?.value || "-"),
                  h("td", null, row.status || "-"),
                  h("td", { className: "ci-ops-cell" }, h("div", { className: "ci-ops" },
                    h("button", { type: "button", className: "ci-link", onClick: () => setPanel({ type: "upgrade-addon", name: row.id, version: "" }) }, "升级"),
                    h("button", { type: "button", className: "ci-link danger", onClick: () => onAction("addon.uninstall", { name: row.id }, `卸载 ${row.title}？`, { always: true }) }, "卸载"),
                  )),
                ))),
              )) : h("div", { key: "ae", className: "ci-empty" }, "没有组件"),
            ] : null,
            page === "rbac" ? [
              h("div", { key: "rs", className: "ci-sec" },
                h("span", { className: "ci-sec-t" }, "授权管理"),
                h("button", { type: "button", className: "ci-mini primary", onClick: () => setPanel({ type: "bind-rbac", user: "", role: "tke:admin" }) }, "绑定角色"),
              ),
              panel && panel.type === "bind-rbac" ? h(FormPanel, {
                key: "rf",
                title: "绑定预设角色",
                onClose: closePanel,
                submitLabel: "确认绑定预设角色",
                onSubmit: () => { onAction("rbac.bind", { user: panel.user, role: panel.role }, "确认绑定预设角色？"); closePanel(); },
              }, [
                h(Field, { key: "u", label: "子账号 UIN / 用户", value: panel.user, onChange: (v) => patch("user", v) }),
                h("div", { className: "ci-field", key: "r" },
                  h("label", null, "预设角色"),
                  h("select", { value: panel.role, onChange: (e) => patch("role", e.target.value) },
                    h("option", { value: "tke:admin" }, "tke:admin"),
                    h("option", { value: "tke:ops" }, "tke:ops"),
                    h("option", { value: "tke:ro" }, "tke:ro"),
                    h("option", { value: "tke:ns-admin" }, "tke:ns-admin"),
                  ),
                ),
              ]) : null,
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
                h("td", null, h("button", { type: "button", className: "ci-link", onClick: () => onAction("policy.toggle", { name: row.id, kind: row.flags?.kind, category: row.flags?.category, enable: !(row.flags && row.flags.enabled), confirmed: true }, row.flags && row.flags.enabled ? "关闭该预置策略？需二次确认。" : "开启该预置策略？", { always: !!(row.flags && row.flags.enabled) }) }, row.flags && row.flags.enabled ? "关闭" : "开启")),
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
      const [region, setRegion] = useState(String(payload?.region || args.region || "ap-guangzhou"));
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
        const target = (opts && opts.item) || session?.item || deleteItem;
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
              onProtect: (item) => {
                setMenuId("");
                requestAction("cluster.protection", { enable: false, clusterId: col(item, "集群ID") }, "关闭删除保护？", { item });
              },
              onDelete: (item) => { setMenuId(""); setDeleteItem(item); setScreen("delete"); },
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

    const CLS_RANGE_OPTIONS = [
      ["15m", "近 15 分钟"],
      ["1h", "近 1 小时"],
      ["4h", "近 4 小时"],
      ["1d", "近 1 天"],
      ["today", "今天"],
      ["yesterday", "昨天"],
      ["custom", "自定义"],
    ];

    const FALLBACK_CLS_REGIONS = [
      { id: "ap-guangzhou", name: "广州", group: "大陆" },
      { id: "ap-beijing", name: "北京", group: "大陆" },
      { id: "ap-shanghai", name: "上海", group: "大陆" },
      { id: "ap-chengdu", name: "成都", group: "大陆" },
      { id: "ap-nanjing", name: "南京", group: "大陆" },
      { id: "ap-chongqing", name: "重庆", group: "大陆" },
      { id: "ap-zhongwei", name: "中卫", group: "大陆" },
      { id: "ap-hongkong", name: "中国香港", group: "港澳台" },
      { id: "ap-taipei", name: "中国台北", group: "港澳台" },
      { id: "ap-singapore", name: "新加坡", group: "海外" },
      { id: "ap-bangkok", name: "曼谷", group: "海外" },
      { id: "ap-tokyo", name: "东京", group: "海外" },
      { id: "ap-seoul", name: "首尔", group: "海外" },
      { id: "ap-jakarta", name: "雅加达", group: "海外" },
      { id: "sa-saopaulo", name: "圣保罗", group: "海外" },
      { id: "eu-frankfurt", name: "法兰克福", group: "海外" },
      { id: "na-siliconvalley", name: "硅谷", group: "海外" },
      { id: "na-ashburn", name: "弗吉尼亚", group: "海外" },
      { id: "me-riyadh", name: "利雅得", group: "海外" },
      { id: "ap-shenzhen-fsi", name: "深圳金融", group: "金融" },
      { id: "ap-shanghai-fsi", name: "上海金融", group: "金融" },
      { id: "ap-beijing-fsi", name: "北京金融", group: "金融" },
      { id: "ap-shanghai-adc", name: "上海自动驾驶云", group: "特殊" },
    ];

    function clsRegionGroups(list) {
      const order = ["大陆", "港澳台", "海外", "金融", "特殊"];
      const src = Array.isArray(list) && list.length ? list : FALLBACK_CLS_REGIONS;
      return order.map((group) => ({ group, items: src.filter((item) => item.group === group) })).filter((row) => row.items.length);
    }

    function clsTopicId(item) {
      return cellValue(item, "主题ID") || String((item && item.id) || "").split(":").pop() || "";
    }

    function looksLikeUuid(value) {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || "").trim());
    }

    function clsRegionName(regions, id) {
      const hit = (Array.isArray(regions) ? regions : []).find((item) => item && item.id === id);
      return hit && hit.name ? hit.name : (id || "");
    }

    function topicCaption(topic, region, regions) {
      const name = topic && topic.title && !looksLikeUuid(topic.title) ? topic.title : "日志主题";
      const logset = cellValue(topic, "日志集");
      return [name, logset || null, clsRegionName(regions, region)].filter(Boolean).join(" · ");
    }

    function keepClsTopic(cur, next) {
      if (!next) return cur;
      if (!cur) return next;
      const keepTitle = cur.title && !looksLikeUuid(cur.title);
      const keepCols = Array.isArray(cur.columns) && cur.columns.length > 1;
      return {
        ...next,
        title: keepTitle ? cur.title : (next.title && !looksLikeUuid(next.title) ? next.title : cur.title),
        columns: keepCols ? cur.columns : (next.columns || cur.columns),
      };
    }

    function histBars(logs) {
      const rows = Array.isArray(logs) ? logs : [];
      if (!rows.length) return Array.from({ length: 12 }, () => 8);
      const times = rows.map((row) => Number(row.timeMs) || 0).filter((n) => n > 0);
      if (!times.length) return Array.from({ length: 12 }, () => 8);
      const min = Math.min(...times);
      const max = Math.max(...times);
      const span = Math.max(1, max - min);
      const buckets = Array.from({ length: 12 }, () => 0);
      for (const t of times) {
        const i = Math.min(11, Math.floor(((t - min) / span) * 12));
        buckets[i] += 1;
      }
      const peak = Math.max(1, ...buckets);
      return buckets.map((n) => Math.max(8, Math.round((n / peak) * 100)));
    }

    function ClsRegionSelect({ value, regions, disabled, onChange }) {
      return h("select", {
        className: "ci-region",
        value: value || "ap-guangzhou",
        disabled,
        "aria-label": "地域",
        onChange: (e) => onChange(e.target.value),
      }, clsRegionGroups(regions).map((group) => h("optgroup", { key: group.group, label: group.group },
        group.items.map((item) => h("option", { key: item.id, value: item.id }, item.name)),
      )));
    }

    function ClsTopicTable({ items, pendingId, onOpen, emptyHint }) {
      const rows = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!rows.length) return h("div", { className: "ci-empty" }, emptyHint || "当前地域没有匹配的日志主题");
      return h("div", { className: "ci-table-scroll" }, h("table", { className: "ci-table" },
        h("thead", null, h("tr", null,
          h("th", null, "日志主题名称/ID"),
          h("th", null, "日志集"),
          h("th", null, "存储类型"),
          h("th", null, "保存时间"),
          h("th", null, "创建时间"),
          h("th", null, "操作"),
        )),
        h("tbody", null, rows.map((item) => h("tr", { key: item.id },
          h("td", null, h("div", { className: "ci-name-stack" },
            h("button", {
              type: "button",
              className: "ci-name",
              disabled: pendingId === item.id,
              onClick: () => onOpen(item),
            }, item.title),
            h("div", { className: "ci-id" }, clsTopicId(item)),
          )),
          h("td", null, cellValue(item, "日志集") || "-"),
          h("td", null, cellValue(item, "存储类型") || "-"),
          h("td", null, cellValue(item, "保存时间") || "-"),
          h("td", null, cellValue(item, "创建时间") || "-"),
          h("td", { className: "ci-ops-cell" }, h("button", {
            type: "button",
            className: "ci-link",
            disabled: pendingId === item.id,
            onClick: () => onOpen(item),
          }, pendingId === item.id ? "加载中" : (item.openLabel || "检索分析"))),
        ))),
      ));
    }

    function ClsCard({ payload, args, fromTool, pageSize, initialQuery }) {
      const provider = String(args.provider || "");
      const startSearch = payload?.view === "search" || Array.isArray(payload?.logs);
      const [region, setRegion] = useState(payload?.region || args.region || "ap-guangzhou");
      const [regions, setRegions] = useState(payload?.regions || FALLBACK_CLS_REGIONS);
      const [view, setView] = useState(startSearch ? "search" : "list");
      const [topic, setTopic] = useState(startSearch ? (fromTool && fromTool[0]) || null : null);
      const [rows, setRows] = useState(fromTool || []);
      const [total, setTotal] = useState(Number(payload?.total) || (fromTool || []).length);
      const [offset, setOffset] = useState(Number(payload?.offset) || 0);
      const [hasMore, setHasMore] = useState(!!payload?.hasMore);
      const [listBusy, setListBusy] = useState(false);
      const [listErr, setListErr] = useState((payload?.errors || []).map((e) => e.message).join("；"));
      const [draftQ, setDraftQ] = useState(initialQuery);
      const [activeQ, setActiveQ] = useState(initialQuery);
      const [cql, setCql] = useState(payload?.queryString || "");
      const [range, setRange] = useState(payload?.range || "1h");
      const [customFrom, setCustomFrom] = useState("");
      const [customTo, setCustomTo] = useState("");
      const [logs, setLogs] = useState(payload?.logs || []);
      const [logContext, setLogContext] = useState(payload?.context || "");
      const [logMore, setLogMore] = useState(!!payload?.hasMore && startSearch);
      const [logBusy, setLogBusy] = useState(false);
      const [pendingId, setPendingId] = useState("");
      const seq = useRef(0);
      const debounce = useRef(0);
      const toolSig = fromTool
        ? `${payload?.view}|${payload?.region}|${Number(payload?.offset) || 0}|${fromTool.map((i) => i.id).join(",")}|${(payload?.logs || []).length}|${payload?.queryString || ""}`
        : "";
      useEffect(() => {
        if (!fromTool && !payload) return;
        setRows(fromTool || []);
        setTotal(Number(payload?.total) || (fromTool || []).length);
        setOffset(Number(payload?.offset) || 0);
        setHasMore(!!payload?.hasMore);
        setDraftQ(initialQuery);
        setActiveQ(initialQuery);
        if (payload?.region) setRegion(payload.region);
        if (payload?.regions) setRegions(payload.regions);
        if (payload?.view === "search" || Array.isArray(payload?.logs)) {
          setView("search");
          setTopic((fromTool && fromTool[0]) || null);
          setLogs(payload?.logs || []);
          setCql(payload?.queryString || "");
          setRange(payload?.range || "1h");
          setLogContext(payload?.context || "");
          setLogMore(!!payload?.hasMore);
        }
        setListErr((payload?.errors || []).map((e) => e.message).join("；"));
      }, [toolSig]);
      useEffect(() => () => { if (debounce.current) clearTimeout(debounce.current); }, []);
      const fetchList = async (nextOffset, q, nextRegion) => {
        const n = ++seq.current;
        const usedRegion = nextRegion || region;
        setListBusy(true);
        setListErr("");
        try {
          const result = await api("query", {
            query: q,
            kind: "cls",
            provider,
            offset: nextOffset,
            limit: pageSize,
            region: usedRegion,
            view: "list",
          });
          if (n !== seq.current) return;
          setRows(result.items || []);
          setTotal(Number(result.total) || (result.items || []).length);
          setHasMore(!!result.hasMore);
          setOffset(Number(result.offset) || nextOffset);
          setActiveQ(q);
          if (result.region) setRegion(result.region);
          if (result.regions) setRegions(result.regions);
          if (result.errors?.length) setListErr(result.errors.map((e) => e.message).join("；"));
        } catch (e) {
          if (n !== seq.current) return;
          setListErr(publicErrorMessage(e));
        } finally {
          if (n === seq.current) setListBusy(false);
        }
      };
      const fetchSearch = async (item, opts) => {
        const n = ++seq.current;
        const used = opts || {};
        const nextCql = used.queryString != null ? used.queryString : cql;
        const nextRange = used.range || range;
        setLogBusy(true);
        setListErr("");
        try {
          const body = {
            kind: "cls",
            provider,
            moduleId: item.moduleId,
            topicId: item.id,
            id: item.id,
            title: item.title,
            region,
            queryString: nextCql,
            range: nextRange,
            context: used.append ? logContext : "",
            limit: used.append ? pageSize : 100,
          };
          if (nextRange === "custom") {
            if (customFrom) body.from = new Date(customFrom).getTime();
            if (customTo) body.to = new Date(customTo).getTime();
          }
          const result = await api("search", body);
          if (n !== seq.current) return;
          const nextLogs = result.logs || [];
          setLogs((cur) => used.append ? cur.concat(nextLogs) : nextLogs);
          setLogContext(result.context || "");
          setLogMore(!!result.hasMore);
          setCql(result.queryString != null ? result.queryString : nextCql);
          setRange(result.range || nextRange);
          if (result.region) setRegion(result.region);
          if (result.items?.[0]) setTopic((cur) => keepClsTopic(cur, result.items[0]));
          if (result.errors?.length) setListErr(result.errors.map((e) => e.message).join("；"));
        } catch (e) {
          if (n !== seq.current) return;
          setListErr(publicErrorMessage(e));
        } finally {
          if (n === seq.current) setLogBusy(false);
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
      const onRegion = (next) => {
        setRegion(next);
        setView("list");
        setTopic(null);
        setLogs([]);
        fetchList(0, String(activeQ || "").trim(), next);
      };
      const openSearch = (item) => {
        setPendingId(item.id);
        setTopic(item);
        setView("search");
        setCql("");
        setRange("1h");
        setLogs([]);
        fetchSearch(item, { queryString: "", range: "1h" }).finally(() => setPendingId(""));
      };
      const counted = Number(total) || rows.length;
      const pages = Math.max(1, Math.ceil(counted / pageSize) || 1);
      const extra = hasMore && offset + rows.length >= counted ? 1 : 0;
      const pageCount = Math.max(pages, Math.floor(offset / pageSize) + 1 + extra);
      const page = Math.floor(offset / pageSize) + 1;
      const fieldNames = Array.from(new Set(logs.flatMap((row) => Object.keys(row.fields || {}))));
      const bars = histBars(logs);
      const regionName = clsRegionName(regions, region);
      if (view === "search" && topic) {
        const hasLogs = logs.length > 0;
        return h("div", { className: "ci-root ci-tool ci-cls" }, h("div", { className: "ci-panel" },
          h("div", { className: "ci-search-bar" },
            h("div", { className: "ci-search-bar-main" },
              h("button", { type: "button", className: "ci-back", onClick: () => { setView("list"); setTopic(null); } }, "返回主题"),
              h("div", { className: "ci-search-meta" },
                h("div", { className: "ci-bar-title" }, "检索分析"),
                h("div", { className: "ci-search-sub", title: topicCaption(topic, region, regions) }, topicCaption(topic, region, regions)),
              ),
            ),
            h("div", { className: "ci-cls-filter" },
              h("span", null, "地域"),
              h(ClsRegionSelect, { value: region, regions, disabled: logBusy, onChange: onRegion }),
            ),
          ),
          h("div", { className: "ci-query" },
            h("div", null,
              h("div", { className: "ci-cls-mode" },
                h("span", { className: "ci-cls-tag on" }, "语句模式"),
                h("span", { className: "ci-cls-tag on" }, "CQL"),
                h("span", { className: "ci-cls-hint" }, "空则查全部"),
              ),
              h("textarea", {
                className: "ci-cql",
                value: cql,
                placeholder: "status:500 OR level:ERROR",
                onChange: (e) => setCql(e.target.value),
              }),
            ),
            h("div", { className: "ci-query-side" },
              h("div", { className: "ci-tiny" }, "日志时间"),
              h("select", {
                className: "ci-region",
                style: { maxWidth: "100%", width: "100%" },
                value: range,
                onChange: (e) => setRange(e.target.value),
              }, CLS_RANGE_OPTIONS.map(([k, n]) => h("option", { key: k, value: k }, n))),
              range === "custom" ? [
                h("input", {
                  key: "from",
                  type: "datetime-local",
                  className: "ci-region",
                  style: { maxWidth: "100%", width: "100%" },
                  value: customFrom,
                  onChange: (e) => setCustomFrom(e.target.value),
                }),
                h("input", {
                  key: "to",
                  type: "datetime-local",
                  className: "ci-region",
                  style: { maxWidth: "100%", width: "100%" },
                  value: customTo,
                  onChange: (e) => setCustomTo(e.target.value),
                }),
              ] : null,
              h("button", {
                type: "button",
                className: "ci-mini primary",
                disabled: logBusy,
                style: { width: "100%", marginTop: "auto" },
                onClick: () => fetchSearch(topic, { queryString: cql, range }),
              }, logBusy ? "检索中" : "检索分析"),
            ),
          ),
          !listErr ? h("div", { className: "ci-cls-dist" },
            h("div", { className: "ci-cls-dist-h" },
              h("span", null, "日志分布"),
              h("span", null, hasLogs ? `${logs.length} 条` : "本页无数据"),
            ),
            h("div", { className: "ci-hist", "aria-hidden": "true" },
              bars.map((hgt, idx) => h("i", { key: idx, style: { height: (hasLogs ? hgt : 8) + "%" } })),
            ),
          ) : null,
          listErr ? h("div", { className: "ci-err" }, listErr) : null,
          h("div", { className: "ci-cls-tabs" },
            h("span", { className: "ci-cls-tab on" }, "原始日志"),
          ),
          logBusy && !hasLogs ? h("div", { className: "ci-load" }, h(Spin), "检索日志…")
            : listErr && !hasLogs ? null
            : !hasLogs ? h("div", { className: "ci-empty ci-empty-search" }, "该时间窗没有匹配日志")
            : h("div", { className: "ci-split" },
            h("div", { className: "ci-fields" },
              h("div", { className: "ci-tiny" }, "字段"),
              ["__SOURCE__"].concat(fieldNames).map((name) => h("button", {
                type: "button",
                key: name,
                onClick: () => {
                  if (name[0] === "_") return;
                  setCql(name + ":");
                },
              }, name)),
            ),
            h("div", { className: "ci-log-pane" }, logs.map((row, idx) => h("div", { className: "ci-log", key: (row.timeMs || 0) + "-" + idx },
              h("div", { className: "ci-log-hd" },
                h("span", null, row.timeLabel || ""),
                h("span", null, row.source || ""),
              ),
              Object.entries(row.fields || {}).map(([k, v]) => h("span", { className: "ci-kv", key: k }, k + ": " + v)),
              h("div", { className: "ci-raw" }, row.content || ""),
            ))),
          ),
          h("div", { className: "ci-foot-note" },
            h("span", null, `原始日志倒排 · ${logs.length} 条`),
            h("span", null, "仅当前对话 · 设置未写"),
          ),
          logMore ? h("div", { className: "ci-footbar" }, h("button", {
            type: "button",
            className: "ci-mini",
            disabled: logBusy,
            onClick: () => fetchSearch(topic, { append: true, queryString: cql, range }),
          }, logBusy ? "拉取中" : "继续拉取")) : null,
        ));
      }
      return h("div", { className: "ci-root ci-tool ci-cls" }, h("div", { className: "ci-panel" },
        h("div", { className: "ci-bar" },
          h("div", { className: "ci-bar-left" },
            h("span", { className: "ci-bar-title" }, "日志主题"),
            h("span", { className: "ci-bar-count" }, `${counted} 条 · ${regionName}`),
          ),
          h("div", { className: "ci-bar-left", style: { flex: "none", alignItems: "center" } },
            h("div", { className: "ci-cls-filter" },
              h("span", null, "地域"),
              h(ClsRegionSelect, { value: region, regions, disabled: listBusy, onChange: onRegion }),
            ),
            h("div", { className: "ci-search-wrap" },
              h(SearchIcon),
              h("input", {
                className: "ci-search",
                type: "search",
                placeholder: "主题名 / ID / 日志集",
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
        listErr ? h("div", { className: "ci-err" }, listErr) : null,
        listBusy ? h("div", { className: "ci-load" }, h(Spin), "加载列表…") : h(ClsTopicTable, {
          items: rows,
          pendingId,
          onOpen: openSearch,
          emptyHint: (activeQ || draftQ) ? `当前地域没有匹配的日志主题` : "当前地域没有匹配的日志主题",
        }),
        h(Pager, {
          total: counted,
          page,
          pages: pageCount,
          busy: listBusy,
          onPage: (next) => fetchList((next - 1) * pageSize, String(activeQ || "").trim()),
        }),
        h("div", { className: "ci-foot-note" },
          h("span", null, "对话卡片 · 不写设置"),
          h("span", null, "点「检索分析」仍在这张卡片里打开"),
        ),
      ));
    }

    const TCR_REGIONS = [
      { id: "ap-guangzhou", label: "广州" },
      { id: "ap-shanghai", label: "上海" },
      { id: "ap-nanjing", label: "南京" },
      { id: "ap-beijing", label: "北京" },
      { id: "ap-chengdu", label: "成都" },
      { id: "ap-chongqing", label: "重庆" },
      { id: "ap-hongkong", label: "中国香港" },
      { id: "ap-singapore", label: "新加坡" },
      { id: "ap-jakarta", label: "雅加达" },
      { id: "ap-bangkok", label: "曼谷" },
      { id: "ap-seoul", label: "首尔" },
      { id: "ap-tokyo", label: "东京" },
      { id: "na-ashburn", label: "弗吉尼亚" },
      { id: "na-siliconvalley", label: "硅谷" },
      { id: "sa-saopaulo", label: "圣保罗" },
      { id: "eu-frankfurt", label: "法兰克福" },
    ];
    const PERSONAL_DOMAIN = "ccr.ccs.tencentyun.com";
    const DIGEST_WARNING = "注意：删除指定版本可能同时删除相同镜像 ID（SHA256）的其它版本。";

    function inferImageRegion(query, fallback) {
      const text = String(query || "");
      const catalog = TCR_REGIONS.slice().sort((a, b) => b.label.length - a.label.length);
      for (const item of catalog) {
        const re = new RegExp(item.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "|" + item.id, "i");
        if (re.test(text)) return item.id;
      }
      if (/香港/.test(text)) return "ap-hongkong";
      return fallback || "ap-guangzhou";
    }

    function normalizeRegions(list) {
      if (!Array.isArray(list) || !list.length) return null;
      const seen = new Set();
      const rows = [];
      for (const item of list) {
        const id = String(item && item.id || "").trim();
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const known = TCR_REGIONS.find((row) => row.id === id);
        rows.push({ id, label: String(item.label || known?.label || id) });
      }
      return rows.length ? rows : null;
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

    function prettyCell(value) {
      const text = String(value == null ? "" : value).trim();
      return !text || text === "-" ? "—" : text;
    }

    function prettyTime(value) {
      const text = prettyCell(value);
      if (text === "—") return text;
      return text.replace(/\s+\+\d{4}(\s+[A-Z]{2,5})?$/, "").replace("T", " ").slice(0, 19);
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
      const [regions, setRegions] = useState(normalizeRegions(payload?.regions) || TCR_REGIONS);
      const [instances, setInstances] = useState(Array.isArray(fromTool) ? fromTool : []);
      const [instanceId, setInstanceId] = useState((fromTool && fromTool[0] && fromTool[0].id) || "");
      const [view, setView] = useState("inst");
      const [nsFilter, setNsFilter] = useState("");
      const [namespaces, setNamespaces] = useState([]);
      const [repos, setRepos] = useState([]);
      const [tags, setTags] = useState([]);
      const [repo, setRepo] = useState(null);
      const [fields, setFields] = useState([]);
      const [draftQ, setDraftQ] = useState("");
      const [busy, setBusy] = useState(false);
      const [err, setErr] = useState(errors.map((e) => e.message).join("；"));
      const [copied, setCopied] = useState("");
      const [confirm, setConfirm] = useState(null);
      const [actBusy, setActBusy] = useState(false);
      const [truncated, setTruncated] = useState(!!payload?.hasMore);
      const seq = useRef(0);
      const debounce = useRef(0);
      const copyTimer = useRef(0);
      const current = (Array.isArray(instances) ? instances : []).find((item) => item && item.id === instanceId) || instances[0];

      const toolSig = `${payload?.region || ""}|${(fromTool || []).map((i) => i.id).join(",")}|${(payload?.errors || []).length}|${args.kind || payload?.resourceKind || ""}`;
      useEffect(() => {
        if (payload?.region) setRegion(payload.region);
        const nextRegions = normalizeRegions(payload?.regions);
        if (nextRegions) setRegions(nextRegions);
        setDraftQ("");
        setErr(errors.map((e) => e.message).join("；"));
        if (fromTool && fromTool.length) {
          setInstances(fromTool);
          if (fromTool[0]?.id) setInstanceId(fromTool[0].id);
          setTruncated(!!payload?.hasMore);
          return;
        }
        loadInstances(payload?.region || region);
      }, [toolSig]);
      useEffect(() => () => {
        if (debounce.current) clearTimeout(debounce.current);
        if (copyTimer.current) clearTimeout(copyTimer.current);
      }, []);

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
          setTruncated(!!result.hasMore);
          const nextRegions = normalizeRegions(result.regions);
          if (nextRegions) setRegions(nextRegions);
          if (result.errors?.length) setErr(result.errors.map((e) => e.message).join("；"));
        } catch (e) {
          if (n !== seq.current) return;
          setErr(publicErrorMessage(e));
          setInstances([]);
          setInstanceId("");
          setTruncated(false);
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
          setTruncated(!!table.hasMore || (Number(table.total) > rows.length));
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
        if (copyTimer.current) clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopied(""), 2800);
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
        const trunc = truncated ? h("div", { key: "trunc", className: "ci-trunc" }, "仅显示前 100 条") : null;
        if (view === "inst") {
          if (!filteredInstances.length) {
            const empty = err
              ? "无法加载实例"
              : (draftQ ? "没有匹配的实例" : "该地域没有实例");
            return h("div", { className: "ci-empty" }, empty);
          }
          return [
            trunc,
            h("div", { key: "grid", className: "ci-grid" }, filteredInstances.map((item) => h("button", {
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
            ))),
          ];
        }
        if (view === "ns") {
          const rows = (namespaces || []).filter((row) => hitKw(draftQ, row.cells?.name, row.cells?.access));
          if (!rows.length) return h("div", { className: "ci-empty" }, "没有匹配的命名空间");
          return [
            trunc,
            h("div", { key: "tb", className: "ci-table-wrap" }, h("table", { className: "ci-table" },
              h("thead", null, h("tr", null, h("th", null, "名称"), h("th", null, "访问级别"))),
              h("tbody", null, rows.map((row) => h("tr", { key: row.id },
                h("td", null, row.cells?.name || row.id),
                h("td", null, h("span", { className: "ci-tag" }, row.cells?.access || "私有")),
              ))),
            )),
          ];
        }
        if (view === "detail") {
          const rows = (tags || []).filter((row) => hitKw(draftQ, row.cells?.version, row.cells?.digest));
          const meta = [...new Set((fields || [])
            .filter((row) => row && row.value && !["仓库", "命名空间", "说明"].includes(row.label))
            .map((row) => row.value))].join(" · ");
          return [
            h("div", { key: "crumb", className: "ci-crumb" },
              h("button", { type: "button", className: "ci-back", onClick: () => { setRepo(null); setDraftQ(""); changeView("repo"); } }, "返回"),
              h("div", { className: "ci-detail-titles" },
                h("div", { className: "ci-head-t" }, repo?.full || "版本管理"),
                meta ? h("div", { className: "ci-detail-meta", title: meta }, meta) : null,
              ),
            ),
            copied ? h("div", { key: "copied", className: "ci-copied" }, h("b", null, "已复制"), h("code", null, copied)) : null,
            trunc,
            rows.length ? h("div", { key: "tb", className: "ci-table-wrap" }, h("table", { className: "ci-table" },
              h("thead", null, h("tr", null,
                h("th", null, "镜像版本"),
                h("th", null, "镜像ID"),
                h("th", null, "大小"),
                h("th", null, "更新时间"),
                h("th", { className: "ci-ops-cell" }, "操作"),
              )),
              h("tbody", null, rows.map((row) => h("tr", { key: row.id },
                h("td", { className: "ci-ver" }, prettyCell(row.cells?.version || row.id)),
                h("td", { className: row.cells?.digest ? "ci-mono" : "ci-muted", title: row.cells?.digest || "" }, prettyCell(row.cells?.digest)),
                h("td", { className: !row.cells?.size || row.cells.size === "0 B" ? "ci-muted" : "" }, prettyCell(row.cells?.size)),
                h("td", null, prettyTime(row.cells?.updated)),
                h("td", { className: "ci-ops-cell" }, h("div", { className: "ci-ops" },
                  h("button", { type: "button", className: "ci-act", onClick: () => copyPull(row.cells?.version || row.id) }, "拉取指令"),
                  h("button", { type: "button", className: "ci-act danger", onClick: () => askDelete(row) }, "删除"),
                )),
              ))),
            )) : h("div", { key: "empty", className: "ci-empty" }, "没有匹配的镜像版本"),
          ];
        }
        const rows = (repos || []).filter((row) => (nsFilter ? row.cells?.namespace === nsFilter : true) && hitKw(draftQ, row.cells?.name, row.cells?.namespace));
        if (!rows.length) return h("div", { className: "ci-empty" }, "没有匹配的仓库");
        return [
          trunc,
          h("div", { key: "tb", className: "ci-table-wrap" }, h("table", { className: "ci-table" },
            h("thead", null, h("tr", null,
              h("th", null, "仓库名称"),
              h("th", null, "命名空间"),
              h("th", null, "类型"),
              h("th", null, "Tag 数"),
              h("th", null, "创建时间"),
              h("th", null, "更新时间"),
            )),
            h("tbody", null, rows.map((row) => h("tr", { key: row.id },
              h("td", null, h("button", { type: "button", className: "ci-link", onClick: () => openRepo(row) }, row.cells?.name || row.id)),
              h("td", null, row.cells?.namespace || ""),
              h("td", null, h("span", { className: "ci-tag" }, row.cells?.access || "私有")),
              h("td", null, row.cells?.tags || "-"),
              h("td", null, prettyTime(row.cells?.created)),
              h("td", null, prettyTime(row.cells?.updated)),
            ))),
          )),
        ];
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
                  (regions.some((item) => item.id === region) ? regions : [{ id: region, label: region }, ...regions]).map((item) => h("option", { key: item.id, value: item.id }, item.label)),
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
          err ? h("div", { className: "ci-err", style: { fontSize: 12, lineHeight: "18px", fontWeight: 400 } }, err) : null,
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
      const kind = String(args.kind || payload?.resourceKind || (payload?.kind && payload.kind !== "cloud-infra-query" ? payload.kind : "") || (payload?.items && payload.items[0] && payload.items[0].kind) || "domain");
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
      const [wizard, setWizard] = useState(null);
      const [wizardBusy, setWizardBusy] = useState(false);
      const [wizardErr, setWizardErr] = useState("");
      const [confirm, setConfirm] = useState(null);
      const [listRegion, setListRegion] = useState("华南地区（广州）");
      const [regionOptions, setRegionOptions] = useState(Array.isArray(payload?.regions) ? payload.regions : []);
      const [kindTab, setKindTab] = useState(kind === "lighthouse" ? "lighthouse" : "cvm");
      const [cart, setCart] = useState([]);
      const [flow, setFlow] = useState("");
      const [orderDraft, setOrderDraft] = useState(null);
      const [orderBusy, setOrderBusy] = useState(false);
      const [orderErr, setOrderErr] = useState("");
      const [orderResult, setOrderResult] = useState(null);
      const [domainConfirm, setDomainConfirm] = useState(null);
      const [region, setRegion] = useState("");
      const [selected, setSelected] = useState({});
      const [moreId, setMoreId] = useState("");
      const [notice, setNotice] = useState("");
      const [listConfirm, setListConfirm] = useState(null);
      const [listBusyAct, setListBusyAct] = useState(false);
      const seq = useRef(0);
      const detailSeq = useRef(0);
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
      const instanceView = kind === "cvm" || kind === "lighthouse" || kind === "auto";
      const tabToKind = (tab) => {
        if (kind === "cvm" || kind === "lighthouse") return kind;
        if (kind === "auto") return tab === "lighthouse" ? "lighthouse" : "cvm";
        return kind;
      };
      useEffect(() => {
        if (!fromTool) return;
        const searchQ = instanceView ? usableInstanceQuery(initialQuery) : initialQuery;
        const tab = kind === "lighthouse" ? "lighthouse" : "cvm";
        const seeded = kind === "auto"
          ? fromTool.filter((row) => row && row.kind === tab)
          : fromTool;
        setRows(seeded);
        setTotal(instanceView ? seeded.length : (Number(payload?.total) || fromTool.length));
        setOffset(instanceView ? 0 : (Number(payload?.offset) || 0));
        setHasMore(instanceView ? false : !!payload?.hasMore);
        setDraftQ(searchQ);
        setActiveQ(searchQ);
        const names = Array.isArray(payload?.regions) ? payload.regions : [];
        setRegionOptions(names);
        setListRegion((cur) => names.includes(cur) ? cur : defaultRegionName(names));
        if (kind === "lighthouse") setKindTab("lighthouse");
        else if (kind === "cvm" || kind === "auto") setKindTab("cvm");
        setListErr("");
      }, [toolSig]);
      useEffect(() => () => { if (debounce.current) clearTimeout(debounce.current); }, []);
      const fetchList = async (nextOffset, q, regionOverride, tab) => {
        const n = ++seq.current;
        const trimmed = String(q || "").trim();
        const useTab = tab || kindTab;
        const useKind = tabToKind(useTab);
        const useRegion = kind === "cdb"
          ? (regionOverride !== undefined ? regionOverride : region)
          : (regionOverride !== undefined ? regionOverride : (trimmed ? "all" : (listRegion || "华南地区（广州）")));
        setListBusy(true);
        setListErr("");
        try {
          const run = (nextKind) => api("query", {
            query: trimmed,
            kind: nextKind,
            provider,
            offset: nextOffset,
            limit: pageSize,
            group: isCert ? (groupRef.current || group || "") : "",
            region: useRegion || undefined,
          });
          let result = await run(useKind);
          if (n !== seq.current) return;
          let items = result.items || [];
          if (trimmed && kind === "auto" && !tab && !items.length) {
            const other = useKind === "cvm" ? "lighthouse" : "cvm";
            const alt = await run(other);
            if (n !== seq.current) return;
            if ((alt.items || []).length) {
              result = alt;
              items = alt.items || [];
              setKindTab(other);
            }
          }
          const warns = (result.errors || []).map((e) => e.message).filter(Boolean).join("；");
          if (kind === "cdb" && warns && !items.length) throw new Error(warns);
          if (kind === "cdb" && warns && items.length) setListErr(warns);
          setRows(items);
          setTotal(Number(result.total) || items.length);
          setHasMore(!!result.hasMore);
          setOffset(Number(result.offset) || nextOffset);
          setActiveQ(trimmed);
          if (Array.isArray(result.regions)) setRegionOptions(result.regions);
        } catch (e) {
          if (n !== seq.current) return;
          setListErr(publicErrorMessage(e));
        } finally {
          if (n === seq.current) setListBusy(false);
        }
      };
      useEffect(() => {
        if (!fromTool || !instanceView || !toolSig) return;
        fetchList(0, instanceView ? usableInstanceQuery(initialQuery) : initialQuery, undefined, kind === "lighthouse" ? "lighthouse" : "cvm");
      }, [toolSig]);
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
        debounce.current = setTimeout(() => runSearch(value), 800);
      };
      const counted = Number(total) || rows.length;
      const pages = Math.max(1, Math.ceil(counted / pageSize) || 1);
      const extra = hasMore && offset + rows.length >= counted ? 1 : 0;
      const pageCount = Math.max(pages, Math.floor(offset / pageSize) + 1 + extra);
      const page = Math.floor(offset / pageSize) + 1;
      const goPage = (next) => fetchList((next - 1) * pageSize, String(activeQ || "").trim());
      const openItem = async (item, tab) => {
        setPendingId(item.id);
        setMoreId("");
        const nextTab = tab || "实例详情";
        const n = ++detailSeq.current;
        const isCdbItem = item.kind === "cdb";
        const isInstance = isInstanceKind(item.kind);
        setSession({ item, loading: true, detail: null, mode: "manage", tab: nextTab, range: "1h" });
        refreshSkip();
        try {
          const detail = await api("detail", {
            moduleId: item.moduleId,
            id: item.id,
            title: item.title,
            region: isCdbItem ? cdbMeta(item).region : item.region,
            tab: (isCdbItem || isInstance) ? nextTab : undefined,
            range: (isCdbItem || isInstance) ? "1h" : undefined,
          });
          if (n !== detailSeq.current) return;
          setSession({ item, loading: false, detail, mode: "manage", tab: nextTab, range: "1h" });
        } catch (e) {
          if (n !== detailSeq.current) return;
          setSession({ item, loading: false, detail: null, error: publicErrorMessage(e), mode: "manage", tab: nextTab, range: "1h" });
        } finally {
          if (n === detailSeq.current) setPendingId("");
        }
      };
      const openLogin = (item, database) => {
        setMoreId("");
        setSession({ item, mode: "dmc", database });
      };
      const reload = async (tab, opts) => {
        if (!session?.item) return;
        const nextTab = tab || session.tab || "实例详情";
        const nextRange = (opts && opts.range) || session.range || "1h";
        const n = ++detailSeq.current;
        const isCdbItem = session.item.kind === "cdb";
        const isInstance = isInstanceKind(session.item.kind);
        setSession((cur) => cur ? { ...cur, loading: true, tab: nextTab, range: nextRange } : cur);
        try {
          const detail = await api("detail", {
            moduleId: session.item.moduleId,
            id: session.item.id,
            title: session.item.title,
            region: isCdbItem ? cdbMeta(session.item).region : session.item.region,
            tab: (isCdbItem || isInstance) ? nextTab : undefined,
            range: (isCdbItem || isInstance) && nextTab === "实例监控" ? nextRange : undefined,
          });
          if (n !== detailSeq.current) return;
          setSession((cur) => cur ? { ...cur, detail, loading: false, error: "", tab: nextTab, range: nextRange } : cur);
        } catch (e) {
          if (n !== detailSeq.current) return;
          setSession((cur) => cur ? { ...cur, loading: false, error: publicErrorMessage(e), tab: nextTab, range: nextRange } : cur);
        }
      };
      const selectedItems = rows.filter((item) => selected[item.id]);
      const runListAction = async (item, action, payload) => {
        setListBusyAct(true);
        try {
          await api("action", {
            moduleId: item.moduleId,
            id: item.id,
            action,
            payload: { region: cdbMeta(item).region, instanceId: item.title, ...payload },
          });
          setListConfirm(null);
          await fetchList(offset, String(activeQ || "").trim());
        } catch (e) {
          setListErr(publicErrorMessage(e));
          setListConfirm(null);
        } finally {
          setListBusyAct(false);
        }
      };
      const askListAction = (item, action, text, payload, always) => {
        setMoreId("");
        setListConfirm({ item, action, text, payload: payload || {}, always: !!always });
      };
      const [powerConfirm, setPowerConfirm] = useState(null);
      const [powerBusy, setPowerBusy] = useState(false);
      const runListPower = async (item, actionId) => {
        setPowerBusy(true);
        try {
          await api("action", {
            moduleId: item.moduleId,
            id: item.id,
            action: actionId,
            payload: { instanceId: item.instanceId, region: item.region },
          });
          setPowerConfirm(null);
          await fetchList(offset, String(activeQ || "").trim());
        } catch (e) {
          setListErr(publicErrorMessage(e));
        } finally {
          setPowerBusy(false);
        }
      };
      const onInstanceAction = async (item, actionId) => {
        let skip = skipConfirm;
        try {
          const d = await api("meta", {});
          skip = !!d.skipConfirm;
          setSkipConfirm(skip);
        } catch { /* keep */ }
        if (skip) return runListPower(item, actionId);
        setPowerConfirm({
          item,
          action: { id: actionId, label: actionLabel(actionId) },
          text: `确认${actionLabel(actionId)} ${item.title}？`,
        });
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
      if (kind === "image") {
        return h(CiBoundary, null, h(ImageToolView, {
          payload,
          args,
          fromTool,
          initialQuery,
        }));
      }
      if (kind === "cls") {
        return h(CiBoundary, null, h(ClsCard, {
          payload,
          args,
          fromTool,
          pageSize,
          initialQuery,
        }));
      }
      if (kind === "cluster") {
        return h(CiBoundary, null, h(ClusterConsole, {
          payload,
          args,
          running,
          skipConfirm,
          onSkipConfirm: setSkipConfirm,
        }));
      }
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
      const payloadErr = errors.map((e) => e && e.message).filter(Boolean).join("；");
      const keepCard = kind === "registrar" || kind === "my-domain";
      if (!isCert && !fromTool?.length && !rows.length && !activeQ && !draftQ && !keepCard) {
        const msg = payloadErr;
        return msg ? h("div", { className: "ci-err" }, msg) : null;
      }
      const extraCols = columnLabels(rows);
      const showProvider = new Set((Array.isArray(rows) ? rows : []).map((item) => item && item.provider)).size > 1;
      const addCart = (item) => {
        if (!canAddCart(item)) return;
        setCart((cur) => {
          if (cur.some((row) => row.title === item.title)) return cur;
          return [...cur, {
            title: item.title,
            price: Number(extraOf(item, "price", 0) || 0),
            id: item.id,
            moduleId: item.moduleId,
          }];
        });
        setOrderErr("");
        setFlow("cart");
      };
      const removeCart = (title) => setCart((cur) => cur.filter((row) => row.title !== title));
      const registrarId = cart[0]?.moduleId || (rows[0] && rows[0].moduleId) || "tencent.registrar";
      const registrarRow = cart[0]?.id || (rows[0] && rows[0].id) || "";
      const maxPeriod = cart.some((row) => /\.co$/.test(row.title) && !/\.com$/.test(row.title)) ? 5 : 10;
      const openSubmit = async () => {
        if (!cart.length) {
          setOrderErr("购物车为空，不能买");
          return;
        }
        setOrderBusy(true);
        setOrderErr("");
        try {
          const result = await api("action", {
            moduleId: registrarId,
            id: registrarRow,
            action: "templates.list",
            payload: {},
          });
          const templates = result.data?.templates || [];
          const picked = templates.find((item) => item.isDefault) || templates[0];
          setOrderDraft({
            period: 1,
            templateId: picked?.templateId || "",
            templates,
            autoRenew: true,
            updateLock: false,
            transferLock: false,
            agree: false,
            agreementUrl: result.data?.agreementUrl || "https://cloud.tencent.com/document/product/242/8458",
          });
          setFlow("submit");
        } catch (e) {
          setOrderErr(publicErrorMessage(e));
          setFlow("cart");
        } finally {
          setOrderBusy(false);
        }
      };
      const orderPayload = () => ({
        domains: cart.map((row) => row.title),
        period: orderDraft?.period || 1,
        templateId: orderDraft?.templateId || "",
        autoRenew: !!orderDraft?.autoRenew,
        updateLock: !!orderDraft?.updateLock,
        transferLock: !!orderDraft?.transferLock,
        agree: !!orderDraft?.agree,
      });
      const goReview = async () => {
        if (!orderDraft?.agree) {
          setOrderErr("未勾选协议，不能提交订单");
          return;
        }
        setOrderBusy(true);
        setOrderErr("");
        try {
          const result = await api("action", {
            moduleId: registrarId,
            id: registrarRow,
            action: "order.preview",
            payload: orderPayload(),
          });
          setOrderDraft({ ...orderDraft, preview: result.data, agree: true });
          setFlow("review");
        } catch (e) {
          setOrderErr(publicErrorMessage(e));
        } finally {
          setOrderBusy(false);
        }
      };
      const pay = async () => {
        setOrderBusy(true);
        setOrderErr("");
        try {
          const result = await api("action", {
            moduleId: registrarId,
            id: registrarRow,
            action: "order.create",
            payload: { ...orderPayload(), agree: true },
          });
          setOrderResult(result.data || { statusLabel: "已提交" });
          setCart([]);
          setFlow("status");
        } catch (e) {
          setOrderErr(publicErrorMessage(e));
        } finally {
          setOrderBusy(false);
        }
      };
      const refreshStatus = async () => {
        if (!orderResult?.logId) return;
        setOrderBusy(true);
        setOrderErr("");
        try {
          const result = await api("action", {
            moduleId: registrarId,
            id: registrarRow,
            action: "order.status",
            payload: { logId: orderResult.logId },
          });
          setOrderResult(result.data || orderResult);
        } catch (e) {
          setOrderErr(publicErrorMessage(e));
        } finally {
          setOrderBusy(false);
        }
      };
      const runDomainAction = async () => {
        if (!domainConfirm) return;
        setOrderBusy(true);
        setOrderErr("");
        try {
          await api("action", {
            moduleId: domainConfirm.item.moduleId,
            id: domainConfirm.item.id,
            action: domainConfirm.action.id,
            payload: domainConfirm.payload,
          });
          setDomainConfirm(null);
          await fetchList(offset, String(activeQ || "").trim());
        } catch (e) {
          setOrderErr(publicErrorMessage(e));
        } finally {
          setOrderBusy(false);
        }
      };
      const emptyHint = kind === "registrar"
        ? ((activeQ || draftQ) ? `没有匹配「${activeQ || draftQ}」的资源` : "请输入域名后查询")
        : ((activeQ || draftQ) ? `没有匹配「${activeQ || draftQ}」的资源` : "没有资源");
      const seed = fromTool || [];
      const registrarView = kind === "registrar" || kind === "my-domain";
      const showCvm = !registrarView && (kind === "cvm" || kind === "auto"
        || seed.some((row) => row && row.kind === "cvm")
        || rows.some((row) => row && row.kind === "cvm"));
      const showLh = !registrarView && (kind === "lighthouse" || kind === "auto"
        || seed.some((row) => row && row.kind === "lighthouse")
        || rows.some((row) => row && row.kind === "lighthouse"));
      const showCdb = !registrarView && kind === "cdb";
      const showCert = kind === "cert";
      const showDomain = kind === "domain" || registrarView
        || (kind !== "cvm" && kind !== "lighthouse" && kind !== "auto" && kind !== "cdb" && kind !== "cert" && kind !== "cluster" && kind !== "cos" && !showCvm && !showLh && !showCdb && !showCert);
      const cvmRows = rows.filter((row) => row && row.kind === "cvm");
      const lhRows = rows.filter((row) => row && row.kind === "lighthouse");
      const domainRows = rows.filter((row) => row && !isInstanceKind(row.kind));
      const isCdb = kind === "cdb" || (!!session && session.item && session.item.kind === "cdb");
      const detailNode = session
        ? (session.mode === "dmc"
          ? h(DmcWorkbench, {
            item: session.item,
            skipConfirm,
            initialDb: session.database,
            onBack: () => setSession(null),
            onSkipConfirm: setSkipConfirm,
          })
          : isCdb
            ? h(CdbManageView, {
              item: session.item,
              detail: session.detail,
              loading: session.loading,
              error: session.error,
              skipConfirm,
              tab: session.tab || "实例详情",
              onTab: (name) => reload(name),
              onBack: () => setSession(null),
              onReload: reload,
              onSkipConfirm: setSkipConfirm,
              onLogin: (item, database) => openLogin(item, database),
            })
          : isInstanceKind(session.item.kind)
          ? h(InstanceDetailView, {
            item: session.item,
            detail: session.detail,
            loading: session.loading,
            error: session.error,
            skipConfirm,
            tab: session.tab || "实例详情",
            onTab: (name) => reload(name),
            onBack: () => setSession(null),
            onReload: reload,
            onSkipConfirm: setSkipConfirm,
          })
          : session.item.kind === "my-domain"
            ? h(OwnedDetailView, {
              item: session.item,
              detail: session.detail,
              loading: session.loading,
              error: session.error,
              onBack: () => setSession(null),
              onReload: reload,
            })
            : h(DetailView, {
              item: session.item,
              detail: session.detail,
              loading: session.loading,
              error: session.error,
              skipConfirm,
              onBack: () => setSession(null),
              onReload: reload,
              onSkipConfirm: setSkipConfirm,
              onCertAction: runCertAction,
            }))
        : null;
      const certList = !session && showCert ? [

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
      ] : null;
      const certDialogs = [
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
          })
      ];
      const cdbMore = [
        { id: "protect", label: (item) => destroyProtectOn(item) ? "关闭实例销毁保护" : "开启实例销毁保护", onClick: (item) => {
          const on = destroyProtectOn(item);
          askListAction(item, "instance.protect", on ? "确认关闭实例销毁保护？" : "确认开启实例销毁保护？", { enable: !on });
        } },
        { id: "destroy", label: "销毁实例", danger: true, onClick: (item) => askListAction(item, "instance.destroy", `确定销毁实例 ${item.title}？此操作不可撤销。`, {}, true) },
      ];
      const cdbList = !session && showCdb ? [
        h("div", { key: "bar", className: "ci-bar" },
          h("div", { className: "ci-bar-left" },
            h("span", { className: "ci-bar-title" }, "云数据库 MySQL"),
            h("span", { className: "ci-bar-count" }, `${counted} 条`),
          ),
          h("div", { className: "ci-tools" },
            h("select", {
              className: "ci-sel",
              value: region,
              onChange: (e) => {
                const next = e.target.value;
                setRegion(next);
                fetchList(0, String(activeQ || draftQ || "").trim(), next);
              },
            },
              h("option", { value: "" }, "全部地域"),
              CDB_REGIONS.map((row) => h("option", { key: row.id, value: row.id }, row.name)),
            ),
            h("button", { key: "reb", type: "button", className: "ci-mini", onClick: () => {
              const target = selectedItems[0];
              if (!target) return setNotice("请先选择实例");
              askListAction(target, "instance.restart", `确认重启实例 ${target.title}？`);
            } }, "重启"),
            h(SearchField, {
              value: draftQ,
              onChange: onDraft,
              onSubmit: runSearch,
              placeholder: "实例 ID / 实例名 / 内网 IP",
            }),
          ),
        ),
        listErr ? h("div", { key: "lerr", className: "ci-err" }, listErr) : null,
        listBusy ? h("div", { key: "load", className: "ci-load" }, h(Spin), "加载列表…") : h(CdbTable, {
          key: "cdb-table",
          items: rows,
          pendingId,
          selected,
          moreId,
          moreMenus: cdbMore,
          onToggle: (item) => setSelected((cur) => ({ ...cur, [item.id]: !cur[item.id] })),
          onLogin: openLogin,
          onManage: (item) => openItem(item),
          onMore: (item) => setMoreId((cur) => cur === item.id ? "" : item.id),
        }),
        h(Pager, {
          key: "pager",
          total: counted,
          page,
          pages: pageCount,
          busy: listBusy,
          onPage: goPage,
        }),
        h(NoticeDialog, {
          key: "notice",
          open: !!notice,
          title: "说明",
          text: notice,
          onClose: () => setNotice(""),
        }),
        h(ConfirmDialog, {
          key: "lconfirm",
          open: !!listConfirm,
          title: listConfirm?.action === "instance.destroy" ? "销毁实例" : "确认",
          text: listConfirm?.text,
          busy: listBusyAct,
          danger: !!listConfirm?.always,
          onCancel: () => { if (!listBusyAct) setListConfirm(null); },
          onConfirm: () => listConfirm && runListAction(listConfirm.item, listConfirm.action, listConfirm.payload),
        }),
      ] : null;
      const instanceList = !session && (showCvm || showLh) ? [
        h(KindTabs, {
          key: "ktabs",
          showCvm,
          showLh,
          value: kindTab,
          onChange: (next) => {
            setKindTab(next);
            fetchList(0, String(activeQ || "").trim(), undefined, next);
          },
        }),
        listErr ? h("div", { key: "lerr", className: "ci-err" }, listErr) : null,
        errors.length ? h("div", { key: "perr", className: "ci-err" }, errors.map((e) => e.message).join("；")) : null,
        [
          showCvm && (!showLh || kindTab === "cvm") ? h(CvmConsole, {
            key: "cvm",
            items: kind === "cvm" ? rows : cvmRows,
            pendingId,
            onOpen: openItem,
            onAction: onInstanceAction,
            emptyHint: (activeQ || draftQ) ? `没有匹配「${activeQ || draftQ}」的实例` : "没有匹配的实例",
            region: listRegion || defaultRegionName(regionOptions),
            regions: regionOptions,
            onRegion: (next) => {
              setListRegion(next);
              fetchList(0, String(activeQ || "").trim(), next);
            },
            q: draftQ,
            onQuery: onDraft,
            onSubmit: runSearch,
            busy: listBusy,
          }) : null,
          showLh && (!showCvm || kindTab === "lighthouse") ? h(LhConsole, {
            key: "lh",
            items: kind === "lighthouse" ? rows : lhRows,
            pendingId,
            onOpen: openItem,
            onAction: onInstanceAction,
            emptyHint: (activeQ || draftQ) ? `没有匹配「${activeQ || draftQ}」的实例` : "没有资源",
            region: listRegion || defaultRegionName(regionOptions),
            regions: regionOptions,
            onRegion: (next) => {
              setListRegion(next);
              fetchList(0, String(activeQ || "").trim(), next);
            },
            q: draftQ,
            onQuery: onDraft,
            onSubmit: runSearch,
            busy: listBusy,
          }) : null,
        ],
        !listBusy ? h(Pager, {
          key: "pager",
          total: counted,
          page,
          pages: pageCount,
          busy: listBusy,
          onPage: goPage,
        }) : null,
        h(ConfirmDialog, {
          key: "power",
          open: !!powerConfirm,
          title: powerConfirm?.action?.label,
          text: powerConfirm?.text,
          busy: powerBusy,
          danger: false,
          onCancel: () => { if (!powerBusy) setPowerConfirm(null); },
          onConfirm: () => powerConfirm && runListPower(powerConfirm.item, powerConfirm.action.id),
        }),
      ] : null;
      const domainTable = kind === "registrar"
        ? h(RegistrarTable, {
          key: "table",
          items: rows,
          pendingId,
          cartTitles: cart.map((row) => row.title),
          onAdd: addCart,
          emptyHint,
        })
        : kind === "my-domain"
          ? h(MyDomainTable, {
            key: "table",
            items: rows,
            pendingId,
            busyId: orderBusy && domainConfirm ? domainConfirm.item.id : "",
            onOpen: openItem,
            onToggleRenew: (item, next) => setDomainConfirm({
              item,
              action: { id: "autorenew.set", label: "自动续费", confirm: "always" },
              payload: {
                domainId: extraOf(item, "domainId", String(item.id).split(":").pop()),
                autoRenew: next,
              },
              text: next
                ? `确认开启 ${item.title} 自动续费？将按续费价格从账户余额扣费。`
                : `确认关闭 ${item.title} 自动续费？`,
            }),
            emptyHint,
          })
          : h(ResourceTable, {
            key: "table",
            items: kind === "domain" ? rows : domainRows,
            pendingId,
            onOpen: openItem,
            extraCols,
            showProvider,
            emptyHint,
          });
      const domainList = !session && showDomain ? [
        h("div", { key: "bar", className: "ci-bar" },
          h("div", { className: "ci-bar-left" },
            h("span", { className: "ci-bar-title" }, barTitleOf(kind)),
            h("span", { className: "ci-bar-count" }, `${counted} 条`),
            kind === "registrar" ? h("button", {
              type: "button",
              className: "ci-link",
              onClick: () => { setOrderErr(""); setFlow("cart"); },
            }, `购物车${cart.length ? `(${cart.length})` : ""}`) : null,
          ),
          h(SearchField, {
            value: draftQ,
            onChange: onDraft,
            onSubmit: runSearch,
            placeholder: searchPlaceholderOf(kind),
          }),
        ),
        listErr ? h("div", { key: "lerr", className: "ci-err" }, listErr) : null,
        orderErr && !flow ? h("div", { key: "oerr", className: "ci-err" }, orderErr) : null,
        h(ListPane, { key: "body", busy: listBusy }, domainTable),
        !listBusy ? h(Pager, {
          key: "pager",
          total: counted,
          page,
          pages: pageCount,
          busy: listBusy,
          onPage: goPage,
        }) : null,
      ] : null;
      return h(CiBoundary, null, h("div", { className: "ci-root ci-tool" },
        h("div", { className: "ci-panel" },
          detailNode || cdbList || instanceList || certList || domainList,
        ),
        ...(certDialogs || []),
        h(CheckoutWizard, {
          flow,
          items: cart,
          draft: orderDraft,
          setDraft: setOrderDraft,
          cart,
          result: orderResult,
          busy: orderBusy,
          err: orderErr,
          maxPeriod,
          onClose: () => { if (!orderBusy) setFlow(""); },
          onRemove: removeCart,
          onBuy: openSubmit,
          onBackCart: () => { if (!orderBusy) { setFlow("cart"); setOrderErr(""); } },
          onNext: goReview,
          onBackSubmit: () => { if (!orderBusy) { setFlow("submit"); setOrderErr(""); } },
          onPay: pay,
          onRefresh: refreshStatus,
        }),
        h(ConfirmDialog, {
          open: !!domainConfirm,
          title: domainConfirm?.action?.label,
          text: domainConfirm?.text,
          busy: orderBusy,
          danger: false,
          onCancel: () => { if (!orderBusy) setDomainConfirm(null); },
          onConfirm: runDomainAction,
        }),
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
              h("span", { className: "ci-cfg-d" }, "配置各云厂商 AccessKey，查询域名与解析记录、云服务器、云数据库、对象存储与 TKE 集群。地域在资源列表中选择，不写入设置。TKE 列表默认广州。"),
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

    return { inject, apply, SearchToolView, ConfigCard, __monitorInternals: { buildMonitorSeriesMap, MonitorPanel, MonitorChart } };
  },
});
