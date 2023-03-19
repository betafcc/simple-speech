## Voice selection typing

Gotta document that the list is filled 'by hand' and may not coincide with the user's browser.

Gotta do better typing so it doesn't forbid random strings (see type-fest, they have a branded string type or smt that keeps intellisense for options provided, but allows arbitrary strings anyway)

## Misc notes to reorginize

If you run `speechSynthesis.getVoices()` on a script, it will return empty the first time, you have to wait a bit so it returns the actual list.

Therefore, our `synthesis.getVoices()` returns a Promise, that will guarantee the list is actually loaded
