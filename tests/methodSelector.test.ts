import { describe, expect, it } from 'vitest'
import { initialAnswers, recommendMethod } from '../src/lib/methodSelector'

describe('method selector', () => {
  it('recommends Welch t for independent approximately normal groups', () => {
    const result = recommendMethod(initialAnswers)
    expect(result.name).toContain('Welch')
    expect(result.conditions).toContain('两组观测相互独立')
  })

  it('switches paired skewed data to Wilcoxon', () => {
    const result = recommendMethod({ ...initialAnswers, design: 'paired', distribution: 'skewed' })
    expect(result.name).toBe('Wilcoxon 符号秩检验')
  })

  it('uses Fisher for small expected categorical tables', () => {
    const result = recommendMethod({ ...initialAnswers, outcome: 'binary', smallExpected: true })
    expect(result.name).toBe('Fisher 精确检验')
  })

  it('does not claim a causal conclusion', () => {
    const result = recommendMethod({ ...initialAnswers, outcome: 'categorical' })
    expect(result.caution).toContain('不能说明')
  })
})
