(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const d of r.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&a(d)}).observe(document,{childList:!0,subtree:!0});function o(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function a(s){if(s.ep)return;s.ep=!0;const r=o(s);fetch(s.href,r)}})();const S="data/dashboard-stats.json";function $(e){if(e==null||typeof e!="object")return!1;const t=e;return typeof t.generatedAt=="string"&&typeof t.wetRun=="object"&&typeof t.typingLanguage=="object"&&typeof t.fiction=="object"&&typeof t.meta=="object"&&typeof t.meta.schemaVersion=="number"}async function A(){try{const e=await fetch(S,{cache:"no-cache"});if(!e.ok)return console.warn(`[dashboard] stats fetch failed: ${e.status} ${e.statusText}`),null;const t=await e.json();return $(t)?t:(console.warn("[dashboard] stats validation failed"),null)}catch(e){return console.warn(`[dashboard] stats load error: ${e.message}`),null}}function i(e){return e==null?"—":e.toLocaleString("en-US")}function L(e){return e==null?"—":`${e}%`}function u(e){return e??"—"}function R(e){return`
    <section class="hero" aria-label="Dashboard header">
      <h1>
        <span class="accent-r">🌆 Wet Run</span>
        <span class="separator">·</span>
        <span class="accent-t">⌨ LingoType</span>
      </h1>
      <div class="tag">Projects Hub — Game/ Dashboard · 깁슨 스프롤 + 다국어 타이핑</div>
      <pre class="ascii" aria-hidden="true">
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  ░  ◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢◣◢  ░
  ░  ░▒▓█ Two projects, one workspace. Built in Sprawl.   ▓▒░  ░
  ░  ░▒▓█ The sky was the color of TV, tuned to a dead    ▓▒░  ░
  ░  ░▒▓█ channel. But the words typed back, in 4 tongues. ▓▒░  ░
  ░  ░▒▓█   — inspired by William Gibson, 1984            ▓▒░  ░
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
      </pre>
      <div class="last-updated">Last updated: <code>${u(e)}</code></div>
    </section>
  `}function m(e){const{slug:t,icon:o,name:a,subtitle:s,description:r,accentClass:d,href:f,stats:w,subDashboards:y}=e,k=w.map(l=>`
    <div class="stat">
      <div class="label">${n(l.label)}</div>
      <div class="value" data-stat="${t}-${t==="wet-run"?"r":"t"}-${n(l.label.toLowerCase().replace(/\s+/g,"-"))}">${n(l.value)}</div>
      <div class="sub">${n(l.sub)}</div>
    </div>
  `).join(""),_=y.map(l=>`<a class="sub-tag" href="${n(l.href)}">${n(l.label)}</a>`).join("");return`
    <a class="project-card ${d}" href="${n(f)}" aria-label="Open ${n(a)} dashboard">
      <div class="icon-row">
        <div class="icon" aria-hidden="true">${o}</div>
        <div>
          <h3 class="project-name">${n(a)}</h3>
          <div class="project-sub">${n(s)}</div>
        </div>
      </div>
      <div class="desc">${n(r)}</div>
      <div class="stat-grid">${k}</div>
      <div class="sub-dashboards">${_}</div>
      <div class="arrow" aria-hidden="true">→</div>
    </a>
  `}function n(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function T(e){return`
    <h2>📈 Combined Overview (통합 통계)</h2>
    <div class="stats-panel">
      <div class="stats-row">${[{label:"Wet Run Tests",value:e.wetRunTests,sub:"passing",cls:"roguelike"},{label:"Wet Run Story Lines",value:e.wetRunStoryLines,sub:"dialogues",cls:"roguelike"},{label:"LingoTypes",value:e.typingLanguages,sub:"supported",cls:"typing"},{label:"Typing Corpus",value:e.typingCorpus,sub:"words/phrases",cls:"typing"},{label:"Last sync",value:e.lastSync,sub:e.lastSyncSub,cls:"",small:!0}].map(a=>`
    <div class="item ${a.cls}">
      <div class="label">${b(a.label)}</div>
      <div class="value"${a.small?' style="font-size: 14px; color: var(--text-secondary);"':""}>${b(a.value)}</div>
      <div class="sub">${b(a.sub)}</div>
    </div>
  `).join("")}</div>
    </div>
  `}function b(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function j(e){const o=[{label:"Wiki Pages",value:e.pages,sub:"Fiction/wiki (excl. index, log)"},{label:"Total ADRs",value:e.totalAdrs,sub:"Architecture Decision Records"},{label:"Accepted",value:e.acceptedAdrs,sub:"Active ADRs"},{label:"Superseded",value:e.supersededAdrs,sub:"Historical ADRs"},{label:"Last Sync",value:e.lastSync,sub:"Fiction → wet_run wiki propagation"}].map(r=>`
    <div class="item roguelike">
      <div class="label">${c(r.label)}</div>
      <div class="value"${r.label==="Last Sync"?' style="font-size: 14px; color: var(--text-secondary);"':""}>${c(r.value)}</div>
      <div class="sub">${c(r.sub)}</div>
    </div>
  `).join(""),s=[{label:"VF Modes",value:e.verificationFramework.modes_total,sub:"verification modes (Phase 135-188)"},{label:"Curations",value:e.verificationFramework.curations_total,sub:"wiki curation phases"},{label:"Dimensions",value:e.verificationFramework.dimensions,sub:"rubric dimensions"},{label:"VF Amendments",value:e.verificationFramework.amendments_total,sub:"Phase 135-188 amendments"},{label:"Sprawl Cov.",value:e.verificationFramework.spraw_coverage_pct+"%",sub:"Sprawl wiki char page coverage"},{label:"Bridge Cov.",value:e.verificationFramework.bridge_coverage_pct+"%",sub:"Bridge wiki char page coverage"},{label:"Wiki Pages",value:e.verificationFramework.wiki_pages_created,sub:"Phase 159/160/168/185"},{label:"Tools",value:e.verificationFramework.tools_total,sub:"svd_*.py + others"}].map(r=>`
    <div class="item roguelike">
      <div class="label">${c(r.label)}</div>
      <div class="value">${c(r.value)}</div>
      <div class="sub">${c(r.sub)}</div>
    </div>
  `).join("");return`
    <h2>📚 Fiction Wiki Cross-Project Status</h2>
    <div class="stats-panel">
      <div class="stats-row">${o}</div>
      <div class="integration-note">
        <strong>Cross-project integration:</strong> roguelike_sprawl wiki updated by Fiction wiki —
        world pages (cyberspace, factions, glossary, sprawl_universe) reflect latest Fiction state.
        Game mission mapping unchanged. Fiction wiki (upstream) untouched per workspace
        <code>AGENTS.md §3</code> + <code>Game/wet_run/AGENTS.md §4.1</code>.
      </div>
    </div>
    <h3>🔬 Fiction Verification Framework (Phase 135-188, ADR-0049)</h3>
    <div class="stats-panel">
      <div class="stats-row">${s}</div>
    </div>
  `}function c(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function C(){const e=[{label:"🌆 Wet Run Submenu",href:"../wet_run/dashboard/index.html"},{label:"📖 Stories",href:"../wet_run/dashboard/stories-browse.html"},{label:"⏱ Stages",href:"../wet_run/dashboard/stages.html"},{label:"⚔ Combat",href:"../wet_run/dashboard/combat.html"},{label:"🌐 Cyberspace",href:"../wet_run/dashboard/cyberspace.html"},{label:"🎮 Play",href:"../wet_run/dashboard/play.html"},{label:"👤 Player",href:"../wet_run/dashboard/player.html"},{label:"⚙ Settings",href:"../wet_run/dashboard/settings.html"}],t=[{label:"⌨ Typing Dashboard",href:"../lingotype/dashboard/index.html"},{label:"📊 Data Overview",href:"../lingotype/dashboard/data/overview.json"},{label:"📚 Languages",href:"../lingotype/wiki/languages/"},{label:"🗺 ROADMAP",href:"../lingotype/ROADMAP.md"},{label:"🤖 Typing AGENTS",href:"../lingotype/AGENTS.md"}],o=[{label:"📚 Fiction Wiki",href:"../../../Fiction/wiki/"},{label:"📋 Fiction ADRs",href:"../../../Fiction/decisions/README.md"},{label:"🗺 Wet Run ROADMAP",href:"../wet_run/ROADMAP.md"},{label:"🤖 Wet Run AGENTS",href:"../wet_run/AGENTS.md"}],a=s=>s.map(r=>`<a class="quick-link" href="${v(r.href)}">${v(r.label)}</a>`).join("");return`
    <div class="links-section">
      <h2>🔗 Wet Run Quick Links</h2>
      <div class="links-row">${a(e)}</div>

      <h2>🔗 LingoType Quick Links</h2>
      <div class="links-row">${a(t)}</div>

      <h2>🔗 Cross-Project References</h2>
      <div class="links-row">${a(o)}</div>
    </div>
  `}function v(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}const p="dashboard-theme";function g(){try{const e=localStorage.getItem(p);if(e==="dark"||e==="light"||e==="system")return e}catch{}return"system"}function h(e){const t=document.documentElement;let o="dark";e==="system"?o=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark":o=e,t.setAttribute("data-theme",o),t.setAttribute("data-theme-pref",e)}function P(){const e=g();h(e),window.matchMedia("(prefers-color-scheme: light)").addEventListener("change",()=>{g()==="system"&&h("system")})}function D(){const e=g(),t=e==="dark"?"light":e==="light"?"system":"dark";try{localStorage.setItem(p,t)}catch{}return h(t),t}function F(){const e=document.getElementById("theme-toggle");e&&e.addEventListener("click",()=>{D()})}function E(){const e=document.querySelector("app-root");if(!e)throw new Error("<app-root> element not found in DOM");return e}P();F();async function H(){const e=E(),t=await A();if(!t){e.innerHTML=`
      <div class="error-state" role="alert">
        <h2>⚠ Dashboard Stats Unavailable</h2>
        <p>Could not load <code>/data/dashboard-stats.json</code>.</p>
        <p>Run <code>npm run build:data</code> in <code>Game/dashboard/</code> to regenerate.</p>
      </div>
    `;return}e.innerHTML=O(t)}function O(e){const{wetRun:t,typingLanguage:o,fiction:a,generatedAt:s}=e;return[R(s),'<main id="main-content">',`<h2>📂 Projects (프로젝트)</h2>
     <div class="project-grid">`,m({slug:"wet-run",icon:"🌆",name:"Wet Run",subtitle:"깁슨 스프롤 3부작 기반 로그라이크 · Python + tcod",description:"Sprawl의 자키가 되어 ICE를 뚫고 의뢰를 수행. RT-MS 전투, ASCII 그래픽, 한/영 이중 언어. Bilingual (en + ko) + 깁슨 톤 보존.",accentClass:"roguelike",href:"../wet_run/dashboard/index.html",stats:[{label:"Tests",value:i(t.tests),sub:"passing"},{label:"Stages",value:i(t.stages),sub:"per Run"},{label:"Story",value:i(t.storyLines),sub:"lines"},{label:"NPCs",value:i(t.npcs),sub:"characters"}],subDashboards:[{label:"📖 Story",href:"../wet_run/dashboard/stories-browse.html"},{label:"⏱ Stages",href:"../wet_run/dashboard/stages.html"},{label:"⚔ Combat",href:"../wet_run/dashboard/combat.html"},{label:"+ 5 more",href:"../wet_run/dashboard/index.html"}]}),m({slug:"lingotype",icon:"⌨",name:"LingoType",subtitle:"다국어 타이핑 학습 게임 · TypeScript + React + Vite",description:"영/일/한/스페인어 4개 언어로 타이핑 학습. 단계별 콘텐츠, 위키, 학습 플랜. 게임화 + 진행률 추적.",accentClass:"typing",href:"../lingotype/dashboard/index.html",stats:[{label:"Languages",value:i(o.languages),sub:"en/jp/kr/es"},{label:"Corpus",value:i(o.corpus),sub:"words/phrases"},{label:"Stages",value:i(o.stages),sub:"lessons"},{label:"Coverage",value:L(o.coverage),sub:"% avg"}],subDashboards:[{label:"📊 Overview",href:"../lingotype/dashboard/index.html"},{label:"📚 Languages",href:"../lingotype/wiki/languages/"},{label:"🎯 Stages",href:"../lingotype/ROADMAP.md"}]}),"</div>",T({wetRunTests:i(t.tests),wetRunStoryLines:i(t.storyLines),typingLanguages:i(o.languages),typingCorpus:i(o.corpus),lastSync:u(s),lastSyncSub:"auto-refresh on data aggregation"}),j({pages:i(a.pages),totalAdrs:i(a.totalAdrs),acceptedAdrs:i(a.acceptedAdrs),supersededAdrs:i(a.supersededAdrs),lastSync:u(a.lastSync),verificationFramework:{modes_total:i(a.verification_framework.modes_total),curations_total:i(a.verification_framework.curations_total),dimensions:i(a.verification_framework.dimensions),amendments_total:i(a.verification_framework.amendments_total),amendments_project_total:i(a.verification_framework.amendments_project_total),spraw_coverage_pct:i(a.verification_framework.spraw_coverage_pct),bridge_coverage_pct:i(a.verification_framework.bridge_coverage_pct),wiki_pages_created:i(a.verification_framework.wiki_pages_created),tools_total:i(a.verification_framework.tools_total)}}),C(),"</main>",`<footer class="footer">
       <code>Game/dashboard/index.html</code> · Cross-project Hub v${e.meta.version}<br>
       Generated: <code>${u(s)}</code><br>
       <span class="footer-note">Live stats aggregator: <code>scripts/aggregate-stats.mjs</code> → <code>public/data/dashboard-stats.json</code>. Schema v${e.meta.schemaVersion}.</span>
     </footer>`].join(`
`)}H().catch(e=>{console.error("[dashboard] init failed:",e);const t=document.querySelector("app-root");t&&(t.innerHTML=`
      <div class="error-state" role="alert">
        <h2>⚠ Initialization Failed</h2>
        <pre>${String(e)}</pre>
      </div>
    `)});
