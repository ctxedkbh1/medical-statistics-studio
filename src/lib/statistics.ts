import jStat from 'jstat'
import type { CalculationResult } from '../types/domain'

export interface Summary {
  n: number
  missing: number
  mean: number
  median: number
  variance: number
  standardDeviation: number
  standardError: number
  q1: number
  q3: number
  iqr: number
  min: number
  max: number
}

export const parseValues = (input: string): number[] => input
  .split(/[\s,，;；\n]+/)
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value))

const quantile = (sorted: number[], probability: number): number => {
  if (sorted.length === 0) return Number.NaN
  const position = (sorted.length - 1) * probability
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return sorted[lower]
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)
}

export const summarize = (values: number[], missing = 0): Summary => {
  if (values.length === 0) throw new Error('至少需要一个有效数值。')
  const sorted = [...values].sort((a, b) => a - b)
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.length > 1
    ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1)
    : 0
  const standardDeviation = Math.sqrt(variance)
  return {
    n: values.length,
    missing,
    mean,
    median: quantile(sorted, 0.5),
    variance,
    standardDeviation,
    standardError: values.length > 0 ? standardDeviation / Math.sqrt(values.length) : Number.NaN,
    q1: quantile(sorted, 0.25),
    q3: quantile(sorted, 0.75),
    iqr: quantile(sorted, 0.75) - quantile(sorted, 0.25),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  }
}

const round = (value: number, digits = 3) => Number(value.toFixed(digits))

const pInterpretation = (pValue: number, effectText: string): string => {
  const pText = pValue < 0.001 ? 'P < 0.001' : `P = ${round(pValue, 3)}`
  return `${pText}。在 α = 0.05 下${pValue < 0.05 ? '，数据与原假设不一致，提示存在统计学证据支持差异' : '，尚不足以拒绝原假设'}。${effectText} 统计学显著不等于临床意义显著。`
}

export const oneSampleT = (values: number[], mu0: number): CalculationResult => {
  const summary = summarize(values)
  if (!Number.isFinite(mu0)) throw new Error('假设总体均数必须是有效数字。')
  if (summary.n < 2 || summary.standardDeviation === 0) throw new Error('单样本 t 检验至少需要 2 个且不能全部相同的观测值。')
  const statistic = (summary.mean - mu0) / summary.standardError
  const df = summary.n - 1
  const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(statistic), df))
  const critical = jStat.studentt.inv(0.975, df)
  const ci: [number, number] = [summary.mean - critical * summary.standardError, summary.mean + critical * summary.standardError]
  return {
    method: '单样本 t 检验', statistic, df, pValue, ci, estimate: summary.mean,
    interpretation: pInterpretation(pValue, `样本均数为 ${round(summary.mean)}，与假设值 ${round(mu0)} 的差值为 ${round(summary.mean - mu0)}。`),
    warnings: ['结果依赖差值近似正态；小样本时应结合散点图或 Q-Q 图判断。'],
  }
}

export const welchT = (groupA: number[], groupB: number[]): CalculationResult => {
  const a = summarize(groupA)
  const b = summarize(groupB)
  if (a.n < 2 || b.n < 2) throw new Error('两组都至少需要 2 个有效观测值。')
  const varianceA = a.variance / a.n
  const varianceB = b.variance / b.n
  const standardError = Math.sqrt(varianceA + varianceB)
  if (standardError === 0) throw new Error('两组数据没有可估计的差异。')
  const statistic = (a.mean - b.mean) / standardError
  const dfNumerator = (varianceA + varianceB) ** 2
  const dfDenominator = (varianceA ** 2) / (a.n - 1) + (varianceB ** 2) / (b.n - 1)
  const df = dfNumerator / dfDenominator
  const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(statistic), df))
  const critical = jStat.studentt.inv(0.975, df)
  const difference = a.mean - b.mean
  const ci: [number, number] = [difference - critical * standardError, difference + critical * standardError]
  const pooledSd = Math.sqrt(((a.n - 1) * a.variance + (b.n - 1) * b.variance) / (a.n + b.n - 2))
  return {
    method: 'Welch 独立样本 t 检验', statistic, df, pValue, ci, estimate: difference,
    effectSize: pooledSd === 0 ? undefined : difference / pooledSd,
    interpretation: pInterpretation(pValue, `两组均数差（A−B）为 ${round(difference)}，95% CI 为 ${round(ci[0])} 至 ${round(ci[1])}。`),
    warnings: ['默认使用 Welch 版本，不强制假设两组方差相等。', '请确认两组受试者彼此独立，且连续结局没有严重偏态。'],
  }
}

