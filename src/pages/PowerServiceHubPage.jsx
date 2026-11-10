// src/pages/PowerServiceHubPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { firebaseServices } from '../firebase/services';
import { toast } from 'react-hot-toast';
import { exportToPDF, exportToXLS, formatDate } from '../utils/exportUtils.js';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { PILARES_ORDER } from '../utils/ordering.js';
import NCModal from '../components/NCModal.jsx';
import RankingNCRecurrentes from '../components/RankingNCRecurrentes.jsx';

const PowerServiceHubPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('resumen'); // 'resumen' | 'progreso' | 'finalizadas' | 'resultados' | 'planes'

    // Datos
    const [allAudits, setAllAudits] = useState([]);
    const [allResults, setAllResults] = useState([]);
    const [actionPlans, setActionPlans] = useState([]);
    const [fullChecklist, setFullChecklist] = useState({});
    const [pilaresList, setPilaresList] = useState([]);
    const [totalRequisitosPS, setTotalRequisitosPS] = useState(0);
    const [selectedNcAudit, setSelectedNcAudit] = useState(null);

    // Filtros de Gráficos
    const [selectedAuditId, setSelectedAuditId] = useState('');
    const [selectedPilar, setSelectedPilar] = useState('');
    const [selectedRequisito, setSelectedRequisito] = useState('');
    const [requisitosList, setRequisitosList] = useState([]);
    const [selectedPeriod, setSelectedPeriod] = useState('6m');

    // Carga de Datos Rápida y Optimizada
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Checklist y pilares se resuelven de inmediato (0ms desde caché)
                const checklist = await firebaseServices.getFullChecklist();
                const pilares = Object.values(checklist || {}).map(p => ({ id: p.id, nombre: p.nombre }));

                let totalReqs = 0;
                if (checklist) {
                    Object.values(checklist).forEach(pilar => {
                        Object.values(pilar.estandares || {}).forEach(estandar => {
                            totalReqs += (estandar.requisitos || []).length;
                        });
                    });
                }
                setFullChecklist(checklist);
                setPilaresList(pilares);
                setTotalRequisitosPS(totalReqs || 144);

                // Auditorías y Planes cargados en paralelo
                const auditsPromise = firebaseServices.getAllAuditsWithResults().catch(() => []);
                const plansPromise = firebaseServices.getAllActionPlans().catch(() => []);

                const [audits, plans] = await Promise.all([auditsPromise, plansPromise]);

                const results = audits.flatMap(a => (a.resultados || []).map(r => ({ ...r, lugar: a.lugar, fechaCreacion: a.fechaCreacion })));

                setAllAudits(audits);
                setAllResults(results);
                setActionPlans(plans);

                if (audits.length > 0) {
                    setSelectedAuditId(audits[0].id);
                }
            } catch (error) {
                console.error("Error al cargar datos de Power Service:", error);
                toast.error("Error al cargar los datos.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const reloadActionPlans = async () => {
        try {
            const plans = await firebaseServices.getAllActionPlans().catch(() => []);
            setActionPlans(plans);
        } catch (e) {}
    };

    // Actualizar lista de requisitos al cambiar pilar
    useEffect(() => {
        if (selectedPilar && fullChecklist[selectedPilar]) {
            const reqs = Object.values(fullChecklist[selectedPilar].estandares || {}).flatMap(e => e.requisitos || []);
            setRequisitosList(reqs);
        } else {
            setRequisitosList([]);
        }
        setSelectedRequisito('');
    }, [selectedPilar, fullChecklist]);

    // Segmentación de auditorías: En Progreso vs Finalizadas
    const auditsEnProgreso = useMemo(() => {
        return allAudits.filter(a => a.estado === 'abierta' || a.estado === 'en_progreso' || !a.estado);
    }, [allAudits]);

    const auditsFinalizadas = useMemo(() => {
        return allAudits.filter(a => a.estado === 'cerrada' || a.estado === 'finalizada');
    }, [allAudits]);

    // Planes de acción filtrados para PS
    const planesPS = useMemo(() => {
        return actionPlans.filter(p => p.tipoAuditoria === 'PS');
    }, [actionPlans]);

    // Estadísticas generales de PS
    const stats = useMemo(() => {
        const resultCounts = { C: 0, NC: 0, NO: 0, "NC Cerrada": 0 };
        allResults.forEach(r => { 
            if (resultCounts[r.resultado] !== undefined) resultCounts[r.resultado]++; 
        });
        
        const planCounts = { pendiente: 0, en_progreso: 0, completado: 0 };
        planesPS.forEach(p => { 
            if (planCounts[p.estado] !== undefined) planCounts[p.estado]++; 
        });

        const totalAuditados = resultCounts.C + resultCounts.NC + resultCounts["NC Cerrada"];
        const tasaConformidad = totalAuditados > 0 
            ? (((resultCounts.C + resultCounts["NC Cerrada"]) / totalAuditados) * 100).toFixed(1)
            : 0;
        
        return { ...resultCounts, ...planCounts, tasaConformidad, totalAuditados };
    }, [allResults, planesPS]);

    // Gráfico de distribución de la auditoría seleccionada
    const auditPieData = useMemo(() => {
        if (!selectedAuditId) return [];
        const audit = allAudits.find(a => a.id === selectedAuditId);
        if (!audit || !audit.resultados || audit.resultados.length === 0) return [];
        
        const counts = { C: 0, NC: 0, NO: 0, "NC Cerrada": 0 };
        audit.resultados.forEach(r => { if (counts[r.resultado] !== undefined) counts[r.resultado]++; });
        
        const total = audit.resultados.length;
        return Object.entries(counts).map(([name, value]) => ({ 
            name, value, percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0 
        })).filter(e => e.value > 0);
    }, [selectedAuditId, allAudits]);

    // Comparativa por sucursal
    const branchComparisonData = useMemo(() => {
        const data = {
            Charata: { name: 'Charata', C: 0, NC: 0, NO: 0, "NC Cerrada": 0 },
            Bandera: { name: 'Bandera', C: 0, NC: 0, NO: 0, "NC Cerrada": 0 },
            Quimili: { name: 'Quimili', C: 0, NC: 0, NO: 0, "NC Cerrada": 0 },
        };
        allResults.forEach(r => {
            if (data[r.lugar] && data[r.lugar][r.resultado] !== undefined) {
                data[r.lugar][r.resultado]++;
            }
        });
        return Object.values(data);
    }, [allResults]);

    // Gráfico de Conformidad por Pilar
    const pilarPerformanceData = useMemo(() => {
        if (!fullChecklist || allResults.length === 0) return [];
        return PILARES_ORDER.map(pilarId => {
            const pilar = fullChecklist[pilarId];
            if (!pilar) return null;
            const pilarResults = allResults.filter(r => r.pilarId === pilarId);
            const conformes = pilarResults.filter(r => r.resultado === 'C' || r.resultado === 'NC Cerrada').length;
            const total = pilarResults.filter(r => r.resultado === 'C' || r.resultado === 'NC' || r.resultado === 'NC Cerrada').length;
            const tasa = total > 0 ? Math.round((conformes / total) * 100) : 0;
            return {
                pilar: pilar.nombre || pilarId,
                conformidad: tasa,
                evaluados: total
            };
        }).filter(Boolean);
    }, [fullChecklist, allResults]);

    // Historial por Requisito
    const requirementHistoryData = useMemo(() => {
        if (!selectedRequisito) return [];
        const now = new Date();
        const periodLimit = new Date();
        if (selectedPeriod === '6m') periodLimit.setMonth(now.getMonth() - 6);
        if (selectedPeriod === '1y') periodLimit.setFullYear(now.getFullYear() - 1);
        return allResults
            .filter(r => r.requisitoId === selectedRequisito && r.fechaCreacion?.toDate && r.fechaCreacion.toDate() >= periodLimit)
            .map(r => ({
                date: formatDate(r.fechaCreacion),
                C: r.resultado === 'C' ? 1 : 0, 
                NC: r.resultado === 'NC' ? 1 : 0,
                NO: r.resultado === 'NO' ? 1 : 0, 
                "NC Cerrada": r.resultado === 'NC Cerrada' ? 1 : 0,
            }));
    }, [selectedRequisito, selectedPeriod, allResults]);

    const COLORS = { C: 'var(--success-color)', NC: 'var(--danger-color)', NO: 'var(--warning-color)', "NC Cerrada": '#00C49F' };
    const selectedAuditForExport = allAudits.find(a => a.id === selectedAuditId);

    const getAuditedPilaresPS = (resultados) => {
        if (!resultados || resultados.length === 0) return 'Ninguno';
        const pilares = [...new Set(resultados.map(r => r.pilarId).filter(Boolean))];
        return pilares.join(', ') || 'N/A';
    };

    if (loading) return <div className="loading-spinner">Cargando panel de Power Service...</div>;

    return (
        <ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}>
            <div className="dashboard-container">
                {/* ENCABEZADO PRINCIPAL */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                            <button 
                                onClick={() => navigate('/')} 
                                className="btn btn-secondary" 
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                            >
                                ← Volver al Portal de Inicio
                            </button>
                            <span style={{ color: 'var(--border-color)' }}>|</span>
                            <span className="status-badge" style={{ backgroundColor: 'var(--primary-color)' }}>Power Service</span>
                        </div>
                        <h1 style={{ margin: '0.25rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            ⚡ Power Service
                        </h1>
                        <p style={{ margin: 0, color: 'var(--text-secondary-color)' }}>Gestión integral de auditorías, estándares y resultados de Power Service.</p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <Link to="/audit/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                            ➕ Nueva Auditoría PS
                        </Link>
                    </div>
                </div>

                {/* SELECTOR DE PESTAÑAS DEL MÓDULO */}
                <div className="tabs" style={{ marginBottom: '1rem' }}>
                    <button className={`tab-button ${activeTab === 'resumen' ? 'active' : ''}`} onClick={() => setActiveTab('resumen')}>
                        📊 Resumen
                    </button>
                    <button className={`tab-button ${activeTab === 'progreso' ? 'active' : ''}`} onClick={() => setActiveTab('progreso')}>
                        ⏳ En Progreso ({auditsEnProgreso.length})
                    </button>
                    <button className={`tab-button ${activeTab === 'finalizadas' ? 'active' : ''}`} onClick={() => setActiveTab('finalizadas')}>
                        🏁 Finalizadas ({auditsFinalizadas.length})
                    </button>
                    <button className={`tab-button ${activeTab === 'resultados' ? 'active' : ''}`} onClick={() => setActiveTab('resultados')}>
                        📈 Gráficos y Resultados
                    </button>
                    <button className={`tab-button ${activeTab === 'planes' ? 'active' : ''}`} onClick={() => setActiveTab('planes')}>
                        🛠️ Planes de Acción ({planesPS.length})
                    </button>
                </div>

                {/* --- TAB 1: RESUMEN GENERAL --- */}
                {activeTab === 'resumen' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* KPIs */}
                        <div className="stats-grid">
                            <div className="stat-card" style={{ borderLeftColor: 'var(--primary-color)' }}>
                                <h4>Auditorías en Progreso</h4>
                                <div className="value" style={{ color: 'var(--primary-color)' }}>{auditsEnProgreso.length}</div>
                            </div>
                            <div className="stat-card" style={{ borderLeftColor: 'var(--success-color)' }}>
                                <h4>Auditorías Finalizadas</h4>
                                <div className="value C">{auditsFinalizadas.length}</div>
                            </div>
                            <div className="stat-card" style={{ borderLeftColor: 'var(--success-color)' }}>
                                <h4>Conformidad Global PS</h4>
                                <div className="value C">{stats.tasaConformidad}%</div>
                            </div>
                            <div className="stat-card" style={{ borderLeftColor: 'var(--danger-color)' }}>
                                <h4>No Conformidades (NC)</h4>
                                <div className="value NC">{stats.NC}</div>
                            </div>
                            <div className="stat-card" style={{ borderLeftColor: '#00C49F' }}>
                                <h4>NC Cerradas</h4>
                                <div className="value" style={{ color: '#00C49F' }}>{stats["NC Cerrada"]}</div>
                            </div>
                            <div className="stat-card card-link" onClick={() => setActiveTab('planes')} style={{ borderLeftColor: 'var(--warning-color)' }}>
                                <h4>Planes PS Pendientes</h4>
                                <div className="value" style={{ color: 'var(--warning-color)' }}>{stats.pendiente}</div>
                            </div>
                        </div>

                        {/* ACCESOS DIRECTOS */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                            <div className="card card-link" onClick={() => navigate('/audit/new')}>
                                <h3>✏️ Nueva Auditoría</h3>
                                <p>Iniciar una auditoría de Power Service desde cero con selección de sucursal y auditores.</p>
                            </div>
                            <div className="card card-link" onClick={() => setActiveTab('progreso')}>
                                <h3>⏳ Continuar Auditorías</h3>
                                <p>Tienes <strong>{auditsEnProgreso.length} auditorías abiertas</strong> pendientes de completar.</p>
                            </div>
                            <div className="card card-link" onClick={() => setActiveTab('resultados')}>
                                <h3>📊 Explorar Resultados</h3>
                                <p>Visualizar gráficos de pilares, comparativa entre Charata, Bandera y Quimilí, e informes.</p>
                            </div>
                            <div className="card card-link" onClick={() => setActiveTab('planes')}>
                                <h3>🛠️ Seguimiento de Planes</h3>
                                <p>Gestionar causas y acciones correctivas vinculadas a las No Conformidades de PS.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB 2: AUDITORÍAS EN PROGRESO --- */}
                {activeTab === 'progreso' && (
                    <div className="audits-table-container card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <h3 style={{ margin: 0 }}>Auditorías Power Service en Progreso</h3>
                            <Link to="/audit/new" className="btn btn-primary btn-sm">➕ Iniciar Nueva</Link>
                        </div>
                        {auditsEnProgreso.length === 0 ? (
                            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary-color)' }}>
                                No hay auditorías en progreso en este momento.
                            </p>
                        ) : (
                            <table className="audits-table">
                                <thead>
                                    <tr>
                                        <th>Nº Auditoría</th>
                                        <th>Lugar</th>
                                        <th>Auditores</th>
                                        <th>Auditados</th>
                                        <th>Pilares Auditados</th>
                                        <th>Progreso</th>
                                        <th>No Conformes</th>
                                        <th>Fecha Inicio</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditsEnProgreso.map(audit => {
                                        const totalAuditados = audit.resultados ? audit.resultados.length : 0;
                                        const progress = totalRequisitosPS > 0 ? (totalAuditados / totalRequisitosPS) * 100 : 0;
                                        const noConformes = (audit.resultados || []).filter(r => r.resultado === 'NC' || r.resultado === 'No Conforme').length;
                                        return (
                                            <tr key={audit.id}>
                                                <td><strong>{audit.numeroAuditoria}</strong></td>
                                                <td>{audit.lugar}</td>
                                                <td>{audit.auditores ? audit.auditores.join(', ') : 'N/A'}</td>
                                                <td>{audit.auditados ? audit.auditados.join(', ') : 'N/A'}</td>
                                                <td>{getAuditedPilaresPS(audit.resultados)}</td>
                                                <td>
                                                    <span>{totalAuditados} / {totalRequisitosPS} ({progress.toFixed(0)}%)</span>
                                                    <div className="progress-bar">
                                                        <div className="progress-bar-inner" style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {noConformes > 0 ? (
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setSelectedNcAudit(audit)}
                                                            title="Ver ítems No Conformes y gestionar planes"
                                                            style={{
                                                                background: 'rgba(220, 53, 69, 0.12)',
                                                                color: 'var(--danger-color)',
                                                                border: '1px solid var(--danger-color)',
                                                                borderRadius: '6px',
                                                                padding: '0.25rem 0.6rem',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.9rem',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            ⚠️ {noConformes} NC
                                                        </button>
                                                    ) : (
                                                        <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>✓ 0</span>
                                                    )}
                                                </td>
                                                <td>{formatDate(audit.fechaCreacion)}</td>
                                                <td>
                                                    <button className="btn btn-primary" onClick={() => navigate(`/audit/${audit.id}`)}>
                                                        Continuar →
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* --- TAB 3: AUDITORÍAS FINALIZADAS --- */}
                {activeTab === 'finalizadas' && (
                    <div className="audits-table-container card">
                        <h3 style={{ marginBottom: '1rem' }}>Auditorías Power Service Finalizadas</h3>
                        {auditsFinalizadas.length === 0 ? (
                            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary-color)' }}>
                                No hay auditorías finalizadas registradas.
                            </p>
                        ) : (
                            <table className="audits-table">
                                <thead>
                                    <tr>
                                        <th>Nº Auditoría</th>
                                        <th>Lugar</th>
                                        <th>Auditores</th>
                                        <th>Fecha Inicio</th>
                                        <th>Fecha Cierre</th>
                                        <th>Estado</th>
                                        <th>Conformes</th>
                                        <th>No Conformes</th>
                                        <th>Acciones y Reportes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditsFinalizadas.map(audit => {
                                        const conformes = (audit.resultados || []).filter(r => r.resultado === 'C' || r.resultado === 'NC Cerrada').length;
                                        const noConformes = (audit.resultados || []).filter(r => r.resultado === 'NC').length;
                                        return (
                                            <tr key={audit.id}>
                                                <td><strong>{audit.numeroAuditoria}</strong></td>
                                                <td>{audit.lugar}</td>
                                                <td>{audit.auditores ? audit.auditores.join(', ') : 'N/A'}</td>
                                                <td>{formatDate(audit.fechaCreacion)}</td>
                                                <td>{formatDate(audit.fechaCierre)}</td>
                                                <td>
                                                    <span className="status-badge status-cerrada" title={audit.autoCerrada ? "Cerrada automáticamente al completar el 100% de ítems y superar 48hs" : ""}>
                                                        {audit.autoCerrada ? 'Cerrada (48h)' : 'Cerrada'}
                                                    </span>
                                                </td>
                                                <td><span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>{conformes}</span></td>
                                                <td>
                                                    {noConformes > 0 ? (
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setSelectedNcAudit(audit)}
                                                            title="Click para ver No Conformidades e iniciar o gestionar sus Planes de Acción"
                                                            style={{
                                                                background: 'rgba(220, 53, 69, 0.12)',
                                                                color: 'var(--danger-color)',
                                                                border: '1px solid var(--danger-color)',
                                                                borderRadius: '6px',
                                                                padding: '0.28rem 0.65rem',
                                                                fontWeight: 'bold',
                                                                fontSize: '0.92rem',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                        >
                                                            ⚠️ {noConformes} NC
                                                        </button>
                                                    ) : (
                                                        <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>✓ 0</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                        <Link to={`/informe-interactivo/ps/${audit.id}`} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                                                            Interactivo
                                                        </Link>
                                                        <button 
                                                            className="btn btn-secondary" 
                                                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                                            onClick={() => exportToPDF(audit, fullChecklist)}
                                                        >
                                                            PDF
                                                        </button>
                                                        <button 
                                                            className="btn btn-secondary" 
                                                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                                            onClick={() => exportToXLS(audit, fullChecklist)}
                                                        >
                                                            XLS
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* --- TAB 4: RESULTADOS Y GRÁFICOS --- */}
                {activeTab === 'resultados' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Selector de Auditoría para análisis individual */}
                        <div className="dashboard-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.25rem 0' }}>Resultados Detallados por Auditoría PS</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary-color)' }}>Selecciona una auditoría para ver su distribución y exportar reportes.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <Link to={`/informe-interactivo/ps/${selectedAuditId}`} className={`btn btn-secondary ${!selectedAuditId ? 'disabled' : ''}`}>
                                        Ver Informe Interactivo
                                    </Link>
                                    <button className="btn btn-secondary" onClick={() => exportToPDF(selectedAuditForExport, fullChecklist)} disabled={!selectedAuditId}>
                                        Exportar a PDF
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => exportToXLS(selectedAuditForExport, fullChecklist)} disabled={!selectedAuditId}>
                                        Exportar a XLS
                                    </button>
                                </div>
                            </div>

                            <div className="dashboard-filters" style={{ marginTop: '1rem' }}>
                                <select value={selectedAuditId} onChange={e => setSelectedAuditId(e.target.value)}>
                                    <option value="">Selecciona una auditoría PS...</option>
                                    {allAudits.map(a => <option key={a.id} value={a.id}>{a.numeroAuditoria} - {a.lugar} ({a.estado || 'abierta'})</option>)}
                                </select>
                            </div>

                            {auditPieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie 
                                            data={auditPieData} 
                                            dataKey="value" 
                                            nameKey="name" 
                                            cx="50%" 
                                            cy="50%" 
                                            outerRadius={100} 
                                            label={({ name, value, percentage }) => `${name}: ${value} (${percentage}%)`}
                                        >
                                            {auditPieData.map((entry) => <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name]} />)}
                                        </Pie>
                                        <Tooltip formatter={(value, name, props) => `${value} (${props.payload.percentage}%)`} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary-color)', padding: '2rem' }}>
                                    No hay resultados cargados para esta auditoría aún.
                                </p>
                            )}
                        </div>

                        {/* Comparativas Generales: Pilares y Sucursales */}
                        <div className="dashboard-grid">
                            <div className="dashboard-section">
                                <h3>% Conformidad por Pilar PS</h3>
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={pilarPerformanceData} layout="vertical" margin={{ left: 30, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" domain={[0, 100]} unit="%" />
                                        <YAxis dataKey="pilar" type="category" width={110} />
                                        <Tooltip formatter={(val) => [`${val}%`, 'Conformidad']} />
                                        <Bar dataKey="conformidad" fill="var(--primary-color)" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="dashboard-section">
                                <h3>Comparativa por Sucursal PS</h3>
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={branchComparisonData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="C" stackId="a" fill={COLORS.C} name="Conforme" />
                                        <Bar dataKey="NC" stackId="a" fill={COLORS.NC} name="No Conforme" />
                                        <Bar dataKey="NO" stackId="a" fill={COLORS.NO} name="No Observado" />
                                        <Bar dataKey="NC Cerrada" stackId="a" fill={COLORS["NC Cerrada"]} name="NC Cerrada" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Historial por Requisito Específico */}
                        <div className="dashboard-section">
                            <h3>Historial por Requisito Específico</h3>
                            <div className="dashboard-filters">
                                <select value={selectedPilar} onChange={e => setSelectedPilar(e.target.value)}>
                                    <option value="">Selecciona Pilar...</option>
                                    {pilaresList.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                                <select value={selectedRequisito} onChange={e => setSelectedRequisito(e.target.value)} disabled={!selectedPilar}>
                                    <option value="">Selecciona Requisito...</option>
                                    {requisitosList.map(r => <option key={r.id} value={r.id}>{r.id} - {r.requerimientoOperacional?.slice(0, 40)}...</option>)}
                                </select>
                                <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
                                    <option value="6m">Últimos 6 meses</option>
                                    <option value="1y">Último año</option>
                                </select>
                            </div>

                            {selectedRequisito && requirementHistoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={requirementHistoryData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="C" stackId="a" fill={COLORS.C} name="Conforme" />
                                        <Bar dataKey="NC" stackId="a" fill={COLORS.NC} name="No Conforme" />
                                        <Bar dataKey="NO" stackId="a" fill={COLORS.NO} name="No Observado" />
                                        <Bar dataKey="NC Cerrada" stackId="a" fill={COLORS["NC Cerrada"]} name="NC Cerrada" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary-color)', padding: '1.5rem' }}>
                                    {selectedRequisito ? "Sin historial para este período." : "Selecciona un pilar y un requisito para ver su tendencia temporal."}
                                </p>
                            )}
                        </div>

                        {/* RANKING Y GRÁFICO ACUMULADO DE NO CONFORMIDADES MÁS REPETIDAS */}
                        <RankingNCRecurrentes 
                            audits={allAudits}
                            tipo="PS"
                            allActionPlans={actionPlans}
                        />
                    </div>
                )}

                {/* --- TAB 5: PLANES DE ACCIÓN PS --- */}
                {activeTab === 'planes' && (
                    <div className="audits-table-container card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <h3 style={{ margin: 0 }}>Planes de Acción - Power Service</h3>
                            <Link to="/planes-de-accion" className="btn btn-secondary btn-sm">Ver Gestor Completo</Link>
                        </div>
                        {planesPS.length === 0 ? (
                            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary-color)' }}>
                                No hay planes de acción de Power Service registrados actualmente.
                            </p>
                        ) : (
                            <table className="audits-table">
                                <thead>
                                    <tr>
                                        <th>Requisito</th>
                                        <th>Responsable</th>
                                        <th>Fecha Compromiso</th>
                                        <th>Estado</th>
                                        <th>Acción Recomendada</th>
                                        <th>Detalle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {planesPS.map(plan => (
                                        <tr key={plan.id}>
                                            <td><strong>{plan.requisitoId}</strong></td>
                                            <td>{plan.responsable || 'Sin asignar'}</td>
                                            <td>{formatDate(plan.fechaCompromiso)}</td>
                                            <td>
                                                <span className={`status-badge status-${plan.estado}`}>
                                                    {plan.estado === 'pendiente' ? 'Pendiente' : plan.estado === 'en_progreso' ? 'En Progreso' : 'Completado'}
                                                </span>
                                            </td>
                                            <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {plan.accionesRecomendadas || 'N/A'}
                                            </td>
                                            <td>
                                                <Link to={`/plan-de-accion/PS/${plan.resultadoId}`} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                                                    Ver Plan →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* MODAL INTERACTIVO DE NO CONFORMIDADES Y PLANES DE ACCIÓN */}
                {selectedNcAudit && (
                    <NCModal 
                        audit={selectedNcAudit}
                        tipo="PS"
                        allActionPlans={actionPlans}
                        onClose={() => setSelectedNcAudit(null)}
                        onPlanCreatedOrUpdated={reloadActionPlans}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
};

export default PowerServiceHubPage;
