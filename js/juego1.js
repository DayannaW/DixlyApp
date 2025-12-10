import { loadJSON } from './util.js';

// --- SONIDOS DEL JUEGO ---
const sDrag = new Audio("../assets/sonidos/drag.mp3");
const sDrop = new Audio("../assets/sonidos/drop.mp3");
const sCorrect = new Audio("../assets/sonidos/correct.mp3");
const sWrong = new Audio("../assets/sonidos/wrong.mp3");

// Para evitar retraso al reproducir
[sDrag, sDrop, sCorrect, sWrong].forEach(s => { s.preload = "auto"; });


const Game1 = (() => {

    let currentLevel = 'nivel-facil';
    let stories = [];
    let currentStoryIndex = 0;

    // --- Sonido de fondo ---
    const bgAudio = new Audio("../asset/audio/juego1-fondo.mp3");
    bgAudio.loop = true;
    bgAudio.volume = 0.35;

    // ----------------------------
    // MODEL
    // ----------------------------
    async function loadStories(level) {
        currentLevel = level;
        stories = await loadJSON(`../js/data/juego1/${level}.json`);
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

            } else {
                // Incorrecto
                dropZone.classList.add("drop-incorrecto");
                setTimeout(() => {
                    dropZone.classList.remove("drop-incorrecto");
                }, 600);

                // reproducir sonido incorrecto
                sWrong.currentTime = 0;
                sWrong.play();

                showFeedback(false);
            }
        });


    }


    function showFeedback(isCorrect) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = isCorrect ? "¡Correcto!" : "Intenta otra vez";
        feedback.className = isCorrect ? "correcto" : "incorrecto";
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
                    window.location.href = './resultados.html';
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
        initSoundButton();
        //bgAudio.play();
        renderStory();
    }

    return { init };

})();

export default Game1;
