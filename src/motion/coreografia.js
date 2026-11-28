// Para onde o globo vai em cada ponto da rolagem. Só imagem segue a rolagem:
// posição, tamanho e giro do globo, e a luz dos pontos quando chegam de frente.
// A página nunca para: o globo é uma camada fixa que sobe mais devagar que o conteúdo.
import { L } from './layout.js';
import { REGIOES, PAPEIS } from './globo.js';
import { tela, amortecer, limitar, suave, misturar, faixa, reduzido } from './rolagem.js';

// quadros-chave: s = posição da rolagem (px); o resto é o estado do globo
function quadros() {
  const { w: W, h: H, celular } = tela;
  const hero = L.hero;
  const reg = L.regioes;
  const r0 = hero.d / 2;
  const cy0 = hero.globoTopo + r0;
  // desktop: o globo fica à direita, mas inteiro dentro da área útil — sem corte na borda
  const margem = Math.min(48, Math.max(20, W * 0.04));
  const cx = r => celular ? W / 2 : Math.min(W - r - margem, W * 0.78);
  // a entrada: um pontinho dourado que abre até o tamanho do globo conforme a página rola
  const rPonto = Math.max(5, Math.min(9, r0 * 0.035));
  const cyPonto = cy0 - (hero.pontoOffset || 0);
  const zoomFim = H * 0.6;
  // sem a seção de regiões, o globo só sobe e sai pelo alto quando o hero acaba
  if (!reg) {
    return [
      { s: 0, cx: hero.cx, cy: cyPonto, r: rPonto, lat: -9, lon: -58 },
      { s: zoomFim, cx: hero.cx, cy: cy0, r: r0, lat: -9, lon: -58 },
      { s: hero.altura * 0.9, cx: cx(r0), cy: -r0 - 80, r: r0, lat: -4, lon: -20 },
    ];
  }
  const fimReg = reg.topo + reg.altura;
  const r1 = L.r1;
  if (celular) {
    return [
      { s: 0, cx: hero.cx, cy: cyPonto, r: rPonto, lat: -9, lon: -58 },
      { s: zoomFim, cx: hero.cx, cy: cy0, r: r0, lat: -9, lon: -58 },
      { s: reg.topo - H * 0.15, cx: cx(r1), cy: H * 0.33, r: r1, lat: -14, lon: -60 },
      { s: reg.a.topo - H * 0.2, cx: cx(r1), cy: H * 0.33, r: r1, lat: -10, lon: -40 },
      { s: reg.b.topo - H * 0.55, cx: cx(r1), cy: H * 0.33, r: r1, lat: 20, lon: 10 },
      { s: fimReg - H * 0.25, cx: cx(r1), cy: -r1 - 80, r: r1, lat: 8, lon: 70 },
    ];
  }
  return [
    { s: 0, cx: hero.cx, cy: cyPonto, r: rPonto, lat: -9, lon: -58 },
    { s: zoomFim, cx: hero.cx, cy: cy0, r: r0, lat: -9, lon: -58 },
    { s: reg.topo - H * 0.04, cx: cx(r1), cy: H * 0.5, r: r1, lat: -14, lon: -61 },
    { s: reg.a.topo - H * 0.1, cx: cx(r1), cy: H * 0.5, r: r1, lat: -10, lon: -44 },
    { s: reg.b.topo - H * 0.25, cx: cx(r1), cy: H * 0.5, r: r1, lat: 22, lon: 9 },
    { s: fimReg - H * 0.95, cx: cx(r1), cy: H * 0.5, r: r1, lat: 12, lon: 64 },
    { s: fimReg - H * 0.05, cx: cx(r1 * 0.94), cy: -r1 - 100, r: r1 * 0.94, lat: 4, lon: 96 },
  ];
}

function interpolar(qs, s) {
  if (s <= qs[0].s) return { ...qs[0] };
  for (let i = 1; i < qs.length; i++) {
    if (s <= qs[i].s) {
      const a = qs[i - 1];
      const b = qs[i];
      const t = suave(limitar((s - a.s) / (b.s - a.s)));
      const o = {};
      for (const k of ['cx', 'cy', 'r', 'lat', 'lon']) o[k] = misturar(a[k], b[k], t);
      return o;
    }
  }
  return { ...qs[qs.length - 1] };
}

