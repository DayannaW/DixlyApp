import { loadJSON, addLevelCompletion, hasBadge } from './util.js';
import Pet from './pet.js';

// --- SONIDOS DEL JUEGO ---
const sDrag = new Audio("../../assets/sonidos/drag.mp3");
const sDrop = new Audio("../../assets/sonidos/drop.mp3");
const sCorrect = new Audio("../../assets/sonidos/correct.mp3");
const sWrong = new Audio("../../assets/sonidos/wrong.mp3");
const soundBtn = document.getElementById('toggle-sound');
const btn = document.createElement('button');

// Para evitar retraso al reproducir
[sDrag, sDrop, sCorrect, sWrong].forEach(s => { s.preload = "auto"; });


const Game1 = (() => {
    // Crear botón salir en la esquina superior derecha
    function createExitButton() {
        if (document.getElementById('btn-salir-j1')) return;
        btn.id = 'btn-salir-j1';
        btn.textContent = 'X';
        btn.style.visibility = 'hidden';
        btn.onclick = () => {
            window.location.href = '../juego1/index.html';
        };
        document.body.appendChild(btn);
    }
    // Contadores de aciertos y de intentos
    let aciertos = 0;
    let intentos = 0;
    let currentLevel = 'nivel-facil';
    let stories = [];
    let currentStoryIndex = 0;
    let feedbackTimeout = null;
    // Tracking de intentos por historia para insignias especiales
    let storyAttempts = [];
    // Tracking de tiempo de espera para insignia "Lector paciente"
    let storyStartTimes = [];

    // --- Sonido de fondo ---
    // const bgAudio = new Audio("../../assets/sonidos/juego1-fondo.mp3");
    // bgAudio.loop = true;
    // bgAudio.volume = 0.35;

    // Pantalla de instrucciones
    function showInstrucciones() {
        // Hacer Pixel más grande mientras se muestran las instrucciones
        const pixelContainer = document.getElementById('pixel-container');
        if (pixelContainer) pixelContainer.classList.add('pixel-grande');
        // Ocultar el card overlay layout mientras se muestran instrucciones
        const cardOverlay = document.querySelector('.card-overlay-layout');
        if (cardOverlay) cardOverlay.style.display = 'none';
        // Crear overlay modal igual que en nivel 2
        const overlay = document.createElement('div');
        overlay.className = 'instructions-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.35)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';

        const card = document.createElement('div');
        card.className = 'instructions-card';
        card.style.background = '#fff';
        card.style.padding = '2.5rem 2.5rem 2rem 2.5rem';
        card.style.borderRadius = '24px 24px 20px 20px';
        card.style.boxShadow = '0 4px 32px #0002';

        // Botón X para cerrar
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.setAttribute('aria-label', 'Cerrar');
        closeBtn.className = 'close-btn';

        closeBtn.addEventListener('click', () => {
            window.location.href = '../juego1/index.html';
        });
        // Contenedor relativo para el botón X
        const cardWrapper = document.createElement('div');
        cardWrapper.style.position = 'relative';
        cardWrapper.appendChild(closeBtn);
        cardWrapper.appendChild(card);

        card.innerHTML = `
            <h2 style="margin-bottom: 1rem;">El Inicio del Relato</h2>
            <p >Algunas historias han llegado hasta nosotros incompletas.<br><br>
            Fragmentos aislados...<br>
            frases sueltas...<br>
            piezas que no terminan de encajar.<br><br><br>
            Tu tarea es leer con atención y descubrir qué fragmento falta <br>
            para que el texto vuelva a tener sentido.<br><br><br>
            No se trata de leer rápido,<br>
            sino de leer con intención.<br>
            Cada palabra cuenta.</p>
            <button id="start-btn" class="instruction-btn">Entiendo</button>
        `;
        overlay.appendChild(cardWrapper);
        document.body.appendChild(overlay);
        // Mostrar el botón después de 2.5 segundos
        setTimeout(() => {
            document.querySelector('.instruction-btn')?.classList.add('visible');
        }, 5000);
        try {
            Pet.init();
            Pet.setIdle();
            if (Pet.hideDialog) Pet.hideDialog();
            const pc = document.getElementById('pixel-container'); if (pc) pc.style.zIndex = '10000';
            const dialog = document.getElementById('pixel-dialog'); if (dialog) dialog.style.display = 'none';
        } catch (e) { }
        const startBtn = document.getElementById('start-btn');
        if (startBtn) startBtn.onclick = () => {
            overlay.remove();
            //soundBtn.style.visibility = 'visible'; // Mostrar botón sonido
            btn.style.visibility = 'visible'; // Mostrar botón salir
            // Mostrar el card overlay layout al cerrar instrucciones
            const cardOverlay = document.querySelector('.card-overlay-layout');
            if (cardOverlay) cardOverlay.style.display = '';
            const pc = document.getElementById('pixel-container');
            if (pc) {
                pc.style.zIndex = '';
                pc.classList.remove('pixel-grande'); // Quitar clase al cerrar instrucciones
            }
            const dialog = document.getElementById('pixel-dialog'); if (dialog) dialog.style.display = '';
            renderStory();
        };
        // CSS para pixel-grande
        const styleId = 'pixel-grande-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }
    }

    // ----------------------------
    // MODEL
    // ----------------------------
    async function loadStories(level) {
        currentLevel = level;
        stories = await loadJSON(`../../js/data/juego1nivel1/${level}.json`);
        currentStoryIndex = 0;
    }

    function getCurrentStory() {
        return stories[currentStoryIndex];
    }

    function nextStory() {
        currentStoryIndex++;
        return currentStoryIndex < stories.length;
    }

    // ----------------------------
    // VIEW
    // ----------------------------

    // Función para mezclar un array (Fisher-Yates)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Nueva versión de renderStory con soporte para una opción draggable
    function renderStory() {
        const storyData = getCurrentStory();

        setTimeout(() => {
            
                try { Pet.speak('Lee con atención'); } catch (e) { }
            
        }, 5000);

        // Si es la primera historia, reiniciar contadores
        if (currentStoryIndex === 0) {
            aciertos = 0;
            intentos = 0;
            storyAttempts = [];
            storyStartTimes = [];
        }
        // Guardar el tiempo de inicio de la historia actual
        storyStartTimes[currentStoryIndex] = Date.now();
        console.log('Historia iniciada en ms:', storyStartTimes[currentStoryIndex]);

        // 1. Colocar título
        const title = document.getElementById("title");
        title.textContent = storyData.titulo;

        // 2. Mostrar imagen
        const img = document.getElementById("story-img");
        img.src = storyData.img;
        img.alt = storyData.titulo;
        // Poner la imagen como fondo expandido detrás del overlay
        document.body.style.backgroundImage = `url('${storyData.img}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';

        // 3. Insertar texto con hueco reemplazando {{espacio}}
        const textoPrincipal = document.getElementById("texto-principal");

        const textoConHueco = storyData.texto.replace(
            "{{espacio}}",
            `<span id="drop-zone" class="drop-zone"> </span>`
        );

        textoPrincipal.innerHTML = textoConHueco;

        const dropZone = document.getElementById("drop-zone");

        // 4. Crear opciones arrastrables
        const opcionesContainer = document.getElementById("opciones");
        opcionesContainer.innerHTML = ""; // limpiar

        // Mezclar las opciones antes de mostrarlas
        const opcionesMezcladas = shuffleArray([...storyData.opciones]);

        // Guardar las opciones mezcladas en el dropZone para acceso en el evento drop
        dropZone._opcionesMezcladas = opcionesMezcladas;

        opcionesMezcladas.forEach((op, index) => {
            const div = document.createElement("div");
            div.classList.add("draggable-option");
            div.textContent = op.texto;
            div.setAttribute("draggable", "true");
            div.dataset.correcto = op.correcto;
            div.dataset.index = index;

            // Drag start
            div.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", index);
                setTimeout(() => div.classList.add("hide"), 0);
                sDrag.currentTime = 0;
                sDrag.play();
                setTimeout(() => div.classList.add("dragging"), 0);
            });

            div.addEventListener("dragend", () => {
                div.classList.remove("hide");
                div.classList.remove("dragging");
                sDrop.currentTime = 0;
                sDrop.play();
            });

            // Soporte táctil para móviles: simular drop al tocar la opción
            div.addEventListener('touchstart', function (e) {
                if (div.getAttribute('draggable') === 'false') return;
                e.preventDefault();
                sDrop.currentTime = 0; sDrop.play();
                // Animar la opción hacia el drop-zone
                const dropZone = document.getElementById('drop-zone');
                const dropRect = dropZone.getBoundingClientRect();
                const wordRect = div.getBoundingClientRect();
                const deltaX = dropRect.left + dropRect.width / 2 - (wordRect.left + wordRect.width / 2);
                const deltaY = dropRect.top + dropRect.height / 2 - (wordRect.top + wordRect.height / 2);
                div.style.transition = 'transform 0.55s cubic-bezier(.4,1.2,.6,1), opacity 0.2s';
                div.style.zIndex = '10000';
                div.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.15)`;
                setTimeout(() => {
                    // Simular drop
                    // Contar intento
                    intentos++;
                    try {
                        if (currentLevel === 'nivel-facil') {
                            localStorage.setItem('juego1_nivel-facil_intentos', intentos);
                        }
                    } catch (e) { }
                    if (!storyAttempts[currentStoryIndex]) {
                        storyAttempts[currentStoryIndex] = 1;
                    } else {
                        storyAttempts[currentStoryIndex]++;
                    }
                    let waitedMs = Date.now() - (storyStartTimes[currentStoryIndex] || Date.now());
                    if (!window.__lectorPacienteFlags) window.__lectorPacienteFlags = [];
                    if (waitedMs > 10000) {
                        window.__lectorPacienteFlags[currentStoryIndex] = true;
                    } else {
                        window.__lectorPacienteFlags[currentStoryIndex] = false;
                    }
                    if (op.correcto) {
                        // Animar la opción hacia el drop-zone y luego ocultarla
                        div.style.transition = 'transform 0.55s cubic-bezier(.4,1.2,.6,1), opacity 0.2s';
                        div.style.zIndex = '10000';
                        div.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.15)`;
                        setTimeout(() => {
                            div.style.opacity = '0';
                            // Desactivar drag de todas y marcar inactivas
                            const allOptions = opcionesContainer.querySelectorAll('.draggable-option');
                            allOptions.forEach(opt => { opt.setAttribute('draggable', 'false'); opt.classList.add('opcion-inactiva'); });
                            dropZone.textContent = op.texto;
                            dropZone.classList.add('drop-correcto');
                            sCorrect.currentTime = 0;
                            sCorrect.play();
                            showFeedback(true);
                            aciertos++;
                            setTimeout(() => {
                                if (nextStory()) {
                                    renderStory();
                                } else {
                                    // Insignias especiales
                                    let badgeParams = '';
                                    let badgeConditions = {};
                                    if (aciertos === intentos && aciertos === stories.length) {
                                        badgeConditions['lector-atento'] = true;
                                    }
                                    if (storyAttempts.some(attempts => attempts === 2)) {
                                        badgeConditions['cazador-pistas'] = true;
                                    }
                                    if (window.__lectorPacienteFlags && window.__lectorPacienteFlags.some(v => v)) {
                                        badgeConditions['lector-paciente'] = true;
                                    }
                                    try {
                                        const res = addLevelCompletion('juego1', currentLevel, badgeConditions);
                                        if (res && res.badges && res.badges.length) {
                                            badgeParams = res.badges.map(b => `badge=${encodeURIComponent(b)}`).join('&');
                                            badgeParams = badgeParams ? ('&' + badgeParams) : '';
                                        }
                                    } catch (e) { }
                                    window.location.href = `../resultados.html?game=juego1&level=${encodeURIComponent(currentLevel)}&aciertos=${aciertos}&intentos=${intentos}` + badgeParams;
                                                                                                        // Sumar el score de la sesión al score acumulado del juego y al total global
                                                                                                        try {
                                                                                                            const storageKey = 'score';
                                                                                                            let data = localStorage.getItem(storageKey);
                                                                                                            let json = {};
                                                                                                            if (data) {
                                                                                                                json = JSON.parse(data);
                                                                                                            }
                                                                                                            if (!json.perGame) json.perGame = {};
                                                                                                            if (!json.perGame.juego1) json.perGame.juego1 = {};
                                                                                                            const prevScore = parseInt(json.perGame.juego1.score || 0, 10);
                                                                                                            json.perGame.juego1.score = prevScore + aciertos;
                                                                                                            const prevTotal = parseInt(json.total || 0, 10);
                                                                                                            json.total = prevTotal + aciertos;
                                                                                                            localStorage.setItem(storageKey, JSON.stringify(json));
                                                                                                        } catch (e) {}
                                                                    try {
                                                                        if (typeof setSessionScore === 'function') {
                                                                            setSessionScore('juego1', aciertos);
                                                                        } else if (window.setSessionScore) {
                                                                            window.setSessionScore('juego1', aciertos);
                                                                        } else {
                                                                            import('./util.js').then(mod => mod.setSessionScore('juego1', aciertos));
                                                                        }
                                                                    } catch (e) {}
                                                        try {
                                                            if (typeof setSessionScore === 'function') {
                                                                setSessionScore('juego1', aciertos);
                                                            } else if (window.setSessionScore) {
                                                                window.setSessionScore('juego1', aciertos);
                                                            } else {
                                                                import('./util.js').then(mod => mod.setSessionScore('juego1', aciertos));
                                                            }
                                                        } catch (e) {}
                                }
                            }, 1600);
                        }, 550);
                    } else {
                        // Animar de regreso a origen antes de ocultar
                        dropZone.classList.add('drop-incorrecto');
                        setTimeout(() => {
                            dropZone.classList.remove('drop-incorrecto');
                        }, 1600);
                        sWrong.currentTime = 0;
                        sWrong.play();
                        showFeedback(false);
                        // Animar de regreso
                        div.style.transition = 'transform 0.4s cubic-bezier(.4,1.2,.6,1)';
                        div.style.transform = 'none';
                        setTimeout(() => {
                            div.style.opacity = '1';
                            div.setAttribute('draggable', 'false');
                            div.classList.add('opcion-inactiva');
                        }, 400);
                    }
                }, 550);
            }, { passive: false });

            opcionesContainer.appendChild(div);
        });




        // 5. Drop zone: permitir soltar
        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZone.classList.add("hover");
        });

        dropZone.addEventListener("dragleave", () => {
            dropZone.classList.remove("hover");
        });

        dropZone.addEventListener("dragenter", () => {
            dropZone.classList.add("hover");
        });

        dropZone.addEventListener("dragleave", () => {
            dropZone.classList.remove("hover");
        });


        dropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropZone.classList.remove("hover");

            const index = e.dataTransfer.getData("text/plain");
            // Usar el array mezclado guardado en el dropZone
            const opcionesMezcladas = dropZone._opcionesMezcladas || storyData.opciones;
            const opcion = opcionesMezcladas[index];

            // Sonido de soltar
            sDrop.currentTime = 0;
            sDrop.play();

            // Contar intento
            intentos++;
            // Guardar intentos en localStorage para resultados.html
            try {
                if (currentLevel === 'nivel-facil') {
                    localStorage.setItem('juego1_nivel-facil_intentos', intentos);
                }
            } catch (e) { }

            // Tracking de intentos por historia
            if (!storyAttempts[currentStoryIndex]) {
                storyAttempts[currentStoryIndex] = 1;
            } else {
                storyAttempts[currentStoryIndex]++;
            }
            // Tracking de tiempo de espera para insignia "Lector paciente"
            let waitedMs = Date.now() - (storyStartTimes[currentStoryIndex] || Date.now());
            console.log('Tiempo esperado en ms:', waitedMs);
            if (!window.__lectorPacienteFlags) window.__lectorPacienteFlags = [];
            console.log('waitedMs:', waitedMs);
            if (waitedMs > 10000) {
                console.log('Lector paciente activado para historia', currentStoryIndex);
                window.__lectorPacienteFlags[currentStoryIndex] = true;
            } else {
                window.__lectorPacienteFlags[currentStoryIndex] = false;
            }

            if (opcion.correcto) {
                // Correcto
                dropZone.textContent = opcion.texto;
                dropZone.classList.add("drop-correcto");

                // reproducir sonido
                sCorrect.currentTime = 0;
                sCorrect.play();

                // bloquear otras opciones
                document.querySelectorAll(".opcion").forEach(btn => {
                    btn.classList.add("opcion-inactiva");
                    btn.setAttribute("draggable", "false");
                });

                showFeedback(true);

                // Contar acierto
                aciertos++;

                setTimeout(() => {
                    if (nextStory()) {
                        renderStory();
                    } else {
                        // Insignias especiales
                        let badgeParams = '';
                        let badgeConditions = {};
                        // Lector atento: todos los aciertos al primer intento
                        if (aciertos === intentos && aciertos === stories.length) {
                            badgeConditions['lector-atento'] = true;
                        }
                        // Cazador de pistas: al menos una historia con exactamente 2 intentos (1 error y luego acierto)
                        if (storyAttempts.some(attempts => attempts === 2)) {
                            badgeConditions['cazador-pistas'] = true;
                        }
                        // Lector paciente: al menos una historia con espera > 10s antes de responder
                        if (window.__lectorPacienteFlags && window.__lectorPacienteFlags.some(v => v)) {
                            console.log('Otorgando insignia lector paciente');
                            badgeConditions['lector-paciente'] = true;
                        }
                        try {
                            console.log('badgeConditions:', badgeConditions);
                            const res = addLevelCompletion('juego1', currentLevel, badgeConditions);

                            if (res && res.badges && res.badges.length) {
                                badgeParams = res.badges.map(b => `badge=${encodeURIComponent(b)}`).join('&');
                                badgeParams = badgeParams ? ('&' + badgeParams) : '';
                            }
                        } catch (e) {
                            // fallo al escribir progreso, ignorar
                        }
                        window.location.href = `../resultados.html?game=juego1&level=${encodeURIComponent(currentLevel)}&aciertos=${aciertos}&intentos=${intentos}` + badgeParams;
                    }
                }, 1600);

            } else {
                // Incorrecto
                dropZone.classList.add("drop-incorrecto");
                setTimeout(() => {
                    dropZone.classList.remove("drop-incorrecto");
                }, 1600);

                // reproducir sonido incorrecto
                sWrong.currentTime = 0;
                sWrong.play();

                showFeedback(false);
                // No acierto, pero sí cuenta como intento (ya sumado arriba)
            }
        });


    }


    function showFeedback(isCorrect) {
        const feedback = document.getElementById('feedback');
        // limpiar timeout previo
        if (feedbackTimeout) clearTimeout(feedbackTimeout);

        feedback.textContent = isCorrect ? "¡Correcto!" : "¡Vamos! Intenta otra vez";
        feedback.className = isCorrect ? "correcto" : "incorrecto";
        try {
            if (isCorrect) {
                Pet.setHappy();
                Pet.speak('¡Muy bien!');
            } else {
                Pet.setSad();
                Pet.speak('¡Vamos! Intenta otra vez');
            }
        } catch (e) { }

        // ocultar feedback después de unos segundos
        feedbackTimeout = setTimeout(() => {
            feedback.textContent = '';
            feedback.className = '';
            try { Pet.setIdle(); } catch (e) { }
        }, 1600);
    }

    // ----------------------------
    // CONTROLLER
    // ----------------------------
    function onOptionSelect(e) {
        const isCorrect = e.target.dataset.correct === "true";
        showFeedback(isCorrect);

        if (isCorrect) {
            setTimeout(() => {
                if (nextStory()) {
                    renderStory();
                } else {
                    // Intentar añadir la finalización y detectar si se otorgó insignia
                    let badgeParam = '';
                    try {
                        const res = addLevelCompletion('juego1', currentLevel);
                        if (res && res.badges && res.badges.length) {
                            badgeParam = `&badge=${encodeURIComponent(res.badges[0])}`;
                        }
                    } catch (e) {
                        // ignorar
                    }
                    window.location.href = `../resultados.html?game=juego1&level=${encodeURIComponent(currentLevel)}` + badgeParam;
                                    try {
                                        if (typeof setSessionScore === 'function') {
                                            setSessionScore('juego1', aciertos);
                                        } else if (window.setSessionScore) {
                                            window.setSessionScore('juego1', aciertos);
                                        } else {
                                            import('./util.js').then(mod => mod.setSessionScore('juego1', aciertos));
                                        }
                                    } catch (e) {}
                }
            }, 800);
        }
    }

    // control de sonido
    function initSoundButton() {
        const btn = document.getElementById("toggle-sound");
        // Corrige el estilo para evitar que ocupe todo el ancho/alto
        btn.style.width = '48px';
        btn.style.height = '48px';
        btn.style.borderRadius = '50%';
        btn.style.display = 'inline-flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.fontSize = '1.5rem';
        btn.style.background = '#1976d2';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.boxShadow = '0 2px 8px #0002';
        btn.style.cursor = 'pointer';
        btn.style.margin = '0';
        btn.addEventListener("click", () => {
            // if (bgAudio.paused) {
            //     bgAudio.play();
            //     btn.textContent = "🔊";
            // } else {
            //     bgAudio.pause();
            //     btn.textContent = "🔈";
            // }
        });
    }

    async function init(level = 'nivel-facil') {
        await loadStories(level);
        createExitButton();
        try { Pet.init(); } catch (e) { }
        // Mover el botón de sonido a la esquina superior izquierda

        if (soundBtn) {
            soundBtn.style.position = 'fixed';
            soundBtn.style.top = '18px';
            soundBtn.style.left = '18px';
            soundBtn.style.bottom = '';
            soundBtn.style.right = '';
            soundBtn.style.zIndex = '1001';
            soundBtn.style.visibility = 'hidden';
        }
        initSoundButton();
        //bgAudio.play();
        showInstrucciones();
    }

    return { init };

})();

export default Game1;
