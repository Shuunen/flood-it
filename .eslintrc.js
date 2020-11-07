const rules = require('./.eslintrc.rules')

module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/recommended',
    '@vue/standard',
  ],
  rules,
  parserOptions: {
    ecmaVersion: 2020,
  },
  plugins: [
    'html',
  ],
}
