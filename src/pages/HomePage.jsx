// src/pages/HomePage.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import SeedDatabaseButton from '../components/SeedDatabaseButton.jsx';
import { firebaseServices } from '../firebase/services.js';

const HomePage = () => {
    const { userRole, loading } = useAuth();
    const navigate = useNavigate();

    const [counts, setCounts] = useState({
        psProgreso: 0,
        psFinalizadas: 0,
        psPlanes: 0,
        servProgreso: 0,
        servFinalizadas: 0,
        repProgreso: 0,
        repFinalizadas: 0,
        planes5S: 0
    });

    useEffect(() => {
        const loadCounts = async () => {
            try {
                const [auditsPS, audits5S, planes] = await Promise.all([
                    firebaseServices.getAllAuditsWithResults().catch(() => []),
                    firebaseServices.getAllAuditorias5SWithResults().catch(() => []),
                    firebaseServices.getAllActionPlans().catch(() => [])
                ]);

                const psProgreso = auditsPS.filter(a => a.estado === 'abierta' || a.estado === 'en_progreso' || !a.estado).length;
                const psFinalizadas = auditsPS.filter(a => a.estado === 'cerrada' || a.estado === 'finalizada').length;
                const psPlanes = planes.filter(p => p.tipoAuditoria === 'PS' && p.estado !== 'completado').length;

                const repAudits = audits5S.filter(a => a.tipo5S === 'repuestos' || a.numeroAuditoria?.startsWith('5SR'));
                const servAudits = audits5S.filter(a => a.tipo5S !== 'repuestos' && !a.numeroAuditoria?.startsWith('5SR'));

                const servProgreso = servAudits.filter(a => a.estado === 'en_progreso' || a.estado === 'abierta').length;
                const servFinalizadas = servAudits.filter(a => a.estado === 'finalizada' || a.estado === 'cerrada').length;

                const repProgreso = repAudits.filter(a => a.estado === 'en_progreso' || a.estado === 'abierta').length;
                const repFinalizadas = repAudits.filter(a => a.estado === 'finalizada' || a.estado === 'cerrada').length;

                const planes5S = planes.filter(p => p.tipoAuditoria === '5S' && p.estado !== 'completado').length;

                setCounts({
                    psProgreso,
                    psFinalizadas,
                    psPlanes,
                    servProgreso,
                    servFinalizadas,
                    repProgreso,
                    repFinalizadas,
                    planes5S
                });
            } catch (err) {
                console.warn("No se pudieron cargar contadores iniciales:", err);
            }
        };
        loadCounts();
    }, []);

    if (loading) {
        return <div className="loading-spinner">Cargando sistema de auditorías...</div>;
    }

    return (
        <div className="home-container" style={{ maxWidth: '1200px', margin: '0 auto', gap: '2rem' }}>
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
                    Portal de Auditorías y Calidad
                </h1>
                <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary-color)', maxWidth: '700px', margin: '0 auto' }}>
                    Selecciona el sistema de auditoría al que deseas acceder para gestionar inspecciones, métricas y planes de acción.
                </p>
            </div>

            {/* SELECCIÓN PRINCIPAL EN 2 GRANDES MÓDULOS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
                
                {/* 1. MÓDULO POWER SERVICE */}
                <div className="card" style={{ 
                    borderTop: '6px solid var(--primary-color)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    padding: '2rem',
                    boxShadow: 'var(--box-shadow)'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '2.5rem' }}>⚡</div>
                            <span className="status-badge" style={{ backgroundColor: 'var(--primary-color)', fontSize: '0.85rem' }}>
                                Estándares John Deere
                            </span>
                        </div>
                        
                        <h2 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>Power Service</h2>
                        <p style={{ color: 'var(--text-secondary-color)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                            Auditorías operacionales, cumplimiento de pilares, evaluación de requisitos y planes correctivos de Power Service.
                        </p>

                        {/* Métricas rápidas */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                            <div style={{ background: 'var(--background-color)', padding: '0.75rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{counts.psProgreso}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary-color)' }}>En Progreso</div>
                            </div>
                            <div style={{ background: 'var(--background-color)', padding: '0.75rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--success-color)' }}>{counts.psFinalizadas}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary-color)' }}>Finalizadas</div>
                            </div>
                            <div style={{ background: 'var(--background-color)', padding: '0.75rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>{counts.psPlanes}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary-color)' }}>Planes NC</div>
                            </div>
                        </div>

                        {/* Accesos directos rápidos de PS */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                            <Link to="/audit/new" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--primary-color)', fontWeight: '500' }}>
                                <span>➕</span> Nueva Auditoría PS
                            </Link>
                            <Link to="/power-service" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--text-color)' }}>
                                <span>⏳</span> Auditorías en Progreso y Finalizadas
                            </Link>
                            <Link to="/power-service" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--text-color)' }}>
                                <span>📊</span> Resultados, Gráficos y Reportes
                            </Link>
                            <Link to="/planes-de-accion" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--text-color)' }}>
                                <span>🛠️</span> Planes de Acción vinculados
                            </Link>
                        </div>
                    </div>

                    <Link to="/power-service" className="btn btn-primary" style={{ textAlign: 'center', fontSize: '1.1rem', padding: '0.8rem', fontWeight: 'bold' }}>
                        Ingresar a Power Service →
                    </Link>
                </div>

                {/* 2. MÓDULO AUDITORÍAS 5S */}
                <div className="card" style={{ 
                    borderTop: '6px solid var(--success-color)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    padding: '2rem',
                    boxShadow: 'var(--box-shadow)'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '2.5rem' }}>🏆</div>
                            <span className="status-badge" style={{ backgroundColor: 'var(--success-color)', fontSize: '0.85rem' }}>
                                Metodología 5S
                            </span>
                        </div>
                        
                        <h2 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>Auditorías 5S</h2>
                        <p style={{ color: 'var(--text-secondary-color)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                            Inspección y orden según metodología 5S, dividido en <strong>Servicio Técnico</strong> y el nuevo sector de <strong>Repuestos</strong>.
                        </p>

                        {/* SELECCIÓN DIRECTA DE SECTOR 5S: SERVICIO O REPUESTOS */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            {/* Tarjeta 5S Servicio */}
                            <div 
                                className="card card-link" 
                                onClick={() => navigate('/auditorias-5s?tipo=servicio')}
                                style={{ padding: '1rem', borderLeft: '4px solid var(--primary-color)' }}
                            >
                                <div style={{ fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '0.25rem', color: 'var(--text-color)' }}>
                                    🔧 Servicio
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary-color)', marginBottom: '0.5rem' }}>
                                    Taller, Lavado y General
                                </div>
                                <div style={{ fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{counts.servProgreso}</span> en prog. | <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>{counts.servFinalizadas}</span> fin.
                                </div>
                            </div>

                            {/* Tarjeta 5S Repuestos */}
                            <div 
                                className="card card-link" 
                                onClick={() => navigate('/auditorias-5s?tipo=repuestos')}
                                style={{ padding: '1rem', borderLeft: '4px solid #e67e22', position: 'relative' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-color)' }}>
                                        📦 Repuestos
                                    </div>
                                    <span style={{ fontSize: '0.65rem', background: '#e67e22', color: 'white', padding: '1px 5px', borderRadius: '8px', fontWeight: 'bold' }}>
                                        NUEVO
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary-color)', margin: '0.25rem 0 0.5rem 0' }}>
                                    Depósito, Lubricantes, Patio
                                </div>
                                <div style={{ fontSize: '0.85rem' }}>
                                    <span style={{ color: '#e67e22', fontWeight: 'bold' }}>{counts.repProgreso}</span> en prog. | <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>{counts.repFinalizadas}</span> fin.
                                </div>
                            </div>
                        </div>

                        {/* Accesos directos rápidos de 5S */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                            <Link to="/auditorias-5s?tipo=repuestos" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: '#e67e22', fontWeight: '500' }}>
                                <span>📦</span> Nueva Auditoría 5S Repuestos
                            </Link>
                            <Link to="/auditorias-5s?tipo=servicio" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--primary-color)', fontWeight: '500' }}>
                                <span>🔧</span> Nueva Auditoría 5S Servicio
                            </Link>
                            <Link to="/auditorias-5s" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--text-color)' }}>
                                <span>📊</span> Resultados, Gráficos y Reportes 5S
                            </Link>
                            <Link to="/planes-de-accion" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: 'var(--text-color)' }}>
                                <span>🛠️</span> Planes de Acción 5S ({counts.planes5S} pendientes)
                            </Link>
                        </div>
                    </div>

                    <Link to="/auditorias-5s" className="btn btn-primary" style={{ textAlign: 'center', fontSize: '1.1rem', padding: '0.8rem', fontWeight: 'bold', backgroundColor: 'var(--success-color)' }}>
                        Ingresar a Auditorías 5S →
                    </Link>
                </div>
            </div>

            {userRole === 'administrador' && (
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <SeedDatabaseButton />
                </div>
            )}
        </div>
    );
};

export default HomePage;
