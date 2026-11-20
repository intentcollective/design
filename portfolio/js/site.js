/* =========================================================
   site.js
   ---------------------------------------------------------
   The shared engine. Every page loads this file. It:
     1. reads content/settings.json
     2. applies your colors and typeface
     3. builds the menu and the footer
     4. knows how to turn "blocks" into HTML

   You should not need to edit this file to change content.
   Content lives in the /content folder.
   ========================================================= */

const Site = {
  settings: null,

  /* Load a JSON file. If it is missing or has a typo, show a
     clear message on the page instead of a blank screen. */
  async load(path) {
    let response;
    try {
      response = await fetch(path, { cache: "no-cache" });
    } catch (err) {
      throw new Error(
        location.protocol === "file:"
          ? "This site reads its content with fetch(), which browsers block when you open the file directly. Preview it with a local server (see the guide, “Preview on your computer”)."
          : `Could not reach ${path}.`
      );
    }
    if (!response.ok) throw new Error(`Could not find <code>${path}</code>. Check the file name and the folder.`);
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      // Find the line number so the student knows where to look.
      const pos = Number((err.message.match(/position (\d+)/) || [])[1]);
      const line = pos ? text.slice(0, pos).split("\n").length : null;
      throw new Error(
        `There is a typo in <code>${path}</code>${line ? ` near line ${line}` : ""}. ` +
        "Look for a missing comma, a missing quote mark, or a comma after the last item in a list."
      );
    }
  },

  /* Run once on every page. */
  async init() {
    try {
      this.settings = await this.load("content/settings.json");
    } catch (err) {
      this.showError(err);
      throw err;
    }
    this.applyTheme();
    this.buildNav();
    this.buildFooter();
    return this.settings;
  },

  /* Copy the theme colors from settings.json into the CSS variables. */
  applyTheme() {
    const t = this.settings.theme || {};
    const root = document.documentElement.style;
    const map = { background: "--bg", text: "--fg", muted: "--muted", line: "--line", accent: "--accent" };
    for (const key in map) if (t[key]) root.setProperty(map[key], t[key]);

    if (t.font) {
      // Any Google Font works: set "googleFont": true and type its exact name.
      if (t.googleFont) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(t.font)}:ital,wght@0,300..800;1,300..800&display=swap`;
        document.head.appendChild(link);
      }
      root.setProperty("--font", `"${t.font}", -apple-system, "Helvetica Neue", Arial, sans-serif`);
    }
  },

  /* Build the menu from the "menu" list in settings.json. */
  buildNav() {
    const s = this.settings;
    const here = location.pathname.split("/").pop() || "index.html";
    const nav = document.createElement("header");
    nav.className = "site-nav";
    nav.innerHTML = `
      <div class="wrap cols">
        <a class="site-nav__name" href="index.html">${esc(s.name)}</a>
        <ul class="site-nav__menu" aria-label="Main">
          ${(s.menu || []).map(item => {
            const current = item.link === here || (here === "project.html" && item.link === "index.html");
            const tab = item.newTab ? ' target="_blank" rel="noopener"' : "";
            const badge = item.badge ? ' class="badge"' : "";
            // A short label like "in" needs a full name for screen readers.
            const name = item.fullName ? ` aria-label="${esc(item.fullName)}"` : "";
            return `<li><a href="${esc(item.link)}"${tab}${badge}${name}${current ? ' aria-current="page"' : ""}>${esc(item.label)}</a></li>`;
          }).join("")}
        </ul>
      </div>`;
    document.body.prepend(nav);
  },

  buildFooter() {
    const s = this.settings;
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    const links = [];
    if (s.email) links.push(`<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>`);
    if (s.portfolioPdf) links.push(`<a href="${esc(s.portfolioPdf)}" target="_blank" rel="noopener">PDF portfolio</a>`);
    if (s.showGuideLink) links.push(`<a href="guide.html">Portfolio guide</a>`);
    footer.innerHTML = `
      <div class="wrap"><div class="cols">
        <p>&copy; ${new Date().getFullYear()} ${esc(s.name)}</p>
        <nav aria-label="Footer">${links.join("")}</nav>
      </div></div>`;
    document.body.appendChild(footer);
  },

  showError(err) {
    const box = document.createElement("div");
    box.className = "load-error";
    box.innerHTML = `<h2>Something in the content needs a fix</h2><p>${err.message}</p>`;
    (document.querySelector("main") || document.body).prepend(box);
  },

  /* Fade elements in as they scroll into view. */
  reveal(root = document) {
    const items = root.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) return items.forEach(el => el.classList.add("is-visible"));
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(el => io.observe(el));
  }
};

/* ---------------------------------------------------------
   Small helpers
   --------------------------------------------------------- */

/* Escape text so a stray < or & in your content can't break the page. */
function esc(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* A tiny bit of formatting for text blocks:
     *italic*   **bold**   [link text](https://...)
   A blank line starts a new paragraph. */
function richText(value = "") {
  return value
    .split(/\n\s*\n/)
    .map(paragraph => {
      let html = esc(paragraph.trim())
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        .replace(/\n/g, "<br>");
      return `<p>${html}</p>`;
    })
    .join("");
}

/* ---------------------------------------------------------
   Blocks
   ---------------------------------------------------------
   A project page is a list of blocks. Each block has a
   "type". The function with the same name below turns it
   into HTML. To invent a new block type, add a function
   here and a matching style in style.css.
   --------------------------------------------------------- */

const Blocks = {
  render(list = []) {
    return list.map(block => {
      const make = Blocks[block.type];
      if (!make) return `<div class="b-placeholder"><span><strong>Unknown block</strong>There is no block type called “${esc(block.type)}”. Check the spelling.</span></div>`;
      return `<div class="reveal">${make(block)}</div>`;
    }).join("");
  },

  text(b) {
    const heading = b.heading ? `<h2>${esc(b.heading)}</h2>` : "";
    return `
      <section class="b-text">
        ${heading}
        <div class="b-text__body">${richText(b.body)}</div>
      </section>`;
  },

  image(b) {
    const width = ["full", "wide", "narrow"].includes(b.width) ? b.width : "narrow";
    if (!b.src) return `<figure class="b-figure b-figure--${width}">${Blocks.placeholder({ label: b.caption || b.alt || "Image", ratio: b.ratio })}</figure>`;
    const padded = b.background ? " b-figure--padded" : "";
    const bg = b.background ? ` style="background:${esc(b.background)}"` : "";
    return `
      <figure class="b-figure b-figure--${width}">
        <div class="${padded}"${bg}><img src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy"></div>
        ${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}
      </figure>`;
  },

  gallery(b) {
    const cols = [2, 3, 4].includes(Number(b.columns)) ? Number(b.columns) : 2;
    const ratio = b.ratio ? `--ratio:${esc(b.ratio)};` : "";
    const items = (b.images || []).map(img =>
      img.src
        ? `<img src="${esc(img.src)}" alt="${esc(img.alt)}" loading="lazy">`
        : `<div class="b-placeholder" style="--ratio:${esc(b.ratio || "4/5")}"><span><strong>Placeholder</strong>${esc(img.alt || "Image")}</span></div>`
    ).join("");
    // Equal shares of the 12 columns: 2 images span 6 each, 3 span 4, 4 span 3.
    return `
      <figure class="b-gallery">
        <div class="b-gallery__grid cols" style="--span:${12 / cols};${ratio}">${items}</div>
        ${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}
      </figure>`;
  },

  video(b) {
    const url = b.url || "";
    const ratio = `--ratio:${esc(b.ratio || "16/9")}`;
    let player;
    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    const youtube = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
    if (vimeo) {
      player = `<iframe src="https://player.vimeo.com/video/${vimeo[1]}?dnt=1&title=0&byline=0&portrait=0" allow="autoplay; fullscreen; picture-in-picture" loading="lazy" title="${esc(b.caption || "Video")}"></iframe>`;
    } else if (youtube) {
      player = `<iframe src="https://www.youtube-nocookie.com/embed/${youtube[1]}" allow="autoplay; fullscreen; picture-in-picture" loading="lazy" title="${esc(b.caption || "Video")}"></iframe>`;
    } else if (url) {
      // A video file in your own images folder (.mp4).
      const auto = b.autoplay ? " autoplay muted loop playsinline" : " controls";
      player = `<video src="${esc(url)}"${auto}></video>`;
    } else {
      return Blocks.placeholder({ label: b.caption || "Video", ratio: b.ratio });
    }
    return `
      <figure class="b-figure b-figure--${b.width === "full" ? "full" : "wide"} b-video">
        <div class="b-video__frame" style="${ratio}">${player}</div>
        ${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}
      </figure>`;
  },

  quote(b) {
    return `<blockquote class="b-quote">${esc(b.text)}${b.cite ? `<cite>${esc(b.cite)}</cite>` : ""}</blockquote>`;
  },

  /* Before and after: drag the slider to compare two images. */
  compare(b) {
    if (!b.before || !b.after) return Blocks.placeholder({ label: b.caption || "Before and after comparison" });
    return `
      <figure class="b-figure b-figure--wide b-compare">
        <div class="b-compare__stage">
          <img src="${esc(b.before)}" alt="${esc(b.beforeAlt || "Before")}" loading="lazy">
          <div class="b-compare__after"><img src="${esc(b.after)}" alt="${esc(b.afterAlt || "After")}" loading="lazy"></div>
        </div>
        <input type="range" min="0" max="100" value="50" aria-label="Compare before and after"
          oninput="this.previousElementSibling.style.setProperty('--pos', this.value + '%')">
        ${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}
      </figure>`;
  },

  /* A dashed box that marks where something still needs to go. */
  placeholder(b) {
    return `<div class="b-placeholder" style="--ratio:${esc(b.ratio || "16/9")}"><span><strong>Placeholder</strong>${esc(b.label || "Add an image here")}</span></div>`;
  },

  spacer(b) {
    const size = ["small", "medium", "large"].includes(b.size) ? b.size : "medium";
    return `<div class="b-spacer--${size}" aria-hidden="true"></div>`;
  }
};
