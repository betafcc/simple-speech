export type {
  Observer,
  Recognition,
  RecognitionEvent,
  RecognitionLang,
  RecognitionOptions,
  Unsubscribable,
} from './recognition'
export { recognition } from './recognition'

export type { BrowserVoice, Synthesis, SynthesisOptions, SynthesisVoice } from './synthesis'
export { getVoicesTypeString, speak, synthesis } from './synthesis'
