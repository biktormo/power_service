// src/pages/InformeGraficoPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { firebaseServices } from '../firebase/services';
import ProtectedRoute from '../components/ProtectedRoute';

const InformeGraficoPage = () => {
    const { auditId } = useParams();
    const [audit, setAudit] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAudit = async () => {
            const auditData = await firebaseServices.getAuditoria5SWithResults(auditId);
            setAudit(auditData);
            setLoading(false);
        };
        loadAudit();
    }, [auditId]);

    const nonConformities = audit?.resultados.filter(r => r.resultado === 'No Conforme') || [];

    if (loading) return <div className="loading-spinner">Cargando informe...</div>;
    if (!audit) return <div>Auditoría no encontrada. <Link to="/dashboard">Volver</Link></div>;

    return (
        <ProtectedRoute>
            <div className="report-container">
                {/* Aquí irá el contenido del informe */}
                <h1>Informe Gráfico de No Conformidades</h1>
                <p>Auditoría: {audit.numeroAuditoria}</p>
            </div>
        </ProtectedRoute>
    );
};

export default InformeGraficoPage;
