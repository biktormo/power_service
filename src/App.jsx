// src/App.jsx

import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';

// Importar Componentes
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Importar Páginas
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import NewAuditPage from './pages/NewAuditPage.jsx';
import AuditPage from './pages/AuditPage.jsx';
import PowerServiceHubPage from './pages/PowerServiceHubPage.jsx';
import Auditoria5SHubPage from './pages/Auditoria5SHubPage.jsx';
import PlanesDeAccionPage from './pages/PlanesDeAccionPage.jsx';
import PlanDeAccionDetailPage from './pages/PlanDeAccionDetailPage.jsx';
import Auditoria5SPage from './pages/Auditoria5SPage.jsx';
import InformeGraficoPage from './pages/InformeGraficoPage.jsx';
import InformeInteractivoPage from './pages/InformeInteractivoPage.jsx';
import Informe5SPage from './pages/Informe5SPage.jsx';

function App() {
  return (
    <>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<LoginPage />} />

        {/* Portal de Inicio */}
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

        {/* MÓDULO POWER SERVICE */}
        <Route path="/power-service" element={<ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}><PowerServiceHubPage /></ProtectedRoute>} />
        <Route path="/audit/new" element={<ProtectedRoute allowedRoles={['administrador', 'auditor']}><NewAuditPage /></ProtectedRoute>} />
        <Route path="/audit/:auditId" element={<ProtectedRoute allowedRoles={['administrador', 'auditor']}><AuditPage /></ProtectedRoute>} />
        <Route path="/informe-interactivo/ps/:auditId" element={<ProtectedRoute><InformeInteractivoPage /></ProtectedRoute>} />

        {/* MÓDULO AUDITORÍAS 5S (SERVICIO Y REPUESTOS) */}
        <Route path="/auditorias-5s" element={<ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}><Auditoria5SHubPage /></ProtectedRoute>} />
        <Route path="/auditoria-5s" element={<ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}><Auditoria5SPage /></ProtectedRoute>} />
        <Route path="/auditoria-5s/:auditId" element={<ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}><Auditoria5SPage /></ProtectedRoute>} />
        <Route path="/informe-5s/:auditId" element={<ProtectedRoute><Informe5SPage /></ProtectedRoute>} />
        <Route path="/informe-grafico-5s/:auditId" element={<ProtectedRoute><InformeGraficoPage /></ProtectedRoute>} />

        {/* PLANES DE ACCIÓN */}
        <Route path="/planes-de-accion" element={<ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}><PlanesDeAccionPage /></ProtectedRoute>} />
        <Route path="/plan-de-accion/:tipo/:resultadoId" element={<ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}><PlanDeAccionDetailPage /></ProtectedRoute>} />

        {/* Rutas de Compatibilidad y Redirección */}
        <Route path="/dashboard" element={<Navigate to="/power-service" replace />} />
        <Route path="/audits/panel" element={<Navigate to="/power-service" replace />} />

        {/* 404 */}
        <Route path="*" element={<div style={{ padding: '2rem', textAlign: 'center' }}><h2>Página no encontrada.</h2><Link to="/" className="btn btn-primary">Volver al inicio</Link></div>} />
      </Routes>
    </>
  );
}

export default App;
