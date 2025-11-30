/**
 * Controlador del Juego de Bingo V2 - Con Tómbola
 * 
 * Sistema avanzado que maneja la lógica del juego de bingo, incluyendo:
 * - Tabla de números B-I-N-G-O
 * - Tómbola automática que genera números del 1-75 sin repetir
 * - Marcado automático de números en el cartón
 * - Historial de números marcados
 * - Lista de números sorteados
 * - Animaciones de celebración con confetti
 * - Reproducción de audio de victoria
 * - Tarjeta de bingo interactiva
 * 
 * @author Tu Nombre
 * @version 2.0
 * @since 2024
 */

// Variables globales del sistema
/** @type {Array<number>} Array que almacena los últimos números marcados (máximo 5) */
let lastNumbers = [];

/** @type {Array<number>} Array con todos los números disponibles (1-75) */
let availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1);

/** @type {number|null} Número actual mostrado en la tómbola */
let currentNumber = null;

// Variables para el sorteo automático
/** @type {number|null} ID del intervalo para el sorteo automático */
let autoDrawInterval = null;

/** @type {boolean} Estado del sorteo automático (activo/inactivo) */
let isAutoDrawActive = false;

/** @type {boolean} Estado de pausa del sorteo automático */
let isAutoDrawPaused = false;

// Referencias a elementos del DOM
const bingo = document.getElementById("bingo");
const bingoCard = document.getElementById("bingoCard");
const cleanBtn = document.getElementById("cleanBtn");
const resetGameBtn = document.getElementById("resetGame");
const bingoTable = document.getElementById("bingoTable");
const history = document.getElementById("history");
const tombolaBtn = document.getElementById("tombolaBtn");
const autoDrawBtn = document.getElementById("autoDrawBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const numbersLeftDisplay = document.getElementById("numbersLeft");

// Referencias del modal de tómbola
const tombolaModal = document.getElementById("tombolaModal");
const winningNumber = document.getElementById("winningNumber");
const modalNumber = document.getElementById("modalNumber");
const modalLetter = document.getElementById("modalLetter");

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
 * Obtiene la letra correspondiente a un número según las reglas del bingo
 * 
 * @param {number} number - Número del 1 al 75
 * @returns {string} Letra correspondiente (B, I, N, G, O)
 */
function getLetterForNumber(number) {
    if (number >= 1 && number <= 15) return 'B';
    if (number >= 16 && number <= 30) return 'I';
    if (number >= 31 && number <= 45) return 'N';
    if (number >= 46 && number <= 60) return 'G';
    if (number >= 61 && number <= 75) return 'O';
    return '';
}

/**
 * Inicialización de la tarjeta de bingo interactiva
 * 
 * Crea una cuadrícula de 5x5 (25 celdas) donde cada celda puede ser
 * marcada por el jugador para crear patrones de bingo.
 */
function initializeBingoCard() {
    for (let i = 0; i < 25; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        
        // Agregar funcionalidad de toggle para marcar/desmarcar celdas
        cell.addEventListener("click", () => cell.classList.toggle("pattern"));
        
        bingoCard.appendChild(cell);
    }
}

/**
 * Función principal de la tómbola con modal animado
 * 
 * Muestra el modal de tómbola, ejecuta animación durante 3 segundos,
 * luego revela el número sorteado por 3 segundos más, y finalmente
 * cierra el modal y actualiza el juego.
 */
function drawNumber() {
    // Verificar si quedan números disponibles
    if (availableNumbers.length === 0) {
        alert('¡Todos los números han sido sorteados! Reinicia el juego para continuar.');
        stopAutoDraw();
        tombolaBtn.disabled = true;
        tombolaBtn.innerHTML = '🎯 Juego Completo';
        return;
    }

    // Deshabilitar el botón temporalmente solo si no está en modo automático
    if (!isAutoDrawActive) {
        tombolaBtn.disabled = true;
        tombolaBtn.innerHTML = '🎲 Sorteando...';
    }

    // Seleccionar número aleatorio de los disponibles
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const selectedNumber = availableNumbers[randomIndex];
    
    // Mostrar modal de tómbola
    showTombolaModal();
    
    // Después de 1 segundo, mostrar el número sorteado
    setTimeout(() => {
        // Procesar el número sorteado
        processDrawnNumber(selectedNumber);
        
        // Mostrar número en el modal
        showWinningNumber(selectedNumber);
        
        // Después de 2 segundos más, cerrar modal y actualizar juego
        setTimeout(() => {
            hideTombolaModal();
            
            // Restaurar botón solo si no está en modo automático
            if (!isAutoDrawActive) {
                tombolaBtn.disabled = false;
                tombolaBtn.innerHTML = '🎲 Sacar Número de la Tómbola';
            }
            
        }, 2000); // 2 segundos para mostrar el número
        
    }, 1000); // 1 segundo de animación de tómbola
}

/**
 * Procesa el número sorteado (lógica de negocio)
 * 
 * @param {number} selectedNumber - Número seleccionado por la tómbola
 */
function processDrawnNumber(selectedNumber) {
    // Remover el número de los disponibles
    availableNumbers.splice(availableNumbers.indexOf(selectedNumber), 1);
    
    // Actualizar número actual
    currentNumber = selectedNumber;
    
    // Marcar automáticamente el número en la tabla
    markNumberInTable(selectedNumber);
    
    // Actualizar historial
    updateHistory(selectedNumber);
    
    // Actualizar displays
    updateNumbersLeft();
    
    console.log(`Número sorteado: ${getLetterForNumber(selectedNumber)}-${selectedNumber}`);
}

/**
 * Muestra el modal de tómbola con animación
 */
function showTombolaModal() {
    // Resetear estado del modal
    winningNumber.style.display = 'none';
    document.querySelector('.tombola-machine').style.display = 'block';
    
    // Mostrar modal
    tombolaModal.style.display = 'block';
    
    // Reproducir audio de tómbola
    playTombolaAudio();
    
    // Animación de aparición
    setTimeout(() => {
        tombolaModal.style.opacity = '1';
    }, 10);
}

/**
 * Muestra el número ganador en el modal
 * 
 * @param {number} number - Número sorteado
 */
function showWinningNumber(number) {
    // Detener audio de tómbola
    stopTombolaAudio();
    
    // Ocultar máquina de tómbola
    document.querySelector('.tombola-machine').style.display = 'none';
    
    // Actualizar displays del número ganador
    modalNumber.textContent = number;
    modalLetter.textContent = getLetterForNumber(number);
    
    // Mostrar número ganador con animación
    winningNumber.style.display = 'block';
    
    // Confetti en el modal
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
    });
}

