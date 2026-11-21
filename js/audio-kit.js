/**
 * Reproductor de sonidos con Web Audio API.
 *
 * Por qué no usar `new Audio().play()`: los navegadores (sobre todo Safari)
 * bloquean el audio que no arranca dentro del mismo clic del usuario. La voz
 * del número suena 1 s después del clic y, en el sorteo automático, desde un
 * temporizador, así que se bloqueaba. Con Web Audio basta "desbloquear" el
 * contexto una vez con el primer clic/tecla y desde ahí todo suena.
 *
 * Además cachea los sonidos decodificados para que no haya retraso.
 *
 * Uso:
 *   AudioKit.play(url, { volume, channel })  → reproduce (cortando lo que suene en ese canal)
 *   AudioKit.stop(channel)                   → detiene el canal
 *   AudioKit.preload(urls)                   → descarga y decodifica por adelantado
 */
(function () {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    let ctx = null;
    const cache = new Map();    // url -> Promise<AudioBuffer>
    const channels = new Map(); // canal -> AudioBufferSourceNode

    function context() {
        if (!ctx && Ctx) ctx = new Ctx();
        return ctx;
    }

    /** Desbloquea el audio. Debe llamarse dentro de un gesto del usuario. */
    function unlock() {
        const c = context();
        if (!c) return;
        if (c.state === "suspended") c.resume();
        // Safari: reproducir un buffer vacío termina de desbloquear
        const src = c.createBufferSource();
        src.buffer = c.createBuffer(1, 1, 22050);
        src.connect(c.destination);
        src.start(0);
    }

    function load(url) {
        if (!cache.has(url)) {
            const p = fetch(url)
                .then((r) => {
                    if (!r.ok) throw new Error(`${r.status} ${url}`);
                    return r.arrayBuffer();
                })
                .then((data) => new Promise((resolve, reject) => context().decodeAudioData(data, resolve, reject)));
            p.catch(() => cache.delete(url)); // reintentar la próxima vez
            cache.set(url, p);
        }
        return cache.get(url);
    }

    function preload(urls) {
        if (!context()) return;
        urls.forEach((u) => load(u).catch(() => {}));
    }

    function stop(channel) {
        const src = channels.get(channel);
        if (src) {
            try { src.stop(); } catch {}
            channels.delete(channel);
        }
    }

    async function play(url, { volume = 1, channel = url } = {}) {
        const c = context();
        if (!c) return;
        if (c.state === "suspended") c.resume();
        try {
            const buffer = await load(url);
            stop(channel);
            const src = c.createBufferSource();
            src.buffer = buffer;
            const gain = c.createGain();
            gain.gain.value = volume;
            src.connect(gain).connect(c.destination);
            src.onended = () => { if (channels.get(channel) === src) channels.delete(channel); };
            channels.set(channel, src);
            src.start();
        } catch (err) {
            console.warn("No se pudo reproducir", url, err);
        }
    }

    // Desbloquear con la primera interacción (y en cada una por si el navegador lo suspende)
    ["pointerdown", "keydown", "touchstart"].forEach((ev) =>
        document.addEventListener(ev, unlock, { capture: true, passive: true })
    );

    window.AudioKit = { play, stop, preload, unlock };
})();
