// src/contexts/AuthContext.jsx

import React, { useState, useEffect, useContext, createContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { firebaseServices } from '../firebase/services';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                const role = await firebaseServices.getUserRole(firebaseUser.uid);
                setUserRole(role);
            } else {
                setUser(null);
                setUserRole(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // La corrección clave está en esta línea:
    const value = { user, userRole, loading, setUserRole };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};