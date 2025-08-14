// src/pages/AuditsPanelPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { firebaseServices } from '../firebase/services';
import { toast } from 'react-hot-toast';

const AuditsPanelPage = () => {
    const [audits, setAudits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalRequisitos, setTotalRequisitos] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAuditsAndData = async () => {
            setLoading(true);
            try {
                const allAudits = await firebaseServices.getAllAuditsWithResults();
                setAudits(allAudits);

                const checklist = await firebaseServices.getFullChecklist();
                let count = 0;
                Object.values(checklist).forEach(pilar => {
                    Object.values(pilar.estandares).forEach(estandar => {
                        count += estandar.requisitos.length;
                    });
                });
                setTotalRequisitos(count);
            } catch (error) {
                toast.error("No se pudieron cargar las auditorías.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchAuditsAndData();
    }, []);

    const getAuditedPilares = (resultados) => {
        if (!resultados || resultados.length === 0) return 'Ninguno';
        const pilares = [...new Set(resultados.map(r => r.pilarId))];
        return pilares.join(', ');
    };

    if (loading) return <div className="loading-spinner">Cargando panel...</div>;

    return (
        <div className="audits-panel-container">
            <h1>Panel de Auditorías</h1>
            <div className="audits-table-container card">
                <table className="audits-table">
                    <thead>
                        <tr>
                            <th>Nº Auditoría</th>
                            <th>Lugar</th>
                            <th>Auditores</th>
                            <th>Auditados</th>
                            <th>Pilares Auditados</th>
                            <th>Progreso</th>
                            <th>Fecha Inicio</th>
                            <th>Fecha Cierre</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {audits.map(audit => {
                            const progress = totalRequisitos > 0 ? (audit.resultados.length / totalRequisitos) * 100 : 0;
                            return (
                                <tr key={audit.id}>
                                    <td>{audit.numeroAuditoria}</td>
                                    <td>{audit.lugar}</td>
                                    <td>{audit.auditores ? audit.auditores.join(', ') : 'N/A'}</td>
                                    <td>{audit.auditados ? audit.auditados.join(', ') : 'N/A'}</td>
                                    <td>{getAuditedPilares(audit.resultados)}</td>
                                    <td>
                                        <span>{audit.resultados.length} / {totalRequisitos}</span>
                                        <div className="progress-bar">
                                            <div className="progress-bar-inner" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </td>
                                    <td>{audit.fechaCreacion?.toDate().toLocaleDateString()}</td>
                                    <td>{audit.fechaCierre?.toDate().toLocaleDateString() || 'N/A'}</td>
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
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditsPanelPage;