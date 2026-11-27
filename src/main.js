// Ordem de inicialização. O CSS não entra por aqui: ele vem por <link> no index.html (src/styles/site.css), senão no
// dev do Vite a página aparece crua por um instante a cada recarregamento.
//   1. monta os textos que rolam, as linhas e os formulários; mede a página
//   2. o hero entra quando as fontes chegam; o globo (Three.js, num pedaço próprio) entra quando as texturas chegam
//   3. a cada quadro: o giro da mão, o roteiro do globo, o voo do ponto até a busca
// Cada módulo confere se a seção dele existe: tirar uma seção do index.html não quebra nada.
import { tela, aCadaQuadro, reduzido } from './motion/rolagem.js';
import { medirTudo, L } from './motion/layout.js';
import { prepararLinhas, revelar } from './motion/revelar.js';
import { iniciarNav } from './motion/nav.js';
import { iniciarBarra } from './motion/barra.js';
import { iniciarToque, montarRola } from './motion/toque.js';
import { iniciarBusca } from './motion/busca.js';
import { iniciarVideo } from './motion/video.js';
import { iniciarPlanos } from './motion/planos.js';
import { iniciarMigracao } from './motion/migracao.js';
import { iniciarNumeros } from './motion/numeros.js';
import { iniciarTrilha } from './motion/trilha.js';
import { iniciarRelogio } from './motion/relogio.js';
import { ajustarPalavras } from './motion/layout.js';

const html = document.documentElement;
if (reduzido) html.classList.add('reduzido');

montarRola();
prepararLinhas();
const busca = iniciarBusca();
iniciarPlanos();
iniciarMigracao();
iniciarVideo();
iniciarRelogio();
medirTudo();
// nada transiciona no primeiro quadro (a trava inline do <head>): libera depois de dois quadros
requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add('assentou')));

// texto do hero entra quando as fontes chegam; o globo entra quando as texturas chegam
let entrou = false;
function entrar() {
  if (entrou) return;
  entrou = true;
  html.classList.add('is-carregado');
  document.querySelector('.hero')?.classList.add('is-visivel');
}
document.fonts.ready.then(() => requestAnimationFrame(entrar));
setTimeout(entrar, 2500);

// globo: camada fixa atrás do conteúdo. O Three.js vem num pedaço próprio, sem atrasar a página.
// sem o hero ou sem o canvas, a página segue sem o globo
const canvas = L.hero ? document.querySelector('.globo') : null;
let coreografia = null;
let globo = null;
(canvas ? Promise.resolve() : Promise.reject(new Error('sem globo')))
  .then(() => Promise.all([import('./motion/globo.js'), import('./motion/coreografia.js'), import('./motion/voo.js'), import('./motion/arrasto.js')]))
  .then(([{ criarGlobo }, { criarCoreografia }, { criarVoo }, { criarArrasto }]) => {
    globo = criarGlobo(canvas, { leve: tela.celular || (navigator.hardwareConcurrency || 8) <= 4 });
    globo.medir(tela.w, tela.h);
    coreografia = criarCoreografia(globo);
    const voo = criarVoo(globo, coreografia, busca);
    const arrasto = criarArrasto(coreografia);
    let visivelAntes = true;
    aCadaQuadro((dt, t) => {
      arrasto.quadro(dt);
      coreografia.quadro(dt, t);
      voo.quadro();
      // desenha enquanto o globo está na tela e mais um quadro quando ele sai (limpa o canvas)
      const visivel = coreografia.visivel();
      if (visivel || visivelAntes) globo.desenhar();
      visivelAntes = visivel;
    });
    if (import.meta.env.DEV) window.__norte = { globo, coreografia, L };
    globo.onPronto = () => {
      canvas.classList.add('is-pronto');
      coreografia.acender(performance.now() / 1000);
    };
    // a falha de região acontece quando a frase "Uma para, outra assume." entra
    const falha = document.querySelector('[data-falha]');
    if (falha?.classList.contains('is-visivel')) coreografia.falhar();
    falha?.addEventListener('revelou', () => coreografia.falhar());
  })
  .catch(() => {
    // sem WebGL: a página segue sem o globo, com o ponto do sufixo aceso
    busca?.pousar(true);
  });

document.fonts.ready.then(() => {
  medirTudo();
  coreografia?.remedir();
});

let timerResize = 0;
let ultimaLargura = tela.w;
window.addEventListener('resize', () => {
  clearTimeout(timerResize);
  timerResize = setTimeout(() => {
    // no celular a barra do navegador muda a altura ao rolar: só remede a página se a largura mudou
    const mudouLargura = window.innerWidth !== ultimaLargura;
    ultimaLargura = window.innerWidth;
    if (mudouLargura || !tela.celular) medirTudo();
    else { tela.h = window.innerHeight; }
    globo?.medir(window.innerWidth, window.innerHeight);
    coreografia?.remedir();
  }, 120);
});

iniciarNav();
iniciarBarra();
iniciarToque();
iniciarNumeros();
iniciarTrilha();
revelar();

// o nome digitado muda o tamanho do domínio no fecho
document.querySelectorAll('[data-ajusta]').forEach(el => el.addEventListener('mudou', () => {
  ajustarPalavras();
}));
