export type { Synthesis, Voice, BrowserVoice, BaseOptions }
export { synthesis, speak, getVoicesTypeString }

type BaseOptions = {
  /** The text to be spoken. */
  text: string

  /**
   * Float, 0 to 1. Will clamp on values outside of range
   *
   * @default 1
   */
  volume: number

  /**
   * Float, 0.1 to 10. Will clamp on values outside of range
   *
   * @default 1
   */
  rate: number

  /**
   * Integer, 0 to 2. Will clamp on values outside of range
   *
   * @default 1
   */
  pitch: number
}

/**
 * The fluent API is optional, you can use the function directly.
 *
 * It's here for two reasons:
 *
 * 1. Enables point-free style
 * 2. Enables better type inference to give you autocomplete
 */
class Synthesis<V extends BrowserVoice = BrowserVoice> {
  static getAllVoices = () => speechSynthesis.getVoices()

  constructor(
    readonly options: BaseOptions,
    // this need to be a function so that it's lazily evaluated when window.speechSynthesis is ready
    // FIXME: it's still failing on the first call, why? (at least on solidjs project, check with others)
    readonly getVoices: () => SpeechSynthesisVoice[],
  ) {}

  resetVoice = () => new Synthesis(this.options, Synthesis.getAllVoices)

  use = <U extends Partial<V>>(config: Partial<BaseOptions> & U) => {
    const voiceOptions = voiceKeys.filter(k => k in config).map(k => [k, config[k]])

    const voices = this.getVoices().filter(voice =>
      voiceOptions.every(([k, v]) => v === (voice as any)[k]),
    )

    if (voices.length === 0) {
      console.error(
        new Error(
          `No voices match for ${JSON.stringify(Object.fromEntries(voiceOptions))}`,
        ),
      )
    }

    return new Synthesis<Extract<V, U>>(
      {
        text: config.text ?? this.options.text,
        volume: clamp(0, 1)(config.volume ?? this.options.volume),
        rate: clamp(0.1, 10)(config.rate ?? this.options.rate),
        pitch: clamp(0, 2)(config.pitch ?? this.options.pitch),
      },
      () => voices,
    )
  }

  speak: {
    (): Promise<void>
    <U extends Partial<V>>(options: Partial<BaseOptions> & U): Promise<void>
    (text: string): Promise<void>
    <U extends Partial<V>>(
      text: string,
      options: Partial<Exclude<BaseOptions, 'text'> & U>,
    ): Promise<void>
  } = <U extends Partial<V>>(
    ...args:
      | []
      | [options: Partial<BaseOptions> & U]
      | [text: string]
      | [text: string, options: Partial<Exclude<BaseOptions, 'text'>> & U]
  ) => {
    if (args.length === 2) return this.use({ ...args[1], text: args[0] }).speak()
    else if (args.length === 1) {
      if (typeof args[0] === 'string') return this.use<{}>({ text: args[0] }).speak()
      else return this.use(args[0]).speak()
    } else
      return new Promise<void>((resolve, reject) =>
        speechSynthesis.speak(
          Object.assign(new SpeechSynthesisUtterance(this.options.text), {
            voice: this.getVoices()[0],
            volume: this.options.volume,
            rate: this.options.rate,
            pitch: this.options.pitch,
            onend: resolve,
            onerror: reject,
          }),
        ),
      )
  }
}

const synthesis = new Synthesis({ volume: 1, rate: 1, pitch: 1, text: '' }, () =>
  speechSynthesis.getVoices(),
)

const speak = synthesis.speak

const clamp = (min: number, max: number) => (v: number) => Math.min(Math.max(v, min), max)

/**
 * The snippet I use to generate the typings for the voices.
 *
 * Just copy and run `copy(getVoicesTypeString())` on the browser console.
 */
