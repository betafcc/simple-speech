import { recognition, synthesis } from '../src'

const root = document.createElement('div')

document.body.prepend(root)

export const x = [recognition]
console.log('hello', { recognition, synthesis })
synthesis.speak('hello world')
