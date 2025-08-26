// src/pages/InformeInteractivoPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { firebaseServices } from '../firebase/services';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

const InformeInteractivoPage = () => {
    const { auditId } = useParams();
    const [audit, setAudit] = useState(null);
    const [checklist, setChecklist] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const auditData = await firebaseServices.getAuditDetails(auditId);
                const resultsData = await firebaseServices.getAuditResults(auditId);
                const checklistData = await firebaseServices.getFullChecklist();
                
                // Unimos los resultados a la auditoría
                auditData.resultados = resultsData;
                
                setAudit(auditData);
                setChecklist(checklistData);
            } catch (error) {
                console.error("Error al cargar informe:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [auditId]);

    if (loading) return <div className="loading-spinner">Cargando informe...</div>;
    if (!audit) return <div>Auditoría no encontrada. <Link to="/dashboard">Volver</Link></div>;

    return (
        <ProtectedRoute>
            <div className="report-container" style={{ padding: '2rem' }}>
                <div className="report-header">
                    <div>
                        <h1>Informe de Auditoría: {audit.numeroAuditoria}</h1>
                        {/* ... (más detalles de la auditoría como en el PDF) ... */}
                    </div>
                    <button className="btn btn-primary" onClick={() => window.print()}>Imprimir</button>
                </div>

                {checklist && Object.values(checklist).map(pilar => (
                    <div key={pilar.id} className="dashboard-section" style={{ marginTop: '2rem' }}>
                        <h3>Pilar: {pilar.nombre} ({pilar.id})</h3>
                        {Object.values(pilar.estandares).map(estandar => (
                            <div key={estandar.id} style={{ marginLeft: '1rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '1rem', marginTop: '1rem' }}>
                                <h4>Estándar: {estandar.descripcion} ({estandar.id})</h4>
                                {estandar.requisitos
                                    .filter(req => audit.resultados[req.id]) // <-- AÑADIMOS ESTE FILTRO
                                    .map(req => {
                                        const result = audit.resultados[req.id];
                                        // Si el resultado es "Pendiente" (aunque no debería pasar con el filtro), lo saltamos
                                        if (!result || result.resultado === 'Pendiente') return null;

                                        return (
                                            <div key={req.id} className="card" style={{ marginBottom: '1rem' }}>
                                                <h5>{req.id} - {req.requerimientoOperacional}</h5>
                                                <p><strong>Resultado:</strong> {result.resultado}</p>
                                                {result.comentarios && <p><strong>Comentarios:</strong> <em>"{result.comentarios}"</em></p>}
                                                
                                                {result.adjuntos?.length > 0 && (
                                                    <div>
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
