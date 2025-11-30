/**
 * Generador de Tarjetas de Bingo Optimizado
 * 
 * Sistema optimizado para generar grandes cantidades de tarjetas de bingo (200+)
 * y exportarlas a PDF sin problemas de memoria. Utiliza procesamiento por lotes
 * y renderizado temporal para manejar eficientemente el uso de memoria.
 * 
 * @author Tu Nombre
 * @version 2.0
 * @since 2024
 */

// Inicialización de librerías y variables globales
const { jsPDF } = window.jspdf;

/** @type {string} Nombre del archivo PDF que se generará */
let fileName = "";

/** @type {Array<Object>} Array que almacena todos los datos de las tarjetas generadas */
let allCardsData = [];

/**
 * Genera los datos estructurados de una tarjeta de bingo individual
 * 
 * Crea una tarjeta de bingo estándar con 5 columnas (B-I-N-G-O) donde:
 * - B: números del 1-15
 * - I: números del 16-30  
 * - N: números del 31-45 (posición central es espacio libre)
 * - G: números del 46-60
 * - O: números del 61-75
 * 
 * @param {string} bingoName - Nombre del juego de bingo
 * @param {number} serial - Número de serie único de la tarjeta
 * @returns {Object} Objeto con la estructura completa de la tarjeta
 * @returns {Object} returns.columns - Objeto con las 5 columnas de la tarjeta
 * @returns {string} returns.bingoName - Nombre del juego
 * @returns {number} returns.serial - Número de serie
 * @returns {string} returns.timestamp - Fecha y hora de creación
 */
function generateBingoCard(bingoName, serial) {
    const columns = {
        B: ["B"].concat(getRandomNumbers(1, 15, 5)),
        I: ["I"].concat(getRandomNumbers(16, 30, 5)),
        N: ["N"].concat(getRandomNumbers(31, 45, 5)),
        G: ["G"].concat(getRandomNumbers(46, 60, 5)),
        O: ["O"].concat(getRandomNumbers(61, 75, 5)),
    };
    
    // La posición central de la columna N siempre es espacio libre
    columns.N[3] = " ";
    
    return { 
        columns, 
        bingoName, 
        serial, 
        timestamp: new Date().toLocaleString() 
    };
}

/**
 * Genera un array de números aleatorios únicos dentro de un rango específico
 * 
 * Utiliza un algoritmo de generación aleatoria que garantiza que no se repitan
 * números dentro del conjunto generado.
 * 
 * @param {number} min - Valor mínimo del rango (inclusivo)
 * @param {number} max - Valor máximo del rango (inclusivo)
 * @param {number} count - Cantidad de números únicos a generar
 * @returns {Array<number>} Array de números únicos ordenados aleatoriamente
 */
function getRandomNumbers(min, max, count) {
    const numbers = [];
    
    // Continúa generando hasta obtener la cantidad requerida
    while (numbers.length < count) {
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        
        // Solo agrega el número si no existe en el array
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }
    
    return numbers;
}

/**
 * Convierte los datos de una tarjeta en un elemento DOM renderizable
 * 
 * Toma la estructura de datos de una tarjeta y crea todos los elementos
 * HTML necesarios con las clases CSS apropiadas para su visualización.
 * 
 * @param {Object} cardData - Datos de la tarjeta generados por generateBingoCard()
 * @param {Object} cardData.columns - Columnas de la tarjeta (B, I, N, G, O)
 * @param {string} cardData.bingoName - Nombre del bingo
 * @param {number} cardData.serial - Número de serie
 * @param {string} cardData.timestamp - Timestamp de creación
 * @returns {HTMLDivElement} Elemento DOM completo de la tarjeta
 */
function createCardElement(cardData) {
    const { columns, bingoName, serial, timestamp } = cardData;
    
    // Crear contenedor principal de la tarjeta
    const card = document.createElement("div");
    card.classList.add("bingo-card");

    // Generar 6 filas (1 header + 5 de números) y 5 columnas
    for (let row = 0; row < 6; row++) {
        ["B", "I", "N", "G", "O"].forEach((col) => {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.textContent = columns[col][row];
            
            // Aplicar estilos específicos según el tipo de celda
            if (row === 0) cell.classList.add("header");
            if (columns[col][row] === " ") cell.classList.add("free-row");
            
            card.appendChild(cell);
        });
    }

    // Agregar información de la tarjeta en la parte inferior
    const info = document.createElement("div");
    info.classList.add("card-info");
    info.textContent = `${bingoName} | Serial: ${serial} | Creado: ${timestamp}`;
    card.appendChild(info);

    return card;
}

