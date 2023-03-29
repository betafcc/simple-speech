# simple-speech

Sane API for web speech

## Install

```sh
npm install --save simple-speech
```

## Usage
---

**Important**: You _need_ user action to init the underlying browser APIs

For security reasons, most browsers lock it to work only after 'user-gesture', meaning nothing will work if you call library functions in top-level, it needs to be in an event handler:

```ts
// you need an user action in order for the browser to allow listening
const startButton = document.querySelector('#start')
```

### Robot speaks 'Hello World':

```ts
import { synthesis } from 'simple-speech'

startButton.addEventListener('click', () =>
  synthesis.speak('Hello World')
)
```

### Log what is said in your mic:

```ts
import { recognition } from 'simple-speech'

startButton.addEventListener('click', () =>
  recognition
    .listen()
    .then(msg => console.log(`You said: ${msg}`))
)
```


### Repeats what you say with robot voice:

```ts
const listenAndRepeat = () =>
  recognition
    .listen()
    .then(synthesis.speak)
    .then(listenAndRepeat)

startButton.addEventListener('click', listenAndRepeat)
```


## Modules

### Synthesis

```ts
import { synthesis } from 'simple-speech'

const onClick = () => synthesis.speak('Hello World')

// Need to start from user action
$button.addEventListener('click', onClick)
```


Selecting voices with some kind of IDE support was an early motivation for this package. Currently, it provides intellisense support for narrowing down the voice choice, eg:

![./voices.gif](https://github.com/betafcc/simple-speech/blob/main/voices.gif?raw=true)

On the first `use` call, I narrow the voices choices for only the ones that matches `lang: 'fr-FR'`, so on the next `use` call, the type system has the info to narrow down the `name` options that are available for that language only.

You can set both fields in one go, but intellisense won't be able to narrow down:

```ts
const jacques = synthesis.use({
  lang: 'fr-FR',
  name: 'Jacques'
})
```

Other options available:

```ts
synthesis.use({
  volume: 0.8, // 0 to 1
  rate: 2, // 0.1 to 10
  pitch: 1.5, // 0 to 2

  // optionally, you can preload the text to be spoken
  // when calling `.speak()` with no arguments
  text: 'Hello, world!',
})
```

### Recognition

```ts
import { recognition } from 'simple-speech'

const onClick = () => recognition.listen().then(console.log)

// Need to start from user action
$button.addEventListener('click', onClick)
// Say 'Hello World' after clicking the button and the console will log it
```

It also has an observable API. It emits more intuitive events than the underlying browser API:

```ts
const sub = recognition.use({ interimResults: true, maxAlternatives: 3 }).subscribe({ next: console.log })
// { tag: 'start', ... }
// { tag: 'audiostart', ... }
// { tag: 'soundstart', ... }
// { tag: 'speechstart', ... }
// { tag: 'interim', alternatives: [{ transcript: 'hello', confidence: 0.8999999761581421 }] }
// { tag: 'interim', alternatives: [{ transcript: 'world', confidence: 0.8763247828138491 }] }
// { tag: 'final', alternatives: [
//     { transcript: 'hello world', confidence: 0.8698675632476807 }
//     { transcript: 'hello wards', confidence: 0 }
//     { transcript: 'hello Ward', confidence: 0 }
// ] }

sub.unsubscribe() // Stop listening if not over already and cleans up
```

It's compatible with rxjs and similar libs:

```ts
import * as rx from 'rxjs'
import { recognition } from 'simple-speech'

const result$ = rx.from(recognition)
  .pipe(
    rx.filter(e => e.tag === 'interim' || e.tag === 'final'),
    rx.tap(e =>
      e.tag === 'interim' ? setInterim(e.value) :
      e.tag === 'final' ? setFinal(e.value) :
      null
    )
  )

$button.addEventListener('click', () => result$.subscribe())
```

Options available:

```ts
recognition.use({
  // language to recognize, check intellisense
  // autocomplete for all options
  lang: 'en-US',

  // If should emit interim results as well (only makes sense when using observable API)
  interimResults: true,

  // how many alternatives to present on the recognition
  maxAlternatives: 3,

  // uses the underlying 'continuous mode', meaning it will keep
  // emiting transcriptions instead of endind on the first 'final' result
  // (see below)
  continuous: false,
})
```

### Continuous transcription recipe

The underlying API has a 'continous mode' but it doesn't seem to work that well for me,
instead, with the Observable API you can use this:

```ts
import { recognition } from 'simple-speech'
import * as rx from 'rxjs'

const transcription$ = rx.from(
  recognition.use({
    interimResults: true,
    maxAlternatives: 1,
    continuous: false,
  })
).pipe(rx.repeat())
```
