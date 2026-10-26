import { readdir, readFile } from 'node:fs/promises'
import { dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@babel/parser'

const WEB_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_ROOT = resolve(WEB_ROOT, 'src')
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx'])
const SHARED_LAYERS = new Set(['components', 'layouts', 'lib'])

export interface BoundaryViolation {
  column: number
  file: string
  line: number
  message: string
}

interface ModuleSpecifier {
  column: number
  line: number
  value: string
}

export function boundaryViolationMessage(
  sourceFile: string,
  importSpecifier: string,
): string | null {
  const sourceParts = sourceRelativePath(sourceFile).split('/')
  const targetParts = targetRelativePath(sourceFile, importSpecifier)?.split(
    '/',
  )

  if (!targetParts || targetParts[0] !== 'features') return null

  const targetFeature = targetParts[1]
  if (!targetFeature) return null

  if (SHARED_LAYERS.has(sourceParts[0] ?? '')) {
    return `shared layer "${sourceParts[0]}" cannot import feature "${targetFeature}"`
  }

  if (sourceParts[0] === 'features') {
    const sourceFeature = sourceParts[1]
    if (sourceFeature && sourceFeature !== targetFeature) {
      return `feature "${sourceFeature}" cannot import feature "${targetFeature}"`
    }
  }

  return null
}

export async function findBoundaryViolations(
  root = SRC_ROOT,
): Promise<BoundaryViolation[]> {
  const files = await sourceFiles(root)
  return (await Promise.all(files.map(violationsForFile))).flat()
}

async function violationsForFile(file: string): Promise<BoundaryViolation[]> {
  const source = await readFile(file, 'utf8')
  const ast = parse(source, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  })

  return moduleSpecifiers(ast).flatMap((specifier) => {
    const message = boundaryViolationMessage(file, specifier.value)
    return message
      ? [
          {
            file: sourceRelativePath(file),
            line: specifier.line,
            column: specifier.column,
            message,
          },
        ]
      : []
  })
}

function moduleSpecifiers(value: unknown): ModuleSpecifier[] {
  const specifiers: ModuleSpecifier[] = []

  function visit(node: unknown): void {
    if (Array.isArray(node)) {
      for (const child of node) visit(child)
      return
    }
    if (!isRecord(node)) return

    const isStaticModuleDeclaration =
      node.type === 'ImportDeclaration' ||
      node.type === 'ExportNamedDeclaration' ||
      node.type === 'ExportAllDeclaration'
    const source = isStaticModuleDeclaration
      ? node.source
      : node.type === 'ImportExpression'
        ? node.source
        : null

    if (isStringLiteral(source)) {
      specifiers.push({
        value: source.value,
        line: source.loc.start.line,
        column: source.loc.start.column + 1,
      })
    }

    for (const [key, child] of Object.entries(node)) {
      if (key !== 'loc' && key !== 'start' && key !== 'end') visit(child)
    }
  }

  visit(value)
  return specifiers
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringLiteral(value: unknown): value is {
  value: string
  loc: { start: { line: number; column: number } }
} {
  if (!isRecord(value) || typeof value.value !== 'string') return false
  if (!isRecord(value.loc) || !isRecord(value.loc.start)) return false

  return (
    typeof value.loc.start.line === 'number' &&
    typeof value.loc.start.column === 'number'
  )
}

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name)
      if (entry.isDirectory()) return sourceFiles(path)
      return SOURCE_EXTENSIONS.has(extname(entry.name)) ? [path] : []
    }),
  )

  return nestedFiles.flat()
}

function sourceRelativePath(file: string): string {
  return relative(SRC_ROOT, resolve(file)).replaceAll('\\', '/')
}

function targetRelativePath(
  sourceFile: string,
  importSpecifier: string,
): string | null {
  if (importSpecifier.startsWith('#/')) return importSpecifier.slice(2)
  if (!importSpecifier.startsWith('.')) return null

  return sourceRelativePath(resolve(dirname(sourceFile), importSpecifier))
}

async function main(): Promise<void> {
  const violations = await findBoundaryViolations()
  if (violations.length === 0) return

  for (const violation of violations) {
    console.error(
      `${violation.file}:${violation.line}:${violation.column} ${violation.message}`,
    )
  }

  process.exitCode = 1
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) await main()
