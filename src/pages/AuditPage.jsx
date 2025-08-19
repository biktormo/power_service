// src/pages/AuditPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firebaseServices } from '../firebase/services.js';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal.jsx';
import RequirementModalContent from './RequirementModalContent.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { getCachedData, clearCache, setCachedData } from '../utils/dataCache.js';
import { PILARES_ORDER } from '../utils/ordering.js';

const AuditPage = () => {
    const { auditId } = useParams();
    const navigate = useNavigate();
    
    // Estados locales
    const [auditDetails, setAuditDetails] = useState(null);
    const [pilares, setPilares] = useState([]);
    const [estandares, setEstandares] = useState([]);
    const [requisitos, setRequisitos] = useState([]);
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(true);
    
    const [fullChecklist, setFullChecklist] = useState(() => getCachedData()?.fullChecklist || null);

    const [selectedPilar, setSelectedPilar] = useState('');
    const [selectedEstandar, setSelectedEstandar] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRequisito, setCurrentRequisito] = useState(null);
    const [showMosaic, setShowMosaic] = useState(true);

    useEffect(() => {
        const loadPageData = async () => {
            setLoading(true);
            try {
                const detailsPromise = firebaseServices.getAuditDetails(auditId);
                const resultsPromise = firebaseServices.getAuditResults(auditId);
                const checklistPromise = fullChecklist ? Promise.resolve(fullChecklist) : firebaseServices.getFullChecklist();
                
                const [details, r, checklistData] = await Promise.all([detailsPromise, resultsPromise, checklistPromise]);

                setAuditDetails(details);
                setResults(r);
                
                if (!fullChecklist) {
                    setFullChecklist(checklistData);
                }

                if (checklistData && Object.keys(checklistData).length > 0) {
                    const p = Object.values(checklistData).map(pilar => ({ id: pilar.id, docId: pilar.id, nombre: pilar.nombre }));
                    p.sort((a, b) => PILARES_ORDER.indexOf(a.id) - PILARES_ORDER.indexOf(b.id));
                    setPilares(p);
                }
            } catch (error) {
                toast.error("Error cargando los datos de la auditoría.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadPageData();
    }, [auditId]);

    useEffect(() => {
        if (selectedPilar && fullChecklist) {
            const estandarData = fullChecklist[selectedPilar]?.estandares || {};
            const estandarArray = Object.values(estandarData).map(e => ({ id: e.id, docId: e.id, descripcion: e.descripcion}));
            setEstandares(estandarArray);
            setRequisitos([]);
            setSelectedEstandar('');
        }
    }, [selectedPilar, fullChecklist]);

    useEffect(() => {
        if (selectedPilar && selectedEstandar && fullChecklist) {
            const reqs = fullChecklist[selectedPilar]?.estandares[selectedEstandar]?.requisitos || [];
            setRequisitos(reqs);
        }
    }, [selectedEstandar, selectedPilar, fullChecklist]);
    
    const completionStatus = useMemo(() => {
        if (!fullChecklist || !results) return { pilares: {}, estandares: {} };
        const pilarStatus = {}, estandarStatus = {};
        Object.values(fullChecklist).forEach(pilar => {
            let requisitosEnPilar = 0, resultadosEnPilar = 0;
            Object.values(pilar.estandares).forEach(estandar => {
                const totalReqs = estandar.requisitos.length;
                if (totalReqs === 0) return;
                const resultadosEnEstandar = estandar.requisitos.filter(req => results[req.id]).length;
                requisitosEnPilar += totalReqs;
                resultadosEnPilar += resultadosEnEstandar;
                if (resultadosEnEstandar === 0) estandarStatus[estandar.id] = 'pendiente';
                else if (resultadosEnEstandar < totalReqs) estandarStatus[estandar.id] = 'en_proceso';
                else estandarStatus[estandar.id] = 'completado';
            });
            if (resultadosEnPilar === 0) pilarStatus[pilar.id] = 'pendiente';
            else if (resultadosEnPilar < requisitosEnPilar) pilarStatus[pilar.id] = 'en_proceso';
            else pilarStatus[pilar.id] = 'completado';
        });
        return { pilares: pilarStatus, estandares: estandarStatus };
    }, [fullChecklist, results]);

    const findNextRequisito = (currentReqId) => {
        if (!requisitos || requisitos.length === 0) return null;
        const currentIndex = requisitos.findIndex(req => req.id === currentReqId);
        if (currentIndex > -1 && currentIndex < requisitos.length - 1) {
            return requisitos[currentIndex + 1];
        }
        return null;
    };

    const nextRequisito = useMemo(() => {
        return currentRequisito ? findNextRequisito(currentRequisito.id) : null;
    }, [currentRequisito, requisitos]);

    const goToNextRequisito = () => {
        if (nextRequisito) {
            setCurrentRequisito(nextRequisito);
        } else {
            toast.success("¡Estándar completado!");
            handleCloseModal();
            clearCache();
        }
    };

    const handleRequisitoClick = (req) => {
        if (auditDetails?.estado === 'cerrada') return;
        setCurrentRequisito(req);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentRequisito(null);
    };

    const handleSaveResult = async (dataToSave, existingResult) => {
        await firebaseServices.saveRequirementResult(dataToSave, existingResult);
        setResults(prev => ({ ...prev, [dataToSave.requisitoId]: dataToSave }));
        clearCache();
    };

    const handleFinalizeAudit = async () => {
        if (window.confirm("¿Estás seguro de que deseas cerrar esta auditoría? No podrás realizar más cambios.")) {
            try {
                await firebaseServices.closeAudit(auditId);
                clearCache();
                toast.success("Auditoría cerrada con éxito.");
                navigate('/audits/panel');
            } catch (error) { toast.error("Error al cerrar la auditoría."); }
        }
    };

    const handleSaveAndExit = () => navigate('/audits/panel');

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
                    <div className="form-group"><label>1. Seleccionar Pilar</label><select value={selectedPilar} onChange={e => setSelectedPilar(e.target.value)}><option value="">-- Elige un pilar --</option>{pilares.map(p => (<option key={p.id} value={p.docId} className={`option-status-${completionStatus.pilares[p.id] || 'pendiente'}`}>{p.nombre} ({p.id})</option>))}</select></div>
                    {selectedPilar && (<div className="form-group"><label>2. Seleccionar Estándar</label><select value={selectedEstandar} onChange={e => setSelectedEstandar(e.target.value)}><option value="">-- Elige un estándar --</option>{estandares.map(e => (<option key={e.id} value={e.docId} className={`option-status-${completionStatus.estandares[e.id] || 'pendiente'}`}>{e.id} - {e.descripcion}</option>))}</select></div>)}
                </div>

                <div style={{ textAlign: 'center', marginBottom: '1rem' }}><button className="btn btn-secondary" onClick={() => setShowMosaic(!showMosaic)}>{showMosaic ? 'Ocultar Mapa de Auditoría' : 'Mostrar Mapa de Auditoría'}</button></div>

                {showMosaic && fullChecklist && (
                    <div className="mosaic-panel">
                        {PILARES_ORDER.map(pilarId => {
                            const pilar = fullChecklist[pilarId];
                            if (!pilar) return null;
                            const totalReqsInPilar = Object.values(pilar.estandares).reduce((sum, est) => sum + est.requisitos.length, 0);
                            const auditedReqsInPilar = Object.values(results).filter(r => r.pilarId === pilar.id).length;
                            const progress = totalReqsInPilar > 0 ? (auditedReqsInPilar / totalReqsInPilar) * 100 : 0;
                            return (
                                <div key={pilar.id} className="mosaic-card card" onClick={() => setSelectedPilar(pilar.id)}>
                                    <h4>{pilar.nombre} ({pilar.id})</h4><p>{Object.keys(pilar.estandares).length} Estándares</p>
                                    <div className="progress-text">{auditedReqsInPilar} / {totalReqsInPilar} Requisitos Auditados</div>
                                    <div className="progress-bar"><div className="progress-bar-inner" style={{ width: `${progress}%` }}></div></div>
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
                                <li key={req.id} className={`requisito-item status-${results[req.id]?.resultado || ''}`} onClick={() => handleRequisitoClick(req)}>
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
                            goToNextRequisito={goToNextRequisito}
                            hasNext={!!nextRequisito}
                        />
                    </Modal>
                )}
            </div>
        </ProtectedRoute>
    );
};

export default AuditPage;