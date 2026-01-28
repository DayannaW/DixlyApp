// Mostrar texto grande 'Toca para reclamar' al cargar
window.addEventListener('DOMContentLoaded', () => {
        let claimText = document.createElement('div');
        claimText.id = 'claim-text';
        claimText.textContent = 'Toca para reclamar';
        claimText.style.position = 'fixed';
        claimText.style.width = '90%';
        claimText.style.top = '8%';
        claimText.style.left = '50%';
        claimText.style.transform = 'translateX(-50%)';
        claimText.style.fontSize = '2rem';
        claimText.style.fontWeight = 'bold';
        claimText.style.color = '#222';
        claimText.style.padding = '0.8rem';
        claimText.style.zIndex = '200';
        claimText.style.textAlign = 'center';
        claimText.style.letterSpacing = '0.04em';
        claimText.style.animation = 'floatY 2s ease-in-out infinite alternate';
        document.body.appendChild(claimText);

        // Agregar keyframes de animación flotante si no existen
        if (!document.getElementById('floatY-keyframes')) {
            const style = document.createElement('style');
            style.id = 'floatY-keyframes';
            // Reducir desplazamiento vertical de -22px a -10px
            style.innerHTML = `@keyframes floatY { 0% { transform: translateX(-50%) translateY(0); } 100% { transform: translateX(-50%) translateY(-7px); } }`;
            document.head.appendChild(style);
        }

    // Detectar click en el cofre para ocultar el texto
    const observer = new MutationObserver(() => {
        const cofre = document.querySelector('.cofre, #cofre, .cofre-anim, .cofre-animacion');
        if (cofre) {
            cofre.addEventListener('click', () => {
                claimText.style.display = 'none';
            }, { once: true });
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
});
// Este script gestiona la animación y el flujo de revelado de insignias
// Ahora como módulo ES6
import Pet from './pet.js';

window.Pet = Pet;
Pet.setAnimPath('../assets/animaciones/');
Pet.init();

Pet.setIdle();
// Pixel habla al abrir la pantalla de insignias
setTimeout(() => { try { Pet.speak('Veamos qué hay dentro!'); } catch(e){} }, 400);

// Simulación: obtener insignias desde la URL (badge=...&badge=...)
function getBadgesFromURL() {
    const params = new URLSearchParams(window.location.search);
    const badges = [];
    for (const [key, value] of params.entries()) {
        if (key === 'badge') badges.push(value);
    }
    return badges;
}

// Cargar info de insignias desde el JSON
async function loadBadgeInfo(badgeIds) {
    const resp = await fetch('../js/data/badges.json');
    const allBadges = await resp.json();
    return badgeIds.map(id => ({
        id,
        img: `../imagenes/insignias/${id}.png`, // imagen por convención
        title: allBadges[id]?.name || id,
        desc: allBadges[id]?.desc || ''
    }));
}


const cofre = document.getElementById('cofre');
const card = document.getElementById('insignia-card');
const fila = document.getElementById('insignias-fila');
let badges = [];
let current = 0;
let miniInsignias = [];
let cofreAnimado = false;


function showBadge(index) {
    if (!badges[index]) return;
    const badge = badges[index];
    // Animar cofre al iniciar la primera insignia
    if (!cofreAnimado) {
        console.log("animar cofre");
        cofre.classList.add('mini', 'bajada');
        cofreAnimado = true;
    }
    card.innerHTML = `
        <img class="insignia-img" src="${badge.img}" alt="${badge.title}">
        <div class="insignia-title">${badge.title}</div>
        <button class="btn-recoger" id="btn-recoger">Recoger</button>
    `;
    card.style.display = 'block';
    var speaking = true;
    let pixelDialogTimeout = null;
    setTimeout(() => {
        card.classList.add('visible');
        function speakLoop() {
            if (!speaking) return;
            if (badge.desc) {
                try {
                    Pet.speak(badge.desc);
                    // Guardar el timeout de diálogo para poder cancelarlo
                    const dur = (typeof Pet.calcSpeakDuration === 'function') ? Pet.calcSpeakDuration(badge.desc) : 2000;
                    pixelDialogTimeout = setTimeout(speakLoop, dur + 300);
                } catch(e) {
                    pixelDialogTimeout = setTimeout(speakLoop, 2000);
                }
            }
        }
        speaking = true;
        speakLoop();
    }, 100);
    document.getElementById('btn-recoger').onclick = () => {
        speaking = false;
        if (pixelDialogTimeout) clearTimeout(pixelDialogTimeout);
        // Ocultar el cuadro de diálogo de Pixel inmediatamente
        const dialog = document.getElementById('pixel-dialog');
        if (dialog) dialog.classList.remove('visible');
        card.classList.remove('visible');
        setTimeout(() => {
            card.style.display = 'none';
            // Crear tarjeta miniatura con giro
            const miniCard = document.createElement('div');
            miniCard.className = 'insignia-card mini';
            miniCard.innerHTML = `
                <div class="insignia-inner">
                    <div class="insignia-front">
                        <img class="insignia-img" src="${badge.img}" alt="${badge.title}">
                        <div class="insignia-title">${badge.title}</div>
                    </div>
                </div>
            `;
            // Lógica de giro al hacer clic
            miniCard.onclick = function() {
                miniCard.classList.toggle('flipped');
            };
            // Calcular desplazamiento horizontal para animación inclinada
            const total = badges.length;
            const center = (total - 1) / 2;
            let offset = (current - center) * 180;
            miniCard.style.setProperty('--card-x-inicial', offset + 'px');
            miniCard.style.setProperty('--card-x-final', '0px');
            fila.appendChild(miniCard);
            miniInsignias.push(miniCard);
            miniCard.style.transform = 'translateY(-60px) scale(1.1)';
            miniCard.style.opacity = '0';
            setTimeout(() => {
                miniCard.style.transform = 'translateY(0) scale(1)';
                miniCard.style.opacity = '1';
            }, 100);
            current++;
            if (badges[current]) {
                setTimeout(() => showBadge(current), 600);
            } else {
                setTimeout(() => {
                    cofre.classList.remove('bajada');
                    cofre.classList.add('subida');
                    setTimeout(() => {
                        miniInsignias.forEach((el, i) => {
                            setTimeout(() => {
                                el.classList.add('entra-cofre');
                            }, i * 200);
                        });
                        setTimeout(() => {
                            fila.style.minHeight = '0px';
                            fila.innerHTML = '';
                            card.innerHTML = '<div style="font-size:1.2rem;padding:2rem;">¡Has recogido todas tus insignias!</div>';
                            card.style.display = 'block';
                            card.classList.add('visible');
                            document.getElementById('insignias-actions').style.display = 'flex';
                        }, miniInsignias.length * 200 + 900);
                    }, 900);
                }, 700);
            }
        }, 700);
    };
}

cofre.addEventListener('cofreMitadAbierto', async function() {
    if (badges.length === 0) {
        const badgeIds = getBadgesFromURL();
        badges = await loadBadgeInfo(badgeIds);
        showBadge(0); // Adelantado aún más, sin retardo
    }
});
