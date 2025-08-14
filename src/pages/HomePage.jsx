// src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card.jsx';
import SeedDatabaseButton from '../components/SeedDatabaseButton.jsx';

const HomePage = () => {
    const { userRole, loading } = useAuth();

    if (loading) {
        return <div className="loading-spinner">Cargando...</div>;
    }

    return (
        <div className="home-container">
            <h1>Auditorías de Power Service</h1>
            <p>Bienvenido. Selecciona una opción para continuar.</p>
            <div className="card-grid">
                {(userRole === 'administrador' || userRole === 'auditor') && (
                    <>
                        <Link to="/audits/panel" className="card-link">
                            <Card title="Panel de Auditorías" description="Ver, continuar o cerrar auditorías existentes." />
                        </Link>
                        <Link to="/audit/new" className="card-link">
                            <Card title="Ejecutar Nueva Auditoría" description="Iniciar una auditoría desde cero." />
                        </Link>
                    </>
                )}
                <Link to="/planes-de-accion" className="card-link">
                    <Card title="Planes de Acción" description="Seguimiento y gestión de no conformidades." />
                </Link>
                <Link to="/dashboard" className="card-link">
                    <Card title="Dashboard" description="Visualizar resultados, gráficos e informes." />
                </Link>
            </div>
            {userRole === 'administrador' && <SeedDatabaseButton />}
        </div>
    );
};

export default HomePage;