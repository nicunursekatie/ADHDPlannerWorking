import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname } from 'node:path';
import ts from 'typescript';

const extensions = new Set(['.ts', '.tsx']);

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.endsWith('.ts') || specifier.endsWith('.tsx')) {
    const resolution = await defaultResolve(specifier, context, defaultResolve);
    return resolution;
  }

  if (specifier.endsWith('.js')) {
    try {
      const tsPath = specifier.replace(/\.js$/u, '.ts');
      return await defaultResolve(tsPath, context, defaultResolve);
    } catch {
      // fall back to default resolution when .ts version does not exist
    }
  }

  if (specifier.startsWith('.') && !extname(specifier)) {
    try {
      return await defaultResolve(`${specifier}.ts`, context, defaultResolve);
    } catch {
      // allow default resolver to handle other fallbacks (e.g. index files)
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(url, context, defaultLoad) {
  if (url.startsWith('file:')) {
    const filename = fileURLToPath(url);
    const extension = filename.slice(filename.lastIndexOf('.'));

    if (extensions.has(extension)) {
      const source = await readFile(filename, 'utf8');
      const transpiled = ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
          sourceMap: false
        },
        fileName: filename
      });

      return {
        format: 'module',
        source: transpiled.outputText,
        shortCircuit: true
      };
    }
  }

  return defaultLoad(url, context, defaultLoad);
}
