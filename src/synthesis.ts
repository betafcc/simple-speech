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
  static getAllVoices = () =>
    new Promise<Array<SpeechSynthesisVoice>>(resolve => {
      const voices = speechSynthesis.getVoices()
      if (voices.length > 0) resolve(voices)
      else
        speechSynthesis.addEventListener('voiceschanged', function resolver() {
          speechSynthesis.removeEventListener('voiceschanged', resolver)
          resolve(speechSynthesis.getVoices())
        })
    })

  constructor(
    readonly options: BaseOptions,
    readonly getVoices: () => Promise<SpeechSynthesisVoice[]>
  ) {}

  resetVoice = () => new Synthesis(this.options, Synthesis.getAllVoices)

  use = <U extends Partial<V>>(config: Partial<BaseOptions> & U) => {
    const voiceOptions = voiceKeys.filter(k => k in config).map(k => [k, config[k]])

    return new Synthesis<Extract<V, U>>(
      {
        text: config.text ?? this.options.text,
        volume: clamp(0, 1)(config.volume ?? this.options.volume),
        rate: clamp(0.1, 10)(config.rate ?? this.options.rate),
        pitch: clamp(0, 2)(config.pitch ?? this.options.pitch),
      },
      async () => {
        const voices = (await this.getVoices()).filter(voice =>
          voiceOptions.every(([k, v]) => v === (voice as any)[k])
        )

        if (voices.length === 0)
          throw new Error(
            `No voices found with the following options: '${JSON.stringify(
              Object.fromEntries(voiceOptions)
            )}'`
          )

        return voices
      }
    )
  }

  // idk why, the union on args breaks rollup
  // } = <U extends Partial<V>>(
  //   ...args: (
  //     | []
  //     | [options: Partial<BaseOptions> & U]
  //     | [text: string]
  //     | [text: string, options: Partial<Exclude<BaseOptions, 'text'>> & U]
  //   )

  speak: {
    (): Promise<void>
    <U extends Partial<V>>(options: Partial<BaseOptions> & U): Promise<void>
    (text: string): Promise<void>
    <U extends Partial<V>>(
      text: string,
      options: Partial<Exclude<BaseOptions, 'text'> & U>
    ): Promise<void>
  } = (...args: any[]) => {
    if (args.length === 2) return this.use({ ...args[1], text: args[0] }).speak()
    else if (args.length === 1) {
      if (typeof args[0] === 'string') return this.use<{}>({ text: args[0] }).speak()
      else return this.use(args[0]).speak()
    } else
      return new Promise<void>(async (resolve, reject) =>
        speechSynthesis.speak(
          Object.assign(new SpeechSynthesisUtterance(this.options.text), {
            voice: (await this.getVoices())[0],
            volume: this.options.volume,
            rate: this.options.rate,
            pitch: this.options.pitch,
            onend: resolve,
            onerror: reject,
          })
        )
      )
  }
}

