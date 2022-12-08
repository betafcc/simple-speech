export type { Recognition, SpeechEvent, Options, Lang }
export { recognition }

export interface Observer<T> {
  closed?: boolean
  next: (value: T) => void
  error: (err: any) => void
  complete: () => void
}

export interface Unsubscribable {
  unsubscribe(): void
}

// @ts-ignore
Symbol.observable = Symbol.observable || '@@observable'

type Options = {
  // grammars: SpeechGrammarList
  lang: Lang
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
}

type Lang = typeof langs[number]

class Recognition {
  constructor(readonly options: Options) {}

  use = (options: Partial<Options>) =>
    new Recognition({ ...this.options, ...options })

  listen = () =>
    new Promise<string>((resolve, reject) =>
      Object.assign(new webkitSpeechRecognition(), {
        lang: this.options.lang,
        continuous: false,
        interimResults: false,
        onerror: reject,
        onresult: (e: SpeechRecognitionEventMap['result']) =>
          resolve(e.results[e.resultIndex][0].transcript),
      }).start()
    )

  subscribe = (observer: Partial<Observer<SpeechEvent>>): Unsubscribable => {
    const subscriber = {
      next: (observer.next ?? (() => {})).bind(observer),
      error: (observer.error ?? (() => {})).bind(observer),
      complete: (observer.complete ?? (() => {})).bind(observer),
    }

    const recognition = [
      'audioend',
      'audiostart',
      'end',
      'error',
      'nomatch',
      'result',
      'soundend',
      'soundstart',
      'speechend',
      'speechstart',
      'start',
    ].reduce(
      (acc, next) => (
        acc.addEventListener(next, e =>
          subscriber.next(
            toSpeechEvent(Object.assign(e, { tag: next }) as TaggedEvent)
          )
        ),
        acc
      ),
      Object.assign(new webkitSpeechRecognition(), this.options)
    )

    recognition.addEventListener('end', () => subscriber.complete())
    recognition.start()

    return {
      unsubscribe: () => recognition.stop(),
    }
  };

  // @ts-ignore
  [Symbol.observable] = () => this
}

const recognition = new Recognition({
  lang: 'en-US',
  continuous: false,
  interimResults: false,
  maxAlternatives: 1,
})

type TaggedEvent = {
  [K in keyof SpeechRecognitionEventMap]: {
    tag: K
  } & SpeechRecognitionEventMap[K]
}[keyof SpeechRecognitionEventMap]

type SpeechEvent =
  | {
      tag: 'interim' | 'final'
      alternatives: Array<{ transcript: string; confidence: number }>
    }
  | Exclude<TaggedEvent, { tag: 'result' }>

const toSpeechEvent = (e: TaggedEvent): SpeechEvent =>
  e.tag === 'result'
    ? {
        tag: e.results[e.resultIndex].isFinal ? 'final' : 'interim',
        alternatives: Array.from(e.results[e.resultIndex]).map(a => ({
          transcript: a.transcript,
          confidence: a.confidence,
        })),
      }
    : e

/**
 * Languages listed on chrome speech api demo
 * https://www.google.com/intl/en/chrome/demos/speech.html
 */
const langs = [
  'af-ZA',
  'am-ET',
  'az-AZ',
  'bn-BD',
  'bn-IN',
  'id-ID',
  'ms-MY',
  'ca-ES',
  'cs-CZ',
  'da-DK',
  'de-DE',
  'en-AU',
  'en-CA',
  'en-IN',
  'en-KE',
  'en-TZ',
  'en-GH',
  'en-NZ',
  'en-NG',
  'en-ZA',
  'en-PH',
  'en-GB',
  'en-US',
  'es-AR',
  'es-BO',
  'es-CL',
  'es-CO',
  'es-CR',
  'es-EC',
  'es-SV',
  'es-ES',
  'es-US',
  'es-GT',
  'es-HN',
  'es-MX',
  'es-NI',
  'es-PA',
  'es-PY',
  'es-PE',
  'es-PR',
  'es-DO',
  'es-UY',
  'es-VE',
  'eu-ES',
  'fil-PH',
  'fr-FR',
  'jv-ID',
  'gl-ES',
  'gu-IN',
  'hr-HR',
  'zu-ZA',
  'is-IS',
  'it-IT',
  'it-CH',
  'kn-IN',
  'km-KH',
  'lv-LV',
  'lt-LT',
  'ml-IN',
  'mr-IN',
  'hu-HU',
  'lo-LA',
  'nl-NL',
  'ne-NP',
  'nb-NO',
  'pl-PL',
  'pt-BR',
  'pt-PT',
  'ro-RO',
  'si-LK',
  'sl-SI',
  'su-ID',
  'sk-SK',
  'fi-FI',
  'sv-SE',
  'sw-TZ',
  'sw-KE',
  'ka-GE',
  'hy-AM',
  'ta-IN',
  'ta-SG',
  'ta-LK',
  'ta-MY',
  'te-IN',
  'vi-VN',
  'tr-TR',
  'ur-PK',
  'ur-IN',
  'el-GR',
  'bg-BG',
  'ru-RU',
  'sr-RS',
  'uk-UA',
  'ko-KR',
  'cmn-Hans-CN',
  'cmn-Hans-HK',
  'cmn-Hant-TW',
  'yue-Hant-HK',
  'ja-JP',
  'hi-IN',
  'th-TH',
] as const