const getVoicesTypeString = () => {
  const browser = (agent => {
    if (agent.indexOf('edge') > -1) return 'MSEdge'
    if (agent.indexOf('edg/') > -1) return 'ChromiumEdge'
    // @ts-ignore
    if (agent.indexOf('opr') > -1 && !!window.opr) return 'Opera'
    // @ts-ignore
    if (agent.indexOf('chrome') > -1 && !!window.chrome) return 'Chrome'
    if (agent.indexOf('trident') > -1) return 'IE'
    if (agent.indexOf('firefox') > -1) return 'Firefox'
    if (agent.indexOf('safari') > -1) return 'Safari'
    else return 'Other'
  })(window.navigator.userAgent.toLowerCase())

  const voices = speechSynthesis.getVoices().map(voice =>
    ['lang', 'name', 'localService', 'voiceURI'].reduce(
      // @ts-ignore
      (acc, key) => ({ ...acc, [key]: voice[key] }),
      { browser },
    ),
  )

  return `type ${browser}Voice = ${voices.map(v => JSON.stringify(v)).join('|')}`
}

const _voiceKeys: {
  [key in keyof Voice]: null
} = { lang: null, localService: null, name: null, voiceURI: null }

const voiceKeys = Object.keys(_voiceKeys) as (keyof Voice)[]

type Voice = Omit<BrowserVoice, 'browser'>

/**
 * The possible voices for the browser, typed here so we can get autocomplete.
 *
 * I generated this by using `getVoicesTypeString` on the browser console.
 */
type BrowserVoice = ChromeVoice | FirefoxVoice | SafariVoice

