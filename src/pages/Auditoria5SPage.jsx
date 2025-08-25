// src/pages/Auditoria5SPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { firebaseServices } from '../firebase/services';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { serverTimestamp } from 'firebase/firestore';

// Componente interno para cada ítem de la checklist (actualizado)
const ChecklistItem = ({ item, seccion, auditoriaId, onResultChange }) => {
    const [resultado, setResultado] = useState('');
    const [comentarios, setComentarios] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [file, setFile] = useState(null);

    const handleSave = async () => {
        if (!resultado) {
            toast.error("Por favor, selecciona un resultado.");
            return;
        }
        setIsSaving(true);
        let fileUrl = null;

        try {
            if (file) {
                toast.loading("Subiendo archivo...");
                const path = `audits5S/${auditoriaId}/${item.id}/${Date.now()}_${file.name}`;
                fileUrl = await firebaseServices.uploadFile(file, path);
                toast.dismiss();
            }

            const dataToSave = {
                auditoria5SId: auditoriaId,
                itemId: item.id,
                itemTexto: item.text,
                seccion: seccion,
                resultado: resultado,
                comentarios: comentarios,
                adjuntos: fileUrl ? [fileUrl] : [], // Guardamos como un array
            };

            await firebaseServices.saveResultado5S(dataToSave);
            onResultChange(item.id, dataToSave);
            toast.success(`Ítem ${item.id} guardado.`);
        } catch (error) {
            toast.error("Error al guardar el ítem.");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="card" style={{ marginBottom: '1rem' }}>
            <p><strong>{item.id}.</strong> {item.text}</p>
            
            <div className="radial-selector-group">
                <label className={resultado === 'Conforme' ? 'selected' : ''}>
                    <input type="radio" name={`resultado-${item.id}`} value="Conforme" checked={resultado === 'Conforme'} onChange={(e) => setResultado(e.target.value)} />
                    Conforme
                </label>
                <label className={resultado === 'No Conforme' ? 'selected' : ''}>
                    <input type="radio" name={`resultado-${item.id}`} value="No Conforme" checked={resultado === 'No Conforme'} onChange={(e) => setResultado(e.target.value)} />
                    No Conforme
                </label>
                <label className={resultado === 'No Observado' ? 'selected' : ''}>
                    <input type="radio" name={`resultado-${item.id}`} value="No Observado" checked={resultado === 'No Observado'} onChange={(e) => setResultado(e.target.value)} />
                    No Observado
                </label>
            </div>

            <div className="form-group" style={{ margin: '1rem 0' }}>
                <textarea placeholder="Comentarios (opcional)..." value={comentarios} onChange={e => setComentarios(e.target.value)} rows="2" />
            </div>

            <div className="form-group" style={{ margin: '1rem 0' }}>
                <label>Adjuntar Archivo / Fotografía</label>
                <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            </div>

            <div style={{ textAlign: 'right' }}>
                <button onClick={handleSave} className="btn btn-secondary" disabled={isSaving || !resultado}>
                    {isSaving ? "Guardando..." : "Guardar Ítem"}
                </button>
            </div>
        </div>
    );
};


const Auditoria5SPage = () => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [auditores, setAuditores] = useState([]);
    const [formData, setFormData] = useState({ 
        fecha: new Date().toISOString().split('T')[0],
        lugar: '', 
        auditor: '' 
    });
    const [currentAuditoriaId, setCurrentAuditoriaId] = useState(null);
    const [results, setResults] = useState({});
    const checklist = firebaseServices.get5SChecklist();
    const totalItems = Object.values(checklist).reduce((sum, items) => sum + items.length, 0);
    const [activeTab, setActiveTab] = useState('TALLER');

    useEffect(() => {
        firebaseServices.getAuditores()
            .then(auditoresList => setAuditores(auditoresList || []))
            .catch(() => toast.error("No se pudo cargar la lista de auditores."));
    }, []);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStartAudit = async (e) => {
        e.preventDefault();
        const { fecha, lugar, auditor } = formData;
        if (!fecha || !lugar || !auditor) {
            toast.error("Por favor, completa todos los campos.");
            return;
        }
        try {
            const auditId = await firebaseServices.createAuditoria5S({
                fecha: new Date(fecha),
                lugar,
                auditor
            }, user.uid);
            setCurrentAuditoriaId(auditId);
            setStep(2);
        } catch (error) {
            toast.error("No se pudo crear la auditoría.");
            console.error(error);
        }
    };

    const handleResultChange = (itemId, data) => {
        setResults(prev => ({ ...prev, [itemId]: data }));
    };
    
    const finalResult = () => {
        const auditados = Object.values(results).filter(r => r.resultado === 'Conforme' || r.resultado === 'No Conforme');
        if (auditados.length === 0) return { total: 0, conformes: 0, noConformes: 0, porcentaje: 0 };
        
        const conformes = auditados.filter(r => r.resultado === 'Conforme').length;
        const porcentaje = (conformes / auditados.length) * 100;
        
        return {
            total: auditados.length,
            conformes: conformes,
            noConformes: auditados.length - conformes,
            porcentaje: isNaN(porcentaje) ? 0 : porcentaje.toFixed(1)
        };
    };

    const resultadoFinal = finalResult();

    if (step === 1) {
        return (
            <ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}>
                <div className="new-audit-container">
                    <h1>Nueva Auditoría 5S</h1>
                    <form onSubmit={handleStartAudit} className="card">
                        <div className="form-group">
                            <label htmlFor="fecha">Fecha de Auditoría</label>
                            <input type="date" id="fecha" name="fecha" value={formData.fecha} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lugar">Lugar / Sucursal</label>
                            <select id="lugar" name="lugar" value={formData.lugar} onChange={handleChange} required>
                                <option value="" disabled>Selecciona una sucursal...</option>
                                <option value="Charata">Charata</option>
                                <option value="Bandera">Bandera</option>
                                <option value="Quimili">Quimili</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="auditor">Auditor 5S</label>
                            <select id="auditor" name="auditor" value={formData.auditor} onChange={handleChange} required>
                                <option value="" disabled>Selecciona un auditor...</option>
                                {auditores.map(auditorName => (
                                    <option key={auditorName} value={auditorName}>{auditorName}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Comenzar Auditoría 5S</button>
                    </form>
                </div>
            </ProtectedRoute>
        );
    }
    
    return (
        <ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}>
            <div className="audit-page-container">
                <div className="audit-page-header">
                    <h1>Auditoría 5S en Curso</h1>
                    <p>{formData.lugar} - {new Date(formData.fecha).toLocaleDateString()}</p>
                </div>
                
                <div className="tabs">
                    {Object.keys(checklist).map(seccion => (
                        <button 
                            key={seccion}
                            className={`tab-button ${activeTab === seccion ? 'active' : ''}`}
                            onClick={() => setActiveTab(seccion)}
                        >
                            {seccion}
                        </button>
                    ))}
                </div>
                
                <div className="tab-content">
                    {checklist[activeTab].map(item => (
                        <ChecklistItem 
                            key={item.id} 
                            item={item} 
                            seccion={activeTab} 
                            auditoriaId={currentAuditoriaId} 
                            onResultChange={handleResultChange}
                        />
                    ))}
                </div>
                
                <div className="dashboard-section" style={{ marginTop: '2rem', borderColor: 'var(--primary-color)' }}>
                    <h3>Resultado Final</h3>
                    <p>Porcentaje de Conformidad: <strong>{resultadoFinal.porcentaje}%</strong></p>
                    <p>Puntos Auditados: {resultadoFinal.total} / {totalItems}</p>
                    <p>Conformes: {resultadoFinal.conformes}</p>
                    <p>No Conformes: {resultadoFinal.noConformes}</p>
                    {/* Aquí iría un botón para "Finalizar y Guardar Resultado" */}
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default Auditoria5SPage;
