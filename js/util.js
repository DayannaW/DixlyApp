export async function loadJSON(url) { 
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("No se pudo cargar: " + url);
    return await resp.json();
}

// --- Progreso y puntaje (localStorage) ---
const STORAGE_KEY = 'dixly_progress_v1';
const LEVEL_POINTS = {
    'nivel-facil': 10,
    'nivel-intermedio': 20,
    'nivel-dificil': 30
};

function _read() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { perGame: {}, total: 0 };
    } catch (e) {
        return { perGame: {}, total: 0 };
    }
}

function _write(obj) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

export function getProgress() {
    return _read();
}

export function getTotalScore() {
    return _read().total || 0;
}

export function getGameScore(gameId) {
    const p = _read();
    return (p.perGame[gameId] && p.perGame[gameId].score) || 0;
}

export function hasCompletedLevel(gameId, level) {
    const p = _read();
    return !!(p.perGame[gameId] && p.perGame[gameId].levels && p.perGame[gameId].levels[level]);
}

export function addLevelCompletion(gameId, level) {
    const points = LEVEL_POINTS[level] || 0;
    if (!gameId || !level || points <= 0) return false;

    const p = _read();
    if (!p.perGame[gameId]) p.perGame[gameId] = { score: 0, levels: {} };

    let badgesAdded = [];
    if (!p.perGame[gameId].badges) p.perGame[gameId].badges = {};
    let alreadyCompleted = !!p.perGame[gameId].levels[level];
    if (!alreadyCompleted) {
        // sumar puntos solo si no estaba completado
        p.perGame[gameId].levels[level] = { completedAt: Date.now() };
        p.perGame[gameId].score = (p.perGame[gameId].score || 0) + points;
        p.total = (p.total || 0) + points;
    }
    // Si es el primer nivel, otorgar insignia "primer-paso"
    if (level === 'nivel-facil' && !p.perGame[gameId].badges['primer-paso']) {
        p.perGame[gameId].badges['primer-paso'] = { earnedAt: Date.now(), name: 'Primer paso', desc: 'Completaste el primer nivel' };
        badgesAdded.push('primer-paso');
    }
    // Si es el nivel intermedio, otorgar insignia "arquitecto-historia"
    if (level === 'nivel-intermedio' && !p.perGame[gameId].badges['arquitecto-historia']) {
        p.perGame[gameId].badges['arquitecto-historia'] = { earnedAt: Date.now(), name: 'Arquitecto de la historia', desc: 'Completaste el nivel intermedio ordenando todas las historias correctamente.' };
        badgesAdded.push('arquitecto-historia');
    }
    // Si es el nivel intermedio y badgeConditions['reorganizador-experto'], otorgar insignia
    if (level === 'nivel-intermedio' && arguments.length > 2 && typeof arguments[2] === 'object') {
        const badgeConditions = arguments[2];
        if (badgeConditions['reorganizador-experto'] && !p.perGame[gameId].badges['reorganizador-experto']) {
            p.perGame[gameId].badges['reorganizador-experto'] = { earnedAt: Date.now(), name: 'Reorganizador experto', desc: 'Lograste el orden correcto después de al menos un intento fallido.' };
            badgesAdded.push('reorganizador-experto');
        }
        if (badgeConditions['oido-narrativo'] && !p.perGame[gameId].badges['oido-narrativo']) {
            p.perGame[gameId].badges['oido-narrativo'] = { earnedAt: Date.now(), name: 'Oído narrativo', desc: 'En una ronda, solo necesitaste reproducir el audio una vez para ordenar correctamente.' };
            badgesAdded.push('oido-narrativo');
        }
        // NUEVO: Mirada atenta
        if (badgeConditions['mirada-atenta'] && !p.perGame[gameId].badges['mirada-atenta']) {
            p.perGame[gameId].badges['mirada-atenta'] = { earnedAt: Date.now(), name: 'Mirada atenta', desc: 'Te tomaste un tiempo prudente para ordenar la historia.' };
            badgesAdded.push('mirada-atenta');
        }
    }
    // Lógica para más insignias: si se pasa un objeto extra con condiciones
    if (arguments.length > 2 && typeof arguments[2] === 'object') {
        const badgeConditions = arguments[2];
        if (badgeConditions['lector-atento'] && !p.perGame[gameId].badges['lector-atento']) {
            p.perGame[gameId].badges['lector-atento'] = { earnedAt: Date.now(), name: 'Lector atento', desc: 'Completaste todas las rondas correctamente al primer intento' };
            badgesAdded.push('lector-atento');
        }
        if (badgeConditions['cazador-pistas'] && !p.perGame[gameId].badges['cazador-pistas']) {
            p.perGame[gameId].badges['cazador-pistas'] = { earnedAt: Date.now(), name: 'Cazador de pistas', desc: 'Elegiste la opción correcta después de un solo error en una historia' };
            badgesAdded.push('cazador-pistas');
        }
        if (badgeConditions['lector-paciente'] && !p.perGame[gameId].badges['lector-paciente']) {
            p.perGame[gameId].badges['lector-paciente'] = { earnedAt: Date.now(), name: 'Lector paciente', desc: 'Esperaste más de 10 segundos antes de responder en al menos una historia' };
            badgesAdded.push('lector-paciente');
        }
        // NUEVO: Arquitecto del sentido
        if (badgeConditions['arquitecto-sentido'] && !p.perGame[gameId].badges['arquitecto-sentido']) {
            p.perGame[gameId].badges['arquitecto-sentido'] = { earnedAt: Date.now(), name: 'Arquitecto del sentido', desc: 'Lograste que cada parte encajara y la historia tuviera sentido de principio a fin.' };
            badgesAdded.push('arquitecto-sentido');
        }
        // NUEVO: Pensador valiente
        if (badgeConditions['pensador-valiente'] && !p.perGame[gameId].badges['pensador-valiente']) {
            p.perGame[gameId].badges['pensador-valiente'] = { earnedAt: Date.now(), name: 'Pensador valiente', desc: 'Te atreviste a volver a intentar y buscar una mejor solución.' };
            badgesAdded.push('pensador-valiente');
        }
    }
    _write(p);
    return { added: true, badges: badgesAdded };
}

export function resetProgress() {
    localStorage.removeItem(STORAGE_KEY);
}

export function getLevelPoints(level) {
    return LEVEL_POINTS[level] || 0;
}

export function hasBadge(gameId, badgeId) {
    const p = _read();
    return !!(p.perGame[gameId] && p.perGame[gameId].badges && p.perGame[gameId].badges[badgeId]);
}

export function getBadge(gameId, badgeId) {
    const p = _read();
    return (p.perGame[gameId] && p.perGame[gameId].badges && p.perGame[gameId].badges[badgeId]) || null;
}

export function addBadge(gameId, badgeId, meta = {}) {
    if (!gameId || !badgeId) return false;
    const p = _read();
    if (!p.perGame[gameId]) p.perGame[gameId] = { score: 0, levels: {}, badges: {} };
    if (!p.perGame[gameId].badges) p.perGame[gameId].badges = {};
    if (p.perGame[gameId].badges[badgeId]) return false;
    p.perGame[gameId].badges[badgeId] = Object.assign({ earnedAt: Date.now() }, meta);
    _write(p);
    return true;
}
