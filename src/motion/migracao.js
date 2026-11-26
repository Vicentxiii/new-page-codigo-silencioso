// Formulário da migração: foco, preenchido, erro por campo, enviando e enviado (fictício).
// Cada campo é validado pelo tipo do <input>: type="email" confere o e-mail, inputmode="url" confere o endereço,
// os outros só pedem pelo menos 2 letras. As mensagens vêm do HTML (data-vazio e data-ruim no <input>), com estas
// de reserva; campo opcional leva data-opcional.

const validos = {
  url: v => /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(v.trim()),
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  texto: v => v.trim().length >= 2,
};
const reserva = {
  url: { vazio: 'Diga qual é o seu site.', ruim: 'Confira o endereço (ex.: seusite.com.br).' },
  email: { vazio: 'Precisamos do seu e-mail.', ruim: 'Esse e-mail parece incompleto.' },
  texto: { vazio: 'Preencha este campo.', ruim: 'Confira este campo.' },
};
const tipo = (input) => (input.type === 'email' ? 'email' : input.inputMode === 'url' || input.type === 'url' ? 'url' : 'texto');

export function iniciarMigracao() {
  const form = document.querySelector('[data-migracao]');
  if (!form) return;
  const campos = [...form.querySelectorAll('.campo')];
  const botao = form.querySelector('.botao');
  const ok = form.querySelector('[data-email-ok]');

  function checar(campo, mostrar) {
    const input = campo.querySelector('input');
    const t = tipo(input);
    const v = input.value;
    const vazio = input.dataset.vazio || reserva[t].vazio;
    const ruim = input.dataset.ruim || reserva[t].ruim;
    const msg = !v.trim() ? ('opcional' in input.dataset ? '' : vazio) : !validos[t](v) ? ruim : '';
    if (mostrar) {
      campo.classList.toggle('is-erro', !!msg);
      campo.querySelector('.campo__erro').textContent = msg;
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }
    return !msg;
  }

  campos.forEach(campo => {
    const input = campo.querySelector('input');
    input.addEventListener('input', () => {
      campo.classList.toggle('is-cheio', input.value.length > 0);
      if (campo.classList.contains('is-erro')) checar(campo, true);
    });
    input.addEventListener('blur', () => { if (input.value) checar(campo, true); });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    let primeiro = null;
    campos.forEach(campo => {
      if (!checar(campo, true)) {
        primeiro = primeiro || campo;
        campo.classList.remove('is-treme');
        void campo.offsetWidth;
        campo.classList.add('is-treme');
      }
    });
    if (primeiro) {
      primeiro.querySelector('input').focus();
      return;
    }
    form.classList.add('is-enviando');
    botao.classList.add('is-ocupado');
    botao.querySelectorAll('.rola__a, .rola__b').forEach(s => { s.textContent = 'Enviando…'; });
    setTimeout(() => {
      form.classList.remove('is-enviando');
      if (ok) ok.textContent = form.querySelector('input[type="email"]')?.value.trim() ?? '';
      form.classList.add('is-enviado');
      // os campos e o botão somem: saem também do Tab e do leitor de tela, e o foco vai para a confirmação
      campos.forEach(c => { c.inert = true; });
      botao.inert = true;
      const confirma = form.querySelector('.linha-form__ok');
      if (confirma) { confirma.tabIndex = -1; confirma.focus(); }
    }, 1100);
  });
}
