// src/pages/AuditsPanelPage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext.jsx'; // Importamos el hook del nuevo contexto

const AuditsPanelPage = () => {
    // Obtenemos los datos y el estado de carga directamente del DataContext
    const { audits, totalRequisitos, loading } = useData(); 
    const navigate = useNavigate();

    // Ya no necesitamos el useEffect para cargar datos aquí

    const getAuditedPilares = (resultados) => {
        if (!resultados || resultados.length === 0) return 'Ninguno';
        const pilares = [...new Set(resultados.map(r => r.pilarId))];
        return pilares.join(', ');
    };

    // Usamos el estado de carga global del DataContext
    if (loading) {
        return <div className="loading-spinner">Cargando datos de auditorías...</div>;
    }

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