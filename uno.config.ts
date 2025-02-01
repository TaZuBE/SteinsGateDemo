import { defineConfig } from 'unocss'
import { presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
  ],
  rules: [
    ['full', { width: '100%', height: '100%' }],
    ['shake', { animation: 'shake 0.5s' }],
    ['flex-center', { display: 'flex', 'justify-content': 'center', 'align-items': 'center' }],
  ],
})