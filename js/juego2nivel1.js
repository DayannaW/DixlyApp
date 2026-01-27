import { loadJSON, addLevelCompletion } from './util.js';
import Pet from './pet.js';


const Game2 = (() => {
  let palabras = [];
  let current = 0;
  let aciertos = 0;

  async function loadPalabras() {
    palabras = await loadJSON('../../js/data/juego2/nivel1.json');
    // Aleatorizar el orden de las palabras
    for (let i = palabras.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [palabras[i], palabras[j]] = [palabras[j], palabras[i]];
    }
    // Limitar a 6 palabras
    palabras = palabras.slice(0, 6);
    current = 0;
    aciertos = 0;
  }

  // Pantalla de instrucciones
  function showInstrucciones() {
    // Hacer Pixel más grande mientras se muestran las instrucciones
    const pixelContainer = document.getElementById('pixel-container');
    if (pixelContainer) pixelContainer.classList.add('pixel-grande');
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
      window.location.href = '../juego2/index.html';
    });
    // Contenedor relativo para el botón X
    const cardWrapper = document.createElement('div');
    cardWrapper.style.position = 'relative';
    cardWrapper.appendChild(closeBtn);
    cardWrapper.appendChild(card);

    card.innerHTML = `
            <h2 style="margin-bottom: 1rem;">Eco Preciso</h2>
            <p >No todos los sonidos dicen exactamente lo mismo.<br>
              A veces una palabra se parece mucho a otra… pero no es la misma.<br><br>
              En este laboratorio, tu misión es escuchar con atención.<br><br>
              Oirás una palabra.<br>
              Luego aparecerán varias opciones.<br><br>
              Elige la palabra que sí estaba en el audio.<br>
              Confía en tu oído, no en la prisa.</p>
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

      const pc = document.getElementById('pixel-container');
      if (pc) {
        pc.style.zIndex = '';
        pc.classList.remove('pixel-grande'); // Quitar clase al cerrar instrucciones
      }
      const dialog = document.getElementById('pixel-dialog'); if (dialog) dialog.style.display = '';
      showJuego();
    };
    // CSS para pixel-grande
    const styleId = 'pixel-grande-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
  }

  function showJuego() {
    // Efectos de sonido para la cuenta regresiva
    const countdownSound = new Audio('../../assets/sonidos/cuentaRegresiva1.mp4');
    const yaSound = new Audio('../../assets/sonidos/cuentaRegresiva2.mp4');
    // Para pausar/reanudar sonidos de cuenta regresiva
    let pausedCountdownSound = false;
    let pausedYaSound = false;
    const main = document.getElementById('main-container');
    const palabraObj = palabras[current];
    if (!palabraObj) return;
    // Mezclar opciones
    const opciones = palabraObj.opciones.map((o, i) => ({ ...o, idx: i })).sort(() => Math.random() - 0.5);
    main.innerHTML = `
      <button id="pause-btn" class="btn btn-pause" style="position:absolute;top:18px;right:18px;z-index:2000;">⏸ Pausa</button>
      <div class="j2-card">
        <h2>Escucha el sonido perdido</h2>
        <div id="countdown" class="j2-countdown"></div>
        <div id="audio-area" style="display:none;"></div>
        <div id="fall-area" class="fall-area"></div>
        <div id="drop-box" class="drop-box">Arrastra aquí la palabra correcta</div>
        <div id="j2-feedback" class="j2-feedback"></div>
      </div>
      <div id="pause-overlay" style="display:none;position:fixed;z-index:3000;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.45);backdrop-filter:blur(2px);align-items:center;justify-content:center;">
        <div style="background:#fff;padding:2.5rem 2.5rem 2rem 2.5rem;border-radius:18px;box-shadow:0 4px 32px #0002;font-size:2.2rem;font-weight:700;color:#234;">En pausa</div>
      </div>
    `;
    // Pixel mensaje
    setTimeout(() => { try { Pet.speak('Escucha con atención.'); } catch (e) { } }, 400);
    // Pausa
    const pauseBtn = document.getElementById('pause-btn');
    const pauseOverlay = document.getElementById('pause-overlay');
    let paused = false;
    let resumeCallbacks = [];
    pauseBtn.onclick = () => {
      paused = true;
      pauseOverlay.style.display = 'flex';
      // Pausar audios activos
      if (window._activeAudio && !window._activeAudio.paused) window._activeAudio.pause();
      // Pausar sonidos de cuenta regresiva si están sonando
      if (!countdownSound.paused) { countdownSound.pause(); pausedCountdownSound = true; } else { pausedCountdownSound = false; }
      if (!yaSound.paused) { yaSound.pause(); pausedYaSound = true; } else { pausedYaSound = false; }
    };
    // Crear botones para el overlay de pausa
    pauseOverlay.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
        <div style="font-size: 2.2rem; margin-bottom: 2rem;">En pausa</div>
        <button id="reanudarBtn" style="font-size: 1.3rem; padding: 0.7rem 2.2rem; margin-bottom: 1.2rem; border-radius: 1.5rem; border: none; background: #4caf50; color: white; cursor: pointer;">Reanudar</button>
        <button id="volverMenuBtn" style="font-size: 1.1rem; padding: 0.6rem 2rem; border-radius: 1.5rem; border: none; background: #f44336; color: white; cursor: pointer;">Salir del juego</button>
      </div>
    `;
    // Obtener referencias a los botones
    const reanudarBtn = pauseOverlay.querySelector('#reanudarBtn');
    const volverMenuBtn = pauseOverlay.querySelector('#volverMenuBtn');

    // Solo el botón Reanudar reanuda el juego
    reanudarBtn.onclick = (e) => {
      e.stopPropagation();
      if (paused) {
        paused = false;
        pauseOverlay.style.display = 'none';
        // Reanudar audios activos
        if (window._activeAudio) {
          if (window._activeAudio._shouldResume) {
            window._activeAudio._shouldResume = false;
          }
          if (window._activeAudio.paused) {
            setTimeout(() => {
              try { window._activeAudio.play().catch(() => { }); } catch (e) { }
            }, 0);
          }
        }
        if (pausedCountdownSound && countdownSound.paused) {
          setTimeout(() => { try { countdownSound.play().catch(() => { }); } catch (e) { } }, 0);
        }
        if (pausedYaSound && yaSound.paused) {
          setTimeout(() => { try { yaSound.play().catch(() => { }); } catch (e) { } }, 0);
        }
        resumeCallbacks.forEach(fn => fn());
        resumeCallbacks = [];
      }
    };
    // Botón para volver al menú principal
    volverMenuBtn.onclick = (e) => {
      e.stopPropagation();
      window.location.href = 'index.html';
    };
    // Evitar que el overlay reanude el juego al hacer click fuera de los botones
    pauseOverlay.onclick = (e) => {
      e.stopPropagation();
    };
    // Cuenta regresiva animada con sonido
    const countdown = document.getElementById('countdown');
    let count = 3;
    countdown.textContent = count;
    countdown.style.fontSize = '3.5rem';
    countdown.style.fontWeight = 'bold';
    countdown.style.margin = '1.5rem 0';
    countdown.style.opacity = '1';
    countdown.style.transition = 'opacity 0.4s';
    function doCountdown() {
      if (paused) {
        resumeCallbacks.push(doCountdown);
        return;
      }
      // Mostrar número y reproducir sonido juntos
      if (count > 0) {
        countdown.textContent = count;
        countdown.style.opacity = '1';
        try { countdownSound.currentTime = 0; countdownSound.play().catch(() => { }); } catch (e) { }
      }
      if (count > 1) {
        setTimeout(() => {
          if (paused) { resumeCallbacks.push(doCountdown); return; }
          count--;
          doCountdown();
        }, 1200);
        setTimeout(() => { if (!paused) countdown.style.opacity = '0.3'; }, 900);
      } else {
        setTimeout(() => {
          if (paused) { resumeCallbacks.push(doCountdown); return; }
          countdown.textContent = '¡Ya!';
          countdown.style.opacity = '1';
          try { yaSound.currentTime = 0; yaSound.play().catch(() => { }); } catch (e) { }
          setTimeout(() => {
            if (paused) { resumeCallbacks.push(doCountdown); return; }
            countdown.style.opacity = '0';
            setTimeout(() => {
              if (paused) { resumeCallbacks.push(doCountdown); return; }
              countdown.style.display = 'none';
              playAudioAndStart();
            }, 400);
          }, 900);
        }, 1200);
      }
    }
    doCountdown();
    function playAudioAndStart() {
      const audio = new Audio(palabraObj.audio);
      window._activeAudio = audio;
      let playCount = 0;
      let waitingToPlay = false;
      let fallbackBtn = null;
      function showFallbackBtn() {
        if (fallbackBtn) return;
        const audioArea = document.getElementById('audio-area');
        audioArea.style.display = 'block';
        fallbackBtn = document.createElement('button');
        fallbackBtn.textContent = '🔊 Reproducir sonido';
        fallbackBtn.className = 'btn btn-audio';
        fallbackBtn.style.margin = '0.7rem auto 0 auto';
        fallbackBtn.onclick = () => {
          audio.currentTime = 0;
          audio.play().then(() => {
            fallbackBtn.style.display = 'none';
          }).catch(() => {
            fallbackBtn.style.display = 'block';
          });
        };
        audioArea.innerHTML = '';
        audioArea.appendChild(fallbackBtn);
      }
      function hideFallbackBtn() {
        if (fallbackBtn) fallbackBtn.style.display = 'none';
      }
      function playNext() {
        if (paused) {
          // Solo apilar una vez
          if (!waitingToPlay) {
            waitingToPlay = true;
            audio._shouldResume = true;
            resumeCallbacks.push(() => {
              waitingToPlay = false;
              playNext();
            });
          }
          return;
        }
        waitingToPlay = false;
        if (playCount < 2) {
          audio.currentTime = 0;
          const playPromise = audio.play();
          if (playPromise && typeof playPromise.then === 'function') {
            playPromise.catch(err => {
              if (err.name === 'AbortError') return; // Ignorar error por pausa
              // Si es un error de reproducción automática, mostrar botón
              showFallbackBtn();
            });
            playPromise.then(() => { hideFallbackBtn(); });
          }
        } else {
          window._activeAudio = null;
          startFallingWords();
        }
      }
      audio.onended = () => {
        playCount++;
        if (playCount < 2) {
          setTimeout(() => {
            if (paused) {
              if (!waitingToPlay) {
                waitingToPlay = true;
                audio._shouldResume = true;
                resumeCallbacks.push(() => {
                  waitingToPlay = false;
                  playNext();
                });
              }
              return;
            }
            playNext();
          }, 2000); // 1 segundo de silencio entre repeticiones
        } else {
          playNext();
        }
      };
      playNext();
    }
    function startFallingWords() {
      const fallArea = document.getElementById('fall-area');
      fallArea.innerHTML = '';
      // Ocupar casi todo el ancho
      const areaWidth = fallArea.offsetWidth || 360;
      const n = opciones.length;
      const spacing = areaWidth / (n + 1);
      // Para lluvia: cada palabra cae con diferente delay y diferente destino vertical
      const minTop = 140, maxTop = 220;
      let palabrasEnCaida = 0;
      let palabrasFinalizadas = 0;
      const dragSound = new Audio('../../assets/sonidos/drag.mp3');
      const dropSound = new Audio('../../assets/sonidos/drop.mp3');
      const correctSound = new Audio('../../assets/sonidos/correct.mp3');
      const wrongSound = new Audio('../../assets/sonidos/wrong.mp3');
      opciones.forEach((op, i) => {
        const w = document.createElement('div');
        w.className = 'fall-word';
        w.textContent = op.texto;
        w.setAttribute('draggable', 'true');
        w.style.top = '-60px';
        w.style.left = `${Math.round(spacing * (i + 1) - 60)}px`;
        w.style.opacity = '0';
        fallArea.appendChild(w);
        // Lluvia: cada palabra cae con diferente delay y diferente top final
        const delay = 600 + Math.random() * 900 + i * 600; // entre 0.6s y 2.1s, más separación
        const finalTop = minTop + Math.random() * (maxTop - minTop);
        let fallTimeout;
        setTimeout(() => {
          w.style.opacity = '1';
          let currentTop = -60;
          const step = 14 + Math.random() * 6; // tamaño del salto
          const interval = 1000 + Math.random() * 30; // ms entre saltos
          palabrasEnCaida++;
          function fallStep() {
            if (paused) {
              fallTimeout = setTimeout(fallStep, 120);
              return;
            }
            if (currentTop < finalTop) {
              currentTop = Math.min(currentTop + step, finalTop);
              w.style.top = `${currentTop}px`;
              fallTimeout = setTimeout(fallStep, interval);
            } else {
              w.style.top = `${finalTop}px`;
              // Desactivar drag al llegar al fondo
              w.setAttribute('draggable', 'false');
              w.classList.add('fall-inactiva');
              palabrasFinalizadas++;
              // Si todas las palabras han llegado al fondo y no se ha respondido, pausa y anima
              if (palabrasFinalizadas === n && !fallArea.classList.contains('respondido')) {
                // Desactivar drag de todas
                const allWords = fallArea.querySelectorAll('.fall-word');
                allWords.forEach(fw => { fw.setAttribute('draggable', 'false'); fw.classList.add('fall-inactiva'); });
                let transitionTimeout;
                function transitionNext() {
                  if (paused) { transitionTimeout = setTimeout(transitionNext, 120); return; }
                  // Mostrar feedback con la palabra correcta
                  const palabraCorrecta = palabraObj.opciones.find(o => o.correcto).texto;
                  showJ2Feedback(false, palabraCorrecta);
                  setTimeout(() => { if (paused) { transitionTimeout = setTimeout(transitionNext, 120); return; } nextPalabra(); }, 4200);
                }
                setTimeout(transitionNext, 2700); // espera antes de mostrar feedback
              }
            }
          }
          fallStep();
        }, delay);
        // Drag events
        w.ondragstart = e => {
          if (w.getAttribute('draggable') === 'false') { e.preventDefault(); return; }
          dragSound.currentTime = 0; dragSound.play();
          e.dataTransfer.setData('text/plain', op.idx);
          setTimeout(() => w.classList.add('dragging'), 0);
        };
        w.ondragend = () => {
          w.classList.remove('dragging');
          dropSound.currentTime = 0; dropSound.play();
        };
        // Soporte táctil para móviles: simular drop al tocar la palabra
        w.addEventListener('touchstart', function(e) {
          if (w.getAttribute('draggable') === 'false' || fallArea.classList.contains('respondido')) return;
          e.preventDefault();
          dropSound.currentTime = 0; dropSound.play();
          // Animar la palabra hacia la drop-box
          const dropRect = dropBox.getBoundingClientRect();
          const wordRect = w.getBoundingClientRect();
          // Calcular el desplazamiento necesario
          const deltaX = dropRect.left + dropRect.width/2 - (wordRect.left + wordRect.width/2);
          const deltaY = dropRect.top + dropRect.height/2 - (wordRect.top + wordRect.height/2);
          w.style.transition = 'transform 0.55s cubic-bezier(.4,1.2,.6,1), opacity 0.2s';
          w.style.zIndex = '10000';
          w.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.15)`;
          setTimeout(() => {
            w.style.opacity = '0';
            // Simular drop en la drop-box
            const idx = op.idx;
            const palabraCorrecta = palabraObj.opciones.find(o => o.correcto).texto;
            // Desactivar drag de todas las palabras al responder
            const allWords = fallArea.querySelectorAll('.fall-word');
            allWords.forEach(fw => { fw.setAttribute('draggable', 'false'); fw.classList.add('fall-inactiva'); });
            fallArea.classList.add('respondido');
            if (op.correcto) {
              correctSound.currentTime = 0; correctSound.play();
              dropBox.textContent = op.texto;
              dropBox.classList.add('drop-correct');
              showJ2Feedback(true, palabraCorrecta);
              setTimeout(() => nextPalabra(), 3400);
            } else {
              wrongSound.currentTime = 0; wrongSound.play();
              dropBox.classList.add('drop-wrong');
              showJ2Feedback(false, palabraCorrecta);
              // animación de desarmar
              const fallWords = document.querySelectorAll('.fall-word');
              fallWords.forEach(fw => {
                if (fw.textContent === op.texto) {
                  fw.style.transition = 'opacity 0.7s, transform 0.7s';
                  fw.style.opacity = '0';
                  fw.style.transform = 'scale(0.7) rotate(-18deg)';
                }
              });
              setTimeout(() => nextPalabra(), 4200);
            }
          }, 550);
        }, { passive: false });
      });
      // Drop box
      const dropBox = document.getElementById('drop-box');
      dropBox.ondragover = e => { e.preventDefault(); dropBox.classList.add('drop-hover'); };
      dropBox.ondragleave = () => dropBox.classList.remove('drop-hover');
      dropBox.ondrop = e => {
        e.preventDefault();
        dropSound.currentTime = 0; dropSound.play();
        dropBox.classList.remove('drop-hover');
        const idx = parseInt(e.dataTransfer.getData('text/plain'));
        const op = palabraObj.opciones[idx];
        const palabraCorrecta = palabraObj.opciones.find(o => o.correcto).texto;

        if (!op) return;
        // Desactivar drag de todas las palabras al responder
        const allWords = fallArea.querySelectorAll('.fall-word');
        allWords.forEach(fw => { fw.setAttribute('draggable', 'false'); fw.classList.add('fall-inactiva'); });
        fallArea.classList.add('respondido');
        if (op.correcto) {
          correctSound.currentTime = 0; correctSound.play();
          dropBox.textContent = op.texto;
          dropBox.classList.add('drop-correct');
          showJ2Feedback(true, palabraCorrecta);
          setTimeout(() => nextPalabra(), 3400);
        } else {
          wrongSound.currentTime = 0; wrongSound.play();
          dropBox.classList.add('drop-wrong');
          showJ2Feedback(false, palabraCorrecta);
          // animación de desarmar
          const fallWords = document.querySelectorAll('.fall-word');
          fallWords.forEach(fw => {
            if (fw.textContent === op.texto) {
              fw.style.transition = 'opacity 0.7s, transform 0.7s';
              fw.style.opacity = '0';
              fw.style.transform = 'scale(0.7) rotate(-18deg)';
            }
          });
          setTimeout(() => nextPalabra(), 4200);
        }
      };
    }
  }
  function showJ2Feedback(correcto, palabraCorrecta) {
    const fb = document.getElementById('j2-feedback');
    if (correcto) {
      fb.textContent = '¡Este sonido está en su lugar!';
      fb.className = 'j2-feedback correcto';
      try { Pet.setHappy(); Pet.speak('¡Este sonido está en su lugar!'); } catch (e) { }
      aciertos++;
      setTimeout(() => { fb.textContent = ''; fb.className = 'j2-feedback'; try { Pet.setIdle(); } catch (e) { } }, 3200);
    } else {
      fb.textContent = 'Parece que no es la palabra que escuchaste, la palabra era ' + palabraCorrecta.toUpperCase() + '.';
      fb.className = 'j2-feedback incorrecto';
      try { Pet.setSad(); Pet.speak('La palabra correcta era ' + palabraCorrecta); } catch (e) { }
      setTimeout(() => { fb.textContent = ''; fb.className = 'j2-feedback'; try { Pet.setIdle(); } catch (e) { } }, 4000);
    }
  }
  function nextPalabra() {
    current++;
    if (current < palabras.length) {
      showJuego();
    } else {
      // Redirigir directamente a resultados.html con los datos
      try {
        // Guardar progreso y calcular puntos acumulados
        addLevelCompletion('juego2', 'nivel-facil');
      } catch (e) { }
      let total = 0;
      try {
        const STORAGE_KEY = 'dixly_progress_v1';
        let p = localStorage.getItem(STORAGE_KEY);
        p = p ? JSON.parse(p) : { perGame: {}, total: 0 };
        total = p.total || 0;
      } catch (e) { }
      // aciertos = palabras correctas, intentos = cantidad de palabras jugadas
      const intentos = palabras.length;
      window.location.href = `../resultados.html?game=juego2&level=nivel-facil&aciertos=${aciertos}&intentos=${intentos}&score=${aciertos}&total=${total}`;
    }
  }
  //}

  async function init() {
    await loadPalabras();
    showInstrucciones();
  }

  return { init };
})();

export default Game2;
