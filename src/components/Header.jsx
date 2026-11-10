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
  const { user } = useAuth();
  const { toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    toast.success("Sesión cerrada");
    navigate('/login');
  };

  return (
    <header className="header">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <img src={sartorLogo} alt="Sartor Logo" style={{ height: '55px', display: 'block' }} />
      </Link>
      <nav className="header-nav">
        {user && (
          <>
            <NavLink to="/" end>Inicio</NavLink>
            <NavLink to="/power-service">Power Service</NavLink>
            <NavLink to="/auditorias-5s">Auditorías 5S</NavLink>
            <NavLink to="/planes-de-accion">Planes de Acción</NavLink>
          </>
        )}
        <button onClick={toggleTheme} className="theme-toggle" title="Cambiar tema">🌗</button>
        {user && <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>Salir</button>}
      </nav>
    </header>
  );
};

export default Header;
