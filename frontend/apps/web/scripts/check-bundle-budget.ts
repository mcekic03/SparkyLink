import { readFile, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const INITIAL_JS_WARNING_BYTES = 1_000_000
export const INITIAL_JS_ERROR_BYTES = 1_250_000

export type BundleBudgetStatus = 'ok' | 'warning' | 'error'

export interface BundleBudgetResult {
  bytes: number
  errorBytes: number
  status: BundleBudgetStatus
  warningBytes: number
}

export function evaluateBundleBudget(
  bytes: number,
  warningBytes = INITIAL_JS_WARNING_BYTES,
  errorBytes = INITIAL_JS_ERROR_BYTES,
): BundleBudgetResult {
  const status =
    bytes > errorBytes ? 'error' : bytes > warningBytes ? 'warning' : 'ok'
  return { bytes, warningBytes, errorBytes, status }
}

export function initialJavaScriptPaths(html: string): string[] {
  const paths = new Set<string>()
  const tags = html.match(/<(?:script|link)\b[^>]*>/giu) ?? []

  for (const tag of tags) {
    const isModuleScript =
      /^<script\b/iu.test(tag) && attribute(tag, 'type') === 'module'
    const isModulePreload =
      /^<link\b/iu.test(tag) &&
      (attribute(tag, 'rel')?.split(/\s+/u).includes('modulepreload') ?? false)
    if (!isModuleScript && !isModulePreload) continue

    const reference = attribute(tag, isModuleScript ? 'src' : 'href')
    if (!reference) continue

    const url = new URL(reference, 'https://bundle-budget.invalid/')
    if (url.origin !== 'https://bundle-budget.invalid') {
      throw new Error(
        `Cannot measure external initial JavaScript: ${reference}`,
      )
    }

    const path = decodeURIComponent(url.pathname).replace(/^\/+/, '')
    if (path.endsWith('.js')) paths.add(path)
  }

  return [...paths]
}

export async function measureInitialJavaScript(
  distRoot: string,
): Promise<{ bytes: number; files: string[] }> {
  const html = await readFile(resolve(distRoot, 'index.html'), 'utf8')
  const files = initialJavaScriptPaths(html)
  if (files.length === 0) {
    throw new Error('No initial JavaScript found in dist/index.html')
  }

  const sizes = await Promise.all(
    files.map(async (file) => (await stat(resolve(distRoot, file))).size),
  )
  return { files, bytes: sizes.reduce((total, size) => total + size, 0) }
}

function attribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'iu'))
  return match?.[1] ?? null
}

function kilobytes(bytes: number): string {
  return `${(bytes / 1_000).toFixed(1)} kB`
}

async function main(): Promise<void> {
  const distRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')
  const measurement = await measureInitialJavaScript(distRoot)
  const result = evaluateBundleBudget(measurement.bytes)
  const summary = [
    `Initial JavaScript: ${kilobytes(result.bytes)} across ${measurement.files.length} files.`,
    `Warning: ${kilobytes(result.warningBytes)}.`,
    `Limit: ${kilobytes(result.errorBytes)}.`,
  ].join(' ')

  if (result.status === 'error') {
    console.error(`Bundle budget exceeded. ${summary}`)
    process.exitCode = 1
  } else if (result.status === 'warning') {
    console.warn(`Bundle budget warning. ${summary}`)
  } else {
    console.log(`Bundle budget passed. ${summary}`)
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) await main()
