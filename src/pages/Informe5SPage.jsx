// src/pages/Informe5SPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { firebaseServices } from '../firebase/services';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const Informe5SPage = () => {
    const { auditId } = useParams();
    const [audit, setAudit] = useState(null);
    const [checklist, setChecklist] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const auditData = await firebaseServices.getAuditoria5SWithResults(auditId);
                setAudit(auditData);
                const checklistData = firebaseServices.get5SChecklist();
                setChecklist(checklistData);
            } catch (error) {
                console.error("Error al cargar informe:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [auditId]);

    const stats = useMemo(() => {
        if (!audit) return null;
        const auditados = audit.resultados.filter(r => r.resultado === 'Conforme' || r.resultado === 'No Conforme' || r.resultado === 'NC Cerrada');
        const conformes = auditados.filter(r => r.resultado === 'Conforme').length;
        const noConformes = auditados.filter(r => r.resultado === 'No Conforme').length;
        const ncCerradas = auditados.filter(r => r.resultado === 'NC Cerrada').length;
        const total = auditados.length;
        const porcentaje = total > 0 ? ((conformes + ncCerradas) / total * 100).toFixed(1) : 0;

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

    if (loading) return <div className="loading-spinner">Cargando informe...</div>;
    if (!audit) return <div className="report-container"><h2>Auditoría no encontrada.</h2><Link to="/dashboard">Volver</Link></div>;

    return (
        <ProtectedRoute>
            <div className="report-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', backgroundColor: 'white' }}>
                
                {/* ENCABEZADO (Solo visible en pantalla y al imprimir) */}
                <div className="report-header" style={{ borderBottom: '2px solid #ccc', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ margin: 0, color: '#333' }}>Informe de Auditoría 5S</h1>
                        <h3 style={{ margin: '0.5rem 0', color: '#666' }}>{audit.numeroAuditoria}</h3>
                    </div>
                    <div className="no-print">
                        <button className="btn btn-primary" onClick={() => window.print()}>Imprimir / Guardar PDF</button>
                    </div>
                </div>

                {/* DATOS GENERALES */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <p><strong>Lugar:</strong> {audit.lugar}</p>
                        <p><strong>Fecha:</strong> {audit.fecha.toDate().toLocaleDateString()}</p>
                        <p><strong>Auditor:</strong> {audit.auditor}</p>
                        <p><strong>Puntuación Final:</strong> <span style={{ fontSize: '1.2em', fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.porcentaje}%</span></p>
                    </div>
                </div>

                {/* GRÁFICOS Y RESUMEN */}
                <div className="dashboard-grid" style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
                    <div className="card">
                        <h4>Distribución de Resultados</h4>
                        <div style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />)}
                                    </Pie>
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="card">
                        <h4>Resumen Numérico</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}><strong>Total Ítems Auditados:</strong> {stats.total}</li>
                            <li style={{ padding: '0.5rem', borderBottom: '1px solid #eee', color: COLORS['Conforme'] }}><strong>Conformes:</strong> {stats.conformes}</li>
                            <li style={{ padding: '0.5rem', borderBottom: '1px solid #eee', color: COLORS['No Conforme'] }}><strong>No Conformes:</strong> {stats.noConformes}</li>
                            <li style={{ padding: '0.5rem', borderBottom: '1px solid #eee', color: COLORS['NC Cerrada'] }}><strong>NC Cerradas:</strong> {stats.ncCerradas}</li>
                        </ul>
                    </div>
                </div>

                {/* DETALLE DE LA AUDITORÍA */}
                {Object.entries(checklist).map(([seccion, items]) => (
                    <div key={seccion} style={{ marginBottom: '2rem', pageBreakInside: 'auto' }}>
                        <h3 style={{ borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', color: 'var(--primary-color)' }}>{seccion}</h3>
                        {items.map(item => {
                            const result = audit.resultados.find(r => r.itemId === item.id);
                            const statusColor = result ? COLORS[result.resultado] || '#6c757d' : '#6c757d';
                            
                            return (
                                <div key={item.id} style={{ 
                                    marginBottom: '1rem', 
                                    padding: '1rem', 
                                    border: '1px solid #eee', 
                                    borderRadius: '8px',
                                    borderLeft: `5px solid ${statusColor}`,
                                    pageBreakInside: 'avoid' // Intenta no cortar el ítem entre páginas
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <strong>{item.id}. {item.text}</strong>
                                        <span style={{ fontWeight: 'bold', color: statusColor }}>{result?.resultado || 'Pendiente'}</span>
                                    </div>
                                    
                                    {result?.comentarios && (
                                        <p style={{ fontStyle: 'italic', color: '#666', margin: '0.5rem 0' }}>
                                            <strong>Comentario:</strong> "{result.comentarios}"
                                        </p>
                                    )}

                                    {/* EVIDENCIAS (FOTOS) */}
                                    {result?.adjuntos?.length > 0 && (
                                        <div style={{ marginTop: '1rem' }}>
                                            <strong>Evidencias:</strong>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '0.5rem' }}>
                                                {result.adjuntos.map((file, idx) => (
                                                    file.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                                        <img key={idx} src={file.url} alt="Evidencia" style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                                                    ) : (
                                                        <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer">Ver Archivo</a>
                                                    )
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
                        <div style={{ borderBottom: '1px solid #000', marginBottom: '0.5rem', height: '50px' }}></div>
                        <p>Firma Auditor</p>
                    </div>
                    <div style={{ textAlign: 'center', width: '40%' }}>
                        <div style={{ borderBottom: '1px solid #000', marginBottom: '0.5rem', height: '50px' }}></div>
                        <p>Firma Responsable Sucursal</p>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default Informe5SPage;