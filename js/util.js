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

    if (p.perGame[gameId].levels[level]) {
        // ya completado, no duplicar puntos
        return false;
    }

    // sumar puntos
    p.perGame[gameId].levels[level] = { completedAt: Date.now() };
    p.perGame[gameId].score = (p.perGame[gameId].score || 0) + points;
    p.total = (p.total || 0) + points;

    // Si es el primer nivel, otorgar insignia "primer-paso"
    let badgesAdded = [];
    if (level === 'nivel-facil') {
        if (!p.perGame[gameId].badges) p.perGame[gameId].badges = {};
        if (!p.perGame[gameId].badges['primer-paso']) {
            p.perGame[gameId].badges['primer-paso'] = { earnedAt: Date.now(), name: 'Primer paso', desc: 'Completaste el primer nivel' };
            badgesAdded.push('primer-paso');
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
