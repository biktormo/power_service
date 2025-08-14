// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, userRole, loading } = useAuth();

    // 1. Mientras carga, mostramos un loader.
    if (loading) {
        return <div className="loading-spinner">Verificando...</div>;
    }

    // 2. Si terminó de cargar y NO hay usuario, lo redirigimos al login.
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. Si hay usuario, pero su rol NO está en la lista de roles permitidos,
    //    lo redirigimos a la página de inicio.
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Nota: No mostramos un toast aquí para evitar bucles.
        // La UI en HomePage se encargará de mostrar solo lo que el usuario puede ver.
        return <Navigate to="/" replace />;
    }

    // 4. Si todo está bien, el usuario tiene permiso.
    return children;
};

export default ProtectedRoute;