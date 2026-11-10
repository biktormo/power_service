// src/pages/Auditoria5SHubPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { firebaseServices } from '../firebase/services';
import { toast } from 'react-hot-toast';
import { exportToPDF5S, exportToXLS5S, formatDate } from '../utils/exportUtils.js';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import NCModal from '../components/NCModal.jsx';
import RankingNCRecurrentes from '../components/RankingNCRecurrentes.jsx';

const Auditoria5SHubPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Modo 5S: 'servicio' o 'repuestos'
    const paramTipo = searchParams.get('tipo');
    const [tipo5S, setTipo5S] = useState(paramTipo === 'repuestos' ? 'repuestos' : 'servicio');

    // Sub-pestaña: 'resumen' | 'progreso' | 'finalizadas' | 'resultados' | 'planes'
    const [activeTab, setActiveTab] = useState('resumen');

    const [loading, setLoading] = useState(true);
    const [allAudits5S, setAllAudits5S] = useState([]);
    const [allActionPlans, setAllActionPlans] = useState([]);
    const [selectedAuditId, setSelectedAuditId] = useState('');
    const [selectedNcAudit, setSelectedNcAudit] = useState(null);

    // Sincronizar URL con tipo 5S
    const handleSwitchTipo = (nuevoTipo) => {
        setTipo5S(nuevoTipo);
        setSearchParams({ tipo: nuevoTipo });
        setSelectedAuditId('');
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const auditsPromise = firebaseServices.getAllAuditorias5SWithResults().catch(() => []);
                const plansPromise = firebaseServices.getAllActionPlans().catch(() => []);

                const [audits, plans] = await Promise.all([auditsPromise, plansPromise]);
                setAllAudits5S(audits);
                setAllActionPlans(plans);
            } catch (error) {
                console.error("Error al cargar auditorías 5S:", error);
                toast.error("Error al cargar datos de 5S.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const reloadActionPlans = async () => {
        try {
            const plans = await firebaseServices.getAllActionPlans().catch(() => []);
            setAllActionPlans(plans);
        } catch (e) {}
    };

    // Filtrar auditorías por el tipo seleccionado (Servicio vs Repuestos)
    const auditsOfCurrentType = useMemo(() => {
        return allAudits5S.filter(a => {
            const auditTipo = a.tipo5S || (a.numeroAuditoria?.startsWith('5SR') ? 'repuestos' : 'servicio');
            return auditTipo === tipo5S;
        });
    }, [allAudits5S, tipo5S]);

    // Establecer la primera auditoría como seleccionada si no hay ninguna
    useEffect(() => {
        if (auditsOfCurrentType.length > 0 && !selectedAuditId) {
            setSelectedAuditId(auditsOfCurrentType[0].id);
        }
    }, [auditsOfCurrentType, selectedAuditId]);

    // Segmentación: En Progreso vs Finalizadas
    const auditsEnProgreso = useMemo(() => {
        return auditsOfCurrentType.filter(a => a.estado === 'en_progreso' || a.estado === 'abierta');
    }, [auditsOfCurrentType]);

    const auditsFinalizadas = useMemo(() => {
        return auditsOfCurrentType.filter(a => a.estado === 'finalizada' || a.estado === 'cerrada');
    }, [auditsOfCurrentType]);

    // Checklist base para cálculos según tipo
    const getChecklistForAudit = (audit) => {
        if (!audit) return {};
        const isRep = (audit.tipo5S === 'repuestos' || audit.numeroAuditoria?.startsWith('5SR'));
        return isRep 
            ? firebaseServices.get5SRepuestosChecklist(audit.lugar) 
            : firebaseServices.get5SChecklist();
    };

    const getTotalItemsForAudit = (audit) => {
        const chk = getChecklistForAudit(audit);
        return Object.values(chk).reduce((sum, items) => sum + items.length, 0);
    };

    // Resultados globales del tipo 5S actual
    const currentResults = useMemo(() => {
        return auditsOfCurrentType.flatMap(a => (a.resultados || []).map(r => ({ ...r, lugar: a.lugar, auditFecha: a.fecha || a.creadoEn })));
    }, [auditsOfCurrentType]);

    // Estadísticas
    const stats = useMemo(() => {
        const conformes = currentResults.filter(r => r.resultado === 'Conforme').length;
        const noConformes = currentResults.filter(r => r.resultado === 'No Conforme').length;
        const ncCerradas = currentResults.filter(r => r.resultado === 'NC Cerrada').length;
        const auditados = conformes + noConformes + ncCerradas;
        
        const promedio = auditados > 0 ? (((conformes + ncCerradas) / auditados) * 100).toFixed(1) : 0;

        // Planes de acción vinculados a auditorías de este tipo
        const auditIdsOfCurrentType = new Set(auditsOfCurrentType.map(a => a.id));
        const planes = allActionPlans.filter(p => p.tipoAuditoria === '5S' && (auditIdsOfCurrentType.has(p.auditoria5SId) || (!p.auditoria5SId && tipo5S === 'servicio')));
        
        const planesAbiertos = planes.filter(p => p.estado !== 'completado').length;

        return {
            totalAuditorias: auditsOfCurrentType.length,
            promedio,
            totalNC: noConformes,
            ncCerradas,
            planesAbiertos,
            planesTotal: planes.length
        };
    }, [currentResults, auditsOfCurrentType, allActionPlans, tipo5S]);

    // Planes filtrados para la pestaña de planes
    const planes5SCurrent = useMemo(() => {
        const auditIdsOfCurrentType = new Set(auditsOfCurrentType.map(a => a.id));
        return allActionPlans.filter(p => p.tipoAuditoria === '5S' && (auditIdsOfCurrentType.has(p.auditoria5SId) || (!p.auditoria5SId && tipo5S === 'servicio')));
    }, [auditsOfCurrentType, allActionPlans, tipo5S]);

    // Gráfico de distribución de la auditoría seleccionada
    const selectedAudit = useMemo(() => {
        return auditsOfCurrentType.find(a => a.id === selectedAuditId);
    }, [auditsOfCurrentType, selectedAuditId]);

    const auditPieData = useMemo(() => {
        if (!selectedAudit || !selectedAudit.resultados) return [];
        const conformes = selectedAudit.resultados.filter(r => r.resultado === 'Conforme').length;
        const noConformes = selectedAudit.resultados.filter(r => r.resultado === 'No Conforme').length;
        const ncCerradas = selectedAudit.resultados.filter(r => r.resultado === 'NC Cerrada').length;
        const noObservados = selectedAudit.resultados.filter(r => r.resultado === 'No Observado').length;

        return [
            { name: 'Conforme', value: conformes },
            { name: 'No Conforme', value: noConformes },
            { name: 'NC Cerrada', value: ncCerradas },
            { name: 'No Observado', value: noObservados },
        ].filter(d => d.value > 0);
    }, [selectedAudit]);

    // Comparativa por Sucursal
    const branchComparisonData = useMemo(() => {
        const data = {
            Charata: { name: 'Charata', Conforme: 0, "No Conforme": 0, "NC Cerrada": 0 },
            Bandera: { name: 'Bandera', Conforme: 0, "No Conforme": 0, "NC Cerrada": 0 },
            Quimili: { name: 'Quimili', Conforme: 0, "No Conforme": 0, "NC Cerrada": 0 },
        };
        currentResults.forEach(r => {
            if (data[r.lugar] && data[r.lugar][r.resultado] !== undefined) {
                data[r.lugar][r.resultado]++;
            }
        });
        return Object.values(data);
    }, [currentResults]);

    // Desglose por Sección
    const sectionBreakdownData = useMemo(() => {
        const sectionMap = {};
        currentResults.forEach(r => {
            const sec = r.seccion || 'General';
            if (!sectionMap[sec]) {
                sectionMap[sec] = { seccion: sec, conformes: 0, total: 0 };
            }
            if (r.resultado === 'Conforme' || r.resultado === 'NC Cerrada') {
                sectionMap[sec].conformes++;
            }
            if (r.resultado === 'Conforme' || r.resultado === 'No Conforme' || r.resultado === 'NC Cerrada') {
                sectionMap[sec].total++;
            }
        });

        return Object.values(sectionMap).map(s => ({
            seccion: s.seccion,
            conformidad: s.total > 0 ? Math.round((s.conformes / s.total) * 100) : 0,
            evaluados: s.total
        }));
    }, [currentResults]);

    const COLORS = { 
        'Conforme': 'var(--success-color)', 
        'No Conforme': 'var(--danger-color)', 
        'NC Cerrada': '#00C49F',
        'No Observado': 'var(--warning-color)'
    };

    const isRepuestos = tipo5S === 'repuestos';
    const tipoLabel = isRepuestos ? "5S Repuestos" : "5S Servicio";

    if (loading) return <div className="loading-spinner">Cargando panel de Auditorías 5S...</div>;

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
                            <span className="status-badge" style={{ backgroundColor: isRepuestos ? '#e67e22' : 'var(--primary-color)' }}>
                                {tipoLabel}
                            </span>
                        </div>
                        <h1 style={{ margin: '0.25rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🏆 Auditorías 5S
                        </h1>
                        <p style={{ margin: 0, color: 'var(--text-secondary-color)' }}>
                            Gestión, inspecciones y planes de acción 5S en Repuestos y Servicio.
                        </p>
                    </div>

                    {/* BOTÓN NUEVA AUDITORÍA */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <Link 
                            to={`/auditoria-5s?tipo=${tipo5S}`} 
                            className="btn btn-primary" 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem', 
                                fontWeight: 'bold',
                                backgroundColor: isRepuestos ? '#e67e22' : undefined 
                            }}
                        >
                            ➕ Nueva Auditoría {tipoLabel}
                        </Link>
                    </div>
                </div>

                {/* SELECTOR SUPERIOR: SERVICIO vs REPUESTOS (NUEVO) */}
                <div style={{ display: 'flex', gap: '1rem', background: 'var(--surface-color)', padding: '0.5rem', borderRadius: '10px', boxShadow: 'var(--box-shadow)' }}>
                    <button 
                        type="button" 
                        onClick={() => handleSwitchTipo('servicio')}
                        style={{
                            flex: 1,
                            padding: '0.9rem',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1.05rem',
                            backgroundColor: !isRepuestos ? 'var(--primary-color)' : 'transparent',
                            color: !isRepuestos ? 'white' : 'var(--text-color)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        🔧 5S SERVICIO
                    </button>
                    <button 
                        type="button" 
                        onClick={() => handleSwitchTipo('repuestos')}
                        style={{
                            flex: 1,
                            padding: '0.9rem',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1.05rem',
                            backgroundColor: isRepuestos ? '#e67e22' : 'transparent',
                            color: isRepuestos ? 'white' : 'var(--text-color)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        📦 5S REPUESTOS <span style={{ fontSize: '0.75rem', background: isRepuestos ? '#ffffff33' : '#e67e22', color: isRepuestos ? 'white' : 'white', padding: '2px 8px', borderRadius: '12px' }}>NUEVO</span>
                    </button>
                </div>

                {/* INFORMACIÓN DE 5S REPUESTOS */}
                {isRepuestos && (
                    <div className="card" style={{ backgroundColor: '#fff8f0', borderLeft: '5px solid #e67e22', padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                                <strong style={{ color: '#d35400' }}>Configuración de 5S Repuestos:</strong>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
                                    • <strong>Charata:</strong> Todos los ítems auditados (1 al 24: Depósito Principal, Lubricantes y Patio).<br />
                                    • <strong>Bandera y Quimilí:</strong> Exclusivamente Depósito Principal (ítems 1 al 16 inclusive).<br />
                                    • <strong>Auditores designados:</strong> Mauro Cabus, Brian Mancilla, Hernan Falconi, Emilio Juncal.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* SUB-PESTAÑAS DEL MÓDULO */}
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
                        🛠️ Planes de Acción ({planes5SCurrent.length})
                    </button>
                </div>

                {/* --- TAB 1: RESUMEN GENERAL --- */}
                {activeTab === 'resumen' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="stats-grid">
                            <div className="stat-card" style={{ borderLeftColor: isRepuestos ? '#e67e22' : 'var(--primary-color)' }}>
                                <h4>Auditorías en Progreso</h4>
                                <div className="value" style={{ color: isRepuestos ? '#e67e22' : 'var(--primary-color)' }}>{auditsEnProgreso.length}</div>
                            </div>
                            <div className="stat-card" style={{ borderLeftColor: 'var(--success-color)' }}>
                                <h4>Auditorías Finalizadas</h4>
                                <div className="value C">{auditsFinalizadas.length}</div>
                            </div>
                            <div className="stat-card" style={{ borderLeftColor: 'var(--success-color)' }}>
                                <h4>Promedio Conformidad</h4>
                                <div className="value C">{stats.promedio}%</div>
                            </div>
                            <div className="stat-card" style={{ borderLeftColor: 'var(--danger-color)' }}>
                                <h4>Total No Conformes</h4>
                                <div className="value NC">{stats.totalNC}</div>
                            </div>
                            <div className="stat-card" style={{ borderLeftColor: '#00C49F' }}>
                                <h4>NC Cerradas</h4>
                                <div className="value" style={{ color: '#00C49F' }}>{stats.ncCerradas}</div>
                            </div>
                            <div className="stat-card card-link" onClick={() => setActiveTab('planes')} style={{ borderLeftColor: 'var(--warning-color)' }}>
                                <h4>Planes sin Cerrar</h4>
                                <div className="value" style={{ color: 'var(--warning-color)' }}>{stats.planesAbiertos}</div>
                            </div>
                        </div>

                        {/* ACCESOS DIRECTOS */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                            <div className="card card-link" onClick={() => navigate(`/auditoria-5s?tipo=${tipo5S}`)}>
                                <h3>✏️ Nueva Auditoría {tipoLabel}</h3>
                                <p>Iniciar una nueva evaluación de {tipoLabel} en Charata, Bandera o Quimilí.</p>
                            </div>
                            <div className="card card-link" onClick={() => setActiveTab('progreso')}>
                                <h3>⏳ Auditorías en Progreso</h3>
                                <p>Reanudar y completar las <strong>{auditsEnProgreso.length} inspecciones abiertas</strong>.</p>
                            </div>
                            <div className="card card-link" onClick={() => setActiveTab('resultados')}>
                                <h3>📊 Gráficos y Estadísticas</h3>
                                <p>Explorar resultados por sección, comparativas de sucursal e informes de {tipoLabel}.</p>
                            </div>
                            <div className="card card-link" onClick={() => setActiveTab('planes')}>
                                <h3>🛠️ Planes de Acción 5S</h3>
                                <p>Monitorear la resolución y evidencias de No Conformidades registradas.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB 2: AUDITORÍAS EN PROGRESO --- */}
                {activeTab === 'progreso' && (
                    <div className="audits-table-container card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <h3 style={{ margin: 0 }}>Auditorías {tipoLabel} en Progreso</h3>
                            <Link to={`/auditoria-5s?tipo=${tipo5S}`} className="btn btn-primary btn-sm">➕ Iniciar Nueva</Link>
                        </div>
                        {auditsEnProgreso.length === 0 ? (
                            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary-color)' }}>
                                No hay auditorías de {tipoLabel} en progreso actualmente.
                            </p>
                        ) : (
                            <table className="audits-table">
                                <thead>
                                    <tr>
                                        <th>Nº Auditoría</th>
                                        <th>Sucursal</th>
                                        <th>Auditor</th>
                                        <th>Progreso de Ítems</th>
                                        <th>No Conformes</th>
                                        <th>Fecha Inicio</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditsEnProgreso.map(audit => {
                                        const itemsAuditados = audit.resultados ? audit.resultados.length : 0;
                                        const total = getTotalItemsForAudit(audit);
                                        const progress = total > 0 ? (itemsAuditados / total) * 100 : 0;
                                        const noConformes = (audit.resultados || []).filter(r => r.resultado === 'No Conforme' || r.resultado === 'NC').length;
                                        return (
                                            <tr key={audit.id}>
                                                <td><strong>{audit.numeroAuditoria}</strong></td>
                                                <td>{audit.lugar}</td>
                                                <td>{audit.auditor}</td>
                                                <td>
                                                    <span>{itemsAuditados} / {total} ({progress.toFixed(0)}%)</span>
                                                    <div className="progress-bar">
                                                        <div className="progress-bar-inner" style={{ width: `${progress}%`, backgroundColor: isRepuestos ? '#e67e22' : undefined }}></div>
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
                                                <td>{formatDate(audit.fecha || audit.creadoEn)}</td>
                                                <td>
                                                    <button className="btn btn-primary" onClick={() => navigate(`/auditoria-5s/${audit.id}`)}>
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
                        <h3 style={{ marginBottom: '1rem' }}>Auditorías {tipoLabel} Finalizadas</h3>
                        {auditsFinalizadas.length === 0 ? (
                            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary-color)' }}>
                                No hay auditorías finalizadas de {tipoLabel}.
                            </p>
                        ) : (
                            <table className="audits-table">
                                <thead>
                                    <tr>
                                        <th>Nº Auditoría</th>
                                        <th>Sucursal</th>
                                        <th>Auditor</th>
                                        <th>Fecha</th>
                                        <th>Estado</th>
                                        <th>Conformidad</th>
                                        <th>No Conformes</th>
                                        <th>Reportes y Exportación</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditsFinalizadas.map(audit => {
                                        const totalItems = getTotalItemsForAudit(audit);
                                        const auditados = (audit.resultados || []).filter(r => r.resultado === 'Conforme' || r.resultado === 'No Conforme' || r.resultado === 'NC Cerrada');
                                        const conformes = auditados.filter(r => r.resultado === 'Conforme').length;
                                        const noConformes = auditados.filter(r => r.resultado === 'No Conforme').length;
                                        const score = audit.resultadoPorcentaje !== null && audit.resultadoPorcentaje !== undefined 
                                            ? audit.resultadoPorcentaje 
                                            : (auditados.length > 0 ? ((conformes / auditados.length) * 100).toFixed(1) : 0);

                                        return (
                                            <tr key={audit.id}>
                                                <td><strong>{audit.numeroAuditoria}</strong></td>
                                                <td>{audit.lugar}</td>
                                                <td>{audit.auditor}</td>
                                                <td>{formatDate(audit.fecha || audit.creadoEn)}</td>
                                                <td>
                                                    <span className="status-badge status-cerrada" title={audit.autoCerrada ? "Finalizada automáticamente al completar el 100% de ítems y superar 48hs" : ""}>
                                                        {audit.autoCerrada ? 'Finalizada (48h)' : 'Finalizada'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ color: 'var(--success-color)', fontWeight: 'bold', fontSize: '1.05rem' }}>
                                                        {score}%
                                                    </span>
                                                </td>
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
                                                        <Link to={`/informe-5s/${audit.id}`} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                                                            Informe
                                                        </Link>
                                                        <Link to={`/informe-grafico-5s/${audit.id}`} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                                                            Gráfico NC
                                                        </Link>
                                                        <button 
                                                            className="btn btn-secondary" 
                                                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                                            onClick={() => exportToPDF5S(audit)}
                                                        >
                                                            PDF
                                                        </button>
                                                        <button 
                                                            className="btn btn-secondary" 
                                                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                                                            onClick={() => exportToXLS5S(audit)}
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
                        {/* Selector de Auditoría 5S para análisis individual */}
                        <div className="dashboard-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.25rem 0' }}>Resultados por Auditoría {tipoLabel}</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary-color)' }}>Visualiza la distribución de conformidades y genera reportes.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <Link to={`/informe-5s/${selectedAuditId}`} className={`btn btn-secondary ${!selectedAuditId ? 'disabled' : ''}`}>
                                        Ver Informe Completo
                                    </Link>
                                    <Link to={`/informe-grafico-5s/${selectedAuditId}`} className={`btn btn-secondary ${!selectedAuditId ? 'disabled' : ''}`}>
                                        Ver Informe Gráfico NC
                                    </Link>
                                    <button 
                                        className="btn btn-secondary" 
                                        onClick={() => exportToPDF5S(selectedAudit)} 
                                        disabled={!selectedAuditId}
                                    >
                                        Descargar PDF
                                    </button>
                                </div>
                            </div>

                            <div className="dashboard-filters" style={{ marginTop: '1rem' }}>
                                <select value={selectedAuditId} onChange={e => setSelectedAuditId(e.target.value)}>
                                    <option value="">Selecciona una auditoría {tipoLabel}...</option>
                                    {auditsOfCurrentType.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.numeroAuditoria} - {a.lugar} ({formatDate(a.fecha || a.creadoEn)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {auditPieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie 
                                            data={auditPieData} 
                                            dataKey="value" 
                                            nameKey="name" 
                                            cx="50%" 
                                            cy="50%" 
                                            outerRadius={95} 
                                            label={({ name, value }) => `${name}: ${value}`}
                                        >
                                            {auditPieData.map((entry) => <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name]} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary-color)', padding: '2rem' }}>
                                    Selecciona una auditoría con resultados para ver su gráfico.
                                </p>
                            )}
                        </div>

                        {/* Desglose por Sección y Comparativa de Sucursal */}
                        <div className="dashboard-grid">
                            <div className="dashboard-section">
                                <h3>% Conformidad por Sección ({tipoLabel})</h3>
                                {sectionBreakdownData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={sectionBreakdownData} layout="vertical" margin={{ left: 30, right: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis type="number" domain={[0, 100]} unit="%" />
                                            <YAxis dataKey="seccion" type="category" width={130} />
                                            <Tooltip formatter={(val) => [`${val}%`, 'Conformidad']} />
                                            <Bar dataKey="conformidad" fill={isRepuestos ? '#e67e22' : 'var(--primary-color)'} radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p style={{ textAlign: 'center', color: 'var(--text-secondary-color)', padding: '2rem' }}>
                                        Sin datos de secciones aún.
                                    </p>
                                )}
                            </div>

                            <div className="dashboard-section">
                                <h3>Comparativa por Sucursal ({tipoLabel})</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={branchComparisonData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="Conforme" stackId="a" fill={COLORS.Conforme} name="Conforme" />
                                        <Bar dataKey="No Conforme" stackId="a" fill={COLORS["No Conforme"]} name="No Conforme" />
                                        <Bar dataKey="NC Cerrada" stackId="a" fill={COLORS["NC Cerrada"]} name="NC Cerrada" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* RANKING Y GRÁFICO ACUMULADO DE NO CONFORMIDADES MÁS REPETIDAS */}
                        <RankingNCRecurrentes 
                            audits={auditsOfCurrentType}
                            tipo="5S"
                            tipo5S={tipo5S}
                            allActionPlans={allActionPlans}
                        />
                    </div>
                )}

                {/* --- TAB 5: PLANES DE ACCIÓN 5S --- */}
                {activeTab === 'planes' && (
                    <div className="audits-table-container card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <h3 style={{ margin: 0 }}>Planes de Acción - {tipoLabel}</h3>
                            <Link to="/planes-de-accion" className="btn btn-secondary btn-sm">Ver Gestor Completo</Link>
                        </div>
                        {planes5SCurrent.length === 0 ? (
                            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary-color)' }}>
                                No hay planes de acción de {tipoLabel} registrados actualmente.
                            </p>
                        ) : (
                            <table className="audits-table">
                                <thead>
                                    <tr>
                                        <th>Ítem / Requisito</th>
                                        <th>Responsable</th>
                                        <th>Fecha Compromiso</th>
                                        <th>Estado</th>
                                        <th>Acción Recomendada</th>
                                        <th>Detalle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {planes5SCurrent.map(plan => (
                                        <tr key={plan.id}>
                                            <td><strong>Ítem {plan.requisitoId}</strong></td>
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
                                                <Link to={`/plan-de-accion/5S/${plan.resultadoId}`} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
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
                        tipo="5S"
                        tipo5S={tipo5S}
                        allActionPlans={allActionPlans}
                        onClose={() => setSelectedNcAudit(null)}
                        onPlanCreatedOrUpdated={reloadActionPlans}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
};

export default Auditoria5SHubPage;