/**
 * Oculta el modal de tómbola
 */
function hideTombolaModal() {
    // Asegurar que el audio se detenga
    stopTombolaAudio();
    
    // Animación de desaparición
    tombolaModal.style.opacity = '0';
    
    setTimeout(() => {
        tombolaModal.style.display = 'none';
    }, 300);
}

/**
 * Marca automáticamente un número en la tabla de bingo
 * 
 * @param {number} number - Número a marcar en la tabla
 */
function markNumberInTable(number) {
    const numberElements = document.querySelectorAll('.number');
    numberElements.forEach(element => {
        if (parseInt(element.textContent) === number) {
            element.classList.add('marked');
            element.classList.add('auto-marked'); // Clase especial para números marcados automáticamente
        }
    });
}


/**
 * Actualiza el contador de números restantes
 */
function updateNumbersLeft() {
    numbersLeftDisplay.textContent = `Números restantes: ${availableNumbers.length}`;
}

/**
 * Actualiza el historial de números marcados
 * 
 * Mantiene un registro de los últimos 5 números marcados,
 * agregando el nuevo número al inicio y removiendo el más antiguo
 * si se excede el límite.
 * 
 * @param {number} number - Número que se acaba de marcar
 */
function updateHistory(number) {
    // Agregar número al inicio del array
    lastNumbers.unshift(number);
    
    // Mantener máximo 5 números en el historial
    if (lastNumbers.length > 5) {
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
            `<div class="${idx === 0 ? "last-number" : ""}">${getLetterForNumber(num)}-${num}</div>`
        )
        .join("");
}

/**
 * Limpia solo los números marcados manualmente (no los de la tómbola)
 * 
 * Resetea los elementos visuales pero mantiene los números sorteados:
 * - Remueve solo números marcados manualmente
 * - Mantiene números marcados por la tómbola
 * - Limpia patrones de la tarjeta de bingo
 */
function cleanTable() {
    // Limpiar solo números marcados manualmente (no los auto-marcados por tómbola)
    document.querySelectorAll(".marked:not(.auto-marked)").forEach((cell) => 
        cell.classList.remove("marked")
    );
    
    // Limpiar patrones de la tarjeta de bingo
    document.querySelectorAll(".pattern").forEach((cell) => 
        cell.classList.remove("pattern")
    );
}