/**
 * Función principal que maneja la generación masiva de tarjetas
 * 
 * Controla todo el proceso de generación, desde la solicitud de datos al usuario
 * hasta la visualización optimizada de las tarjetas. Implementa optimización
 * de rendimiento limitando la cantidad de elementos DOM mostrados.
 * 
 * Optimizaciones implementadas:
 * - Separación entre datos y visualización
 * - Límite de 50 tarjetas mostradas en DOM
 * - Almacenamiento de todos los datos para exportación
 * - Mensaje informativo para grandes cantidades
 */
function generateCards() {
    const container = document.getElementById("cardContainer");
    const limitMessage = document.getElementById("cardLimitMessage");

    // Limpiar estado anterior
    container.innerHTML = "";
    allCardsData = [];

    // Obtener input del usuario
    const numCards = parseInt(prompt("¿Cuántas tarjetas quieres generar?"));
    const bingoNamePrompt = prompt("¿Nombre del Bingo?");
    fileName = bingoNamePrompt || "Bingo";

    // Validar entrada
    if (!numCards || !bingoNamePrompt || numCards <= 0) return;

    // Generar todos los datos de las tarjetas (almacenamiento en memoria)
    for (let c = 0; c < numCards; c++) {
        const cardData = generateBingoCard(bingoNamePrompt, c + 1);
        allCardsData.push(cardData);
    }

    // Optimización: mostrar solo las primeras 50 tarjetas en el DOM
    const displayLimit = Math.min(50, numCards);

    for (let i = 0; i < displayLimit; i++) {
        const card = createCardElement(allCardsData[i]);
        container.appendChild(card);
    }

    // Mostrar mensaje informativo para grandes cantidades
    if (numCards > displayLimit) {
        limitMessage.style.display = "block";
        limitMessage.innerHTML = `
            <strong>Nota:</strong> Se generaron ${numCards} tarjetas, pero solo se muestran las primeras ${displayLimit} 
            para mejorar el rendimiento. Todas las ${numCards} tarjetas se incluirán en el PDF al exportar.
        `;
    } else {
        limitMessage.style.display = "none";
    }
}

/**
 * Inicializa y muestra la interfaz de loading con overlay
 * 
 * Prepara todos los elementos visuales del sistema de carga, resetea
 * estados anteriores y deshabilita controles para evitar múltiples
 * ejecuciones simultáneas.
 */
function showLoading() {
    // Obtener referencias a elementos del DOM
    const overlay = document.getElementById("loadingOverlay");
    const spinner = document.getElementById("spinner");
    const successIcon = document.getElementById("successIcon");
    const loadingText = document.getElementById("loadingText");
    const loadingSubtext = document.getElementById("loadingSubtext");
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");
    const successMessage = document.getElementById("successMessage");
    const errorMessage = document.getElementById("errorMessage");
    const exportBtn = document.getElementById("exportBtn");

    // Reset de todos los elementos a estado inicial
    spinner.style.display = "block";
    successIcon.style.display = "none";
    loadingText.textContent = "Generando PDF...";
    loadingSubtext.textContent = "Por favor espera mientras procesamos tus tarjetas";
    progressFill.style.width = "0%";
    progressText.textContent = "0%";
    successMessage.style.display = "none";
    errorMessage.style.display = "none";

    // Deshabilitar botón para evitar múltiples ejecuciones
    exportBtn.disabled = true;
    exportBtn.textContent = "Generando...";

    // Mostrar overlay
    overlay.style.display = "flex";
}

/**
 * Actualiza la barra de progreso y mensajes informativos
 * 
 * @param {number} percentage - Porcentaje de progreso (0-100)
 * @param {string} [text] - Texto descriptivo opcional del proceso actual
 */
