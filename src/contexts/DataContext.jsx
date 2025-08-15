// src/contexts/DataContext.jsx
import React, { useState, useEffect, useContext, createContext } from 'react';
import { firebaseServices } from '../firebase/services';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => {
    return useContext(DataContext);
};

export const DataProvider = ({ children }) => {
    const { user } = useAuth(); // Dependemos del usuario para saber cuándo cargar datos
    const [loading, setLoading] = useState(true);
    const [audits, setAudits] = useState([]);
    const [actionPlans, setActionPlans] = useState([]);
    const [fullChecklist, setFullChecklist] = useState({});
    const [totalRequisitos, setTotalRequisitos] = useState(0);

    useEffect(() => {
        // Solo cargamos los datos si hay un usuario logueado
        if (user) {
            setLoading(true);
            // Usamos Promise.all para hacer todas las peticiones a la vez
            Promise.all([
                firebaseServices.getAllAuditsWithResults(),
                firebaseServices.getAllActionPlans(),
                firebaseServices.getFullChecklist()
            ]).then(([auditsData, plansData, checklistData]) => {
                setAudits(auditsData);
                setActionPlans(plansData);
                setFullChecklist(checklistData);

                // Calculamos el total de requisitos una sola vez
                let count = 0;
                Object.values(checklistData).forEach(pilar => {
                    Object.values(pilar.estandares).forEach(estandar => {
                        count += estandar.requisitos.length;
                    });
                });
                setTotalRequisitos(count);

                setLoading(false);
            }).catch(error => {
                console.error("Error fatal al cargar los datos iniciales:", error);
                setLoading(false);
            });
        } else {
            // Si no hay usuario, reseteamos los datos
            setAudits([]);
            setActionPlans([]);
            setFullChecklist({});
            setTotalRequisitos(0);
            setLoading(false);
        }
    }, [user]); // Este efecto se ejecuta de nuevo si el usuario cambia (login/logout)

    const value = {
        loading,
        audits,
        actionPlans,
        fullChecklist,
        totalRequisitos
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};