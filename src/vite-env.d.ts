/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_SONIX_API_KEY: string;
  VITE_SONIX_WS_URI: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}
