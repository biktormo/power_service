// src/pages/Informe5SPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { firebaseServices } from '../firebase/services';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportToPDF5S, exportToXLS5S, formatDate } from '../utils/exportUtils.js';

const Informe5SPage = () => {
    const { auditId } = useParams();
    const navigate = useNavigate();
    const [audit, setAudit] = useState(null);
    const [checklist, setChecklist] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const auditData = await firebaseServices.getAuditoria5SWithResults(auditId);
                setAudit(auditData);
                if (auditData) {
                    const isRepuestos = auditData.tipo5S === 'repuestos' || auditData.numeroAuditoria?.startsWith('5SR');
                    const checklistData = isRepuestos 
                        ? firebaseServices.get5SRepuestosChecklist(auditData.lugar)
                        : firebaseServices.get5SChecklist();
                    setChecklist(checklistData);
                }
            } catch (error) {
                console.error("Error al cargar informe 5S:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [auditId]);

    const stats = useMemo(() => {
        if (!audit || !audit.resultados) return null;
        const auditados = audit.resultados.filter(r => r.resultado === 'Conforme' || r.resultado === 'No Conforme' || r.resultado === 'NC Cerrada');
        const conformes = auditados.filter(r => r.resultado === 'Conforme').length;
        const noConformes = auditados.filter(r => r.resultado === 'No Conforme').length;
        const ncCerradas = auditados.filter(r => r.resultado === 'NC Cerrada').length;
        const total = auditados.length;
        const porcentaje = total > 0 ? (((conformes + ncCerradas) / total) * 100).toFixed(1) : 0;

        return { total, conformes, noConformes, ncCerradas, porcentaje };
    }, [audit]);

    const pieData = useMemo(() => {
        if (!stats) return [];
        return [
            { name: 'Conforme', value: stats.conformes },
            { name: 'No Conforme', value: stats.noConformes },
            { name: 'NC Cerrada', value: stats.ncCerradas }
        ].filter(d => d.value > 0);
    }, [stats]);

    const COLORS = { 'Conforme': '#28a745', 'No Conforme': '#dc3545', 'NC Cerrada': '#00C49F' };

    if (loading) return <div className="loading-spinner">Cargando informe 5S...</div>;
    if (!audit || !checklist) return (
        <div className="report-container" style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Auditoría no encontrada.</h2>
            <Link to="/auditorias-5s" className="btn btn-primary">Volver al Panel 5S</Link>
        </div>
    );

    const isRepuestos = audit.tipo5S === 'repuestos' || audit.numeroAuditoria?.startsWith('5SR');
    const tipoLabel = isRepuestos ? "5S Repuestos" : "5S Servicio";

    return (
        <ProtectedRoute>
            <div className="report-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', backgroundColor: 'var(--surface-color)', borderRadius: '8px' }}>
                
                {/* ENCABEZADO */}
                <div className="report-header" style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <span className="status-badge" style={{ backgroundColor: isRepuestos ? '#e67e22' : 'var(--primary-color)' }}>
                            {tipoLabel}
                        </span>
                        <h1 style={{ margin: '0.25rem 0' }}>Informe de Auditoría {tipoLabel}</h1>
                        <h3 style={{ margin: 0, color: 'var(--text-secondary-color)' }}>{audit.numeroAuditoria}</h3>
                    </div>
                    <div className="no-print" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate(-1)} className="btn btn-secondary">
                            ← Regresar
                        </button>
                        <Link to={`/auditorias-5s?tipo=${isRepuestos ? 'repuestos' : 'servicio'}`} className="btn btn-secondary">
                            Panel 5S
                        </Link>
                        <button className="btn btn-secondary" onClick={() => exportToXLS5S(audit, checklist)}>
                            📊 Exportar XLS
                        </button>
                        <button className="btn btn-secondary" onClick={() => exportToPDF5S(audit, checklist)}>
                            📄 Descargar PDF
                        </button>
                        <button className="btn btn-primary" onClick={() => window.print()}>
                            🖨️ Imprimir
                        </button>
                    </div>
                </div>

                {/* DATOS GENERALES */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <p><strong>Lugar / Sucursal:</strong> {audit.lugar}</p>
                        <p><strong>Fecha:</strong> {formatDate(audit.fecha || audit.creadoEn)}</p>
                        <p><strong>Auditor:</strong> {audit.auditor}</p>
                        <p><strong>Estado:</strong> <span className={`status-badge status-${audit.estado}`}>{audit.estado === 'finalizada' ? 'Finalizada' : 'En Progreso'}</span></p>
                        <p><strong>Puntuación de Conformidad:</strong> <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{stats?.porcentaje || 0}%</span></p>
                    </div>
                </div>

                {/* GRÁFICOS Y RESUMEN */}
                <div className="dashboard-grid" style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                    <div className="card">
                        <h4>Distribución de Resultados</h4>
                        <div style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="card">
                        <h4>Resumen Numérico</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            <li style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                <strong>Total Ítems Auditados:</strong> {stats?.total || 0}
                            </li>
                            <li style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)', color: COLORS['Conforme'] }}>
                                <strong>Conformes:</strong> {stats?.conformes || 0}
                            </li>
                            <li style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)', color: COLORS['No Conforme'] }}>
                                <strong>No Conformes:</strong> {stats?.noConformes || 0}
                            </li>
                            <li style={{ padding: '0.6rem 0', color: COLORS['NC Cerrada'] }}>
                                <strong>NC Cerradas:</strong> {stats?.ncCerradas || 0}
                            </li>
                        </ul>
                    </div>
                </div>

                {/* DETALLE DE LA AUDITORÍA */}
                {Object.entries(checklist).map(([seccion, items]) => (
                    <div key={seccion} style={{ marginBottom: '2rem', pageBreakInside: 'auto' }}>
                        <h3 style={{ borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', color: 'var(--primary-color)' }}>
                            {seccion}
                        </h3>
                        {items.map(item => {
                            const result = (audit.resultados || []).find(r => String(r.itemId) === String(item.id));
                            const statusColor = result ? COLORS[result.resultado] || 'var(--text-secondary-color)' : 'var(--text-secondary-color)';
                            
                            return (
                                <div key={item.id} style={{ 
                                    marginBottom: '1rem', 
                                    padding: '1rem', 
                                    border: '1px solid var(--border-color)', 
                                    borderRadius: '8px',
                                    borderLeft: `5px solid ${statusColor}`,
                                    backgroundColor: 'var(--surface-color)',
                                    pageBreakInside: 'avoid'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <strong style={{ fontSize: '1rem' }}>{item.id}. {item.text}</strong>
                                        <span style={{ fontWeight: 'bold', color: statusColor }}>{result?.resultado || 'Pendiente'}</span>
                                    </div>
                                    
                                    {result?.comentarios && (
                                        <p style={{ fontStyle: 'italic', color: 'var(--text-secondary-color)', margin: '0.5rem 0' }}>
                                            <strong>Observación:</strong> "{result.comentarios}"
                                        </p>
                                    )}

                                    {/* Evidencias */}
                                    {result?.adjuntos && result.adjuntos.length > 0 && (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            <strong style={{ fontSize: '0.9rem' }}>Evidencias:</strong>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '0.5rem' }}>
                                                {result.adjuntos.map((file, idx) => (
                                                    <div key={idx} style={{ textAlign: 'center' }}>
                                                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                            {(file.url.toLowerCase().includes('alt=media') || file.name?.match(/\.(jpeg|jpg|gif|png|webp)$/i)) ? (
                                                                <img 
                                                                    src={file.url} 
                                                                    alt="Evidencia" 
                                                                    style={{ 
                                                                        width: '200px', 
                                                                        height: '150px', 
                                                                        objectFit: 'cover', 
                                                                        borderRadius: '6px', 
                                                                        border: '1px solid var(--border-color)',
                                                                        display: 'block',
                                                                        marginBottom: '4px'
                                                                    }} 
                                                                />
                                                            ) : (
                                                                <div style={{ 
                                                                    width: '200px', 
                                                                    height: '150px', 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    justifyContent: 'center', 
                                                                    border: '1px solid var(--border-color)', 
                                                                    borderRadius: '6px',
                                                                    backgroundColor: 'var(--background-color)',
                                                                    fontSize: '2rem'
                                                                }}>
                                                                    📄
                                                                </div>
                                                            )}
                                                            <span style={{ fontSize: '0.8em', color: 'var(--primary-color)' }}>Ver adjunto</span>
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}

                {/* FIRMAS */}
                <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-around', pageBreakInside: 'avoid' }}>
                    <div style={{ textAlign: 'center', width: '40%' }}>
                        <div style={{ borderBottom: '1px solid var(--text-color)', marginBottom: '0.5rem', height: '50px' }}></div>
                        <p style={{ margin: 0 }}>Firma Auditor</p>
                    </div>
                    <div style={{ textAlign: 'center', width: '40%' }}>
                        <div style={{ borderBottom: '1px solid var(--text-color)', marginBottom: '0.5rem', height: '50px' }}></div>
                        <p style={{ margin: 0 }}>Firma Responsable Sucursal</p>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default Informe5SPage;
