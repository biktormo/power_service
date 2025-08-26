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
import Auditoria5SPage from './pages/Auditoria5SPage.jsx';
import InformeGraficoPage from './pages/InformeGraficoPage.jsx';
import InformeInteractivoPage from './pages/InformeInteractivoPage.jsx';

function App() {
  return (
    <>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas Protegidas Varias */}
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/audit/new" element={<ProtectedRoute allowedRoles={['administrador', 'auditor']}><NewAuditPage /></ProtectedRoute>} />
        <Route path="/audit/:auditId" element={<ProtectedRoute allowedRoles={['administrador', 'auditor']}><AuditPage /></ProtectedRoute>} />
        <Route path="/audits/panel" element={<ProtectedRoute allowedRoles={['administrador', 'auditor']}><AuditsPanelPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/planes-de-accion" element={<ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}><PlanesDeAccionPage /></ProtectedRoute>} />
        <Route path="/plan-de-accion/:tipo/:resultadoId" element={<ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}><PlanDeAccionDetailPage /></ProtectedRoute>} />
        <Route path="*" element={<div style={{ padding: '2rem' }}><Link to="/">Página no encontrada. Volver al inicio.</Link></div>} />
        <Route path="/auditoria-5s" element={<ProtectedRoute><Auditoria5SPage /></ProtectedRoute>} />
        <Route path="/informe-grafico-5s/:auditId" element={<ProtectedRoute><InformeGraficoPage /></ProtectedRoute>} />
        <Route path="/informe-interactivo/ps/:auditId" element={<ProtectedRoute><InformeInteractivoPage /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default App;
