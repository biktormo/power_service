// src/firebase/services.js

import { db, storage, auth } from './config.js';
import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, serverTimestamp, orderBy, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from 'react-hot-toast';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { PILARES_ORDER } from '../utils/ordering.js'; // Asumiendo que existe para ordenar

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

    getAuditores: async () => {
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

    // --- LECTURA DE CHECKLIST ---
    getChecklistData: async (pathSegments) => {
        const path = pathSegments.join('/');
        const q = query(collection(db, path)); // No necesitamos ordenar por 'id' si la estructura es correcta
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
    },

    getFullChecklist: async () => {
        try {
            const checklist = {};
            const pilaresSnap = await getDocs(collection(db, 'checklist'));
            for (const pilarDoc of pilaresSnap.docs) {
                const pilarData = pilarDoc.data();
                checklist[pilarData.id] = { ...pilarData, estandares: {} };
                const estandaresSnap = await getDocs(collection(db, `checklist/${pilarDoc.id}/estandares`));
                for (const estandarDoc of estandaresSnap.docs) {
                    const estandarData = estandarDoc.data();
                    checklist[pilarData.id].estandares[estandarData.id] = { ...estandarData, requisitos: [] };
                    const requisitosSnap = await getDocs(collection(db, `checklist/${pilarDoc.id}/estandares/${estandarDoc.id}/requisitos`));
                    requisitosSnap.forEach(reqDoc => {
                        checklist[pilarData.id].estandares[estandarData.id].requisitos.push(reqDoc.data());
                    });
                }
            }
            return checklist;
        } catch (error) {
            console.error("Error en getFullChecklist:", error);
            return {};
        }
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
        const auditsQuery = query(collection(db, 'auditorias'), orderBy('fechaCreacion', 'desc'));
        const auditsSnapshot = await getDocs(auditsQuery);
        const audits = auditsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const resultsSnapshot = await getDocs(collection(db, 'resultados'));
        const resultsByAudit = {};
        resultsSnapshot.forEach(doc => {
            const result = { id: doc.id, ...doc.data() };
            if (!resultsByAudit[result.auditId]) {
                resultsByAudit[result.auditId] = [];
            }
            resultsByAudit[result.auditId].push(result);
        });
        return audits.map(audit => ({ ...audit, resultados: resultsByAudit[audit.id] || [] }));
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
    
    createAuditoria5S: async (auditData, creatorUid) => {
        const date = new Date(auditData.fecha);
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const audits5SQuery = query(collection(db, 'auditorias5S'));
        const audits5SSnapshot = await getDocs(audits5SQuery);
        const newCount = (audits5SSnapshot.size + 1).toString().padStart(3, '0');
        const newAudit = {
            ...auditData,
            numeroAuditoria: `5S${dateStr}-${newCount}`,
            resultadoPorcentaje: null,
            creadoPor: creatorUid,
            creadoEn: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'auditorias5S'), newAudit);
        return docRef.id;
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
            const auditsSnapshot = await getDocs(auditsQuery);
            
            // Mapeamos los datos con protección contra errores
            const audits = auditsSnapshot.docs.map(doc => {
                const data = doc.data();
                // Si falta la fecha, usamos la fecha actual como fallback para no romper la app
                return { 
                    id: doc.id, 
                    ...data,
                    creadoEn: data.creadoEn || serverTimestamp() 
                };
            });
    
            const resultsQuery = query(collection(db, 'resultados5S'));
            const resultsSnapshot = await getDocs(resultsQuery);
            const resultsByAudit = {};
            
            resultsSnapshot.forEach(doc => {
                const result = { id: doc.id, ...doc.data() };
                // Solo procesamos si tiene un ID de auditoría válido
                if (result.auditoria5SId) {
                    if (!resultsByAudit[result.auditoria5SId]) {
                        resultsByAudit[result.auditoria5SId] = [];
                    }
                    resultsByAudit[result.auditoria5SId].push(result);
                }
            });
    
            return audits.map(audit => ({ 
                ...audit, 
                resultados: resultsByAudit[audit.id] || [] 
            }));
        } catch (error) {
            console.error("Error crítico en getAllAuditorias5SWithResults:", error);
            return []; // Devolvemos array vacío en lugar de romper
        }
    },

    getAuditoria5SWithResults: async (auditId) => {
        if (!auditId) return null;
        const auditDocRef = doc(db, 'auditorias5S', auditId);
        const auditDocSnap = await getDoc(auditDocRef);
        if (!auditDocSnap.exists()) return null;
    
        const auditData = { id: auditDocSnap.id, ...auditDocSnap.data() };
        
        const resultsQuery = query(collection(db, 'resultados5S'), where('auditoria5SId', '==', auditId));
        const resultsSnapshot = await getDocs(resultsQuery);
        const resultados = resultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
        return { ...auditData, resultados };
    },
};