const synthesis = new Synthesis({ volume: 1, rate: 1, pitch: 1, text: '' }, Synthesis.getAllVoices)

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
      { browser }
    )
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
      name: 'Albert'
      localService: true
      voiceURI: 'Albert'
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
      name: 'Amélie'
      localService: true
      voiceURI: 'Amélie'
    }
  | {
      browser: 'Chrome'
      lang: 'ms-MY'
      name: 'Amira'
      localService: true
      voiceURI: 'Amira'
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
      lang: 'en-US'
      name: 'Bad News'
      localService: true
      voiceURI: 'Bad News'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Bahh'
      localService: true
      voiceURI: 'Bahh'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Bells'
      localService: true
      voiceURI: 'Bells'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Boing'
      localService: true
      voiceURI: 'Boing'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Bubbles'
      localService: true
      voiceURI: 'Bubbles'
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
      lang: 'en-US'
      name: 'Cellos'
      localService: true
      voiceURI: 'Cellos'
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
      lang: 'en-GB'
      name: 'Daniel (Enhanced)'
      localService: true
      voiceURI: 'Daniel (Enhanced)'
    }
  | {
      browser: 'Chrome'
      lang: 'bg-BG'
      name: 'Daria'
      localService: true
      voiceURI: 'Daria'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Wobble'
      localService: true
      voiceURI: 'Wobble'
    }
  | {
      browser: 'Chrome'
      lang: 'es-AR'
      name: 'Diego (Enhanced)'
      localService: true
      voiceURI: 'Diego (Enhanced)'
    }
  | {
      browser: 'Chrome'
      lang: 'it-IT'
      name: 'Eddy (Italian (Italy))'
      localService: true
      voiceURI: 'Eddy (Italian (Italy))'
    }
  | {
      browser: 'Chrome'
      lang: 'fr-FR'
      name: 'Eddy (French (France))'
      localService: true
      voiceURI: 'Eddy (French (France))'
    }
  | {
      browser: 'Chrome'
      lang: 'de-DE'
      name: 'Eddy (German (Germany))'
      localService: true
      voiceURI: 'Eddy (German (Germany))'
    }
  | {
      browser: 'Chrome'
      lang: 'fr-CA'
      name: 'Eddy (French (Canada))'
      localService: true
      voiceURI: 'Eddy (French (Canada))'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Eddy (English (US))'
      localService: true
      voiceURI: 'Eddy (English (US))'
    }
  | {
      browser: 'Chrome'
      lang: 'es-MX'
      name: 'Eddy (Spanish (Mexico))'
      localService: true
      voiceURI: 'Eddy (Spanish (Mexico))'
    }
  | {
      browser: 'Chrome'
      lang: 'fi-FI'
      name: 'Eddy (Finnish (Finland))'
      localService: true
      voiceURI: 'Eddy (Finnish (Finland))'
    }
  | {
      browser: 'Chrome'
      lang: 'en-GB'
      name: 'Eddy (English (UK))'
      localService: true
      voiceURI: 'Eddy (English (UK))'
    }
  | {
      browser: 'Chrome'
      lang: 'es-ES'
      name: 'Eddy (Spanish (Spain))'
      localService: true
      voiceURI: 'Eddy (Spanish (Spain))'
    }
  | {
      browser: 'Chrome'
      lang: 'pt-BR'
      name: 'Eddy (Portuguese (Brazil))'
      localService: true
      voiceURI: 'Eddy (Portuguese (Brazil))'
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
      lang: 'fr-FR'
      name: 'Flo (French (France))'
      localService: true
      voiceURI: 'Flo (French (France))'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Flo (English (US))'
      localService: true
      voiceURI: 'Flo (English (US))'
    }
  | {
      browser: 'Chrome'
      lang: 'es-MX'
      name: 'Flo (Spanish (Mexico))'
      localService: true
      voiceURI: 'Flo (Spanish (Mexico))'
    }
  | {
      browser: 'Chrome'
      lang: 'en-GB'
      name: 'Flo (English (UK))'
      localService: true
      voiceURI: 'Flo (English (UK))'
    }
  | {
      browser: 'Chrome'
      lang: 'es-ES'
      name: 'Flo (Spanish (Spain))'
      localService: true
      voiceURI: 'Flo (Spanish (Spain))'
    }
  | {
      browser: 'Chrome'
      lang: 'it-IT'
      name: 'Flo (Italian (Italy))'
      localService: true
      voiceURI: 'Flo (Italian (Italy))'
    }
  | {
      browser: 'Chrome'
      lang: 'fr-CA'
      name: 'Flo (French (Canada))'
      localService: true
      voiceURI: 'Flo (French (Canada))'
    }
  | {
      browser: 'Chrome'
      lang: 'pt-BR'
      name: 'Flo (Portuguese (Brazil))'
      localService: true
      voiceURI: 'Flo (Portuguese (Brazil))'
    }
  | {
      browser: 'Chrome'
      lang: 'de-DE'
      name: 'Flo (German (Germany))'
      localService: true
      voiceURI: 'Flo (German (Germany))'
    }
  | {
      browser: 'Chrome'
      lang: 'fi-FI'
      name: 'Flo (Finnish (Finland))'
      localService: true
      voiceURI: 'Flo (Finnish (Finland))'
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
      lang: 'en-US'
      name: 'Good News'
      localService: true
      voiceURI: 'Good News'
    }
  | {
      browser: 'Chrome'
      lang: 'fr-FR'
      name: 'Grandma (French (France))'
      localService: true
      voiceURI: 'Grandma (French (France))'
    }
  | {
      browser: 'Chrome'
      lang: 'fr-CA'
      name: 'Grandma (French (Canada))'
      localService: true
      voiceURI: 'Grandma (French (Canada))'
    }
  | {
      browser: 'Chrome'
      lang: 'fi-FI'
      name: 'Grandma (Finnish (Finland))'
      localService: true
      voiceURI: 'Grandma (Finnish (Finland))'
    }
  | {
      browser: 'Chrome'
      lang: 'de-DE'
      name: 'Grandma (German (Germany))'
      localService: true
      voiceURI: 'Grandma (German (Germany))'
    }
  | {
      browser: 'Chrome'
      lang: 'pt-BR'
      name: 'Grandma (Portuguese (Brazil))'
      localService: true
      voiceURI: 'Grandma (Portuguese (Brazil))'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Grandma (English (US))'
      localService: true
      voiceURI: 'Grandma (English (US))'
    }
  | {
      browser: 'Chrome'
      lang: 'es-ES'
      name: 'Grandma (Spanish (Spain))'
      localService: true
      voiceURI: 'Grandma (Spanish (Spain))'
    }
  | {
      browser: 'Chrome'
      lang: 'en-GB'
      name: 'Grandma (English (UK))'
      localService: true
      voiceURI: 'Grandma (English (UK))'
    }
  | {
      browser: 'Chrome'
      lang: 'it-IT'
      name: 'Grandma (Italian (Italy))'
      localService: true
      voiceURI: 'Grandma (Italian (Italy))'
    }
  | {
      browser: 'Chrome'
      lang: 'es-MX'
      name: 'Grandma (Spanish (Mexico))'
      localService: true
      voiceURI: 'Grandma (Spanish (Mexico))'
    }
  | {
      browser: 'Chrome'
      lang: 'fr-FR'
      name: 'Grandpa (French (France))'
      localService: true
      voiceURI: 'Grandpa (French (France))'
    }
  | {
      browser: 'Chrome'
      lang: 'fr-CA'
      name: 'Grandpa (French (Canada))'
      localService: true
      voiceURI: 'Grandpa (French (Canada))'
    }
  | {
      browser: 'Chrome'
      lang: 'fi-FI'
      name: 'Grandpa (Finnish (Finland))'
      localService: true
      voiceURI: 'Grandpa (Finnish (Finland))'
    }
  | {
      browser: 'Chrome'
      lang: 'de-DE'
      name: 'Grandpa (German (Germany))'
      localService: true
      voiceURI: 'Grandpa (German (Germany))'
    }
  | {
      browser: 'Chrome'
      lang: 'pt-BR'
      name: 'Grandpa (Portuguese (Brazil))'
      localService: true
      voiceURI: 'Grandpa (Portuguese (Brazil))'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Grandpa (English (US))'
      localService: true
      voiceURI: 'Grandpa (English (US))'
    }
  | {
      browser: 'Chrome'
      lang: 'es-ES'
      name: 'Grandpa (Spanish (Spain))'
      localService: true
      voiceURI: 'Grandpa (Spanish (Spain))'
    }
  | {
      browser: 'Chrome'
      lang: 'en-GB'
      name: 'Grandpa (English (UK))'
      localService: true
      voiceURI: 'Grandpa (English (UK))'
    }
  | {
      browser: 'Chrome'
      lang: 'it-IT'
      name: 'Grandpa (Italian (Italy))'
      localService: true
      voiceURI: 'Grandpa (Italian (Italy))'
    }
  | {
      browser: 'Chrome'
      lang: 'es-MX'
      name: 'Grandpa (Spanish (Mexico))'
      localService: true
      voiceURI: 'Grandpa (Spanish (Mexico))'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Jester'
      localService: true
      voiceURI: 'Jester'
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
      lang: 'fr-FR'
      name: 'Jacques'
      localService: true
      voiceURI: 'Jacques'
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
      lang: 'en-US'
      name: 'Junior'
      localService: true
      voiceURI: 'Junior'
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
      lang: 'en-US'
      name: 'Kathy'
      localService: true
      voiceURI: 'Kathy'
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
      lang: 'hr-HR'
      name: 'Lana'
      localService: true
      voiceURI: 'Lana'
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
      lang: 'uk-UA'
      name: 'Lesya'
      localService: true
      voiceURI: 'Lesya'
    }
  | {
      browser: 'Chrome'
      lang: 'vi-VN'
      name: 'Linh'
      localService: true
      voiceURI: 'Linh'
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
      lang: 'pt-BR'
      name: 'Luciana (Enhanced)'
      localService: true
      voiceURI: 'Luciana (Enhanced)'
    }
  | {
      browser: 'Chrome'
      lang: 'ar-001'
      name: 'Majed'
      localService: true
      voiceURI: 'Majed'
    }
  | {
      browser: 'Chrome'
      lang: 'hu-HU'
      name: 'Tünde'
      localService: true
      voiceURI: 'Tünde'
    }
  | {
      browser: 'Chrome'
      lang: 'zh-TW'
      name: 'Meijia'
      localService: true
      voiceURI: 'Meijia'
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
      name: 'Mónica'
      localService: true
      voiceURI: 'Mónica'
    }
  | {
      browser: 'Chrome'
      lang: 'ca-ES'
      name: 'Montse'
      localService: true
      voiceURI: 'Montse'
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
      lang: 'en-US'
      name: 'Organ'
      localService: true
      voiceURI: 'Organ'
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
      lang: 'en-US'
      name: 'Superstar'
      localService: true
      voiceURI: 'Superstar'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Ralph'
      localService: true
      voiceURI: 'Ralph'
    }
  | {
      browser: 'Chrome'
      lang: 'pt-BR'
      name: 'Reed (Portuguese (Brazil))'
      localService: true
      voiceURI: 'Reed (Portuguese (Brazil))'
    }
  | {
      browser: 'Chrome'
      lang: 'it-IT'
      name: 'Reed (Italian (Italy))'
      localService: true
      voiceURI: 'Reed (Italian (Italy))'
    }
  | {
      browser: 'Chrome'
      lang: 'de-DE'
      name: 'Reed (German (Germany))'
      localService: true
      voiceURI: 'Reed (German (Germany))'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Reed (English (US))'
      localService: true
      voiceURI: 'Reed (English (US))'
    }
  | {
      browser: 'Chrome'
      lang: 'fr-CA'
      name: 'Reed (French (Canada))'
      localService: true
      voiceURI: 'Reed (French (Canada))'
    }
  | {
      browser: 'Chrome'
      lang: 'es-MX'
      name: 'Reed (Spanish (Mexico))'
      localService: true
      voiceURI: 'Reed (Spanish (Mexico))'
    }
  | {
      browser: 'Chrome'
      lang: 'fi-FI'
      name: 'Reed (Finnish (Finland))'
      localService: true
      voiceURI: 'Reed (Finnish (Finland))'
    }
  | {
      browser: 'Chrome'
      lang: 'en-GB'
      name: 'Reed (English (UK))'
      localService: true
      voiceURI: 'Reed (English (UK))'
    }
  | {
      browser: 'Chrome'
      lang: 'es-ES'
      name: 'Reed (Spanish (Spain))'
      localService: true
      voiceURI: 'Reed (Spanish (Spain))'
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
      lang: 'es-MX'
      name: 'Rocko (Spanish (Mexico))'
      localService: true
      voiceURI: 'Rocko (Spanish (Mexico))'
    }
  | {
      browser: 'Chrome'
      lang: 'fr-FR'
      name: 'Rocko (French (France))'
      localService: true
      voiceURI: 'Rocko (French (France))'
    }
  | {
      browser: 'Chrome'
      lang: 'fr-CA'
      name: 'Rocko (French (Canada))'
      localService: true
      voiceURI: 'Rocko (French (Canada))'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Rocko (English (US))'
      localService: true
      voiceURI: 'Rocko (English (US))'
    }
  | {
      browser: 'Chrome'
      lang: 'en-GB'
      name: 'Rocko (English (UK))'
      localService: true
      voiceURI: 'Rocko (English (UK))'
    }
  | {
      browser: 'Chrome'
      lang: 'pt-BR'
      name: 'Rocko (Portuguese (Brazil))'
      localService: true
      voiceURI: 'Rocko (Portuguese (Brazil))'
    }
  | {
      browser: 'Chrome'
      lang: 'es-ES'
      name: 'Rocko (Spanish (Spain))'
      localService: true
      voiceURI: 'Rocko (Spanish (Spain))'
    }
  | {
      browser: 'Chrome'
      lang: 'de-DE'
      name: 'Rocko (German (Germany))'
      localService: true
      voiceURI: 'Rocko (German (Germany))'
    }
  | {
      browser: 'Chrome'
      lang: 'it-IT'
      name: 'Rocko (Italian (Italy))'
      localService: true
      voiceURI: 'Rocko (Italian (Italy))'
    }
  | {
      browser: 'Chrome'
      lang: 'fi-FI'
      name: 'Rocko (Finnish (Finland))'
      localService: true
      voiceURI: 'Rocko (Finnish (Finland))'
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
      lang: 'de-DE'
      name: 'Sandy (German (Germany))'
      localService: true
      voiceURI: 'Sandy (German (Germany))'
    }
  | {
      browser: 'Chrome'
      lang: 'fr-FR'
      name: 'Sandy (French (France))'
      localService: true
      voiceURI: 'Sandy (French (France))'
    }
  | {
      browser: 'Chrome'
      lang: 'it-IT'
      name: 'Sandy (Italian (Italy))'
      localService: true
      voiceURI: 'Sandy (Italian (Italy))'
    }
  | {
      browser: 'Chrome'
      lang: 'fi-FI'
      name: 'Sandy (Finnish (Finland))'
      localService: true
      voiceURI: 'Sandy (Finnish (Finland))'
    }
  | {
      browser: 'Chrome'
      lang: 'es-MX'
      name: 'Sandy (Spanish (Mexico))'
      localService: true
      voiceURI: 'Sandy (Spanish (Mexico))'
    }
  | {
      browser: 'Chrome'
      lang: 'es-ES'
      name: 'Sandy (Spanish (Spain))'
      localService: true
      voiceURI: 'Sandy (Spanish (Spain))'
    }
  | {
      browser: 'Chrome'
      lang: 'fr-CA'
      name: 'Sandy (French (Canada))'
      localService: true
      voiceURI: 'Sandy (French (Canada))'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Sandy (English (US))'
      localService: true
      voiceURI: 'Sandy (English (US))'
    }
  | {
      browser: 'Chrome'
      lang: 'en-GB'
      name: 'Sandy (English (UK))'
      localService: true
      voiceURI: 'Sandy (English (UK))'
    }
  | {
      browser: 'Chrome'
      lang: 'pt-BR'
      name: 'Sandy (Portuguese (Brazil))'
      localService: true
      voiceURI: 'Sandy (Portuguese (Brazil))'
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
      lang: 'fr-CA'
      name: 'Shelley (French (Canada))'
      localService: true
      voiceURI: 'Shelley (French (Canada))'
    }
  | {
      browser: 'Chrome'
      lang: 'fi-FI'
      name: 'Shelley (Finnish (Finland))'
      localService: true
      voiceURI: 'Shelley (Finnish (Finland))'
    }
  | {
      browser: 'Chrome'
      lang: 'de-DE'
      name: 'Shelley (German (Germany))'
      localService: true
      voiceURI: 'Shelley (German (Germany))'
    }
  | {
      browser: 'Chrome'
      lang: 'pt-BR'
      name: 'Shelley (Portuguese (Brazil))'
      localService: true
      voiceURI: 'Shelley (Portuguese (Brazil))'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Shelley (English (US))'
      localService: true
      voiceURI: 'Shelley (English (US))'
    }
  | {
      browser: 'Chrome'
      lang: 'es-ES'
      name: 'Shelley (Spanish (Spain))'
      localService: true
      voiceURI: 'Shelley (Spanish (Spain))'
    }
  | {
      browser: 'Chrome'
      lang: 'en-GB'
      name: 'Shelley (English (UK))'
      localService: true
      voiceURI: 'Shelley (English (UK))'
    }
  | {
      browser: 'Chrome'
      lang: 'it-IT'
      name: 'Shelley (Italian (Italy))'
      localService: true
      voiceURI: 'Shelley (Italian (Italy))'
    }
  | {
      browser: 'Chrome'
      lang: 'es-MX'
      name: 'Shelley (Spanish (Mexico))'
      localService: true
      voiceURI: 'Shelley (Spanish (Mexico))'
    }
  | {
      browser: 'Chrome'
      lang: 'fr-FR'
      name: 'Shelley (French (France))'
      localService: true
      voiceURI: 'Shelley (French (France))'
    }
  | {
      browser: 'Chrome'
      lang: 'zh-HK'
      name: 'Sinji'
      localService: true
      voiceURI: 'Sinji'
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
      name: 'Tingting'
      localService: true
      voiceURI: 'Tingting'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Trinoids'
      localService: true
      voiceURI: 'Trinoids'
    }
  | {
      browser: 'Chrome'
      lang: 'en-US'
      name: 'Whisper'
      localService: true
      voiceURI: 'Whisper'
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
      lang: 'en-US'
      name: 'Zarvox'
      localService: true
      voiceURI: 'Zarvox'
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
