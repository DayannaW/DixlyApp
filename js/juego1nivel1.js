import { loadJSON, addLevelCompletion, hasBadge } from './util.js';
import Pet from './pet.js';

// --- SONIDOS DEL JUEGO ---
const sDrag = new Audio("../../assets/sonidos/drag.mp3");
const sDrop = new Audio("../../assets/sonidos/drop.mp3");
const sCorrect = new Audio("../../assets/sonidos/correct.mp3");
const sWrong = new Audio("../../assets/sonidos/wrong.mp3");

// Para evitar retraso al reproducir
[sDrag, sDrop, sCorrect, sWrong].forEach(s => { s.preload = "auto"; });


const Game1 = (() => {
    // Contadores de aciertos y de intentos
    let aciertos = 0;
    let intentos = 0;
    let currentLevel = 'nivel-facil';
    let stories = [];
    let currentStoryIndex = 0;
    let feedbackTimeout = null;

    // --- Sonido de fondo ---
    const bgAudio = new Audio("../../assets/sonidos/juego1-fondo.mp3");
    bgAudio.loop = true;
    bgAudio.volume = 0.35;

    // Pantalla de instrucciones
    function showInstrucciones() {
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
        card.style.borderRadius = '18px';
        card.style.boxShadow = '0 4px 32px #0002';
        card.style.fontSize = '1.2rem';
        card.style.maxWidth = '420px';
        card.style.textAlign = 'center';

        card.innerHTML = `
            <h2 style="margin-bottom:1.2rem;">El fragmento perdido</h2>
            <p style="margin-bottom:2.2rem;">Arrastra la palabra correcta al espacio en blanco para completar la historia.<br><br>
            Observa la imagen y el contexto para elegir la opción adecuada.<br><br>
            ¡Pon a prueba tu comprensión y diviértete!</p>
            <button id="start-btn" class="btn btn-primary" style="font-size:1.1rem;padding:0.7rem 2.2rem;border-radius:1.5rem;">Comenzar</button>
        `;
        overlay.appendChild(card);
        document.body.appendChild(overlay);
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
            const pc = document.getElementById('pixel-container'); if (pc) pc.style.zIndex = '';
            const dialog = document.getElementById('pixel-dialog'); if (dialog) dialog.style.display = '';
            renderStory();
        };
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
    // Nueva versión de renderStory con soporte para una opción draggable
    function renderStory() {
        const storyData = getCurrentStory();

        // Si es la primera historia, reiniciar contadores
        if (currentStoryIndex === 0) {
            aciertos = 0;
            intentos = 0;
        }

        // 1. Colocar título
        const title = document.getElementById("title");
        title.textContent = storyData.titulo;

        // 2. Mostrar imagen
        const img = document.getElementById("story-img");
        img.src = storyData.img;
        img.alt = storyData.titulo;

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

        storyData.opciones.forEach((op, index) => {

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
            });

            div.addEventListener("dragend", () => {
                div.classList.remove("hide");
            });

            opcionesContainer.appendChild(div);

            //sonido dragstart
            div.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", index);

                sDrag.currentTime = 0;
                sDrag.play();

                setTimeout(() => div.classList.add("dragging"), 0);
            });
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
            const opcion = storyData.opciones[index];

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
            } catch (e) {}

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
                        // Insignia "lector atento": todos los aciertos al primer intento
                        let badgeParams = '';
                        let badgeConditions = {};
                        if (aciertos === intentos && aciertos === stories.length) {
                            badgeConditions['lector-atento'] = true;
                        }
                        try {
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

        feedback.textContent = isCorrect ? "¡Correcto!" : "Intenta otra vez";
        feedback.className = isCorrect ? "correcto" : "incorrecto";
        try {
            if (isCorrect) {
                Pet.setHappy();
                Pet.speak('¡Muy bien!');
            } else {
                Pet.setSad();
                Pet.speak('Intenta otra vez');
            }
        } catch (e) {}

        // ocultar feedback después de unos segundos
        feedbackTimeout = setTimeout(() => {
            feedback.textContent = '';
            feedback.className = '';
            try { Pet.setIdle(); } catch (e) {}
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
                }
            }, 800);
        }
    }

    // control de sonido
    function initSoundButton() {
        const btn = document.getElementById("toggle-sound");

        btn.addEventListener("click", () => {
            if (bgAudio.paused) {
                bgAudio.play();
                btn.textContent = "🔊";
            } else {
                bgAudio.pause();
                btn.textContent = "🔈";
            }
        });
    }

    async function init(level = 'nivel-facil') {
        await loadStories(level);
        try { Pet.init(); } catch (e) {}
        initSoundButton();
        //bgAudio.play();
        showInstrucciones();
    }

    return { init };

})();

export default Game1;
