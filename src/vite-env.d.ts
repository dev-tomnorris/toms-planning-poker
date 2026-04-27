/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PARTYKIT_HOST: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
