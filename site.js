/* Mi Tesoro MX – menú + tema (páginas secundarias) */
(() => {
  const menuToggle = document.getElementById("menuToggle");
  const headerMenu = document.querySelector(".header-center");
  if (menuToggle && headerMenu) {
    menuToggle.addEventListener("click", () => {
      const abierto = headerMenu.classList.toggle("open");
      menuToggle.textContent = abierto ? "✕" : "☰";
      menuToggle.setAttribute("aria-expanded", String(abierto));
    });
    headerMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        headerMenu.classList.remove("open");
        menuToggle.textContent = "☰";
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const btnTheme = document.getElementById("toggleTheme");
  const tema = localStorage.getItem("tema");
  if (tema === "dark") {
    document.body.classList.add("dark");
    if (btnTheme) btnTheme.textContent = "☀️";
  }
  btnTheme?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const oscuro = document.body.classList.contains("dark");
    if (btnTheme) btnTheme.textContent = oscuro ? "☀️" : "🌙";
    localStorage.setItem("tema", oscuro ? "dark" : "light");
  });
})();
