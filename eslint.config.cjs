const shuunen = require('eslint-plugin-shuunen')

/** @type {import('eslint').Linter.Config} */
module.exports = [
  ...shuunen.configs.base,
  ...shuunen.configs.browser,
  ...shuunen.configs.node,
  ...shuunen.configs.vue,
]
