// src/pages/InformeGraficoPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { firebaseServices } from '../firebase/services';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { toast } from 'react-hot-toast';
import { formatDate } from '../utils/exportUtils.js';

const InformeGraficoPage = () => {
    const { auditId } = useParams();
    const navigate = useNavigate();
    const [audit, setAudit] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auditId) {
            toast.error("ID de auditoría no válido.");
            navigate('/auditorias-5s');
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

    if (loading) return <div className="loading-spinner">Cargando informe...</div>;
    if (!audit) return (
        <div className="report-container" style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Auditoría no encontrada.</h2>
            <Link to="/auditorias-5s" className="btn btn-primary">Volver al Panel 5S</Link>
        </div>
    );

    const isRepuestos = audit.tipo5S === 'repuestos' || audit.numeroAuditoria?.startsWith('5SR');
    const tipoLabel = isRepuestos ? "5S Repuestos" : "5S Servicio";
    const nonConformities = (audit.resultados || []).filter(r => r.resultado === 'No Conforme' || r.resultado === 'NC');

    return (
        <ProtectedRoute>
            <div className="report-container" style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', backgroundColor: 'var(--surface-color)', borderRadius: '8px' }}>
                <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <span className="status-badge" style={{ backgroundColor: isRepuestos ? '#e67e22' : 'var(--primary-color)' }}>
                            {tipoLabel}
                        </span>
                        <h1 style={{ margin: '0.25rem 0' }}>Informe Gráfico de No Conformidades</h1>
                        <p style={{ margin: '0.25rem 0' }}><strong>Auditoría:</strong> {audit.numeroAuditoria} | <strong>Lugar:</strong> {audit.lugar}</p>
                        <p style={{ margin: 0, color: 'var(--text-secondary-color)' }}><strong>Auditor:</strong> {audit.auditor} | <strong>Fecha:</strong> {formatDate(audit.fecha || audit.creadoEn)}</p>
                    </div>
                    <div className="no-print" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate(-1)} className="btn btn-secondary">
                            ← Regresar
                        </button>
                        <Link to={`/auditorias-5s?tipo=${isRepuestos ? 'repuestos' : 'servicio'}`} className="btn btn-secondary">
                            Panel 5S
                        </Link>
                        <button className="btn btn-primary" onClick={() => window.print()}>
                            🖨️ Imprimir / Guardar PDF
                        </button>
                    </div>
                </div>

                <div className="nc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {nonConformities.length > 0 ? (
                        nonConformities.map(nc => (
                            <div key={nc.id} className="card nc-card" style={{ breakInside: 'avoid', pageBreakInside: 'avoid', borderLeft: '5px solid var(--danger-color)', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary-color)', textTransform: 'uppercase', fontWeight: 'bold' }}>{nc.seccion || 'Sección'}</span>
                                    <h4 style={{ margin: '0.25rem 0 0 0', color: 'var(--danger-color)' }}>Ítem {nc.itemId}: {nc.itemTexto}</h4>
                                </div>
                                
                                {nc.comentarios && (
                                    <p style={{ fontStyle: 'italic', color: 'var(--text-color)', marginBottom: '1rem' }}>
                                        <strong>Observación:</strong> "{nc.comentarios}"
                                    </p>
                                )}

                                {nc.adjuntos && nc.adjuntos.length > 0 ? (
                                    <div className="evidence-container" style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                                        <strong style={{ fontSize: '0.9rem' }}>Evidencia Fotográfica:</strong>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '0.5rem' }}>
                                            {nc.adjuntos.map((file, index) => (
                                                <div key={index}>
                                                    {(file.url.toLowerCase().includes('alt=media') || file.name?.match(/\.(jpeg|jpg|gif|png|webp)$/i)) ? (
                                                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                            <img 
                                                                src={file.url} 
                                                                alt={`Evidencia ${index + 1}`} 
                                                                style={{ 
                                                                    width: '100%', 
                                                                    maxHeight: '220px', 
                                                                    objectFit: 'cover', 
                                                                    borderRadius: '6px', 
                                                                    border: '1px solid var(--border-color)' 
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
                                    <p style={{ color: 'var(--text-secondary-color)', fontStyle: 'italic', marginTop: 'auto', fontSize: '0.9rem' }}>Sin evidencia gráfica adjunta.</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                            <h3 style={{ color: 'var(--success-color)' }}>¡Excelente trabajo!</h3>
                            <p>No se encontraron No Conformidades en esta auditoría {tipoLabel}.</p>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default InformeGraficoPage;
