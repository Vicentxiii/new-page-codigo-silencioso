// Medidas da página: ajusta as palavras gigantes à largura da tela e posiciona o hero
// (palavra, texto e globo) com as proporções do conceito. Roda no load, nas fontes e no resize.
import { tela } from './rolagem.js';

const docTop = el => el.getBoundingClientRect().top + window.scrollY;

// mede a palavra a 100 px: largura, linha de base e topo das letras altas
function medir(el) {
  const antes = el.style.fontSize;
  el.style.fontSize = '100px';
  const caixa = el.getBoundingClientRect();
  // a largura é a do texto (o elemento pode ser um bloco na largura toda)
  const faixaTexto = document.createRange();
  faixaTexto.selectNodeContents(el);
  const larguraTexto = faixaTexto.getBoundingClientRect().width;
  const sonda = document.createElement('span');
  sonda.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
  el.appendChild(sonda);
  const base = sonda.getBoundingClientRect().top - caixa.top;
  sonda.remove();
  const cs = getComputedStyle(el);
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = `${cs.fontWeight} 100px ${cs.fontFamily}`;
  const m = ctx.measureText(el.textContent.trim());
  el.style.fontSize = antes;
  return { w: larguraTexto, base, alto: m.actualBoundingBoxAscent || 74 };
}

export const L = {};

export function ajustarPalavras() {
  // palavras gigantes de ponta a ponta (hero, rodapé)
  document.querySelectorAll('[data-palavra]').forEach(el => {
    const m = medir(el);
    const borda = Math.max(6, tela.w * 0.007);
    let f = ((tela.w - borda * 2) / m.w) * 100;
    // teto fluido: a palavra de fundo nunca estoura a largura útil nem passa de 34% da altura
    f = Math.min(f, (tela.h * 0.34) / (m.alto / 100));
    el.style.fontSize = `${f.toFixed(2)}px`;
    el._medida = { f, base: (m.base * f) / 100, alto: (m.alto * f) / 100, w: (m.w * f) / 100 };
  });
  // nome do domínio no fecho: ocupa a largura útil, com teto
  document.querySelectorAll('[data-ajusta]').forEach(el => {
    el.style.fontSize = '100px';
    const faixaTexto = document.createRange();
    faixaTexto.selectNodeContents(el);
    const w = faixaTexto.getBoundingClientRect().width;
    const util = tela.w - 2 * Math.min(48, Math.max(20, tela.w * 0.04));
    const teto = tela.celular ? 64 : Math.min(tela.h * 0.2, 180);
    el.style.fontSize = `${Math.min(teto, (util / w) * 100).toFixed(2)}px`;
  });
}

export function medirHero() {
  const hero = document.querySelector('.hero');
  const visual = hero?.querySelector('.hero__visual');
  if (!hero || !visual) { L.hero = null; return; }
  const H = hero.getBoundingClientRect().height;
  const navH = tela.celular ? 64 : 96;

  // o conteúdo entra abaixo da nav, com respiro; o grid faz o resto
  const conteudoTopo = navH + (tela.celular ? 24 : 56);
  hero.style.setProperty('--conteudo-topo', `${conteudoTopo.toFixed(1)}px`);

  // ler o retângulo depois de escrever a variável força o reflow: medimos o grid já assentado
  const r = visual.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = docTop(visual) + r.height / 2;
  const d = tela.celular
    ? Math.min(r.width * 1.1, r.height * 0.95, 460)
    : Math.min(r.width * 1.04, r.height * 0.9, H * 0.62);
  const globoTopo = cy - d / 2;
  // o pontinho inicial nasce acima da capa para não ficar escondido atrás dela
  const capaH = visual.querySelector('.hero__capa')?.getBoundingClientRect().height || 0;
  const pontoOffset = capaH * 0.62;
  const texto = hero.querySelector('.hero__conteudo');
  const textoZona = texto ? { topo: docTop(texto), altura: texto.offsetHeight } : null;

  hero.style.setProperty('--globo-topo', `${globoTopo.toFixed(1)}px`);
  hero.style.setProperty('--globo-d', `${d.toFixed(1)}px`);
  hero.style.setProperty('--globo-cx', `${cx.toFixed(1)}px`);
  hero.style.setProperty('--globo-cy', `${cy.toFixed(1)}px`);
  L.hero = { altura: H, conteudoTopo, globoTopo, d, cx, cy, pontoOffset, texto: textoZona };
}

export function medirSecoes() {
  // o globo das regiões: cabe entre as duas colunas de texto
  const margem = Math.min(48, Math.max(20, tela.w * 0.04));
  L.r1 = tela.celular ? tela.w * 0.5 : Math.min(tela.h * 0.37, (tela.w - 2 * margem) * 0.225);
  document.documentElement.style.setProperty('--globo-regioes', `${(L.r1 * 2).toFixed(1)}px`);
  // cada medida só existe se a seção existe (tirar uma seção do index.html deixa a dela em null)
  const ident = document.querySelector('.identidade');
  L.identidade = ident ? { topo: docTop(ident), altura: ident.offsetHeight } : null;
  const reg = document.querySelector('.regioes');
  const a = reg?.querySelector('.regioes__bloco--a');
  const b = reg?.querySelector('.regioes__bloco--b');
  L.regioes = reg && a && b ? {
    topo: docTop(reg),
    altura: reg.offsetHeight,
    a: { topo: docTop(a), altura: a.offsetHeight },
    b: { topo: docTop(b), altura: b.offsetHeight },
  } : null;
  const campo = document.querySelector('.busca__campo');
  L.busca = campo ? { topo: docTop(campo), altura: campo.offsetHeight, esquerda: campo.getBoundingClientRect().left } : null;
  const dominio = document.querySelector('.dominio');
  L.dominio = dominio ? { topo: docTop(dominio) } : null;
  const rodape = document.querySelector('.rodape');
  L.rodape = rodape ? { topo: docTop(rodape), altura: rodape.offsetHeight } : null;
  L.doc = document.documentElement.scrollHeight;
}

export function medirTudo() {
  tela.w = document.documentElement.clientWidth || window.innerWidth;
  tela.h = window.innerHeight;
  tela.celular = tela.w <= 760;
  ajustarPalavras();
  medirHero();
  medirSecoes();
  L.w = tela.w;
  L.h = tela.h;
  L.celular = tela.celular;
}
