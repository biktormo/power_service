// src/pages/PlanDeAccionDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firebaseServices } from '../firebase/services';
import { useAuth } from '../contexts/AuthContext.jsx';
import { toast } from 'react-hot-toast';
import { serverTimestamp } from 'firebase/firestore';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

const PlanDeAccionDetailPage = () => {
    const { tipo, resultadoId } = useParams();
    const navigate = useNavigate();
    const { userRole, user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [ncDetail, setNcDetail] = useState(null);
    const [requirementText, setRequirementText] = useState('');
    const [actionPlan, setActionPlan] = useState(null);
    
    const [formData, setFormData] = useState({
        responsable: '',
        fechaCompromiso: '',
        accionesRecomendadas: '',
    });
    
    const [colaboradorComentario, setColaboradorComentario] = useState('');
    const [evidenceFile, setEvidenceFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            let ncData;
            if (tipo === 'PS') {
                ncData = await firebaseServices.getSingleResult(resultadoId);
            } else if (tipo === '5S') {
                ncData = await firebaseServices.getSingleResultado5S(resultadoId);
            }

            if (!ncData) {
                toast.error("No Conformidad no encontrada.");
                navigate('/planes-de-accion');
                return;
            }
            setNcDetail(ncData);

            if (tipo === 'PS' && ncData.pilarId && ncData.estandarId && ncData.requisitoId) {
                const reqData = await firebaseServices.getSingleRequirement(ncData.pilarId, ncData.estandarId, ncData.requisitoId);
                if (reqData) setRequirementText(reqData.requerimientoOperacional);
            } else if (tipo === '5S') {
                setRequirementText(ncData.itemTexto);
            }
            
            const planData = await firebaseServices.getActionPlan(resultadoId);
            if (planData) {
                setActionPlan(planData);
                setFormData({
                    responsable: planData.responsable || '',
                    fechaCompromiso: planData.fechaCompromiso?.toDate().toISOString().split('T')[0] || '',
                    accionesRecomendadas: planData.accionesRecomendadas || '',
                });
            }
        } catch (error) {
            toast.error("Error al cargar los datos del plan.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => { loadData(); }, [resultadoId, navigate, tipo]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setEvidenceFile(e.target.files[0]);
    };

    const handleAuditorSubmitPlan = async (e) => {
        e.preventDefault();
        if (!formData.responsable || !formData.fechaCompromiso || !formData.accionesRecomendadas) {
            toast.error("Todos los campos del plan son obligatorios para crearlo/actualizarlo.");
            return;
        }
        setIsSaving(true);
        try {
            const planData = {
                ...(actionPlan || {}),
                ...formData,
                fechaCompromiso: new Date(formData.fechaCompromiso),
                resultadoId: resultadoId,
                auditId: tipo === 'PS' ? ncDetail.auditId : null,
                auditoria5SId: tipo === '5S' ? ncDetail.auditoria5SId : null,
                requisitoId: ncDetail.requisitoId || ncDetail.itemId,
                tipoAuditoria: tipo,
                actualizadoEn: serverTimestamp()
            };
            await firebaseServices.saveActionPlan(planData, actionPlan?.id);
            toast.success(actionPlan ? "Plan de acción actualizado." : "Plan de acción creado y asignado.");
            loadData();
        } catch (error) {
            toast.error("Error al guardar el plan de acción.");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleColaboradorSubmit = async (e) => {
        e.preventDefault();
        if (!colaboradorComentario) {
            toast.error("Debes añadir un comentario sobre el avance.");
            return;
        }
        setIsSaving(true);
        try {
            let newEvidenceUrl = null;
            if (evidenceFile) {
                toast.loading("Subiendo evidencia...");
                const path = `action-plans/${resultadoId}/evidencia_${Date.now()}_${evidenceFile.name}`;
                newEvidenceUrl = await firebaseServices.uploadFile(evidenceFile, path);
                toast.dismiss();
            }

            const nuevoAvance = {
                comentario: colaboradorComentario,
                autor: user.email,
                fecha: serverTimestamp(),
                evidencia: newEvidenceUrl
            };

            const avancesAnteriores = actionPlan?.avances || [];
            const planData = {
                ...actionPlan,
                estado: 'en_progreso',
                avances: [...avancesAnteriores, nuevoAvance],
                actualizadoEn: serverTimestamp()
            };
            
            await firebaseServices.saveActionPlan(planData, actionPlan.id);
            toast.success("Avance guardado y notificado al auditor.");
            setColaboradorComentario('');
            setEvidenceFile(null);
            loadData();
        } catch (error) {
            toast.error("Error al guardar el avance.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAuditorCloseNC = async () => {
        if (window.confirm("¿Seguro que deseas cerrar esta NC?")) {
            try {
                if (actionPlan) {
                    await firebaseServices.saveActionPlan({ ...actionPlan, estado: 'completado', actualizadoEn: serverTimestamp() }, actionPlan.id);
                }
                if (tipo === 'PS') {
                    await firebaseServices.closeNonConformity(resultadoId);
                } else if (tipo === '5S') {
                    await firebaseServices.closeNonConformity5S(resultadoId);
                }
                navigate('/planes-de-accion');
            } catch (error) { 
                toast.error("Error al cerrar la NC.");
                console.error(error);
            }
        }
    };
    
    if (loading) return <div className="loading-spinner">Cargando Plan de Acción...</div>;

    const isAuditorOrAdmin = userRole === 'administrador' || userRole === 'auditor';

    return (
        <ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}>
            <div className="new-audit-container">
                <h1>Plan de Acción para NC: {ncDetail?.requisitoId || `Ítem ${ncDetail?.itemId}`}</h1>
                
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3>Detalle de la No Conformidad</h3>
                    <p><strong>Requerimiento:</strong> {requirementText}</p>
                    <p><strong>Comentarios de Auditoría:</strong> <em>"{ncDetail?.comentarios}"</em></p>
                    {ncDetail?.adjuntos && ncDetail.adjuntos.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            <h4>Evidencias de la Auditoría:</h4>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {ncDetail.adjuntos.map((file, index) => (
                                    file.url.match(/\.(jpeg|jpg|gif|png)$/i)
                                        ? <a key={index} href={file.url} target="_blank" rel="noopener noreferrer">
                                            <img src={file.url} alt={file.name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                                          </a>
                                        : <a key={index} href={file.url} target="_blank" rel="noopener noreferrer">{file.name}</a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                {isAuditorOrAdmin && (
                    <form onSubmit={handleAuditorSubmitPlan} className="card" style={{marginBottom: '2rem'}}>
                        <h3>{actionPlan ? "Editar Plan de Acción" : "Crear Plan de Acción"} (Auditor/Admin)</h3>
                        <div className="form-group">
                            <label htmlFor="responsable">Asignar Responsable</label>
                            <input type="text" id="responsable" name="responsable" value={formData.responsable} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="fechaCompromiso">Fecha de Compromiso</label>
                            <input type="date" id="fechaCompromiso" name="fechaCompromiso" value={formData.fechaCompromiso} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="accionesRecomendadas">Acciones Recomendadas</label>
                            <textarea id="accionesRecomendadas" name="accionesRecomendadas" value={formData.accionesRecomendadas} onChange={handleChange} rows="4" required></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                            {isSaving ? 'Guardando...' : (actionPlan ? 'Actualizar Plan' : 'Crear y Asignar Plan')}
                        </button>
                    </form>
                )}

                {actionPlan ? (
                    <div className="card">
                        <h3>Seguimiento del Plan (Colaborador)</h3>
                        {!isAuditorOrAdmin && (
                            <>
                                <p><strong>Responsable:</strong> {actionPlan.responsable}</p>
                                <p><strong>Fecha Compromiso:</strong> {actionPlan.fechaCompromiso?.toDate().toLocaleDateString()}</p>
                                <p><strong>Acciones Recomendadas:</strong> {actionPlan.accionesRecomendadas}</p>
                            </>
                        )}
                        
                        {actionPlan.avances?.length > 0 && (
                            <div style={{marginTop: '1.5rem'}}>
                                <h4>Historial de Avances:</h4>
                                {actionPlan.avances.map((avance, index) => (
                                     <div key={index} className="card" style={{backgroundColor: 'var(--background-color)', marginTop: '1rem'}}>
                                        <p><em>"{avance.comentario}"</em></p>
                                        <small>{avance.autor} - {avance.fecha?.toDate().toLocaleString() || 'Fecha pendiente'}</small>
                                        {avance.evidencia && <a href={avance.evidencia.url} target="_blank" rel="noopener noreferrer" style={{display: 'block', marginTop: '0.5rem'}}>Ver Evidencia Adjunta</a>}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <form onSubmit={handleColaboradorSubmit} style={{marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem'}}>
                            <div className="form-group">
                                <label htmlFor="colaboradorComentario">Añadir Nuevo Avance / Comentario:</label>
                                <textarea id="colaboradorComentario" value={colaboradorComentario} onChange={e => setColaboradorComentario(e.target.value)} rows="3" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="evidenceFile">Adjuntar Nueva Evidencia:</label>
                                <input type="file" id="evidenceFile" onChange={e => setEvidenceFile(e.target.files[0])} />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                {isSaving ? 'Guardando...' : 'Guardar Avance y Notificar'}
                            </button>
                        </form>
                    </div>
                ) : (
                    !isAuditorOrAdmin && <div className="card"><p>El plan de acción para esta No Conformidad aún no ha sido creado por un auditor.</p></div>
                )}
                
                {isAuditorOrAdmin && actionPlan && (
                    <div className="card" style={{ marginTop: '2rem', borderColor: 'var(--success-color)' }}>
                        <h3>Revisión y Cierre (Auditor / Admin)</h3>
                        <p>Al hacer clic aquí, el plan de acción se marcará como completado y el punto de la auditoría original se cambiará a "NC Cerrada".</p>
                        <button onClick={handleAuditorCloseNC} className="btn" style={{ backgroundColor: 'var(--success-color)', color: 'white' }}>
                            Aprobar y Cerrar No Conformidad
                        </button>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
};

export default PlanDeAccionDetailPage;
