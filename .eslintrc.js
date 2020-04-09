const rules = require('./.eslintrc.rules')

module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/recommended',
    '@vue/standard',
  ],
  rules,
  parserOptions: {
    ecmaVersion: 2020,
  },
}
