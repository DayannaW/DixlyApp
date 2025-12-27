import { loadJSON } from './util.js';
import Pet from './pet.js';

const Game2 = (() => {
  let palabras = [];
  let current = 0;
  let aciertos = 0;

  async function loadPalabras() {
    palabras = await loadJSON('../../js/data/juego2/nivel1.json');
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
    try { Pet.init(); Pet.setIdle(); } catch (e) {}
    setTimeout(() => { try { Pet.speak('¡Vamos a recolectar sonidos! Lee las instrucciones y presiona Comenzar.'); } catch (e) {} }, 400);
    document.getElementById('start-btn').onclick = () => {
      showJuego();
    };
  }

  function showJuego() {
    const main = document.getElementById('main-container');
    const palabraObj = palabras[current];
    if (!palabraObj) return;
    // Mezclar opciones
    const opciones = palabraObj.opciones.map((o, i) => ({...o, idx: i})).sort(() => Math.random() - 0.5);
    main.innerHTML = `
      <div class="j2-card">
        <h2>Escucha el sonido perdido</h2>
        <div id="countdown" class="j2-countdown"></div>
        <div id="audio-area" style="margin:1.2rem 0; display:none;">
          <button id="play-audio" class="btn btn-audio">🔊 Escuchar</button>
        </div>
        <div id="fall-area" class="fall-area"></div>
        <div id="drop-box" class="drop-box">Arrastra aquí la palabra correcta</div>
        <div id="j2-feedback" class="j2-feedback"></div>
      </div>
    `;
    // Pixel mensaje
    setTimeout(() => { try { Pet.speak('Escucha con atención.'); } catch (e) {} }, 400);
    // Cuenta regresiva animada
    const countdown = document.getElementById('countdown');
    let count = 3;
    countdown.textContent = count;
    countdown.style.fontSize = '3.5rem';
    countdown.style.fontWeight = 'bold';
    countdown.style.margin = '1.5rem 0';
    countdown.style.opacity = '1';
    countdown.style.transition = 'opacity 0.4s';
    function doCountdown() {
      if (count > 1) {
        setTimeout(() => {
          count--;
          countdown.textContent = count;
          countdown.style.opacity = '1';
          doCountdown();
        }, 800);
        setTimeout(() => { countdown.style.opacity = '0.3'; }, 600);
      } else {
        setTimeout(() => {
          countdown.textContent = '¡Ya!';
          countdown.style.opacity = '1';
          setTimeout(() => {
            countdown.style.opacity = '0';
            setTimeout(() => {
              countdown.style.display = 'none';
              playAudioAndStart();
            }, 400);
          }, 600);
        }, 800);
      }
    }
    doCountdown();
    function playAudioAndStart() {
      const audio = new Audio(palabraObj.audio);
      let playCount = 0;
      function playNext() {
        if (playCount < 2) {
          audio.currentTime = 0;
          audio.play();
        } else {
          // Mostrar botón de audio por si el usuario quiere repetir
          const audioArea = document.getElementById('audio-area');
          audioArea.style.display = '';
          document.getElementById('play-audio').onclick = () => { audio.currentTime = 0; audio.play(); };
          startFallingWords();
        }
      }
      audio.onended = () => {
        playCount++;
        if (playCount < 2) {
          setTimeout(playNext, 2000); // 1 segundo de silencio entre repeticiones
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
        setTimeout(() => {
          w.style.transition = 'top 4.5s cubic-bezier(.4,1.2,.6,1), opacity 1.2s';
          w.style.top = `${finalTop}px`;
          w.style.opacity = '1';
        }, delay);
        // Drag events
        w.ondragstart = e => {
          e.dataTransfer.setData('text/plain', op.idx);
          setTimeout(() => w.classList.add('dragging'), 0);
        };
        w.ondragend = () => w.classList.remove('dragging');
      });
      // Drop box
      const dropBox = document.getElementById('drop-box');
      dropBox.ondragover = e => { e.preventDefault(); dropBox.classList.add('drop-hover'); };
      dropBox.ondragleave = () => dropBox.classList.remove('drop-hover');
      dropBox.ondrop = e => {
        e.preventDefault();
        dropBox.classList.remove('drop-hover');
        const idx = parseInt(e.dataTransfer.getData('text/plain'));
        const op = palabraObj.opciones[idx];
        if (!op) return;
        if (op.correcto) {
          dropBox.textContent = op.texto;
          dropBox.classList.add('drop-correct');
          showJ2Feedback(true);
          setTimeout(() => nextPalabra(), 1400);
        } else {
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
          setTimeout(() => nextPalabra(), 1400);
        }
      };
    }
  }
    function showJ2Feedback(correcto) {
      const fb = document.getElementById('j2-feedback');
      if (correcto) {
        fb.textContent = '¡Este sonido está en su lugar!';
        fb.className = 'j2-feedback correcto';
        try { Pet.setHappy(); Pet.speak('¡Este sonido está en su lugar!'); } catch (e) {}
        aciertos++;
      } else {
        fb.textContent = 'Parece que no es la palabra que escuchaste, vamos con la siguiente.';
        fb.className = 'j2-feedback incorrecto';
        try { Pet.setSad(); Pet.speak('Parece que no es la palabra que escuchaste, vamos con la siguiente.'); } catch (e) {}
      }
      setTimeout(() => { fb.textContent = ''; fb.className = 'j2-feedback'; try { Pet.setIdle(); } catch (e) {} }, 1200);
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
    main.innerHTML = `
      <div class="result-card" style="max-width:420px; margin:3rem auto; padding:1.5rem; border-radius:12px; box-shadow:var(--sombra-media); background:var(--color-blanco); text-align:center">
        <h2>¡Juego completado!</h2>
        <p>Palabras restauradas: <strong>${aciertos} / ${palabras.length}</strong></p>
        <button id="btn-finish" class="btn btn-primary">Ver resultados</button>
      </div>
    `;
    setTimeout(() => { try { Pet.setHappy(); Pet.speak('¡Has restaurado los sonidos perdidos!'); } catch (e) {} }, 400);
    document.getElementById('btn-finish').onclick = () => {
      window.location.href = '../resultados.html?game=juego2&level=nivel1&score=' + aciertos;
    };
  }

  async function init() {
    await loadPalabras();
    showInstrucciones();
  }

  return { init };
})();

export default Game2;
