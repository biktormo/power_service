// src/pages/DashboardPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { firebaseServices } from '../firebase/services';
import { toast } from 'react-hot-toast';
import { exportToPDF, exportToXLS, exportToPDF5S } from '../utils/exportUtils.js';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

const DashboardPage = () => {
    const [loading, setLoading] = useState(true);
    
    // Estados de Datos
    const [allAudits, setAllAudits] = useState([]);
    const [allResults, setAllResults] = useState([]);
    const [actionPlans, setActionPlans] = useState([]);
    const [fullChecklist, setFullChecklist] = useState({});
    const [pilaresList, setPilaresList] = useState([]);
    const [requisitosList, setRequisitosList] = useState([]);
    const [audits5S, setAudits5S] = useState([]);

    // Estados de Filtros
    const [selectedAuditId, setSelectedAuditId] = useState('');
    const [selectedPilar, setSelectedPilar] = useState('');
    const [selectedRequisito, setSelectedRequisito] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('6m');
    const [selectedAudit5SId, setSelectedAudit5SId] = useState('');
    
    const navigate = useNavigate();

    // Carga de Datos Paralela
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Cargamos cada parte de forma independiente para que un fallo no bloquee todo
                const auditsPromise = firebaseServices.getAllAuditsWithResults().catch(e => { console.error("Error audits:", e); return []; });
                const plansPromise = firebaseServices.getAllActionPlans().catch(e => { console.error("Error plans:", e); return []; });
                const checklistPromise = firebaseServices.getFullChecklist().catch(e => { console.error("Error checklist:", e); return {}; });
                const pilaresPromise = firebaseServices.getChecklistData(['checklist']).catch(e => { console.error("Error pilares:", e); return []; });
                const audits5SPromise = firebaseServices.getAllAuditorias5SWithResults().catch(e => { console.error("Error audits 5S:", e); return []; });
    
                const [audits, plans, checklist, pilares, audits5SData] = await Promise.all([
                    auditsPromise, plansPromise, checklistPromise, pilaresPromise, audits5SPromise
                ]);
    
                const results = audits.flatMap(a => a.resultados.map(r => ({ ...r, lugar: a.lugar, fechaCreacion: a.fechaCreacion })));
    
                setAllAudits(audits);
                setAllResults(results);
                setActionPlans(plans);
                setFullChecklist(checklist);
                setPilaresList(pilares);
                setAudits5S(audits5SData);
            } catch (error) {
                toast.error("Error parcial al cargar el dashboard.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Efecto para actualizar requisitos según pilar
    useEffect(() => {
        const loadRequisitos = async () => {
            if (selectedPilar && fullChecklist[selectedPilar]) {
                const reqs = Object.values(fullChecklist[selectedPilar].estandares).flatMap(e => e.requisitos);
                setRequisitosList(reqs);
            } else {
                setRequisitosList([]);
            }
            setSelectedRequisito('');
        };
        loadRequisitos();
    }, [selectedPilar, fullChecklist]);

    // --- CÁLCULOS MEMOIZADOS (SIN CAMBIOS EN LA LÓGICA) ---

    const stats = useMemo(() => {
        const resultCounts = { C: 0, NC: 0, NO: 0, "NC Cerrada": 0 };
        allResults.forEach(r => { if (resultCounts[r.resultado] !== undefined) resultCounts[r.resultado]++; });
        
        const planCounts = { pendiente: 0, en_progreso: 0, completado: 0 };
        actionPlans.filter(p => p.tipoAuditoria === 'PS').forEach(p => { if (planCounts[p.estado] !== undefined) planCounts[p.estado]++; });
        
        return { ...resultCounts, ...planCounts };
    }, [allResults, actionPlans]);

    const auditPieData = useMemo(() => {
        if (!selectedAuditId) return [];
        const audit = allAudits.find(a => a.id === selectedAuditId);
        if (!audit || audit.resultados.length === 0) return [];
        
        const counts = { C: 0, NC: 0, NO: 0, "NC Cerrada": 0 };
        audit.resultados.forEach(r => { if (counts[r.resultado] !== undefined) counts[r.resultado]++; });
        
        const total = audit.resultados.length;
        return Object.entries(counts).map(([name, value]) => ({ 
            name, value, percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0 
        })).filter(e => e.value > 0);
    }, [selectedAuditId, allAudits]);

    const requirementHistoryData = useMemo(() => {
        if (!selectedRequisito) return [];
        const now = new Date();
        const periodLimit = new Date();
        if (selectedPeriod === '6m') periodLimit.setMonth(now.getMonth() - 6);
        if (selectedPeriod === '1y') periodLimit.setFullYear(now.getFullYear() - 1);
        return allResults
            .filter(r => r.requisitoId === selectedRequisito && r.fechaCreacion?.toDate() >= periodLimit)
            .map(r => ({
                date: r.fechaCreacion.toDate().toLocaleDateString(),
                C: r.resultado === 'C' ? 1 : 0, NC: r.resultado === 'NC' ? 1 : 0,
                NO: r.resultado === 'NO' ? 1 : 0, "NC Cerrada": r.resultado === 'NC Cerrada' ? 1 : 0,
            }));
    }, [selectedRequisito, selectedPeriod, allResults]);

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

    const stats5S = useMemo(() => {
        const allResults5S = audits5S.flatMap(a => a.resultados);
        const nonConformities = allResults5S.filter(r => r.resultado === 'No Conforme');
        const actionPlans5S = actionPlans.filter(p => p.tipoAuditoria === '5S');
        const openActionPlans5S = actionPlans5S.filter(p => p.estado !== 'completado').length;
        const totalConformidad = audits5S.reduce((sum, audit) => {
            const auditados = audit.resultados.filter(r => r.resultado === 'Conforme' || r.resultado === 'No Conforme');
            if (auditados.length === 0) return sum;
            const conformes = auditados.filter(r => r.resultado === 'Conforme').length;
            return sum + (conformes / auditados.length);
        }, 0);
        const promedioConformidad = audits5S.length > 0 ? (totalConformidad / audits5S.length) * 100 : 0;
        return {
            promedio: promedioConformidad.toFixed(1),
            totalNC: nonConformities.length,
            planesAbiertos: openActionPlans5S,
        };
    }, [audits5S, actionPlans]);

    const COLORS = { C: 'var(--success-color)', NC: 'var(--danger-color)', NO: 'var(--warning-color)', "NC Cerrada": '#00C49F' };
    const selectedAuditForExport = allAudits.find(a => a.id === selectedAuditId);

    if (loading) return <div className="loading-spinner">Cargando dashboard...</div>;

    return (
        <ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}>
            <div className="dashboard-container">
                <h1>Dashboard de Resultados</h1>
                
                <div className="dashboard-section">
                    <h3>Resumen General Power Service</h3>
                    <div className="stats-grid">
                        <div className="stat-card"><h4>Conformes (C)</h4><div className="value C">{stats.C}</div></div>
                        <div className="stat-card"><h4>No Conformes (NC)</h4><div className="value NC">{stats.NC}</div></div>
                        <div className="stat-card"><h4>No Observados (NO)</h4><div className="value NO">{stats.NO}</div></div>
                        <div className="stat-card"><h4>NC Cerradas</h4><div className="value" style={{ color: COLORS["NC Cerrada"] }}>{stats["NC Cerrada"]}</div></div>
                    </div>
                     <div className="stats-grid" style={{marginTop: '1rem'}}>
                        <div className="stat-card card-link" onClick={() => navigate('/planes-de-accion')}>
                            <h4>Planes PS Pendientes</h4>
                            <div className="value" style={{ color: 'var(--warning-color)' }}>{stats.pendiente}</div>
                        </div>
                        <div className="stat-card"><h4>Planes PS en Progreso</h4><div className="value" style={{ color: 'var(--primary-color)' }}>{stats.en_progreso}</div></div>
                        <div className="stat-card"><h4>Planes PS Completados</h4><div className="value C">{stats.completado}</div></div>
                    </div>
                </div>

                <div className="dashboard-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3>Resultados por Auditoría PS</h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Link to={`/informe-interactivo/ps/${selectedAuditId}`} className={`btn btn-secondary ${!selectedAuditId ? 'disabled' : ''}`}>Ver Informe Interactivo</Link>
                            <button className="btn btn-secondary" onClick={() => exportToPDF(selectedAuditForExport, fullChecklist)} disabled={!selectedAuditId}>Exportar a PDF</button>
                            <button className="btn btn-secondary" onClick={() => exportToXLS(selectedAuditForExport, fullChecklist)} disabled={!selectedAuditId}>Exportar a XLS</button>
                        </div>
                    </div>
                    <div className="dashboard-filters">
                        <select value={selectedAuditId} onChange={e => setSelectedAuditId(e.target.value)}>
                            <option value="">Selecciona una auditoría PS...</option>
                            {allAudits.map(a => <option key={a.id} value={a.id}>{a.numeroAuditoria} - {a.lugar}</option>)}
                        </select>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={auditPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value, percentage }) => `${name}: ${value} (${percentage}%)`}>
                                {auditPieData.map((entry) => <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name]} />)}
                            </Pie>
                            <Tooltip formatter={(value, name, props) => `${value} (${props.payload.percentage}%)`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                
                <div className="dashboard-grid">
                    <div className="dashboard-section">
                        <h3>Historial por Requisito PS</h3>
                        <div className="dashboard-filters">
                            <select value={selectedPilar} onChange={e => setSelectedPilar(e.target.value)}><option value="">Pilar</option>{pilaresList.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
                            <select value={selectedRequisito} onChange={e => setSelectedRequisito(e.target.value)} disabled={!selectedPilar}><option value="">Requisito</option>{requisitosList.map(r => <option key={r.id} value={r.id}>{r.id}</option>)}</select>
                            <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}><option value="6m">Últimos 6 meses</option><option value="1y">Último año</option></select>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={requirementHistoryData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="C" stackId="a" fill={COLORS.C} name="Conforme" /><Bar dataKey="NC" stackId="a" fill={COLORS.NC} name="No Conforme" /><Bar dataKey="NO" stackId="a" fill={COLORS.NO} name="No Observado" /><Bar dataKey="NC Cerrada" stackId="a" fill={COLORS["NC Cerrada"]} name="NC Cerrada" /></BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="dashboard-section">
                        <h3>Comparativa por Sucursal PS</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={branchComparisonData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="C" stackId="a" fill={COLORS.C} name="Conforme" /><Bar dataKey="NC" stackId="a" fill={COLORS.NC} name="No Conforme" /><Bar dataKey="NO" stackId="a" fill={COLORS.NO} name="No Observado" /><Bar dataKey="NC Cerrada" stackId="a" fill={COLORS["NC Cerrada"]} name="NC Cerrada" /></BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="dashboard-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3>Resultados por Auditoría 5S</h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Link to={`/informe-grafico-5s/${selectedAudit5SId}`} className={`btn btn-secondary ${!selectedAudit5SId ? 'disabled' : ''}`}>Ver Informe Gráfico</Link>
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => {
                                    const selectedAuditToExport = audits5S.find(a => a.id === selectedAudit5SId);
                                    const checklist5SData = firebaseServices.get5SChecklist();
                                    exportToPDF5S(selectedAuditToExport, checklist5SData);
                                }} 
                                disabled={!selectedAudit5SId}
                            >
                                Exportar PDF Completo
                            </button>
                        </div>
                    </div>
                    <div className="dashboard-filters">
                        <select value={selectedAudit5SId} onChange={e => setSelectedAudit5SId(e.target.value)}>
                            <option value="">Selecciona una auditoría 5S...</option>
                            {audits5S.map(a => <option key={a.id} value={a.id}>{a.numeroAuditoria} - {a.lugar}</option>)}
                        </select>
                    </div>
                    <div className="stats-grid" style={{marginTop: '1rem'}}>
                        <div className="stat-card"><h4>Promedio Conformidad</h4><div className="value C">{stats5S.promedio}%</div></div>
                        <div className="stat-card"><h4>Total No Conformes</h4><div className="value NC">{stats5S.totalNC}</div></div>
                        <div className="stat-card card-link" onClick={() => navigate('/planes-de-accion')}>
                            <h4>Planes 5S sin Cerrar</h4>
                            <div className="value" style={{ color: 'var(--warning-color)' }}>{stats5S.planesAbiertos}</div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default DashboardPage;
