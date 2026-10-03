/* Unmapped full-film player. Same-origin media and the pinned, unmodified hls.js bundle only. */
(() => {
  for (const video of document.querySelectorAll('video[data-hls-src]')) {
    const container = video.closest('[data-full-film]');
    const start = container?.querySelector('[data-video-start]');
    const error = container?.querySelector('[data-video-error]');
    const retry = container?.querySelector('[data-video-retry]');
    if (!start || !error || !retry) continue;
    const source = video.dataset.hlsSrc;
    let engine = null;
    let initialized = false;
    video.dataset.hlsState = 'idle';
    function fail() {
      video.dataset.hlsState = 'error';
      error.hidden = false;
      start.hidden = true;
    }
    function initialize() {
      if (initialized) return;
      initialized = true;
      error.hidden = true;
      video.dataset.hlsState = 'loading';
      const native = video.canPlayType('application/vnd.apple.mpegurl');
      const preferNative = native && ('ManagedMediaSource' in window || !window.Hls?.isSupported());
      if (preferNative) {
        video.dataset.hlsEngine = 'native';
        video.src = source;
      } else if (window.Hls?.isSupported()) {
        video.dataset.hlsEngine = 'hls.js';
        engine = new window.Hls({
          enableWorker: true,
          backBufferLength: 30,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });
        engine.on(window.Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            engine?.destroy();
            engine = null;
            initialized = false;
            fail();
          }
        });
        engine.attachMedia(video);
        engine.loadSource(source);
      } else if (native) {
        video.dataset.hlsEngine = 'native';
        video.src = source;
      } else {
        initialized = false;
        fail();
      }
    }
    function play() {
      initialize();
      if (!initialized) return;
      video.controls = true;
      video.removeAttribute('aria-hidden');
      if (video.ended) video.currentTime = 0;
      video.play().catch((problem) => {
        if (problem.name === 'NotAllowedError' || problem.name === 'AbortError') {
          start.hidden = false;
          return;
        }
        fail();
      });
    }
    start.addEventListener('click', play);
    retry.addEventListener('click', () => {
      engine?.destroy();
      engine = null;
      initialized = false;
      video.removeAttribute('src');
      video.load();
      play();
    });
    video.addEventListener('playing', () => {
      video.dataset.hlsState = 'playing';
      start.hidden = true;
      error.hidden = true;
    });
    video.addEventListener('pause', () => {
      if (video.dataset.hlsState !== 'error') video.dataset.hlsState = 'paused';
    });
    video.addEventListener('ended', () => {
      video.dataset.hlsState = 'ended';
      start.hidden = false;
    });
    video.addEventListener('error', () => {
      if (video.dataset.hlsEngine === 'native') fail();
    });
    window.addEventListener('pagehide', () => engine?.destroy(), { once: true });
  }
})();
