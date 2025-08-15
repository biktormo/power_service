// src/pages/PlanesDeAccionPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { firebaseServices } from '../firebase/services';
import ProtectedRoute from '../components/ProtectedRoute';
import { toast } from 'react-hot-toast';

const PlanesDeAccionPage = () => {
    const [loading, setLoading] = useState(true);
    const [audits, setAudits] = useState([]);
    const [selectedAudit, setSelectedAudit] = useState(null);
    const [nonConformities, setNonConformities] = useState([]);
    const [actionPlansStatus, setActionPlansStatus] = useState({});
    const [isFetchingNCs, setIsFetchingNCs] = useState(false);

    useEffect(() => {
        const fetchAudits = async () => {
            setLoading(true);
            try {
                const allAudits = await firebaseServices.getAllAuditsWithResults();
                setAudits(allAudits);
            } catch (error) {
                toast.error("No se pudieron cargar las auditorías.");
            } finally {
                setLoading(false);
            }
        };
        fetchAudits();
    }, []);

    useEffect(() => {
        const fetchNCs = async () => {
            if (!selectedAudit) {
                setNonConformities([]);
                return;
            }
            setIsFetchingNCs(true);
            try {
                const ncs = selectedAudit.resultados.filter(r => r.resultado === 'NC');
                const enrichedNcsPromises = ncs.map(async (nc) => {
                    const reqData = await firebaseServices.getSingleRequirement(nc.pilarId, nc.estandarId, nc.requisitoId);
                    const planData = await firebaseServices.getActionPlan(nc.id);
                    return {
                        ...nc,
                        requerimientoOperacional: reqData ? reqData.requerimientoOperacional : 'No se encontró el requerimiento.',
                        planStatus: planData ? planData.estado : 'pendiente',
                    };
                });
                const enrichedNcs = await Promise.all(enrichedNcsPromises);
                setNonConformities(enrichedNcs);
            } catch (error) {
                toast.error("No se pudieron cargar las no conformidades.");
                console.error(error);
            } finally {
                setIsFetchingNCs(false);
            }
        };
        fetchNCs();
    }, [selectedAudit]);

    const handleAuditChange = (e) => {
        const auditId = e.target.value;
        const audit = audits.find(a => a.id === auditId);
        setSelectedAudit(audit);
    };

    return (
        <ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}>
            <div className="audits-panel-container">
                <h1>Panel de Planes de Acción</h1>
                <div className="card">
                <div className="form-group">
                    <label htmlFor="audit-select">Selecciona una Auditoría para ver sus No Conformidades</label>
                    <select
                        id="audit-select" // <-- AÑADE ESTE ID
                        value={selectedAudit?.id || ''}
                        onChange={handleAuditChange}
                        disabled={loading}
                        >
                            <option value="">-- Elige una auditoría --</option>
                            {audits.map(audit => (
                                // --- LA CORRECCIÓN CLAVE ESTÁ AQUÍ ---
                                <option key={audit.id} value={audit.id}>
                                    {audit.numeroAuditoria} - {audit.lugar} ({audit.estado})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {isFetchingNCs && <div className="loading-spinner">Cargando no conformidades...</div>}
                
                {!isFetchingNCs && selectedAudit && nonConformities.length > 0 && (
                    <div className="requisito-list-container">
                        <h3>No Conformidades Encontradas</h3>
                        <div className="requisito-list">
                            {nonConformities.map(nc => (
                                <Link to={`/plan-de-accion/${nc.id}`} key={nc.id} className="requisito-item status-NC" style={{ display: 'block', color: 'inherit', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <strong>Requisito: {nc.requisitoId}</strong>
                                        <span className={`status-badge status-${nc.planStatus}`}>
                                            {nc.planStatus.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9em', color: 'var(--text-color)' }}>{nc.requerimientoOperacional}</p>
                                    <p style={{ margin: '0 0 0.5rem 0', fontStyle: 'italic', color: 'var(--text-secondary-color)' }}>
                                        <strong>Comentario:</strong> "{nc.comentarios || 'Sin comentarios'}"
                                    </p>
                                    <small style={{ color: 'var(--text-secondary-color)' }}>
                                        <strong>Auditores:</strong> {selectedAudit.auditores.join(', ')} | 
                                        <strong> Auditados:</strong> {selectedAudit.auditados.join(', ')} | 
                                        <strong> Fecha:</strong> {selectedAudit.fechaCreacion.toDate().toLocaleDateString()}
                                    </small>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {!isFetchingNCs && selectedAudit && nonConformities.length === 0 && (
                    <div className="card">
                        <p>¡Excelente! No se encontraron No Conformidades en esta auditoría.</p>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
};

export default PlanesDeAccionPage;