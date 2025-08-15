// src/firebase/services.js
import { db, storage } from './config';
import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, serverTimestamp, orderBy, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from 'react-hot-toast';

export const firebaseServices = {
    // --- FUNCIONES DE AUTENTICACIÓN Y ROLES ---
    getUserRole: async (uid) => {
        if (!uid) return null;
        try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data().role; 
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error al obtener el rol del usuario:", error);
            return null;
        }
    },

    getAllActionPlans: async () => {
        const q = query(collection(db, 'planesDeAccion'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // --- FUNCIONES DE CHECKLIST (DATOS ESTÁTICOS) ---
    getChecklistData: async (pathSegments) => {
        const path = pathSegments.join('/');
        const q = query(collection(db, path), orderBy('id'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
    },

    getFullChecklist: async () => {
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
    },

    // --- FUNCIONES DE AUDITORÍAS (CRUD) ---
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

    // Dentro de src/firebase/services.js

    getAllAuditsWithResults: async () => {
        const auditsQuery = query(collection(db, 'auditorias'), orderBy('fechaCreacion', 'desc'));
        const auditsSnapshot = await getDocs(auditsQuery);
        const audits = auditsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const resultsSnapshot = await getDocs(collection(db, 'resultados'));
        const resultsByAudit = {};
        
        resultsSnapshot.forEach(doc => {
            // --- LA CORRECCIÓN CLAVE ESTÁ AQUÍ ---
            // Ahora, cada resultado incluye su propio ID de documento
            const result = { id: doc.id, ...doc.data() }; 
            
            if (!resultsByAudit[result.auditoriaId]) {
                resultsByAudit[result.auditoriaId] = [];
            }
            resultsByAudit[result.auditoriaId].push(result);
        });

        return audits.map(audit => ({
            ...audit,
            resultados: resultsByAudit[audit.id] || [],
        }));
    },

    closeAudit: async (auditId) => {
        const auditRef = doc(db, 'auditorias', auditId);
        await updateDoc(auditRef, { estado: 'cerrada', fechaCierre: serverTimestamp() });
    },

    // --- FUNCIONES DE RESULTADOS DE AUDITORÍA ---
    saveRequirementResult: async (data, existingResult) => {
        try {
            if (existingResult && existingResult.id) {
                // CAMINO 2: Si ya existe un resultado, lo ACTUALIZAMOS.
                console.log(`Actualizando documento existente en 'resultados' con ID: ${existingResult.id}`);
                const resultRef = doc(db, 'resultados', existingResult.id);
                // Usamos updateDoc, que es más seguro para modificar.
                await updateDoc(resultRef, data); 
                toast.success("Resultado actualizado con éxito.");
            } else {
                // CAMINO 1: Si no existe, creamos uno NUEVO.
                console.log("Creando nuevo documento en 'resultados'.");
                await addDoc(collection(db, 'resultados'), data);
                toast.success("Resultado guardado con éxito.");
            }
        } catch (error) {
            console.error("ERROR AL GUARDAR EN FIREBASE:", error);
            toast.error("Fallo al guardar en la base de datos.");
            // Lanzamos el error para que el componente que llama sepa que falló
            throw new Error("Error de escritura en Firestore."); 
        }
    },
    
    getAuditResults: async (auditId) => {
        const q = query(collection(db, 'resultados'), where('auditoriaId', '==', auditId));
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
    
    // --- FUNCIONES DE PLANES DE ACCIÓN ---
    getNCsForAudit: async (auditId) => {
        const q = query(collection(db, 'resultados'), where('auditoriaId', '==', auditId), where('resultado', '==', 'NC'));
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

    saveActionPlan: async (planData, existingPlanId) => {
        if (existingPlanId) {
            const planRef = doc(db, 'planesDeAccion', existingPlanId);
            await updateDoc(planRef, planData);
            toast.success("Plan de acción actualizado.");
        } else {
            await addDoc(collection(db, 'planesDeAccion'), { ...planData, estado: 'pendiente', creadoEn: serverTimestamp() });
            toast.success("Plan de acción creado.");
        }
    },

    // Dentro de src/firebase/services.js

    closeNonConformity: async (resultadoId) => {
        const resultRef = doc(db, 'resultados', resultadoId);
        await updateDoc(resultRef, {
            resultado: 'NC Cerrada', // <-- CAMBIO CLAVE
            comentarios: `NC cerrada. Ver plan de acción asociado. - ${new Date().toLocaleDateString()}`
        });
        toast.success("No Conformidad cerrada con éxito.");
    },

    getSingleRequirement: async (pilarId, estandarId, requisitoId) => {
        if (!pilarId || !estandarId || !requisitoId) return null;
        const docRef = doc(db, 'checklist', pilarId, 'estandares', estandarId, 'requisitos', requisitoId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    },
    
    // --- FUNCIONES DE STORAGE Y DASHBOARD ---
    uploadFile: async (file, path) => {
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        // Devolvemos un objeto con el nombre y la URL, como esperamos
        return { name: file.name, url: url };
    },
};