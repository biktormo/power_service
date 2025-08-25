// src/pages/PlanesDeAccionPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { firebaseServices } from '../firebase/services';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { toast } from 'react-hot-toast';

const PlanesDeAccionPage = () => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('PS'); // Pestaña activa: 'PS' o '5S'

    // Estados para Auditorías PS
    const [auditsPS, setAuditsPS] = useState([]);
    const [selectedAuditPS, setSelectedAuditPS] = useState(null);
    const [nonConformitiesPS, setNonConformitiesPS] = useState([]);

    // Estados para Auditorías 5S
    const [audits5S, setAudits5S] = useState([]);
    const [selectedAudit5S, setSelectedAudit5S] = useState(null);
    const [nonConformities5S, setNonConformities5S] = useState([]);

    // Carga las listas de auditorías cuando cambia la pestaña
    useEffect(() => {
        setLoading(true);
        if (activeTab === 'PS') {
            firebaseServices.getAllAuditsWithResults()
                .then(setAuditsPS)
                .catch(() => toast.error("No se pudieron cargar las auditorías PS."))
                .finally(() => setLoading(false));
        } else if (activeTab === '5S') {
            firebaseServices.getAllAuditorias5S()
                .then(setAudits5S)
                .catch(() => toast.error("No se pudieron cargar las auditorías 5S."))
                .finally(() => setLoading(false));
        }
    }, [activeTab]);

    // Carga las NCs cuando se selecciona una auditoría
    useEffect(() => {
        if (selectedAuditPS) {
            const ncs = selectedAuditPS.resultados.filter(r => r.resultado === 'NC');
            setNonConformitiesPS(ncs);
        }
    }, [selectedAuditPS]);

    useEffect(() => {
        if (selectedAudit5S) {
            firebaseServices.getNCsForAuditoria5S(selectedAudit5S.id).then(setNonConformities5S);
        }
    }, [selectedAudit5S]);

    const handleAuditChangePS = (e) => {
        const auditId = e.target.value;
        setSelectedAuditPS(auditsPS.find(a => a.id === auditId));
    };

    const handleAuditChange5S = (e) => {
        const auditId = e.target.value;
        setSelectedAudit5S(audits5S.find(a => a.id === auditId));
    };

    return (
        <ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}>
            <div className="audits-panel-container">
                <h1>Panel de Planes de Acción</h1>

                <div className="tabs">
                    <button className={`tab-button ${activeTab === 'PS' ? 'active' : ''}`} onClick={() => setActiveTab('PS')}>
                        Auditorías Power Service
                    </button>
                    <button className={`tab-button ${activeTab === '5S' ? 'active' : ''}`} onClick={() => setActiveTab('5S')}>
                        Auditorías 5S
                    </button>
                </div>

                {loading && <div className="loading-spinner">Cargando...</div>}

                {/* Contenido para la pestaña de Power Service */}
                {!loading && activeTab === 'PS' && (
                    <div className="tab-content">
                        <div className="card">
                            <div className="form-group">
                                <label>Selecciona una Auditoría PS para ver sus No Conformidades</label>
                                <select value={selectedAuditPS?.id || ''} onChange={handleAuditChangePS}>
                                    <option value="">-- Elige una auditoría --</option>
                                    {auditsPS.map(audit => (
                                        <option key={audit.id} value={audit.id}>
                                            {audit.numeroAuditoria} - {audit.lugar} ({audit.estado})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {selectedAuditPS && nonConformitiesPS.length > 0 && (
                             <div className="requisito-list">
                                {nonConformitiesPS.map(nc => (
                                    <Link to={`/plan-de-accion/PS/${nc.id}`} key={nc.id} className="requisito-item status-NC">
                                       <span><strong>{nc.requisitoId}</strong> - {nc.comentarios || "Sin comentarios"}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                         {selectedAuditPS && nonConformitiesPS.length === 0 && <div className="card"><p>¡Excelente! No se encontraron NC en esta auditoría.</p></div>}
                    </div>
                )}
                
                {/* Contenido para la pestaña de 5S */}
                {!loading && activeTab === '5S' && (
                    <div className="tab-content">
                         <div className="card">
                            <div className="form-group">
                                <label>Selecciona una Auditoría 5S para ver sus No Conformidades</label>
                                <select value={selectedAudit5S?.id || ''} onChange={handleAuditChange5S}>
                                    <option value="">-- Elige una auditoría --</option>
                                    {audits5S.map(audit => (
                                        <option key={audit.id} value={audit.id}>
                                            {audit.numeroAuditoria} - {audit.lugar}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                         {selectedAudit5S && nonConformities5S.length > 0 && (
                             <div className="requisito-list">
                                {nonConformities5S.map(nc => (
                                    <Link to={`/plan-de-accion/5S/${nc.id}`} key={nc.id} className="requisito-item status-NC">
                                       <span><strong>Ítem {nc.itemId}</strong> - {nc.comentarios || "Sin comentarios"}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                        {selectedAudit5S && nonConformities5S.length === 0 && <div className="card"><p>¡Excelente! No se encontraron NC en esta auditoría.</p></div>}
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
};

export default PlanesDeAccionPage;
