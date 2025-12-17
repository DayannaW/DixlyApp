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

    let currentLevel = 'nivel-facil';
    let stories = [];
    let currentStoryIndex = 0;
    let feedbackTimeout = null;

    // --- Sonido de fondo ---
    const bgAudio = new Audio("../../assets/sonidos/juego1-fondo.mp3");
    bgAudio.loop = true;
    bgAudio.volume = 0.35;

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

                setTimeout(() => {
                    if (nextStory()) {
                        renderStory();
                    } else {
                        // Intentar añadir la finalización y detectar si se otorgó insignia
                        let badgeParam = '';
                        try {
                            const res = addLevelCompletion('juego1', currentLevel);
                            console.log('addLevelCompletion result:', res);
                            if (res && res.badges && res.badges.length) {
                                console.log('Badge earned:', res.badges[0]);
                                badgeParam = `&badge=${encodeURIComponent(res.badges[0])}`;
                            }
                        } catch (e) {
                            // fallo al escribir progreso, continuamos intentando comprobar si ya existe la insignia
                        }

                        try {
                            if (!badgeParam && hasBadge('juego1','primer-paso')) badgeParam = '&badge=primer-paso';
                            console.log('Existing badge check, badgeParam:', badgeParam);
                        } catch (e) {
                            console.error('Error checking existing badges:', e);
                            // ignorar
                        }

                        window.location.href = `../resultados.html?game=juego1&level=${encodeURIComponent(currentLevel)}` + badgeParam;
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
                Pet.speak('¡Muy bien!', 1800);
            } else {
                Pet.setSad();
                Pet.speak('Intenta otra vez', 1600);
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

                    try {
                        if (!badgeParam && hasBadge('juego1','primer-paso')) badgeParam = '&badge=primer-paso';
                    } catch (e) {}

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
        renderStory();
    }

    return { init };

})();

export default Game1;
