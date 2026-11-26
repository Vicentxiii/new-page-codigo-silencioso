// Vídeo do meio da página: toca só quando está perto da tela, para não gastar decodificação fora de vista.
export function iniciarVideo() {
  const video = document.querySelector('.video__moldura video');
  if (!video || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(entradas => {
    for (const e of entradas) {
      if (e.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }
  }, { rootMargin: '160px 0px', threshold: 0.01 });

  io.observe(video);
}
