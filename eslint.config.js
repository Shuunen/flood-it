import shuunen from 'eslint-plugin-shuunen'

export default [
  ...shuunen.configs.base,
  ...shuunen.configs.browser,
  ...shuunen.configs.node,
  ...shuunen.configs.vue,
]
