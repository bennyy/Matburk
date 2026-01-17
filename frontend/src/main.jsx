import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client'; // <-- VIKTIGT: /client
import App from './App.jsx';
import './index.css'; // <-- Om denna fil inte finns, ta bort raden tills vidare!

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
