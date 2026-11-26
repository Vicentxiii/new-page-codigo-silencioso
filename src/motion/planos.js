// Planos: escolher uma linha acende o ponto dela; mensal/anual rola os algarismos.
import { definir, ouvir, PLANOS, dominio } from './estado.js';

export function iniciarPlanos() {
  const lista = document.querySelector('[data-planos]');
  if (!lista) return;
  const linhas = [...lista.querySelectorAll('.plano')];
  const alternador = document.querySelector('[data-alternador]');
  const ciclos = alternador ? [...alternador.querySelectorAll('button')] : [];

  const precos = {};
  linhas.forEach((l, i) => {
    l.style.setProperty('--i', i);
    precos[l.dataset.plano] = { mensal: l.dataset.mensal, anual: l.dataset.anual ?? l.dataset.mensal };
    // preço que não é número ("sob consulta"): a linha mostra o texto, sem R$ nem /mês
    l.classList.toggle('is-texto', !/^\d/.test(l.dataset.mensal ?? ''));
    const v = l.querySelector('.plano__valor');
    const t = v.textContent.trim();
    v.innerHTML = '';
    const a = document.createElement('span');
    a.textContent = t;
    const b = document.createElement('span');
    b.setAttribute('aria-hidden', 'true');
    v.append(a, b);
  });

  // a lista entra uma vez, linha por linha
  new IntersectionObserver((es, io) => {
    if (es.some(e => e.isIntersecting)) { lista.classList.add('is-visivel'); io.disconnect(); }
  }, { rootMargin: '0px 0px -12% 0px' }).observe(lista);

  function escolher(linha, foco = false) {
    linhas.forEach(l => {
      const sim = l === linha;
      l.setAttribute('aria-checked', String(sim));
      l.tabIndex = sim ? 0 : -1;
    });
    if (foco) linha.focus();
    definir({ plano: linha.dataset.plano });
  }
  linhas.forEach(l => {
    l.addEventListener('click', () => escolher(l));
    l.addEventListener('keydown', e => {
      const i = linhas.indexOf(l);
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); escolher(linhas[(i + 1) % linhas.length], true); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); escolher(linhas[(i + linhas.length - 1) % linhas.length], true); }
    });
  });
  if (linhas.length) escolher(linhas.find(l => l.getAttribute('aria-checked') === 'true') || linhas[0]);

  // alternador: o fundo desliza até o botão ativo
  function posicionarFundo() {
    const ativo = ciclos.find(c => c.getAttribute('aria-checked') === 'true');
    if (!ativo) return;
    alternador.style.setProperty('--x', `${ativo.offsetLeft}px`);
    alternador.style.setProperty('--w', `${ativo.offsetWidth}px`);
  }
  function trocarCiclo(ciclo) {
    ciclos.forEach(c => c.setAttribute('aria-checked', String(c.dataset.ciclo === ciclo)));
    posicionarFundo();
    linhas.forEach((l, i) => {
      const v = l.querySelector('.plano__valor');
      const [a, b] = v.children;
      const novo = precos[l.dataset.plano][ciclo];
      if (a.textContent === novo) return;
      b.textContent = novo;
      setTimeout(() => {
        v.classList.add('is-trocando');
        setTimeout(() => {
          v.classList.add('sem-transicao');
          a.textContent = novo;
          v.classList.remove('is-trocando');
          void v.offsetWidth;
          v.classList.remove('sem-transicao');
        }, 720);
      }, i * 60);
    });
    definir({ ciclo });
  }
  ciclos.forEach(c => c.addEventListener('click', () => trocarCiclo(c.dataset.ciclo)));
  alternador?.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const atual = ciclos.findIndex(c => c.getAttribute('aria-checked') === 'true');
    const prox = ciclos[(atual + 1) % 2];
    trocarCiclo(prox.dataset.ciclo);
    prox.focus();
  });
  document.fonts.ready.then(posicionarFundo);
  window.addEventListener('resize', posicionarFundo);
  posicionarFundo();

  definir({ precos });

  // o resumo e o fecho escutam o nome e o plano
  ouvir(e => {
    const preco = (e.precos[e.plano] || {})[e.ciclo] || '';
    const numero = /^\d/.test(preco);
    // preço em texto ("sob consulta") vai como está; número vira "R$ 39,90 por mês"
    const frasePreco = !numero ? preco : e.ciclo === 'anual' ? `R$ ${preco} por mês, pago por ano` : `R$ ${preco} por mês`;
    document.querySelectorAll('[data-dominio]').forEach(el => {
      const novo = dominio(e);
      if (el.textContent !== novo) {
        el.textContent = novo;
        el.dispatchEvent(new CustomEvent('mudou'));
      }
    });
    document.querySelectorAll('[data-plano-nome]').forEach(el => { el.textContent = PLANOS[e.plano]?.nome ?? ''; });
    document.querySelectorAll('[data-plano-preco]').forEach(el => { el.textContent = frasePreco; });
    document.querySelectorAll('[data-fecho-preco]').forEach(el => { el.textContent = numero ? `R$ ${preco}` : preco; });
  });

  // links da nav que apontam para um plano
  document.querySelectorAll('[data-plano-link]').forEach(a => a.addEventListener('click', () => {
    const l = linhas.find(x => x.dataset.plano === a.dataset.planoLink);
    if (l) escolher(l);
  }));
}
