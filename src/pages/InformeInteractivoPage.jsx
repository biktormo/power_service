// src/pages/InformeInteractivoPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { firebaseServices } from '../firebase/services';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { formatDate } from '../utils/exportUtils.js';

const InformeInteractivoPage = () => {
    const { auditId } = useParams();
    const navigate = useNavigate();
    const [audit, setAudit] = useState(null);
    const [checklist, setChecklist] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const auditData = await firebaseServices.getAuditDetails(auditId);
                const resultsData = await firebaseServices.getAuditResults(auditId);
                const checklistData = await firebaseServices.getFullChecklist();
                
                if (auditData) {
                    auditData.resultados = resultsData;
                }
                
                setAudit(auditData);
                setChecklist(checklistData);
            } catch (error) {
                console.error("Error al cargar informe interactivo PS:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [auditId]);

    if (loading) return <div className="loading-spinner">Cargando informe...</div>;
    if (!audit) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Auditoría no encontrada.</h2>
            <Link to="/power-service" className="btn btn-primary">Volver a Power Service</Link>
        </div>
    );

    return (
        <ProtectedRoute>
            <div className="report-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <span className="status-badge status-en_progreso">Power Service</span>
                        <h1 style={{ margin: '0.25rem 0' }}>Informe de Auditoría: {audit.numeroAuditoria}</h1>
                        <p style={{ margin: 0, color: 'var(--text-secondary-color)' }}>
                            <strong>Lugar:</strong> {audit.lugar} | <strong>Auditores:</strong> {audit.auditores?.join(', ')} | <strong>Fecha:</strong> {formatDate(audit.fechaCreacion)}
                        </p>
                    </div>
                    <div className="no-print" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate(-1)} className="btn btn-secondary">← Regresar</button>
                        <Link to="/power-service" className="btn btn-secondary">Power Service</Link>
                        <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Imprimir</button>
                    </div>
                </div>

                {checklist && Object.values(checklist).map(pilar => (
                    <div key={pilar.id} className="dashboard-section" style={{ marginTop: '2rem' }}>
                        <h3 style={{ borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem' }}>Pilar: {pilar.nombre} ({pilar.id})</h3>
                        {Object.values(pilar.estandares || {}).map(estandar => (
                            <div key={estandar.id} style={{ marginLeft: '1rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '1rem', marginTop: '1rem' }}>
                                <h4>Estándar: {estandar.descripcion} ({estandar.id})</h4>
                                {(estandar.requisitos || [])
                                    .filter(req => audit.resultados?.[req.id])
                                    .map(req => {
                                        const result = audit.resultados[req.id];
                                        if (!result || result.resultado === 'Pendiente') return null;

                                        return (
                                            <div key={req.id} className="card" style={{ marginBottom: '1rem', borderLeft: result.resultado === 'C' ? '4px solid var(--success-color)' : result.resultado === 'NC' ? '4px solid var(--danger-color)' : '4px solid var(--warning-color)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <h5 style={{ margin: 0 }}>{req.id} - {req.requerimientoOperacional}</h5>
                                                    <span className={`status-badge ${result.resultado === 'C' ? 'status-cerrada' : result.resultado === 'NC' ? 'status-pendiente' : 'status-en_progreso'}`}>
                                                        {result.resultado === 'C' ? 'Conforme' : result.resultado === 'NC' ? 'No Conforme' : result.resultado}
                                                    </span>
                                                </div>
                                                {result.comentarios && <p style={{ fontStyle: 'italic', margin: '0.5rem 0' }}><strong>Comentarios:</strong> "{result.comentarios}"</p>}
                                                
                                                {result.adjuntos?.length > 0 && (
                                                    <div style={{ marginTop: '0.5rem' }}>
                                                        <strong>Evidencias:</strong>
                                                        <div className="evidence-grid">
                                                            {result.adjuntos.map((file, index) => (
                                                                <a key={index} href={file.url} target="_blank" rel="noopener noreferrer" title={file.name}>
                                                                    <img src={file.url} alt={file.name} className="evidence-thumbnail" />
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </ProtectedRoute>
    );
};

export default InformeInteractivoPage;
