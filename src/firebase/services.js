// src/firebase/services.js

import { db, storage, auth } from './config.js';
import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, serverTimestamp, orderBy, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from 'react-hot-toast';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { PILARES_ORDER } from '../utils/ordering.js';
import { POWER_SERVICE_CHECKLIST } from '../data/powerServiceChecklist.js';

// Cache en memoria para checklist de Power Service
let memoryChecklistCache = null;

export const firebaseServices = {

    // --- AUTENTICACIÓN Y ROLES ---
    getUserRole: async (uid) => {
        if (!uid) return null;
        try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data().role : null;
        } catch (error) {
            console.error("Error en getUserRole:", error);
            return null;
        }
    },

    createUser: async (email, password, role = 'colaborador') => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role: role
            });
            toast.success("Usuario registrado con éxito.");
            return user;
        } catch (error) {
            console.error("Error en createUser:", error);
            throw error;
        }
    },

    getAuditores: async (tipo = 'servicio') => {
        if (tipo === 'repuestos' || tipo === '5S_repuestos') {
            return [
                "Brian Mancilla",
                "Emilio Juncal",
                "Hernan Falconi",
                "Mauro Cabus"
            ];
        }

        const auditores5S = [
            "Acosta, Alexis Ezequiel", "Alvarez, Gonzalo Hernan", "Alvarez, Hector Hernan", "Álvarez, Damián",
            "Barrionuevo, Braian Vicente", "Bohn, Tomás Adán", "Brollo, Lucas", "Carrizo, Cristian Ariel",
            "Cipolletti, Enzo", "Falconi, Hernan", "Figueroa, Andrés Gabriel", "Gaitan, Brahian Alex",
            "Herrera, Arnaldo David", "Hildembrand, Alexis", "Juárez, Alejandro Tomás", "Lazarte, Carlos Ezequiel",
            "Lemos, Ariel Matías", "Lugo, Fabricio Emanuel", "Masiel, Angel Esteban", "Meloni, Milton Javier",
            "Palacios Sicotero, Paula Guadalupe", "Pereyra, Franco Fabricio", "Rodriguez, Alfio René", "Rodriguez, Daniel Juan Pablo",
            "Sánchez, Facundo Mauricio", "Sayago, Dinko Daniel", "Schneider, Maximiliano Raúl", "Schrotlin, Fabricio",
            "Simón, Facundo Iván", "Tévez, Marcelo Julián", "Valdéz, Maximiliano José", "Villareal, Denis", "Weis, Leonel"
        ];
        auditores5S.sort();
        return auditores5S;
    },

    getAuditores5SRepuestos: () => {
        return [
            "Brian Mancilla",
            "Emilio Juncal",
            "Hernan Falconi",
            "Mauro Cabus"
        ];
    },

    // --- LECTURA DE CHECKLIST ---
    getChecklistData: async (pathSegments) => {
        const path = pathSegments.join('/');
        const q = query(collection(db, path)); // No necesitamos ordenar por 'id' si la estructura es correcta
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
    },

    getFullChecklist: async () => {
        if (memoryChecklistCache) return memoryChecklistCache;

        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const cached = localStorage.getItem('ps_checklist_cache_v2');
                if (cached) {
                    memoryChecklistCache = JSON.parse(cached);
                    return memoryChecklistCache;
                }
            }
        } catch (e) {
            console.warn("Aviso: no se pudo leer checklist de localStorage:", e);
        }

        // Normalización instantánea desde la definición estática
        const normalized = {};
        for (const pilarKey in POWER_SERVICE_CHECKLIST) {
            const pilar = POWER_SERVICE_CHECKLIST[pilarKey];
            normalized[pilar.id] = { id: pilar.id, nombre: pilar.nombre, estandares: {} };
            for (const estandarKey in pilar.estandares) {
                const estandar = pilar.estandares[estandarKey];
                const reqs = Array.isArray(estandar.requisitos) 
                    ? estandar.requisitos 
                    : Object.values(estandar.requisitos || {});
                normalized[pilar.id].estandares[estandar.id] = {
                    id: estandar.id,
                    descripcion: estandar.descripcion,
                    requisitos: reqs
                };
            }
        }

        memoryChecklistCache = normalized;

        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem('ps_checklist_cache_v2', JSON.stringify(normalized));
            }
        } catch (e) {}

        return memoryChecklistCache;
    },

    getSingleRequirement: async (pilarId, estandarId, requisitoId) => {
        if (!pilarId || !estandarId || !requisitoId) return null;
        try {
            const docRef = doc(db, 'checklist', pilarId, 'estandares', estandarId, 'requisitos', requisitoId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Error en getSingleRequirement:", error);
            return null;
        }
    },

    // --- GESTIÓN DE AUDITORÍAS PS ---
    createAudit: async (auditData, creatorUid) => {
        const auditsCountSnap = await getDocs(collection(db, 'auditorias'));
        const newCount = (auditsCountSnap.size + 1).toString().padStart(3, '0');
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const newAudit = {
            ...auditData, numeroAuditoria: `PS-${dateStr}-${newCount}`,
            fechaCreacion: serverTimestamp(), fechaCierre: null,
            creadoPor: creatorUid, estado: 'abierta',
        };
        const docRef = await addDoc(collection(db, 'auditorias'), newAudit);
        return docRef.id;
    },

    getAuditDetails: async (auditId) => {
        const docRef = doc(db, 'auditorias', auditId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    getAllAuditsWithResults: async () => {
        try {
            const auditsQuery = query(collection(db, 'auditorias'), orderBy('fechaCreacion', 'desc'));
            const [auditsSnapshot, resultsSnapshot] = await Promise.all([
                getDocs(auditsQuery),
                getDocs(collection(db, 'resultados'))
            ]);

            const resultsByAudit = {};
            resultsSnapshot.forEach(docSnap => {
                const result = { id: docSnap.id, ...docSnap.data() };
                if (result.auditId) {
                    if (!resultsByAudit[result.auditId]) {
                        resultsByAudit[result.auditId] = [];
                    }
                    resultsByAudit[result.auditId].push(result);
                }
            });

            const totalRequisitosPS = 144;
            return auditsSnapshot.docs.map(docSnap => {
                const data = docSnap.data();
                const results = resultsByAudit[docSnap.id] || [];

                let estado = data.estado || 'abierta';
                let autoCerrada = Boolean(data.autoCerrada);

                const rawFecha = data.fechaCreacion?.toDate ? data.fechaCreacion.toDate() : new Date(data.fechaCreacion || 0);
                const elapsedHours = (Date.now() - rawFecha.getTime()) / (3600 * 1000);

                // Regla de 48hs: si se completaron todos los ítems y transcurrieron 48hs desde el inicio
                if (estado === 'abierta' && results.length >= totalRequisitosPS && elapsedHours >= 48) {
                    estado = 'cerrada';
                    autoCerrada = true;
                    try {
                        updateDoc(doc(db, 'auditorias', docSnap.id), {
                            estado: 'cerrada',
                            fechaCierre: serverTimestamp(),
                            autoCerrada: true
                        }).catch(() => {});
                    } catch (e) {}
                }

                return {
                    id: docSnap.id,
                    ...data,
                    estado,
                    autoCerrada,
                    resultados: results
                };
            });
        } catch (error) {
            console.error("Error en getAllAuditsWithResults:", error);
            return [];
        }
    },

    closeAudit: async (auditId) => {
        const auditRef = doc(db, 'auditorias', auditId);
        await updateDoc(auditRef, { estado: 'cerrada', fechaCierre: serverTimestamp() });
    },

    // --- GESTIÓN DE RESULTADOS PS ---
    saveRequirementResult: async (data, existingResult) => {
        try {
            if (existingResult && existingResult.id) {
                const resultRef = doc(db, 'resultados', existingResult.id);
                await updateDoc(resultRef, data);
            } else {
                await addDoc(collection(db, 'resultados'), data);
            }
        } catch (error) {
            console.error("ERROR AL GUARDAR RESULTADO EN FIREBASE:", error);
            toast.error("Fallo al guardar en la base de datos.");
            throw new Error("Error de escritura en Firestore.");
        }
    },
    
    getAuditResults: async (auditId) => {
        const q = query(collection(db, 'resultados'), where('auditId', '==', auditId));
        const snapshot = await getDocs(q);
        const results = {};
        snapshot.forEach(doc => {
            results[doc.data().requisitoId] = { id: doc.id, ...doc.data() };
        });
        return results;
    },

    getSingleResult: async (resultadoId) => {
        const docRef = doc(db, 'resultados', resultadoId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    closeNonConformity: async (resultadoId) => {
        const resultRef = doc(db, 'resultados', resultadoId);
        await updateDoc(resultRef, {
            resultado: 'NC Cerrada',
            comentarios: `NC cerrada. Ver plan de acción asociado. - ${new Date().toLocaleDateString()}`
        });
    },

    // --- GESTIÓN DE PLANES DE ACCIÓN (PARA AMBOS TIPOS) ---
    getNCsForAudit: async (auditId) => {
        const q = query(collection(db, 'resultados'), where('auditId', '==', auditId), where('resultado', '==', 'NC'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    getActionPlan: async (resultadoId) => {
        const q = query(collection(db, 'planesDeAccion'), where('resultadoId', '==', resultadoId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const docResult = snapshot.docs[0];
        return { id: docResult.id, ...docResult.data() };
    },

    getAllActionPlans: async () => {
        const q = query(collection(db, 'planesDeAccion'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    saveActionPlan: async (planData, existingPlanId) => {
        if (existingPlanId) {
            const planRef = doc(db, 'planesDeAccion', existingPlanId);
            await updateDoc(planRef, planData);
            toast.success("Plan de acción actualizado.");
        } else {
            await addDoc(collection(db, 'planesDeAccion'), { 
                ...planData,
                tipoAuditoria: planData.auditId ? 'PS' : '5S', // Determina el tipo basado en la presencia de auditId
                estado: 'pendiente', 
                creadoEn: serverTimestamp() 
            });
            toast.success("Plan de acción creado.");
        }
    },
    
    // --- GESTIÓN DE AUDITORÍAS 5S ---
    get5SChecklist: () => {
        const checklist = {
            "TALLER": [
                { id: "1", text: "Los bancos de trabajo de los técnicos están organizados y limpios y solo cuentan con los elementos necesarios para el trabajo." },
                { id: "2", text: "Los carros individuales de los técnicos están limpios y ordenados" },
                { id: "3", text: "Las cajas de herramientas de los técnicos están limpias y ordenadas" },
                { id: "4", text: "El equipo y las herramientas del taller son funcionales, necesarios y de uso habitual." },
                { id: "5", text: "Las piezas desmontadas durante el servicio se empaquetan en cajas / bancos o estantes de manera organizada." },
                { id: "6", text: "Al final de cada trabajo, el equipo y las herramientas se devuelven a su ubicación identificada." },
                { id: "7", text: "Los box del taller están limpias, sin aceite, refrigerante, suciedad, agua, etc." },
                { id: "8", text: "El piso del Taller está libre de residuos o manchas" },
                { id: "9", text: "Equipamiento e instrumentos estan libres de polvo y manchas de aceite." },
                { id: "10", text: "Herramientas especiales y universales organizadas, calibradas y etiquetadas" },
                { id: "11", text: "Los botes de basura y los desechos ambientales se vacían antes de que estén llenos." },
                { id: "12", text: "Los residuos medioambientales y reciclables se eliminan correctamente en sus respectivos residuos selectivos." },
                { id: "13", text: "Todas las luces del taller están funcionando." },
                { id: "14", text: "Las paredes del taller están limpias y la pintura se conserva." },
                { id: "15", text: "La sala de garantía está limpia y organizada (libre de suciedad, partes directamente en el piso o en el último estante)." },
                { id: "16", text: "Personal del Departamento de Servicio correctamente uniformado, según el estándar John Deere" },
                { id: "17", text: "Se respetan las reglas de seguridad y uso de equipos de protección individual (EPP)" },
                { id: "18", text: "Las mesadas laterales están libres de accesorios, herremientas al finalizar el día" },
                { id: "19", text: "La sala de motores está limpia y ordenada" },
                { id: "20", text: "La sala de hidráulica esta limpia y ordeanda" },
                { id: "21", text: "La sala herramientas pesadas exterior limpia y ordenada" }
            ],
            "AREA DE LAVADO": [
                { id: "22", text: "El equipo de lavado de piezas está en buenas condiciones." },
                { id: "23", text: "El piso de lla sala de lavado de piezas esta limpio (sin basura/aceite en el piso)." },
                { id: "24", text: "Los botes de basura están correctamente colocados y vacíos antes de que estén llenos" },
                { id: "25", text: "El equipo de lavado de Maquinas está en buenas condiciones." },
                { id: "26", text: "El piso del area del lavado de Maquinas está limpio (sin basura en el piso)." }
            ],
            "GENERAL": [
                { id: "27", text: "El mostrador de repuestos (cliente y taller) está limpio y organizado." },
                { id: "28", text: "Gerente administrativo y de servicio limpio y organizado o oficina de posventa" },
                { id: "29", text: "Baños de clientes limpios (M / F) y para recibir al cliente" },
                { id: "30", text: "Pantalla de programación visible para todos en el Departamento de Servicio" },
                { id: "31", text: "Baños de personal esta limpio" },
                { id: "32", text: "Oficina de coordinadores está limpia sin accesorios que no correspondan" },
                { id: "33", text: "Estan colocadas las barreras limitadoras de ingreso a taller y parte lateral?" },
                { id: "34", text: "El vestuario está limpio y en condiciones" },
                { id: "35", text: "La sala de reuniones del equipo técnico esta limpia y en condiciones" },
                { id: "36", text: "El patio de trabajo esta limpio y ordenado, sin manchas en piedas y libre de residuos" },
                { id: "37", text: "El estado de los vehículos y sus respectivas planillas están en orden" }
            ]
        };
        return checklist;
    },

    get5SRepuestosChecklist: (lugar = 'Charata') => {
        const depositoPrincipal = [
            { id: "1", text: "Pasillo principal sin repuestos" },
            { id: "2", text: "Pasillos secundarios libre de transito" },
            { id: "3", text: "Carritos de repuestos ordenados y limpios" },
            { id: "4", text: "Oficina ordenada y limpia" },
            { id: "5", text: "Estanterias ordenadas y limpias" },
            { id: "6", text: "Paredes, camaras sin telaraña y limpias" },
            { id: "7", text: "Respetan las reglas de seguridad y uso equipos de protección individual (EPP)" },
            { id: "8", text: "Pisos limpios sin residuos" },
            { id: "9", text: "Todas las luces en funcionamiento." },
            { id: "10", text: "Personal Deposito correctamente uniformado, según el estándar JD." },
            { id: "11", text: "Baños de personal esta limpio" },
            { id: "12", text: "Repuestos para Servicios en su ubicación sin sobrantes" },
            { id: "13", text: "Repuestos vendidos por DCP preparados y separados" },
            { id: "14", text: "Repuestos vendidos para clientes preparados y separados" },
            { id: "15", text: "Mostrador entrega de repuestos y ventana oficina, ordenado, limpio y libre" },
            { id: "16", text: "Los botes de basura, correctamente colocados y no desbordado" }
        ];

        // Para Bandera y Quimilí, solo se audita Depósito Principal (hasta ítem 16 inclusive)
        if (lugar === 'Bandera' || lugar === 'Quimili') {
            return {
                "DEPOSITO PRINCIPAL": depositoPrincipal
            };
        }

        // Para Charata, todos los items (1 al 24)
        const lubricantes = [
            { id: "17", text: "Pasillo principal limpio" },
            { id: "18", text: "Pasillos laterales limpios y libre de transito" },
            { id: "19", text: "Libre de manchas de aceite" },
            { id: "20", text: "Paredes y ventanas limpias" },
            { id: "21", text: "Mercaderia correctamente almacenada" }
        ];

        const patio = [
            { id: "22", text: "Mercaderia correctamente almacenada" },
            { id: "23", text: "Ubicada en lugares delimitado" },
            { id: "24", text: "aprovechamiento de espacio" }
        ];

        return {
            "DEPOSITO PRINCIPAL": depositoPrincipal,
            "LUBRICANTES": lubricantes,
            "PATIO": patio
        };
    },

    getChecklist5SByType: (tipo = 'servicio', lugar = 'Charata') => {
        if (tipo === 'repuestos' || tipo === '5S_repuestos') {
            return firebaseServices.get5SRepuestosChecklist(lugar);
        }
        return firebaseServices.get5SChecklist();
    },
    
    createAuditoria5S: async (auditData, creatorUid) => {
        const date = new Date(auditData.fecha);
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const audits5SQuery = query(collection(db, 'auditorias5S'));
        const audits5SSnapshot = await getDocs(audits5SQuery);
        const newCount = (audits5SSnapshot.size + 1).toString().padStart(3, '0');
        const tipo5S = auditData.tipo5S || 'servicio';
        const prefix = tipo5S === 'repuestos' ? '5SR-' : '5S-';
        const newAudit = {
            ...auditData,
            tipo5S: tipo5S,
            numeroAuditoria: `${prefix}${dateStr}-${newCount}`,
            resultadoPorcentaje: null,
            creadoPor: creatorUid,
            creadoEn: serverTimestamp(),
            estado: auditData.estado || 'en_progreso',
            fechaCierre: null
        };
        const docRef = await addDoc(collection(db, 'auditorias5S'), newAudit);
        return docRef.id;
    },

    closeAuditoria5S: async (auditId, resultadoPorcentaje = null) => {
        const auditRef = doc(db, 'auditorias5S', auditId);
        const updateData = { 
            estado: 'finalizada', 
            fechaCierre: serverTimestamp() 
        };
        if (resultadoPorcentaje !== null && resultadoPorcentaje !== undefined) {
            updateData.resultadoPorcentaje = resultadoPorcentaje;
        }
        await updateDoc(auditRef, updateData);
    },

    updateAuditoria5S: async (auditId, data) => {
        const auditRef = doc(db, 'auditorias5S', auditId);
        await updateDoc(auditRef, data);
    },

    saveResultado5S: async (resultadoData) => {
        const q = query(collection(db, 'resultados5S'), 
            where('auditoria5SId', '==', resultadoData.auditoria5SId), 
            where('itemId', '==', resultadoData.itemId)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            await addDoc(collection(db, 'resultados5S'), resultadoData);
        } else {
            const docId = snapshot.docs[0].id;
            await updateDoc(doc(db, 'resultados5S', docId), resultadoData);
        }
    },
    
    getAllAuditorias5S: async () => {
        const q = query(collection(db, 'auditorias5S'), orderBy('creadoEn', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    
    getNCsForAuditoria5S: async (auditoria5SId) => {
        const q = query(collection(db, 'resultados5S'), 
            where('auditoria5SId', '==', auditoria5SId), 
            where('resultado', '==', 'No Conforme')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    getSingleResultado5S: async (resultadoId) => {
        const docRef = doc(db, 'resultados5S', resultadoId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },
    
    closeNonConformity5S: async (resultadoId) => {
        const resultRef = doc(db, 'resultados5S', resultadoId);
        await updateDoc(resultRef, {
            resultado: 'NC Cerrada',
            comentarios: `NC 5S cerrada. Ver plan de acción. - ${new Date().toLocaleDateString()}`
        });
        toast.success("No Conformidad 5S cerrada.");
    },

    // --- GESTIÓN DE ARCHIVOS ---
    uploadFile: async (file, path) => {
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return { name: file.name, url: url };
    },

    getAllAuditorias5SWithResults: async () => {
        try {
            const auditsQuery = query(collection(db, 'auditorias5S'), orderBy('creadoEn', 'desc'));
            const resultsQuery = query(collection(db, 'resultados5S'));

            // Carga en paralelo para máxima velocidad
            const [auditsSnapshot, resultsSnapshot] = await Promise.all([
                getDocs(auditsQuery),
                getDocs(resultsQuery)
            ]);

            const resultsByAudit = {};
            resultsSnapshot.forEach(docSnap => {
                const result = { id: docSnap.id, ...docSnap.data() };
                if (result.auditoria5SId) {
                    if (!resultsByAudit[result.auditoria5SId]) {
                        resultsByAudit[result.auditoria5SId] = [];
                    }
                    resultsByAudit[result.auditoria5SId].push(result);
                }
            });

            const audits = auditsSnapshot.docs.map(docSnap => {
                const data = docSnap.data();
                const tipo5S = data.tipo5S || (data.numeroAuditoria && data.numeroAuditoria.startsWith('5SR') ? 'repuestos' : 'servicio');
                const results = resultsByAudit[docSnap.id] || [];

                // Cantidad esperada según tipo y sucursal
                const totalExpected = tipo5S === 'repuestos'
                    ? (data.lugar === 'Charata' ? 24 : 16)
                    : 37;

                const auditDate = data.fecha?.toDate ? data.fecha.toDate() 
                    : (data.creadoEn?.toDate ? data.creadoEn.toDate() 
                    : new Date(data.fecha || data.creadoEn || 0));

                const elapsedHours = (Date.now() - auditDate.getTime()) / (3600 * 1000);

                let estado = data.estado || (data.fechaCierre || data.resultadoPorcentaje !== null ? 'finalizada' : 'en_progreso');
                let autoCerrada = Boolean(data.autoCerrada);

                // Regla de 48 horas: si se auditaron todos los ítems y pasaron >= 48hs desde el inicio
                if (estado === 'en_progreso' || estado === 'abierta') {
                    if (results.length >= totalExpected && elapsedHours >= 48) {
                        estado = 'finalizada';
                        autoCerrada = true;

                        const conformes = results.filter(r => r.resultado === 'Conforme').length;
                        const ncCerradas = results.filter(r => r.resultado === 'NC Cerrada').length;
                        const evaluados = results.filter(r => r.resultado === 'Conforme' || r.resultado === 'No Conforme' || r.resultado === 'NC Cerrada').length;
                        const score = evaluados > 0 ? Number(((conformes + ncCerradas) / evaluados * 100).toFixed(1)) : 0;

                        try {
                            updateDoc(doc(db, 'auditorias5S', docSnap.id), {
                                estado: 'finalizada',
                                fechaCierre: serverTimestamp(),
                                resultadoPorcentaje: data.resultadoPorcentaje ?? score,
                                autoCerrada: true
                            }).catch(() => {});
                        } catch (e) {}
                    }
                }

                return { 
                    id: docSnap.id, 
                    ...data,
                    tipo5S,
                    estado,
                    autoCerrada,
                    creadoEn: data.creadoEn || serverTimestamp(),
                    resultados: results 
                };
            });
    
            return audits;
        } catch (error) {
            console.error("Error crítico en getAllAuditorias5SWithResults:", error);
            return [];
        }
    },

    getAuditoria5SWithResults: async (auditId) => {
        if (!auditId) return null;
        const auditDocRef = doc(db, 'auditorias5S', auditId);
        const resultsQuery = query(collection(db, 'resultados5S'), where('auditoria5SId', '==', auditId));

        const [auditDocSnap, resultsSnapshot] = await Promise.all([
            getDoc(auditDocRef),
            getDocs(resultsQuery)
        ]);

        if (!auditDocSnap.exists()) return null;
    
        const rawData = auditDocSnap.data();
        const tipo5S = rawData.tipo5S || (rawData.numeroAuditoria?.startsWith('5SR') ? 'repuestos' : 'servicio');
        const resultados = resultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const totalExpected = tipo5S === 'repuestos'
            ? (rawData.lugar === 'Charata' ? 24 : 16)
            : 37;

        const auditDate = rawData.fecha?.toDate ? rawData.fecha.toDate() 
            : (rawData.creadoEn?.toDate ? rawData.creadoEn.toDate() 
            : new Date(rawData.fecha || rawData.creadoEn || 0));

        const elapsedHours = (Date.now() - auditDate.getTime()) / (3600 * 1000);

        let estado = rawData.estado || (rawData.fechaCierre || rawData.resultadoPorcentaje !== null ? 'finalizada' : 'en_progreso');
        let autoCerrada = Boolean(rawData.autoCerrada);

        if ((estado === 'en_progreso' || estado === 'abierta') && resultados.length >= totalExpected && elapsedHours >= 48) {
            estado = 'finalizada';
            autoCerrada = true;
        }

        return { 
            id: auditDocSnap.id, 
            ...rawData,
            tipo5S,
            estado,
            autoCerrada,
            resultados 
        };
    },
};
