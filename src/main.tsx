import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import { PlayerProfileProvider } from './features/player-profile/context/PlayerProfileProvider';
import { AuthProvider } from './features/boostplay/auth/BoostplayAuthProvider';
import { runtimeConfig } from './config/runtimeConfig';
import { BoostplayConfigurationError } from './features/boostplay/components/BoostplayConfigurationError';

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    {runtimeConfig.configurationError
      ? <BoostplayConfigurationError message={runtimeConfig.configurationError} />
      : <BrowserRouter basename={import.meta.env.BASE_URL}>
        <PlayerProfileProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </PlayerProfileProvider>
      </BrowserRouter>}
  </StrictMode>,
);
