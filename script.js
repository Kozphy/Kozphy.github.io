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

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
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
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

if (header) {
  const syncHeaderState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  syncHeaderState();
  window.addEventListener("scroll", syncHeaderState, { passive: true });
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
