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

    /** Líneas completas (filas, columnas, diagonales) para cuando no hay patrón. */
    function completedLines(hit) {
        const lines = [];
        for (let r = 0; r < 5; r++) lines.push({ name: `Fila ${r + 1}`, idx: [0, 1, 2, 3, 4].map((c) => r * 5 + c) });
        "BINGO".split("").forEach((l, c) => lines.push({ name: `Columna ${l}`, idx: [0, 1, 2, 3, 4].map((r) => r * 5 + c) }));
        lines.push({ name: "Diagonal ↘", idx: [0, 6, 12, 18, 24] });
        lines.push({ name: "Diagonal ↙", idx: [4, 8, 12, 16, 20] });
        return lines.filter((line) => line.idx.every((i) => hit[i])).map((line) => line.name);
    }

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
        const inPattern = new Set(pattern);

        let cells = BingoCore.LETTERS.map((l) => `<div class="vc-head">${l}</div>`).join("");
        flat.forEach((n, i) => {
            const cls = ["vc-cell"];
            if (hit[i]) cls.push("vc-hit");
            if (inPattern.has(i)) cls.push(hit[i] ? "vc-pattern-ok" : "vc-pattern-miss");
            cells += `<div class="${cls.join(" ")}">${n === null ? "★" : n}</div>`;
        });

        let verdict;
        if (pattern.length > 0) {
            const missing = pattern.filter((i) => !hit[i]).map((i) => flat[i]);
            verdict = missing.length === 0
                ? `<div class="alert alert-success mb-0"><strong>✅ ¡BINGO válido!</strong> Cumple el patrón.</div>`
                : `<div class="alert alert-warning mb-0"><strong>❌ No cumple el patrón.</strong> Faltan: ${missing.join(", ")}</div>`;
        } else {
            const lines = completedLines(hit);
            verdict = lines.length > 0
                ? `<div class="alert alert-success mb-0"><strong>✅ Línea completa:</strong> ${lines.join(", ")}<br><small>No hay patrón marcado; se revisaron filas, columnas y diagonales.</small></div>`
                : `<div class="alert alert-warning mb-0"><strong>❌ Sin línea completa.</strong><br><small>No hay patrón marcado; se revisaron filas, columnas y diagonales.</small></div>`;
        }

        const hits = hit.filter(Boolean).length - 1; // sin contar el libre
        result.innerHTML = `
            <div class="vc-title">Cartón #${serial} · ${hits}/24 números salidos</div>
            <div class="vc-grid">${cells}</div>
            ${verdict}`;
    });
})();
