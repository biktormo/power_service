// src/pages/RequirementModalContent.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { firebaseServices } from '../firebase/services';
import { serverTimestamp } from 'firebase/firestore';

const RequirementModalContent = ({ requisito, onSave, onClose, auditId, existingResult, goToNextRequisito, hasNext }) => {
    // Si el requisito cambia (al ir al siguiente), reseteamos los estados del formulario
    const [resultado, setResultado] = useState(existingResult?.resultado || '');
    const [comentarios, setComentarios] = useState(existingResult?.comentarios || '');
    useEffect(() => {
        setResultado(existingResult?.resultado || '');
        setComentarios(existingResult?.comentarios || '');
    }, [requisito, existingResult]);

    const [foto, setFoto] = useState(null);
    const [adjunto, setAdjunto] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Función central de guardado que será reutilizada
    const handleSaveCore = async () => {
        if (!resultado) {
            toast.error("Debes seleccionar un resultado.");
            throw new Error("Resultado no seleccionado");
        }
        setIsSaving(true);
        const toastId = toast.loading("Guardando...");
        try {
            let adjuntosArray = existingResult?.adjuntos || [];
            if (foto) {
                const path = `audits/${auditId}/${requisito.id}/foto_${Date.now()}_${foto.name}`;
                const fotoData = await firebaseServices.uploadFile(foto, path);
                const existingFotoIndex = adjuntosArray.findIndex(a => a.type === 'foto');
                if (existingFotoIndex > -1) { adjuntosArray[existingFotoIndex] = { ...fotoData, type: 'foto' }; }
                else { adjuntosArray.push({ ...fotoData, type: 'foto' }); }
            }
            if (adjunto) {
                const path = `audits/${auditId}/${requisito.id}/adjunto_${Date.now()}_${adjunto.name}`;
                const adjuntoData = await firebaseServices.uploadFile(adjunto, path);
                const existingAdjuntoIndex = adjuntosArray.findIndex(a => a.type === 'adjunto');
                if (existingAdjuntoIndex > -1) { adjuntosArray[existingAdjuntoIndex] = { ...adjuntoData, type: 'adjunto' }; }
                else { adjuntosArray.push({ ...adjuntoData, type: 'adjunto' }); }
            }
            const dataToSave = {
                auditId, requisitoId: requisito.id, pilarId: requisito.pilarId,
                estandarId: requisito.estandarId, resultado, comentarios,
                adjuntos: adjuntosArray, fechaResultado: serverTimestamp(),
            };
            await onSave(dataToSave, existingResult);
            toast.success("Resultado guardado.", { id: toastId });
        } catch (error) {
            toast.error("Error al guardar.", { id: toastId });
            setIsSaving(false); // Liberamos el botón si hay un error
            throw error;
        }
        setIsSaving(false);
    };

    const handleSaveAndClose = async () => {
        try {
            await handleSaveCore();
            onClose(); // Solo cerramos si el guardado fue exitoso
        } catch (e) {
            // El error ya fue manejado en handleSaveCore
        }
    };

    const handleSaveAndNext = async () => {
        try {
            await handleSaveCore();
            goToNextRequisito(); // Solo avanzamos si el guardado fue exitoso
        } catch (e) {
            // El error ya fue manejado en handleSaveCore
        }
    };

    return (
        <>
            <h2>{requisito?.id} - Requerimiento Operacional</h2>
            <p>{requisito?.requerimientoOperacional}</p>
            <p className="eval-suggestion">{requisito?.comoEvaluar}</p>
            <div className="form-group"><label>Resultado</label><select value={resultado} onChange={(e) => setResultado(e.target.value)} required><option value="" disabled>Seleccionar...</option><option value="C">Conforme (C)</option><option value="NC">No Conforme (NC)</option><option value="NO">No Observado (NO)</option></select></div>
            <div className="form-group"><label>Comentarios</label><textarea value={comentarios} onChange={(e) => setComentarios(e.target.value)} rows="3" /></div>
            <div className="form-group"><label>Adjuntar Archivo</label><input type="file" onChange={(e) => setAdjunto(e.target.files[0])} /></div>
            <div className="form-group"><label>Tomar/Subir Fotografía</label><input type="file" accept="image/*" capture onChange={(e) => setFoto(e.target.files[0])} /></div>
            <div className="modal-actions">
                <button onClick={onClose} className="btn btn-secondary" disabled={isSaving}>Cancelar</button>
                {hasNext ? (
                    <button onClick={handleSaveAndNext} className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar y Siguiente'}
                    </button>
                ) : (
                    <button onClick={handleSaveAndClose} className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar y Cargar'}
                    </button>
                )}
            </div>
        </>
    );
};

export default RequirementModalContent;