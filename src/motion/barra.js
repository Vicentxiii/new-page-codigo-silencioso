import { rolarPara } from './rolagem.js';

// Barra de rolagem própria: fina, sobreposta, aparece ao rolar e no hover da borda, arrastável.
// A nativa fica escondida (sem scrollbar-gutter: nada de faixa reservada na lateral).

export function iniciarBarra() {
  const barra = document.querySelector('.barra');
  if (!barra) return;
  const polegar = barra.querySelector('.barra__polegar');
  let altura = 0;
  let curso = 0;
  let timer = 0;

  function medir() {
    const doc = document.documentElement.scrollHeight;
    const h = window.innerHeight;
    altura = Math.max(40, (h / doc) * h);
    curso = h - altura;
    polegar.style.height = `${altura}px`;
    posicionar();
  }
  function posicionar() {
    const doc = document.documentElement.scrollHeight - window.innerHeight;
    const t = doc > 0 ? window.scrollY / doc : 0;
    polegar.style.transform = `translate3d(0, ${(t * curso).toFixed(1)}px, 0)`;
  }
  window.addEventListener('scroll', () => {
    posicionar();
    barra.classList.add('is-ativa');
    clearTimeout(timer);
    timer = setTimeout(() => barra.classList.remove('is-ativa'), 900);
  }, { passive: true });
  window.addEventListener('resize', medir);
  new ResizeObserver(medir).observe(document.body);

  // arrastar
  let inicioY = 0;
  let inicioScroll = 0;
  polegar.addEventListener('pointerdown', e => {
    e.preventDefault();
    inicioY = e.clientY;
    inicioScroll = window.scrollY;
    barra.classList.add('is-arrastando');
    polegar.setPointerCapture(e.pointerId);
  });
  polegar.addEventListener('pointermove', e => {
    if (!barra.classList.contains('is-arrastando')) return;
    const doc = document.documentElement.scrollHeight - window.innerHeight;
    rolarPara(inicioScroll + ((e.clientY - inicioY) / curso) * doc, true);
  });
  const soltar = () => barra.classList.remove('is-arrastando');
  polegar.addEventListener('pointerup', soltar);
  polegar.addEventListener('pointercancel', soltar);
  // clique no trilho pula para o ponto
  barra.addEventListener('pointerdown', e => {
    if (e.target === polegar) return;
    const doc = document.documentElement.scrollHeight - window.innerHeight;
    rolarPara(((e.clientY - altura / 2) / curso) * doc);
  });
  medir();
}
