import swc from 'rollup-plugin-swc3';
import ts from '@rollup/plugin-typescript';
import { globSync } from 'tinyglobby';
import { defineConfig, type AliasOptions, type LibraryFormats, type Plugin } from 'vite';
import { relative, extname, join } from 'path';
import { name } from '../package.json';
import { builtinModules } from 'module';
import tsconfigPaths from 'vite-tsconfig-paths'

export const defaultExternal = builtinModules;

const external = [
  '@rollup/plugin-typescript',
  'path',
  'rollup-plugin-swc3',
  'tinyglobby',
  'url',
  'vite',
];

const outDir = './dist';

const defaultFormats: LibraryFormats[] = ['es'];

interface Options {
  path: string
  relativeTo: string
  external?: string[]
  formats?: LibraryFormats[]
  alias?: AliasOptions
  skipDeclarations?: boolean
  enableLogs?: boolean
}

const cwd = process.cwd();

export const createConfig = (options: Options) => {
  const {
    path,
    relativeTo,
    external: ext = [],
    formats = defaultFormats,
    alias = {},
    skipDeclarations = false,
    enableLogs = false,
  } = options;

  const external = [
    ...defaultExternal,
    ...ext,
  ]

  if (enableLogs) {
    console.log(`Creating config:`, {
      ...options,
      external,
    });
  }

  return defineConfig({
    build: {
      lib: {
        name,
        formats,
        entry: Object.fromEntries(
          // path like './src/**/*.ts'
          globSync(join(cwd, path)).map((file) => {
            const sliced = file.slice(0, file.length - extname(file).length);
            const rel = relative(relativeTo, sliced);
            const path = join(cwd, file)

            if (enableLogs) {
              console.log(`Building file:`, { file, sliced, rel, path });
            }

            return [
              // This remove `src/` as well as the file extension from each
              // file, so e.g. src/nested/foo.js becomes nested/foo
              rel,
              // This expands the relative paths to absolute paths, so e.g.
              // src/nested/foo becomes /project/src/nested/foo.js
              path,
            ];
          }),
        ),
      },
      outDir,
      rollupOptions: {
        external,
      },
    },
    plugins: [
      swc() as Plugin,
      tsconfigPaths(),
      ...(
        skipDeclarations ?
          [] :
          [
            ts({
              cacheDir: '.rollup.tscache',
              declaration: true,
              declarationMap: true,
              emitDeclarationOnly: true,
              outputToFilesystem: true,
              composite: false,
            }) as Plugin,
          ]
      ),
    ],
    resolve: {
      preserveSymlinks: true,
      alias
    }
  })};

export default createConfig({ path: './src/index.ts', relativeTo: './src', external });
