// src/pages/NewAuditPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { firebaseServices } from '../firebase/services';
import { toast } from 'react-hot-toast';

const NewAuditPage = () => {
    const [lugar, setLugar] = useState('');
    const [auditores, setAuditores] = useState('');
    const [auditados, setAuditados] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!lugar || !auditores || !auditados) {
            toast.error("Por favor, completa todos los campos.");
            return;
        }
        const auditoresArray = auditores.split(',').map(name => name.trim());
        const auditadosArray = auditados.split(',').map(name => name.trim());
        try {
            const auditId = await firebaseServices.createAudit({ lugar, auditores: auditoresArray, auditados: auditadosArray }, user.uid);
            toast.success("Auditoría creada. Ahora puedes empezar a auditar.");
            navigate(`/audit/${auditId}`);
        } catch (error) {
            toast.error("Error al crear la auditoría.");
            console.error("Error creating audit:", error);
        }
    };

    return (
        <div className="new-audit-container">
            <h1>Nueva Auditoría</h1>
            <form onSubmit={handleSubmit} className="card">
                <div className="form-group">
                    <label htmlFor="lugar">Lugar / Sucursal</label>
                    <select id="lugar" value={lugar} onChange={e => setLugar(e.target.value)} required>
                        <option value="" disabled>Selecciona una sucursal...</option>
                        <option value="Charata">Charata</option>
                        <option value="Bandera">Bandera</option>
                        <option value="Quimili">Quimili</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="auditores">Auditores (separados por coma)</label>
                    <input type="text" id="auditores" value={auditores} onChange={(e) => setAuditores(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="auditados">Auditados (separados por coma)</label>
                    <input type="text" id="auditados" value={auditados} onChange={(e) => setAuditados(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Comenzar Auditoría</button>
            </form>
        </div>
    );
};

export default NewAuditPage;