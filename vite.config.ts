import { createConfig } from '@dtw/builder';

export default createConfig({
  path: './src/**/*.ts',
  relativeTo: 'src',
  formats: ['cjs'],
});
