// O fio do meio da página: o nome que o visitante digita e o plano que escolhe
// seguem para o resumo dos planos e para o fecho.

// Os planos, o plano marcado e a terminação marcada vêm do HTML (src/sections/planos.html e dominio.html): o nome de
// cada plano é o texto de .plano__nome, o marcado é o que tem aria-checked="true", a terminação é a de aria-pressed.
export const PLANOS = {};
document.querySelectorAll('[data-planos] .plano').forEach((l) => {
  PLANOS[l.dataset.plano] = { nome: l.querySelector('.plano__nome')?.textContent.trim() ?? l.dataset.plano };
});
const marcado = document.querySelector('[data-planos] .plano[aria-checked="true"]') ?? document.querySelector('[data-planos] .plano');
const tldMarcada = document.querySelector('[data-tlds] .tld__escolher[aria-pressed="true"]')?.closest('.tld') ?? document.querySelector('[data-tlds] .tld');
// o nome de exemplo é o placeholder da busca ("seunegocio"); sem a busca, o domínio escrito no resumo ou no fecho
const escrito = document.querySelector('[data-dominio]')?.textContent.trim() ?? '';
const exemplo = document.querySelector('.busca__input')?.placeholder || escrito.split('.')[0] || 'seunegocio';

const estado = {
  nome: '',
  tld: tldMarcada?.dataset.tld ?? (escrito.includes('.') ? escrito.slice(escrito.indexOf('.')) : '.com.br'),
  plano: marcado?.dataset.plano ?? '',
  ciclo: 'mensal',
  precos: {}, // preenchido por planos.js: { site: { mensal: '19,90', anual: '15,90' }, ... }
};
const ouvintes = new Set();

export function definir(parcial) {
  Object.assign(estado, parcial);
  ouvintes.forEach(f => f(estado));
}
export function ouvir(f) {
  ouvintes.add(f);
  f(estado);
}
export const ler = () => estado;
export const dominio = e => `${e.nome || exemplo}${e.tld}`;
