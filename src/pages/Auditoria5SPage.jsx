// src/pages/Auditoria5SPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { firebaseServices } from '../firebase/services';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

const ChecklistItem = ({ item, seccion, data, onChange, onFileChange }) => {
    return (
        <div className="card" style={{ marginBottom: '1.25rem', borderLeft: data?.resultado === 'Conforme' ? '4px solid var(--success-color)' : data?.resultado === 'No Conforme' ? '4px solid var(--danger-color)' : '4px solid var(--border-color)' }}>
            <p style={{ fontSize: '1.05rem', margin: '0 0 0.75rem 0' }}><strong>Ítem {item.id}.</strong> {item.text}</p>
            <div className="radial-selector-group">
                {['Conforme', 'No Conforme', 'No Observado'].map(option => (
                    <label 
                        key={option} 
                        className={data?.resultado === option ? 'selected' : ''}
                        style={{
                            backgroundColor: data?.resultado === option ? (option === 'Conforme' ? 'var(--success-color)' : option === 'No Conforme' ? 'var(--danger-color)' : '#6c757d') : undefined,
                            borderColor: data?.resultado === option ? 'transparent' : undefined
                        }}
                    >
                        <input 
                            type="radio" 
                            name={`res-${item.id}`} 
                            value={option} 
                            checked={data?.resultado === option} 
                            onChange={(e) => onChange(item.id, 'resultado', e.target.value)} 
                        />
                        {option}
                    </label>
                ))}
            </div>
            <div className="form-group" style={{ margin: '1rem 0 0.5rem 0' }}>
                <textarea 
                    placeholder="Observaciones / Comentarios (opcional)..." 
                    value={data?.comentarios || ''} 
                    onChange={(e) => onChange(item.id, 'comentarios', e.target.value)} 
                    rows="2" 
                />
            </div>
            <div className="form-group" style={{ margin: '0.5rem 0 0 0' }}>
                <label style={{ fontSize: '0.9rem' }}>Adjuntar Fotografía o Evidencia:</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => onFileChange(item.id, e.target.files[0])} />
                {data?.tempFile && <span style={{fontSize: '0.85em', color: 'green', fontWeight: 'bold'}}> ✓ Archivo seleccionado listo para subir</span>}
                {data?.adjuntos && data.adjuntos.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {data.adjuntos.map((att, idx) => (
                            <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>
                                📷 Ver evidencia {idx + 1}
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const Auditoria5SPage = () => {
    const { user } = useAuth();
    const { auditId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const paramTipo = searchParams.get('tipo');
    const [tipo5S, setTipo5S] = useState(paramTipo === 'repuestos' ? 'repuestos' : 'servicio');

    const [step, setStep] = useState(1);
    const [auditores, setAuditores] = useState([]);
    const [formData, setFormData] = useState({ 
        fecha: new Date().toISOString().split('T')[0],
        lugar: 'Charata', 
        auditor: '' 
    });
    const [currentAuditoriaId, setCurrentAuditoriaId] = useState(null);
    const [auditData, setAuditData] = useState({});
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('');

    // Actualiza lista de auditores según el tipo (Servicio vs Repuestos)
    useEffect(() => {
        if (tipo5S === 'repuestos') {
            setAuditores(firebaseServices.getAuditores5SRepuestos());
        } else {
            firebaseServices.getAuditores('servicio')
                .then(auditoresList => setAuditores(auditoresList || []))
                .catch(() => toast.error("No se pudo cargar la lista de auditores."));
        }
    }, [tipo5S]);

    // Obtener checklist dinámico según tipo5S y sucursal elegida
    const checklist = useMemo(() => {
        return firebaseServices.getChecklist5SByType(tipo5S, formData.lugar);
    }, [tipo5S, formData.lugar]);

    // Establecer la pestaña activa inicial cuando cambia el checklist
    useEffect(() => {
        const sections = Object.keys(checklist);
        if (sections.length > 0 && (!activeTab || !checklist[activeTab])) {
            setActiveTab(sections[0]);
        }
    }, [checklist, activeTab]);

    const totalItems = useMemo(() => {
        return Object.values(checklist).reduce((sum, items) => sum + items.length, 0);
    }, [checklist]);

    // Cargar auditoría existente si hay auditId en la URL
    useEffect(() => {
        if (auditId) {
            setLoading(true);
            const loadAudit = async () => {
                try {
                    const auditFullData = await firebaseServices.getAuditoria5SWithResults(auditId);
                    if (auditFullData) {
                        const rawFecha = auditFullData.fecha?.toDate ? auditFullData.fecha.toDate() : new Date(auditFullData.fecha || auditFullData.creadoEn?.toDate?.() || Date.now());
                        const detectedTipo = auditFullData.tipo5S || (auditFullData.numeroAuditoria?.startsWith('5SR') ? 'repuestos' : 'servicio');
                        setTipo5S(detectedTipo);

                        setFormData({
                            fecha: rawFecha.toISOString().split('T')[0],
                            lugar: auditFullData.lugar || 'Charata',
                            auditor: auditFullData.auditor || ''
                        });
                        setCurrentAuditoriaId(auditId);
                        
                        const loadedResults = {};
                        (auditFullData.resultados || []).forEach(res => {
                            loadedResults[res.itemId] = res;
                        });
                        setAuditData(loadedResults);
                        
                        setStep(2);
                    } else {
                        toast.error("Auditoría no encontrada.");
                        navigate('/auditorias-5s');
                    }
                } catch (error) {
                    console.error("Error al cargar la auditoría:", error);
                    toast.error("Error al cargar la auditoría.");
                } finally {
                    setLoading(false);
                }
            };
            loadAudit();
        }
    }, [auditId, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStartAudit = async (e) => {
        e.preventDefault();
        const { fecha, lugar, auditor } = formData;
        if (!fecha || !lugar || !auditor) {
            toast.error("Por favor, completa todos los campos requeridos.");
            return;
        }
        setIsSaving(true);
        try {
            const newAuditId = await firebaseServices.createAuditoria5S({
                fecha: new Date(fecha),
                lugar,
                auditor,
                tipo5S: tipo5S,
                estado: 'en_progreso'
            }, user?.uid || 'anon');
            setCurrentAuditoriaId(newAuditId);
            setStep(2);
            toast.success(`Auditoría 5S ${tipo5S === 'repuestos' ? 'Repuestos' : 'Servicio'} iniciada`);
        } catch (error) {
            console.error(error);
            toast.error("No se pudo crear la auditoría.");
        } finally { 
            setIsSaving(false); 
        }
    };

    const handleItemChange = (itemId, field, value) => {
        setAuditData(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], [field]: value }
        }));
    };

    const handleFileChange = (itemId, file) => {
        setAuditData(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], tempFile: file }
        }));
    };
    
    const finalResult = useMemo(() => {
        // Solo considerar los ítems válidos para la sucursal actual
        const validItemIds = new Set(Object.values(checklist).flat().map(i => String(i.id)));
        const auditados = Object.entries(auditData)
            .filter(([id, r]) => validItemIds.has(String(id)) && (r.resultado === 'Conforme' || r.resultado === 'No Conforme' || r.resultado === 'No Observado'));
        
        const totalAuditados = auditados.length;
        const conformes = auditados.filter(([_, r]) => r.resultado === 'Conforme').length;
        const noConformes = auditados.filter(([_, r]) => r.resultado === 'No Conforme').length;
        const porcentaje = totalAuditados > 0 ? (conformes / totalAuditados) * 100 : 0;
        
        return {
            total: totalAuditados,
            conformes,
            noConformes,
            porcentaje: Number(porcentaje.toFixed(1))
        };
    }, [checklist, auditData]);

    const saveAllProgress = async (finish = false) => {
        if (finish) {
            const confirmClose = window.confirm(
                `¿Deseas finalizar y cerrar esta auditoría 5S ${tipo5S === 'repuestos' ? 'Repuestos' : 'Servicio'}?\n` +
                `Puntos auditados: ${finalResult.total} de ${totalItems}\n` +
                `Porcentaje de conformidad: ${finalResult.porcentaje}%`
            );
            if (!confirmClose) return;
        }

        setIsSaving(true);
        const toastId = toast.loading(finish ? "Finalizando auditoría 5S..." : "Guardando progreso...");
        try {
            const promises = [];
            for (const [itemId, data] of Object.entries(auditData)) {
                if (data.resultado) {
                    let fileObj = null;
                    if (data.tempFile) {
                        const path = `audits5S/${currentAuditoriaId}/${itemId}/${Date.now()}_${data.tempFile.name}`;
                        fileObj = await firebaseServices.uploadFile(data.tempFile, path);
                    }
                    const currentAdjuntos = data.adjuntos ? [...data.adjuntos] : [];
                    if (fileObj) currentAdjuntos.push(fileObj);

                    const itemDef = Object.values(checklist).flat().find(i => String(i.id) === String(itemId));
                    const seccion = Object.keys(checklist).find(key => checklist[key].some(i => String(i.id) === String(itemId))) || 'General';

                    const dataToSave = {
                        auditoria5SId: currentAuditoriaId,
                        itemId: String(itemId),
                        itemTexto: itemDef ? itemDef.text : (data.itemTexto || ''),
                        seccion: seccion,
                        resultado: data.resultado,
                        comentarios: data.comentarios || '',
                        adjuntos: currentAdjuntos
                    };
                    promises.push(firebaseServices.saveResultado5S(dataToSave));
                }
            }
            await Promise.all(promises);
            
            // Si finaliza la auditoría, actualizar estado y porcentaje en la auditoría 5S
            if (finish) {
                await firebaseServices.closeAuditoria5S(currentAuditoriaId, finalResult.porcentaje);
            } else {
                await firebaseServices.updateAuditoria5S(currentAuditoriaId, {
                    resultadoPorcentaje: finalResult.porcentaje,
                    estado: 'en_progreso'
                });
            }

            // Limpiar tempFiles en memoria
            setAuditData(prev => {
                const newData = { ...prev };
                Object.keys(newData).forEach(key => { delete newData[key].tempFile; });
                return newData;
            });

            toast.success(finish ? "Auditoría 5S finalizada exitosamente." : "Progreso guardado correctamente.", { id: toastId });
            if (finish) {
                navigate(`/auditorias-5s?tipo=${tipo5S}`);
            }
        } catch (error) {
            console.error("Error al guardar auditoría 5S:", error);
            toast.error("Error al guardar los datos.", { id: toastId });
        } finally { 
            setIsSaving(false); 
        }
    };

    if (loading) return <div className="loading-spinner">Cargando auditoría 5S...</div>;

    if (step === 1) {
        return (
            <ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}>
                <div className="new-audit-container">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <h1>Nueva Auditoría 5S</h1>
                        <button className="btn btn-secondary" onClick={() => navigate('/auditorias-5s')}>
                            ← Volver al Panel 5S
                        </button>
                    </div>

                    {/* Selector de Tipo de Auditoría 5S */}
                    <div className="tabs" style={{ marginBottom: '1.5rem' }}>
                        <button 
                            type="button" 
                            className={`tab-button ${tipo5S === 'servicio' ? 'active' : ''}`}
                            onClick={() => { setTipo5S('servicio'); setFormData(prev => ({ ...prev, auditor: '' })); }}
                        >
                            🔧 5S Servicio
                        </button>
                        <button 
                            type="button" 
                            className={`tab-button ${tipo5S === 'repuestos' ? 'active' : ''}`}
                            onClick={() => { setTipo5S('repuestos'); setFormData(prev => ({ ...prev, auditor: '' })); }}
                        >
                            📦 5S Repuestos (Nuevo)
                        </button>
                    </div>

                    {tipo5S === 'repuestos' && (
                        <div className="card" style={{ backgroundColor: '#eef8ff', borderLeft: '5px solid #007bff', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#0056b3' }}>ℹ️ Regla de Sucursales para 5S Repuestos:</h4>
                            <p style={{ margin: 0, fontSize: '0.95rem' }}>
                                • <strong>Charata:</strong> Se auditan todos los ítems (1 al 24: Depósito Principal, Lubricantes y Patio).<br />
                                • <strong>Bandera y Quimilí:</strong> Se audita únicamente el Depósito Principal (ítems 1 al 16 inclusive).
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleStartAudit} className="card">
                        <div className="form-group">
                            <label htmlFor="fecha">Fecha de Auditoría</label>
                            <input 
                                type="date" 
                                id="fecha" 
                                name="fecha" 
                                value={formData.fecha} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lugar">Lugar / Sucursal</label>
                            <select 
                                id="lugar" 
                                name="lugar" 
                                value={formData.lugar} 
                                onChange={handleChange} 
                                required
                            >
                                <option value="Charata">Charata</option>
                                <option value="Bandera">Bandera</option>
                                <option value="Quimili">Quimili</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="auditor">
                                Auditor {tipo5S === 'repuestos' ? '5S Repuestos' : '5S Servicio'}
                            </label>
                            <select 
                                id="auditor" 
                                name="auditor" 
                                value={formData.auditor} 
                                onChange={handleChange} 
                                required
                            >
                                <option value="" disabled>Selecciona un auditor...</option>
                                {auditores.map(auditorName => (
                                    <option key={auditorName} value={auditorName}>{auditorName}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ marginTop: '1.5rem', width: '100%', fontSize: '1.1rem', padding: '0.8rem' }} 
                            disabled={isSaving}
                        >
                            {isSaving ? 'Iniciando...' : `Comenzar Auditoría 5S ${tipo5S === 'repuestos' ? 'Repuestos' : 'Servicio'}`}
                        </button>
                    </form>
                </div>
            </ProtectedRoute>
        );
    }
    
    return (
        <ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}>
            <div className="audit-page-container">
                {/* BARRA DE NAVEGACIÓN Y RETORNO */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <button 
                        onClick={() => navigate(`/auditorias-5s?tipo=${tipo5S}`)} 
                        className="btn btn-secondary" 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}
                    >
                        ← Volver a Auditorías 5S
                    </button>
                    <button 
                        onClick={() => navigate('/')} 
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.9rem' }}
                    >
                        🏠 Portal de Inicio
                    </button>
                </div>

                <div className="audit-page-header">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <span className="status-badge" style={{ backgroundColor: tipo5S === 'repuestos' ? '#e67e22' : 'var(--primary-color)' }}>
                                5S {tipo5S === 'repuestos' ? 'Repuestos' : 'Servicio'}
                            </span>
                            <h1 style={{ margin: 0 }}>Sucursal: {formData.lugar}</h1>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary-color)' }}>
                            <strong>Fecha:</strong> {new Date(formData.fecha + 'T12:00:00').toLocaleDateString()} | <strong>Auditor:</strong> {formData.auditor}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={() => saveAllProgress(false)} className="btn btn-secondary" disabled={isSaving}>
                            💾 {isSaving ? 'Guardando...' : 'Guardar Progreso'}
                        </button>
                        <button onClick={() => navigate(`/auditorias-5s?tipo=${tipo5S}`)} className="btn btn-secondary">
                            Guardar y Salir
                        </button>
                    </div>
                </div>

                {tipo5S === 'repuestos' && (formData.lugar === 'Bandera' || formData.lugar === 'Quimili') && (
                    <div style={{ padding: '0.75rem 1rem', background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '6px', color: '#856404', fontSize: '0.9rem' }}>
                        📌 Sucursal <strong>{formData.lugar}</strong>: Auditando exclusivamente <strong>Depósito Principal</strong> (ítems 1 al 16).
                    </div>
                )}
                
                {/* Pestañas de Secciones */}
                <div className="tabs">
                    {Object.keys(checklist).map(seccion => {
                        const itemsCount = checklist[seccion].length;
                        const auditedCount = checklist[seccion].filter(i => auditData[i.id]?.resultado).length;
                        return (
                            <button 
                                key={seccion} 
                                className={`tab-button ${activeTab === seccion ? 'active' : ''}`} 
                                onClick={() => setActiveTab(seccion)}
                            >
                                {seccion} ({auditedCount}/{itemsCount})
                            </button>
                        );
                    })}
                </div>
                
                <div className="tab-content">
                    {activeTab && checklist[activeTab] && checklist[activeTab].map(item => (
                        <ChecklistItem 
                            key={item.id} 
                            item={item} 
                            seccion={activeTab} 
                            data={auditData[item.id] || {}} 
                            onChange={handleItemChange}
                            onFileChange={handleFileChange}
                        />
                    ))}
                </div>
                
                {/* Resumen en tiempo real y finalización */}
                <div className="dashboard-section" style={{ marginTop: '2rem', border: '2px solid var(--primary-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.5rem 0' }}>Resumen de Auditoría</h3>
                            <p style={{ margin: '0 0 0.25rem 0' }}>Puntos Auditados: <strong>{finalResult.total} de {totalItems}</strong></p>
                            <p style={{ margin: 0 }}>Porcentaje de Conformidad: <strong style={{ color: 'var(--success-color)', fontSize: '1.2rem' }}>{finalResult.porcentaje}%</strong></p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <button 
                                onClick={() => saveAllProgress(false)} 
                                className="btn btn-secondary" 
                                disabled={isSaving}
                            >
                                Guardar Progreso
                            </button>
                            <button 
                                onClick={() => saveAllProgress(true)} 
                                className="btn btn-primary" 
                                disabled={isSaving}
                                style={{ fontWeight: 'bold' }}
                            >
                                Finalizar y Cerrar Auditoría
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default Auditoria5SPage;
