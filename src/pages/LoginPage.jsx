// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { firebaseServices } from '../firebase/services';
import { toast } from 'react-hot-toast';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { setUserRole } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const role = await firebaseServices.getUserRole(userCredential.user.uid);
            setUserRole(role);
            toast.success("¡Bienvenido!");
            navigate('/');
        } catch (error) {
            toast.error("Error al iniciar sesión. Verifica tus credenciales.");
            console.error("Login error:", error);
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleLogin} className="login-form">
                <h2>Iniciar Sesión</h2>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Contraseña</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary">Entrar</button>
            </form>
        </div>
    );
};

export default LoginPage;