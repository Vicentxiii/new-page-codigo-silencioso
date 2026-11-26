// Busca de domínio fictícia e determinística: o mesmo nome dá sempre o mesmo resultado.
// Estados: vazio, digitando, procurando, disponível, indisponível (com sugestões), erro.
import { definir, ler } from './estado.js';

const COMUNS = ['loja', 'casa', 'site', 'norte', 'google', 'brasil', 'web', 'app', 'blog', 'shop', 'store',
  'teste', 'meusite', 'empresa', 'online', 'digital', 'studio', 'estudio', 'agencia', 'cafe', 'padaria'];
// quanto cada terminação costuma estar ocupada (0 a 1): data-ocupacao em cada <li class="tld"> do HTML; sem ele, 0,3
const OCUPACAO = {};

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}
export function disponivel(nome, tld) {
  if (nome.length <= 3 || COMUNS.includes(nome)) return false;
  return hash(nome + tld) >= (OCUPACAO[tld] ?? 0.3);
}
const semAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

function validar(bruto) {
  const v = semAcento(bruto.trim().toLowerCase());
  if (!v) return { nome: '', erro: '' };
  if (/\s/.test(v)) return { nome: '', erro: 'Sem espaço: junte as palavras ou use hífen.' };
  if (/[^a-z0-9-]/.test(v)) return { nome: '', erro: 'Use só letras, números e hífen.' };
  if (/^-|-$/.test(v)) return { nome: '', erro: 'O nome não pode começar nem terminar com hífen.' };
  if (v.length < 2) return { nome: '', erro: '' };
  return { nome: v, erro: '' };
}

