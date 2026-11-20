/* =========================================================
   pages.js
   ---------------------------------------------------------
   One function per page. Each HTML file has a
   data-page="..." attribute on <body>, and the matching
   function below fills in that page.

   Class names used here:
     .wrap  the text column, centered, with page margins
     .cols  divides it into 12 columns (6 on tablets, 4 on phones)
   See section 3 of css/style.css.
   ========================================================= */

const Pages = {

  /* ---------- Works (index.html) ---------- */
  async works(s) {
    const main = document.querySelector("main");
    const words = s.rotatingWords || [""];

    // 1. The hero header
    const lines = (s.headline || []).map((line, i) => {
      const inner = line === "{rotate}"
        ? `<span class="hero__rotate"><span class="word">${esc(words[0])}</span></span>`
        : esc(line);
      return `<span class="hero__line"><span style="--i:${i}">${inner}</span></span>`;
    }).join("");
    const spoken = (s.headline || []).join(" ").replace("{rotate}", words[0]);

    main.innerHTML = `
      <section class="hero wrap cols">
        <h1 class="hero__headline" aria-label="${esc(spoken)}">${lines}</h1>
        <p class="hero__intro">${esc(s.intro)}</p>
      </section>
      <section class="works wrap" id="works">
        <div class="works__bar cols">
          <span class="label">Selected work, ${(s.works || []).length} projects</span>
          ${s.portfolioPdf ? `<a class="action" href="${esc(s.portfolioPdf)}" target="_blank" rel="noopener">Download PDF portfolio</a>` : ""}
        </div>
        <div class="works__grid cols" id="grid"></div>
      </section>`;

    Pages.rotateWords(words);

    // 2. The project cards, in the order listed in settings.json
    const projects = await Pages.loadProjects(s.works);
    document.getElementById("grid").innerHTML = projects.map(({ slug, data: p }) => `
      <a class="card reveal" href="project.html?p=${encodeURIComponent(slug)}">
        <div class="card__media"><img src="${esc(p.cover)}" alt="${esc(p.coverAlt)}" loading="lazy" style="object-position:${esc(p.coverPosition || "center")}"></div>
        <h2 class="card__title">${esc(p.title)}</h2>
        <p class="card__meta">${esc(p.discipline)}</p>
      </a>`).join("");
    Site.reveal();
  },

  /* Swap the accent word in the headline every few seconds. */
  rotateWords(words) {
    const holder = document.querySelector(".hero__rotate");
    if (!holder || words.length < 2) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    setTimeout(() => setInterval(() => {
      const current = holder.querySelector(".word");
      current.classList.add("is-out");
      setTimeout(() => {
        i = (i + 1) % words.length;
        current.textContent = words[i];
        current.classList.remove("is-out");
        current.classList.add("is-in");
        setTimeout(() => current.classList.remove("is-in"), 500);
      }, 340);
    }, 2400), 1600);
  },

  /* Load every project file listed in settings.json. */
  async loadProjects(slugs = []) {
    const results = [];
    for (const slug of slugs) {
      try {
        results.push({ slug, data: await Site.load(`content/projects/${slug}.json`) });
      } catch (err) {
        Site.showError(err);
      }
    }
    return results;
  },

  /* ---------- One project (project.html?p=slug) ---------- */
  async project(s) {
    const main = document.querySelector("main");
    // The project name comes from the address, project.html?p=tamara
    // (or project.html#tamara on hosts that drop the ?p= part).
    const slug = new URLSearchParams(location.search).get("p") || location.hash.slice(1) || (s.works || [])[0];
    const p = await Site.load(`content/projects/${slug}.json`);
    document.title = `${p.title}, ${s.name}`;

    // Subject, Tools, Role. Role is only for group projects, to say
    // what you did on the team. Leave it out for solo work.
    const facts = [["Subject", p.subject], ["Tools", p.tools], ["Role", p.role]].filter(([, v]) => v);

    main.innerHTML = `
      <article>
        <header class="project-head wrap cols">
          <h1 class="page-title">${esc(p.title)}</h1>
          <p class="lead">${esc(p.summary)}</p>
          <dl class="facts cols">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
        </header>
        ${p.cover && !p.hideCover ? `<div class="project-cover wrap"><img src="${esc(p.cover)}" alt="${esc(p.coverAlt)}"></div>` : ""}
        <div class="blocks wrap">${Blocks.render(p.blocks)}</div>
        <div class="wrap" id="after"></div>
      </article>`;
    Site.reveal();

    // Previous and next links need the full list of projects.
    const all = await Pages.loadProjects(s.works);
    const index = all.findIndex(x => x.slug === slug);
    const prev = index > 0 ? all[index - 1] : null;
    const next = index > -1 && index < all.length - 1 ? all[index + 1] : all[0];
    const link = (x, label, cls) => x && x.slug !== slug
      ? `<a class="${cls}" href="project.html?p=${encodeURIComponent(x.slug)}"><small>${label}</small><strong>${esc(x.data.title)}</strong></a>`
      : "";
    document.getElementById("after").innerHTML = `
      <nav class="pager cols" aria-label="More projects">
        ${link(prev, "← Previous", "pager__prev")}
        ${link(next, "Next project →", "pager__next")}
      </nav>`;
  },

  /* ---------- Resume ----------
     Not linked in the menu. The menu opens the PDF, and this
     page is what the PDF is made from. The layout follows a
     classic CV: the name and main sections on the right,
     awards, clients and contact in a column on the left. */
  async resume(s) {
    const r = await Site.load("content/resume.json");
    const label = text => `<h2 class="cv__label">${esc(text)}</h2>`;
    const item = it => `
      <div class="cv-item">
        <div class="cv-item__head">
          <span class="cv-item__where">${esc(it.where)}</span>
          <span class="cv-item__place">${esc(it.place || "")}</span>
          <span class="cv-item__when">${esc(it.when || "")}</span>
        </div>
        ${it.what ? `<div class="cv-item__what">${esc(it.what)}</div>` : ""}
        ${(it.details || []).length ? `<ul class="dots cv-item__details">${it.details.map(d => `<li>${esc(d)}</li>`).join("")}</ul>` : ""}
      </div>`;
    const contact = [
      s.email, s.linkedin && s.linkedin.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), s.website, r.availability
    ].filter(Boolean);

    document.querySelector("main").innerHTML = `
      <section class="page wrap">
        <div class="page__actions no-print" style="margin-top:0;margin-bottom:var(--s7)">
          ${s.resumePdf ? `<a class="action" href="${esc(s.resumePdf)}" target="_blank" rel="noopener">Download resume PDF</a>` : ""}
        </div>
        <article class="cv cols">
          <div class="cv__main">
            <h1 class="cv__name">${esc(s.name)}</h1>
            ${r.expertise ? `<section>${label("Expertise")}<ul class="cv__expertise">${r.expertise.map(x => `<li>${esc(x)}</li>`).join("")}</ul></section>` : ""}
            ${(r.sections || []).map(sec => `<section>${label(sec.title)}${(sec.items || []).map(item).join("")}</section>`).join("")}
            ${r.skills ? `<section>${label("Skills")}<dl class="cv__skills">${r.skills.map(k => `<div><dt>${esc(k.title)}</dt><dd>${esc(k.list)}</dd></div>`).join("")}</dl></section>` : ""}
          </div>
          <aside class="cv__side">
            ${r.awards ? `<section>${label("Awards")}<dl class="cv__awards">${r.awards.map(a => `<div><dt>${esc(a.name)}</dt><dd>${esc(a.note)}</dd><dd>${esc(a.when)}</dd></div>`).join("")}</dl></section>` : ""}
            ${r.clients ? `<section>${label("Clients")}<ul class="cv__clients">${r.clients.map(c => `<li>${esc(c)}</li>`).join("")}</ul></section>` : ""}
            <section>${label("Contact")}<ul class="cv__contact">${contact.map(c => `<li>${esc(c)}</li>`).join("")}</ul></section>
          </aside>
          ${r.motto ? `<p class="cv__motto">${esc(r.motto)}</p>` : ""}
        </article>
      </section>`;
  },

  /* ---------- About ---------- */
  async about(s) {
    const a = await Site.load("content/about.json");
    const portrait = a.portrait
      ? `<img src="${esc(a.portrait)}" alt="${esc(a.portraitAlt)}">`
      : Blocks.placeholder({ label: "Portrait. A simple, well-lit photo of you, or you at work.", ratio: "4/5" });
    document.querySelector("main").innerHTML = `
      <section class="page about wrap">
        <h1 class="page-title">About</h1>
        <div class="about-head cols">
          <div class="about-head__portrait">${portrait}</div>
          <p class="lead">${esc(a.lead)}</p>
        </div>
        <div class="blocks">${Blocks.render(a.blocks)}</div>
        <div class="section cols">
          <h2>Contact</h2>
          <div class="page__actions" style="margin-top:0">
            ${s.email ? `<a class="action" href="mailto:${esc(s.email)}">${esc(s.email)}</a>` : ""}
            ${s.linkedin ? `<a class="action" href="${esc(s.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ""}
            ${s.resumePdf ? `<a class="action" href="${esc(s.resumePdf)}" target="_blank" rel="noopener">Resume PDF</a>` : ""}
          </div>
        </div>
      </section>`;
    Site.reveal();
  },

  /* ---------- PDF portfolio (print.html) ----------
     Open print.html, then File > Print > Save as PDF.
     Choose landscape, no margins, and turn on
     "Background graphics". */
  async print(s) {
    const projects = await Pages.loadProjects(s.works);
    const site = s.website || (location.origin + location.pathname.replace(/print\.html$/, ""));
    const headline = (s.headline || []).join(" ").replace("{rotate}", `<em>${esc((s.rotatingWords || [""])[0])}</em>`);

    const pages = projects.map(({ data: p }) => {
      // The first three titled text blocks become the short story for the PDF.
      const texts = (p.blocks || []).filter(b => b.type === "text" && b.heading).slice(0, 3);
      const facts = [["Subject", p.subject], ["Tools", p.tools], ["Role", p.role]].filter(([, v]) => v);
      return `
        <section class="sheet">
          <div class="sheet__media"><img src="${esc(p.cover)}" alt="${esc(p.coverAlt)}"></div>
          <div class="sheet__text">
            <h2>${esc(p.title)}</h2>
            <p class="sheet__summary">${esc(p.summary)}</p>
            <dl class="sheet__facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
            <div class="sheet__body">${texts.map(b => `<h3>${esc(b.heading)}</h3>${richText(b.body.split(/\n\s*\n/)[0])}`).join("")}</div>
            <p class="sheet__link">Full process and sketches at ${esc(site)}</p>
          </div>
        </section>`;
    }).join("");

    document.querySelector("main").innerHTML = `
      <div class="print-help wrap">
        <p><strong>This page becomes your PDF portfolio.</strong> In your browser choose File, then Print, then Save as PDF. Set the layout to landscape, margins to none, and turn on background graphics. Save the file into the <code>files</code> folder with the name set in settings.json.</p>
      </div>
      <section class="sheet sheet--cover">
        <h1>${headline}</h1>
        <div>
          <p class="sheet__intro">${esc(s.intro)}</p>
          <div class="sheet__footer"><span>${esc(s.name)}, ${esc(s.role)}</span><span>${esc(s.email)}</span><span>${esc(site)}</span></div>
        </div>
      </section>
      ${pages}
      <section class="sheet sheet--cover">
        <h1>Thank you.</h1>
        <div><div class="sheet__footer"><span>${esc(s.name)}</span><span>${esc(s.email)}</span><span>${esc(s.linkedin)}</span></div></div>
      </section>`;
  }
};

/* When only the #name changes, the browser doesn't reload. Do it ourselves. */
addEventListener("hashchange", () => { if (document.body.dataset.page === "project") location.reload(); });

/* ---------- Start ---------- */
(async () => {
  const page = document.body.dataset.page;
  try {
    const settings = await Site.init();
    if (Pages[page]) await Pages[page](settings);
  } catch (err) {
    if (Site.settings) Site.showError(err);
    console.error(err);
  }
  document.body.classList.add("is-ready");
})();
