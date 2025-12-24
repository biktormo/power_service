// src/pages/AuditsPanelPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseServices } from '../firebase/services';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

const AuditsPanelPage = () => {
    const [activeTab, setActiveTab] = useState('PS');
    const [loading, setLoading] = useState(true);
    
    const [auditsPS, setAuditsPS] = useState([]);
    const [totalRequisitosPS, setTotalRequisitosPS] = useState(0);

    const [audits5S, setAudits5S] = useState([]);
    const [totalItems5S, setTotalItems5S] = useState(0);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            
            // Definimos valores por defecto por si algo falla
            let auditsPSData = [];
            let totalReqsPS = 0;
            let audits5SData = [];
            let totalItems5SData = 0;
    
            try {
                // 1. Intentamos cargar PS
                try {
                    const audits = await firebaseServices.getAllAuditsWithResults();
                    auditsPSData = audits;
                    
                    const checklist = await firebaseServices.getFullChecklist();
                    if (checklist) {
                        Object.values(checklist).forEach(pilar => {
                            Object.values(pilar.estandares).forEach(estandar => {
                                totalReqsPS += estandar.requisitos.length;
                            });
                        });
                    }
                } catch (e) {
                    console.error("Error cargando datos PS:", e);
                    toast.error("Error al cargar auditorías PS");
                }
    
                // 2. Intentamos cargar 5S
                try {
                    const audits5S = await firebaseServices.getAllAuditorias5SWithResults();
                    audits5SData = audits5S;
    
                    const checklist5S = firebaseServices.get5SChecklist();
                    totalItems5SData = Object.values(checklist5S).reduce((sum, items) => sum + items.length, 0);
                } catch (e) {
                    console.error("Error cargando datos 5S:", e);
                    toast.error("Error al cargar auditorías 5S");
                }
    
                // 3. Actualizamos el estado con lo que hayamos conseguido
                setAuditsPS(auditsPSData);
                setTotalRequisitosPS(totalReqsPS);
                setAudits5S(audits5SData);
                setTotalItems5S(totalItems5SData);
    
            } catch (error) {
                console.error("Error general en el panel:", error);
            } finally {
                // ESTO SE EJECUTA SIEMPRE, GARANTIZANDO QUE EL LOADING DESAPAREZCA
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const getAuditedPilaresPS = (resultados) => {
        if (!resultados || resultados.length === 0) return 'Ninguno';
        const pilares = [...new Set(resultados.map(r => r.pilarId))];
        return pilares.join(', ');
    };

    if (loading) return <div className="loading-spinner">Cargando panel...</div>;

    return (
        <ProtectedRoute allowedRoles={['administrador', 'auditor']}>
            <div className="audits-panel-container">
                <h1>Panel de Auditorías</h1>
                
                <div className="tabs">
                    <button className={`tab-button ${activeTab === 'PS' ? 'active' : ''}`} onClick={() => setActiveTab('PS')}>
                        Auditorías Power Service
                    </button>
                    <button className={`tab-button ${activeTab === '5S' ? 'active' : ''}`} onClick={() => setActiveTab('5S')}>
                        Auditorías 5S
                    </button>
                </div>

                <div className="audits-table-container card">
                    <table className="audits-table">
                        <thead>
                            <tr>
                                <th>Nº Auditoría</th>
                                <th>Lugar</th>
                                <th>Auditor/es</th>
                                {activeTab === 'PS' && <th>Auditados</th>}
                                {activeTab === 'PS' && <th>Pilares</th>}
                                <th>Progreso</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeTab === 'PS' && auditsPS.map(audit => {
                                const progress = totalRequisitosPS > 0 ? (audit.resultados.length / totalRequisitosPS) * 100 : 0;
                                return (
                                    <tr key={audit.id}>
                                        <td>{audit.numeroAuditoria}</td>
                                        <td>{audit.lugar}</td>
                                        <td>{audit.auditores ? audit.auditores.join(', ') : 'N/A'}</td>
                                        <td>{audit.auditados ? audit.auditados.join(', ') : 'N/A'}</td>
                                        <td>{getAuditedPilaresPS(audit.resultados)}</td>
                                        <td>
                                            <span>{audit.resultados.length} / {totalRequisitosPS}</span>
                                            <div className="progress-bar">
                                                <div className="progress-bar-inner" style={{ width: `${progress}%` }}></div>
                                            </div>
                                        </td>
                                        <td>{audit.fechaCreacion?.toDate().toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-badge status-${audit.estado}`}>
                                                {audit.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-primary" onClick={() => navigate(`/audit/${audit.id}`)}>
                                                {audit.estado === 'abierta' ? 'Continuar' : 'Ver'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}

                            {activeTab === '5S' && audits5S.map(audit => {
                                const itemsAuditados = audit.resultados ? audit.resultados.length : 0;
                                const progress = totalItems5S > 0 ? (itemsAuditados / totalItems5S) * 100 : 0;
                                
                                return (
                                    <tr key={audit.id}>
                                        <td>{audit.numeroAuditoria}</td>
                                        <td>{audit.lugar}</td>
                                        <td>{audit.auditor}</td>
                                        <td>
                                            <span>{itemsAuditados} / {totalItems5S}</span>
                                            <div className="progress-bar">
                                                <div className="progress-bar-inner" style={{ width: `${progress}%` }}></div>
                                            </div>
                                        </td>
                                        <td>{audit.creadoEn?.toDate().toLocaleDateString()}</td>
                                        <td>
                                            <span className="status-badge status-en_progreso">En Progreso</span>
                                        </td>
                                        <td>
                                            <button className="btn btn-primary" onClick={() => navigate(`/auditoria-5s/${audit.id}`)}>
                                                Continuar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {activeTab === 'PS' && auditsPS.length === 0 && <p style={{padding: '1rem', textAlign: 'center'}}>No hay auditorías Power Service registradas.</p>}
                    {activeTab === '5S' && audits5S.length === 0 && <p style={{padding: '1rem', textAlign: 'center'}}>No hay auditorías 5S registradas.</p>}
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default AuditsPanelPage;