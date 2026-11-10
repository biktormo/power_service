// src/components/RankingNCRecurrentes.jsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { firebaseServices } from '../firebase/services';
import { POWER_SERVICE_CHECKLIST } from '../data/powerServiceChecklist';

const RankingNCRecurrentes = ({ 
    audits = [], 
    tipo = '5S', 
    tipo5S = 'servicio',
    allActionPlans = [] 
}) => {
    const navigate = useNavigate();
    const [filterLugar, setFilterLugar] = useState('Todas');
    const [topLimit, setTopLimit] = useState(8);

    const is5S = tipo === '5S';
    const isRepuestos = is5S && (tipo5S === 'repuestos');

    // Filtrar auditorías por sucursal si corresponde
    const filteredAudits = useMemo(() => {
        if (filterLugar === 'Todas') return audits;
        return audits.filter(a => a.lugar === filterLugar);
    }, [audits, filterLugar]);

    // Calcular estadísticas acumuladas de ítems no conformes
    const rankingData = useMemo(() => {
        const itemMap = {};

        filteredAudits.forEach(audit => {
            const rawResults = audit.resultados || [];
            const isAuditRepuestos = audit.tipo5S === 'repuestos' || audit.numeroAuditoria?.startsWith('5SR');
            
            // Checklist de referencia para obtener títulos
            const checklist5S = is5S 
                ? (isAuditRepuestos ? firebaseServices.get5SRepuestosChecklist(audit.lugar) : firebaseServices.get5SChecklist()) 
                : null;
            const allItems5S = checklist5S ? Object.values(checklist5S).flat() : [];

            rawResults.forEach(r => {
                if (r.resultado === 'No Conforme' || r.resultado === 'NC') {
                    const key = is5S ? String(r.itemId) : String(r.requisitoId || r.id);
                    
                    if (!itemMap[key]) {
                        let text = '';
                        let seccion = '';

                        if (is5S) {
                            if (r.itemTexto && r.itemTexto.trim()) {
                                text = r.itemTexto;
                            } else {
                                const found = allItems5S.find(i => String(i.id) === key);
                                text = found ? found.text : `Ítem #${key}`;
                            }
                            seccion = r.seccion || (checklist5S ? Object.keys(checklist5S).find(k => checklist5S[k].some(i => String(i.id) === key)) : 'General') || 'General';
                        } else {
                            // Power Service
                            if (r.pilarId && r.estandarId && r.requisitoId) {
                                const reqs = POWER_SERVICE_CHECKLIST[r.pilarId]?.estandares[r.estandarId]?.requisitos || [];
                                const found = reqs.find(rq => rq.id === r.requisitoId);
                                if (found) text = `${found.titulo} - ${found.requerimientoOperacional}`;
                            }
                            text = text || r.requisitoId || `Requerimiento ${key}`;
                            seccion = POWER_SERVICE_CHECKLIST[r.pilarId]?.nombre || r.pilarId || 'Pilar';
                        }

                        itemMap[key] = {
                            key,
                            itemId: key,
                            text,
                            seccion,
                            totalFallas: 0,
                            byBranch: { Charata: 0, Bandera: 0, Quimili: 0 },
                            auditorias: [],
                            resultIds: []
                        };
                    }

                    itemMap[key].totalFallas += 1;
                    if (audit.lugar && itemMap[key].byBranch[audit.lugar] !== undefined) {
                        itemMap[key].byBranch[audit.lugar] += 1;
                    }
                    itemMap[key].auditorias.push(audit.numeroAuditoria || audit.id);
                    if (r.id) itemMap[key].resultIds.push(r.id);
                }
            });
        });

        const list = Object.values(itemMap);
        list.sort((a, b) => b.totalFallas - a.totalFallas);
        return list;
    }, [filteredAudits, is5S]);

    // Limitar para gráfico de barras
    const chartData = useMemo(() => {
        return rankingData.slice(0, topLimit).map(item => {
            const shortText = item.text.length > 32 ? item.text.slice(0, 32) + '...' : item.text;
            return {
                name: `Ítem #${item.itemId}: ${shortText}`,
                label: `Ítem #${item.itemId}`,
                fullText: item.text,
                seccion: item.seccion,
                fallas: item.totalFallas,
                itemId: item.itemId,
                byBranch: item.byBranch
            };
        });
    }, [rankingData, topLimit]);

    // Helper para determinar nivel de urgencia
    const getUrgencyLevel = (fallas) => {
        if (fallas >= 4) {
            return { label: 'CRÍTICO / URGENTE', bg: '#dc3545', color: '#fff', icon: '🚨' };
        }
        if (fallas >= 2) {
            return { label: 'ALTA PRIORIDAD', bg: '#fd7e14', color: '#fff', icon: '⚠️' };
        }
        return { label: 'OBSERVACIÓN', bg: '#6c757d', color: '#fff', icon: 'ℹ️' };
    };

    // Helper para contar planes de acción asociados
    const countPlansForItem = (resultIds) => {
        if (!allActionPlans || allActionPlans.length === 0) return 0;
        const setIds = new Set(resultIds);
        return allActionPlans.filter(p => setIds.has(p.resultadoId)).length;
    };

    // Paleta de degradado de rojo a naranja para las barras
    const getBarColor = (index) => {
        const colors = [
            '#d90429', '#ef233c', '#f77f00', '#fcbf49', 
            '#e85d04', '#dc2f02', '#d00000', '#9d0208'
        ];
        return colors[index % colors.length];
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{ backgroundColor: 'var(--surface-color)', padding: '0.85rem 1rem', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxWidth: '340px' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--danger-color)', marginBottom: '4px' }}>
                        {data.label} ({data.seccion})
                    </div>
                    <div style={{ fontSize: '0.88rem', marginBottom: '8px', color: 'var(--text-color)' }}>
                        {data.fullText}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-color)', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                        🔴 {data.fallas} fallas detectadas
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary-color)', marginTop: '4px' }}>
                        Charata: {data.byBranch.Charata} | Bandera: {data.byBranch.Bandera} | Quimilí: {data.byBranch.Quimili}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="dashboard-section" style={{ marginTop: '1.5rem', borderTop: '2px solid var(--border-color)', paddingTop: '1.5rem' }}>
            {/* CABECERA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.3rem' }}>🚨</span>
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                            Acumulado de No Conformidades más Repetidas
                        </h3>
                    </div>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary-color)', fontSize: '0.9rem' }}>
                        Identifica los ítems que fallan con mayor frecuencia en las inspecciones para ejecutar acciones con urgencia.
                    </p>
                </div>

                {/* FILTROS */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Sucursal:</label>
                        <select 
                            value={filterLugar} 
                            onChange={(e) => setFilterLugar(e.target.value)}
                            style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--background-color)', color: 'var(--text-color)', fontSize: '0.85rem' }}
                        >
                            <option value="Todas">Todas las Sucursales</option>
                            <option value="Charata">Charata</option>
                            <option value="Bandera">Bandera</option>
                            <option value="Quimili">Quimili</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Mostrar:</label>
                        <select 
                            value={topLimit} 
                            onChange={(e) => setTopLimit(Number(e.target.value))}
                            style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--background-color)', color: 'var(--text-color)', fontSize: '0.85rem' }}
                        >
                            <option value={5}>Top 5</option>
                            <option value={8}>Top 8</option>
                            <option value={12}>Top 12</option>
                            <option value={20}>Top 20</option>
                        </select>
                    </div>
                </div>
            </div>

            {rankingData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary-color)' }}>
                    ✅ No se registran No Conformidades repetidas en el grupo de auditorías seleccionado.
                </div>
            ) : (
                <>
                    {/* GRÁFICO DE BARRAS HORIZONTALES */}
                    <div style={{ backgroundColor: 'var(--surface-color)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--text-secondary-color)' }}>
                            📊 Top {chartData.length} Ítems con Mayor Cantidad de Fallas Acumuladas
                        </h4>
                        <ResponsiveContainer width="100%" height={Math.max(260, chartData.length * 40)}>
                            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} domain={[0, 'dataMax + 1']} />
                                <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 12, fill: 'var(--text-color)' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="fallas" radius={[0, 6, 6, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* MATRIZ DE URGENCIA Y PLANES DE ACCIÓN */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem' }}>
                                📋 Matriz de Prioridad y Acciones Urgentes
                            </h4>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary-color)' }}>
                                Total {rankingData.length} ítems observados en {filteredAudits.length} auditorías
                            </span>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="audits-table" style={{ margin: 0 }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
                                        <th style={{ width: '130px' }}>Urgencia</th>
                                        <th style={{ width: '100px' }}>Ítem</th>
                                        <th style={{ width: '130px' }}>Sección / Pilar</th>
                                        <th>Descripción del Requerimiento</th>
                                        <th style={{ width: '90px', textAlign: 'center' }}>Fallas</th>
                                        <th style={{ width: '160px' }}>Por Sucursal</th>
                                        <th style={{ width: '110px', textAlign: 'center' }}>Planes</th>
                                        <th style={{ width: '130px', textAlign: 'center' }}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rankingData.slice(0, topLimit).map((item, index) => {
                                        const urgency = getUrgencyLevel(item.totalFallas);
                                        const plansCount = countPlansForItem(item.resultIds);
                                        const rankIcons = ['🥇', '🥈', '🥉'];
                                        const rankDisplay = rankIcons[index] || `#${index + 1}`;

                                        return (
                                            <tr key={item.key}>
                                                <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                    {rankDisplay}
                                                </td>
                                                <td>
                                                    <span style={{ 
                                                        backgroundColor: urgency.bg, 
                                                        color: urgency.color, 
                                                        padding: '3px 8px', 
                                                        borderRadius: '12px', 
                                                        fontSize: '0.75rem', 
                                                        fontWeight: 'bold',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '3px',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {urgency.icon} {urgency.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                                        Ítem #{item.itemId}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary-color)', fontWeight: '600' }}>
                                                    {item.seccion}
                                                </td>
                                                <td style={{ fontSize: '0.92rem' }}>
                                                    {item.text}
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--danger-color)' }}>
                                                    {item.totalFallas}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                                                        {item.byBranch.Charata > 0 && (
                                                            <span style={{ backgroundColor: 'var(--background-color)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                                                CH: {item.byBranch.Charata}
                                                            </span>
                                                        )}
                                                        {item.byBranch.Bandera > 0 && (
                                                            <span style={{ backgroundColor: 'var(--background-color)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                                                BA: {item.byBranch.Bandera}
                                                            </span>
                                                        )}
                                                        {item.byBranch.Quimili > 0 && (
                                                            <span style={{ backgroundColor: 'var(--background-color)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                                                                QU: {item.byBranch.Quimili}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {plansCount > 0 ? (
                                                        <span style={{ color: 'var(--success-color)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                            ✓ {plansCount} activo(s)
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'var(--danger-color)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                            0 planes
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button 
                                                        className="btn btn-secondary"
                                                        onClick={() => navigate(`/planes-de-accion?modulo=${is5S ? (isRepuestos ? '5S_repuestos' : '5S_servicio') : 'PS'}`)}
                                                        style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', whiteSpace: 'nowrap' }}
                                                        title="Ver y gestionar planes de acción para este módulo"
                                                    >
                                                        Planes de Acción →
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default RankingNCRecurrentes;
