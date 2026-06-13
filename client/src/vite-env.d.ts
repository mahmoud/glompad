/// <reference types="svelte" />
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vanillajs" />


declare module '*.py?raw' {
  const content: string;
  export default content;
}