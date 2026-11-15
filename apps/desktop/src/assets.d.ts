// the page-turn sounds (assets/sounds/*.wav) are imported as URLs; Vite emits them with the bundle
declare module '*.wav' {
  const src: string;
  export default src;
}
