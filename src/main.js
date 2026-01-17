import "./style.css";
import ScrollReveal from "scrollreveal";

const $ = (id) => document.getElementById(id);

const menuBtn = $("menuBtn");
const mobileMenu = $("mobileMenu");
const iconOpen = $("iconOpen");
const iconClose = $("iconClose");

const setMenuOpen = (isOpen) => {
    mobileMenu.classList.toggle("hidden", !isOpen);
    iconOpen.classList.toggle("hidden", isOpen);
    iconClose.classList.toggle("hidden", !isOpen);
    menuBtn.setAttribute("aria-expanded", String(isOpen));
};

menuBtn.addEventListener("click", () => {
    const isOpen = menuBtn.getAttribute("aria-expanded") === "true";
    setMenuOpen(!isOpen);
});

window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 768px)").matches) setMenuOpen(false);
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenuOpen(false);
});

const sr = ScrollReveal({
    duration: 900,
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    opacity: 0,
    mobile: true,
    cleanup: true,
    reset: false,
    viewFactor: 0.2,
    viewOffset: {top: 0, right: 0, bottom: 50, left: 0},
});

const beforeReveal = (el) => {
    el.style.willChange = "transform, opacity, filter";
    el.style.opacity = "0";
    el.style.transform = "translateY(24px) scale(0.98)";
    el.style.filter = "blur(6px)";
    el.style.transition =
        "transform 900ms cubic-bezier(0.2,0.8,0.2,1), opacity 700ms ease-out, filter 120ms ease-out";
};

const afterReveal = (el) => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0) scale(1)";
    el.style.filter = "blur(0)";
};

const revealBase = {
    origin: "bottom",
    beforeReveal,
    afterReveal,
};

sr.reveal(".sr-fade", {...revealBase, interval: 120});
sr.reveal(".sr-item", {...revealBase, interval: 100});
sr.reveal(".sr-row", {...revealBase, interval: 80});
sr.reveal(".sr-footer", {
    ...revealBase,
    interval: 80,
    viewFactor: 0.25,
    viewOffset: {top: 0, right: 0, bottom: 60, left: 0},
});

const toTopBtn = $("toTopBtn");

const toggleToTop = () => {
    const show = window.scrollY > 400;
    toTopBtn.classList.toggle("hidden", !show);
    toTopBtn.classList.toggle("flex", show);
};

toggleToTop();
window.addEventListener("scroll", toggleToTop, {passive: true});

toTopBtn.addEventListener("click", () => {
    window.scrollTo({top: 0, behavior: "smooth"});
});

const openYieldModalBtn = $("openYieldModal");
const yieldModal = $("yieldModal");
const closeYieldModalBtn = $("closeYieldModal");
const yieldBackdrop = $("yieldBackdrop");

const yieldForm = $("yieldForm");
const resetYieldBtn = $("resetYield");
const yieldStatus = $("yieldStatus");
const yieldResults = $("yieldResults");
const yieldList = $("yieldList");

const amountEl = $("amount");
const apyEl = $("apy");
const daysEl = $("days");
const baseCurrencyEl = $("baseCurrency");
const toCurrenciesEl = $("toCurrencies");

const openModal = () => {
    yieldModal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
    yieldStatus.textContent = "";
};

const closeModal = () => {
    yieldModal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
};

openYieldModalBtn?.addEventListener("click", openModal);
closeYieldModalBtn?.addEventListener("click", closeModal);
yieldBackdrop?.addEventListener("click", closeModal);

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
});

resetYieldBtn?.addEventListener("click", () => {
    yieldForm.reset();
    toCurrenciesEl.value = "USD,EUR,GBP";
    yieldResults.classList.add("hidden");
    yieldList.innerHTML = "";
    yieldStatus.textContent = "";
});

const parseCurrencies = (input) =>
    [...new Set(input.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean))];

const fmt = (n) =>
    new Intl.NumberFormat(undefined, {maximumFractionDigits: 2}).format(n);

const fetchRates = async (base, toList) => {
    const to = toList.join(",");
    const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(
        base
    )}&to=${encodeURIComponent(to)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("FX API failed");
    return res.json();
};

yieldForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const amount = Number(amountEl.value);
    const apy = Number(apyEl.value);
    const days = Number(daysEl.value);
    const base = baseCurrencyEl.value;

    const toList = parseCurrencies(toCurrenciesEl.value);
    if (!toList.length) return;

    yieldStatus.textContent = "Calculating…";
    yieldResults.classList.add("hidden");
    yieldList.innerHTML = "";

    const interestBase = amount * (apy / 100) * (days / 365);
    const totalBase = amount + interestBase;

    try {
        const fxTargets = toList.filter((c) => c !== base);
        let rates = {};

        if (fxTargets.length) {
            const data = await fetchRates(base, fxTargets);
            rates = data.rates || {};
        }

        const rows = [];
        const addRow = (code, interest, total) => {
            rows.push(`
        <div class="flex items-center justify-between">
          <span class="text-slate-700">${code}</span>
          <span class="font-medium text-slate-900">+${fmt(interest)} / ${fmt(total)}</span>
        </div>
      `);
        };

        addRow(base, interestBase, totalBase);

        for (const code of fxTargets) {
            const r = rates[code];
            if (!r) continue;
            addRow(code, interestBase * r, totalBase * r);
        }

        yieldList.innerHTML = `
      <div class="text-xs text-slate-600 mb-2">
        Interest / Total after ${days} days
      </div>
      ${rows.join("")}
    `;

        yieldResults.classList.remove("hidden");
        yieldStatus.textContent = "";
    } catch {
        yieldStatus.textContent = "Could not load rates.";
    }
});
