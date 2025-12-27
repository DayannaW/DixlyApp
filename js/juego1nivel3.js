import { loadJSON, addLevelCompletion } from './util.js';
import Pet from './pet.js';

const Game1_3 = (() => {
  let stories = [];
  let currentStory = 0;
  let score = 0;
  let userEndings = [];

  async function loadStories() {
    stories = await loadJSON('../../js/data/juego1/nivel-dificil.json');
    currentStory = 0;
    score = 0;
    userEndings = [];
  }

  function showInstructions() {
    const main = document.getElementById('main-container');
    main.innerHTML = `
      <div class="instructions-overlay">
        <div class="instructions-card">
          <h2>¡Arma el final de la historia!</h2>
          <p>Lee la historia con atención. Cuando termines, deberás elegir y ordenar tres fragmentos para construir el final más coherente.<br><br>
          Arrastra los fragmentos al espacio vacío. Puedes quitar y cambiar los fragmentos antes de revisar tu respuesta.<br><br>
          ¡Mucha suerte!</p>
          <button id="start-btn" class="btn btn-primary">Comenzar</button>
        </div>
      </div>
    `;
    try { Pet.init(); Pet.setIdle(); } catch (e) {console.log("oc err"+e);}
    const pc = document.getElementById('pixel-container');
    if (pc) pc.style.zIndex = '9999';
    const dialog = document.getElementById('pixel-dialog');
    if (dialog) dialog.style.display = 'none';
    //setTimeout(() => { try { Pet.speak('¡Vamos a armar el final! Lee las instrucciones y presiona Comenzar.'); } catch (e) {} }, 400);
    document.getElementById('start-btn').onclick = () => {
      if (pc) pc.style.zIndex = '';
      if (dialog) dialog.style.display = '';
      showStoryBase();
    };
  }

  function showStoryBase() {
    const main = document.getElementById('main-container');
    const story = stories[currentStory];
    if (!story) return;
    main.innerHTML = `
      <div class="story-base-card">
        <h2>${story.titulo}</h2>
        <img src="${story.img}" alt="${story.titulo}" class="story-img" style="max-width:220px; margin:0 auto 1rem; display:block; border-radius:10px;" />
        <div class="story-text" style="margin-bottom:1.5rem; text-align:justify;">
          ${story.base.replace('[FINAL]', '<span class="final-placeholder" id="final-placeholder">(Aquí irá el final)</span>')}
        </div>
        <button id="btn-end-reading" class="btn btn-primary">Terminar de leer</button>
      </div>
    `;
    // Pixel siempre visible y abajo con mensaje
    setTimeout(() => {
      try {
        Pet.init();
        Pet.setIdle();
        Pet.speak('Lee con calma, no hay prisa.');
        const pc = document.getElementById('pixel-container');
        if (pc) {
          pc.style.bottom = '10px';
          pc.style.zIndex = '';
        }
        const dialog = document.getElementById('pixel-dialog');
        if (dialog) dialog.style.display = '';
      } catch (e) {}
    }, 1000);
    document.getElementById('btn-end-reading').onclick = () => {
      showFragmentSelection();
    };
  }

  function showFragmentSelection() {
    const main = document.getElementById('main-container');
    const story = stories[currentStory];
    if (!story) return;
    // Shuffle fragmentos
    const shuffled = story.fragmentos.map((f, i) => ({ f, i })).sort(() => Math.random() - 0.5);
    // Estado: slots seleccionados (máx 3)
    let selectedSlots = [null, null, null];
    main.innerHTML = `
      <div class="story-base-card">
        <h2>${story.titulo}</h2>
        <img src="${story.img}" alt="${story.titulo}" class="story-img" style="max-width:220px; margin:0 auto 1rem; display:block; border-radius:10px;" />
        <div class="story-text" style="margin-bottom:1.5rem; text-align:justify;">
          ${story.base.replace('[FINAL]', '<span class=\"final-placeholder\" id=\"final-placeholder\">'
            + '<div id=\"final-slots\" class=\"final-slots\"></div>'
            + '</span>')}
        </div>
        <div id="fragment-list" class="fragment-list"></div>
        <button id="btn-review" class="btn btn-success" style="display:none;margin-top:1.2rem;">Revisar</button>
      </div>
    `;
    // Render slots
    const slots = document.getElementById('final-slots');
    for (let i = 0; i < 3; i++) {
      const slot = document.createElement('div');
      slot.className = 'final-slot';
      slot.dataset.idx = i;
      slot.textContent = '(Arrastra aquí)';
      slot.style.minHeight = '48px';
      slot.style.border = '2px dashed #b3b3b3';
      slot.style.margin = '0 0 8px 0';
      slot.style.borderRadius = '8px';
      slot.style.padding = '8px';
      slot.style.background = '#f8fafd';
      slot.style.cursor = 'pointer';
      slot.ondragover = e => { e.preventDefault(); slot.style.background = '#e0eaff'; };
      slot.ondragleave = e => { slot.style.background = '#f8fafd'; };
      slot.ondrop = e => {
        e.preventDefault();
        slot.style.background = '#f8fafd';
        const fragIdx = e.dataTransfer.getData('frag-idx');
        if (fragIdx === undefined) return;
        placeFragmentInSlot(parseInt(fragIdx), i);
      };
      slot.onclick = () => {
        // Quitar fragmento del slot
        if (selectedSlots[i] !== null) {
          selectedSlots[i] = null;
          renderSlots();
          renderFragments();
          checkReviewBtn();
        }
      };
      slots.appendChild(slot);
    }
    // Render fragmentos
    function renderFragments() {
      const fragList = document.getElementById('fragment-list');
      fragList.innerHTML = '';
      shuffled.forEach((frag, idx) => {
        // Si ya está en un slot, no mostrar
        if (selectedSlots.includes(frag.i)) return;
        const card = document.createElement('div');
        card.className = 'fragment-card';
        card.textContent = frag.f;
        card.draggable = true;
        card.style.margin = '0 0 8px 0';
        card.style.padding = '10px';
        card.style.background = '#fff';
        card.style.border = '1.5px solid #b3b3b3';
        card.style.borderRadius = '8px';
        card.style.cursor = 'grab';
        card.ondragstart = e => {
          e.dataTransfer.setData('frag-idx', frag.i);
        };
        fragList.appendChild(card);
      });
    }
    // Render slots
    function renderSlots() {
      const slots = document.getElementById('final-slots').children;
      for (let i = 0; i < 3; i++) {
        const slot = slots[i];
        slot.innerHTML = '';
        if (selectedSlots[i] !== null) {
          const fragIdx = selectedSlots[i];
          const frag = story.fragmentos[fragIdx];
          const fragDiv = document.createElement('div');
          fragDiv.className = 'fragment-in-slot';
          fragDiv.textContent = frag;
          fragDiv.style.background = '#e6f7e6';
          fragDiv.style.border = '1.5px solid #6c8cff';
          fragDiv.style.borderRadius = '8px';
          fragDiv.style.padding = '8px';
          fragDiv.style.cursor = 'pointer';
          slot.appendChild(fragDiv);
        } else {
          slot.textContent = '(Arrastra aquí)';
        }
      }
    }
    // Colocar fragmento en slot
    function placeFragmentInSlot(fragIdx, slotIdx) {
      if (selectedSlots.includes(fragIdx)) return; // no duplicados
      selectedSlots[slotIdx] = fragIdx;
      renderSlots();
      renderFragments();
      checkReviewBtn();
    }
    // Mostrar botón revisar solo si hay 3
    function checkReviewBtn() {
      const btn = document.getElementById('btn-review');
      if (selectedSlots.every(x => x !== null)) {
        btn.style.display = '';
      } else {
        btn.style.display = 'none';
      }
    }
    renderSlots();
    renderFragments();
    checkReviewBtn();
    // Pixel siempre visible con mensaje
    setTimeout(() => {
      try {
        Pet.init();
        Pet.setIdle();
        Pet.speak('Arrastra tres fragmentos para armar el final. Puedes quitarlos haciendo click en el espacio.');
        const pc = document.getElementById('pixel-container');
        if (pc) {
          pc.style.bottom = '10px';
          pc.style.zIndex = '';
        }
        const dialog = document.getElementById('pixel-dialog');
        if (dialog) dialog.style.display = '';
      } catch (e) {}
    }, 400);
    document.getElementById('btn-review').onclick = () => {
      showFeedback(selectedSlots);
    };
  }

  function showFeedback(selectedSlots) {
    const main = document.getElementById('main-container');
    const story = stories[currentStory];
    if (!story) return;
    // Calcular resultado
    const correct = story.final_correcto;
    let aciertos = 0;
    for (let i = 0; i < 3; i++) {
      if (selectedSlots[i] === correct[i]) aciertos++;
    }
    let resultado = '';
    let puntos = 1;
    let pixelMsg = '';
    if (aciertos === 3) {
      resultado = '¡Final coherente!';
      puntos = 3;
      pixelMsg = '¡Excelente! Tu final es completamente coherente con la historia.';
    } else if (aciertos === 2) {
      resultado = 'Final parcialmente coherente';
      puntos = 2;
      pixelMsg = '¡Muy bien! Dos fragmentos están en el orden correcto.';
    } else {
      resultado = 'Final no coherente';
      puntos = 1;
      pixelMsg = 'Puedes mejorar. Intenta encontrar el orden más lógico para el final.';
    }
    // Guardar resultado
    userEndings[currentStory] = { selected: selectedSlots.slice(), puntos };
    // Mostrar feedback
    main.innerHTML = `
      <div class="feedback-card">
        <h2>${story.titulo}</h2>
        <img src="${story.img}" alt="${story.titulo}" class="story-img" style="max-width:220px; margin:0 auto 1rem; display:block; border-radius:10px;" />
        <div class="story-text" style="margin-bottom:1.5rem; text-align:justify;">
          ${story.base.replace('[FINAL]',
            '<span class=\"final-placeholder\" id=\"final-placeholder\">' +
            selectedSlots.map(idx => `<mark class=\"user-frag\">${story.fragmentos[idx]}</mark>`).join('') +
            '</span>')}
        </div>
        <div class="feedback-result" style="font-size:1.2rem; font-weight:bold; margin-bottom:1rem;">${resultado}</div>
        <div class="actions">
          <button id="btn-retry" class="btn btn-primary">Volver a intentar</button>
          <button id="btn-next-story" class="btn btn-success">Continuar</button>
        </div>
      </div>
    `;
    setTimeout(() => {
      try {
        Pet.init();
        Pet.setIdle();
        Pet.speak(pixelMsg);
        const pc = document.getElementById('pixel-container');
        if (pc) {
          pc.style.bottom = '10px';
          pc.style.zIndex = '';
        }
        const dialog = document.getElementById('pixel-dialog');
        if (dialog) dialog.style.display = '';
      } catch (e) {}
    }, 400);
    document.getElementById('btn-retry').onclick = () => {
      showFragmentSelection();
    };
    document.getElementById('btn-next-story').onclick = () => {
      nextStoryOrResults();
    };
  }

  function nextStoryOrResults() {
    if (currentStory < stories.length - 1) {
      currentStory++;
      showStoryBase();
    } else {
      showFinalResults();
    }
  }

  function showFinalResults() {
    const main = document.getElementById('main-container');
    const total = userEndings.reduce((sum, e) => sum + (e ? e.puntos : 0), 0);
    // Guardar progreso con el puntaje real
    try { addLevelCompletion('juego1', 'nivel-dificil', total); } catch (e) {}
    main.innerHTML = `
      <div class="result-card" style="max-width:480px; margin:3rem auto; padding:1.5rem; border-radius:12px; box-shadow:var(--sombra-media); background:var(--color-blanco); text-align:center">
        <h2>¡Nivel difícil completado!</h2>
        <p>Tu puntaje final: <strong>${total} / 12</strong></p>
        <div style="margin:1.2rem 0;">
          ${userEndings.map((e, i) => `<div>Historia ${i+1}: <strong>${e.puntos} punto${e.puntos === 1 ? '' : 's'}</strong></div>`).join('')}
        </div>
        <button id="btn-finish" class="btn btn-primary">Ver resultados</button>
      </div>
    `;
    setTimeout(() => {
      try {
        Pet.init();
        Pet.setIdle();
        Pet.speak('¡Felicidades! Has completado el nivel difícil.');
        const pc = document.getElementById('pixel-container');
        if (pc) {
          pc.style.bottom = '10px';
          pc.style.zIndex = '';
        }
        const dialog = document.getElementById('pixel-dialog');
        if (dialog) dialog.style.display = '';
      } catch (e) {}
    }, 400);
    document.getElementById('btn-finish').onclick = () => {
      window.location.href = '../resultados.html?game=juego1&level=nivel-dificil&score=' + total;
    };
  }

  async function init() {
    await loadStories();
    showInstructions();
  }

  return { init };
})();

export default Game1_3;
