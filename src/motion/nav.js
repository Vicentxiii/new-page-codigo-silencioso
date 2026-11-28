// Nav: some ao descer, volta ao subir (com fundo depois do hero). Menu de tela cheia no celular.
import { tela, lenis } from './rolagem.js';

export function iniciarNav() {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;
  const botao = nav.querySelector('.nav__menu');
  const menu = document.getElementById('menu');
  let ultimoY = window.scrollY;
  let acumulado = 0;
  let timerFechar = 0;

  function aoRolar() {
    const y = window.scrollY;
    const d = y - ultimoY;
    ultimoY = y;
    if (menu.classList.contains('is-aberto')) return;
    acumulado = Math.sign(d) === Math.sign(acumulado) ? acumulado + d : d;
    if (y < 40) {
      nav.classList.remove('is-escondida', 'is-solida');
      return;
    }
    if (acumulado > 12) nav.classList.add('is-escondida');
    else if (acumulado < -24) {
      nav.classList.remove('is-escondida');
    }
    nav.classList.toggle('is-solida', y > tela.h * 0.6);
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  // recarregar no meio da página: a nav já nasce com o fundo certo
  nav.classList.toggle('is-solida', window.scrollY > tela.h * 0.6);

  // menu (celular)
  const links = menu.querySelectorAll('.menu__link');
  links.forEach((l, i) => l.style.setProperty('--i', i));
  function abrir() {
    clearTimeout(timerFechar);
    menu.hidden = false;
    botao.setAttribute('aria-expanded', 'true');
    trocarRotulo('Fechar');
    nav.classList.remove('is-escondida');
    document.documentElement.classList.add('menu-aberto');
    lenis?.stop();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (botao.getAttribute('aria-expanded') !== 'true') return; // fechou antes de animar
      menu.classList.add('is-aberto');
      menu.querySelector('.menu__link')?.focus({ preventScroll: true });
    }));
  }
  function fechar(foco = true) {
    clearTimeout(timerFechar);
    menu.classList.remove('is-aberto');
    botao.setAttribute('aria-expanded', 'false');
    trocarRotulo('Menu');
    document.documentElement.classList.remove('menu-aberto');
    lenis?.start();
    timerFechar = setTimeout(() => { if (!menu.classList.contains('is-aberto')) menu.hidden = true; }, 420);
    if (foco) botao.focus({ preventScroll: true });
  }
  function trocarRotulo(t) {
    const rola = botao.querySelector('.rola');
    rola.dataset.texto = t;
    rola.querySelectorAll('.rola__a, .rola__b').forEach(s => { s.textContent = t; });
  }
  botao.addEventListener('click', () => (menu.classList.contains('is-aberto') ? fechar() : abrir()));
  menu.addEventListener('click', e => { if (e.target.closest('a')) fechar(false); });
  document.addEventListener('keydown', e => {
    if (!menu.classList.contains('is-aberto')) return;
    if (e.key === 'Escape') { fechar(); return; }
    if (e.key !== 'Tab') return;
    // mantém o foco dentro do menu enquanto ele está aberto
    const itens = [botao, ...menu.querySelectorAll('a[href], button')];
    const primeiro = itens[0];
    const ultimo = itens[itens.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  });
}
