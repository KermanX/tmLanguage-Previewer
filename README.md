# tmLanguage Previewer

[![Reactive VSCode](https://img.shields.io/badge/Reactive-VSCode-%23007ACC?style=flat&labelColor=%23229863)](https://kermanx.github.io/reactive-vscode/)

A VS Code extension for previewing tmLanguage grammar files. Created with [Reactive VS Code](https://kermanx.github.io/reactive-vscode).

There is also a online version: [tmLanguage Playground](https://kermanx.github.io/tmLanguage-Playground/).

## Usage

1. Open a `.tmLanguage.json` file in VSCode. For example, `xyz.tmLanguage.json`.
2. Create a new file with the same name but with a `.example` infix. For example, `xyz.example.any`.
2. Click the icon on the top right of the editor to open the previewer.

## Development

### What's in the folder

- `package.json` - this is the manifest file in which you declare your extension and command.
- `src/*` - this is the folder containing the webview code. (DOM environment)
- `extension/*` - this is the folder containing the extension code. (Node.js environment)

### Get up and running straight away

- Run `pnpm install` to install all necessary dependencies.
- Run `pnpm dev` in a terminal to compile the extension.
- Press `F5` to open a new window with your extension loaded.

### Make changes

- You can relaunch the extension from the debug toolbar after changing code in `src/extension.ts`.
- You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load your changes.
