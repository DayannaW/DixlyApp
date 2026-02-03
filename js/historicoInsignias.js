// Script para mostrar las insignias guardadas en localStorage en historicoInsignias.html
// Se asume que localStorage['insignias'] es un array de objetos: [{ id: 'primer-paso', fecha: '2026-01-10' }, ...]


function obtenerInsigniasDeLocalStorage() {
    let data;
    try {
        data = JSON.parse(localStorage.getItem('dixly_progress_v1'));
    } catch (e) {
        return [];
    }
    if (!data || !data.perGame) return [];
    // Recopilar todas las insignias de todos los juegos
    const badgesMap = {};
    for (const juego in data.perGame) {
        const game = data.perGame[juego];
        if (game.badges) {
            for (const badgeId in game.badges) {
                const badge = game.badges[badgeId];
                // Si ya existe, quedarse con la fecha más reciente
                if (!badgesMap[badgeId] || badge.earnedAt > badgesMap[badgeId].earnedAt) {
                    badgesMap[badgeId] = {
                        id: badgeId,
                        earnedAt: badge.earnedAt,
                        name: badge.name,
                        desc: badge.desc
                    };
                }
            }
        }
    }
    // Convertir a array y ordenar por fecha descendente
    return Object.values(badgesMap).sort((a, b) => b.earnedAt - a.earnedAt);
}

function formatearFecha(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

async function cargarInsigniasHistorico() {
    const lista = document.querySelector('.insignia-lista');
    if (!lista) return;
    lista.innerHTML = '';
    const insigniasGuardadas = obtenerInsigniasDeLocalStorage();
    if (!insigniasGuardadas || insigniasGuardadas.length === 0) {
        lista.innerHTML = '<div style="text-align:center;color:#888;">No tienes insignias guardadas aún.</div>';
        return;
    }
    // Cargar el JSON de badges
    let badges = {};
    try {
        const resp = await fetch('js/data/badges.json');
        badges = await resp.json();
    } catch(e) {}
        insigniasGuardadas.forEach(insignia => {
            const badge = badges[insignia.id] || {};
            const img = badge.path || `assets/imagenes/insignias/${insignia.id}.png`;
            const nombre = badge.name || insignia.name || insignia.id;
            const fecha = insignia.earnedAt ? `Obtenida: ${formatearFecha(insignia.earnedAt)}` : '';
            const item = document.createElement('div');
            item.className = 'insignia-item';
            item.innerHTML = `
                <img class="insignia-img" src="${img}" alt="${nombre}">
                <div class="insignia-info">
                    <div class="insignia-nombre">${nombre}</div>
                    <div class="insignia-fecha">${fecha}</div>
                </div>
            `;
            lista.appendChild(item);
        });
}

document.addEventListener('DOMContentLoaded', cargarInsigniasHistorico);