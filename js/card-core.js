/**
 * Núcleo compartido de cartones de bingo.
 *
 * Genera cartones de forma DETERMINISTA a partir de un número de serie:
 * el mismo serial siempre produce exactamente el mismo cartón. Así el
 * panel de control puede reconstruir y verificar el cartón de cualquier
 * jugador sin necesidad de base de datos.
 *
 * Lo usan: carton/index.html (jugadores) e index.html (verificación).
 */
(function (global) {
    /** Configuración del juego (compartida por todas las páginas). */
    const CONFIG = {
        PASSWORD: "bingo26", // contraseña simple de /carton (visible en el código; solo para ajenos)
        MAX_CARDS: 3,        // cartones por jugador
    };

    const SERIAL_MIN = 100000;
    const SERIAL_MAX = 999999;
    const LETTERS = ["B", "I", "N", "G", "O"];

    /** PRNG mulberry32: rápido, determinista y suficiente para un juego. */
    function mulberry32(seed) {
        let a = seed >>> 0;
        return function () {
            a = (a + 0x6d2b79f5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function isValidSerial(serial) {
        return Number.isInteger(serial) && serial >= SERIAL_MIN && serial <= SERIAL_MAX;
    }

    /** Serial aleatorio nuevo (no determinista) para un jugador. */
    function randomSerial() {
        let r;
        if (global.crypto && global.crypto.getRandomValues) {
            r = global.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
        } else {
            r = Math.random();
        }
        return SERIAL_MIN + Math.floor(r * (SERIAL_MAX - SERIAL_MIN + 1));
    }

    /**
     * Devuelve el cartón del serial como matriz 5x5 por filas:
     * grid[fila][columna], columnas B-I-N-G-O. El centro es null (libre).
     */
    function cardFromSerial(serial) {
        if (!isValidSerial(serial)) throw new Error("Serial inválido: " + serial);
        const rand = mulberry32(serial * 2654435761);

        // Para cada columna: barajar su rango de 15 números y tomar 5
        const cols = LETTERS.map((_, c) => {
            const pool = Array.from({ length: 15 }, (_, i) => c * 15 + i + 1);
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(rand() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            return pool.slice(0, 5);
        });

        const grid = [];
        for (let row = 0; row < 5; row++) {
            grid.push(cols.map((col) => col[row]));
        }
        grid[2][2] = null; // espacio libre
        return grid;
    }

    /** Convierte "#123 456", "123456", etc. a número; null si no es válido. */
    function parseSerial(text) {
        const n = parseInt(String(text).replace(/\D/g, ""), 10);
        return isValidSerial(n) ? n : null;
    }

    global.BingoCore = { CONFIG, LETTERS, cardFromSerial, randomSerial, parseSerial, isValidSerial };
})(window);