/**
 * Reinicia completamente el juego
 * 
 * Resetea todos los elementos a su estado inicial:
 * - Limpia todos los números marcados
 * - Resetea la tómbola
 * - Limpia historial y números sorteados
 * - Restaura números disponibles
 */
function resetGame() {
    // Confirmar acción
    if (!confirm('¿Estás seguro de que quieres reiniciar el juego completo? Se perderán todos los números sorteados.')) {
        return;
    }
    
    // Detener sorteo automático si está activo
    stopAutoDraw();
    
    // Detener cualquier audio que esté reproduciéndose
    stopTombolaAudio();
    stopAudio();
    
    // Limpiar todos los números marcados
    document.querySelectorAll(".marked").forEach((cell) => {
        cell.classList.remove("marked", "auto-marked");
    });
    
    // Resetear arrays
    lastNumbers = [];
    availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
    currentNumber = null;
    
    // Limpiar displays
    history.innerHTML = "";
    
    // Limpiar patrones de la tarjeta de bingo
    document.querySelectorAll(".pattern").forEach((cell) => 
        cell.classList.remove("pattern")
    );
    
    // Restaurar botón de tómbola
    tombolaBtn.disabled = false;
    tombolaBtn.innerHTML = '🎲 Sacar Número de la Tómbola';
    
    // Actualizar contadores
    updateNumbersLeft();
    
    console.log('Juego reiniciado completamente');
}

/**
 * Inicia el sorteo automático cada 5 segundos
 */
function startAutoDraw() {
    if (isAutoDrawActive) {
        return; // Ya está activo
    }

    // Verificar si quedan números disponibles
    if (availableNumbers.length === 0) {
        alert('¡No hay números disponibles para sortear!');
        return;
    }

    isAutoDrawActive = true;
    isAutoDrawPaused = false;

    // Actualizar interfaz
    updateAutoDrawButtons();
    tombolaBtn.disabled = true;
    tombolaBtn.innerHTML = '🎲 Sorteo Automático Activo';

    // Iniciar el intervalo de 5 segundos
    autoDrawInterval = setInterval(() => {
        if (!isAutoDrawPaused && availableNumbers.length > 0) {
            drawNumber();
        }
    }, 10000);

    console.log('Sorteo automático iniciado');
}

/**
 * Detiene el sorteo automático
 */
function stopAutoDraw() {
    if (!isAutoDrawActive) {
        return; // Ya está inactivo
    }

    isAutoDrawActive = false;
    isAutoDrawPaused = false;

    // Limpiar el intervalo
    if (autoDrawInterval) {
        clearInterval(autoDrawInterval);
        autoDrawInterval = null;
    }

    // Restaurar interfaz
    updateAutoDrawButtons();
    tombolaBtn.disabled = false;
    tombolaBtn.innerHTML = '🎲 Sacar Número de la Tómbola';

    console.log('Sorteo automático detenido');
}

/**
 * Pausa el sorteo automático
 */
function pauseAutoDraw() {
    if (!isAutoDrawActive || isAutoDrawPaused) {
        return;
    }

    isAutoDrawPaused = true;
    updateAutoDrawButtons();

    console.log('Sorteo automático pausado');
}

/**
 * Reanuda el sorteo automático
 */
function resumeAutoDraw() {
    if (!isAutoDrawActive || !isAutoDrawPaused) {
        return;
    }

    isAutoDrawPaused = false;
    updateAutoDrawButtons();

    console.log('Sorteo automático reanudado');
}

/**
 * Actualiza la visibilidad y estado de los botones de control automático
 */
function updateAutoDrawButtons() {
    if (isAutoDrawActive) {
        // Modo automático activo
        autoDrawBtn.style.display = 'none';
        
        if (isAutoDrawPaused) {
            // Pausado
            pauseBtn.style.display = 'none';
            resumeBtn.style.display = 'inline-block';
        } else {
            // Activo
            pauseBtn.style.display = 'inline-block';
            resumeBtn.style.display = 'none';
        }
    } else {
        // Modo manual
        autoDrawBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
        resumeBtn.style.display = 'none';
    }
}

/** @type {HTMLAudioElement|null} Referencia al audio de celebración actualmente reproduciéndose */
let celebrationAudio = null;

