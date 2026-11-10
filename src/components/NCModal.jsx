// src/components/NCModal.jsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseServices } from '../firebase/services';
import { formatDate } from '../utils/exportUtils';
import { POWER_SERVICE_CHECKLIST } from '../data/powerServiceChecklist';
import { toast } from 'react-hot-toast';
import { serverTimestamp } from 'firebase/firestore';

const NCModal = ({ 
    audit, 
    tipo = '5S', 
    allActionPlans = [], 
    onClose, 
    onPlanCreatedOrUpdated 
}) => {
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState('todos'); // 'todos' | 'sin_plan' | 'con_plan'
    const [searchTerm, setSearchTerm] = useState('');
    const [quickPlanItemId, setQuickPlanItemId] = useState(null); // ID of result currently showing inline plan creator
    const [quickPlanForm, setQuickPlanForm] = useState({ responsable: '', fechaCompromiso: '', accionesRecomendadas: '' });
    const [isSavingPlan, setIsSavingPlan] = useState(false);

    if (!audit) return null;

    const is5S = tipo === '5S';
    const isRepuestos = is5S && (audit.tipo5S === 'repuestos' || audit.numeroAuditoria?.startsWith('5SR'));
    const tipoLabel = is5S ? (isRepuestos ? '5S Repuestos' : '5S Servicio') : 'Power Service';

    // Obtener checklist para resolver textos de ítems si faltan
    const checklist5S = useMemo(() => {
        if (!is5S) return null;
        return isRepuestos 
            ? firebaseServices.get5SRepuestosChecklist(audit.lugar) 
            : firebaseServices.get5SChecklist();
    }, [is5S, isRepuestos, audit.lugar]);

    // Filtrar No Conformes
    const ncList = useMemo(() => {
        const rawResults = audit.resultados || [];
        return rawResults.filter(r => r.resultado === 'No Conforme' || r.resultado === 'NC');
    }, [audit.resultados]);

    // Helper para obtener texto de ítem o requerimiento
    const getItemDescription = (r) => {
        if (is5S) {
            if (r.itemTexto && r.itemTexto.trim()) return r.itemTexto;
            if (checklist5S) {
                const allItems = Object.values(checklist5S).flat();
                const found = allItems.find(i => String(i.id) === String(r.itemId));
                if (found) return found.text;
            }
            return `Ítem de verificación #${r.itemId}`;
        } else {
            // Power Service
            if (r.pilarId && r.estandarId && r.requisitoId) {
                const reqs = POWER_SERVICE_CHECKLIST[r.pilarId]?.estandares[r.estandarId]?.requisitos || [];
                const found = reqs.find(rq => rq.id === r.requisitoId);
                if (found) return `${found.titulo} - ${found.requerimientoOperacional}`;
            }
            return r.requisitoId || 'Requerimiento Power Service';
        }
    };

    // Helper para obtener sección / pilar
    const getItemSection = (r) => {
        if (is5S) {
            if (r.seccion && r.seccion !== 'General') return r.seccion;
            if (checklist5S) {
                const sec = Object.keys(checklist5S).find(k => checklist5S[k].some(i => String(i.id) === String(r.itemId)));
                if (sec) return sec;
            }
            return 'Área de Trabajo';
        } else {
            return POWER_SERVICE_CHECKLIST[r.pilarId]?.nombre || r.pilarId || 'General';
        }
    };

    // Helper para buscar plan de acción existente para un resultado
    const getPlanForNC = (resultadoId) => {
        return allActionPlans.find(p => p.resultadoId === resultadoId);
    };

    // Filtrado de la lista según estado y búsqueda
    const filteredNCs = useMemo(() => {
        return ncList.filter(r => {
            const plan = getPlanForNC(r.id);
            const hasPlan = Boolean(plan);

            if (filterStatus === 'sin_plan' && hasPlan) return false;
            if (filterStatus === 'con_plan' && !hasPlan) return false;

            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const desc = getItemDescription(r).toLowerCase();
                const sec = getItemSection(r).toLowerCase();
                const num = String(r.itemId || r.requisitoId || '').toLowerCase();
                const com = (r.comentarios || '').toLowerCase();
                if (!desc.includes(term) && !sec.includes(term) && !num.includes(term) && !com.includes(term)) {
                    return false;
                }
            }
            return true;
        });
    }, [ncList, filterStatus, searchTerm, allActionPlans]);

    // Conteo de planes
    const stats = useMemo(() => {
        const total = ncList.length;
        const conPlan = ncList.filter(r => Boolean(getPlanForNC(r.id))).length;
        const sinPlan = total - conPlan;
        return { total, conPlan, sinPlan };
    }, [ncList, allActionPlans]);

    // Guardado de Plan Rápido
    const handleQuickPlanSave = async (e, r) => {
        e.preventDefault();
        if (!quickPlanForm.responsable || !quickPlanForm.fechaCompromiso || !quickPlanForm.accionesRecomendadas) {
            toast.error("Por favor completa responsable, fecha y acciones recomendadas.");
            return;
        }

        setIsSavingPlan(true);
        try {
            const planData = {
                responsable: quickPlanForm.responsable.trim(),
                fechaCompromiso: new Date(quickPlanForm.fechaCompromiso),
                accionesRecomendadas: quickPlanForm.accionesRecomendadas.trim(),
                resultadoId: r.id,
                auditId: is5S ? null : audit.id,
                auditoria5SId: is5S ? audit.id : null,
                requisitoId: is5S ? (r.itemId || '') : (r.requisitoId || ''),
                tipoAuditoria: is5S ? '5S' : 'PS',
                estado: 'abierto',
                creadoEn: serverTimestamp(),
                actualizadoEn: serverTimestamp()
            };

            await firebaseServices.saveActionPlan(planData);
            toast.success("¡Plan de acción asignado exitosamente!");
            setQuickPlanItemId(null);
            setQuickPlanForm({ responsable: '', fechaCompromiso: '', accionesRecomendadas: '' });

            if (onPlanCreatedOrUpdated) {
                onPlanCreatedOrUpdated();
            }
        } catch (error) {
            console.error("Error al guardar plan de acción rápido:", error);
            toast.error("Error al guardar el plan de acción.");
        } finally {
            setIsSavingPlan(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100, backgroundColor: 'rgba(0, 0, 0, 0.75)' }}>
            <div 
                className="modal-content" 
                onClick={(e) => e.stopPropagation()} 
                style={{ 
                    maxWidth: '850px', 
                    width: '95%', 
                    maxHeight: '92vh', 
                    overflowY: 'auto',
                    padding: '1.75rem',
                    borderRadius: '12px'
                }}
            >
                {/* ENCABEZADO DEL MODAL */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                            <span className="status-badge" style={{ backgroundColor: isRepuestos ? '#e67e22' : 'var(--primary-color)' }}>
                                {tipoLabel}
                            </span>
                            <span className="status-badge status-cerrada">
                                {audit.numeroAuditoria}
                            </span>
                        </div>
                        <h2 style={{ margin: '0.2rem 0', fontSize: '1.4rem' }}>
                            No Conformidades Detectadas
                        </h2>
                        <p style={{ margin: 0, color: 'var(--text-secondary-color)', fontSize: '0.9rem' }}>
                            <strong>Sucursal:</strong> {audit.lugar} &nbsp;|&nbsp; 
                            <strong>Auditor:</strong> {audit.auditor || audit.auditores?.join(', ')} &nbsp;|&nbsp; 
                            <strong>Fecha:</strong> {formatDate(audit.fecha || audit.fechaCreacion || audit.creadoEn)}
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            fontSize: '1.6rem', 
                            cursor: 'pointer', 
                            color: 'var(--text-secondary-color)',
                            lineHeight: 1,
                            padding: '0.25rem'
                        }}
                        title="Cerrar ventana"
                    >
                        ✕
                    </button>
                </div>

                {/* TARJETAS DE RESUMEN RÁPIDO */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div 
                        onClick={() => setFilterStatus('todos')}
                        style={{ 
                            padding: '0.75rem', 
                            borderRadius: '8px', 
                            background: filterStatus === 'todos' ? 'rgba(0, 123, 255, 0.15)' : 'var(--background-color)',
                            border: filterStatus === 'todos' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                            cursor: 'pointer',
                            textAlign: 'center'
                        }}
                    >
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary-color)' }}>Total NCs</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--danger-color)' }}>{stats.total}</div>
                    </div>
                    <div 
                        onClick={() => setFilterStatus('sin_plan')}
                        style={{ 
                            padding: '0.75rem', 
                            borderRadius: '8px', 
                            background: filterStatus === 'sin_plan' ? 'rgba(220, 53, 69, 0.15)' : 'var(--background-color)',
                            border: filterStatus === 'sin_plan' ? '2px solid var(--danger-color)' : '1px solid var(--border-color)',
                            cursor: 'pointer',
                            textAlign: 'center'
                        }}
                    >
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary-color)' }}>⚠️ Sin Plan de Acción</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--danger-color)' }}>{stats.sinPlan}</div>
                    </div>
                    <div 
                        onClick={() => setFilterStatus('con_plan')}
                        style={{ 
                            padding: '0.75rem', 
                            borderRadius: '8px', 
                            background: filterStatus === 'con_plan' ? 'rgba(40, 167, 69, 0.15)' : 'var(--background-color)',
                            border: filterStatus === 'con_plan' ? '2px solid var(--success-color)' : '1px solid var(--border-color)',
                            cursor: 'pointer',
                            textAlign: 'center'
                        }}
                    >
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary-color)' }}>📋 Con Plan Iniciado</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{stats.conPlan}</div>
                    </div>
                </div>

                {/* BUSCADOR */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <input 
                        type="text" 
                        placeholder="🔍 Buscar por número de ítem, sección, requerimiento u observaciones..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        style={{ 
                            width: '100%', 
                            padding: '0.65rem 1rem', 
                            borderRadius: '8px', 
                            border: '1px solid var(--border-color)', 
                            backgroundColor: 'var(--background-color)', 
                            color: 'var(--text-color)',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* LISTA DE NO CONFORMIDADES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredNCs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary-color)' }}>
                            {ncList.length === 0 
                                ? "🎉 ¡Felicitaciones! Esta auditoría no tiene ninguna No Conformidad registrada."
                                : "No se encontraron No Conformidades con los filtros aplicados."}
                        </div>
                    ) : (
                        filteredNCs.map((r, index) => {
                            const plan = getPlanForNC(r.id);
                            const itemDesc = getItemDescription(r);
                            const itemSec = getItemSection(r);
                            const itemNum = r.itemId || r.requisitoId;
                            const isOpeningQuickPlan = quickPlanItemId === r.id;

                            return (
                                <div 
                                    key={r.id || index} 
                                    className="card" 
                                    style={{ 
                                        margin: 0, 
                                        padding: '1.25rem',
                                        borderLeft: plan ? '5px solid var(--success-color)' : '5px solid var(--danger-color)',
                                        backgroundColor: 'var(--surface-color)',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                    }}
                                >
                                    {/* CABECERA DEL ÍTEM */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <span style={{ 
                                                backgroundColor: 'rgba(220, 53, 69, 0.15)', 
                                                color: 'var(--danger-color)', 
                                                padding: '3px 9px', 
                                                borderRadius: '6px', 
                                                fontWeight: 'bold', 
                                                fontSize: '0.9rem' 
                                            }}>
                                                Ítem #{itemNum}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary-color)', fontWeight: '600' }}>
                                                📁 {itemSec}
                                            </span>
                                        </div>
                                        
                                        {/* ESTADO DEL PLAN */}
                                        {plan ? (
                                            <span style={{ 
                                                backgroundColor: plan.estado === 'completado' ? 'rgba(40, 167, 69, 0.2)' : 'rgba(0, 123, 255, 0.2)', 
                                                color: plan.estado === 'completado' ? 'var(--success-color)' : 'var(--primary-color)',
                                                padding: '4px 10px', 
                                                borderRadius: '12px', 
                                                fontSize: '0.8rem', 
                                                fontWeight: 'bold' 
                                            }}>
                                                ✓ Plan: {plan.estado || 'iniciado'}
                                            </span>
                                        ) : (
                                            <span style={{ 
                                                backgroundColor: 'rgba(220, 53, 69, 0.15)', 
                                                color: 'var(--danger-color)', 
                                                padding: '4px 10px', 
                                                borderRadius: '12px', 
                                                fontSize: '0.8rem', 
                                                fontWeight: 'bold' 
                                            }}>
                                                ⚠️ Sin Plan Asignado
                                            </span>
                                        )}
                                    </div>

                                    {/* DESCRIPCIÓN DEL REQUERIMIENTO */}
                                    <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                                        {itemDesc}
                                    </div>

                                    {/* OBSERVACIONES / COMENTARIOS */}
                                    {r.comentarios && (
                                        <div style={{ 
                                            backgroundColor: 'var(--background-color)', 
                                            padding: '0.6rem 0.85rem', 
                                            borderRadius: '6px', 
                                            fontSize: '0.9rem', 
                                            marginBottom: '0.75rem',
                                            borderLeft: '3px solid var(--border-color)'
                                        }}>
                                            <strong style={{ color: 'var(--text-secondary-color)' }}>Observación del Auditor:</strong> <em>"{r.comentarios}"</em>
                                        </div>
                                    )}

                                    {/* EVIDENCIAS / ADJUNTOS */}
                                    {r.adjuntos && r.adjuntos.length > 0 && (
                                        <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary-color)' }}>Evidencias:</span>
                                            {r.adjuntos.map((att, attIdx) => (
                                                <a 
                                                    key={attIdx} 
                                                    href={att.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    style={{ 
                                                        fontSize: '0.8rem', 
                                                        color: 'var(--primary-color)', 
                                                        textDecoration: 'underline',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '3px'
                                                    }}
                                                >
                                                    📷 Evidencia #{attIdx + 1}
                                                </a>
                                            ))}
                                        </div>
                                    )}

                                    {/* SECCIÓN PLAN DE ACCIÓN */}
                                    <div style={{ 
                                        marginTop: '0.85rem', 
                                        padding: '0.85rem', 
                                        borderRadius: '8px', 
                                        backgroundColor: plan ? 'rgba(40, 167, 69, 0.05)' : 'rgba(255, 193, 7, 0.08)',
                                        border: plan ? '1px solid rgba(40, 167, 69, 0.2)' : '1px solid rgba(255, 193, 7, 0.3)'
                                    }}>
                                        {plan ? (
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <div>
                                                        <strong style={{ fontSize: '0.95rem' }}>Plan de Acción Activo:</strong>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary-color)', marginTop: '2px' }}>
                                                            👤 <strong>Responsable:</strong> {plan.responsable} &nbsp;|&nbsp; 
                                                            📅 <strong>Compromiso:</strong> {formatDate(plan.fechaCompromiso)}
                                                        </div>
                                                    </div>
                                                    <button 
                                                        className="btn btn-primary"
                                                        onClick={() => navigate(`/plan-de-accion/${is5S ? '5S' : 'PS'}/${r.id}`)}
                                                        style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                                                    >
                                                        🔍 Ver / Editar Plan Completo →
                                                    </button>
                                                </div>
                                                <div style={{ fontSize: '0.88rem', color: 'var(--text-color)' }}>
                                                    <strong>Acciones:</strong> {plan.accionesRecomendadas}
                                                </div>
                                                {plan.avances && plan.avances.length > 0 && (
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', marginTop: '0.4rem', fontWeight: 'bold' }}>
                                                        📈 {plan.avances.length} avance(s) registrado(s)
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                {!isOpeningQuickPlan ? (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>
                                                            Este ítem no conforme requiere un plan de acción para su resolución.
                                                        </span>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button 
                                                                type="button" 
                                                                className="btn btn-secondary"
                                                                onClick={() => {
                                                                    setQuickPlanItemId(r.id);
                                                                    setQuickPlanForm({ responsable: '', fechaCompromiso: '', accionesRecomendadas: '' });
                                                                }}
                                                                style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                                                            >
                                                                ⚡ Crear Plan Rápido
                                                            </button>
                                                            <button 
                                                                type="button" 
                                                                className="btn btn-danger"
                                                                onClick={() => navigate(`/plan-de-accion/${is5S ? '5S' : 'PS'}/${r.id}`)}
                                                                style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                                                            >
                                                                ➕ Iniciar Plan Detallado →
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* FORMULARIO DE CREACIÓN RÁPIDA INLINE */
                                                    <form onSubmit={(e) => handleQuickPlanSave(e, r)} style={{ marginTop: '0.5rem' }}>
                                                        <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--primary-color)', fontSize: '0.95rem' }}>
                                                            ⚡ Asignar Plan de Acción Inmediato
                                                        </h4>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                                            <div>
                                                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Responsable *</label>
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Ej: Mauro Cabus / Juan Pérez" 
                                                                    value={quickPlanForm.responsable}
                                                                    onChange={(e) => setQuickPlanForm({ ...quickPlanForm, responsable: e.target.value })}
                                                                    required
                                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginTop: '3px', boxSizing: 'border-box' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Fecha de Compromiso *</label>
                                                                <input 
                                                                    type="date" 
                                                                    value={quickPlanForm.fechaCompromiso}
                                                                    onChange={(e) => setQuickPlanForm({ ...quickPlanForm, fechaCompromiso: e.target.value })}
                                                                    required
                                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginTop: '3px', boxSizing: 'border-box' }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div style={{ marginBottom: '0.75rem' }}>
                                                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Acciones Recomendadas / Plan de Solución *</label>
                                                            <textarea 
                                                                placeholder="Describa brevemente la acción a implementar para resolver esta NC..."
                                                                value={quickPlanForm.accionesRecomendadas}
                                                                onChange={(e) => setQuickPlanForm({ ...quickPlanForm, accionesRecomendadas: e.target.value })}
                                                                rows="2"
                                                                required
                                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginTop: '3px', boxSizing: 'border-box' }}
                                                            />
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                            <button 
                                                                type="button" 
                                                                className="btn btn-secondary" 
                                                                onClick={() => setQuickPlanItemId(null)}
                                                                disabled={isSavingPlan}
                                                                style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                                                            >
                                                                Cancelar
                                                            </button>
                                                            <button 
                                                                type="submit" 
                                                                className="btn btn-success" 
                                                                disabled={isSavingPlan}
                                                                style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                                            >
                                                                {isSavingPlan ? 'Guardando...' : '💾 Guardar Plan'}
                                                            </button>
                                                        </div>
                                                    </form>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* PIE DEL MODAL */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary-color)' }}>
                        Mostrando {filteredNCs.length} de {ncList.length} No Conformidades
                    </span>
                    <button onClick={onClose} className="btn btn-secondary">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NCModal;
