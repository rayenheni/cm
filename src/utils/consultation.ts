export function focusConsultation() {
  const target = document.getElementById("consultation-form");
  if (!target) return;

  target.focus({ preventScroll: true });
  target.scrollIntoView({
    block: "start",
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  });
}