type ChromeVoice =
  | {
      browser: 'Chrome'
      lang: 'en-GB'
      name: 'Daniel'
      localService: true
      voiceURI: 'Daniel'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Alex'
      localService: true
      voiceURI: 'Alex'
    }
  | {
      browser: 'Chrome'
      lang: 'it-IT'
      name: 'Alice'
      localService: true
      voiceURI: 'Alice'
    }
  | {
      browser: 'Chrome'
      lang: 'sv-SE'
      name: 'Alva'
      localService: true
      voiceURI: 'Alva'
    }
  | {
      browser: 'Chrome'
      lang: 'fr-CA'
      name: 'Amelie'
      localService: true
      voiceURI: 'Amelie'
    }
  | {
      browser: 'Chrome'
      lang: 'de-DE'
      name: 'Anna'
      localService: true
      voiceURI: 'Anna'
    }
  | {
      browser: 'Chrome'
      lang: 'he-IL'
      name: 'Carmit'
      localService: true
      voiceURI: 'Carmit'
    }
  | {
      browser: 'Chrome'
      lang: 'id-ID'
      name: 'Damayanti'
      localService: true
      voiceURI: 'Damayanti'
    }
  | {
      browser: 'Chrome'
      lang: 'es-AR'
      name: 'Diego'
      localService: true
      voiceURI: 'Diego'
    }
  | {
      browser: 'Chrome'
      lang: 'nl-BE'
      name: 'Ellen'
      localService: true
      voiceURI: 'Ellen'
    }
  | {
      browser: 'Chrome'
      lang: 'en'
      name: 'Fiona'
      localService: true
      voiceURI: 'Fiona'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Fred'
      localService: true
      voiceURI: 'Fred'
    }
  | {
      browser: 'Chrome'
      lang: 'ro-RO'
      name: 'Ioana'
      localService: true
      voiceURI: 'Ioana'
    }
  | {
      browser: 'Chrome'
      lang: 'pt-PT'
      name: 'Joana'
      localService: true
      voiceURI: 'Joana'
    }
  | {
      browser: 'Chrome'
      lang: 'es-ES'
      name: 'Jorge'
      localService: true
      voiceURI: 'Jorge'
    }
  | {
      browser: 'Chrome'
      lang: 'es-MX'
      name: 'Juan'
      localService: true
      voiceURI: 'Juan'
    }
  | {
      browser: 'Chrome'
      lang: 'th-TH'
      name: 'Kanya'
      localService: true
      voiceURI: 'Kanya'
    }
  | {
      browser: 'Chrome'
      lang: 'en-AU'
      name: 'Karen'
      localService: true
      voiceURI: 'Karen'
    }
  | {
      browser: 'Chrome'
      lang: 'ja-JP'
      name: 'Kyoko'
      localService: true
      voiceURI: 'Kyoko'
    }
  | {
      browser: 'Chrome'
      lang: 'sk-SK'
      name: 'Laura'
      localService: true
      voiceURI: 'Laura'
    }
  | {
      browser: 'Chrome'
      lang: 'hi-IN'
      name: 'Lekha'
      localService: true
      voiceURI: 'Lekha'
    }
  | {
      browser: 'Chrome'
      lang: 'it-IT'
      name: 'Luca'
      localService: true
      voiceURI: 'Luca'
    }
  | {
      browser: 'Chrome'
      lang: 'pt-BR'
      name: 'Luciana'
      localService: true
      voiceURI: 'Luciana'
    }
  | {
      browser: 'Chrome'
      lang: 'ar-SA'
      name: 'Maged'
      localService: true
      voiceURI: 'Maged'
    }
  | {
      browser: 'Chrome'
      lang: 'hu-HU'
      name: 'Mariska'
      localService: true
      voiceURI: 'Mariska'
    }
  | {
      browser: 'Chrome'
      lang: 'zh-TW'
      name: 'Mei-Jia'
      localService: true
      voiceURI: 'Mei-Jia'
    }
  | {
      browser: 'Chrome'
      lang: 'el-GR'
      name: 'Melina'
      localService: true
      voiceURI: 'Melina'
    }
  | {
      browser: 'Chrome'
      lang: 'ru-RU'
      name: 'Milena'
      localService: true
      voiceURI: 'Milena'
    }
  | {
      browser: 'Chrome'
      lang: 'en-IE'
      name: 'Moira'
      localService: true
      voiceURI: 'Moira'
    }
  | {
      browser: 'Chrome'
      lang: 'es-ES'
      name: 'Monica'
      localService: true
      voiceURI: 'Monica'
    }
  | {
      browser: 'Chrome'
      lang: 'nb-NO'
      name: 'Nora'
      localService: true
      voiceURI: 'Nora'
    }
  | {
      browser: 'Chrome'
      lang: 'es-MX'
      name: 'Paulina'
      localService: true
      voiceURI: 'Paulina'
    }
  | {
      browser: 'Chrome'
      lang: 'en-IN'
      name: 'Rishi'
      localService: true
      voiceURI: 'Rishi'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Samantha'
      localService: true
      voiceURI: 'Samantha'
    }
  | {
      browser: 'Chrome'
      lang: 'da-DK'
      name: 'Sara'
      localService: true
      voiceURI: 'Sara'
    }
  | {
      browser: 'Chrome'
      lang: 'fi-FI'
      name: 'Satu'
      localService: true
      voiceURI: 'Satu'
    }
  | {
      browser: 'Chrome'
      lang: 'zh-HK'
      name: 'Sin-ji'
      localService: true
      voiceURI: 'Sin-ji'
    }
  | {
      browser: 'Chrome'
      lang: 'en-ZA'
      name: 'Tessa'
      localService: true
      voiceURI: 'Tessa'
    }
  | {
      browser: 'Chrome'
      lang: 'fr-FR'
      name: 'Thomas'
      localService: true
      voiceURI: 'Thomas'
    }
  | {
      browser: 'Chrome'
      lang: 'zh-CN'
      name: 'Ting-Ting'
      localService: true
      voiceURI: 'Ting-Ting'
    }
  | {
      browser: 'Chrome'
      lang: 'en-IN'
      name: 'Veena'
      localService: true
      voiceURI: 'Veena'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Victoria'
      localService: true
      voiceURI: 'Victoria'
    }
  | {
      browser: 'Chrome'
      lang: 'nl-NL'
      name: 'Xander'
      localService: true
      voiceURI: 'Xander'
    }
  | {
      browser: 'Chrome'
      lang: 'tr-TR'
      name: 'Yelda'
      localService: true
      voiceURI: 'Yelda'
    }
  | {
      browser: 'Chrome'
      lang: 'ko-KR'
      name: 'Yuna'
      localService: true
      voiceURI: 'Yuna'
    }
  | {
      browser: 'Chrome'
      lang: 'ru-RU'
      name: 'Yuri'
      localService: true
      voiceURI: 'Yuri'
    }
  | {
      browser: 'Chrome'
      lang: 'pl-PL'
      name: 'Zosia'
      localService: true
      voiceURI: 'Zosia'
    }
  | {
      browser: 'Chrome'
      lang: 'cs-CZ'
      name: 'Zuzana'
      localService: true
      voiceURI: 'Zuzana'
    }
  | {
      browser: 'Chrome'
      lang: 'de-DE'
      name: 'Google Deutsch'
      localService: false
      voiceURI: 'Google Deutsch'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Google US English'
      localService: false
      voiceURI: 'Google US English'
    }
  | {
      browser: 'Chrome'
      lang: 'en-GB'
      name: 'Google UK English Female'
      localService: false
      voiceURI: 'Google UK English Female'
    }
  | {
      browser: 'Chrome'
      lang: 'en-GB'
      name: 'Google UK English Male'
      localService: false
      voiceURI: 'Google UK English Male'
    }
  | {
      browser: 'Chrome'
      lang: 'es-ES'
      name: 'Google español'
      localService: false
      voiceURI: 'Google español'
    }
  | {
      browser: 'Chrome'
      lang: 'es-US'
      name: 'Google español de Estados Unidos'
      localService: false
      voiceURI: 'Google español de Estados Unidos'
    }
  | {
      browser: 'Chrome'
      lang: 'fr-FR'
      name: 'Google français'
      localService: false
      voiceURI: 'Google français'
    }
  | {
      browser: 'Chrome'
      lang: 'hi-IN'
      name: 'Google हिन्दी'
      localService: false
      voiceURI: 'Google हिन्दी'
    }
  | {
      browser: 'Chrome'
      lang: 'id-ID'
      name: 'Google Bahasa Indonesia'
      localService: false
      voiceURI: 'Google Bahasa Indonesia'
    }
  | {
      browser: 'Chrome'
      lang: 'it-IT'
      name: 'Google italiano'
      localService: false
      voiceURI: 'Google italiano'
    }
  | {
      browser: 'Chrome'
      lang: 'ja-JP'
      name: 'Google 日本語'
      localService: false
      voiceURI: 'Google 日本語'
    }
  | {
      browser: 'Chrome'
      lang: 'ko-KR'
      name: 'Google 한국의'
      localService: false
      voiceURI: 'Google 한국의'
    }
  | {
      browser: 'Chrome'
      lang: 'nl-NL'
      name: 'Google Nederlands'
      localService: false
      voiceURI: 'Google Nederlands'
    }
  | {
      browser: 'Chrome'
      lang: 'pl-PL'
      name: 'Google polski'
      localService: false
      voiceURI: 'Google polski'
    }
  | {
      browser: 'Chrome'
      lang: 'pt-BR'
      name: 'Google português do Brasil'
      localService: false
      voiceURI: 'Google português do Brasil'
    }
  | {
      browser: 'Chrome'
      lang: 'ru-RU'
      name: 'Google русский'
      localService: false
      voiceURI: 'Google русский'
    }
  | {
      browser: 'Chrome'
      lang: 'zh-CN'
      name: 'Google 普通话（中国大陆）'
      localService: false
      voiceURI: 'Google 普通话（中国大陆）'
    }
  | {
      browser: 'Chrome'
      lang: 'zh-HK'
      name: 'Google 粤語（香港）'
      localService: false
      voiceURI: 'Google 粤語（香港）'
    }
  | {
      browser: 'Chrome'
      lang: 'zh-TW'
      name: 'Google 國語（臺灣）'
      localService: false
      voiceURI: 'Google 國語（臺灣）'
    }

