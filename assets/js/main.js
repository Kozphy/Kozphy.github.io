const GITHUB_USER = "Kozphy";
const PILLAR_LABELS = {
  reliability: "CI & Agent Reliability",
  financial: "Financial Systems & Tech Risk",
  quant: "Quant Trading Infrastructure"
};

const root = document.documentElement;
const toggleButton = document.querySelector("[data-theme-toggle]");
const header = document.querySelector(".site-header");
const storedTheme = readStoredTheme();
const initialTheme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";

applyTheme(initialTheme);

if (toggleButton) {
  toggleButton.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    writeStoredTheme(nextTheme);
  });
}

renderProjects();
setupProjectFilters();
setupReveal();

if (header) {
  const syncHeaderState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  syncHeaderState();
  window.addEventListener("scroll", syncHeaderState, { passive: true });
}

function renderProjects() {
  const projects = Array.isArray(window.PORTFOLIO_PROJECTS) ? window.PORTFOLIO_PROJECTS : [];

  document.querySelectorAll("[data-projects]").forEach((container) => {
    const mode = container.dataset.projects;
    const detailed = container.hasAttribute("data-projects-detailed");
    const selected = projects.filter((project) => {
      if (mode === "all") {
        return true;
      }

      if (mode === "featured") {
        return project.featured;
      }

      return project.pillar === mode;
    });

    container.replaceChildren(...selected.map((project) => buildProjectCard(project, detailed)));
  });
}

function buildProjectCard(project, detailed) {
  const repoUrl = `https://github.com/${GITHUB_USER}/${project.repo}`;
  const card = el("article", "panel project-card");
  card.dataset.pillar = project.pillar;

  const head = el("div", "card-head");
  const titleBlock = el("div");
  titleBlock.append(el("p", "eyebrow", PILLAR_LABELS[project.pillar] ?? project.pillar));
  titleBlock.append(el("h3", "", project.title));
  head.append(titleBlock);

  if (project.ci) {
    const badge = el("img", "ci-badge");
    badge.src = `https://img.shields.io/github/actions/workflow/status/${GITHUB_USER}/${project.repo}/${project.ci}?branch=main&label=CI`;
    badge.alt = `${project.title} CI status`;
    badge.loading = "lazy";
    badge.height = 20;
    head.append(badge);
  }

  card.append(head);
  card.append(el("p", "project-summary", project.summary));

  if (detailed) {
    const facts = el("dl", "project-facts");
    [["Problem", project.problem], ["How it works", project.approach]].forEach(([term, description]) => {
      const row = el("div");
      row.append(el("dt", "", term), el("dd", "", description));
      facts.append(row);
    });
    card.append(facts);
  }

  const evidenceItems = detailed ? project.evidence : project.evidence.slice(0, 2);
  const evidence = el("ul", "detail-list");
  evidenceItems.forEach((item) => evidence.append(el("li", "", item)));
  card.append(el("p", "panel-label", "Evidence"), evidence);

  const tags = el("ul", "tag-list");
  tags.setAttribute("aria-label", "Tech stack");
  project.stack.forEach((item) => tags.append(el("li", "", item)));
  card.append(tags);

  if (project.note) {
    card.append(el("p", "project-note", project.note));
  }

  const link = el("a", "card-link", "View repository");
  link.href = repoUrl;
  link.target = "_blank";
  link.rel = "noreferrer";
  card.append(link);

  return card;
}

function setupProjectFilters() {
  const buttons = document.querySelectorAll("[data-project-filter]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.projectFilter;

      buttons.forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
      document.querySelectorAll(".project-card").forEach((card) => {
        card.hidden = filter !== "all" && card.dataset.pillar !== filter;
      });
    });
  });
}

function setupReveal() {
  const revealElements = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  revealElements.forEach((element) => observer.observe(element));
}

function el(tag, className = "", text = "") {
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  if (text) {
    node.textContent = text;
  }

  return node;
}

function applyTheme(theme) {
  root.dataset.theme = theme;

  if (!toggleButton) {
    return;
  }

  const isDark = theme === "dark";
  toggleButton.setAttribute("aria-pressed", String(isDark));
  const label = toggleButton.querySelector(".theme-toggle-label");

  if (label) {
    label.textContent = `Mode: ${isDark ? "Dark" : "Light"}`;
  }
}

function readStoredTheme() {
  try {
    return localStorage.getItem("portfolio-theme");
  } catch {
    return null;
  }
}

function writeStoredTheme(theme) {
  try {
    localStorage.setItem("portfolio-theme", theme);
  } catch {
    return;
  }
}
