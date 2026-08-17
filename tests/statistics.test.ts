import { describe, expect, it } from 'vitest'
import { chiSquare2x2, fisherExact2x2, oneSampleT, parseValues, summarize, welchT } from '../src/lib/statistics'

describe('descriptive statistics', () => {
  it('parses common Chinese and western separators', () => {
    expect(parseValues('1, 2，3;4；5\n6')).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('uses sample variance and type-7 quartiles', () => {
    const result = summarize([1, 2, 3, 4, 5])
    expect(result).toMatchObject({ n: 5, mean: 3, median: 3, variance: 2.5, q1: 2, q3: 4, iqr: 2 })
    expect(result.standardDeviation).toBeCloseTo(Math.sqrt(2.5), 12)
  })

  it('rejects an empty dataset', () => {
    expect(() => summarize([])).toThrow('至少需要一个有效数值')
  })
})

describe('t tests', () => {
  const groupA = [132, 128, 140, 136, 125, 131, 129, 138]
  const groupB = [145, 139, 142, 151, 136, 147, 143, 140]

  it('matches a frozen Welch reference result', () => {
    const result = welchT(groupA, groupB)
    expect(result.statistic).toBeCloseTo(-4.2075201493, 9)
    expect(result.df).toBeCloseTo(13.8902498775, 9)
    expect(result.pValue).toBeCloseTo(0.0008921097, 9)
    expect(result.estimate).toBe(-10.5)
  })

  it('returns a two-sided one-sample result and confidence interval', () => {
    const result = oneSampleT(groupA, 130)
    expect(result.method).toBe('单样本 t 检验')
    expect(result.df).toBe(7)
    expect(result.statistic).toBeCloseTo(1.2898040433, 8)
    expect(result.ci?.[0]).toBeLessThan(130)
    expect(result.ci?.[1]).toBeGreaterThan(130)
  })

  it('rejects invalid t-test inputs', () => {
    expect(() => oneSampleT([1], 0)).toThrow('至少需要 2 个')
    expect(() => oneSampleT([1, 2], Number.NaN)).toThrow('必须是有效数字')
    expect(() => welchT([1], [2, 3])).toThrow('两组都至少需要 2 个')
  })
})

describe('2x2 categorical tests', () => {
  it('matches a frozen Pearson chi-square reference result', () => {
    const result = chiSquare2x2([[32, 18], [20, 30]])
    expect(result.statistic).toBeCloseTo(5.7692307692, 9)
    expect(result.pValue).toBeCloseTo(0.0163091719, 9)
    expect(result.warnings).toHaveLength(0)
  })

  it('warns when expected counts are small', () => {
    const result = chiSquare2x2([[1, 3], [2, 10]])
    expect(result.warnings[0]).toContain('期望频数小于 5')
  })

  it('matches a known two-sided Fisher exact example', () => {
    const result = fisherExact2x2([[1, 9], [11, 3]])
    expect(result.pValue).toBeCloseTo(0.0027594562, 8)
  })

  it('rejects impossible contingency tables', () => {
    expect(() => chiSquare2x2([[0, 0], [1, 2]])).toThrow('每一行和每一列')
    expect(() => fisherExact2x2([[-1, 2], [3, 4]])).toThrow('非负整数频数')
  })
})
