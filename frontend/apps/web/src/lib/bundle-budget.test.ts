import { describe, expect, it } from 'vitest'
import {
  evaluateBundleBudget,
  initialJavaScriptPaths,
} from '../../scripts/check-bundle-budget'

describe('bundle budget', () => {
  it('discovers entry and module-preloaded JavaScript without duplicates', () => {
    const html = `
      <script type="module" src="/assets/entry.js"></script>
      <link rel="modulepreload" href="/assets/shared.js">
      <link rel="modulepreload" href="/assets/shared.js">
      <link rel="stylesheet" href="/assets/styles.css">
    `

    expect(initialJavaScriptPaths(html)).toEqual([
      'assets/entry.js',
      'assets/shared.js',
    ])
  })

  it('passes within the warning threshold', () => {
    expect(evaluateBundleBudget(1_000_000).status).toBe('ok')
  })

  it('warns between the warning and failure thresholds', () => {
    expect(evaluateBundleBudget(1_000_001).status).toBe('warning')
  })

  it('fails above the failure threshold', () => {
    expect(evaluateBundleBudget(1_250_001).status).toBe('error')
  })
})
