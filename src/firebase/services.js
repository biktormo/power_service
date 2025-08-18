// src/firebase/services.js

import { db, storage } from './config.js';
import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, serverTimestamp, orderBy, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from 'react-hot-toast';

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

    // --- LECTURA DE CHECKLIST ---
    getChecklistData: async (pathSegments) => {
        const path = pathSegments.join('/');
        const q = query(collection(db, path), orderBy('id'));
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

    // --- GESTIÓN DE AUDITORÍAS ---
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

    // --- GESTIÓN DE RESULTADOS ---
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

    // --- GESTIÓN DE PLANES DE ACCIÓN ---
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
            await addDoc(collection(db, 'planesDeAccion'), { ...planData, estado: 'pendiente', creadoEn: serverTimestamp() });
            toast.success("Plan de acción creado.");
        }
    },
    
    closeNonConformity: async (resultadoId) => {
        const resultRef = doc(db, 'resultados', resultadoId);
        await updateDoc(resultRef, {
            resultado: 'NC Cerrada',
            comentarios: `NC cerrada. Ver plan de acción asociado. - ${new Date().toLocaleDateString()}`
        });
        toast.success("No Conformidad cerrada con éxito.");
    },
    
    // --- GESTIÓN DE ARCHIVOS ---
    uploadFile: async (file, path) => {
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return { name: file.name, url: url };
    },
};