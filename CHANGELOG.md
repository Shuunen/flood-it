# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Added

- Add a description and a theme color to the page

### Changed

- Enable the oxlint promise plugin
- Use oxlint directives in place of the eslint ones, and stop recommending the eslint extension
- Stop reporting the compressed size of the files at build time

## [2.0.1] - 2026-11-13

### Changed

- Ignore the `*.tsbuildinfo` files in git
- Move `@tailwindcss/vite` to the dev dependencies
- Add a `VERSION` file
- Run the CI check through the `check` script
- Silence the test output with the dot reporter
