// Texto entra por marco, por tempo: o IntersectionObserver dispara uma vez e a transição
// de CSS termina sozinha no estado final, mesmo com a rolagem rápida. Nada é scrubado.

export function prepararLinhas(raiz = document) {
  raiz.querySelectorAll('.titulo, .hero__lead, .hero__preco').forEach(el => {
    el.querySelectorAll('.linha').forEach((linha, i) => linha.style.setProperty('--i', i));
  });
}

export function revelar() {
  const alvos = document.querySelectorAll('[data-revela], [data-numero]');
  if (!('IntersectionObserver' in window)) {
    alvos.forEach(el => el.classList.add('is-visivel'));
    return;
  }
  const io = new IntersectionObserver(entradas => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-visivel');
      e.target.dispatchEvent(new CustomEvent('revelou'));
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -14% 0px', threshold: 0.01 });
  alvos.forEach(el => io.observe(el));
}
