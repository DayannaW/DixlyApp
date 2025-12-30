import { loadJSON } from './util.js';
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
    current = 0;
    aciertos = 0;
  }

  function showInstrucciones() {
    const main = document.getElementById('main-container');
    main.innerHTML = `
      <div class="instructions-overlay">
        <div class="instructions-card">
          <h2>¡Sonidos perdidos!</h2>
          <p>Pixel está recolectando sonidos que se escaparon del archivo de palabras.<br><br>
          Escucha con atención la palabra que suena y arrastra la opción correcta a la caja de sonidos.<br><br>
          Cada acierto restaura un sonido. Cada error deforma el sonido.<br><br>
          ¡Buena suerte!</p>
          <button id="start-btn" class="btn btn-primary">Comenzar</button>
        </div>
      </div>
    `;
    try { Pet.init(); Pet.setIdle(); Pet.hideDialog && Pet.hideDialog(); } catch (e) { }
    // No mostrar globo de diálogo en instrucciones
    document.getElementById('start-btn').onclick = () => {
      showJuego();
    };
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
    pauseOverlay.onclick = () => {
      if (paused) {
        paused = false;
        pauseOverlay.style.display = 'none';
        // Reanudar audios activos
        if (window._activeAudio) {
          // Si estaba marcado para reanudar, limpiar flag
          if (window._activeAudio._shouldResume) {
            window._activeAudio._shouldResume = false;
          }
          // Si está pausado, intentar reproducir
          if (window._activeAudio.paused) {
            setTimeout(() => {
              try { window._activeAudio.play().catch(() => { }); } catch (e) { }
            }, 0);
          }
        }
        // Reanudar sonidos de cuenta regresiva si estaban pausados
        if (pausedCountdownSound && countdownSound.paused) {
          setTimeout(() => { try { countdownSound.play().catch(()=>{}); } catch(e){} }, 0);
        }
        if (pausedYaSound && yaSound.paused) {
          setTimeout(() => { try { yaSound.play().catch(()=>{}); } catch(e){} }, 0);
        }
        // Reanudar callbacks
        resumeCallbacks.forEach(fn => fn());
        resumeCallbacks = [];
      }
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
        try { countdownSound.currentTime = 0; countdownSound.play().catch(() => {}); } catch (e) {}
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
          try { yaSound.currentTime = 0; yaSound.play().catch(() => {}); } catch (e) {}
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
              // Puedes loguear otros errores si lo deseas
            });
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
                  try { Pet.speak('¡No te preocupes! Vamos a intentarlo con la siguiente palabra.'); } catch (e) { }
                  setTimeout(() => { if (paused) { transitionTimeout = setTimeout(transitionNext, 120); return; } nextPalabra(); }, 2000);
                }
                setTimeout(transitionNext, 700);
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
        if (!op) return;
        // Desactivar drag de todas las palabras al responder
        const allWords = fallArea.querySelectorAll('.fall-word');
        allWords.forEach(fw => { fw.setAttribute('draggable', 'false'); fw.classList.add('fall-inactiva'); });
        fallArea.classList.add('respondido');
        if (op.correcto) {
          correctSound.currentTime = 0; correctSound.play();
          dropBox.textContent = op.texto;
          dropBox.classList.add('drop-correct');
          showJ2Feedback(true);
          setTimeout(() => nextPalabra(), 1400);
        } else {
          wrongSound.currentTime = 0; wrongSound.play();
          dropBox.classList.add('drop-wrong');
          showJ2Feedback(false);
          // animación de desarmar
          const fallWords = document.querySelectorAll('.fall-word');
          fallWords.forEach(fw => {
            if (fw.textContent === op.texto) {
              fw.style.transition = 'opacity 0.7s, transform 0.7s';
              fw.style.opacity = '0';
              fw.style.transform = 'scale(0.7) rotate(-18deg)';
            }
          });
          setTimeout(() => nextPalabra(), 2200);
        }
      };
    }
  }
  function showJ2Feedback(correcto) {
    const fb = document.getElementById('j2-feedback');
    if (correcto) {
      fb.textContent = '¡Este sonido está en su lugar!';
      fb.className = 'j2-feedback correcto';
      try { Pet.setHappy(); Pet.speak('¡Este sonido está en su lugar!'); } catch (e) { }
      aciertos++;
      setTimeout(() => { fb.textContent = ''; fb.className = 'j2-feedback'; try { Pet.setIdle(); } catch (e) { } }, 1200);
    } else {
      fb.textContent = 'Parece que no es la palabra que escuchaste, vamos con la siguiente.';
      fb.className = 'j2-feedback incorrecto';
      try { Pet.setSad(); Pet.speak('Parece que no es la palabra que escuchaste, vamos con la siguiente.'); } catch (e) { }
      setTimeout(() => { fb.textContent = ''; fb.className = 'j2-feedback'; try { Pet.setIdle(); } catch (e) { } }, 2000);
    }
  }
  function nextPalabra() {
    current++;
    if (current < palabras.length) {
      showJuego();
    } else {
      showJ2Resultados();
    }
  }
  //}

  function showJ2Resultados() {
    const main = document.getElementById('main-container');
    // Mostrar pantalla intermedia de puntos obtenidos
    main.innerHTML = `
      <div class="result-card" style="max-width:420px; margin:3rem auto; padding:1.5rem; border-radius:12px; box-shadow:var(--sombra-media); background:var(--color-blanco); text-align:center">
        <h2>¡Juego completado!</h2>
        <p>Palabras restauradas: <strong>${aciertos} / ${palabras.length}</strong></p>
        <p style="font-size:1.3rem;margin:1.2rem 0 0.7rem 0;">Puntos obtenidos en este nivel: <strong>${aciertos}</strong></p>
        <button id="btn-finish" class="btn btn-primary">Ver resultados finales</button>
      </div>
    `;
    setTimeout(() => { try { Pet.setHappy(); Pet.speak('¡Has restaurado los sonidos perdidos!'); } catch (e) { } }, 400);
    document.getElementById('btn-finish').onclick = () => {
      // Guardar los puntos de este nivel en el progreso global
      try {
        const STORAGE_KEY = 'dixly_progress_v1';
        let p = localStorage.getItem(STORAGE_KEY);
        p = p ? JSON.parse(p) : { perGame: {}, total: 0 };
        if (!p.perGame['juego2']) p.perGame['juego2'] = { score: 0, levels: {} };
        if (!p.perGame['juego2'].levels['nivel1']) {
          p.perGame['juego2'].levels['nivel1'] = { completedAt: Date.now() };
          p.perGame['juego2'].score = (p.perGame['juego2'].score || 0) + aciertos;
          p.total = (p.total || 0) + aciertos;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
        }
      } catch(e){}
      // Calcular puntos totales acumulados (juego1 + juego2)
      let total = 0;
      try {
        const STORAGE_KEY = 'dixly_progress_v1';
        let p = localStorage.getItem(STORAGE_KEY);
        p = p ? JSON.parse(p) : { perGame: {}, total: 0 };
        total = p.total || 0;
      } catch(e){}
      window.location.href = '../resultados.html?game=juego2&level=nivel1&score=' + aciertos + '&total=' + total;
    };
  }

  async function init() {
    await loadPalabras();
    showInstrucciones();
  }

  return { init };
})();

export default Game2;
