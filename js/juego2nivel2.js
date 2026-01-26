import { loadJSON, addLevelCompletion } from './util.js';
import Pet from './pet.js';

const Game2Nivel2 = (() => {
    let rondas = [];
    let current = 0;
    let aciertos = 0;

    async function loadRondas() {
        rondas = await loadJSON('../../js/data/juego2/nivel-intermedio.json');
        // Mezclar rondas si es necesario
        for (let i = rondas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rondas[i], rondas[j]] = [rondas[j], rondas[i]];
        }
        // Limitar a 10 rondas
        rondas = rondas.slice(0, 10);
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
            <h2 style="margin-bottom: 1rem;">Sonidos en Movimiento</h2>
            <p >Los sonidos ya no esperan.<br>
                Ahora se mueven.<br><br>
                Escucha la palabra con atención.<br>
                Después, varias palabras caerán lentamente frente a ti.<br><br>
                Algunas se parecen…<br>
                pero solo una coincide con lo que escuchaste.<br><br>
                Observa, recuerda y decide en el momento justo.</p>
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

    function shuffle(arr) {
        // Fisher-Yates
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    let autoAdvanceTimeout = null;
    function playSfx(nombre) {
        try {
            const s = new Audio(`../../assets/sonidos/${nombre}`);
            s.volume = 0.7;
            s.play();
        } catch (e) { }
    }

    // Variables de pausa y control globales
    let paused = false;
    let resumeCallbacks = [];
    let activeWordAudio = null;
    let palabraSecuenciaTimeouts = [];
    let fallTimeouts = [];
    // Bandera de fase: 'cuentaRegresiva', 'palabras', 'caida'
    let faseActual = 'cuentaRegresiva';

    function showJuego() {
        const main = document.getElementById('main-container');
        const ronda = rondas[current];
        if (!ronda) return;

        // Determinar etapa
        let etapa = 'inicio';
        // 0-3: inicio, 4-6: medio, 7-9: avanzado
        if (current >= 7) etapa = 'avanzado';
        else if (current >= 4) etapa = 'medio';

        // Reiniciar responded al mostrar nueva ronda
        // Limpiar timeouts y audios pendientes de la ronda anterior
        palabraSecuenciaTimeouts.forEach(t => clearTimeout(t));
        palabraSecuenciaTimeouts = [];
        if (activeWordAudio) {
            try { activeWordAudio.pause(); } catch (e) { }
            activeWordAudio = null;
        }
        let responded = false;
        let autoAdvanceTriggered = false;
        if (autoAdvanceTimeout) {
            clearTimeout(autoAdvanceTimeout);
            autoAdvanceTimeout = null;
        }
        // Selección aleatoria de palabras a escuchar y opciones
        let audioArr = [...ronda.audio];
        shuffle(audioArr);
        // Asegurar que la palabra correcta esté entre las reproducidas
        const correctaAudio = audioArr.find(a => a.correcta);
        let palabrasEscuchar = [];
        if (etapa === 'avanzado') {
            palabrasEscuchar = audioArr.slice(0, 3);
            if (!palabrasEscuchar.some(a => a.correcta)) {
                palabrasEscuchar[2] = correctaAudio;
                shuffle(palabrasEscuchar);
            }
        } else {
            palabrasEscuchar = audioArr.slice(0, 2);
            if (!palabrasEscuchar.some(a => a.correcta)) {
                palabrasEscuchar[1] = correctaAudio;
                shuffle(palabrasEscuchar);
            }
        }

        // Opciones: aleatorio y cantidad según etapa
        let opcionesArr = [...ronda.opciones];
        shuffle(opcionesArr);
        let opciones = [];
        if (etapa === 'inicio') {
            opciones = opcionesArr.slice(0, 3);
        } else {
            opciones = opcionesArr.slice(0, 4);
        }

        // Asegurar que la opción correcta esté incluida
        if (!opciones.some(o => o.correcta)) {
            // Buscar la opción correcta y reemplazar la última
            const correcta = ronda.opciones.find(o => o.correcta);
            opciones[opciones.length - 1] = correcta;
            shuffle(opciones);
        }
        let correctaIdx = opciones.findIndex(o => o.correcta);

        // Render UI
        main.innerHTML = `
            <button id="pause-btn" class="btn btn-pause" style="position:absolute;top:18px;right:18px;z-index:2000;">⏸ Pausa</button>
            <div class="j2-card">
                <h2>Escucha las palabras</h2>
                <div id="countdown" class="j2-countdown"></div>
                <div id="audio-area"></div>
                <div id="fall-area" class="fall-area"></div>
                <div id="drop-box" class="drop-box">Arrastra aquí la palabra correcta</div>
                <div id="j2-feedback" class="j2-feedback"></div>
            </div>
            <div id="pause-overlay" style="display:none;position:fixed;z-index:3000;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.45);backdrop-filter:blur(2px);align-items:center;justify-content:center;">
                <div style="background:#fff;padding:2.5rem 2.5rem 2rem 2.5rem;border-radius:18px;box-shadow:0 4px 32px #0002;font-size:2.2rem;font-weight:700;color:#234;">En pausa</div>
            </div>
        `;
        // PAUSA
        const pauseBtn = document.getElementById('pause-btn');
        const pauseOverlay = document.getElementById('pause-overlay');
        paused = false;
        resumeCallbacks = [];
        let activeCountdownAudio = null;
        let activeYaAudio = null;
        let countdownTimeouts = [];
        faseActual = 'cuentaRegresiva';
        pauseBtn.onclick = () => {
            paused = true;
            // Insertar botones en el overlay de pausa
            pauseOverlay.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                    <div style="font-size: 2.2rem; margin-bottom: 2rem;">En pausa</div>
                    <button id="reanudarBtn" style="font-size: 1.3rem; padding: 0.7rem 2.2rem; margin-bottom: 1.2rem; border-radius: 1.5rem; border: none; background: #4caf50; color: white; cursor: pointer;">Reanudar</button>
                    <button id="volverMenuBtn" style="font-size: 1.1rem; padding: 0.6rem 2rem; border-radius: 1.5rem; border: none; background: #f44336; color: white; cursor: pointer;">Salir del juego</button>
                </div>
            `;
            pauseOverlay.style.display = 'flex';
            // Pausar audios activos según la fase
            if (faseActual === 'cuentaRegresiva') {
                if (activeCountdownAudio && !activeCountdownAudio.paused) activeCountdownAudio.pause();
                if (activeYaAudio && !activeYaAudio.paused) activeYaAudio.pause();
            }
            if (faseActual === 'palabras') {
                if (activeWordAudio && !activeWordAudio.paused) activeWordAudio.pause();
            }
            // NO limpiar timeouts de cuenta regresiva ni de caída de palabras para permitir reanudar correctamente
            // Limpiar timeouts de reproducción de palabras
            palabraSecuenciaTimeouts.forEach(t => clearTimeout(t));
            // Botones funcionales
            const reanudarBtn = pauseOverlay.querySelector('#reanudarBtn');
            const volverMenuBtn = pauseOverlay.querySelector('#volverMenuBtn');
            reanudarBtn.onclick = (e) => {
                e.stopPropagation();
                if (paused) {
                    paused = false;
                    pauseOverlay.style.display = 'none';
                    // Reanudar audios activos según la fase
                    if (faseActual === 'cuentaRegresiva') {
                        if (activeCountdownAudio && activeCountdownAudio.paused) activeCountdownAudio.play().catch(() => { });
                        if (activeYaAudio && activeYaAudio.paused) activeYaAudio.play().catch(() => { });
                    }
                    if (faseActual === 'palabras') {
                        if (activeWordAudio && activeWordAudio.paused) activeWordAudio.play().catch(() => { });
                    }
                    resumeCallbacks.forEach(fn => fn());
                    resumeCallbacks = [];
                }
            };
            volverMenuBtn.onclick = (e) => {
                e.stopPropagation();
                window.location.href = 'index.html';
            };
            // Evitar que el overlay reanude el juego al hacer click fuera de los botones
            pauseOverlay.onclick = (e) => {
                e.stopPropagation();
            };
        };
        pauseOverlay.onclick = () => {
            // No hacer nada, solo evitar propagación
            // El reanudar solo ocurre con el botón
            return false;
        };
        setTimeout(() => { try { Pet.speak('Escucha con atención.'); } catch (e) { } }, 400);
        // Cuenta regresiva antes de reproducir audio
        const countdown = document.getElementById('countdown');
        let count = 3;
        countdown.textContent = count;
        countdown.style.fontSize = '3.5rem';
        countdown.style.fontWeight = 'bold';
        countdown.style.margin = '1.5rem 0';
        countdown.style.opacity = '1';
        countdown.style.transition = 'opacity 0.4s';
        let fallingStarted = false;
        function doCountdown() {
            if (paused) { resumeCallbacks.push(doCountdown); return; }
            if (count > 0) {
                faseActual = 'cuentaRegresiva';
                countdown.textContent = count;
                countdown.style.opacity = '1';
                activeCountdownAudio = new Audio('../../assets/sonidos/cuentaRegresiva1.mp4');
                activeCountdownAudio.volume = 0.7;
                activeCountdownAudio.play();
            }
            if (count > 1) {
                countdownTimeouts.push(setTimeout(() => {
                    if (paused) { resumeCallbacks.push(doCountdown); return; }
                    count--;
                    doCountdown();
                }, 1200));
                countdownTimeouts.push(setTimeout(() => { if (!paused) countdown.style.opacity = '0.3'; }, 900));
            } else {
                countdownTimeouts.push(setTimeout(() => {
                    if (paused) { resumeCallbacks.push(doCountdown); return; }
                    countdown.textContent = '¡Ya!';
                    countdown.style.opacity = '1';
                    activeYaAudio = new Audio('../../assets/sonidos/cuentaRegresiva2.mp4');
                    activeYaAudio.volume = 0.7;
                    activeYaAudio.play();
                    countdownTimeouts.push(setTimeout(() => {
                        if (paused) { resumeCallbacks.push(doCountdown); return; }
                        countdown.style.opacity = '0';
                        countdownTimeouts.push(setTimeout(() => {
                            if (paused) { resumeCallbacks.push(doCountdown); return; }
                            countdown.style.display = 'none';
                            faseActual = 'palabras';
                            reproducirPalabrasSecuencia(palabrasEscuchar, () => {
                                // Mensaje según etapa
                                let msg = 'Solo una palabra que escuchaste está aquí.';
                                if (etapa === 'avanzado') msg = '¡Atento! Ahora escuchaste tres palabras.';
                                try { Pet.speak(msg, 1000); } catch (e) { }
                                // Limpiar callbacks de reproducción de palabras
                                resumeCallbacks = resumeCallbacks.filter(fn => fn.name !== 'next');
                                // Limpiar timeouts y audio de palabras
                                palabraSecuenciaTimeouts.forEach(t => clearTimeout(t));
                                palabraSecuenciaTimeouts = [];
                                if (activeWordAudio) {
                                    try { activeWordAudio.pause(); } catch (e) { }
                                    activeWordAudio = null;
                                }
                                // Limpiar y pausar audios de cuenta regresiva
                                if (activeCountdownAudio) {
                                    try { activeCountdownAudio.pause(); } catch (e) { }
                                    activeCountdownAudio = null;
                                }
                                if (activeYaAudio) {
                                    try { activeYaAudio.pause(); } catch (e) { }
                                    activeYaAudio = null;
                                }
                                // Cambiar fase a caida
                                faseActual = 'caida';
                                setTimeout(() => {
                                    if (!fallingStarted) {
                                        fallingStarted = true;
                                        startFallingWords(opciones, correctaIdx);
                                    }
                                }, 1800);
                            });
                        }, 400));
                    }, 900));
                }, 1200));
            }
        }
        doCountdown();
    }

    function reproducirPalabrasSecuencia(palabras, callback) {
        let idx = 0;
        let fallbackBtn = null;
        function showFallbackBtn(audio) {
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
        function next() {
            if (paused) {
                resumeCallbacks.push(next);
                return;
            }
            if (idx >= palabras.length) {
                if (callback) callback();
                return;
            }
            if (activeWordAudio) {
                try { activeWordAudio.pause(); } catch (e) { }
                activeWordAudio = null;
            }
            activeWordAudio = new Audio(palabras[idx].ruta);
            activeWordAudio.onended = () => {
                const avanzar = () => { idx++; next(); };
                if (paused) {
                    resumeCallbacks.push(avanzar);
                } else {
                    palabraSecuenciaTimeouts.push(setTimeout(avanzar, 400));
                }
            };
            const playPromise = activeWordAudio.play();
            if (playPromise && typeof playPromise.then === 'function') {
                playPromise.catch(err => {
                    showFallbackBtn(activeWordAudio);
                });
                playPromise.then(() => { hideFallbackBtn(); });
            }
        }
        next();
    }

    function startFallingWords(opciones, correctaIdx) {
        const fallArea = document.getElementById('fall-area');
        fallArea.innerHTML = '';
        const n = opciones.length;
        const areaWidth = fallArea.offsetWidth || 360;
        const spacing = areaWidth / (n + 1);
        let palabrasFinalizadas = 0;
        // Variables locales por ronda
        let localResponded = false;
        let localAutoAdvanceTriggered = false;
        fallTimeouts = [];
        opciones.forEach((op, i) => {
            const w = document.createElement('div');
            w.className = 'fall-word';
            w.textContent = op.texto;
            w.setAttribute('draggable', 'true');
            w.style.top = '-60px';
            w.style.left = `${Math.round(spacing * (i + 1) - 60)}px`;
            w.style.opacity = '0';
            fallArea.appendChild(w);
            fallTimeouts.push(setTimeout(() => {
                w.style.opacity = '1';
                let currentTop = -60;
                const step = 14 + Math.random() * 6;
                const interval = 1000 + Math.random() * 30;
                function fallStep() {
                    if (paused) { resumeCallbacks.push(fallStep); return; }
                    if (currentTop < 180) {
                        currentTop = Math.min(currentTop + step, 180);
                        w.style.top = `${currentTop}px`;
                        fallTimeouts.push(setTimeout(fallStep, interval));
                    } else {
                        w.style.top = '180px';
                        w.setAttribute('draggable', 'false');
                        w.classList.add('fall-inactiva');
                        palabrasFinalizadas++;
                        // Si todas las palabras han llegado al fondo y no se ha respondido, pasar a la siguiente ronda
                        if (palabrasFinalizadas === n && !localResponded && !localAutoAdvanceTriggered) {
                            localAutoAdvanceTriggered = true;
                            playSfx('wrong.mp3');
                            autoAdvanceTimeout = setTimeout(() => {
                                if (!localResponded) nextRonda();
                            }, 1200);
                        }
                    }
                }
                fallStep();
            }, 600 + Math.random() * 900 + i * 600));
            // Drag events
            w.ondragstart = e => {
                if (w.getAttribute('draggable') === 'false') { e.preventDefault(); return; }
                playSfx('drag.mp3');
                e.dataTransfer.setData('text/plain', i);
                setTimeout(() => w.classList.add('dragging'), 0);
            };
            w.ondragend = () => {
                w.classList.remove('dragging');
            };
            // Soporte táctil para móviles: simular drop al tocar la palabra
            w.addEventListener('touchstart', function(e) {
                if (w.getAttribute('draggable') === 'false' || fallArea.classList.contains('respondido')) return;
                e.preventDefault();
                playSfx('drop.mp3');
                // Animar la palabra hacia la drop-box
                const dropBox = document.getElementById('drop-box');
                const dropRect = dropBox.getBoundingClientRect();
                const wordRect = w.getBoundingClientRect();
                const deltaX = dropRect.left + dropRect.width/2 - (wordRect.left + wordRect.width/2);
                const deltaY = dropRect.top + dropRect.height/2 - (wordRect.top + wordRect.height/2);
                w.style.transition = 'transform 0.55s cubic-bezier(.4,1.2,.6,1), opacity 0.2s';
                w.style.zIndex = '10000';
                w.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.15)`;
                setTimeout(() => {
                    w.style.opacity = '0';
                    // Simular drop
                    handleDrop(i, opciones, correctaIdx, () => {
                        localResponded = true;
                        localAutoAdvanceTriggered = true;
                        if (autoAdvanceTimeout) {
                            clearTimeout(autoAdvanceTimeout);
                            autoAdvanceTimeout = null;
                        }
                    });
                }, 550);
            }, { passive: false });
        });
        // Drop box
        const dropBox = document.getElementById('drop-box');
        dropBox.ondragover = e => { e.preventDefault(); dropBox.classList.add('drop-hover'); };
        dropBox.ondragleave = () => dropBox.classList.remove('drop-hover');
        dropBox.ondrop = e => {
            e.preventDefault();
            playSfx('drop.mp3');
            dropBox.classList.remove('drop-hover');
            const idx = parseInt(e.dataTransfer.getData('text/plain'));
            handleDrop(idx, opciones, correctaIdx, () => {
                localResponded = true;
                localAutoAdvanceTriggered = true;
                if (autoAdvanceTimeout) {
                    clearTimeout(autoAdvanceTimeout);
                    autoAdvanceTimeout = null;
                }
            });
        };
    }

    function handleDrop(idx, opciones, correctaIdx, onResponded) {
        const fallArea = document.getElementById('fall-area');
        const dropBox = document.getElementById('drop-box');
        const fb = document.getElementById('j2-feedback');
        const palabra = opciones[idx];
        // Desactivar drag de todas
        const allWords = fallArea.querySelectorAll('.fall-word');
        allWords.forEach(fw => { fw.setAttribute('draggable', 'false'); fw.classList.add('fall-inactiva'); });
        // Limpiar todos los timeouts de caída y auto avance
        if (typeof window.fallTimeouts !== 'undefined') {
            window.fallTimeouts.forEach(t => clearTimeout(t));
            window.fallTimeouts = [];
        }
        if (typeof window.autoAdvanceTimeout !== 'undefined' && window.autoAdvanceTimeout) {
            clearTimeout(window.autoAdvanceTimeout);
            window.autoAdvanceTimeout = null;
        }
        // Evitar doble avance si ya se respondió
        if (typeof onResponded === 'function') onResponded();
        if (palabra.correcta) {
            playSfx('correct.mp3');
            // Correcta: brilla, reproduce audio, Pixel mensaje
            const w = allWords[idx];
            w.classList.add('fall-correcta');
            // Buscar audio correcto
            const audioObj = rondas[current].audio.find(a => a.palabra === palabra.texto);
            if (audioObj) {
                const audio = new Audio(audioObj.ruta);
                audio.play();
            }
            fb.textContent = '¡Muy bien! Tu oído está entrenándose.';
            fb.className = 'j2-feedback correcto';
            try { Pet.setHappy(); Pet.speak('Muy bien. Tu oído está entrenándose.'); } catch (e) { }
            aciertos++;
            setTimeout(() => { handleDrop.responded = false; nextRonda(); }, 1600);
        } else {
            playSfx('wrong.mp3');
            // Incorrecta: desvanece, Pixel ánimo
            const w = allWords[idx];
            w.style.transition = 'opacity 0.7s, transform 0.7s';
            w.style.opacity = '0';
            w.style.transform = 'scale(0.7) rotate(-18deg)';
            fb.textContent = '¡Sigue intentando!';
            fb.className = 'j2-feedback incorrecto';
            try { Pet.setSad(); Pet.speak('No te preocupes, sigue intentando.'); } catch (e) { }
            setTimeout(() => { handleDrop.responded = false; nextRonda(); }, 2000);
        }
    }

    function nextRonda() {
        current++;
        if (current < rondas.length) {
            showJuego();
        } else {
            // Guardar progreso y redirigir a resultados.html
            try {
                addLevelCompletion('juego2', 'nivel-intermedio');
            } catch (e) { }
            let total = 0;
            try {
                const STORAGE_KEY = 'dixly_progress_v1';
                let p = localStorage.getItem(STORAGE_KEY);
                p = p ? JSON.parse(p) : { perGame: {}, total: 0 };
                total = p.total || 0;
            } catch (e) { }
            const intentos = rondas.length;
            window.location.href = `../resultados.html?game=juego2&level=nivel-intermedio&aciertos=${aciertos}&intentos=${intentos}&score=${aciertos}&total=${total}`;
        }
    }

    function showResultados() {
        const main = document.getElementById('main-container');
        main.innerHTML = `
      <div class="result-card" style="max-width:420px; margin:3rem auto; padding:1.5rem; border-radius:12px; box-shadow:var(--sombra-media); background:var(--color-blanco); text-align:center">
        <h2>¡Nivel completado!</h2>
        <p>Palabras restauradas: <strong>${aciertos} / ${rondas.length}</strong></p>
        <button id="btn-finish" class="btn btn-primary">Ver resultados</button>
      </div>
    `;
        setTimeout(() => { try { Pet.setHappy(); Pet.speak('¡Has completado el nivel intermedio!'); } catch (e) { } }, 400);
        document.getElementById('btn-finish').onclick = () => {
            window.location.href = '../resultados.html?game=juego2&level=nivel-intermedio&score=' + aciertos;
        };
    }

    async function init() {
        await loadRondas();
        showInstrucciones();
    }

    return { init };
})();

export default Game2Nivel2;
