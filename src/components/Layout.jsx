// src/components/Layout.jsx
import React from 'react';
import Header from './Header.jsx';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <Header />
      {/* El 'children' ahora será el componente App con las Routes */}
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;