export function criarCoreografia(globo, canvas = null) {
  let qs = quadros();
  const atual = interpolar(qs, tela.y);
  const ponto = {};
  const aplicado = {};
  const giro = { lat: 0, lon: 0 }; // somado ao roteiro quando a mão gira o globo no hero
  // brilho de cada ponto: acende por tempo quando chega de frente (na entrada, de oeste para leste)
  const N = REGIOES.length;
  const aceso = new Array(N).fill(false);
  const ordemOeste = REGIOES.map((r, i) => ({ i, lon: r.lon })).sort((a, b) => a.lon - b.lon)
    .reduce((o, r, k) => { o[r.i] = k; return o; }, []);
  const alvoBrilho = new Float32Array(N);
  let falha = -1;
  let inicio = -1;
  let opacidade = 1; // brilho do canvas: escurece atrás da lista no celular
  const presos = new Set(); // pontos que saíram do globo (o voo até a busca)

  function remedir() { qs = quadros(); }

  /** liga o roteiro de entrada: os pontos à vista acendem um a um */
  function acender(agora) { inicio = agora; }

  /** uma região cai e a vizinha assume (por tempo, uma vez por entrada) */
  function falhar() {
    if (falha >= 0) return;
    falha = performance.now() / 1000;
  }

  let ultimoY = tela.y;
  function quadro(dt, agora) {
    let alvo = interpolar(qs, tela.y);
    // salto grande (âncora, recarregar no meio): o globo vai direto, sem atravessar a tela
    const salto = Math.abs(tela.y - ultimoY) > tela.h * 1.5;
    ultimoY = tela.y;
    if (tela.celular && L.regioes) {
      // no celular a primeira frase empurra o globo para cima e ele sai com ela:
      // o globo nunca fica atrás de texto nem volta por cima dele
      const topoNaTela = L.regioes.a.topo - tela.y;
      alvo.cy = Math.min(alvo.cy, topoNaTela - 28 - alvo.r);
    }
    // balanço lento e limitado (nunca acumula): o globo está vivo mesmo parado
    alvo.lon += reduzido ? 0 : Math.sin(agora * 0.16) * 4;
    const k = reduzido || salto ? 1e3 : 7.5;
    for (const c of ['cx', 'cy', 'r', 'lat', 'lon']) atual[c] = amortecer(atual[c], alvo[c], k, dt);
    // o giro da mão (arrasto.js) entra por cima do roteiro, sem suavização: o globo segue o dedo
    aplicado.cx = atual.cx;
    aplicado.cy = atual.cy;
    aplicado.r = atual.r;
    aplicado.lat = atual.lat + giro.lat;
    aplicado.lon = atual.lon + giro.lon;
    globo.aplicar(aplicado);

    // celular: o globo escurece enquanto a lista de "Isso soa familiar?" está sob ele,
    // e volta ao normal suavemente quando a seção passa
    let alvoOp = 1;
    if (tela.celular && L.identidade) {
      const topo = L.identidade.topo - tela.y;
      const fim = topo + L.identidade.altura;
      const centro = aplicado.cy;
      const rampa = tela.h * 0.3;
      const entra = limitar((centro - topo) / rampa);
      const sai = limitar((fim - centro) / rampa);
      alvoOp = 1 - Math.min(entra, sai) * 0.9; // chega a 0,10: só um relevo escuro
    }
    opacidade = reduzido ? alvoOp : amortecer(opacidade, alvoOp, 6, dt);
    if (canvas?.classList.contains('is-pronto')) {
      if (!canvas.style.transition) canvas.style.transition = 'none';
      canvas.style.opacity = opacidade.toFixed(3);
    }

    // luz dos pontos
    for (let i = 0; i < N; i++) {
      globo.projetar(i, ponto);
      const naTela = ponto.y > -40 && ponto.y < tela.h + 40;
      if (!aceso[i] && inicio >= 0 && ponto.face > 0.18 && naTela) {
        const passou = agora - inicio;
        // entrada: um ponto a cada 110 ms, do oeste para o leste
        if (passou > 0.55 + ordemOeste[i] * 0.11 || tela.y > 40) aceso[i] = true;
      }
      alvoBrilho[i] = aceso[i] ? 1 : 0;
    }
    if (falha >= 0) {
      const t = performance.now() / 1000 - falha;
      // o ponto data-cai apaga e o data-assume brilha mais forte (na demo, Europa oeste e centro); volta depois de 3,2 s
      if (t < 3.2) { alvoBrilho[PAPEIS.cai] = 0.12; alvoBrilho[PAPEIS.assume] = 1.55; }
      else if (t > 6) falha = -1;
    }
    presos.forEach(i => { alvoBrilho[i] = 0; globo.brilho[i] = 0; });
    for (let i = 0; i < N; i++) {
      if (presos.has(i)) continue;
      const sobe = alvoBrilho[i] > globo.brilho[i];
      globo.brilho[i] = reduzido ? alvoBrilho[i] : amortecer(globo.brilho[i], alvoBrilho[i], sobe ? 5 : 3.5, dt);
    }
  }

  const visivel = () => atual.cy + atual.r > -80 && atual.cy - atual.r < tela.h + 80;

  const segurar = (i, sim) => (sim ? presos.add(i) : presos.delete(i));

  return { quadro, remedir, acender, falhar, visivel, segurar, atual, giro };
}
