import { render } from 'preact'
import { App } from './app.tsx'
// eslint-disable-next-line no-unassigned-import
import './index.css'

const element = document.querySelector('#app')
if (!element) throw new Error('No #app element found in the document')

render(<App />, element)
