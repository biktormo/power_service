// src/pages/AuditsPanelPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseServices } from '../firebase/services';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

const AuditsPanelPage = () => {
    const [activeTab, setActiveTab] = useState('PS'); // 'PS' o '5S'
    const [loading, setLoading] = useState(true);
    
    // Estados para PS
    const [auditsPS, setAuditsPS] = useState([]);
    const [totalRequisitosPS, setTotalRequisitosPS] = useState(0);

    // Estados para 5S
    const [audits5S, setAudits5S] = useState([]);
    const [totalItems5S, setTotalItems5S] = useState(0);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllData = async () => {
            const cachedData = getCachedData();
            if (cachedData) {
                setAuditsPS(cachedData.audits || []);
                setTotalRequisitosPS(cachedData.totalRequisitos || 0);
                // Si tuviéramos auditorías 5S en caché, las setearíamos aquí
                setLoading(false);
            }

            try {
                // 1. Cargar Auditorías PS
                const allAuditsPS = await firebaseServices.getAllAuditsWithResults();
                const checklistPS = await firebaseServices.getFullChecklist();
                let countPS = 0;
                if (checklistPS) {
                    Object.values(checklistPS).forEach(pilar => {
                        Object.values(pilar.estandares).forEach(estandar => {
                            countPS += estandar.requisitos.length;
                        });
                    });
                }
                setAuditsPS(allAuditsPS);
                setTotalRequisitosPS(countPS);

                // 2. Cargar Auditorías 5S
                const allAudits5S = await firebaseServices.getAllAuditorias5SWithResults();
                const checklist5S = firebaseServices.get5SChecklist();
                const count5S = Object.values(checklist5S).reduce((sum, items) => sum + items.length, 0);
                
                setAudits5S(allAudits5S);
                setTotalItems5S(count5S);

                // Actualizar Caché (Opcional, si quisieras guardar también las 5S)
                // setCachedData({ ...cachedData, audits: allAuditsPS, audits5S: allAudits5S });

            } catch (error) {
                toast.error("Error al cargar los datos.");
                console.error(error);
            } finally {
                if (!cachedData) setLoading(false);
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
                
                {/* PESTAÑAS DE FILTRO */}
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
                            {/* --- TABLA PS --- */}
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

                            {/* --- TABLA 5S --- */}
                            {activeTab === '5S' && audits5S.map(audit => {
                                // Calculamos progreso contando resultados únicos
                                const itemsAuditados = audit.resultados ? audit.resultados.length : 0;
                                const progress = totalItems5S > 0 ? (itemsAuditados / totalItems5S) * 100 : 0;
                                
                                return (
                                    <tr key={audit.id}>
                                        <td>{audit.numeroAuditoria}</td>
                                        <td>{audit.lugar}</td>
                                        <td>{audit.auditor}</td>
                                        {/* Columnas vacías para mantener alineación si es necesario */}
                                        
                                        <td>
                                            <span>{itemsAuditados} / {totalItems5S}</span>
                                            <div className="progress-bar">
                                                <div className="progress-bar-inner" style={{ width: `${progress}%` }}></div>
                                            </div>
                                        </td>
                                        <td>{audit.creadoEn?.toDate().toLocaleDateString()}</td>
                                        <td>
                                            {/* Asumimos que 5S siempre está "abierta" hasta que se finaliza, 
                                                o podríamos añadir un campo de estado en el futuro */}
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
                    
                    {/* Mensajes de "Sin datos" */}
                    {activeTab === 'PS' && auditsPS.length === 0 && <p style={{padding: '1rem', textAlign: 'center'}}>No hay auditorías Power Service registradas.</p>}
                    {activeTab === '5S' && audits5S.length === 0 && <p style={{padding: '1rem', textAlign: 'center'}}>No hay auditorías 5S registradas.</p>}
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default AuditsPanelPage;