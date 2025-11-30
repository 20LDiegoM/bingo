/**
 * Controlador del Juego de Bingo
 * 
 * Sistema que maneja la lógica del juego de bingo, incluyendo:
 * - Tabla de números B-I-N-G-O
 * - Historial de números marcados
 * - Animaciones de celebración con confetti
 * - Reproducción de audio de victoria
 * - Tarjeta de bingo interactiva
 * 
 * @author Tu Nombre
 * @version 2.0
 * @since 2024
 */

// Variables globales del sistema
/** @type {Array<number>} Array que almacena los últimos números marcados (máximo 3) */
let lastNumbers = [];

// Referencias a elementos del DOM
const bingo = document.getElementById("bingo");
const bingoCard = document.getElementById("bingoCard");
const cleanBtn = document.getElementById("cleanBtn");
const bingoTable = document.getElementById("bingoTable");
const history = document.getElementById("history");

/**
 * Configuración de columnas del bingo con sus rangos de números
 * 
 * Estructura estándar del bingo americano:
 * - B: números 1-15
 * - I: números 16-30  
 * - N: números 31-45
 * - G: números 46-60
 * - O: números 61-75
 * 
 * @type {Object<string, Array<number>>}
 */
const columns = {
    B: Array.from({ length: 15 }, (_, i) => i + 1),
    I: Array.from({ length: 15 }, (_, i) => i + 16),
    N: Array.from({ length: 15 }, (_, i) => i + 31),
    G: Array.from({ length: 15 }, (_, i) => i + 46),
    O: Array.from({ length: 15 }, (_, i) => i + 61)
};

/**
 * Inicialización de la tarjeta de bingo interactiva
 * 
 * Crea una cuadrícula de 5x5 (25 celdas) donde cada celda puede ser
 * marcada por el jugador para crear patrones de bingo.
 */
for (let i = 0; i < 25; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    
    // Agregar funcionalidad de toggle para marcar/desmarcar celdas
    cell.addEventListener("click", () => cell.classList.toggle("pattern"));
    
    bingoCard.appendChild(cell);
}

// Event listeners principales
cleanBtn.addEventListener("click", () => cleanTable());
bingo.addEventListener("click", () => bingoCelebration());

/**
 * Limpia completamente el estado del juego
 * 
 * Resetea todos los elementos visuales y datos del juego:
 * - Remueve números marcados de la tabla
 * - Limpia el historial de números
 * - Resetea patrones de la tarjeta de bingo
 * - Restaura el estado inicial del juego
 */
function cleanTable() {
    // Limpiar números marcados en la tabla principal
    document.querySelectorAll(".marked").forEach((cell) => 
        cell.classList.remove("marked")
    );
    
    // Resetear historial
    lastNumbers = [];
    history.innerHTML = "";
    
    // Limpiar patrones de la tarjeta de bingo
    document.querySelectorAll(".pattern").forEach((cell) => 
        cell.classList.remove("pattern")
    );
}

/**
 * Actualiza el historial de números marcados
 * 
 * Mantiene un registro de los últimos 3 números marcados,
 * agregando el nuevo número al inicio y removiendo el más antiguo
 * si se excede el límite.
 * 
 * @param {number} number - Número que se acaba de marcar
 */
function updateHistory(number) {
    // Agregar número al inicio del array
    lastNumbers.unshift(number);
    
    // Mantener máximo 3 números en el historial
    if (lastNumbers.length > 3) {
        lastNumbers.pop();
    }
    
    // Actualizar visualización
    renderHistory();
}

/**
 * Remueve un número específico del historial
 * 
 * Se ejecuta cuando un número es desmarcado de la tabla.
 * Filtra el número del array y actualiza la visualización.
 * 
 * @param {number} number - Número a remover del historial
 */
function removeHistory(number) {
    lastNumbers = lastNumbers.filter((num) => num !== number);
    renderHistory();
}

/**
 * Renderiza visualmente el historial de números
 * 
 * Crea elementos HTML para mostrar los últimos números marcados,
 * destacando el más reciente con una clase especial.
 */
function renderHistory() {
    history.innerHTML = lastNumbers
        .map((num, idx) => 
            `<div class="${idx === 0 ? "last-number" : ""}">${num || "-"}</div>`
        )
        .join("");
}

/** @type {HTMLAudioElement|null} Referencia al audio de celebración actualmente reproduciéndose */
let celebrationAudio = null;

/**
 * Reproduce un archivo de audio MP3 para la celebración
 * 
 * Crea un elemento de audio, configura el archivo fuente y lo reproduce.
 * Guarda la referencia global para poder controlarlo posteriormente.
 * Incluye manejo de errores para fallos de reproducción.
 * 
 * @param {string} audioPath - Ruta al archivo MP3 a reproducir
 * @returns {HTMLAudioElement|null} Referencia al elemento de audio creado
 */
