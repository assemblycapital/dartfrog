import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App'; // Adjust the import if your App component file extension is .tsx
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <App />
);
