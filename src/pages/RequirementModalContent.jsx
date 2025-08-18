// src/pages/RequirementModalContent.jsx

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { serverTimestamp } from 'firebase/firestore';
import { firebaseServices } from '../firebase/services'; // Asegúrate de que esta ruta sea correcta

const RequirementModalContent = ({ requisito, onSave, onClose, auditId, existingResult }) => {
    if (!requisito) {
        return <div className="loading-spinner">Cargando requisito...</div>;
    }

    const [resultado, setResultado] = useState(existingResult?.resultado || '');
    const [comentarios, setComentarios] = useState(existingResult?.comentarios || '');
    const [foto, setFoto] = useState(null);
    const [adjunto, setAdjunto] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!resultado) {
            toast.error("Debes seleccionar un resultado (C, NC, o NO).");
            return;
        }
        setIsSaving(true);
        
        try {
            // Preparamos todos los datos antes de enviarlos
            let adjuntosArray = existingResult?.adjuntos || [];

            if (foto) {
                const path = `audits/${auditId}/${requisito.id}/foto_${Date.now()}_${foto.name}`;
                const fotoData = await firebaseServices.uploadFile(foto, path);
                const existingFotoIndex = adjuntosArray.findIndex(a => a.type === 'foto');
                if (existingFotoIndex > -1) {
                    adjuntosArray[existingFotoIndex] = { ...fotoData, type: 'foto' };
                } else {
                    adjuntosArray.push({ ...fotoData, type: 'foto' });
                }
            }

            if (adjunto) {
                const path = `audits/${auditId}/${requisito.id}/adjunto_${Date.now()}_${adjunto.name}`;
                const adjuntoData = await firebaseServices.uploadFile(adjunto, path);
                const existingAdjuntoIndex = adjuntosArray.findIndex(a => a.type === 'adjunto');
                if (existingAdjuntoIndex > -1) {
                    adjuntosArray[existingAdjuntoIndex] = { ...adjuntoData, type: 'adjunto' };
                } else {
                    adjuntosArray.push({ ...adjuntoData, type: 'adjunto' });
                }
            }

            const dataToSave = {
                auditId,
                requisitoId: requisito.id,
                pilarId: requisito.pilarId,
                estandarId: requisito.estandarId,
                resultado,
                comentarios,
                adjuntos: adjuntosArray,
                fechaResultado: serverTimestamp(),
            };

            // Llamamos a la función onSave del padre con todos los datos listos
            await onSave(dataToSave, existingResult);

        } catch (error) {
            toast.error("Error al preparar o subir archivos.");
            console.error("Error en handleSave de RequirementModalContent:", error);
            setIsSaving(false); // Liberamos el botón si hay un error
        }
        // No cambiamos isSaving a false aquí, porque el padre se encargará de recargar
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
                <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar y Cargar'}</button>
            </div>
        </>
    );
};

export default RequirementModalContent;