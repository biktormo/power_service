// src/App.jsx

import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';

// Importar Componentes
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Importar Páginas
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import NewAuditPage from './pages/NewAuditPage.jsx';
import AuditsPanelPage from './pages/AuditsPanelPage.jsx';
import AuditPage from './pages/AuditPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PlanesDeAccionPage from './pages/PlanesDeAccionPage.jsx';
import PlanDeAccionDetailPage from './pages/PlanDeAccionDetailPage.jsx';

function App() {
  return (
    <>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas Protegidas */}
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/audit/new" element={<ProtectedRoute allowedRoles={['administrador', 'auditor']}><NewAuditPage /></ProtectedRoute>} />
        <Route path="/audit/:auditId" element={<ProtectedRoute allowedRoles={['administrador', 'auditor']}><AuditPage /></ProtectedRoute>} />
        <Route path="/audits/panel" element={<ProtectedRoute allowedRoles={['administrador', 'auditor']}><AuditsPanelPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/planes-de-accion" element={<ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}><PlanesDeAccionPage /></ProtectedRoute>} />
        <Route path="/plan-de-accion/:resultadoId" element={<ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}><PlanDeAccionDetailPage /></ProtectedRoute>} />
        
        <Route path="*" element={<div style={{ padding: '2rem' }}><Link to="/">Página no encontrada. Volver al inicio.</Link></div>} />
      </Routes>
    </>
  );
}

export default App;