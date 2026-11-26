// Relógio de quem visita (hora local, sem cidade).

export function iniciarRelogio() {
  const h = document.querySelector('[data-relogio] [data-h]');
  const m = document.querySelector('[data-relogio] [data-m]');
  if (!h || !m) return;
  function tic() {
    const agora = new Date();
    const hh = String(agora.getHours()).padStart(2, '0');
    const mm = String(agora.getMinutes()).padStart(2, '0');
    if (h.textContent !== hh) h.textContent = hh;
    if (m.textContent !== mm) m.textContent = mm;
    document.querySelector('[data-relogio]').setAttribute('aria-label', `Agora são ${hh}:${mm}`);
  }
  tic();
  setInterval(tic, 1000);
}
