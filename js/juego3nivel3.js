// --- SONIDOS DEL JUEGO ---
const sRuleta = new Audio('../../assets/sonidos/ruleta.mp3');
sRuleta.preload = 'auto';
const sAparecer = new Audio('../../assets/sonidos/aparecer.mp3');
sAparecer.preload = 'auto';
const sCorrect = new Audio('../../assets/sonidos/correct.mp3');
sCorrect.preload = 'auto';
const sWrong = new Audio('../../assets/sonidos/wrong.mp3');
sWrong.preload = 'auto';
import { loadJSON } from './util.js';
import Pet from './pet.js';

const Juego3Nivel3 = (() => {
  function showInstrucciones() {
    const main = document.getElementById('main-container');
    main.innerHTML = `
      <div class="instructions-overlay">
        <div class="instructions-card">
          <h2>Ruleta léxica</h2>
          
          <p>Gira la ruleta y selecciona la imagen que corresponde a la palabra que salga. ¡Mucha suerte!</p>
          <button id="start-btn" class="btn btn-primary">Empezar</button>
        </div>
      </div>
    `;
    try { Pet.init(); Pet.setIdle(); Pet.hideDialog && Pet.hideDialog(); } catch (e) { }
    document.getElementById('start-btn').onclick = () => {
      showRuleta();
    };
  }


  let rondaActual = 0;
  let palabrasDisponibles = [];
  let palabrasUsadas = [];
  let aciertos = 0;
  // Solo usar imágenes que existen en assets/imagenes/juego3
  let distractoresDB = {
    "objetos": [
      { id: "clavo", imagen: "../../assets/imagenes/juego3/clavo.jpg", texto: "clavo" },
      { id: "cofre", imagen: "../../assets/imagenes/juego3/cofre.jpg", texto: "cofre" },
      { id: "escalera", imagen: "../../assets/imagenes/juego3/escalera.jpg", texto: "escalera" },
      { id: "jarro", imagen: "../../assets/imagenes/juego3/jarro.jpg", texto: "jarro" },
      { id: "plato", imagen: "../../assets/imagenes/juego3/plato.jpg", texto: "plato" },
      { id: "puerta", imagen: "../../assets/imagenes/juego3/puerta.jpg", texto: "puerta" },
      { id: "reloj", imagen: "../../assets/imagenes/juego3/reloj.jpg", texto: "reloj" },
      { id: "teclado", imagen: "../../assets/imagenes/juego3/teclado.jpg", texto: "teclado" },
      { id: "ventana", imagen: "../../assets/imagenes/juego3/ventana.jpg", texto: "ventana" }
    ],
    "mar": [
      { id: "ancla", imagen: "../../assets/imagenes/juego3/ancla.jpeg", texto: "ancla" },
      { id: "barco", imagen: "../../assets/imagenes/juego3/barco.jpg", texto: "barco" }
    ],
    "naturaleza": [
      { id: "arbol", imagen: "../../assets/imagenes/juego3/arbol.jpg", texto: "arbol" },
      { id: "bosque", imagen: "../../assets/imagenes/juego3/bosque.jpg", texto: "bosque" }
    ],
    "escritura": [
      { id: "puente", imagen: "../../assets/imagenes/juego3/puente.jpg", texto: "puente" }
    ],
    "montaña": [
      { id: "camino", imagen: "../../assets/imagenes/juego3/camino.jpg", texto: "camino" },
      { id: "sombrero", imagen: "../../assets/imagenes/juego3/sombrero.jpg", texto: "sombrero" }
    ],
    "animales": [
      { id: "cebra", imagen: "../../assets/imagenes/juego3/cebra.jpeg", texto: "cebra" },
      { id: "gorra", imagen: "../../assets/imagenes/juego3/gorra.jpg", texto: "gorra" }
    ],
    "ciudad": [
      { id: "puente", imagen: "../../assets/imagenes/juego3/puente.jpg", texto: "puente" },
      { id: "ventana", imagen: "../../assets/imagenes/juego3/ventana.jpg", texto: "ventana" }
    ]
  };


  async function showRuleta() {
    rondaActual = 0;
    aciertos = 0;
    palabrasUsadas = [];
    const data = await fetch('../../js/data/juego3/juego3nivel3.json').then(r => r.json());
    // Mezclar aleatoriamente las oraciones para el juego
    palabrasDisponibles = [...data].sort(() => Math.random() - 0.5);
    mostrarRuleta();
  }

  function mostrarRuleta() {
    if (rondaActual >= 8 || palabrasDisponibles.length === 0) {
      mostrarResultados();
      return;
    }
    // Mostrar la ruleta con las palabras/oraciones disponibles
    const main = document.getElementById('main-container');
    // Usar el campo emoji del JSON
    let palabrasRuleta = palabrasDisponibles.map((obj, idx) => ({
      id: idx,
      emoji: obj.emoji || '❓',
      texto: obj.oracion
    }));
    const colors = [
      ['#ff1744','#ff8a65'], ['#f50057','#ff80ab'], ['#d500f9','#b388ff'], ['#2979ff','#00e5ff'],
      ['#00e676','#76ff03'], ['#ffd600','#ffea00'], ['#ff9100','#ff3d00'], ['#00bfae','#1de9b6'],
      ['#c51162','#f06292'], ['#64dd17','#aeea00'], ['#304ffe','#536dfe'], ['#ff6d00','#ffab00']
    ];
    const angle = 360 / palabrasRuleta.length;
    let svgSlices = '';
    let svgTexts = '';
    let svgSeparators = '';
    for(let i=0; i<palabrasRuleta.length; i++){
      const startAngle = i * angle;
      const endAngle = (i+1) * angle;
      const largeArc = angle > 180 ? 1 : 0;
      const x1 = 150 + 140 * Math.cos(Math.PI * (startAngle-90)/180);
      const y1 = 150 + 140 * Math.sin(Math.PI * (startAngle-90)/180);
      const x2 = 150 + 140 * Math.cos(Math.PI * (endAngle-90)/180);
      const y2 = 150 + 140 * Math.sin(Math.PI * (endAngle-90)/180);
      const color1 = colors[i%colors.length][0];
      const color2 = colors[i%colors.length][1];
      const gradId = `grad${i}`;
      svgSlices += `
        <defs>
          <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%"> 
            <stop offset="0%" stop-color="${color1}" />
            <stop offset="100%" stop-color="${color2}" />
          </linearGradient>
        </defs>
        <path d="M150,150 L${x1},${y1} A140,140 0 ${largeArc},1 ${x2},${y2} Z" fill="url(#${gradId})" />`;
      // Separador blanco
      const sepX = 150 + 140 * Math.cos(Math.PI * (endAngle-90)/180);
      const sepY = 150 + 140 * Math.sin(Math.PI * (endAngle-90)/180);
      svgSeparators += `<line x1="150" y1="150" x2="${sepX}" y2="${sepY}" stroke="#fff" stroke-width="4" />`;
      // Texto vertical hacia el centro
      const tx = 150 + 90 * Math.cos(Math.PI * ((startAngle+endAngle)/2-90)/180);
      const ty = 150 + 90 * Math.sin(Math.PI * ((startAngle+endAngle)/2-90)/180);
      const angleText = ((startAngle+endAngle)/2) + 90;
       svgTexts += `<text x="${tx}" y="${ty}" text-anchor="middle" alignment-baseline="middle" font-size="32" font-family="Lexend,Arial,sans-serif" fill="#222" transform="rotate(${angleText},${tx},${ty})">${palabrasRuleta[i].emoji}</text>`;
    }
    let salirBtnHtml = `<button id=\"btn-salir-j3\" style=\"position:absolute;top:18px;right:18px;z-index:2000;font-size:1.1rem;padding:0.5rem 1.4rem;border-radius:1.5rem;border:none;background:#f44336;color:white;cursor:pointer;\">Salir<\/button>`;
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
            <circle cx=\"150\" cy=\"150\" r=\"38\" fill=\"#f5f5f5\" stroke=\"#bbb\" stroke-width=\"3\" />
            <circle cx=\"150\" cy=\"150\" r=\"18\" fill=\"#fff\" stroke=\"#888\" stroke-width=\"2\" />
          </svg>
          <div style=\"position:absolute;top:-32px;left:0;width:100%;height:60px;pointer-events:none;display:flex;justify-content:center;align-items:flex-start;z-index:2;\">
            <svg width=\"60\" height=\"60\" style=\"filter:drop-shadow(0 2px 6px #0005);transform:rotate(180deg);\"><polygon points=\"30,0 50,32 10,32\" fill=\"#e74c3c\" stroke=\"#b71c1c\" stroke-width=\"3\" /></svg>
          </div>
        </div>
        <button id=\"btn-girar\" class=\"btn btn-primary\">Girar ruleta</button>
      </div>
      <div id=\"palabra-animada\" style=\"position:absolute;left:0;right:0;top:40px;text-align:center;z-index:10;pointer-events:none;opacity:0;transition:all .7s cubic-bezier(.7,.2,.3,1);font-size:2rem;font-weight:700;letter-spacing:2px;color:#234;\"></div>
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
      } catch (e) {}
      // Simular giro y elegir la oración/ronda
      const idx = rondaActual;
      const grados = 360*3 + (360/palabrasRuleta.length)*idx + (360/palabrasRuleta.length)/2;
      const svg = document.getElementById('ruleta-svg');
      svg.style.transition = 'transform 3s cubic-bezier(.17,.67,.83,.67)';
      svg.style.transform = `rotate(-${grados}deg)`;
      setTimeout(() => {
        svg.style.transition = 'transform 0.25s cubic-bezier(.5,1.7,.7,1)';
        svg.style.transform = `rotate(-${grados + 8}deg)`;
        setTimeout(() => {
          svg.style.transition = 'transform 0.18s cubic-bezier(.5,1.7,.7,1)';
          svg.style.transform = `rotate(-${grados}deg)`;
          setTimeout(() => {
              mostrarEmojiYOracion(idx);
          }, 200);
        }, 250);
      }, 3200);
    };
  }

  function mostrarRonda() {
    // Seleccionar el objeto actual
    const obj = palabrasDisponibles[rondaActual];
    // Tomar las dos imágenes clave
    let opciones = [];
    obj.imagenesClave.forEach(img => {
      opciones.push({
        id: img.id,
        correcta: img.correcta,
        imagen: img.imagen,
        texto: img.id.replace(/_/g, ' ')
      });
    });
    // Buscar distractores
    let distractoresCat = distractoresDB[obj.categoriaDistractores] || [];
    let clavesIds = obj.imagenesClave.map(i => i.id);
    let distractoresValidos = distractoresCat.filter(d => !clavesIds.includes(d.id) && d.texto !== obj.sentidoCorrecto);
    let distractores = [];
    let pool = [...distractoresValidos];
    for(let i=0; i<2 && pool.length>0; i++) {
      let idx = Math.floor(Math.random()*pool.length);
      distractores.push(pool[idx]);
      pool.splice(idx,1);
    }
    opciones = opciones.concat(distractores);
    opciones = opciones.sort(() => Math.random()-0.5);
    mostrarGrupo(obj, opciones);
      // El incremento de rondaActual ya se hace en mostrarRuleta/mostrarEmojiYOracion
    }

    function mostrarEmojiYOracion(idx) {
      // Mostrar emoji arriba de la ruleta
      const main = document.getElementById('main-container');
      const obj = palabrasDisponibles[idx];
      const emoji = obj.emoji || '❓';
      let revealDiv = document.createElement('div');
      revealDiv.id = 'emoji-reveal';
      revealDiv.style = 'position:absolute;top:20px;left:0;right:0;text-align:center;font-size:3rem;z-index:20;transition:all .7s cubic-bezier(.7,.2,.3,1);opacity:1;';
      revealDiv.innerHTML = `<span style="font-size:2.2rem;">${emoji}</span>`;
      main.appendChild(revealDiv);
      // Sonido de aparición al mostrar el emoji
      try { sAparecer.currentTime = 0; sAparecer.play(); } catch (e) {}
      // Efecto de movimiento para revelar la oración
      setTimeout(() => {
        revealDiv.style.transform = 'translateY(20px) scale(1.1)';
        revealDiv.style.opacity = '1';
        setTimeout(() => {
          // Mostrar solo la oración, ocultando el emoji
          revealDiv.innerHTML = `<span style="font-size:1.3rem;animation:fadein .7s;">${obj.oracion}</span>`;
          revealDiv.style.transform = 'translateY(0px) scale(1)';
          // Esperar 1.5s y mostrar imágenes
          setTimeout(() => {
            if (revealDiv) revealDiv.remove();
            mostrarRonda(idx);
          }, 1500);
        }, 700);
      }, 400);
    }

    function mostrarRonda(idx) {
      // Seleccionar el objeto actual
      const obj = palabrasDisponibles[idx];
      // Tomar las dos imágenes clave
      let opciones = [];
      obj.imagenesClave.forEach(img => {
        opciones.push({
          id: img.id,
          correcta: img.correcta,
          imagen: img.imagen,
          texto: img.id.replace(/_/g, ' ')
        });
      });
      // Buscar distractores
      let distractoresCat = distractoresDB[obj.categoriaDistractores] || [];
      let clavesIds = obj.imagenesClave.map(i => i.id);
      let distractoresValidos = distractoresCat.filter(d => !clavesIds.includes(d.id) && d.texto !== obj.sentidoCorrecto);
      let distractores = [];
      let pool = [...distractoresValidos];
      for(let i=0; i<2 && pool.length>0; i++) {
        let dIdx = Math.floor(Math.random()*pool.length);
        distractores.push(pool[dIdx]);
        pool.splice(dIdx,1);
      }
      opciones = opciones.concat(distractores);
      opciones = opciones.sort(() => Math.random()-0.5);
      mostrarGrupo(obj, opciones);
      rondaActual++;
    }

  function animarPalabraSeleccionada(palabraObj) {
    const animada = document.getElementById('palabra-animada');
    animada.textContent = palabraObj.texto;
    animada.style.opacity = '1';
    animada.style.transform = 'scale(1.2) translateY(-40px)';
    // Sonido de aparición
    try { sAparecer.currentTime = 0; sAparecer.play(); } catch (e) {}
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

  function mostrarGrupo(obj, opciones) {
    const main = document.getElementById('main-container');
    main.innerHTML = `
      <div class="palabra-seleccionada" style="text-align:center;margin-bottom:2rem;">
        <p style="font-size:1.2rem;color:#555;margin-top:1rem;">${obj.oracion}</p>
      </div>
      <div class="imagenes-opciones" style="display:flex;flex-wrap:wrap;gap:2rem;justify-content:center;">
        ${opciones.map((op,i) => `<div class="img-opcion" data-palabra="${op.id}" style="cursor:pointer;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px #0002;transition:box-shadow .2s;"><img src="${op.imagen}" alt="${op.texto}" style="width:140px;height:140px;object-fit:contain;display:block;"></div>`).join('')}
      </div>
      <div id="feedback-j3" style="text-align:center;font-size:1.3rem;margin-top:2.5rem;min-height:2.5rem;"></div>
    `;
    document.querySelectorAll('.img-opcion').forEach(div => {
      div.onclick = () => seleccionarImagen(div, obj);
    });
  }

  function seleccionarImagen(div, obj) {
    const seleccionada = div.getAttribute('data-palabra');
    const feedback = document.getElementById('feedback-j3');
    const opciones = document.querySelectorAll('.img-opcion');
    opciones.forEach(d => d.onclick = null); // Desactivar más clics
    // Buscar la imagen clave correcta
    const correctaId = obj.imagenesClave.find(i => i.correcta).id;
    if (seleccionada === correctaId) {
      try { sCorrect.currentTime = 0; sCorrect.play(); } catch (e) {}
      div.style.boxShadow = '0 0 0 4px #2ecc40';
      feedback.textContent = '¡Correcto!';
      feedback.style.color = '#2ecc40';
      aciertos++;
    } else {
      try { sWrong.currentTime = 0; sWrong.play(); } catch (e) {}
      div.style.boxShadow = '0 0 0 4px #e74c3c';
      feedback.textContent = 'Incorrecto, intenta de nuevo';
      feedback.style.color = '#e74c3c';
      // Marcar la correcta
      opciones.forEach(d => {
        if (d.getAttribute('data-palabra') === correctaId) {
          d.style.boxShadow = '0 0 0 4px #2ecc40';
        }
      });
    }
    rondaActual++;
    setTimeout(() => {
      mostrarRuleta();
    }, 1800);
  }

  function mostrarResultados() {
    window.location.href = '../../vistas/resultados.html?game=juego3&level=nivel3&score=' + aciertos;
  }

  async function init() {
    showInstrucciones();
  }

  return { init };
  })();

  export default Juego3Nivel3;
