import { loadJSON } from './util.js';

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
    function renderStory() {
        const story = getCurrentStory();

        // título y texto
        document.getElementById('title').textContent = story.titulo;
        document.getElementById('texto-principal').textContent = story.texto;

        // imagen
        const imgEl = document.getElementById('story-img');
        if (story.img) {
            imgEl.src = story.img;
            imgEl.style.display = "block";
        } else {
            imgEl.style.display = "none";
        }

        // opciones
        const opcionesContainer = document.getElementById('opciones');
        opcionesContainer.innerHTML = "";

        story.opciones.forEach((opcion, i) => {
            const btn = document.createElement('button');
            btn.className = "opcion-btn";
            btn.textContent = opcion.texto;
            btn.dataset.correct = opcion.correcto;
            btn.addEventListener('click', onOptionSelect);
            opcionesContainer.appendChild(btn);
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
        bgAudio.play();
        renderStory();
    }

    return { init };

})();

export default Game1;
