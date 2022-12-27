# simple-speech


- `recognition.listen()`
- `synthesis.speak('hello')`

- synthesis.getVoices is a promise

If you run `speechSynthesis.getVoices()` on a script, it will return empty the first time, you have to wait a bit so it returns the actual list.

Therefore, our `synthesis.getVoices()` returns a Promise, that will guarantee the list is actually loaded