function updateProgress(percentage, text) {
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");
    const loadingSubtext = document.getElementById("loadingSubtext");

    // Actualizar barra visual y texto de porcentaje
    progressFill.style.width = percentage + "%";
    progressText.textContent = Math.round(percentage) + "%";
    
    // Actualizar mensaje descriptivo si se proporciona
    if (text) {
        loadingSubtext.textContent = text;
    }
}

/**
 * Muestra el estado de éxito y programa el cierre automático del loading
 * 
 * Cambia la interfaz para mostrar iconografía de éxito y mensaje
 * de confirmación, luego programa el cierre automático después de 2 segundos.
 */
function showSuccess() {
    const spinner = document.getElementById("spinner");
    const successIcon = document.getElementById("successIcon");
    const loadingText = document.getElementById("loadingText");
    const loadingSubtext = document.getElementById("loadingSubtext");
    const successMessage = document.getElementById("successMessage");

    // Cambiar de spinner a icono de éxito
    spinner.style.display = "none";
    successIcon.style.display = "block";
    
    // Actualizar mensajes
    loadingText.textContent = "¡Completado!";
    loadingSubtext.textContent = "Tu archivo PDF está listo";
    successMessage.style.display = "block";
    updateProgress(100, "Descarga iniciada");

    // Programar cierre automático
    setTimeout(() => {
        hideLoading();
    }, 2000);
}

/**
 * Muestra el estado de error con mensaje específico
 * 
 * @param {string} [message] - Mensaje de error personalizado
 */
function showError(message) {
    const spinner = document.getElementById("spinner");
    const loadingText = document.getElementById("loadingText");
    const loadingSubtext = document.getElementById("loadingSubtext");
    const errorMessage = document.getElementById("errorMessage");

    // Ocultar spinner y mostrar estado de error
    spinner.style.display = "none";
    loadingText.textContent = "Error";
    loadingSubtext.textContent = message || "Ocurrió un error al generar el PDF";
    errorMessage.style.display = "block";

    // Programar cierre automático después de 3 segundos
    setTimeout(() => {
        hideLoading();
    }, 3000);
}

/**
 * Oculta el overlay de loading y restaura el estado normal de la interfaz
 * 
 * Rehabilita los controles y restaura el texto original del botón de exportación.
 */
function hideLoading() {
    const overlay = document.getElementById("loadingOverlay");
    const exportBtn = document.getElementById("exportBtn");

    // Ocultar overlay
    overlay.style.display = "none";

    // Rehabilitar botón y restaurar texto original
    exportBtn.disabled = false;
    exportBtn.textContent = "Export to PDF";
}

/**
 * Intenta ejecutar la recolección de basura del navegador si está disponible
 * 
 * Esta función es principalmente para debugging y puede no estar disponible
 * en todos los navegadores o configuraciones. Se usa para intentar liberar
 * memoria entre lotes de procesamiento.
 */
function cleanupMemory() {
    if (window.gc) {
        window.gc();
    }
}

/**
 * Función principal de exportación a PDF con procesamiento optimizado por lotes
 * 
 * Implementa una estrategia de procesamiento por lotes para manejar grandes
 * cantidades de tarjetas sin agotar la memoria del navegador. Utiliza:
 * - Contenedor temporal para renderizado
 * - Procesamiento asíncrono por lotes
 * - Limpieza de memoria entre lotes
 * - Manejo robusto de errores
 * 
 * Optimizaciones de memoria:
 * - Procesamiento de 10 tarjetas por lote
 * - Renderizado temporal fuera del viewport
 * - Limpieza inmediata de elementos DOM y canvas
 * - Pausas entre lotes para permitir GC
 * 
 * @async
 * @returns {Promise<void>}
 */
