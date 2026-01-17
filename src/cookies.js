const COOKIE_KEY = "cookiesAccepted";
const cookieBanner = document.getElementById("cookieBanner");
const acceptCookiesBtn = document.getElementById("acceptCookies");

if (!localStorage.getItem(COOKIE_KEY)) {
    cookieBanner.classList.remove("hidden");
}

acceptCookiesBtn?.addEventListener("click", () => {
    localStorage.setItem(COOKIE_KEY, "true");
    cookieBanner.classList.add("hidden");
});
