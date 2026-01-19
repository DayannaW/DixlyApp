import { loadJSON, addLevelCompletion, hasBadge } from './util.js';
import Pet from './pet.js';

const Game1_2 = (() => {
      // Botón de pausa/reanudar audio
        // Botón único para reproducir, pausar y reanudar audio
        function createAudioControlButton() {
          if (document.getElementById('btn-audio-control')) return document.getElementById('btn-audio-control');
          const btn = document.createElement('button');
          btn.id = 'btn-audio-control';
          btn.textContent = '▶️ Reproducir audio';
          btn.className = 'btn btn-audio';
          btn.style.display = 'block';
          btn.style.margin = '18px auto 0 auto';
          btn.style.fontSize = '1.1rem';
          btn.style.padding = '0.5rem 1.4rem';
          btn.style.borderRadius = '1.5rem';
          btn.style.border = 'none';
          btn.style.background = '#1976d2';
          btn.style.color = 'white';
          btn.style.cursor = 'pointer';
          btn.disabled = false;
          // Insertar debajo de la imagen de la historia
          const imgArea = document.getElementById('img-area');
          if (imgArea && imgArea.parentNode) {
            imgArea.parentNode.insertBefore(btn, imgArea.nextSibling);
          } else {
            document.body.appendChild(btn);
          }
          return btn;
        }
    // Crear botón salir en la esquina superior derecha
    function createExitButton() {
      if (document.getElementById('btn-salir-j2')) return;
      const btn = document.createElement('button');
      btn.id = 'btn-salir-j2';
      btn.textContent = 'Salir';
      btn.className = 'btn btn-exit';
      btn.style.position = 'absolute';
      btn.style.top = '18px';
      btn.style.right = '18px';
      btn.style.zIndex = '1001';
      btn.style.fontSize = '1.1rem';
      btn.style.padding = '0.5rem 1.4rem';
      btn.style.borderRadius = '1.5rem';
      btn.style.border = 'none';
      btn.style.background = '#f44336';
      btn.style.color = 'white';
      btn.style.cursor = 'pointer';
      btn.onclick = () => {
        window.location.href = '../juego1/index.html';
      };
      document.body.appendChild(btn);
    }
  let currentLevel = 'nivel-intermedio';
  let stories = [];
  let currentStoryIndex = 0;

  let audioEl = null;
    let audioBtn = null;
    let audioSrcActual = null;
    let audioState = 'idle'; // 'idle', 'playing', 'paused', 'ended'
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
    if (!audioBtn) audioBtn = document.getElementById('btn-audio-control');
    if (audioBtn) {
      audioBtn.disabled = false;
      audioBtn.textContent = '▶️ Reproducir audio';
      audioState = 'idle';
      audioBtn.onclick = () => {
        if (!audioEl) return;
        if (audioState === 'idle' || audioState === 'ended') {
          audioEl.currentTime = 0;
          audioEl.play();
        } else if (audioState === 'playing') {
          audioEl.pause();
        } else if (audioState === 'paused') {
          audioEl.play();
        }
      };
    }
    audioEl.addEventListener('play', () => {
      audioState = 'playing';
      if (audioBtn) audioBtn.textContent = '⏸️ Pausar audio';
    });
    audioEl.addEventListener('pause', () => {
      if (audioEl.currentTime < audioEl.duration) {
        audioState = 'paused';
        if (audioBtn) audioBtn.textContent = '▶️ Reanudar audio';
      }
    });
    audioEl.addEventListener('ended', () => {
      audioState = 'ended';
      if (audioBtn) audioBtn.textContent = '▶️ Reproducir audio';
      updatePlayUI();
    });
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

    // Track time before review for 'mirada atenta'
    let rondaStartTime = null;
    let miradaAtentaAchieved = false;

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

    // Start timer for 'mirada atenta' when fragments are shown
    rondaStartTime = Date.now();
    console.log("Ronda start time:", rondaStartTime);

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

  // Tracking de intentos fallidos antes de lograr el orden correcto
  let failedReviewCount = 0;
  // Tracking para 'Oído narrativo': si en alguna ronda se ordenó correctamente con solo 1 reproducción
  let oidoNarrativoAchieved = false;
  // Contadores de aciertos e intentos
  let aciertos = 0;
  let intentos = 0;
  function reviewPlacement() {
      // Check time before review for 'mirada atenta'
      if (rondaStartTime) {
        const delay = (Date.now() - rondaStartTime) / 1000;
        console.log("Delay before review (s):", delay);
        if (delay > 10) miradaAtentaAchieved = true;
        console.log("Mirada atenta achieved:", miradaAtentaAchieved);
      }
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

    // Cada vez que el usuario presiona revisar, cuenta como intento
    intentos++;
    // Do not increase initialPlayLimit on review; just refresh UI
    updatePlayUI();

    if (allCorrect) {
      // Si solo se reprodujo el audio una vez en esta ronda, marcar logro
      if (playCount === 1) {
        oidoNarrativoAchieved = true;
      }
      aciertos++;
      setTimeout(() => {
        if (nextStory()) {
          fragmentsShown = false; initialPlayLimit = 2; playCount = 0; renderNextStory();
        } else {
          let badgeParam = '';
          let badgeConditions = {};
          if (failedReviewCount > 0) badgeConditions['reorganizador-experto'] = true;
          if (oidoNarrativoAchieved) badgeConditions['oido-narrativo'] = true;
          if (miradaAtentaAchieved) badgeConditions['mirada-atenta'] = true;
          try {
            const res = addLevelCompletion('juego1', currentLevel, badgeConditions);
            if (res && res.badges && res.badges.length) badgeParam = res.badges.map(b => `badge=${encodeURIComponent(b)}`).join('&');
            badgeParam = badgeParam ? ('&' + badgeParam) : '';
          } catch (e) { }
          window.location.href = `../resultados.html?game=juego1&level=${encodeURIComponent(currentLevel)}&aciertos=${aciertos}&intentos=${intentos}` + badgeParam;
        }
      }, 900);
    } else {
      failedReviewCount++;
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
    createExitButton();
    audioBtn = createAudioControlButton();
    failedReviewCount = 0;
    oidoNarrativoAchieved = false;
    aciertos = 0;
    intentos = 0;
    try { Pet.init(); Pet.setIdle(); } catch (e) { }
    initControls();
    showInstructions();
  }

  return { init };

})();

export default Game1_2;

