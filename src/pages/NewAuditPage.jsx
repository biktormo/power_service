// src/pages/NewAuditPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { firebaseServices } from '../firebase/services';
import { toast } from 'react-hot-toast';

const NewAuditPage = () => {
    const [lugar, setLugar] = useState('Charata');
    const [auditores, setAuditores] = useState('');
    const [auditados, setAuditados] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!lugar || !auditores || !auditados) {
            toast.error("Por favor, completa todos los campos.");
            return;
        }
        setIsSubmitting(true);
        const auditoresArray = auditores.split(',').map(name => name.trim());
        const auditadosArray = auditados.split(',').map(name => name.trim());
        try {
            const auditId = await firebaseServices.createAudit({ lugar, auditores: auditoresArray, auditados: auditadosArray }, user.uid);
            toast.success("Auditoría Power Service creada exitosamente.");
            navigate(`/audit/${auditId}`);
        } catch (error) {
            toast.error("Error al crear la auditoría.");
            console.error("Error creating audit:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="new-audit-container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <span className="status-badge" style={{ backgroundColor: 'var(--primary-color)' }}>Power Service</span>
                    <h1 style={{ margin: '0.25rem 0 0 0' }}>Nueva Auditoría Power Service</h1>
                </div>
                <Link to="/power-service" className="btn btn-secondary">
                    ← Volver a Power Service
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="card">
                <div className="form-group">
                    <label htmlFor="lugar">Lugar / Sucursal</label>
                    <select id="lugar" value={lugar} onChange={e => setLugar(e.target.value)} required>
                        <option value="Charata">Charata</option>
                        <option value="Bandera">Bandera</option>
                        <option value="Quimili">Quimili</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="auditores">Auditores (separados por coma)</label>
                    <input 
                        type="text" 
                        id="auditores" 
                        placeholder="Ej: Victor Ojeda, Mauro Cabus"
                        value={auditores} 
                        onChange={(e) => setAuditores(e.target.value)} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="auditados">Auditados / Responsables de Área (separados por coma)</label>
                    <input 
                        type="text" 
                        id="auditados" 
                        placeholder="Ej: Juan Perez, Carlos Gómez"
                        value={auditados} 
                        onChange={(e) => setAuditados(e.target.value)} 
                        required 
                    />
                </div>
                <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ marginTop: '1.5rem', width: '100%', fontSize: '1.05rem', padding: '0.8rem' }}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Iniciando...' : 'Comenzar Auditoría Power Service'}
                </button>
            </form>
        </div>
    );
};

export default NewAuditPage;
