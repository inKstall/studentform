/// <reference types="vite/client" />

// SVG module declaration
declare module '*.svg' {
  const content: string;
  export default content;
}
