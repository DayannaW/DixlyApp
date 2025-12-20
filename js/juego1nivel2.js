import { loadJSON, addLevelCompletion, hasBadge } from './util.js';
import Pet from './pet.js';

const Game1_2 = (() => {
  let currentLevel = 'nivel-intermedio';
  let stories = [];
  let currentStoryIndex = 0;

  let audioEl = null;
  let playCount = 0;
  let initialPlayLimit = 2;
  const extraPlaysAfterReview = 1;
  let fragmentsShown = false;
  // selection sounds
  const sDrag = new Audio("../../assets/sonidos/drag.mp3");
  const sDrop = new Audio("../../assets/sonidos/drop.mp3");
  sDrag.preload = 'auto';
  sDrop.preload = 'auto';
  let selectionHintShown = false;

  async function loadStories(level) {
    currentLevel = level;
    stories = await loadJSON(`../../js/data/juego1nivel2/${level}.json`);
    currentStoryIndex = 0;
  }

  function calcSpeakDuration(text) {
    if (!text) return 1200;
    const words = (text + '').trim().split(/\s+/).filter(Boolean).length;
    // ~300ms per word, min 800ms, max 8000ms
    const dur = Math.round(words * 300);
    return Math.max(800, Math.min(8000, dur));
  }

  function ensureMinFragments(story) {
    // Use only the fragments defined in the JSON; do not auto-fill or split.
    return (story && story.fragments) ? story.fragments.slice() : [];
  }

  function getCurrentStory() { return stories[currentStoryIndex]; }
  function nextStory() { currentStoryIndex++; return currentStoryIndex < stories.length; }

  function shuffle(arr) { return arr.map(v => ({ v, r: Math.random() })).sort((a, b) => a.r - b.r).map(x => x.v); }

  function createAudio(src) {
    if (audioEl) { audioEl.pause(); audioEl = null; }
    audioEl = new Audio(src);
    audioEl.preload = 'auto';
    audioEl.addEventListener('ended', () => {
      updatePlayUI();
      // after playback, prepare fragments; if this was the second allowed play, reveal automatically
      if (!fragmentsShown) {
        const story = getCurrentStory();
        if (story) {
          if (!story._fragments) story._fragments = ensureMinFragments(story);
        }
        const showBtn = document.getElementById('btn-show-fragments');
        const reviewBtn = document.getElementById('btn-review');
        // if reached play limit (second play), auto-show fragments
        if (playCount >= initialPlayLimit) {
          renderFragments();
          fragmentsShown = true;
          if (showBtn) { showBtn.style.display = 'none'; showBtn.disabled = true; }
          if (reviewBtn) reviewBtn.disabled = false;
        } else {
          // otherwise offer the button to reveal fragments
          if (showBtn) { showBtn.style.display = ''; showBtn.disabled = false; }
          if (reviewBtn) reviewBtn.disabled = true;
        }
      }
    });
  }

  function updatePlayUI() {
    const pc = document.getElementById('play-count');
    if (!pc) return;
    pc.textContent = `${playCount}/${initialPlayLimit}`;
    const playBtn = document.getElementById('play-audio');
    if (playBtn) playBtn.disabled = playCount >= initialPlayLimit;
  }

  function showInstructions() {
    const overlay = document.createElement('div'); overlay.className = 'instructions-overlay';
    const card = document.createElement('div'); card.className = 'instructions-card';
    card.innerHTML = `
      <h3>🚨 Rescate de historias 🚨</h3>

      <p style="text-align: justify; line-height: 1.6;">

        Tuve un pequeño accidente en el archivo de relatos y…  
        las historias quedaron <strong>todas desordenadas</strong>. ¿Me ayudas a arreglarlas?
        <br><br>

        🎧 <strong>Primero</strong>, escucha con atención el microcuento, puedes reproducirlo <strong>hasta dos veces</strong>.
        <br><br>

        🧩 <strong>Después</strong>, ordena los fragmentos para que la historia vuelva a tener sentido.
        <br><br>

        ✅ Cuando creas que está lista, presiona <strong>“Revisar”</strong><br>
        y yo comprobaré tu respuesta.
        <br><br>

        Cada historia ordenada me ayuda a recuperar el archivo perdido.<br>
        <strong>¡Vamos paso a paso, tú puedes!</strong> ✨
      </p>

      <button id="start-btn" class="btn btn-primary">
        Entendido
      </button>
`;


    overlay.appendChild(card);
    document.body.appendChild(overlay);
    // show pet in front without dialog while instructions overlay is visible
    try {
      Pet.init();
      Pet.setIdle();
      const pc = document.getElementById('pixel-container'); if (pc) pc.style.zIndex = '9999';
      const dialog = document.getElementById('pixel-dialog'); if (dialog) dialog.style.display = 'none';
    } catch (e) { }
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.addEventListener('click', () => {
      overlay.remove();
      const pc = document.getElementById('pixel-container'); if (pc) pc.style.zIndex = '';
      const dialog = document.getElementById('pixel-dialog'); if (dialog) dialog.style.display = '';
      startAudioPhase();
    });
  }

  function startAudioPhase() {
    const story = getCurrentStory();
    if (!story) return;
    createAudio(story.audio);
    playCount = 0; updatePlayUI();
    // ensure show button hidden until audio ends
    const showBtn = document.getElementById('btn-show-fragments'); if (showBtn) { showBtn.style.display = 'none'; showBtn.disabled = true; }
    fragmentsShown = false;
    playAudio();
  }

  function playAudio() {
    if (!audioEl) return;
    if (playCount >= initialPlayLimit) return;
    playCount++;
    audioEl.currentTime = 0;
    audioEl.play().catch(() => { });
    updatePlayUI();
  }

  function renderFragments() {
    const story = getCurrentStory();
    if (!story) return;
    const titleEl = document.getElementById('title'); if (titleEl) titleEl.textContent = story.titulo;
    const img = document.getElementById('story-img'); if (img) { img.src = story.img; img.alt = story.titulo; }
    const container = document.getElementById('opciones'); if (!container) return; container.innerHTML = '';

    const correctOrder = (story._fragments && story._fragments.slice()) || story.fragments.slice();
    const shuffled = shuffle(correctOrder.slice());

    shuffled.forEach((text) => {
      const div = document.createElement('div');
      div.className = 'fragment-item';
      div.setAttribute('draggable', 'true');
      div.textContent = text;
      container.appendChild(div);
    });

    enableReorder(container);
  }

  function enableReorder(container) {
    // Selection-based swap mode: click first fragment to select, click second to swap.
    let selected = null;
    const items = [...container.querySelectorAll('.fragment-item')];
    items.forEach(item => {
      // clear draggable attributes to avoid drag conflicts
      item.removeAttribute('draggable');
      item.classList.remove('dragging');
      // click handler for selection/swap
      item.addEventListener('click', (e) => {
        // brief click feedback
        item.classList.add('clicked');
        setTimeout(() => item.classList.remove('clicked'), 140);
        // if locked, do nothing (optionally inform)
        if (item.classList.contains('locked')) {
          try { Pet.speak('Este fragmento está bloqueado.'); } catch (err) { }
          return;
        }
        if (!selected) {
          // select this item as source
          selected = item;
          selected.classList.add('selected-swap');
          try { sDrag.currentTime = 0; sDrag.play().catch(()=>{}); } catch (e) {}
          if (!selectionHintShown) {
            try { Pet.speak('Seleccionado para intercambiar. Elige con cuál cambiar.'); } catch (err) {}
            selectionHintShown = true;
          }
          return;
        }
        if (selected === item) {
          // deselect
          selected.classList.remove('selected-swap');
          selected = null;
          return;
        }
        // perform swap between selected and this item (this is target)
        if (item.classList.contains('locked')) {
          try { Pet.speak('No puedes intercambiar con un fragmento bloqueado.'); } catch (err) { }
          return;
        }
        // play drop sound, highlight target briefly then swap to give visual feedback
        try { sDrop.currentTime = 0; sDrop.play().catch(()=>{}); } catch (e) {}
        try { item.classList.add('target-highlight'); } catch (err) {}
        const SWAP_DELAY = 300; // ms
        setTimeout(() => {
          swapElements(selected, item);
          // cleanup selection
          try { selected.classList.remove('selected-swap'); } catch (e) {}
          selected = null;
        }, SWAP_DELAY);
        // remove highlight after a bit longer than swap delay
        setTimeout(() => { try { item.classList.remove('target-highlight'); } catch (e) {} }, SWAP_DELAY + 600);
      });
    });
  }

  function getDragAfterElement(container, y) {
    // ignore elements that are currently locked so they remain in their fixed indices
    const draggableElements = [...container.querySelectorAll('.fragment-item:not(.dragging):not(.locked)')];
    let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
    draggableElements.forEach(child => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) closest = { offset, element: child };
    });
    return closest.element;
  }

  function swapElements(a, b) {
    // swap DOM positions of elements a and b
    const pa = a.parentNode;
    const pb = b.parentNode;
    if (!pa || !pb) return;
    const aNext = a.nextSibling === b ? a : a.nextSibling;
    pa.insertBefore(a, b);
    pb.insertBefore(b, aNext);
  }

  function reviewPlacement() {
    const story = getCurrentStory();
    const container = document.getElementById('opciones'); if (!container || !story) return;
    const items = [...container.querySelectorAll('.fragment-item')];
    let allCorrect = true;
    items.forEach((item, idx) => {
      const expectedList = (story._fragments && story._fragments) || story.fragments;
      const expected = expectedList[idx] || '';
      if (item.textContent.trim() === expected.trim()) {
        item.classList.add('locked'); item.setAttribute('draggable', 'false'); item.style.cursor = 'default';
      } else {
        allCorrect = false; item.setAttribute('draggable', 'true'); item.classList.remove('locked');
      }
    });

    // Do not increase initialPlayLimit on review; just refresh UI
    updatePlayUI();

    if (allCorrect) {
      setTimeout(() => {
        if (nextStory()) {
          fragmentsShown = false; initialPlayLimit = 2; playCount = 0; renderNextStory();
        } else {
          let badgeParam = '';
          try {
            const res = addLevelCompletion('juego1', currentLevel);
            if (res && res.badges && res.badges.length) badgeParam = `&badge=${encodeURIComponent(res.badges[0])}`;
          } catch (e) { }
          window.location.href = `../resultados.html?game=juego1&level=${encodeURIComponent(currentLevel)}` + badgeParam;
        }
      }, 900);
    } else {
      try { const txt = 'Algunas frases todavía están en desorden. Reordénalas y vuelve a revisar.'; Pet.speak(txt); } catch (e) { }
    }
  }

  function renderNextStory() {
    const pc = document.getElementById('play-count'); if (pc) pc.textContent = `0/2`;
    const reviewBtn = document.getElementById('btn-review'); if (reviewBtn) reviewBtn.disabled = true;
    const story = getCurrentStory();
    const titleEl = document.getElementById('title'); if (titleEl && story) titleEl.textContent = story.titulo;
    const img = document.getElementById('story-img'); if (img && story) { img.src = story.img; img.alt = story.titulo; }
    // hide show button when moving to next story
    const showBtn = document.getElementById('btn-show-fragments'); if (showBtn) { showBtn.style.display = 'none'; showBtn.disabled = true; }
    fragmentsShown = false;
    const opciones = document.getElementById('opciones'); if (opciones) opciones.innerHTML = '';
    // show a short transition/overlay before starting the next audio
    showNextStoryAnimation(story);
  }

  function showNextStoryAnimation(story) {
    const overlay = document.createElement('div'); overlay.className = 'next-story-overlay';
    const card = document.createElement('div'); card.className = 'next-story-card';
    card.innerHTML = `<h3>Próxima historia</h3><h4>${story && story.titulo ? story.titulo : ''}</h4>`;
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    // force reflow then show
    requestAnimationFrame(() => overlay.classList.add('show'));
    // pet announces next story
    try { const announce = `Ahora escucharemos: ${story.titulo || ''}`; Pet.speak(announce); } catch (e) {}
    const delay = (typeof calcSpeakDuration === 'function') ? calcSpeakDuration(`Ahora escucharemos: ${story.titulo || ''}`) + 500 : 1200;
    setTimeout(() => {
      overlay.classList.remove('show'); overlay.classList.add('hide');
      // wait for hide animation to finish, then remove overlay and start audio after 1s
      setTimeout(() => {
        try { overlay.remove(); } catch (e) {}
        setTimeout(() => { startAudioPhase(); }, 1000);
      }, 300);
    }, delay);
  }

  function initControls() {
    const playBtn = document.getElementById('play-audio'); if (playBtn) playBtn.addEventListener('click', () => { playAudio(); });
    const reviewBtn = document.getElementById('btn-review'); if (reviewBtn) reviewBtn.addEventListener('click', () => { reviewPlacement(); });
    // create "Mostrar fragmentos" button (hidden until audio played once)
    let showBtn = document.getElementById('btn-show-fragments');
    if (!showBtn) {
      const controlsRow = document.querySelector('.controls-row') || document.getElementById('container');
      showBtn = document.createElement('button');
      showBtn.id = 'btn-show-fragments';
      showBtn.className = 'btn-show-fragments btn';
      showBtn.textContent = 'Mostrar fragmentos';
      showBtn.style.display = 'none';
      showBtn.disabled = true;
      if (controlsRow) controlsRow.appendChild(showBtn);
    }
    showBtn.addEventListener('click', () => {
      // reveal fragments and start ordering
      renderFragments();
      fragmentsShown = true;
      showBtn.style.display = 'none';
      const reviewBtn2 = document.getElementById('btn-review'); if (reviewBtn2) reviewBtn2.disabled = false;
    });
  }

  async function init(level = 'nivel-intermedio') {
    await loadStories(level);
    try { Pet.init(); Pet.setIdle(); } catch (e) { }
    initControls();
    showInstructions();
  }

  return { init };

})();

export default Game1_2;

