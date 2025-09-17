(function () {
  try {
    console.log(
      "%cPETCON desk_animate.js LOADED",
      "padding:2px 6px;background:#111;color:#ffd700;border-radius:4px"
    );

    // Helpers
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();

    // Never inject inside these (charts/canvases/etc.)
    const BAD_CONTAINERS =
      ".echarts, canvas, .chart, .axis-chart, .apexcharts-canvas, .frappe-chart";

    // Label -> emoji/icon map (tweak to taste)
    const ICONS = new Map([
      // Top quick links
      ["Visit LMS Portal", "🔗"],
      ["Create a Course", "📚"],
      ["Setup a Home Page", "🏠"],
      ["LMS Settings", "⚙️"],
      ["Documentation", "📖"],

      // Stats row chips
      ["Users", "👥"],
      ["Course", "🎓"],
      ["Enrollments", "📝"],
      ["Course Completed", "✅"],
      ["Certificate", "🎖️"],
      ["Evaluation", "🧪"],

      // Chart cards
      ["Signups", "🆕"],
      ["Enrollments", "📈"],

      // Bottom section headings
      ["Course Data", "🗂️"],
      ["Course Stats", "📊"],
      ["Certification", "🏅"],

      // Bottom list items
      ["Chapter", "📕"],
      ["Lesson", "📘"],
      ["Quiz", "❓"],
      ["Quiz Submission", "📩"],
      ["Interest", "⭐"],
      ["Review", "🗒️"],
      ["Evaluation Request", "🧾"],
    ]);

    const tagged = new WeakSet();

    function addIcon(el, emoji) {
      if (!el || tagged.has(el)) return false;
      if (el.closest(BAD_CONTAINERS)) return false;

      el.classList.add("petcon-icon-host");
      tagged.add(el);

      const span = document.createElement("span");
      span.className = "petcon-icon";
      span.setAttribute("aria-hidden", "true");
      span.textContent = emoji;
      span.style.display = "inline-block";
      span.style.marginRight = "8px";

      if (el.firstChild) el.insertBefore(span, el.firstChild);
      else el.appendChild(span);
      return true;
    }

    // Strict match on visible text after whitespace normalization
    function matches(el, label) {
      return clean(el.textContent) === label;
    }

    // Find the deepest element whose text exactly matches label (avoid tagging containers)
    function findLowestMatch(root, label) {
      let best = null,
        depth = -1;
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode(node) {
            if (!(node instanceof HTMLElement)) return NodeFilter.FILTER_SKIP;
            if (node.matches(".petcon-icon-host")) return NodeFilter.FILTER_SKIP;
            const t = clean(node.textContent);
            return t === label ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
          },
        }
      );
      let n;
      while ((n = walker.nextNode())) {
        let d = 0,
          p = n;
        while (p && p !== root) {
          d++;
          p = p.parentElement;
        }
        if (d > depth) {
          best = n;
          depth = d;
        }
      }
      return best;
    }

    function tagAll(root) {
      const page = root.querySelector(".page-content") || root;

      // 1) Chart card titles first
      $$(".card .card-title, .widget .card-title, .widget .head, .widget .chart-title", page).forEach(
        (h) => {
          const label = clean(h.textContent);
          const emoji = ICONS.get(label);
          if (emoji) addIcon(h, emoji);
        }
      );

      // 2) Generic pass across links, buttons, chips, list items, headings
      const genericTargets = $$(
        [
          ".page-content a",
          ".page-content button",
          ".page-content .btn",
          ".page-content .chip",
          ".page-content li",
          ".page-content .list-unstyled li a",
          ".page-content h1, .page-content h2, .page-content h3, .page-content h4, .page-content h5, .page-content h6",
          ".page-content .list-item, .page-content .list-row",
        ].join(", "),
        page
      );

      ICONS.forEach((emoji, label) => {
        const lowest = findLowestMatch(page, label);
        if (lowest) {
          addIcon(lowest, emoji);
          return;
        }
        const host = genericTargets.find((el) => matches(el, label));
        if (host) addIcon(host, emoji);
      });

      // 3) Animate cards/chips (skip charts)
      const anims = [
        ...$$(".shortcut-widget, .chip", page),
        ...$$(".card, .frappe-card, .page-card", page),
      ].filter((el) => !el.closest(BAD_CONTAINERS));
      animateIn(anims, "petcon-anim");
    }

    // Simple staggered animation
    function animateIn(nodes, base) {
      nodes.forEach((el, i) => {
        if (el.dataset.petconAnim) return;
        el.dataset.petconAnim = "1";
        const variants = ["pop", "slide-left", "slide-right", "flip"];
        const variant = variants[i % variants.length];
        el.classList.add(base, `petcon-${variant}`);
        el.style.setProperty("--petcon-delay", `${Math.min(i * 60, 600)}ms`);
        requestAnimationFrame(() => el.classList.add("petcon-enter"));
      });
    }

    // Inject minimal CSS for icons + animations
    const css = `
      .petcon-icon { opacity:.95; transform: translateY(-.5px); transition: transform .2s ease; }
      .petcon-icon-host:hover .petcon-icon { transform: translateY(-.5px) rotate(-4deg); }
      .petcon-anim { opacity:0; transform: translateY(8px); filter: blur(2px); }
      .petcon-anim.petcon-enter { opacity:1; transform:none; filter:none; }
      .petcon-anim.petcon-pop { animation: petcon-pop 520ms cubic-bezier(.2,.7,.2,1) both var(--petcon-delay,0ms); }
      .petcon-anim.petcon-slide-left { animation: petcon-slide-left 480ms ease-out both var(--petcon-delay,0ms); }
      .petcon-anim.petcon-slide-right { animation: petcon-slide-right 480ms ease-out both var(--petcon-delay,0ms); }
      .petcon-anim.petcon-flip { animation: petcon-flip 640ms cubic-bezier(.2,.7,.2,1) both var(--petcon-delay,0ms); }
      @keyframes petcon-pop {
        0% { opacity:0; transform: translateY(12px) scale(.98); filter: blur(2px); }
        60% { opacity:1; transform: translateY(0) scale(1); filter: blur(0); }
        100% { opacity:1; transform:none; filter:none; }
      }
      @keyframes petcon-slide-left { 0%{opacity:0;transform:translateX(-18px)} 100%{opacity:1;transform:none} }
      @keyframes petcon-slide-right{ 0%{opacity:0;transform:translateX(18px)} 100%{opacity:1;transform:none} }
      @keyframes petcon-flip {
        0%{opacity:0; transform:rotateX(-70deg) translateY(6px); transform-origin: top;}
        60%{opacity:1; transform:rotateX(10deg);}
        100%{opacity:1; transform:none;}
      }
      @media (prefers-reduced-motion: reduce) {
        .petcon-anim, .petcon-anim.petcon-enter { animation:none !important; opacity:1 !important; filter:none !important; }
      }
    `;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    function init() {
      const root = document.body;
      // Initial + staggered attempts (SPA/lazy renders)
      tagAll(root);
      setTimeout(() => tagAll(root), 400);
      setTimeout(() => tagAll(root), 1200);

      // Re-tag when DOM changes (new components mount)
      const mo = new MutationObserver((m) => {
        for (const x of m)
          if (x.addedNodes && x.addedNodes.length) {
            tagAll(root);
            break;
          }
      });
      mo.observe(root, { childList: true, subtree: true });

      // Also re-tag on theme attribute changes (light/dark switches)
      const themeObs = new MutationObserver(() => tagAll(root));
      themeObs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
      themeObs.observe(document.body, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
      init();
    }
  } catch (e) {
    console.error("PETCON desk_animate.js error:", e);
  }
})();
