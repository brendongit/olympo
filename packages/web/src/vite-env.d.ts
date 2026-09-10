/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL do @olympos/servidor no Render, ex.: https://olympos-servidor.onrender.com (Seção 17.7). */
  readonly VITE_SERVIDOR_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
