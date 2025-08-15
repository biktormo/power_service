// src/contexts/DataContext.jsx
import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { firebaseServices } from '../firebase/services';
import { useAuth } from './AuthContext.jsx';
import { toast } from 'react-hot-toast';

const DataContext = createContext();

export const useData = () => {
    return useContext(DataContext);
};

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [audits, setAudits] = useState([]);
    const [actionPlans, setActionPlans] = useState([]);
    const [fullChecklist, setFullChecklist] = useState({});
    const [totalRequisitos, setTotalRequisitos] = useState(0);

    const fetchData = useCallback(async () => {
        if (!user) {
            // Si no hay usuario, no hay nada que cargar
            setLoading(false);
            return;
        }
        console.log("DataProvider: Iniciando carga de datos...");
        setLoading(true);
        try {
            const [auditsData, plansData, checklistData] = await Promise.all([
                firebaseServices.getAllAuditsWithResults(),
                firebaseServices.getAllActionPlans(),
                firebaseServices.getFullChecklist()
            ]);
            
            setAudits(auditsData);
            setActionPlans(plansData);
            setFullChecklist(checklistData);

            let count = 0;
            Object.values(checklistData).forEach(pilar => {
                Object.values(pilar.estandares).forEach(estandar => { count += estandar.requisitos.length; });
            });
            setTotalRequisitos(count);
            console.log("DataProvider: Carga de datos completada con éxito.");

        } catch (error) {
            toast.error("Error crítico al cargar los datos de la aplicación.");
            console.error("Error en DataProvider:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const value = {
        loading, audits, actionPlans, fullChecklist, totalRequisitos,
        refreshData: fetchData // Exponemos la función para recargar
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};