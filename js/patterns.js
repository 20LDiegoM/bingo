/**
 * Patrones de bingo: catálogo, patrón aleatorio y registro de patrones jugados.
 *
 * - Catálogo de patrones clásicos (índices 0-24 del cartón, por filas; 12 = centro libre).
 * - "Aleatorio" elige uno que todavía no se haya jugado.
 * - Al celebrar un BINGO, el patrón actual se guarda como jugado (localStorage).
 * - El patrón manual sigue funcionando: si coincide con uno del catálogo, muestra su nombre.
 *
 * Requiere en la página: #bingoCard (25 .cell), #patternName, #patternRandomBtn,
 * #patternClearBtn, #playedPatterns, #playedCount, #playedClearBtn.
 */
(function () {
    // ---------- Catálogo ----------
    const row = (r) => [0, 1, 2, 3, 4].map((c) => r * 5 + c);
    const col = (c) => [0, 1, 2, 3, 4].map((r) => r * 5 + c);
    const DIAG = [0, 6, 12, 18, 24];
    const ANTI = [4, 8, 12, 16, 20];
    const uniq = (...parts) => [...new Set(parts.flat())].sort((a, b) => a - b);

    const CATALOG = [
        { name: "Línea horizontal", cells: row(2) },
        { name: "Línea vertical", cells: col(2) },
        { name: "Diagonal", cells: DIAG },
        { name: "Cuatro esquinas", cells: [0, 4, 20, 24] },
        { name: "Cuadrito (2×2)", cells: [0, 1, 5, 6] },
        { name: "Marco grande", cells: uniq(row(0), row(4), col(0), col(4)) },
        { name: "Marco pequeño", cells: [6, 7, 8, 11, 13, 16, 17, 18] },
        { name: "Cruz", cells: uniq(row(2), col(2)) },
        { name: "Letra X", cells: uniq(DIAG, ANTI) },
        { name: "Letra T", cells: uniq(row(0), col(2)) },
        { name: "Letra L", cells: uniq(col(0), row(4)) },
        { name: "Letra H", cells: uniq(col(0), col(4), row(2)) },
        { name: "Letra U", cells: uniq(col(0), col(4), row(4)) },
        { name: "Letra C", cells: uniq(col(0), row(0), row(4)) },
        { name: "Letra E", cells: uniq(col(0), row(0), row(2), row(4)) },
        { name: "Letra I", cells: uniq(row(0), row(4), col(2)) },
        { name: "Letra N", cells: uniq(col(0), col(4), DIAG) },
        { name: "Letra Z", cells: uniq(row(0), row(4), ANTI) },
        { name: "Letra Y", cells: [0, 4, 6, 8, 12, 17, 22] },
        { name: "Diamante", cells: [2, 6, 8, 10, 14, 16, 18, 22] },
        { name: "Pirámide", cells: uniq(row(4), [16, 17, 18, 12]) },
        { name: "Cartón lleno", cells: Array.from({ length: 25 }, (_, i) => i) },
    ];

    const key = (cells) => [...cells].sort((a, b) => a - b).join(",");
    const byKey = new Map(CATALOG.map((p) => [key(p.cells), p]));

    // ---------- Almacenamiento ----------
    const STORE = "bingo_played_patterns";
    function loadPlayed() {
        try {
            const v = JSON.parse(localStorage.getItem(STORE));
            return Array.isArray(v) ? v : [];
        } catch { return []; }
    }
    function savePlayed(list) {
        try { localStorage.setItem(STORE, JSON.stringify(list)); } catch {}
    }
    let played = loadPlayed();

    // ---------- DOM ----------
    const $ = (id) => document.getElementById(id);
    const cellsEl = () => [...$("bingoCard").querySelectorAll(".cell")];

    function current() {
        return cellsEl().map((c, i) => (c.classList.contains("pattern") ? i : -1)).filter((i) => i >= 0);
    }

    function nameOf(cells) {
        if (cells.length === 0) return "";
        const p = byKey.get(key(cells));
        return p ? p.name : "Personalizado";
    }

    function apply(cells) {
        const set = new Set(cells);
        cellsEl().forEach((c, i) => c.classList.toggle("pattern", set.has(i)));
        // el observador actualiza el nombre
    }

    function updateName() {
        const cells = current();
        const el = $("patternName");
        el.textContent = cells.length ? nameOf(cells) : "Elige uno o márcalo a mano";
        el.classList.toggle("is-empty", cells.length === 0);
    }

    function miniGrid(cells) {
        const set = new Set(cells);
        return `<span class="mini-grid">${Array.from({ length: 25 }, (_, i) => `<i class="${set.has(i) ? "on" : ""}"></i>`).join("")}</span>`;
    }

    function renderPlayed() {
        $("playedCount").textContent = `${played.length}`;
        $("playedClearBtn").hidden = played.length === 0;
        const box = $("playedPatterns");
        if (played.length === 0) {
            box.innerHTML = `<span class="played-empty">Se guardan al celebrar un BINGO</span>`;
            return;
        }
        box.innerHTML = played
            .map((p, i) => `<button type="button" class="played-chip" data-i="${i}" title="Volver a usar: ${p.name}">${miniGrid(p.cells)}<span>${p.name}</span></button>`)
            .join("");
    }

    /** Elige un patrón del catálogo que no se haya jugado todavía */
    function randomPattern() {
        const playedKeys = new Set(played.map((p) => key(p.cells)));
        const now = key(current());
        let pool = CATALOG.filter((p) => !playedKeys.has(key(p.cells)) && key(p.cells) !== now);
        if (pool.length === 0) {
            if (!confirm("Ya se jugaron todos los patrones del catálogo. ¿Limpiar el historial y empezar de nuevo?")) return;
            played = [];
            savePlayed(played);
            renderPlayed();
            pool = CATALOG.filter((p) => key(p.cells) !== now);
        }
        const pick = pool[Math.floor(Math.random() * pool.length)];
        apply(pick.cells);
        const card = $("bingoCard");
        card.classList.remove("pattern-pop");
        void card.offsetWidth;
        card.classList.add("pattern-pop");
    }

    /** Guarda el patrón actual como jugado (lo llama la celebración de BINGO) */
    function recordPlayed() {
        const cells = current();
        if (cells.length === 0) return;
        const k = key(cells);
        if (played.some((p) => key(p.cells) === k)) return;
        played.push({ name: nameOf(cells), cells, at: new Date().toISOString() });
        savePlayed(played);
        renderPlayed();
    }

    function init() {
        if (!$("bingoCard")) return;
        // Actualizar el nombre ante cualquier cambio (manual, limpiar, reiniciar, aleatorio)
        new MutationObserver(updateName).observe($("bingoCard"), { subtree: true, attributes: true, attributeFilter: ["class"], childList: true });

        $("patternRandomBtn").addEventListener("click", randomPattern);
        $("patternClearBtn").addEventListener("click", () => apply([]));
        $("playedClearBtn").addEventListener("click", () => {
            if (!confirm("¿Borrar el historial de patrones jugados?")) return;
            played = [];
            savePlayed(played);
            renderPlayed();
        });
        $("playedPatterns").addEventListener("click", (e) => {
            const chip = e.target.closest(".played-chip");
            if (chip) apply(played[Number(chip.dataset.i)].cells);
        });

        updateName();
        renderPlayed();
    }

    window.PatternUI = { CATALOG, randomPattern, recordPlayed, apply, current };
    document.addEventListener("DOMContentLoaded", init);
})();
