// @ts-nocheck
const perfectionistNatural = require('eslint-plugin-perfectionist/configs/recommended-natural')
const unicorn = require('eslint-plugin-unicorn')
const eslint = require("@eslint/js")
const globals = require('globals')
const vue = require('eslint-plugin-vue')

/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = [
  // eslint
  {
    ignores: ['node_modules/*', 'coverage/*', 'build/*', 'dist/*', 'static/*'],
  },
  eslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'comma-dangle': ['error', 'always-multiline'], // love trailing commas
    },
  },
  // perfectionist
  perfectionistNatural,
  {
    rules: {
      'perfectionist/sort-imports': 'off', // not needed, vscode & biome does this
    },
  },
  // unicorn
  unicorn.configs['flat/all'],
  {
    rules: {
      'unicorn/prefer-module': 'off', // we use require
      'unicorn/prefer-string-replace-all': 'off', // not well supported
    },
  },
  // vue
  ...vue.configs['flat/recommended'],
  {
    rules: {
      'vue/attributes-order': 'off', // styling, perfectionist does this
      'vue/first-attribute-linebreak': 'off', // styling
      'vue/html-closing-bracket-newline': 'off', // styling
      'vue/html-indent': 'off', // styling
      'vue/max-attributes-per-line': 'off', // styling
    },
  },
]
