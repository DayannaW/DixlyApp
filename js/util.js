export async function loadJSON(url) { 
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("No se pudo cargar: " + url);
    return await resp.json();
}
