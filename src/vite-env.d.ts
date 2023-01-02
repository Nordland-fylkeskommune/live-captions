/// <reference types="vite/client" />
import { Languages } from './lib/types/sonix';

interface ImportMetaEnv {
  VITE_SONIX_API_KEY: string;
  VITE_SONIX_WS_URI: string;
  VITE_SONIX_API_LANGUAGE: Languages;
}

interface ImportMeta {
  env: ImportMetaEnv;
}
