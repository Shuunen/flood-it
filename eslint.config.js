import { base } from 'eslint-plugin-shuunen/configs/base'
import { browser } from 'eslint-plugin-shuunen/configs/browser'
import { node } from 'eslint-plugin-shuunen/configs/node'
import { vue } from 'eslint-plugin-shuunen/configs/vue'

export default [
  ...base,
  ...browser,
  ...node,
  ...vue,
]
