// src/components/Card.jsx
import React from 'react';

const Card = ({ title, description }) => {
  return (
    // La clase "card" aplica los estilos de tarjeta
    <div className="card"> 
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export default Card;