// src/components/Header.jsx
import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { toast } from 'react-hot-toast';
import sartorLogo from '../assets/logo-sartor.png'; 

const Header = () => {
  const { user, userRole } = useAuth();
  const { toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    toast.success("Sesión cerrada");
    navigate('/login');
  };

  return (
    <header className="header">
      <Link to="/">
        <img src={sartorLogo} alt="Sartor Logo" style={{ height: '70px', display: 'block' }} />
      </Link>
      <nav className="header-nav">
        {user && (
          <>
            <NavLink to="/" end>Inicio</NavLink>
            {(userRole === 'administrador' || userRole === 'auditor') && <NavLink to="/audits/panel">Panel</NavLink>}
            <NavLink to="/planes-de-accion">Planes de Acción</NavLink>
            <NavLink to="/dashboard">Dashboard</NavLink>
          </>
        )}
        <button onClick={toggleTheme} className="theme-toggle">🌗</button>
        {user && <button onClick={handleLogout} className="btn btn-secondary">Salir</button>}
      </nav>
    </header>
  );
};

export default Header;