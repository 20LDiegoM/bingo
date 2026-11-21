/**
 * Ventana "Invitar jugadores": QR grande + enlace + contraseña de /carton.
 * Pensada para proyectarla en pantalla y que los jugadores la escaneen.
 *
 * Requiere: js/card-core.js (BingoCore.CONFIG) y qrcodejs (window.QRCode).
 * Uso: BingoInvite.open()
 */
(function () {
    const url = location.origin + "/carton/";
    let overlay = null;

    const css = `
    .invite-overlay {
        position: fixed; inset: 0; z-index: 3000;
        background: rgba(20, 16, 48, .78);
        backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center;
        padding: 16px;
        animation: inviteFade .2s ease-out;
    }
    .invite-overlay[hidden] { display: none; }
    @keyframes inviteFade { from { opacity: 0; } to { opacity: 1; } }
    .invite-box {
        width: 100%; max-width: 440px;
        background: #fff; color: #222;
        border-radius: 22px;
        padding: 28px 24px 22px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,.4);
        font-family: system-ui, 'Segoe UI', Roboto, sans-serif;
    }
    .invite-box h2 { margin: 0 0 4px; font-size: 1.7rem; font-weight: 800; }
    .invite-box .invite-sub { margin: 0 0 18px; color: #666; }
    .invite-qr { display: flex; justify-content: center; margin: 0 auto 16px; }
    .invite-qr img, .invite-qr canvas { width: 280px; height: 280px; max-width: 70vw; max-height: 70vw; }
    .invite-url { font-size: 1.15rem; font-weight: 700; color: #4a4fb5; word-break: break-all; margin-bottom: 14px; }
    .invite-pass {
        display: inline-flex; align-items: baseline; gap: 10px;
        background: #f3f1ff; border-radius: 12px; padding: 10px 18px; margin-bottom: 20px;
    }
    .invite-pass span { color: #666; }
    .invite-pass strong { font-size: 1.6rem; letter-spacing: 2px; }
    .invite-actions { display: flex; gap: 10px; }
    .invite-actions button {
        flex: 1; border: none; border-radius: 12px; padding: 12px; font-size: 1rem; font-weight: 700; cursor: pointer;
    }
    .invite-copy { background: #eef0ff; color: #4a4fb5; }
    .invite-close { background: linear-gradient(45deg, #667eea, #764ba2); color: #fff; }`;

    function build() {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);

        overlay = document.createElement("div");
        overlay.className = "invite-overlay";
        overlay.hidden = true;
        overlay.innerHTML = `
            <div class="invite-box" role="dialog" aria-modal="true" aria-label="Invitar jugadores">
                <h2>📱 ¡Únete al bingo!</h2>
                <p class="invite-sub">Escanea el código con la cámara del celular</p>
                <div class="invite-qr"></div>
                <div class="invite-url"></div>
                <div class="invite-pass"><span>Contraseña</span><strong></strong></div>
                <div class="invite-actions">
                    <button class="invite-copy">🔗 Copiar enlace</button>
                    <button class="invite-close">Cerrar</button>
                </div>
            </div>`;
        overlay.querySelector(".invite-url").textContent = url.replace(/^https?:\/\//, "");
        overlay.querySelector(".invite-pass strong").textContent = BingoCore.CONFIG.PASSWORD;

        const qrEl = overlay.querySelector(".invite-qr");
        if (window.QRCode) {
            new QRCode(qrEl, { text: url, width: 560, height: 560, correctLevel: QRCode.CorrectLevel.M });
        } else {
            qrEl.textContent = "(No se pudo cargar el código QR)";
        }

        const copyBtn = overlay.querySelector(".invite-copy");
        copyBtn.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(url);
                copyBtn.textContent = "✅ Copiado";
            } catch {
                copyBtn.textContent = url;
            }
            setTimeout(() => { copyBtn.textContent = "🔗 Copiar enlace"; }, 2000);
        });
        overlay.querySelector(".invite-close").addEventListener("click", close);
        overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
        document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.hidden) close(); });
        document.body.appendChild(overlay);
    }

    function open() {
        if (!overlay) build();
        overlay.hidden = false;
    }

    function close() {
        if (overlay) overlay.hidden = true;
    }

    window.BingoInvite = { open, close };
})();
