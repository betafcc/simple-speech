# simple-speech

Sane API for web speech


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
