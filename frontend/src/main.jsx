import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client'; // <-- VIKTIGT: /client
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.jsx';
import './index.css'; // <-- Om denna fil inte finns, ta bort raden tills vidare!

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error(
    'Missing Clerk Publishable Key. Add VITE_CLERK_PUBLISHABLE_KEY to .env.local'
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPubKey} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>
);