type FirefoxVoice =
  | {
      browser: 'Firefox'
      lang: 'en-US'
      name: 'Alex'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.Alex'
    }
  | {
      browser: 'Firefox'
      lang: 'it-IT'
      name: 'Alice'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.alice'
    }
  | {
      browser: 'Firefox'
      lang: 'sv-SE'
      name: 'Alva'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.alva'
    }
  | {
      browser: 'Firefox'
      lang: 'fr-CA'
      name: 'Amelie'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.amelie'
    }
  | {
      browser: 'Firefox'
      lang: 'de-DE'
      name: 'Anna'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.anna'
    }
  | {
      browser: 'Firefox'
      lang: 'he-IL'
      name: 'Carmit'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.carmit'
    }
  | {
      browser: 'Firefox'
      lang: 'id-ID'
      name: 'Damayanti'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.damayanti'
    }
  | {
      browser: 'Firefox'
      lang: 'en-GB'
      name: 'Daniel'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.daniel'
    }
  | {
      browser: 'Firefox'
      lang: 'es-AR'
      name: 'Diego'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.diego'
    }
  | {
      browser: 'Firefox'
      lang: 'nl-BE'
      name: 'Ellen'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.ellen'
    }
  | {
      browser: 'Firefox'
      lang: 'en-scotland'
      name: 'Fiona'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.fiona'
    }
  | {
      browser: 'Firefox'
      lang: 'en-US'
      name: 'Fred'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.Fred'
    }
  | {
      browser: 'Firefox'
      lang: 'ro-RO'
      name: 'Ioana'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.ioana'
    }
  | {
      browser: 'Firefox'
      lang: 'pt-PT'
      name: 'Joana'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.joana'
    }
  | {
      browser: 'Firefox'
      lang: 'es-ES'
      name: 'Jorge'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.jorge'
    }
  | {
      browser: 'Firefox'
      lang: 'es-MX'
      name: 'Juan'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.juan'
    }
  | {
      browser: 'Firefox'
      lang: 'th-TH'
      name: 'Kanya'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.kanya'
    }
  | {
      browser: 'Firefox'
      lang: 'en-AU'
      name: 'Karen'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.karen'
    }
  | {
      browser: 'Firefox'
      lang: 'ja-JP'
      name: 'Kyoko'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.kyoko'
    }
  | {
      browser: 'Firefox'
      lang: 'sk-SK'
      name: 'Laura'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.laura'
    }
  | {
      browser: 'Firefox'
      lang: 'hi-IN'
      name: 'Lekha'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.lekha'
    }
  | {
      browser: 'Firefox'
      lang: 'it-IT'
      name: 'Luca'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.luca'
    }
  | {
      browser: 'Firefox'
      lang: 'pt-BR'
      name: 'Luciana'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.luciana'
    }
  | {
      browser: 'Firefox'
      lang: 'ar-SA'
      name: 'Maged'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.maged'
    }
  | {
      browser: 'Firefox'
      lang: 'hu-HU'
      name: 'Mariska'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.mariska'
    }
  | {
      browser: 'Firefox'
      lang: 'zh-TW'
      name: 'Mei-Jia'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.meijia'
    }
  | {
      browser: 'Firefox'
      lang: 'el-GR'
      name: 'Melina'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.melina'
    }
  | {
      browser: 'Firefox'
      lang: 'ru-RU'
      name: 'Milena'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.milena'
    }
  | {
      browser: 'Firefox'
      lang: 'en-IE'
      name: 'Moira'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.moira'
    }
  | {
      browser: 'Firefox'
      lang: 'es-ES'
      name: 'Monica'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.monica'
    }
  | {
      browser: 'Firefox'
      lang: 'nb-NO'
      name: 'Nora'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.nora'
    }
  | {
      browser: 'Firefox'
      lang: 'es-MX'
      name: 'Paulina'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.paulina'
    }
  | {
      browser: 'Firefox'
      lang: 'en-IN'
      name: 'Rishi'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.rishi'
    }
  | {
      browser: 'Firefox'
      lang: 'en-US'
      name: 'Samantha'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.samantha'
    }
  | {
      browser: 'Firefox'
      lang: 'da-DK'
      name: 'Sara'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.sara'
    }
  | {
      browser: 'Firefox'
      lang: 'fi-FI'
      name: 'Satu'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.satu'
    }
  | {
      browser: 'Firefox'
      lang: 'zh-HK'
      name: 'Sin-ji'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.sinji'
    }
  | {
      browser: 'Firefox'
      lang: 'en-ZA'
      name: 'Tessa'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.tessa'
    }
  | {
      browser: 'Firefox'
      lang: 'fr-FR'
      name: 'Thomas'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.thomas'
    }
  | {
      browser: 'Firefox'
      lang: 'zh-CN'
      name: 'Ting-Ting'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.tingting'
    }
  | {
      browser: 'Firefox'
      lang: 'en-IN'
      name: 'Veena'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.veena'
    }
  | {
      browser: 'Firefox'
      lang: 'en-US'
      name: 'Victoria'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.Victoria'
    }
  | {
      browser: 'Firefox'
      lang: 'nl-NL'
      name: 'Xander'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.xander'
    }
  | {
      browser: 'Firefox'
      lang: 'tr-TR'
      name: 'Yelda'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.yelda'
    }
  | {
      browser: 'Firefox'
      lang: 'ko-KR'
      name: 'Yuna'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.yuna'
    }
  | {
      browser: 'Firefox'
      lang: 'ru-RU'
      name: 'Yuri'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.yuri'
    }
  | {
      browser: 'Firefox'
      lang: 'pl-PL'
      name: 'Zosia'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.zosia'
    }
  | {
      browser: 'Firefox'
      lang: 'cs-CZ'
      name: 'Zuzana'
      localService: true
      voiceURI: 'urn:moz-tts:osx:com.apple.speech.synthesis.voice.zuzana'
    }

