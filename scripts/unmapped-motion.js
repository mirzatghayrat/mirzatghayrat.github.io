/* Unmapped page motion: gameplay loops play only while visible; the Nume clip plays once.
   Nothing autoplays when the reader asks for reduced motion (posters stay). */
(() => {
  // The full film is hidden from assistive tech until its player starts; then it becomes reachable.
  const film = document.getElementById('unmapped-full-film');
  film?.addEventListener('play', () => film.removeAttribute('inert'), { once: true });
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window)) return;
  const loops = document.querySelectorAll('video[data-loop-visible]');
  const once = document.querySelectorAll('video[data-play-once]');
  const tryPlay = (v) => {
    if (still.matches) return;
    if (v.preload === 'none') v.preload = 'auto';
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  };
  const loopWatch = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) tryPlay(e.target);
        else e.target.pause();
      }
    },
    { threshold: 0.35 },
  );
  loops.forEach((v) => loopWatch.observe(v));
  const onceWatch = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const v = e.target;
        onceWatch.unobserve(v);
        v.closest('.u-wake')?.classList.add('is-awake');
        tryPlay(v);
      }
    },
    { threshold: 0.6 },
  );
  once.forEach((v) => onceWatch.observe(v));
  still.addEventListener?.('change', () => {
    if (still.matches) document.querySelectorAll('video[data-loop-visible], video[data-play-once]').forEach((v) => v.pause());
  });
})();
