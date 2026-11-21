/**
 * Verificación de cartones virtuales desde el panel de control.
 *
 * Reconstruye el cartón de un jugador a partir de su serial (BingoCore)
 * y lo compara con los números marcados en la tabla y con el patrón.
 */
(function () {
    const modalEl = document.getElementById("verifyModal");
    const form = document.getElementById("verifyForm");
    const input = document.getElementById("verifySerialInput");
    const result = document.getElementById("verifyResult");
    const modal = new bootstrap.Modal(modalEl);

    document.getElementById("verifyBtn").addEventListener("click", () => {
        result.innerHTML = "";
        input.value = "";
        modal.show();
    });
    modalEl.addEventListener("shown.bs.modal", () => input.focus());

    /** Números marcados en la tabla (tómbola + manuales). */
    function drawnNumbers() {
        const set = new Set();
        document.querySelectorAll("#bingoTable .number.marked").forEach((el) => {
            set.add(parseInt(el.textContent, 10));
        });
        return set;
    }

    /** Índices (0-24, por filas) marcados en el patrón del panel. */
    function patternIndices() {
        return Array.from(document.querySelectorAll("#bingoCard .cell"))
            .map((cell, i) => (cell.classList.contains("pattern") ? i : -1))
            .filter((i) => i >= 0);
    }

    const MAIN_DIAG = [0, 6, 12, 18, 24];
    const ANTI_DIAG = [4, 8, 12, 16, 20];
    const sameSet = (a, b) => a.length === b.length && a.every((i) => b.includes(i));

    /**
     * Todas las posiciones válidas del patrón: el patrón se desplaza por el
     * cartón a cualquier lugar donde quepa. Así una columna marcada vale para
     * cualquier columna, una fila para cualquier fila, un 2x2 en cualquier
     * lugar, etc. Patrones que ocupan todo el cartón no se pueden mover y
     * quedan fijos. Caso especial: una diagonal vale por cualquiera de las dos.
     */
    function patternPlacements(pattern) {
        if (sameSet(pattern, MAIN_DIAG) || sameSet(pattern, ANTI_DIAG)) return [MAIN_DIAG, ANTI_DIAG];

        const pts = pattern.map((i) => [Math.floor(i / 5), i % 5]);
        const minR = Math.min(...pts.map((p) => p[0])), maxR = Math.max(...pts.map((p) => p[0]));
        const minC = Math.min(...pts.map((p) => p[1])), maxC = Math.max(...pts.map((p) => p[1]));

        const placements = [];
        for (let dr = -minR; dr <= 4 - maxR; dr++) {
            for (let dc = -minC; dc <= 4 - maxC; dc++) {
                placements.push(pts.map(([r, c]) => (r + dr) * 5 + (c + dc)));
            }
        }
        return placements;
    }

    /** Líneas completas (filas, columnas, diagonales) para cuando no hay patrón. */
    function completedLines(hit) {
        const lines = [];
        for (let r = 0; r < 5; r++) lines.push({ name: `Fila ${r + 1}`, idx: [0, 1, 2, 3, 4].map((c) => r * 5 + c) });
        "BINGO".split("").forEach((l, c) => lines.push({ name: `Columna ${l}`, idx: [0, 1, 2, 3, 4].map((r) => r * 5 + c) }));
        lines.push({ name: "Diagonal ↘", idx: MAIN_DIAG });
        lines.push({ name: "Diagonal ↙", idx: ANTI_DIAG });
        return lines.filter((line) => line.idx.every((i) => hit[i])).map((line) => line.name);
    }

    const celebrateBtn = (serial) =>
        `<button type="button" class="btn btn-warning fw-bold w-100 mt-3 celebrate-btn" data-serial="${serial}">🎉 ¡Celebrar!</button>`;

    // Botón "Celebrar" del resultado: cierra la ventana y lanza la celebración
    result.addEventListener("click", (e) => {
        const btn = e.target.closest(".celebrate-btn");
        if (!btn) return;
        modal.hide();
        bingoCelebration(Number(btn.dataset.serial));
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const serial = BingoCore.parseSerial(input.value);
        if (serial === null) {
            result.innerHTML = `<div class="alert alert-danger mt-3 mb-0">Serial inválido. Debe tener 6 dígitos (ej. 482913).</div>`;
            return;
        }

        const flat = BingoCore.cardFromSerial(serial).flat();
        const drawn = drawnNumbers();
        const hit = flat.map((n) => n === null || drawn.has(n));
        const pattern = patternIndices();

        // Elegir la posición del patrón a mostrar: la primera completa,
        // o si ninguna lo está, la que tenga menos números faltantes.
        let shown = [];
        let verdict;
        if (pattern.length > 0) {
            const placements = patternPlacements(pattern);
            const scored = placements.map((p) => ({ p, missing: p.filter((i) => !hit[i]) }));
            scored.sort((a, b) => a.missing.length - b.missing.length);
            const best = scored[0];
            shown = best.p;
            const where = placements.length > 1
                ? `<br><small>El patrón se busca en cualquier posición (${placements.length} posibles).</small>`
                : "";
            verdict = best.missing.length === 0
                ? `<div class="alert alert-success mb-0"><strong>✅ ¡BINGO válido!</strong> Cumple el patrón.${where}${celebrateBtn(serial)}</div>`
                : `<div class="alert alert-warning mb-0"><strong>❌ No cumple el patrón.</strong> Lo más cerca: le faltan ${best.missing.map((i) => flat[i]).join(", ")}${where}</div>`;
        } else {
            const lines = completedLines(hit);
            verdict = lines.length > 0
                ? `<div class="alert alert-success mb-0"><strong>✅ Línea completa:</strong> ${lines.join(", ")}<br><small>No hay patrón marcado; se revisaron filas, columnas y diagonales.</small>${celebrateBtn(serial)}</div>`
                : `<div class="alert alert-warning mb-0"><strong>❌ Sin línea completa.</strong><br><small>No hay patrón marcado; se revisaron filas, columnas y diagonales.</small></div>`;
        }

        const inShown = new Set(shown);
        let cells = BingoCore.LETTERS.map((l) => `<div class="vc-head">${l}</div>`).join("");
        flat.forEach((n, i) => {
            const cls = ["vc-cell"];
            if (hit[i]) cls.push("vc-hit");
            if (inShown.has(i)) cls.push(hit[i] ? "vc-pattern-ok" : "vc-pattern-miss");
            cells += `<div class="${cls.join(" ")}">${n === null ? "★" : n}</div>`;
        });

        const hits = hit.filter(Boolean).length - 1; // sin contar el libre
        result.innerHTML = `
            <div class="vc-title">Cartón #${serial} · ${hits}/24 números salidos</div>
            <div class="vc-grid">${cells}</div>
            ${verdict}`;
    });
})();
