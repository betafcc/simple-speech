import { recognition, synthesis } from '../src'

const $form = document.createElement('form')
const $text = Object.assign(document.createElement('input'), { type: 'text' })
const $submit = Object.assign(document.createElement('input'), { type: 'submit' })
const $langSelect = document.createElement('select')
const $nameSelect = document.createElement('select')

document.querySelector('body')!.appendChild($form)
$form.replaceChildren($text, $submit, document.createElement('br'), $langSelect, $nameSelect)

$form.onsubmit = e => {
  e.preventDefault()
  synthesis.speak($text.value, { lang: $langSelect.value as any, name: $nameSelect.value as any })
}

synthesis.getVoices().then(voices => {
  const langs = [...new Set([...voices].map(voice => voice.lang))].sort()
  $langSelect.replaceChildren(
    ...langs.map(lang =>
      Object.assign(document.createElement('option'), { value: lang, innerText: lang })
    )
  )

  $langSelect.onchange = () =>
    $nameSelect.replaceChildren(
      ...voices
        .filter(voice => voice.lang === $langSelect.value)
        .map(voice =>
          Object.assign(document.createElement('option'), {
            value: voice.name,
            innerText: voice.name,
          })
        )
    )

  $langSelect.onchange({} as any)
})