function playAudio(audioPath) {
    try {
        // Detener audio anterior si existe
        if (celebrationAudio) {
            celebrationAudio.pause();
            celebrationAudio.currentTime = 0;
        }
        
        // Crear nuevo elemento de audio
        celebrationAudio = new Audio(audioPath);
        
        // Configurar propiedades del audio
        celebrationAudio.volume = 1; // Volumen al 70%
        celebrationAudio.preload = 'auto';
        
        // Reproducir audio
        const playPromise = celebrationAudio.play();
        
        // Manejar la promesa de reproducción (requerido en algunos navegadores)
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Audio de celebración reproducido exitosamente');
                })
                .catch(error => {
                    console.warn('Error al reproducir audio de celebración:', error);
                });
        }
        
        return celebrationAudio;
        
    } catch (error) {
        console.error('Error al crear/reproducir audio:', error);
        return null;
    }
}

/**
 * Detiene el audio de celebración si está reproduciéndose
 * 
 * Pausa el audio actual y resetea su posición al inicio.
 * Limpia la referencia global del audio.
 */
function stopAudio() {
    if (celebrationAudio) {
        celebrationAudio.pause();
        celebrationAudio.currentTime = 0;
        celebrationAudio = null;
        console.log('Audio de celebración detenido');
    }
}

/**
 * Ejecuta la animación de celebración de BINGO
 * 
 * Función principal de celebración que incluye:
 * - Activación del modo oscuro
 * - Múltiples explosiones de confetti animadas
 * - Reproducción de audio de victoria (se detiene automáticamente)
 * - Limpieza automática después de la celebración
 * 
 * Secuencia de celebración:
 * 1. Activa overlay oscuro
 * 2. Reproduce audio de celebración
 * 3. Ejecuta 20 explosiones de confetti aleatorias
 * 4. Después de 2 segundos, detiene audio, limpia y restaura estado normal
 */
function bingoCelebration() {
    // Activar modo oscuro para efecto dramático
    document.getElementById("overley").classList.add("dark-mode");
    
    // Reproducir audio de celebración
    // NOTA: Cambia 'ruta/a/tu/audio.mp3' por la ruta real de tu archivo MP3
    playAudio('assets/fireworks-b.mp3');
    
    // Configuración de la animación de confetti
    let count = 20; // Número total de explosiones
    
    // Intervalo para explosiones consecutivas de confetti
    let interval = setInterval(() => {
        // Generar posición aleatoria para la explosión
        let x = Math.random(); // Posición horizontal aleatoria (0-1)
        let y = Math.random() * 0.6; // Posición vertical (evita la parte inferior)

        // Ejecutar explosión de confetti
        confetti({
            particleCount: 100,    // Cantidad de partículas por explosión
            startVelocity: 50,     // Velocidad inicial de las partículas
            spread: 360,           // Ángulo de dispersión (círculo completo)
            ticks: 60,             // Duración de la animación
            origin: { x, y }       // Punto de origen de la explosión
        });

        count--;
        
        // Terminar celebración después de todas las explosiones
        if (count === 0) {
            clearInterval(interval);
            
            // Limpiar y restaurar estado normal después de 2 segundos
            setTimeout(() => {
                // Detener audio antes de limpiar
                stopAudio();
                cleanTable();
                document.getElementById("overley").classList.remove("dark-mode");
            }, 2000);
        }
    }, 700); // Intervalo de 700ms entre explosiones
}

/**
 * Inicialización de la tabla de números del bingo
 * 
 * Genera dinámicamente la interfaz de la tabla de bingo con:
 * - Headers de columnas (B, I, N, G, O)
 * - Números organizados por columna
 * - Funcionalidad de click para marcar/desmarcar
 * - Actualización automática del historial
 */
Object.entries(columns).forEach(([key, values]) => {
    // Crear contenedor para cada columna
    const wrapper = document.createElement("div");
    const header = document.createElement("div");

    wrapper.classList.add("numbers-wrapper");
    header.classList.add("bingo-header");

    // Configurar header de la columna
    header.textContent = key;
    wrapper.appendChild(header);
    
    // Crear celdas de números para la columna
    values.forEach((number) => {
        const numberCell = document.createElement("div");
        numberCell.classList.add("number");
        numberCell.textContent = number;
        
        // Agregar funcionalidad de click para marcar números
        numberCell.addEventListener("click", () => {
            numberCell.classList.toggle("marked");
            
            // Actualizar historial según si se marca o desmarca
            if (numberCell.classList.contains("marked")) {
                updateHistory(number);
            } else {
                removeHistory(number);
            }
        });
        
        wrapper.appendChild(numberCell);
    });

    // Agregar columna completa a la tabla
    bingoTable.appendChild(wrapper);
});