export const chiSquare2x2 = (table: [[number, number], [number, number]]): CalculationResult => {
  const total = table.flat().reduce((sum, value) => sum + value, 0)
  if (total <= 0 || table.flat().some((value) => !Number.isInteger(value) || value < 0)) throw new Error('四格表必须由非负整数频数构成。')
  const rowTotals = table.map((row) => row[0] + row[1])
  const columnTotals = [table[0][0] + table[1][0], table[0][1] + table[1][1]]
  if ([...rowTotals, ...columnTotals].some((value) => value === 0)) throw new Error('四格表每一行和每一列都必须至少有一个观测。')
  let statistic = 0
  const expected: number[] = []
  table.forEach((row, rowIndex) => row.forEach((observed, columnIndex) => {
    const value = (rowTotals[rowIndex] * columnTotals[columnIndex]) / total
    expected.push(value)
    statistic += value === 0 ? 0 : (observed - value) ** 2 / value
  }))
  const pValue = 1 - jStat.chisquare.cdf(statistic, 1)
  const warnings = expected.some((value) => value < 5)
    ? ['存在期望频数小于 5 的单元格，建议同时报告 Fisher 精确检验。']
    : []
  return {
    method: '2×2 列联表 χ² 独立性检验', statistic, df: 1, pValue,
    interpretation: pInterpretation(pValue, '该检验评估两个分类变量是否存在统计学关联，不能直接证明因果关系。'),
    warnings,
  }
}

const logFactorial = (n: number): number => {
  let result = 0
  for (let i = 2; i <= n; i += 1) result += Math.log(i)
  return result
}

const logCombination = (n: number, k: number): number => {
  if (k < 0 || k > n) return Number.NEGATIVE_INFINITY
  return logFactorial(n) - logFactorial(k) - logFactorial(n - k)
}

export const fisherExact2x2 = (table: [[number, number], [number, number]]): CalculationResult => {
  if (table.flat().some((value) => !Number.isInteger(value) || value < 0) || table.flat().every((value) => value === 0)) {
    throw new Error('Fisher 检验需要非负整数频数，且总频数必须大于 0。')
  }
  const [a, b] = table[0]
  const [c, d] = table[1]
  const row1 = a + b
  const row2 = c + d
  const col1 = a + c
  const total = row1 + row2
  const minA = Math.max(0, row1 - (total - col1))
  const maxA = Math.min(row1, col1)
  const observedLogP = logCombination(col1, a) + logCombination(total - col1, row1 - a) - logCombination(total, row1)
  let pValue = 0
  for (let candidate = minA; candidate <= maxA; candidate += 1) {
    const logP = logCombination(col1, candidate) + logCombination(total - col1, row1 - candidate) - logCombination(total, row1)
    if (logP <= observedLogP + 1e-12) pValue += Math.exp(logP)
  }
  const oddsRatio = b * c === 0 ? undefined : (a * d) / (b * c)
  return {
    method: 'Fisher 精确检验', pValue: Math.min(1, pValue), effectSize: oddsRatio,
    interpretation: pInterpretation(Math.min(1, pValue), `样本 OR${oddsRatio === undefined ? '' : ` 为 ${round(oddsRatio)}`}，精确检验适合小样本 2×2 表。`),
    warnings: ['OR 描述关联强度，不能直接解释为风险比或因果效应。'],
  }
}
