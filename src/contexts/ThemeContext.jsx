// src/contexts/ThemeContext.jsx

import React, { useState, useEffect, useContext, createContext } from 'react';

// 1. Crear el Contexto
const ThemeContext = createContext();

// 2. Crear el hook personalizado (LA PARTE QUE FALTABA)
export const useTheme = () => {
    return useContext(ThemeContext);
};

// 3. Crear el Provider
export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};