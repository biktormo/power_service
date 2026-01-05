// src/pages/InformeGraficoPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { firebaseServices } from '../firebase/services';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { toast } from 'react-hot-toast';

const InformeGraficoPage = () => {
    const { auditId } = useParams();
    const navigate = useNavigate();
    const [audit, setAudit] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auditId) {
            toast.error("ID de auditoría no válido.");
            navigate('/dashboard');
            return;
        }
        const loadAudit = async () => {
            try {
                const auditData = await firebaseServices.getAuditoria5SWithResults(auditId);
                setAudit(auditData);
            } catch (error) {
                console.error("Error cargando auditoría 5S:", error);
                toast.error("Error al cargar el informe.");
            } finally {
                setLoading(false);
            }
        };
        loadAudit();
    }, [auditId, navigate]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="loading-spinner">Cargando informe...</div>;
    if (!audit) return <div className="report-container"><h2>Auditoría no encontrada.</h2><Link to="/dashboard">Volver al Dashboard</Link></div>;

    const nonConformities = audit.resultados.filter(r => r.resultado === 'No Conforme');

    return (
        <ProtectedRoute>
            <div className="report-container" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid #ddd', paddingBottom: '1rem' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>Informe Gráfico de No Conformidades</h1>
                        <p style={{ margin: '0.5rem 0' }}><strong>Auditoría:</strong> {audit.numeroAuditoria} | <strong>Lugar:</strong> {audit.lugar}</p>
                        <p style={{ margin: 0 }}><strong>Auditor:</strong> {audit.auditor} | <strong>Fecha:</strong> {audit.fecha.toDate().toLocaleDateString()}</p>
                    </div>
                    <button id="print-button" className="btn btn-primary no-print" onClick={handlePrint}>Imprimir / Guardar PDF</button>
                </div>

                <div className="nc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    {nonConformities.length > 0 ? (
                        nonConformities.map(nc => (
                            <div key={nc.id} className="card nc-card" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: 0, color: 'var(--danger-color)' }}>Ítem {nc.itemId}: {nc.itemTexto}</h4>
                                </div>
                                
                                {nc.comentarios && (
                                    <p style={{ fontStyle: 'italic', color: '#555', marginBottom: '1rem' }}>
                                        <strong>Observación:</strong> "{nc.comentarios}"
                                    </p>
                                )}

                                {/* SECCIÓN DE EVIDENCIAS MEJORADA */}
                                {nc.adjuntos && nc.adjuntos.length > 0 ? (
                                    <div className="evidence-container" style={{ marginTop: 'auto' }}>
                                        <strong>Evidencia Fotográfica:</strong>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '0.5rem' }}>
                                            {nc.adjuntos.map((file, index) => (
                                                <div key={index} style={{ position: 'relative' }}>
                                                    {/* Usamos la misma lógica robusta de detección de imágenes */}
                                                    {(file.url.toLowerCase().includes('alt=media') || file.name.match(/\.(jpeg|jpg|gif|png|webp)$/i)) ? (
                                                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                            <img 
                                                                src={file.url} 
                                                                alt={`Evidencia ${index + 1}`} 
                                                                className="evidence-image" 
                                                                style={{ 
                                                                    width: '100%', 
                                                                    maxHeight: '200px', 
                                                                    objectFit: 'cover', 
                                                                    borderRadius: '8px', 
                                                                    border: '1px solid #ccc' 
                                                                }} 
                                                            />
                                                        </a>
                                                    ) : (
                                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                                                            📄 Ver Archivo Adjunto
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p style={{ color: '#999', fontStyle: 'italic', marginTop: 'auto' }}>Sin evidencia gráfica adjunta.</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                            <h3 style={{ color: 'var(--success-color)' }}>¡Excelente!</h3>
                            <p>No se encontraron No Conformidades en esta auditoría.</p>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default InformeGraficoPage;
