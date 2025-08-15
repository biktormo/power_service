// src/pages/DashboardPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useData } from '../contexts/DataContext.jsx'; // Importamos el hook del nuevo contexto
import { firebaseServices } from '../firebase/services'; // Aún lo necesitamos para getChecklistData
import { exportToPDF, exportToXLS } from '../utils/exportUtils';
import { toast } from 'react-hot-toast';

const DashboardPage = () => {
    // Obtenemos los datos globales desde el DataContext
    const { audits: allAudits, actionPlans, fullChecklist, loading } = useData();
    const navigate = useNavigate();

    // Los estados locales para los filtros se mantienen
    const [pilaresList, setPilaresList] = useState([]);
    const [requisitosList, setRequisitosList] = useState([]);
    const [selectedAuditId, setSelectedAuditId] = useState('');
    const [selectedPilar, setSelectedPilar] = useState('');
    const [selectedRequisito, setSelectedRequisito] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('6m');

    // Efecto para cargar la lista de pilares (esto es rápido y puede quedarse aquí)
    useEffect(() => {
        firebaseServices.getChecklistData(['checklist'])
            .then(pilares => setPilaresList(pilares))
            .catch(err => toast.error("No se pudo cargar la lista de pilares."));
    }, []);
    
    // Este useEffect ahora solo depende de los datos del contexto
    useEffect(() => {
        if (selectedPilar && fullChecklist[selectedPilar]) {
            const reqs = Object.values(fullChecklist[selectedPilar].estandares).flatMap(e => e.requisitos);
            setRequisitosList(reqs);
        } else {
            setRequisitosList([]);
        }
        setSelectedRequisito('');
    }, [selectedPilar, fullChecklist]);

    // Derivamos allResults de allAudits usando useMemo para eficiencia
    const allResults = useMemo(() => {
        return allAudits.flatMap(a => a.resultados.map(r => ({ ...r, lugar: a.lugar, fechaCreacion: a.fechaCreacion })));
    }, [allAudits]);

    // Los cálculos para los gráficos (useMemo) siguen siendo los mismos
    const stats = useMemo(() => {
        const resultCounts = { C: 0, NC: 0, NO: 0, "NC Cerrada": 0 };
        allResults.forEach(r => { if (resultCounts[r.resultado] !== undefined) resultCounts[r.resultado]++; });
        const planCounts = { pendiente: 0, en_progreso: 0, completado: 0 };
        actionPlans.forEach(p => { if (planCounts[p.estado] !== undefined) planCounts[p.estado]++; });
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
        allResults.forEach(r => { if (data[r.lugar] && data[r.lugar][r.resultado] !== undefined) data[r.lugar][r.resultado]++; });
        return Object.values(data);
    }, [allResults]);

    const COLORS = { C: 'var(--success-color)', NC: 'var(--danger-color)', NO: 'var(--warning-color)', "NC Cerrada": '#00C49F' };
    const selectedAuditForExport = allAudits.find(a => a.id === selectedAuditId);

    // Usamos el estado de carga global del DataContext
    if (loading) {
        return <div className="loading-spinner">Cargando datos del dashboard...</div>;
    }

    return (
        <div className="dashboard-container">
            {/* El JSX del dashboard no cambia, solo la forma en que obtiene los datos */}
            <h1>Dashboard de Resultados</h1>
            <div className="dashboard-section">
                <h3>Resumen General</h3>
                <div className="stats-grid">
                    <div className="stat-card"><h4>Conformes (C)</h4><div className="value C">{stats.C}</div></div>
                    <div className="stat-card"><h4>No Conformes (NC)</h4><div className="value NC">{stats.NC}</div></div>
                    <div className="stat-card"><h4>No Observados (NO)</h4><div className="value NO">{stats.NO}</div></div>
                    <div className="stat-card">
                        <h4>NC Cerradas</h4>
                        <div className="value" style={{ color: COLORS["NC Cerrada"] }}>{stats["NC Cerrada"]}</div>
                    </div>
                </div>
                 <div className="stats-grid" style={{marginTop: '1rem'}}>
                    <div className="stat-card card-link" onClick={() => navigate('/planes-de-accion')}>
                        <h4>Planes Pendientes</h4>
                        <div className="value" style={{ color: 'var(--warning-color)' }}>{stats.pendiente}</div>
                    </div>
                    <div className="stat-card"><h4>Planes en Progreso</h4><div className="value" style={{ color: 'var(--primary-color)' }}>{stats.en_progreso}</div></div>
                    <div className="stat-card"><h4>Planes Completados</h4><div className="value C">{stats.completado}</div></div>
                </div>
            </div>
            {/* ... (resto del JSX del dashboard, que ahora usará los datos del contexto) ... */}
        </div>
    );
};

export default DashboardPage;