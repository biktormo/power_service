// src/components/Modal.jsx
import React from 'react';

const Modal = ({ children, onClose }) => {
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
};

export default Modal;