// Este script gestiona la animación y el flujo de revelado de insignias

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
        cofre.classList.add('mini', 'bajada');
        cofreAnimado = true;
    }
    card.innerHTML = `
        <img class="insignia-img" src="${badge.img}" alt="${badge.title}">
        <div class="insignia-title">${badge.title}</div>
        <div class="insignia-desc">${badge.desc}</div>
        <button class="btn-recoger" id="btn-recoger">Recoger</button>
    `;
    card.style.display = 'block';
    setTimeout(() => card.classList.add('visible'), 100);
    document.getElementById('btn-recoger').onclick = () => {
        card.classList.remove('visible');
        setTimeout(() => {
            card.style.display = 'none';
            // Crear tarjeta completa y animarla a la fila
            const miniCard = document.createElement('div');
            miniCard.className = 'insignia-card mini';
            miniCard.innerHTML = `
                <img class="insignia-img" src="${badge.img}" alt="${badge.title}">
                <div class="insignia-title">${badge.title}</div>
                <div class="insignia-desc">${badge.desc}</div>
            `;
            // Calcular desplazamiento horizontal para animación inclinada
                const total = badges.length;
                const center = (total - 1) / 2;
                // Usar un desplazamiento mayor para que el efecto sea más notorio
                let offset = (current - center) * 180; // separa las tarjetas al inicio
            miniCard.style.setProperty('--card-x-inicial', offset + 'px');
            miniCard.style.setProperty('--card-x-final', '0px');
            fila.appendChild(miniCard);
            miniInsignias.push(miniCard);
            // Animación de aparición
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
                // Animación final: cofre sube y las insignias entran
                setTimeout(() => {
                    cofre.classList.remove('bajada');
                    cofre.classList.add('subida');
                    setTimeout(() => {
                        miniInsignias.forEach((el, i) => {
                            setTimeout(() => {
                                el.classList.add('entra-cofre');
                            }, i * 200);
                        });
                        // Después de la animación, ocultar la fila
                        setTimeout(() => {
                            fila.style.minHeight = '0px';
                            fila.innerHTML = '';
                            // Mostrar mensaje final y botones
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

cofre.onclick = async function() {
    if (badges.length === 0) {
        const badgeIds = getBadgesFromURL();
        badges = await loadBadgeInfo(badgeIds);
        setTimeout(() => showBadge(0), 500); // Retardo de 0.5 segundos
    }
};
