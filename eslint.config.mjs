import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Uploads are already cropped and downscaled to WebP in the browser
      // (lib/images/cropImageToSquareWebp.ts) and served from R2's CDN, so
      // next/image would only add remotePatterns config and a paid optimizer
      // hop for no real gain.
      '@next/next/no-img-element': 'off',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'supabase/**'],
  },
];

export default eslintConfig;
