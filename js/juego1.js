import { loadJSON } from './util.js';

const Game1 = (() => {

    let currentLevel = 'nivel-facil';
    let stories = [];
    let currentStoryIndex = 0;

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

        document.getElementById('title').textContent = story.titulo;
        document.getElementById('texto-principal').textContent = story.texto;
        
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

    async function init(level = 'nivel-facil') { //esta variable solo se usara si no se envia ningun parametro
        await loadStories(level);
        renderStory();
    }

    return { init };

})();

export default Game1;
