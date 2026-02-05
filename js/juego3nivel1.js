// --- SONIDOS DEL JUEGO ---
const sRuleta = new Audio('../../assets/sonidos/ruleta.mp3');
sRuleta.preload = 'auto';
const sAparecer = new Audio('../../assets/sonidos/aparecer.mp3');
sAparecer.preload = 'auto';
const sCorrect = new Audio('../../assets/sonidos/correct.mp3');
sCorrect.preload = 'auto';
const sWrong = new Audio('../../assets/sonidos/wrong.mp3');
sWrong.preload = 'auto';
import { loadJSON, addLevelCompletion } from './util.js';
import Pet from './pet.js';

const Juego3Nivel1 = (() => {
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
      window.location.href = '../juego3/index.html';
    });
    // Contenedor relativo para el botón X
    const cardWrapper = document.createElement('div');
    cardWrapper.style.position = 'relative';
    cardWrapper.appendChild(closeBtn);
    cardWrapper.appendChild(card);

    card.innerHTML = `
            <h2 style="margin-bottom: 1rem;">Giro y Reconoce</h2>
            <p >Las palabras no siempre esperan.<br>
              Algunas aparecen y desaparecen en segundos.<br><br>
              Haz girar la rueda.<br>
              Cuando se detenga, aparecerá una palabra.<br><br>
              Observa las imágenes con calma.<br>
              Solo una representa correctamente esa palabra.<br><br>
              Elige sin apresurarte, pero sin dudar demasiado.</p>
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
      showRuleta();
    };
    // CSS para pixel-grande
    const styleId = 'pixel-grande-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
  }


  let rondaActual = 0;
  let palabrasDisponibles = [];
  let palabrasUsadas = [];
  let aciertos = 0;


  async function showRuleta() {
    rondaActual = 0;
    aciertos = 0;
    palabrasUsadas = [];
    const data = await fetch('../../js/data/juego3/juego3nivel1.json').then(r => r.json());
    console.log(data);
    palabrasDisponibles = [...data];
    siguienteRonda();
  }

  function siguienteRonda() {
    if (rondaActual >= 7 || palabrasDisponibles.length === 0) {
      mostrarResultados();
      return;
    }
    const main = document.getElementById('main-container');
    // Botón salir arriba a la derecha
    let salirBtnHtml = `<button id="btn-salir-j3" class="close-btn">X</button>`;
    // Mostrar siempre las 12 palabras en la ruleta, usadas en gris
    let palabrasRuleta = [];
    if (palabrasDisponibles.length + palabrasUsadas.length < 12) {
      // Si por algún motivo faltan, no repetir
      palabrasRuleta = [...palabrasDisponibles, ...palabrasUsadas];
    } else {
      // Obtener el orden original del JSON usando fetch síncrono (ya cargado en showRuleta)
      if (!window._palabrasOriginalesJuego3) {
        // Si no está en memoria, cargarlo
        window._palabrasOriginalesJuego3 = palabrasDisponibles.concat(palabrasUsadas);
      }
      palabrasRuleta = window._palabrasOriginalesJuego3;
    }
    // Paleta de colores vivos y divertidos
    const colors = [
      ['#ff1744', '#ff8a65'], // rojo vivo a naranja
      ['#f50057', '#ff80ab'], // rosa fuerte a rosa claro
      ['#d500f9', '#b388ff'], // violeta a lila
      ['#2979ff', '#00e5ff'], // azul fuerte a celeste
      ['#00e676', '#76ff03'], // verde neón a verde lima
      ['#ffd600', '#ffea00'], // amarillo intenso
      ['#ff9100', '#ff3d00'], // naranja a rojo
      ['#00bfae', '#1de9b6'], // turquesa
      ['#c51162', '#f06292'], // magenta
      ['#64dd17', '#aeea00'], // verde limón
      ['#304ffe', '#536dfe'], // azul eléctrico
      ['#ff6d00', '#ffab00']  // naranja fuerte
    ];
    const angle = 360 / palabrasRuleta.length;
    let svgSlices = '';
    let svgTexts = '';
    let svgSeparators = '';
    for (let i = 0; i < palabrasRuleta.length; i++) {
      const startAngle = i * angle;
      const endAngle = (i + 1) * angle;
      const largeArc = angle > 180 ? 1 : 0;
      const x1 = 150 + 140 * Math.cos(Math.PI * (startAngle - 90) / 180);
      const y1 = 150 + 140 * Math.sin(Math.PI * (startAngle - 90) / 180);
      const x2 = 150 + 140 * Math.cos(Math.PI * (endAngle - 90) / 180);
      const y2 = 150 + 140 * Math.sin(Math.PI * (endAngle - 90) / 180);
      const isUsed = palabrasUsadas.some(p => p.id === palabrasRuleta[i].id);
      // Gradiente lineal para cada segmento
      const color1 = isUsed ? '#bbb' : colors[i % colors.length][0];
      const color2 = isUsed ? '#bbb' : colors[i % colors.length][1];
      const gradId = `grad${i}`;
      svgSlices += `
        <defs>
          <linearGradient id=\"${gradId}\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\"> 
            <stop offset=\"0%\" stop-color=\"${color1}\" />
            <stop offset=\"100%\" stop-color=\"${color2}\" />
          </linearGradient>
        </defs>
        <path d=\"M150,150 L${x1},${y1} A140,140 0 ${largeArc},1 ${x2},${y2} Z\" fill=\"url(#${gradId})\" />`;
      // Separador blanco
      const sepX = 150 + 140 * Math.cos(Math.PI * (endAngle - 90) / 180);
      const sepY = 150 + 140 * Math.sin(Math.PI * (endAngle - 90) / 180);
      svgSeparators += `<line x1=\"150\" y1=\"150\" x2=\"${sepX}\" y2=\"${sepY}\" stroke=\"#fff\" stroke-width=\"4\" />`;
      // Texto vertical hacia el centro
      const tx = 150 + 90 * Math.cos(Math.PI * ((startAngle + endAngle) / 2 - 90) / 180);
      const ty = 150 + 90 * Math.sin(Math.PI * ((startAngle + endAngle) / 2 - 90) / 180);
      const angleText = ((startAngle + endAngle) / 2) + 90;
      svgTexts += `<text x=\"${tx}\" y=\"${ty}\" text-anchor=\"middle\" alignment-baseline=\"middle\" font-size=\"18\" font-family=\"Lexend,Arial,sans-serif\" fill=\"${isUsed ? '#888' : '#222'}\" transform=\"rotate(${angleText},${tx},${ty})\">${palabrasRuleta[i].texto}</text>`;
    }
    main.innerHTML = `
      ${salirBtnHtml}
      <div class=\"ruleta-container\" style=\"display:flex;flex-direction:column;align-items:center;gap:2rem;\">
        <div style=\"width:340px;height:340px;position:relative;\">
          <svg id=\"ruleta-svg\" width=\"320\" height=\"320\" viewBox=\"0 0 300 300\" style=\"filter:drop-shadow(0 6px 18px #0003);transform:rotate(0deg);transition:transform 3s cubic-bezier(.17,.67,.83,.67);\">
            <circle cx=\"150\" cy=\"150\" r=\"148\" fill=\"#fff\" stroke=\"#444\" stroke-width=\"6\" />
            ${svgSlices}
            ${svgSeparators}
            ${svgTexts}
            <circle cx=\"150\" cy=\"150\" r=\"140\" fill=\"none\" stroke=\"#333\" stroke-width=\"2\"/>
            <circle cx=\"150\" cy=\"150\" r=\"38\" fill=\"#f5f5f5\" stroke=\"#bbb\" stroke-width=\"3\" /> <!-- centro decorativo -->
            <circle cx=\"150\" cy=\"150\" r=\"18\" fill=\"#fff\" stroke=\"#888\" stroke-width=\"2\" /> <!-- centro pequeño -->
          </svg>
          <div style=\"position:absolute;top:-32px;left:0;width:100%;height:60px;pointer-events:none;display:flex;justify-content:center;align-items:flex-start;z-index:2;\">
            <svg width=\"60\" height=\"60\" style=\"filter:drop-shadow(0 2px 6px #0005);transform:rotate(180deg);\"><polygon points=\"30,0 50,32 10,32\" fill=\"#e74c3c\" stroke=\"#b71c1c\" stroke-width=\"3\" /></svg>
          </div>
        </div>
        <button id=\"btn-girar\" class=\"boton-azul\">Empezar a girar</button>
      </div>
      <div id=\"palabra-animada\" style=\"position:absolute;left:0;right:0;top:40px;text-align:center;z-index:10;pointer-events:none;opacity:0;transition:all .7s cubic-bezier(.7,.2,.3,1);font-size:3.2rem;font-weight:700;letter-spacing:2px;color:#234;\"></div>
    `;
    // Acción del botón salir
    const btnSalir = document.getElementById('btn-salir-j3');
    if (btnSalir) {
      btnSalir.onclick = () => {
        window.location.href = 'index.html';
      };
    }
    const btnGirar = document.getElementById('btn-girar');
    let girado = false;
    btnGirar.onclick = () => {
      if (girado) return;
      girado = true;
      btnGirar.disabled = true;
      try {
        sRuleta.currentTime = 0;
        sRuleta.play();
        setTimeout(() => { sRuleta.pause(); sRuleta.currentTime = 0; }, 3200);
      } catch (e) { }
      girarRuleta(palabrasRuleta);
    };
  }

  function girarRuleta(palabrasRuleta) {
    const svg = document.getElementById('ruleta-svg');
    const n = palabrasRuleta.length;
    // Solo seleccionar palabras que no hayan salido
    const candidatas = palabrasRuleta.filter(p => !palabrasUsadas.some(u => u.id === p.id));
    const seleccion = Math.floor(Math.random() * candidatas.length);
    const palabraSeleccionada = candidatas[seleccion];
    const idx = palabrasRuleta.findIndex(p => p.id === palabraSeleccionada.id);
    const grados = 360 * 3 + (360 / n) * idx + (360 / n) / 2; // 3 vueltas + ángulo
    svg.style.transition = 'transform 3s cubic-bezier(.17,.67,.83,.67)';
    svg.style.transform = `rotate(-${grados}deg)`;
    // El sonido ahora se reproduce en el click del botón
    setTimeout(() => {
      // Rebote al detenerse
      svg.style.transition = 'transform 0.25s cubic-bezier(.5,1.7,.7,1)';
      svg.style.transform = `rotate(-${grados + 8}deg)`;
      setTimeout(() => {
        svg.style.transition = 'transform 0.18s cubic-bezier(.5,1.7,.7,1)';
        svg.style.transform = `rotate(-${grados}deg)`;
        setTimeout(() => animarPalabraSeleccionada(palabraSeleccionada), 200);
      }, 250);
    }, 3200);
  }

  function animarPalabraSeleccionada(palabraObj) {
    const animada = document.getElementById('palabra-animada');
    animada.textContent = palabraObj.texto;
    animada.style.opacity = '1';
    animada.style.transform = 'scale(1.2) translateY(-40px)';
    // Sonido de aparición
    try { sAparecer.currentTime = 0; sAparecer.play(); } catch (e) { }
    // Animar hacia arriba de la ruleta (por encima, top fijo)
    setTimeout(() => {
      animada.style.transform = 'scale(1) translateY(-10px)';
      animada.style.opacity = '1';
    }, 900);
    setTimeout(() => {
      animada.style.opacity = '0';
      mostrarPalabraSeleccionada(palabraObj);
    }, 1800);
  }

  async function mostrarPalabraSeleccionada(palabraObj) {
    const main = document.getElementById('main-container');
    const data = await fetch('../../js/data/juego3/juego3nivel1.json').then(r => r.json());
    const palabras = data;
    // Seleccionar distractores
    // 1 de la misma categoría (que no sea la palabra objetivo)
    let mismo = palabras.filter(p => p.categoria === palabraObj.categoria && p.id !== palabraObj.id);
    let distractorMismo = mismo.length ? mismo[Math.floor(Math.random() * mismo.length)] : null;
    // 1 de categoría cercana
    const cercanas = {
      'lugar': ['objeto_entorno', 'transporte'],
      'objeto_entorno': ['lugar', 'objeto_personal'],
      'objeto_personal': ['objeto_entorno', 'transporte'],
      'transporte': ['lugar', 'objeto_personal']
    };
    let catCercanas = cercanas[palabraObj.categoria] || [];
    let cerca = palabras.filter(p => catCercanas.includes(p.categoria) && p.id !== palabraObj.id);
    let distractorCerca = cerca.length ? cerca[Math.floor(Math.random() * cerca.length)] : null;
    // 1 de categoría lejana (no igual ni cercana)
    let lejanas = palabras.filter(p => p.categoria !== palabraObj.categoria && !catCercanas.includes(p.categoria) && p.id !== palabraObj.id);
    let distractorLejana = lejanas.length ? lejanas[Math.floor(Math.random() * lejanas.length)] : null;
    // Armar opciones
    let opciones = [palabraObj];
    if (distractorMismo) opciones.push(distractorMismo);
    if (distractorCerca) opciones.push(distractorCerca);
    if (distractorLejana) opciones.push(distractorLejana);
    // Si faltan, rellenar con otros
    while (opciones.length < 4) {
      let extra = palabras.filter(p => !opciones.some(o => o.id === p.id));
      if (extra.length) opciones.push(extra[Math.floor(Math.random() * extra.length)]);
      else break;
    }
    opciones = opciones.sort(() => Math.random() - 0.5);
    main.innerHTML = `
      <div class="palabra-seleccionada" style="text-align:center;margin-bottom:2rem;">
        <h2 style="font-size:2.5rem;letter-spacing:2px;transition:all .7s cubic-bezier(.7,.2,.3,1);">${palabraObj.texto}</h2>
      </div>
      <div class="imagenes-opciones" style="display:grid;grid-template-columns:repeat(2, 1fr);gap:2rem;justify-items:center;align-items:center;max-width:340px;margin:0 auto;">
        ${opciones.map((op, i) => `<div class="img-opcion" data-palabra="${op.id}" style="cursor:pointer;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0002;transition:box-shadow .2s;"><img src="../../assets/imagenes/juego3/${op.imagen}" alt="${op.texto}" style="width:140px;height:140px;object-fit:contain;display:block;"></div>`).join('')}
      </div>
      <div id="feedback-j3" style="text-align:center;font-size:1.3rem;margin-top:2.5rem;min-height:2.5rem;"></div>
    `;
    document.querySelectorAll('.img-opcion').forEach(div => {
      div.onclick = () => seleccionarImagen(div, palabraObj.id);
    });
  }

  function seleccionarImagen(div, palabraId) {
    const seleccionada = div.getAttribute('data-palabra');
    const feedback = document.getElementById('feedback-j3');
    const opciones = document.querySelectorAll('.img-opcion');
    opciones.forEach(d => d.onclick = null); // Desactivar más clics
    if (seleccionada === palabraId) {
      try { sCorrect.currentTime = 0; sCorrect.play(); } catch (e) { }
      div.style.boxShadow = '0 0 0 4px #2ecc40';
      feedback.textContent = 'Bien hecho, es la imagen correcta';
      feedback.style.color = '#2ecc40';
      aciertos++;
      palabrasUsadas.push(palabrasDisponibles.find(p => p.id === palabraId));
      palabrasDisponibles = palabrasDisponibles.filter(p => p.id !== palabraId);
      rondaActual++;
      setTimeout(() => {
        siguienteRonda();
      }, 1800);
    } else {
      try { sWrong.currentTime = 0; sWrong.play(); } catch (e) { }
      div.style.boxShadow = '0 0 0 4px #e74c3c';
      feedback.textContent = 'Sigue intentándolo';
      feedback.style.color = '#e74c3c';
      // Marcar la correcta
      opciones.forEach(d => {
        if (d.getAttribute('data-palabra') === palabraId) {
          d.style.boxShadow = '0 0 0 4px #2ecc40';
        }
      });
      palabrasUsadas.push(palabrasDisponibles.find(p => p.id === palabraId));
      palabrasDisponibles = palabrasDisponibles.filter(p => p.id !== palabraId);
      rondaActual++;
      setTimeout(() => {
        siguienteRonda();
      }, 1800);
    }
  }

  function mostrarResultados() {
    try {
      addLevelCompletion('juego3', 'nivel-facil');
    } catch (e) { }
    let total = 0;
    let score = 0;
    try {
      const STORAGE_KEY = 'dixly_progress_v1';
      let p = localStorage.getItem(STORAGE_KEY);
      p = p ? JSON.parse(p) : { perGame: {}, total: 0 };
      total = p.total || 0;
      score = (p.perGame && p.perGame['juego3'] && p.perGame['juego3'].score) || 0;
    } catch (e) { }
    window.location.href = '../../vistas/resultados.html?game=juego3&level=nivel-facil&score=' + score + '&total=' + total + '&aciertos=' + aciertos;
    // const main = document.getElementById('main-container');
    // main.innerHTML = `
    //   <div class=\"result-card\" style=\"max-width:420px; margin:3rem auto; padding:1.5rem; border-radius:12px; box-shadow:var(--sombra-media); background:var(--color-blanco); text-align:center\">
    //     <h2>¡Juego completado!</h2>
    //     <p>¡Has terminado el nivel 1 de Ruleta léxica!</p>
    //     <button id=\"btn-finish\" class=\"btn btn-primary\">Ver resultados finales</button>
    //   </div>
    // `;
    // document.getElementById('btn-finish').onclick = () => {
    //   window.location.href = '../../vistas/resultados.html?game=juego3&level=nivel1&score=' + aciertos;
    // };
  }

  async function init() {
    showInstrucciones();
  }

  return { init };
})();

export default Juego3Nivel1;
