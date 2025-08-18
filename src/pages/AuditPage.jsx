// src/pages/AuditPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firebaseServices } from '../firebase/services.js';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal.jsx';
import RequirementModalContent from './RequirementModalContent.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

const AuditPage = () => {
    const { auditId } = useParams();
    const navigate = useNavigate();
    
    // Estados para los datos y la UI
    const [auditDetails, setAuditDetails] = useState(null);
    const [pilares, setPilares] = useState([]);
    const [estandares, setEstandares] = useState([]);
    const [requisitos, setRequisitos] = useState([]);
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(true);
    const [fullChecklist, setFullChecklist] = useState(null);
    const [selectedPilar, setSelectedPilar] = useState('');
    const [selectedEstandar, setSelectedEstandar] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRequisito, setCurrentRequisito] = useState(null);
    const [showMosaic, setShowMosaic] = useState(true);

    // Carga inicial de datos, independiente del DataContext
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const details = await firebaseServices.getAuditDetails(auditId);
                setAuditDetails(details);
                const p = await firebaseServices.getChecklistData(['checklist']);
                setPilares(p);
                const r = await firebaseServices.getAuditResults(auditId);
                setResults(r);
                const checklistData = await firebaseServices.getFullChecklist();
                setFullChecklist(checklistData);
            } catch (error) {
                toast.error("Error cargando datos de la auditoría");
                console.error(error);
            } finally { setLoading(false); }
        };
        loadInitialData();
    }, [auditId]);

    // Carga de estándares y requisitos en cascada
    useEffect(() => {
        if (selectedPilar) {
            firebaseServices.getChecklistData(['checklist', selectedPilar, 'estandares']).then(est => {
                setEstandares(est); setRequisitos([]); setSelectedEstandar('');
            });
        }
    }, [selectedPilar]);

    useEffect(() => {
        if (selectedPilar && selectedEstandar) {
            firebaseServices.getChecklistData(['checklist', selectedPilar, 'estandares', selectedEstandar, 'requisitos']).then(req => {
                setRequisitos(req);
            });
        }
    }, [selectedEstandar]);
    
    // Memoización para calcular elementos completados
    const completionStatus = useMemo(() => {
        if (!fullChecklist || !results) return { pilares: {}, estandares: {} };
    
        const pilarStatus = {};
        const estandarStatus = {};
    
        Object.values(fullChecklist).forEach(pilar => {
            let requisitosEnPilar = 0;
            let resultadosEnPilar = 0;
    
            Object.values(pilar.estandares).forEach(estandar => {
                const totalReqs = estandar.requisitos.length;
                if (totalReqs === 0) return;
    
                const resultadosEnEstandar = estandar.requisitos.filter(req => results[req.id]).length;
                
                requisitosEnPilar += totalReqs;
                resultadosEnPilar += resultadosEnEstandar;
    
                if (resultadosEnEstandar === 0) {
                    estandarStatus[estandar.id] = 'pendiente';
                } else if (resultadosEnEstandar < totalReqs) {
                    estandarStatus[estandar.id] = 'en_proceso';
                } else {
                    estandarStatus[estandar.id] = 'completado';
                }
            });
    
            if (resultadosEnPilar === 0) {
                pilarStatus[pilar.id] = 'pendiente';
            } else if (resultadosEnPilar < requisitosEnPilar) {
                pilarStatus[pilar.id] = 'en_proceso';
            } else {
                pilarStatus[pilar.id] = 'completado';
            }
        });
        
        return { pilares: pilarStatus, estandares: estandarStatus };
    }, [fullChecklist, results]);

    // Lógica de handlers
    const handleRequisitoClick = (req) => {
        if (auditDetails?.estado === 'cerrada') {
            toast.error('Esta auditoría está cerrada y no se puede editar.');
            return;
        }
        setCurrentRequisito(req);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleSaveResult = async (dataToSave, existingResult) => {
        setIsModalOpen(false);
        const toastId = toast.loading("Guardando resultado...");
        try {
            await firebaseServices.saveRequirementResult(dataToSave, existingResult);
            toast.success("Resultado guardado con éxito. Actualizando...", { id: toastId });
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            toast.error("Error al guardar el resultado.", { id: toastId });
            console.error("Error en handleSaveResult de AuditPage:", error);
        }
    };

    const handleFinalizeAudit = async () => {
        if (window.confirm("¿Estás seguro de que deseas cerrar esta auditoría? No podrás realizar más cambios.")) {
            try {
                await firebaseServices.closeAudit(auditId);
                toast.success("Auditoría cerrada con éxito.");
                navigate('/audits/panel');
            } catch (error) { 
                toast.error("Error al cerrar la auditoría.");
                console.error(error);
            }
        }
    };

    const handleSaveAndExit = () => {
        navigate('/audits/panel');
    };

    if (loading) return <div className="loading-spinner">Cargando auditoría...</div>;

    return (
        <ProtectedRoute allowedRoles={['administrador', 'auditor']}>
            <div className="audit-page-container">
                <div className="audit-page-header">
                    <div>
                        <h1>Auditoría: {auditDetails?.numeroAuditoria}</h1>
                        <p><strong>Lugar:</strong> {auditDetails?.lugar} | <strong>Auditores:</strong> {auditDetails?.auditores?.join(', ')} | <strong>Auditados:</strong> {auditDetails?.auditados?.join(', ')}</p>
                    </div>
                    {auditDetails?.estado === 'abierta' && (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={handleSaveAndExit} className="btn btn-secondary">Panel de Auditorías</button>
                            <button onClick={handleFinalizeAudit} className="btn btn-danger">Finalizar Auditoría</button>
                        </div>
                    )}
                </div>

                <div className="filters-container card">
                    <div className="form-group">
                        <label>1. Seleccionar Pilar</label>
                        <select value={selectedPilar} onChange={e => setSelectedPilar(e.target.value)}>
                            <option value="">-- Elige un pilar --</option>
                            {pilares.map(p => (
                                <option 
                                    key={p.id} 
                                    value={p.docId} 
                                    className={`option-status-${completionStatus.pilares[p.id] || 'pendiente'}`}
                                >
                                    {p.nombre} ({p.id})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* --- ESTA ES LA PARTE CORREGIDA --- */}
                    {selectedPilar && (
                        <div className="form-group"> {/* El select ahora está dentro de su propio div */}
                            <label>2. Seleccionar Estándar</label>
                            <select value={selectedEstandar} onChange={e => setSelectedEstandar(e.target.value)}>
                                <option value="">-- Elige un estándar --</option>
                                {estandares.map(e => (
                                    <option 
                                        key={e.id} 
                                        value={e.docId} 
                                        className={`option-status-${completionStatus.estandares[e.id] || 'pendiente'}`}
                                    >
                                        {e.id} - {e.descripcion}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Botón para alternar la vista */}
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <button className="btn btn-secondary" onClick={() => setShowMosaic(!showMosaic)}>
                        {showMosaic ? 'Ocultar Mapa de Auditoría' : 'Mostrar Mapa de Auditoría'}
                    </button>
                </div>

                {/* El Panel de Mosaicos */}
                {showMosaic && fullChecklist && (
                    <div className="mosaic-panel">
                        {Object.values(fullChecklist).map(pilar => {
                            const totalReqsInPilar = Object.values(pilar.estandares).reduce((sum, est) => sum + est.requisitos.length, 0);
                            const auditedReqsInPilar = Object.values(results).filter(r => r.pilarId === pilar.id).length;
                            const progress = totalReqsInPilar > 0 ? (auditedReqsInPilar / totalReqsInPilar) * 100 : 0;

                            return (
                                <div key={pilar.id} className="mosaic-card card" onClick={() => setSelectedPilar(pilar.docId)}>
                                    <h4>{pilar.nombre} ({pilar.id})</h4>
                                    <p>{Object.keys(pilar.estandares).length} Estándares</p>
                                    <div className="progress-text">{auditedReqsInPilar} / {totalReqsInPilar} Requisitos Auditados</div>
                                    <div className="progress-bar">
                                        <div className="progress-bar-inner" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {requisitos.length > 0 && (
                    <div className="requisito-list-container">
                        <h3>Requisitos</h3>
                        <ul className="requisito-list">
                            {requisitos.map(req => (
                                <li 
                                    key={req.id} 
                                    className={`requisito-item status-${results[req.id]?.resultado || ''}`} 
                                    onClick={() => handleRequisitoClick(req)}
                                >
                                    <span><strong>{req.id}</strong> - {req.requerimientoOperacional.substring(0, 100)}...</span>
                                    <span>{results[req.id]?.resultado || 'Pendiente'}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {isModalOpen && currentRequisito && (
                    <Modal onClose={handleCloseModal}>
                        <RequirementModalContent
                            requisito={currentRequisito}
                            onSave={handleSaveResult}
                            onClose={handleCloseModal}
                            auditId={auditId}
                            existingResult={results[currentRequisito.id]}
                        />
                    </Modal>
                )}
            </div>
        </ProtectedRoute>
    );
};

export default AuditPage;