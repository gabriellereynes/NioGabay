<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout><NuxtPage /></NuxtLayout>
</template>

<style>
:root {
  --ink: #17252f;
  --muted: #6f7d83;
  --line: #e3e9e9;
  --paper: #f5f8f7;
  --card: #ffffff;
  --teal: #087f82;
  --teal-dark: #075b63;
  --yellow: #e5a900;
  --orange: #e47728;
  --red: #d34b4b;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--paper); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
button, input, textarea, select { font: inherit; }
button, a { -webkit-tap-highlight-color: transparent; }
a { color: inherit; text-decoration: none; }
.admin-frame { min-height: 100vh; display: flex; }
.sidebar { width: 250px; flex: 0 0 250px; background: var(--teal-dark); color: #eafffa; padding: 28px 18px 20px; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 800; letter-spacing: -.03em; padding: 0 10px 42px; }
.brand-mark { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 10px; background: #d7f0e2; color: var(--teal-dark); }
.brand-dot { color: #f6cc67; }
.role-label, .eyebrow { color: var(--muted); font-size: 10px; font-weight: 800; letter-spacing: .14em; }
.role-label { color: #9dcac0; padding: 0 12px 10px; }
.nav-list { display: grid; gap: 4px; }
.nav-link { color: #c4e0d9; padding: 11px 12px; border-radius: 9px; font-size: 14px; }
.nav-link:hover, .nav-link.active { background: rgba(255,255,255,.13); color: #fff; }
.sidebar-footer { margin-top: auto; border-top: 1px solid rgba(255,255,255,.16); padding: 18px 8px 0; display: flex; gap: 10px; align-items: center; font-size: 12px; }
.sidebar-footer small { color: #a9cec5; display: block; margin-top: 3px; }
.avatar { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: #e6bf66; color: var(--teal-dark); font-weight: 800; }
.admin-main { flex: 1; min-width: 0; }
.topbar { background: var(--card); border-bottom: 1px solid var(--line); padding: 25px clamp(22px, 4vw, 52px); display: flex; justify-content: space-between; align-items: center; gap: 20px; }
h1, h2, h3, p { margin: 0; }
h1 { font-size: 25px; margin-top: 6px; letter-spacing: -.04em; }
h2 { font-size: 20px; letter-spacing: -.03em; margin-top: 6px; }
h3 { font-size: 16px; }
.connection { color: var(--muted); font-size: 12px; white-space: nowrap; }
.status-dot { display: inline-block; width: 8px; height: 8px; background: #51ad7a; border-radius: 50%; margin-right: 6px; }
.page-content { max-width: 1500px; margin: 0 auto; padding: 30px clamp(22px, 4vw, 52px) 60px; display: grid; gap: 22px; }
.metric-grid, .content-grid, .two-column, .card-grid { display: grid; gap: 18px; }
.metric-grid { grid-template-columns: 1.35fr 1fr 1fr; }
.content-grid { grid-template-columns: 1.6fr 1fr; }
.two-column { grid-template-columns: minmax(300px, .75fr) 1.25fr; align-items: start; }
.card-grid { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.metric-card, .panel { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 24px; box-shadow: 0 3px 14px rgba(14, 54, 53, .035); }
.metric-card.primary { background: var(--teal); color: white; border-color: var(--teal); }
.primary .eyebrow { color: #a9ded3; }
.metric-value { font-size: clamp(36px, 5vw, 58px); font-weight: 750; letter-spacing: -.06em; margin: 12px 0; }
.metric-value small { font-size: 17px; letter-spacing: 0; }
.metric-title { font-size: 19px; font-weight: 700; margin: 14px 0 8px; }
.metric-card p, .info-card p, .form-panel p { color: var(--muted); font-size: 13px; line-height: 1.5; }
.metric-meta, .item-between, .page-intro, .panel-heading { display: flex; justify-content: space-between; align-items: center; gap: 14px; }
.metric-meta { font-size: 11px; color: #cae7dd; flex-wrap: wrap; }
.panel-heading { margin-bottom: 22px; }
.panel-heading select { width: auto; }
.level-pill, .tag { border-radius: 999px; padding: 5px 9px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; display: inline-block; }
.level-normal { background: #d9f0e2; color: #2b7958; }
.level-yellow { background: #fff0be; color: #8c6500; }
.level-evacuation { background: #ffe2aa; color: #996200; }
.level-orange { background: #ffe1d1; color: #a94b1c; }
.level-red { background: #ffdbdb; color: #ad3636; }
.tag { background: #eef2f1; color: #5e6f73; }
.online-label { color: #388a61; font-size: 12px; font-weight: 700; }
.online-label.offline, .offline-label { color: #bd4d4d; }
.offline-notice, .draft-note, .error-notice { padding: 15px 18px; border-radius: 10px; font-size: 13px; }
.offline-notice { background: #fff0d6; border: 1px solid #f1d49e; color: #7e580d; }
.draft-note { background: #e9f1ef; border: 1px solid #cfdfda; color: #416a69; }
.error-notice { background: #ffdddd; color: #9b3131; border: 1px solid #efb4b4; }
.chart-wrap { height: 265px; position: relative; border-bottom: 1px solid var(--line); border-left: 1px solid var(--line); padding: 12px 10px 0; overflow: hidden; }
.bars { height: 100%; display: flex; align-items: flex-end; gap: 3px; position: relative; z-index: 1; }
.bar { flex: 1; min-width: 2px; max-width: 14px; border-radius: 3px 3px 0 0; background: linear-gradient(180deg, #39a89b, #0b7377); opacity: .8; }
.threshold { position: absolute; left: 0; right: 0; border-top: 1px dashed #c3cccc; z-index: 2; font-size: 9px; color: #879797; }
.threshold span { position: absolute; right: 2px; top: -15px; background: white; padding: 1px 3px; }
.chart-legend { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 14px; color: var(--muted); font-size: 10px; }
.chart-legend span:first-child { color: var(--teal); font-weight: 700; }
.level-list, .alert-list, .report-list { display: grid; gap: 4px; }
.level-row, .alert-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #edf1f0; }
.level-row:last-child, .alert-row:last-child { border-bottom: 0; }
.level-row div, .alert-copy { flex: 1; min-width: 0; }
.level-row strong, .alert-copy strong { font-size: 13px; display: block; }
.level-row small, .alert-copy small, .report-item small, table small { display: block; color: var(--muted); font-size: 11px; margin-top: 4px; }
.level-row b { font-size: 14px; }
.level-dot { width: 10px; height: 10px; min-width: 10px; border-radius: 50%; background: #9db1ad; }
.level-dot.level-yellow { background: var(--yellow); }.level-dot.level-evacuation { background: #e99f22; }.level-dot.level-orange { background: var(--orange); }.level-dot.level-red { background: var(--red); }
.alert-copy p { margin: 4px 0; color: #53646a; font-size: 13px; }
.acknowledged { color: #609080; font-size: 11px; white-space: nowrap; }
.button { border: 0; border-radius: 8px; padding: 10px 14px; font-weight: 700; font-size: 12px; cursor: pointer; }
.button:disabled { cursor: not-allowed; opacity: .55; }.button.primary-button { background: var(--teal); color: white; }.button.secondary { background: #edf4f1; color: var(--teal-dark); }
.text-link { color: var(--teal); font-size: 12px; font-weight: 700; }
.form-panel form { display: grid; gap: 15px; margin-top: 20px; }
label { display: grid; gap: 6px; color: #43565a; font-size: 12px; font-weight: 700; }
input, textarea, select { width: 100%; border: 1px solid #d5e0de; border-radius: 7px; padding: 10px; color: var(--ink); background: white; outline: none; }
input:focus, textarea:focus, select:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(8,127,130,.1); }
textarea { min-height: 70px; resize: vertical; }.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.report-item { padding: 14px 0; border-bottom: 1px solid #edf1f0; }.report-item p { color: #52646a; font-size: 13px; margin-top: 7px; line-height: 1.5; }
.phone { color: var(--teal); font-weight: 800; display: block; margin: 20px 0 8px; }.info-card { min-height: 145px; }
.page-intro { align-items: end; }.page-intro p { color: var(--muted); margin-top: 7px; font-size: 13px; }
.table-wrap { overflow-x: auto; } table { width: 100%; border-collapse: collapse; font-size: 13px; } th, td { padding: 14px 10px; text-align: left; border-bottom: 1px solid #edf1f0; } th { color: var(--muted); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; }
.swal-form { display: grid; gap: 7px; text-align: left; }.swal-form label { font-size: 12px; color: var(--muted); }.swal-form .swal2-input, .swal-form .swal2-textarea { width: 100%; margin: 0 0 8px; }.swal-summary { text-align: left; font-size: 13px; line-height: 1.5; }.swal-summary p { margin: 8px 0; }
@media (max-width: 900px) { .sidebar { width: 205px; flex-basis: 205px; }.metric-grid, .content-grid, .two-column { grid-template-columns: 1fr; } }
@media (max-width: 620px) { .admin-frame { display: block; }.sidebar { width: 100%; padding: 14px; }.brand { padding-bottom: 16px; }.role-label { display: none; }.nav-list { display: flex; overflow-x: auto; }.nav-link { white-space: nowrap; }.sidebar-footer { display: none; }.topbar { padding: 20px; }.connection { display: none; }.page-content { padding: 20px 14px 40px; }.metric-card, .panel { padding: 18px; }.form-row { grid-template-columns: 1fr; }.page-intro { align-items: start; flex-direction: column; } }
</style>