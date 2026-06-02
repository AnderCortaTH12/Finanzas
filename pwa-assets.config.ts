import {
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config';

/**
 * Genera iconos PWA, apple-touch-icon, maskable y splash screens de iOS a
 * partir de public/logo.svg. Ejecuta: npm run generate-pwa-assets
 */
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: minimal2023Preset,
  images: ['public/logo.svg'],
});
