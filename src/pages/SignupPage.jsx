// src/pages/SignupPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { firebaseServices } from '../firebase/services';
import { toast } from 'react-hot-toast';
import ProtectedRoute from '../components/ProtectedRoute';

const SignupPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Las contraseñas no coinciden.");
            return;
        }
        try {
            // Aquí podrías añadir lógica para asignar roles si quisieras
            // Por ahora, todos se crean como 'colaborador' por defecto
            await firebaseServices.createUser(email, password);
            navigate('/'); // Redirige al inicio después del registro exitoso
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                toast.error("Este correo electrónico ya está en uso.");
            } else {
                toast.error("Error al registrar el usuario.");
            }
            console.error("Signup error:", error);
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSignup} className="login-form">
                <h2>Registrar Nuevo Usuario</h2>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Contraseña (mínimo 6 caracteres)</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                    <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary">Registrar</button>
                <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                    ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
                </p>
            </form>
        </div>
    );
};

export default SignupPage;