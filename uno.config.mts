import { defineConfig, presetAttributify, presetIcons, presetUno, transformerDirectives } from 'unocss'

export default defineConfig({
  shortcuts: {
    'border-base': 'border-gray:30',
    'bg-active': 'bg-gray:10',
    'text-faded': 'text-gray',
    'text-primary': 'text-orange:500',
  },
  presets: [
    presetUno({
      dark: {
        dark: '.vscode-dark',
        light: '.vscode-light',
      },
    }),
    presetIcons(),
    presetAttributify(),
  ],
  transformers: [
    transformerDirectives(),
  ],
  theme: {
    fontFamily: {
      mono: 'Consola,ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
    },
  },
  content: {
    pipeline: {
      include: ['src/**'],
    },
  },
})
