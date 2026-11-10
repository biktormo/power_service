// src/pages/PlanesDeAccionPage.jsx

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { firebaseServices } from '../firebase/services';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { toast } from 'react-hot-toast';
import { formatDate } from '../utils/exportUtils.js';

const PlanesDeAccionPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialModulo = searchParams.get('modulo') || 'PS'; // 'PS' | '5S_servicio' | '5S_repuestos'

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(initialModulo);

    // Auditorías y datos
    const [auditsPS, setAuditsPS] = useState([]);
    const [selectedAuditPS, setSelectedAuditPS] = useState(null);
    const [nonConformitiesPS, setNonConformitiesPS] = useState([]);

    const [audits5S, setAudits5S] = useState([]);
    const [selectedAudit5S, setSelectedAudit5S] = useState(null);
    const [nonConformities5S, setNonConformities5S] = useState([]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchParams({ modulo: tab });
        setSelectedAuditPS(null);
        setSelectedAudit5S(null);
        setNonConformitiesPS([]);
        setNonConformities5S([]);
    };

    // Cargar listas de auditorías según la pestaña
    useEffect(() => {
        setLoading(true);
        if (activeTab === 'PS') {
            firebaseServices.getAllAuditsWithResults()
                .then(setAuditsPS)
                .catch(() => toast.error("No se pudieron cargar las auditorías PS."))
                .finally(() => setLoading(false));
        } else {
            firebaseServices.getAllAuditorias5SWithResults()
                .then(setAudits5S)
                .catch(() => toast.error("No se pudieron cargar las auditorías 5S."))
                .finally(() => setLoading(false));
        }
    }, [activeTab]);

    // Filtrar auditorías 5S por tipo
    const filtered5SAudits = audits5S.filter(a => {
        const isRep = (a.tipo5S === 'repuestos' || a.numeroAuditoria?.startsWith('5SR'));
        return activeTab === '5S_repuestos' ? isRep : !isRep;
    });

    // Cargar No Conformidades al seleccionar auditoría PS
    useEffect(() => {
        if (selectedAuditPS) {
            const ncs = (selectedAuditPS.resultados || []).filter(r => r.resultado === 'NC' || r.resultado === 'No Conforme');
            setNonConformitiesPS(ncs);
        } else {
            setNonConformitiesPS([]);
        }
    }, [selectedAuditPS]);

    // Cargar No Conformidades al seleccionar auditoría 5S
    useEffect(() => {
        if (selectedAudit5S) {
            firebaseServices.getNCsForAuditoria5S(selectedAudit5S.id)
                .then(setNonConformities5S)
                .catch(() => setNonConformities5S([]));
        } else {
            setNonConformities5S([]);
        }
    }, [selectedAudit5S]);

    return (
        <ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}>
            <div className="audits-panel-container">
                {/* BARRA DE NAVEGACIÓN Y BOTÓN REGRESAR */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <button 
                        onClick={() => navigate(-1)} 
                        className="btn btn-secondary" 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}
                    >
                        ← Regresar a la página anterior
                    </button>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link to="/power-service" className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
                            ⚡ Hub Power Service
                        </Link>
                        <Link to="/auditorias-5s" className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
                            🏆 Hub Auditorías 5S
                        </Link>
                        <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
                            🏠 Inicio
                        </Link>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div>
                        <h1 style={{ margin: '0 0 0.25rem 0' }}>Panel de Planes de Acción</h1>
                        <p style={{ margin: 0, color: 'var(--text-secondary-color)' }}>
                            Gestión y resolución de No Conformidades detectadas en auditorías.
                        </p>
                    </div>
                </div>

                {/* SELECTOR DE 3 PESTAÑAS */}
                <div className="tabs">
                    <button 
                        className={`tab-button ${activeTab === 'PS' ? 'active' : ''}`} 
                        onClick={() => handleTabChange('PS')}
                    >
                        ⚡ Power Service
                    </button>
                    <button 
                        className={`tab-button ${activeTab === '5S_servicio' ? 'active' : ''}`} 
                        onClick={() => handleTabChange('5S_servicio')}
                    >
                        🔧 5S Servicio
                    </button>
                    <button 
                        className={`tab-button ${activeTab === '5S_repuestos' ? 'active' : ''}`} 
                        onClick={() => handleTabChange('5S_repuestos')}
                    >
                        📦 5S Repuestos (Nuevo)
                    </button>
                </div>

                {loading && <div className="loading-spinner">Cargando auditorías...</div>}

                {/* --- CONTENIDO POWER SERVICE --- */}
                {!loading && activeTab === 'PS' && (
                    <div className="tab-content">
                        <div className="card">
                            <div className="form-group">
                                <label style={{ fontWeight: 'bold' }}>1. Selecciona una Auditoría Power Service</label>
                                <select 
                                    value={selectedAuditPS?.id || ''} 
                                    onChange={(e) => setSelectedAuditPS(auditsPS.find(a => a.id === e.target.value) || null)}
                                >
                                    <option value="">-- Elige una auditoría PS --</option>
                                    {auditsPS.map(audit => (
                                        <option key={audit.id} value={audit.id}>
                                            {audit.numeroAuditoria} - {audit.lugar} ({audit.estado || 'abierta'}) - {formatDate(audit.fechaCreacion)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {selectedAuditPS && (
                            <div style={{ marginTop: '1.5rem' }}>
                                <h3>No Conformidades detectadas ({nonConformitiesPS.length})</h3>
                                {nonConformitiesPS.length > 0 ? (
                                    <div className="requisito-list">
                                        {nonConformitiesPS.map(nc => (
                                            <Link to={`/plan-de-accion/PS/${nc.id}`} key={nc.id} className="requisito-item status-NC">
                                                <div>
                                                    <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--danger-color)' }}>
                                                        {nc.requisitoId}
                                                    </span>
                                                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-color)' }}>
                                                        {nc.comentarios || "Sin comentarios ingresados durante la auditoría"}
                                                    </p>
                                                </div>
                                                <span className="btn btn-primary btn-sm">Ver / Crear Plan →</span>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                                        <h4 style={{ color: 'var(--success-color)' }}>¡Excelente!</h4>
                                        <p>Esta auditoría de Power Service no tiene No Conformidades registradas.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* --- CONTENIDO 5S (SERVICIO O REPUESTOS) --- */}
                {!loading && (activeTab === '5S_servicio' || activeTab === '5S_repuestos') && (
                    <div className="tab-content">
                        <div className="card">
                            <div className="form-group">
                                <label style={{ fontWeight: 'bold' }}>
                                    1. Selecciona una Auditoría {activeTab === '5S_repuestos' ? '5S Repuestos' : '5S Servicio'}
                                </label>
                                <select 
                                    value={selectedAudit5S?.id || ''} 
                                    onChange={(e) => setSelectedAudit5S(filtered5SAudits.find(a => a.id === e.target.value) || null)}
                                >
                                    <option value="">-- Elige una auditoría 5S --</option>
                                    {filtered5SAudits.map(audit => (
                                        <option key={audit.id} value={audit.id}>
                                            {audit.numeroAuditoria} - {audit.lugar} ({audit.estado || 'en_progreso'}) - {formatDate(audit.fecha || audit.creadoEn)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {selectedAudit5S && (
                            <div style={{ marginTop: '1.5rem' }}>
                                <h3>No Conformidades detectadas ({nonConformities5S.length})</h3>
                                {nonConformities5S.length > 0 ? (
                                    <div className="requisito-list">
                                        {nonConformities5S.map(nc => (
                                            <Link to={`/plan-de-accion/5S/${nc.id}`} key={nc.id} className="requisito-item status-NC">
                                                <div>
                                                    <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--danger-color)' }}>
                                                        Ítem {nc.itemId}: {nc.seccion || 'General'}
                                                    </span>
                                                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-color)' }}>
                                                        <strong>{nc.itemTexto}</strong>
                                                    </p>
                                                    {nc.comentarios && (
                                                        <p style={{ margin: '0.25rem 0 0 0', fontStyle: 'italic', color: 'var(--text-secondary-color)' }}>
                                                            Observación: "{nc.comentarios}"
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="btn btn-primary btn-sm">Ver / Crear Plan →</span>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                                        <h4 style={{ color: 'var(--success-color)' }}>¡Excelente!</h4>
                                        <p>No se encontraron No Conformidades en esta auditoría de 5S.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
};

export default PlanesDeAccionPage;
