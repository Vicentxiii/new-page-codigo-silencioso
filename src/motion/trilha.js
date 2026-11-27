// Capítulos: cada passo acende quando entra na tela e a linha da trilha é preenchida pela rolagem.
import { aCadaQuadro, limitar, tela, reduzido } from './rolagem.js';

export function iniciarTrilha() {
  const trilha = document.querySelector('.trilha');
  if (!trilha) return;
  const preenchido = trilha.querySelector('.trilha__preenchido');
  const passos = [...trilha.querySelectorAll('.trilha__passo')];
  if (!preenchido || !passos.length) return;

  if (!('IntersectionObserver' in window)) {
    passos.forEach(p => p.classList.add('is-ativo'));
  } else {
    const io = new IntersectionObserver(entradas => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-ativo');
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -26% 0px', threshold: 0.01 });
    passos.forEach(p => io.observe(p));
  }

  if (reduzido) { preenchido.style.height = '100%'; return; }
  aCadaQuadro(() => {
    const r = trilha.getBoundingClientRect();
    const t = limitar((tela.h * 0.72 - r.top) / r.height, 0, 1);
    preenchido.style.height = `${(t * 100).toFixed(2)}%`;
  });
}