/** @type {HTMLAudioElement|null} Referencia al audio de tómbola actualmente reproduciéndose */
let tombolaAudio = null;

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
        celebrationAudio.volume = 1;
        celebrationAudio.preload = 'auto';
        
        // Reproducir audio
        const playPromise = celebrationAudio.play();
        
        // Manejar la promesa de reproducción
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
 * Reproduce el audio de tómbola durante la animación del sorteo
 * 
 * @returns {HTMLAudioElement|null} Referencia al elemento de audio creado
 */
function playTombolaAudio() {
    try {
        // Detener audio anterior si existe
        if (tombolaAudio) {
            tombolaAudio.pause();
            tombolaAudio.currentTime = 0;
        }
        
        // Crear nuevo elemento de audio
        tombolaAudio = new Audio('assets/tombola.mp3');
        
        // Configurar propiedades del audio
        tombolaAudio.volume = 0.8; // Volumen al 80%
        tombolaAudio.preload = 'auto';
        tombolaAudio.loop = false; // No repetir
        
        // Reproducir audio
        const playPromise = tombolaAudio.play();
        
        // Manejar la promesa de reproducción
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('Audio de tómbola reproducido exitosamente');
                })
                .catch(error => {
                    console.warn('Error al reproducir audio de tómbola:', error);
                });
        }
        
        return tombolaAudio;
        
    } catch (error) {
        console.error('Error al crear/reproducir audio de tómbola:', error);
        return null;
    }
}

/**
 * Detiene el audio de tómbola si está reproduciéndose
 */
function stopTombolaAudio() {
    if (tombolaAudio) {
        tombolaAudio.pause();
        tombolaAudio.currentTime = 0;
        tombolaAudio = null;
        console.log('Audio de tómbola detenido');
    }
}

/**
 * Ejecuta la animación de celebración de BINGO
 * 
 * Función principal de celebración que incluye:
 * - Activación del modo oscuro
 * - Múltiples explosiones de confetti animadas
 * - Reproducción de audio de victoria
 * - NO limpia automáticamente (permite revisar el resultado)
 */
function bingoCelebration() {
    // Activar modo oscuro para efecto dramático
    document.getElementById("overley").classList.add("dark-mode");
    
    // Reproducir audio de celebración
    playAudio('assets/fireworks-b.mp3');
    
    // Configuración de la animación de confetti
    let count = 25; // Número total de explosiones
    
    // Intervalo para explosiones consecutivas de confetti
    let interval = setInterval(() => {
        // Generar posición aleatoria para la explosión
        let x = Math.random();
        let y = Math.random() * 0.6;

        // Ejecutar explosión de confetti
        confetti({
            particleCount: 120,
            startVelocity: 60,
            spread: 360,
            ticks: 80,
            origin: { x, y }
        });

        count--;
        
        // Terminar celebración después de todas las explosiones
        if (count === 0) {
            clearInterval(interval);
            
            // Solo quitar el overlay después de 3 segundos, pero NO limpiar
            setTimeout(() => {
                stopAudio();
                document.getElementById("overley").classList.remove("dark-mode");
            }, 3000);
        }
    }, 600);
}

/**
 * Inicialización de la tabla de números del bingo
 * 
 * Genera dinámicamente la interfaz de la tabla de bingo con:
 * - Headers de columnas (B, I, N, G, O)
 * - Números organizados por columna
 * - Funcionalidad de click para marcar/desmarcar (solo números no auto-marcados)
 * - Actualización automática del historial
 */
function initializeBingoTable() {
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
                // No permitir desmarcar números que fueron marcados automáticamente por la tómbola
                if (numberCell.classList.contains("auto-marked")) {
                    return;
                }
                
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
}

// Event listeners principales
cleanBtn.addEventListener("click", () => cleanTable());
resetGameBtn.addEventListener("click", () => resetGame());
bingo.addEventListener("click", () => bingoCelebration());
tombolaBtn.addEventListener("click", () => {
    // Solo permitir sorteo manual si no está activo el sorteo automático
    if (!isAutoDrawActive) {
        drawNumber();
    }
});

// Event listeners para controles automáticos
autoDrawBtn.addEventListener("click", () => startAutoDraw());
pauseBtn.addEventListener("click", () => pauseAutoDraw());
resumeBtn.addEventListener("click", () => resumeAutoDraw());

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    initializeBingoCard();
    initializeBingoTable();
    updateNumbersLeft();
    updateAutoDrawButtons(); // Configurar botones de sorteo automático
    
    console.log('Bingo V2 inicializado correctamente');
});
