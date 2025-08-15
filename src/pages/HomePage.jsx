// src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SeedDatabaseButton from '../components/SeedDatabaseButton.jsx';

// Pequeño componente interno para la tarjeta
const HomeCard = ({ to, icon, title, description }) => (
    <Link to={to} className="home-card">
        <div className="icon">{icon}</div>
        <h3>{title}</h3>
        <p>{description}</p>
    </Link>
);

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
                        <HomeCard 
                            to="/audits/panel" 
                            icon="📋"
                            title="Panel de Auditorías" 
                            description="Ver, continuar o cerrar auditorías." 
                        />
                        <HomeCard 
                            to="/audit/new"
                            icon="✏️"
                            title="Nueva Auditoría"
                            description="Iniciar una auditoría desde cero."
                        />
                    </>
                )}
                <HomeCard 
                    to="/planes-de-accion"
                    icon="🛠️"
                    title="Planes de Acción"
                    description="Seguimiento de no conformidades."
                />
                <HomeCard 
                    to="/dashboard"
                    icon="📊"
                    title="Dashboard"
                    description="Visualizar resultados y gráficos."
                />
            </div>
            {userRole === 'administrador' && <SeedDatabaseButton />}
        </div>
    );
};

export default HomePage;