// src/pages/AuditPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firebaseServices } from '../firebase/services.js';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal.jsx';
import RequirementModalContent from './RequirementModalContent.jsx';
import { useData } from '../contexts/DataContext.jsx'; // Importamos el hook de datos

const AuditPage = () => {
    const { auditId } = useParams();
    const navigate = useNavigate();
    const { refreshData, fullChecklist, loading: dataContextLoading } = useData();
    
    // Estados locales específicos de esta página
    const [auditDetails, setAuditDetails] = useState(null);
    const [pilares, setPilares] = useState([]);
    const [estandares, setEstandares] = useState([]);
    const [requisitos, setRequisitos] = useState([]);
    const [results, setResults] = useState({});
    const [loadingPage, setLoadingPage] = useState(true);
    
    const [selectedPilar, setSelectedPilar] = useState('');
    const [selectedEstandar, setSelectedEstandar] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRequisito, setCurrentRequisito] = useState(null);

    // Carga los datos que son solo para esta página
    useEffect(() => {
        const loadPageData = async () => {
            setLoadingPage(true);
            try {
                const details = await firebaseServices.getAuditDetails(auditId);
                setAuditDetails(details);
                const r = await firebaseServices.getAuditResults(auditId);
                setResults(r);
                const p = await firebaseServices.getChecklistData(['checklist']);
                setPilares(p);
            } catch (error) {
                toast.error("Error cargando los detalles de la auditoría.");
                console.error(error);
            } finally {
                setLoadingPage(false);
            }
        };
        loadPageData();
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
    const auditedCounts = useMemo(() => {
        if (!fullChecklist || !results) return { pilares: new Set(), estandares: new Set() };
        const pilarResultsCount = {}, estandarResultsCount = {};
        Object.values(results).forEach(r => {
            pilarResultsCount[r.pilarId] = (pilarResultsCount[r.pilarId] || 0) + 1;
            estandarResultsCount[r.estandarId] = (estandarResultsCount[r.estandarId] || 0) + 1;
        });
        const completedPilares = new Set(), completedEstandares = new Set();
        if (Object.keys(fullChecklist).length > 0) {
            Object.values(fullChecklist).forEach(pilar => {
                let totalReqsInPilar = 0;
                Object.values(pilar.estandares).forEach(estandar => {
                    totalReqsInPilar += estandar.requisitos.length;
                    if (estandarResultsCount[estandar.id] === estandar.requisitos.length && estandar.requisitos.length > 0) completedEstandares.add(estandar.id);
                });
                if (pilarResultsCount[pilar.id] === totalReqsInPilar && totalReqsInPilar > 0) completedPilares.add(pilar.id);
            });
        }
        return { pilares: completedPilares, estandares: completedEstandares };
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

    const handleSaveResult = async (data, existingResult) => {
        await firebaseServices.saveRequirementResult(data, existingResult);
        setResults(prev => ({ ...prev, [data.requisitoId]: data }));
        await refreshData();
        toast.success("Resultado sincronizado.");
    };

    const handleFinalizeAudit = async () => {
        if (window.confirm("¿Estás seguro de que deseas cerrar esta auditoría? No podrás realizar más cambios.")) {
            try {
                await firebaseServices.closeAudit(auditId);
                await refreshData();
                toast.success("Auditoría cerrada con éxito.");
                navigate('/audits/panel');
            } catch (error) { 
                toast.error("Error al cerrar la auditoría.");
                console.error(error);
            }
        }
    };

    const handleSaveAndExit = () => {
        toast.success("Progreso guardado.");
        navigate('/audits/panel');
    };

    if (loadingPage || dataContextLoading) return <div className="loading-spinner">Cargando auditoría...</div>;

    return (
        <div className="audit-page-container">
            <div className="audit-page-header">
                <div>
                    <h1>Auditoría: {auditDetails?.numeroAuditoria}</h1>
                    <p><strong>Lugar:</strong> {auditDetails?.lugar} | <strong>Auditores:</strong> {auditDetails?.auditores?.join(', ')} | <strong>Auditados:</strong> {auditDetails?.auditados?.join(', ')}</p>
                </div>
                {auditDetails?.estado === 'abierta' && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={handleSaveAndExit} className="btn btn-secondary">Guardar y Salir</button>
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
                            <option key={p.id} value={p.docId} className={auditedCounts.pilares.has(p.id) ? 'option-audited' : ''}>
                                {p.nombre} ({p.id})
                            </option>
                        ))}
                    </select>
                </div>
                {selectedPilar && (
                    <div className="form-group">
                        <label>2. Seleccionar Estándar</label>
                        <select value={selectedEstandar} onChange={e => setSelectedEstandar(e.target.value)}>
                            <option value="">-- Elige un estándar --</option>
                            {estandares.map(e => (
                                <option key={e.id} value={e.docId} className={auditedCounts.estandares.has(e.id) ? 'option-audited' : ''}>
                                    {e.id} - {e.descripcion}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

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
    );
};

export default AuditPage;