type SafariVoice =
  | {
      browser: 'Safari'
      lang: 'en-US'
      name: 'Alex'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.Alex'
    }
  | {
      browser: 'Safari'
      lang: 'it-IT'
      name: 'Alice'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.alice'
    }
  | {
      browser: 'Safari'
      lang: 'sv-SE'
      name: 'Alva'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.alva'
    }
  | {
      browser: 'Safari'
      lang: 'fr-CA'
      name: 'Amelie'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.amelie'
    }
  | {
      browser: 'Safari'
      lang: 'de-DE'
      name: 'Anna'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.anna'
    }
  | {
      browser: 'Safari'
      lang: 'he-IL'
      name: 'Carmit'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.carmit'
    }
  | {
      browser: 'Safari'
      lang: 'id-ID'
      name: 'Damayanti'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.damayanti'
    }
  | {
      browser: 'Safari'
      lang: 'en-GB'
      name: 'Daniel'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.daniel'
    }
  | {
      browser: 'Safari'
      lang: 'es-AR'
      name: 'Diego'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.diego'
    }
  | {
      browser: 'Safari'
      lang: 'nl-BE'
      name: 'Ellen'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.ellen'
    }
  | {
      browser: 'Safari'
      lang: 'en-SCOTLAND'
      name: 'Fiona'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.fiona'
    }
  | {
      browser: 'Safari'
      lang: 'en-US'
      name: 'Fred'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.Fred'
    }
  | {
      browser: 'Safari'
      lang: 'ro-RO'
      name: 'Ioana'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.ioana'
    }
  | {
      browser: 'Safari'
      lang: 'pt-PT'
      name: 'Joana'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.joana'
    }
  | {
      browser: 'Safari'
      lang: 'es-ES'
      name: 'Jorge'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.jorge'
    }
  | {
      browser: 'Safari'
      lang: 'es-MX'
      name: 'Juan'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.juan'
    }
  | {
      browser: 'Safari'
      lang: 'th-TH'
      name: 'Kanya'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.kanya'
    }
  | {
      browser: 'Safari'
      lang: 'en-AU'
      name: 'Karen'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.karen'
    }
  | {
      browser: 'Safari'
      lang: 'ja-JP'
      name: 'Kyoko'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.kyoko'
    }
  | {
      browser: 'Safari'
      lang: 'sk-SK'
      name: 'Laura'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.laura'
    }
  | {
      browser: 'Safari'
      lang: 'hi-IN'
      name: 'Lekha'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.lekha'
    }
  | {
      browser: 'Safari'
      lang: 'it-IT'
      name: 'Luca'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.luca'
    }
  | {
      browser: 'Safari'
      lang: 'pt-BR'
      name: 'Luciana'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.luciana'
    }
  | {
      browser: 'Safari'
      lang: 'ar-SA'
      name: 'Maged'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.maged'
    }
  | {
      browser: 'Safari'
      lang: 'hu-HU'
      name: 'Mariska'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.mariska'
    }
  | {
      browser: 'Safari'
      lang: 'zh-TW'
      name: 'Mei-Jia'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.meijia'
    }
  | {
      browser: 'Safari'
      lang: 'el-GR'
      name: 'Melina'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.melina'
    }
  | {
      browser: 'Safari'
      lang: 'ru-RU'
      name: 'Milena'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.milena'
    }
  | {
      browser: 'Safari'
      lang: 'en-IE'
      name: 'Moira'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.moira'
    }
  | {
      browser: 'Safari'
      lang: 'es-ES'
      name: 'Monica'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.monica'
    }
  | {
      browser: 'Safari'
      lang: 'nb-NO'
      name: 'Nora'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.nora'
    }
  | {
      browser: 'Safari'
      lang: 'es-MX'
      name: 'Paulina'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.paulina'
    }
  | {
      browser: 'Safari'
      lang: 'en-IN'
      name: 'Rishi'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.rishi'
    }
  | {
      browser: 'Safari'
      lang: 'en-US'
      name: 'Samantha'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.samantha'
    }
  | {
      browser: 'Safari'
      lang: 'da-DK'
      name: 'Sara'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.sara'
    }
  | {
      browser: 'Safari'
      lang: 'fi-FI'
      name: 'Satu'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.satu'
    }
  | {
      browser: 'Safari'
      lang: 'zh-HK'
      name: 'Sin-ji'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.sinji'
    }
  | {
      browser: 'Safari'
      lang: 'en-ZA'
      name: 'Tessa'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.tessa'
    }
  | {
      browser: 'Safari'
      lang: 'fr-FR'
      name: 'Thomas'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.thomas'
    }
  | {
      browser: 'Safari'
      lang: 'zh-CN'
      name: 'Ting-Ting'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.tingting'
    }
  | {
      browser: 'Safari'
      lang: 'en-IN'
      name: 'Veena'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.veena'
    }
  | {
      browser: 'Safari'
      lang: 'en-US'
      name: 'Victoria'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.Victoria'
    }
  | {
      browser: 'Safari'
      lang: 'nl-NL'
      name: 'Xander'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.xander'
    }
  | {
      browser: 'Safari'
      lang: 'tr-TR'
      name: 'Yelda'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.yelda'
    }
  | {
      browser: 'Safari'
      lang: 'ko-KR'
      name: 'Yuna'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.yuna'
    }
  | {
      browser: 'Safari'
      lang: 'ru-RU'
      name: 'Yuri'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.yuri'
    }
  | {
      browser: 'Safari'
      lang: 'pl-PL'
      name: 'Zosia'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.zosia'
    }
  | {
      browser: 'Safari'
      lang: 'cs-CZ'
      name: 'Zuzana'
      localService: true
      voiceURI: 'com.apple.speech.synthesis.voice.zuzana'
    }
