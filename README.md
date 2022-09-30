# Flood-it

[![GitHub license](https://img.shields.io/github/license/shuunen/flood-it.svg?color=informational)](https://github.com/Shuunen/flood-it/blob/master/LICENSE)

[![Website Up](https://img.shields.io/website/https/flood-it.netlify.app.svg)](https://flood-it.netlify.app)
[![LGTM Grade](https://img.shields.io/lgtm/grade/javascript/github/Shuunen/flood-it.svg)](https://lgtm.com/projects/g/Shuunen/flood-it)

> Flood-it, a game for liquid snakes.

## Type Support For `.vue` Imports in TS

Since TypeScript cannot handle type information for `.vue` imports, they are shimmed to be a generic Vue component type by default. In most cases this is fine if you don't really care about component prop types outside of templates. However, if you wish to get actual prop types in `.vue` imports (for example to get props validation when using manual `h(...)` calls), you can enable Volar's Take Over mode by following these steps:

1. Run `Extensions: Show Built-in Extensions` from VS Code's command palette, look for `TypeScript and JavaScript Language Features`, then right click and select `Disable (Workspace)`. By default, Take Over mode will enable itself if the default TypeScript extension is disabled.
2. Reload the VS Code window by running `Developer: Reload Window` from the command palette.

You can learn more about Take Over mode [here](https://github.com/johnsoncodehk/volar/discussions/471).

## Thanks

- [Eslint](https://eslint.org) : super tool to find & fix problems
- [Github](https://github.com) : for all their great work year after year, pushing OSS forward
- [Netlify](https://netlify.com) : awesome company that offers free CI & hosting for OSS projects
- [Repo-checker](https://github.com/Shuunen/repo-checker) : eslint cover /src code and this tool the rest ^^
- [Shields.io](https://shields.io) : for the nice badges on top of this readme
- [Shuutils](https://github.com/Shuunen/shuutils) : collection of pure JS utils
- [Vite](https://github.com/vitejs/vite) : super fast frontend tooling
- [Vue](https://vuejs.org) : when I need a front framework, this is the one I choose <3
