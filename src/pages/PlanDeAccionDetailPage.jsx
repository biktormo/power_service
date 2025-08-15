// src/pages/PlanDeAccionDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { firebaseServices } from '../firebase/services';
import ProtectedRoute from '../components/ProtectedRoute';
import { toast } from 'react-hot-toast';

const PlanDeAccionDetailPage = () => {
    const { resultadoId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [ncDetail, setNcDetail] = useState(null);
    const [actionPlan, setActionPlan] = useState(null);
    
    const [formData, setFormData] = useState({
        responsable: '',
        fechaCompromiso: '',
        accionesRecomendadas: '',
        estado: 'pendiente'
    });
    const [evidenceFile, setEvidenceFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const ncData = await firebaseServices.getSingleResult(resultadoId); // Necesitarás añadir getSingleResult a services
                const planData = await firebaseServices.getActionPlan(resultadoId);
                
                if (!ncData) {
                    toast.error("No Conformidad no encontrada.");
                    navigate('/planes-de-accion');
                    return;
                }

                setNcDetail(ncData);
                if (planData) {
                    setActionPlan(planData);
                    setFormData({
                        responsable: planData.responsable || '',
                        fechaCompromiso: planData.fechaCompromiso?.toDate().toISOString().split('T')[0] || '',
                        accionesRecomendadas: planData.accionesRecomendadas || '',
                        estado: planData.estado || 'pendiente'
                    });
                }
            } catch (error) {
                toast.error("Error al cargar los datos del plan.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [resultadoId, navigate]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setEvidenceFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.responsable || !formData.fechaCompromiso || !formData.accionesRecomendadas) {
            toast.error("Todos los campos del plan son obligatorios.");
            return;
        }
        setIsSaving(true);
        try {
            let newEvidence = null;
            if (evidenceFile) {
                toast.loading("Subiendo evidencia...");
                const path = `action-plans/${resultadoId}/${evidenceFile.name}`;
                newEvidence = await firebaseServices.uploadFile(evidenceFile, path);
            }
            
            const planData = {
                ...formData,
                fechaCompromiso: new Date(formData.fechaCompromiso),
                resultadoId: resultadoId,
                auditoriaId: ncDetail.auditoriaId,
                requisitoId: ncDetail.requisitoId,
                evidencias: actionPlan?.evidencias || [],
                actualizadoEn: serverTimestamp()
            };
            
            if (newEvidence) {
                planData.evidencias.push(newEvidence);
            }

            await firebaseServices.saveActionPlan(planData, actionPlan?.id);
            navigate('/planes-de-accion');
        } catch (error) {
            toast.error("Error al guardar el plan de acción.");
            console.error(error);
        } finally {
            toast.dismiss();
            setIsSaving(false);
        }
    };
    
    if (loading) return <div className="loading-spinner">Cargando Plan de Acción...</div>;

    return (
        <ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}>
            <div className="new-audit-container">
                <h1>Plan de Acción para NC: {ncDetail?.requisitoId}</h1>
                
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3>Detalle de la No Conformidad</h3>
                    <p><strong>Requerimiento:</strong> {ncDetail?.requerimientoOperacional}</p>
                    <p><strong>Comentarios de Auditoría:</strong> <em>"{ncDetail?.comentarios}"</em></p>
                </div>
                
                <form onSubmit={handleSubmit} className="card">
                    <h3>Gestionar Plan de Acción</h3>
                    <div className="form-group">
                        <label htmlFor="responsable">Responsable</label>
                        <input type="text" name="responsable" value={formData.responsable} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="fechaCompromiso">Fecha de Compromiso</label>
                        <input type="date" name="fechaCompromiso" value={formData.fechaCompromiso} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="accionesRecomendadas">Acciones Recomendadas</label>
                        <textarea name="accionesRecomendadas" value={formData.accionesRecomendadas} onChange={handleChange} rows="4" required></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="estado">Estado</label>
                        <select name="estado" value={formData.estado} onChange={handleChange}>
                            <option value="pendiente">Pendiente</option>
                            <option value="en_progreso">En Progreso</option>
                            <option value="completado">Completado</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="evidenceFile">Adjuntar Nueva Evidencia</label>
                        <input type="file" name="evidenceFile" onChange={handleFileChange} />
                    </div>

                    {actionPlan?.evidencias?.length > 0 && (
                        <div>
                            <h4>Evidencias Adjuntas</h4>
                            <ul>
                                {actionPlan.evidencias.map((ev, index) => (
                                    <li key={index}><a href={ev.url} target="_blank" rel="noopener noreferrer">{ev.name}</a></li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar Plan de Acción'}
                    </button>
                </form>
            </div>
        </ProtectedRoute>
    );
};

export default PlanDeAccionDetailPage;