export function iniciarBusca() {
  const form = document.querySelector('[data-busca]');
  // sem a seção de domínio: nada a buscar, e o voo do ponto não acontece
  if (!form) return null;
  document.querySelectorAll('[data-tlds] .tld').forEach((li) => {
    const v = Number(li.dataset.ocupacao);
    if (Number.isFinite(v)) OCUPACAO[li.dataset.tld] = v;
  });
  const input = form.querySelector('.busca__input');
  const espelho = form.querySelector('.busca__espelho');
  const sufixo = form.querySelector('.busca__sufixo');
  const sufixoResto = sufixo.querySelector('[data-sufixo-resto]');
  const erro = form.querySelector('.busca__erro');
  const campo = form.querySelector('.busca__campo');
  const itens = [...document.querySelectorAll('[data-tlds] .tld')];
  let timerBusca = 0;
  let timerDigita = 0;
  let timers = [];
  let ultimoNome = null;

  // ---- cursor (o ponto) e sufixo seguem o texto ----
  function medirTexto(t) {
    espelho.textContent = t;
    return espelho.getBoundingClientRect().width;
  }
  function posicionar() {
    const valor = input.value;
    const ini = input.selectionStart ?? valor.length;
    const fim = input.selectionEnd ?? ini;
    const rolado = input.scrollLeft;
    const xCursor = medirTexto(valor.slice(0, ini)) - rolado;
    const larguraTexto = medirTexto(valor || input.placeholder);
    const larguraSufixo = sufixo.getBoundingClientRect().width;
    const util = campo.clientWidth;
    let xSufixo = larguraTexto - rolado + 2;
    if (xSufixo + larguraSufixo > util) xSufixo = util - larguraSufixo;
    // texto que não cabe com o sufixo: o campo reserva o espaço e o texto rola por dentro
    input.style.paddingRight = larguraTexto + larguraSufixo > util ? `${larguraSufixo + 4}px` : '0px';
    campo.style.setProperty('--cursor-x', `${Math.max(0, xCursor).toFixed(1)}px`);
    campo.style.setProperty('--sufixo-x', `${xSufixo.toFixed(1)}px`);
    form.classList.toggle('is-selecao', fim !== ini);
    // com o cursor no fim do texto, o sufixo abre espaço para o ponto
    form.classList.toggle('is-fim', valor.length > 0 && ini === valor.length);
  }

  // ---- terminações ----
  function marcar(item, estadoTld) {
    item.classList.remove('is-livre', 'is-ocupado', 'is-procurando');
    if (estadoTld) item.classList.add(estadoTld);
  }
  function textoEstado(item, t) { item.querySelector('.tld__estado').textContent = t; }

  function limparSugestoes(item) { item.querySelector('.tld__sugestoes').textContent = ''; }
  function sugerir(item, nome, tld) {
    const caixa = item.querySelector('.tld__sugestoes');
    caixa.textContent = '';
    const opcoes = [`${nome}-online`, `${nome}oficial`, `meu${nome}`, `${nome}br`, `use${nome}`]
      .filter(n => n.length <= 40 && disponivel(n, tld)).slice(0, 2);
    opcoes.forEach((n, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sugestao';
      b.style.setProperty('--i', i);
      b.textContent = n + tld;
      b.addEventListener('click', () => {
        input.value = n;
        escolherTld(tld);
        aoDigitar(true);
        input.focus({ preventScroll: true });
      });
      caixa.append(b);
    });
  }

  function procurar(nome) {
    timers.forEach(clearTimeout);
    timers = [];
    ultimoNome = nome;
    itens.forEach((item, i) => {
      const tld = item.dataset.tld;
      const acao = item.querySelector('.tld__acao');
      item.classList.remove('is-no-carrinho');
      acao.querySelector('.rola__a').textContent = 'Registrar';
      acao.querySelector('.rola__b').textContent = 'Registrar';
      limparSugestoes(item);
      if (!nome) {
        marcar(item, null);
        textoEstado(item, 'Digite um nome');
        acao.disabled = true;
        return;
      }
      marcar(item, 'is-procurando');
      textoEstado(item, 'Procurando…');
      acao.disabled = true;
      timers.push(setTimeout(() => {
        const livre = disponivel(nome, tld);
        marcar(item, livre ? 'is-livre' : 'is-ocupado');
        textoEstado(item, livre ? 'Disponível' : 'Já tem dono');
        acao.disabled = !livre;
        if (!livre) sugerir(item, nome, tld);
        if (item.querySelector('.tld__escolher').getAttribute('aria-pressed') === 'true') {
          definir({ nome, livre });
        }
      }, 420 + i * 160));
    });
  }

  function aoDigitar(imediato = false) {
    const { nome, erro: msg } = validar(input.value);
    form.classList.toggle('is-cheia', input.value.length > 0);
    form.classList.add('is-digitando');
    clearTimeout(timerDigita);
    timerDigita = setTimeout(() => form.classList.remove('is-digitando'), 650);
    erro.textContent = msg;
    form.classList.toggle('is-erro', !!msg);
    posicionar();
    if (msg) {
      timers.forEach(clearTimeout);
      itens.forEach(item => { marcar(item, null); textoEstado(item, '—'); item.querySelector('.tld__acao').disabled = true; limparSugestoes(item); });
      ultimoNome = null;
      return;
    }
    clearTimeout(timerBusca);
    if (nome === ultimoNome) return;
    if (imediato) procurar(nome);
    else timerBusca = setTimeout(() => procurar(nome), 380);
    if (!nome) definir({ nome: '' });
  }

  function escolherTld(tld) {
    itens.forEach(item => {
      item.querySelector('.tld__escolher').setAttribute('aria-pressed', String(item.dataset.tld === tld));
    });
    sufixoResto.textContent = tld.slice(1); // o primeiro ponto é o que veio do globo
    definir({ tld });
    posicionar();
  }

  input.addEventListener('input', () => aoDigitar());
  ['keyup', 'click', 'select', 'scroll'].forEach(ev => input.addEventListener(ev, posicionar));
  document.addEventListener('selectionchange', () => { if (document.activeElement === input) posicionar(); });
  input.addEventListener('focus', () => { form.classList.add('is-focada', 'is-cursor'); posicionar(); });
  input.addEventListener('blur', () => form.classList.remove('is-focada', 'is-cursor'));
  // clicar em qualquer lugar da linha leva ao campo
  form.querySelector('.busca__linha').addEventListener('click', e => {
    if (!e.target.closest('button')) input.focus();
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const { nome, erro: msg } = validar(input.value);
    if (!input.value.trim() || msg) {
      erro.textContent = msg || 'Digite o nome do seu site.';
      form.classList.add('is-erro', 'is-treme');
      setTimeout(() => form.classList.remove('is-treme'), 450);
      input.focus();
      return;
    }
    procurar(nome);
  });

  itens.forEach(item => {
    item.querySelector('.tld__escolher').addEventListener('click', () => escolherTld(item.dataset.tld));
    item.querySelector('.tld__acao').addEventListener('click', e => {
      const acao = e.currentTarget;
      escolherTld(item.dataset.tld);
      const jaEsta = item.classList.toggle('is-no-carrinho');
      const t = jaEsta ? 'No carrinho' : 'Registrar';
      acao.querySelector('.rola__a').textContent = t;
      acao.querySelector('.rola__b').textContent = t;
      if (jaEsta) definir({ nome: ultimoNome || ler().nome });
    });
  });

  window.addEventListener('resize', posicionar);
  document.fonts.ready.then(posicionar);
  posicionar();

  return {
    form,
    campo,
    posicionar,
    luz: sufixo.querySelector('.busca__luz'),
    mostrarCursor: v => form.classList.toggle('is-cursor', v),
    /** o ponto do globo pousado (aceso) no ponto do sufixo */
    pousar: v => form.classList.toggle('is-pousado', v),
  };
}
