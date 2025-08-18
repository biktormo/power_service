// src/utils/dataCache.js

// Este es nuestro caché simple en memoria.
let cache = {
    audits: null,
    actionPlans: null,
    fullChecklist: null,
    totalRequisitos: 0,
    lastFetch: 0, // Para saber cuándo fue la última vez que se buscaron datos
};

// Tiempo de vida del caché en milisegundos (ej: 5 minutos)
const CACHE_DURATION = 5 * 60 * 1000;

export const getCachedData = () => {
    const now = Date.now();
    // Si el caché no está vacío y no ha expirado, lo devolvemos
    if (cache.audits && (now - cache.lastFetch < CACHE_DURATION)) {
        console.log("Devolviendo datos desde el CACHÉ.");
        return cache;
    }
    // Si no, devolvemos null para forzar una nueva búsqueda
    console.log("Caché vacío o expirado. Se necesitan datos frescos.");
    return null;
};

export const setCachedData = (data) => {
    console.log("Guardando nuevos datos en el CACHÉ.");
    cache = {
        ...data,
        lastFetch: Date.now(),
    };
};

export const clearCache = () => {
    console.log("Limpiando el CACHÉ.");
    cache = {
        audits: null,
        actionPlans: null,
        fullChecklist: null,
        totalRequisitos: 0,
        lastFetch: 0,
    };
};