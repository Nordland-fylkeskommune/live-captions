import { useState } from 'react';
import reactLogo from './assets/react.svg';
import './App.css';
import { Sonix, TranscriptComponent } from './lib/sonix';

if (!import.meta.env.VITE_SONIX_WS_URI) throw new Error('VITE_SONIX_WS_URI not set');
if (!import.meta.env.VITE_SONIX_API_KEY)
  throw new Error('VITE_SONIX_API_KEY not set');
const sonix = new Sonix(
  {
    message: 'Authorization',
    api_key: import.meta.env.VITE_SONIX_API_KEY,
    language: 'en',
    name: 'API Conference',
    partials: true,
    sample_rate: 16000,
  },
  import.meta.env.VITE_SONIX_WS_URI,
);

const App = () => {
  return (
    <div className="App">
      <TranscriptComponent sonix={sonix} />
    </div>
  );
};

export default App;
