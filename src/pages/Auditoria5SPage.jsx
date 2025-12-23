// src/pages/Auditoria5SPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { firebaseServices } from '../firebase/services';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { useParams, useNavigate } from 'react-router-dom'; // Importamos useParams y useNavigate

// Componente interno (sin cambios)
const ChecklistItem = ({ item, seccion, data, onChange, onFileChange }) => {
    return (
        <div className="card" style={{ marginBottom: '1rem' }}>
            <p><strong>{item.id}.</strong> {item.text}</p>
            <div className="radial-selector-group">
                {['Conforme', 'No Conforme', 'No Observado'].map(option => (
                    <label key={option} className={data?.resultado === option ? 'selected' : ''}>
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
            <div className="form-group" style={{ margin: '1rem 0' }}>
                <textarea 
                    placeholder="Comentarios (opcional)..." 
                    value={data?.comentarios || ''} 
                    onChange={(e) => onChange(item.id, 'comentarios', e.target.value)} 
                    rows="2" 
                />
            </div>
            <div className="form-group" style={{ margin: '1rem 0' }}>
                <label>Adjuntar Archivo / Fotografía</label>
                <input type="file" onChange={(e) => onFileChange(item.id, e.target.files[0])} />
                {data?.tempFile && <span style={{fontSize: '0.8em', color: 'green'}}> (Archivo seleccionado)</span>}
                {data?.adjuntos && data.adjuntos.length > 0 && <span style={{fontSize: '0.8em', color: 'blue'}}> ({data.adjuntos.length} archivos)</span>}
            </div>
        </div>
    );
};

const Auditoria5SPage = () => {
    const { user } = useAuth();
    const { auditId } = useParams(); // Obtenemos el ID de la URL si existe
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [auditores, setAuditores] = useState([]);
    const [formData, setFormData] = useState({ 
        fecha: new Date().toISOString().split('T')[0],
        lugar: '', 
        auditor: '' 
    });
    const [currentAuditoriaId, setCurrentAuditoriaId] = useState(null);
    const [auditData, setAuditData] = useState({}); // Estado de los resultados
    const [loading, setLoading] = useState(false); // Nuevo estado de carga

    const checklist = firebaseServices.get5SChecklist();
    const totalItems = Object.values(checklist).reduce((sum, items) => sum + items.length, 0);
    const [activeTab, setActiveTab] = useState('TALLER');
    const [isSaving, setIsSaving] = useState(false);

    // Cargar lista de auditores (siempre)
    useEffect(() => {
        firebaseServices.getAuditores()
            .then(auditoresList => setAuditores(auditoresList || []))
            .catch(() => toast.error("No se pudo cargar la lista de auditores."));
    }, []);

    // --- LÓGICA DE CARGA DE AUDITORÍA EXISTENTE ---
    useEffect(() => {
        if (auditId) {
            setLoading(true);
            // Si hay ID en la URL, cargamos la auditoría
            const loadAudit = async () => {
                try {
                    const auditFullData = await firebaseServices.getAuditoria5SWithResults(auditId);
                    if (auditFullData) {
                        // Rellenamos el formulario con los datos cargados
                        setFormData({
                            fecha: auditFullData.fecha.toDate().toISOString().split('T')[0],
                            lugar: auditFullData.lugar,
                            auditor: auditFullData.auditor
                        });
                        setCurrentAuditoriaId(auditId);
                        
                        // Transformamos los resultados al formato del estado auditData
                        const loadedResults = {};
                        auditFullData.resultados.forEach(res => {
                            loadedResults[res.itemId] = res;
                        });
                        setAuditData(loadedResults);
                        
                        setStep(2); // Saltamos directamente al paso 2 (checklist)
                    } else {
                        toast.error("Auditoría no encontrada.");
                        navigate('/audits/panel');
                    }
                } catch (error) {
                    console.error(error);
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
            toast.error("Por favor, completa todos los campos.");
            return;
        }
        setIsSaving(true);
        try {
            const newAuditId = await firebaseServices.createAuditoria5S({
                fecha: new Date(fecha),
                lugar,
                auditor
            }, user.uid);
            setCurrentAuditoriaId(newAuditId);
            setStep(2);
        } catch (error) {
            toast.error("No se pudo crear la auditoría.");
        } finally { setIsSaving(false); }
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
    
    const saveAllProgress = async (finish = false) => {
        setIsSaving(true);
        const toastId = toast.loading(finish ? "Finalizando auditoría..." : "Guardando progreso...");
        try {
            const promises = [];
            for (const [itemId, data] of Object.entries(auditData)) {
                if (data.resultado) { // Solo guardamos si hay resultado (o si ha cambiado)
                    let fileUrl = null;
                    if (data.tempFile) {
                        const path = `audits5S/${currentAuditoriaId}/${itemId}/${Date.now()}_${data.tempFile.name}`;
                        fileUrl = await firebaseServices.uploadFile(data.tempFile, path);
                    }
                    const currentAdjuntos = data.adjuntos || [];
                    if (fileUrl) currentAdjuntos.push(fileUrl); // Añadimos la nueva URL si existe

                    // Si estamos cargando datos existentes, data.url ya es un objeto, cuidado con duplicar
                    // Aquí simplificamos: solo subimos si hay tempFile.

                    const itemDef = Object.values(checklist).flat().find(i => i.id === itemId);
                    const seccion = Object.keys(checklist).find(key => checklist[key].some(i => i.id === itemId));

                    const dataToSave = {
                        auditoria5SId: currentAuditoriaId,
                        itemId: itemId,
                        itemTexto: itemDef ? itemDef.text : '',
                        seccion: seccion,
                        resultado: data.resultado,
                        comentarios: data.comentarios || '',
                        adjuntos: currentAdjuntos // Usamos el array actualizado
                    };
                    promises.push(firebaseServices.saveResultado5S(dataToSave));
                }
            }
            await Promise.all(promises);
            
            // Limpiamos tempFiles
            setAuditData(prev => {
                const newData = { ...prev };
                Object.keys(newData).forEach(key => { delete newData[key].tempFile; });
                return newData;
            });

            toast.success(finish ? "Auditoría finalizada." : "Progreso guardado.", { id: toastId });
            if (finish) navigate('/dashboard');
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar.", { id: toastId });
        } finally { setIsSaving(false); }
    };

    const finalResult = () => {
        const auditados = Object.values(auditData).filter(r => r.resultado === 'Conforme' || r.resultado === 'No Conforme' || r.resultado === 'No Observado');
        const totalAuditados = auditados.length;
        const conformes = auditados.filter(r => r.resultado === 'Conforme').length;
        // Calculamos porcentaje sobre auditados
        const porcentaje = totalAuditados > 0 ? (conformes / totalAuditados) * 100 : 0;
        return {
            total: totalAuditados,
            porcentaje: porcentaje.toFixed(1)
        };
    };
    const resultadoFinal = finalResult();

    if (loading) return <div className="loading-spinner">Cargando auditoría...</div>;

    if (step === 1) {
        return (
            <ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}>
                <div className="new-audit-container">
                    <h1>Nueva Auditoría 5S</h1>
                    <form onSubmit={handleStartAudit} className="card">
                        <div className="form-group"><label htmlFor="fecha">Fecha de Auditoría</label><input type="date" id="fecha" name="fecha" value={formData.fecha} onChange={handleChange} required /></div>
                        <div className="form-group"><label htmlFor="lugar">Lugar / Sucursal</label><select id="lugar" name="lugar" value={formData.lugar} onChange={handleChange} required><option value="" disabled>Selecciona una sucursal...</option><option value="Charata">Charata</option><option value="Bandera">Bandera</option><option value="Quimili">Quimili</option></select></div>
                        <div className="form-group"><label htmlFor="auditor">Auditor 5S</label><select id="auditor" name="auditor" value={formData.auditor} onChange={handleChange} required><option value="" disabled>Selecciona un auditor...</option>{auditores.map(auditorName => (<option key={auditorName} value={auditorName}>{auditorName}</option>))}</select></div>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={isSaving}>{isSaving ? 'Creando...' : 'Comenzar Auditoría 5S'}</button>
                    </form>
                </div>
            </ProtectedRoute>
        );
    }
    
    return (
        <ProtectedRoute allowedRoles={['administrador', 'auditor', 'colaborador']}>
            <div className="audit-page-container">
                <div className="audit-page-header">
                    <h1>Auditoría 5S: {formData.lugar}</h1>
                    <div style={{display: 'flex', gap: '10px'}}>
                         <button onClick={() => saveAllProgress(false)} className="btn btn-secondary" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar Progreso'}</button>
                         <button onClick={() => navigate('/audits/panel')} className="btn btn-danger">Salir</button>
                    </div>
                </div>
                <p><strong>Fecha:</strong> {new Date(formData.fecha).toLocaleDateString()} | <strong>Auditor:</strong> {formData.auditor}</p>
                
                <div className="tabs">
                    {Object.keys(checklist).map(seccion => (
                        <button key={seccion} className={`tab-button ${activeTab === seccion ? 'active' : ''}`} onClick={() => setActiveTab(seccion)}>{seccion}</button>
                    ))}
                </div>
                
                <div className="tab-content">
                    {checklist[activeTab].map(item => (
                        <ChecklistItem 
                            key={item.id} 
                            item={item} 
                            seccion={activeTab} 
                            auditoriaId={currentAuditoriaId} 
                            data={auditData[item.id] || {}} 
                            onChange={handleItemChange}
                            onFileChange={handleFileChange}
                        />
                    ))}
                </div>
                
                <div className="dashboard-section" style={{ marginTop: '2rem', borderColor: 'var(--primary-color)' }}>
                    <h3>Resumen Parcial</h3>
                    <p>Porcentaje de Conformidad: <strong>{resultadoFinal.porcentaje}%</strong></p>
                    <p>Puntos Auditados: {resultadoFinal.total} / {totalItems}</p>
                    <button onClick={() => saveAllProgress(true)} className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}} disabled={isSaving}>Finalizar y Guardar</button>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default Auditoria5SPage;
