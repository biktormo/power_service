// src/utils/dataCache.js

let cache = {
    audits: null,
    actionPlans: null,
    fullChecklist: null,
    totalRequisitos: 0,
    lastFetch: 0,
};

// Tiempo de vida del caché en milisegundos (ej: 2 minutos para pruebas)
const CACHE_DURATION = 2 * 60 * 1000;

export const getCachedData = () => {
    const now = Date.now();
    if (cache.audits && (now - cache.lastFetch < CACHE_DURATION)) {
        console.log("%cDATOS SERVIDOS DESDE EL CACHÉ", "color: lightgreen; font-weight: bold;");
        return cache;
    }
    console.log("%cCACHÉ VACÍO O EXPIRADO", "color: orange; font-weight: bold;");
    return null;
};

export const setCachedData = (data) => {
    console.log("%cGUARDANDO DATOS NUEVOS EN EL CACHÉ", "color: cyan; font-weight: bold;");
    cache = {
        ...data,
        lastFetch: Date.now(),
    };
};

export const clearCache = () => {
    console.log("%cCACHÉ LIMPIADO", "color: red; font-weight: bold;");
    cache = {
        audits: null, actionPlans: null, fullChecklist: null,
        totalRequisitos: 0, lastFetch: 0,
    };
};