async function exportToPDF() {
    // Validar que existan tarjetas para exportar
    if (allCardsData.length === 0) {
        alert("Primero genera algunas tarjetas antes de exportar a PDF");
        return;
    }

    try {
        // Inicializar interfaz de loading
        showLoading();
        updateProgress(5, "Inicializando documento PDF...");

        // Configurar documento PDF
        const doc = new jsPDF("p", "mm", "a4");
        let x = 10, y = 10; // Posición inicial en el PDF
        let pageCount = 1;   // Contador de páginas

        updateProgress(10, "Preparando configuración...");

        // Crear contenedor temporal para renderizado (invisible al usuario)
        const tempContainer = document.createElement("div");
        tempContainer.style.position = "absolute";
        tempContainer.style.left = "-9999px";  // Fuera del viewport
        tempContainer.style.top = "-9999px";
        document.body.appendChild(tempContainer);

        // Configuración de procesamiento por lotes
        const batchSize = 10;                    // Tarjetas por lote
        const totalCards = allCardsData.length;  // Total a procesar

        // Procesamiento por lotes para optimizar memoria
        for (let batchStart = 0; batchStart < totalCards; batchStart += batchSize) {
            const batchEnd = Math.min(batchStart + batchSize, totalCards);
            const batchProgress = 10 + 70 * (batchStart / totalCards);

            // Actualizar progreso con información del lote actual
            updateProgress(
                batchProgress, 
                `Procesando lote ${Math.floor(batchStart / batchSize) + 1} de ${Math.ceil(totalCards / batchSize)} (tarjetas ${batchStart + 1}-${batchEnd})...`
            );

            // Procesar cada tarjeta del lote actual
            for (let i = batchStart; i < batchEnd; i++) {
                // Crear elemento temporal de la tarjeta
                const card = createCardElement(allCardsData[i]);
                tempContainer.appendChild(card);

                try {
                    // Convertir elemento DOM a canvas con configuración optimizada
                    const canvas = await html2canvas(card, {
                        useCORS: true,                    // Permitir recursos externos
                        scale: 1.5,                       // Escala reducida para ahorrar memoria
                        logging: false,                   // Desactivar logs
                        allowTaint: false,                // Seguridad
                        backgroundColor: "#ffffff",       // Fondo blanco
                    });

                    // Convertir canvas a imagen con compresión
                    const imgData = canvas.toDataURL("image/png", 0.8); // Calidad 80%
                    
                    // Obtener dimensiones de página
                    const pageHeight = doc.internal.pageSize.height;
                    const pageWidth = doc.internal.pageSize.width;

                    // Verificar si necesita nueva página
                    if (y + 130 > pageHeight) {
                        doc.addPage();
                        pageCount++;
                        y = 10;
                        x = 10;
                    }

                    // Agregar imagen al PDF
                    doc.addImage(imgData, "PNG", x, y, 90, 130);
                    x += 100; // Mover posición horizontal

                    // Verificar si necesita nueva fila
                    if (x + 90 > pageWidth) {
                        x = 10;
                        y += 140; // Mover a siguiente fila
                    }

                    // Limpiar canvas para liberar memoria inmediatamente
                    canvas.width = 1;
                    canvas.height = 1;
                    
                } catch (cardError) {
                    // Log de error pero continuar procesamiento
                    console.warn(`Error procesando tarjeta ${i + 1}:`, cardError);
                }

                // Remover tarjeta temporal del DOM
                tempContainer.removeChild(card);
            }

            // Pausa entre lotes para permitir que el navegador respire
            // y el garbage collector pueda actuar
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Intentar limpiar memoria explícitamente
            cleanupMemory();
        }

        // Limpiar contenedor temporal del DOM
        document.body.removeChild(tempContainer);

        // Finalización del documento
        updateProgress(90, "Finalizando documento...");
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Guardar archivo PDF con nombre descriptivo
        const pdfFileName = `${fileName}_bingo_cards_${totalCards}tarjetas.pdf`;
        doc.save(pdfFileName);

        // Mostrar éxito
        updateProgress(100, `PDF con ${totalCards} tarjetas generado correctamente`);
        showSuccess();

    } catch (error) {
        // Manejo robusto de errores
        console.error("Error al generar PDF:", error);

        // Determinar tipo de error y mensaje apropiado
        let errorMessage = "Error al procesar las tarjetas.";
        if (error.message.includes("string length") || error.message.includes("memory")) {
            errorMessage = "Demasiadas tarjetas para procesar. Intenta con menos cantidad (máximo 150).";
        }

        showError(errorMessage);
    }
}