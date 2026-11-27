// Vídeo do meio da página: toca só quando está perto da tela, para não gastar decodificação fora de vista.
// Entra no segundo 01 (o #t=1 do <source> já faz isso); o JS cobre os navegadores que ignoram o fragmento
// e o reinício do loop, para o quadro 00 nunca aparecer.
const INICIO = 1; // segundo

export function iniciarVideo() {
  const video = document.querySelector('.video__moldura video');
  if (!video) return;

  function irAoInicio() {
    if (video.readyState >= 1 && !video.seeking && video.currentTime < INICIO - 0.05) {
      video.currentTime = INICIO;
    }
  }
  video.addEventListener('loadedmetadata', irAoInicio);
  video.addEventListener('timeupdate', irAoInicio);

  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entradas => {
    for (const e of entradas) {
      if (e.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }
  }, { rootMargin: '160px 0px', threshold: 0.01 });

  io.observe(video);
}
