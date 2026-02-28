import { loadJSON, addLevelCompletion } from './util.js';
import Pet from './pet.js';

const btnSalir = document.createElement('button');

const Game1_3 = (() => {
  let stories = [];
  let currentStory = 0;
  let score = 0;
  let userEndings = [];
  let pensadorValienteAchieved = false;
  let aciertosGenerales = 0; // Nuevo: aciertos generales del juego

  async function loadStories() {
    stories = await loadJSON('../../js/data/juego1/nivel-dificil.json');
    currentStory = 0;
    score = 0;
    userEndings = [];
    aciertosGenerales = 0;
  }

  // function showInstructions() {
  //   const main = document.getElementById('main-container');
  //   main.innerHTML = `
  //     <div class="instructions-overlay">
  //       <div class="instructions-card">
  //         <h2>¡Arma el final de la historia!</h2>
  //         <p>Lee la historia con atención. Cuando termines, deberás elegir y ordenar tres fragmentos para construir el final más coherente.<br><br>
  //         Arrastra los fragmentos al espacio vacío. Puedes quitar y cambiar los fragmentos antes de revisar tu respuesta.<br><br>
  //         ¡Mucha suerte!</p>
  //         <button id="start-btn" class="btn btn-primary">Comenzar</button>
  //       </div>
  //     </div>
  //   `;
  //   try { Pet.init(); Pet.setIdle(); } catch (e) {console.log("oc err"+e);}
  //   const pc = document.getElementById('pixel-container');
  //   if (pc) pc.style.zIndex = '9999';
  //   const dialog = document.getElementById('pixel-dialog');
  //   if (dialog) dialog.style.display = 'none';
  //   //setTimeout(() => { try { Pet.speak('¡Vamos a armar el final! Lee las instrucciones y presiona Comenzar.'); } catch (e) {} }, 400);
  //   document.getElementById('start-btn').onclick = () => {
  //     if (pc) pc.style.zIndex = '';
  //     if (dialog) dialog.style.display = '';
  //     showStoryBase();
  //   };
  // }


  function showInstructions() {
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

    // Card
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
      <h2 style="margin-bottom: 1rem;">El Final es Tuyo!</h2>
      <p >
        Has reunido las piezas.<br>
        Has ordenado los fragmentos.<br><br>

        Ahora falta lo más difícil:<br>
        entender la historia lo suficiente como para darle un final.<br><br>

        Lee con calma.<br>
        Elige el cierre que mejor represente lo que el texto ha construido.<br><br>

        No todos los finales son correctos,<br>
        pero solo uno encaja de verdad.<br><br>
      </p>
      <button id="start-btn" class="instruction-btn">Entiendo</button>
    `;

    overlay.appendChild(cardWrapper);
    document.body.appendChild(overlay);
            // Mostrar el botón después de 2.5 segundos
    setTimeout(() => {
            document.querySelector('.instruction-btn')?.classList.add('visible');
        }, 5000);
    // Pixel grande y ocultar dialog
    try {
      Pet.init();
      Pet.setIdle();
      const pc = document.getElementById('pixel-container'); if (pc) pc.style.zIndex = '10000';
      if (pc) pc.classList.add('pixel-grande');
      const dialog = document.getElementById('pixel-dialog'); if (dialog) dialog.style.display = 'none';
    } catch (e) { }
    const startBtn = document.getElementById('start-btn');
    if (startBtn) startBtn.addEventListener('click', () => {
      overlay.remove();
      btnSalir.style.visibility = 'visible'; // Mostrar botón salir
      const pc = document.getElementById('pixel-container'); if (pc) { pc.style.zIndex = ''; pc.classList.remove('pixel-grande'); }
      const dialog = document.getElementById('pixel-dialog'); if (dialog) dialog.style.display = '';
      showStoryBase();
    });
  }


  // Crear botón salir en la esquina superior derecha
  function createExitButton() {
    if (document.getElementById('btn-salir-j2')) return;
    btnSalir.id = 'btn-salir-j2';
    btnSalir.textContent = 'X';
    btnSalir.className = 'close-btn';
    btnSalir.style.position = 'absolute';
    btnSalir.style.top = '18px';
    btnSalir.style.right = '18px';
    btnSalir.style.zIndex = '1001';    
    btnSalir.style.visibility = 'hidden';
    btnSalir.onclick = () => {
      window.location.href = '../juego1/index.html';
    };
    document.body.appendChild(btnSalir);
  }

  function showStoryBase() {
    const main = document.getElementById('main-container');
    const story = stories[currentStory];
    if (!story) return;
    main.innerHTML = `
      <div class="story-base-card">
        <h2>${story.titulo}</h2>
        <img src="${story.img}" alt="${story.titulo}" class="story-img" style="max-width:120px; margin:0 auto 0.8rem; display:block; border-radius:10px;" />
        <div class="story-text" style="margin-bottom:1.5rem; text-align:justify;">
          ${story.base.replace('[FINAL]', '<span class="final-placeholder" id="final-placeholder">(Aquí irá el final)</span>')}
        </div>
        <button id="btn-end-reading" class="final-read-btn">Terminar de leer</button>
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
        <img src="${story.img}" alt="${story.titulo}" class="story-img" style="max-width:120px; margin:0 auto 0.8rem; display:block; border-radius:10px;" />
        <div class="story-text" style="margin-bottom:1.5rem; text-align:justify;">
          ${story.base.replace('[FINAL]', '<span class="final-placeholder" id="final-placeholder">' + '<div id="final-slots" class="final-slots"></div>' + '</span>')}
        </div>
        <div id="separator-instruction" style="display:none;">
          <hr style="margin: 1.2rem 0 0.7rem 0; border: none; border-top: 2px solid #e0e0e0;" />
          <div style="font-size:1.04rem; color:#444; margin-bottom:0.7rem; text-align:center;">Elige tres opciones y colócalas arriba en orden lógico</div>
        </div>
        <div id="fragment-list" class="fragment-list"></div>
        <button id="btn-review" class="controles-btn orange-btn" style="display:none;margin-top:1.2rem;">Revisar</button>
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
      const isSmallScreen = window.innerWidth <= 700;
      shuffled.forEach((frag, idx) => {
        // Si ya está en un slot, no mostrar
        if (selectedSlots.includes(frag.i)) return;
        const card = document.createElement('div');
        card.className = 'fragment-card';
        card.textContent = frag.f;
        card.draggable = !isSmallScreen;
        card.style.margin = '0 0 8px 0';
        card.style.padding = '10px';
        card.style.background = '#fff';
        card.style.border = '1.5px solid #b3b3b3';
        card.style.borderRadius = '8px';
        card.style.fontSize = '0.8rem';
        card.style.cursor = isSmallScreen ? 'pointer' : 'grab';
        if (!isSmallScreen) {
          card.ondragstart = e => {
            e.dataTransfer.setData('frag-idx', frag.i);
          };
        } else {
          // Click para seleccionar y colocar en slot
          card.onclick = () => {
            // Buscar primer slot vacío
            const emptyIdx = selectedSlots.findIndex(x => x === null);
            if (emptyIdx !== -1) {
              placeFragmentInSlot(frag.i, emptyIdx);
            }
          };
        }
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
    // Mostrar la línea separadora e instrucción solo si hay fragmentos
    setTimeout(() => {
      const fragList = document.getElementById('fragment-list');
      const separator = document.getElementById('separator-instruction');
      if (fragList && separator) {
        if (fragList.children.length > 0) {
          separator.style.display = '';
        } else {
          separator.style.display = 'none';
        }
      }
    }, 50);
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
    // Guardar acierto general solo si el final es completamente coherente
    if (aciertos === 3) {
      aciertosGenerales++;
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
            '<span class="final-placeholder" id="final-placeholder">' + selectedSlots.map(idx => `<mark class="user-frag">${story.fragmentos[idx]}</mark>`).join('') + '</span>')}
        </div>
        <div class="feedback-result" style="font-size:1.2rem; font-weight:bold; margin-bottom:1rem;">${resultado}</div>
        <div class="actions">
          <button id="btn-retry" class="controles-btn blu-btn">Volver a intentar</button>
          <button id="btn-next-story" class="controles-btn orange-btn">Continuar</button>
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
      pensadorValienteAchieved = true;
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
    const aciertos = aciertosGenerales;
    let puntajeNivel3 = total * 10;
    // Verificar insignias
    let arquitectoSentido = userEndings.some(e => e && e.puntos === 3);
    let badgeConditions = {};
    if (arquitectoSentido) badgeConditions['arquitecto-sentido'] = true;
    if (pensadorValienteAchieved) badgeConditions['pensador-valiente'] = true;
    try { addLevelCompletion('juego1', 'nivel-dificil', badgeConditions, puntajeNivel3); } catch (e) {}
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
      // Sumar el puntaje de la sesión actual al total global en dixly_progress_v1
      // try {
      //   const storageKey = 'dixly_progress_v1';
      //   let data = localStorage.getItem(storageKey);
      //   let json = {};
      //   if (data) {
      //     json = JSON.parse(data);
      //   }
      //   const prevTotal = parseInt(json.total || 0, 10);
      //   json.total = prevTotal + total;
      //   localStorage.setItem(storageKey, JSON.stringify(json));
      // } catch (e) {}
      // Guardar el puntaje de la sesión actual para este juego
      try {
        // Importación dinámica para evitar problemas si no está importado arriba
        if (typeof setSessionScore === 'function') {
          setSessionScore('juego1', puntajeNivel3);
        } else if (window.setSessionScore) {
          window.setSessionScore('juego1', puntajeNivel3);
        } else {
          // Importar si es módulo
          import('./util.js').then(mod => mod.setSessionScore('juego1', puntajeNivel3));
        }
      } catch (e) {}
      window.location.href = '../resultados.html?game=juego1&level=nivel-dificil&score=' + puntajeNivel3 + '&aciertos=' + aciertos;
    };
  }

  async function init() {
    await loadStories();
    createExitButton();
    showInstructions();
  }

  return { init };
})();

export default Game1_3;
