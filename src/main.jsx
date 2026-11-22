import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';

// Pas de <StrictMode> : le moteur WebGL ne doit être monté qu'une fois.
ReactDOM.createRoot(document.getElementById('root')).render(<App />);