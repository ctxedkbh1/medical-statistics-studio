export type OutcomeType = 'continuous' | 'categorical' | 'binary' | 'time-to-event'
export type DesignType = 'independent' | 'paired'
export type DistributionType = 'approximately-normal' | 'skewed' | 'unknown'

export interface SelectorAnswers {
  purpose: 'compare' | 'association' | 'diagnosis'
  outcome: OutcomeType
  groups: 1 | 2 | 3
  design: DesignType
  distribution: DistributionType
  smallExpected: boolean
}

export interface MethodRecommendation {
  name: string
  shortName: string
  why: string
  conditions: string[]
  alternative: string
  paperWording: string
  caution: string
}

export const initialAnswers: SelectorAnswers = {
  purpose: 'compare', outcome: 'continuous', groups: 2, design: 'independent', distribution: 'approximately-normal', smallExpected: false,
}

export const recommendMethod = (answers: SelectorAnswers): MethodRecommendation => {
  if (answers.purpose === 'diagnosis') {
    return {
      name: '诊断试验分析（灵敏度、特异度、ROC/AUC）', shortName: '诊断试验分析',
      why: '你的研究目的是真实疾病状态与检测结果之间的诊断效能，而不是比较两组均数。',
      conditions: ['需要明确参考标准（金标准）', '检测结果和疾病状态都要定义清楚', 'ROC 分析要求有连续或有序检测指标'],
      alternative: '如果结局是二分类且需要调整混杂因素，考虑 Logistic 回归。',
      paperWording: '报告灵敏度、特异度、预测值及其 95% CI；连续指标同时报告 ROC 曲线下面积。',
      caution: '预测值受患病率影响，不能脱离研究人群外推。',
    }
  }
  if (answers.outcome === 'categorical' || answers.outcome === 'binary') {
    if (answers.smallExpected && answers.groups === 2) {
      return {
        name: 'Fisher 精确检验', shortName: 'Fisher',
        why: '结局是分类变量、只有两个独立组，并且期望频数较小。Fisher 检验不依赖大样本 χ² 近似。',
        conditions: ['2×2 列联表', '频数是非负整数', '两组观测相互独立'],
        alternative: '期望频数充分时可使用 Pearson χ² 检验；需要调整混杂时考虑 Logistic 回归。',
        paperWording: '采用 Fisher 精确检验比较两组分类结局，报告 P 值，并结合 OR 和 95% CI 描述关联强度。',
        caution: '关联不等于因果，OR 也不是所有场景下的风险比。',
      }
    }
    return {
      name: 'Pearson χ² 独立性检验', shortName: 'χ² 检验',
      why: '结局是分类变量，研究问题是比较不同组的构成或判断两个分类变量是否有关联。',
      conditions: ['频数数据而不是百分比', '观测相互独立', '大多数期望频数不小于 5'],
      alternative: '小样本 2×2 表使用 Fisher；有序分类结局可考虑趋势检验或有序 Logistic 回归。',
      paperWording: '采用 Pearson χ² 检验比较组间构成比，报告 χ²、自由度和 P 值。',
      caution: 'χ² 检验不能说明关联的方向和临床重要性，应补充效应量和 CI。',
    }
  }
  if (answers.groups === 1) {
    return {
      name: '单样本 t 检验', shortName: '单样本 t',
      why: '只有一个样本，需要比较其均数与一个有临床意义的参考值。',
      conditions: ['连续结局', '观测相互独立', '样本分布近似正态或样本量足够大'],
      alternative: '明显偏态或样本很小时，可考虑 Wilcoxon 符号秩检验或报告中位数和 CI。',
      paperWording: '报告样本均数、参考值差异、95% CI、t 值、自由度和 P 值。',
      caution: '参考值必须在研究开始前有明确的临床或规范依据。',
    }
  }
  if (answers.groups === 2 && answers.design === 'paired') {
    return {
      name: answers.distribution === 'approximately-normal' ? '配对 t 检验' : 'Wilcoxon 符号秩检验',
      shortName: answers.distribution === 'approximately-normal' ? '配对 t' : 'Wilcoxon',
      why: '每个受试者贡献一对相关观测，分析重点是每个人的前后差值。',
      conditions: ['配对关系真实存在', '差值相互独立', answers.distribution === 'approximately-normal' ? '差值近似正态' : '差值明显偏离正态'],
      alternative: answers.distribution === 'approximately-normal' ? '差值明显偏态时使用 Wilcoxon 符号秩检验。' : '如果差值近似正态，可使用配对 t 检验。',
      paperWording: '报告配对差值的均数（或中位数）、95% CI、检验统计量和 P 值。',
      caution: '前后测量的时间点和测量方法需要预先定义。',
    }
  }
  if (answers.groups === 2) {
    return {
      name: answers.distribution === 'approximately-normal' ? 'Welch 独立样本 t 检验' : 'Mann–Whitney U 检验',
      shortName: answers.distribution === 'approximately-normal' ? 'Welch t' : 'Mann–Whitney',
      why: answers.distribution === 'approximately-normal'
        ? '两组独立、结局为连续变量，且近似正态；Welch 版本不要求两组方差相等。'
        : '两组独立但连续结局明显偏态，使用秩次方法比较分布位置。',
      conditions: ['两组观测相互独立', '连续或至少有序的结局', answers.distribution === 'approximately-normal' ? '组内分布没有严重偏态' : '两组分布形状大致相近以便解释为位置差异'],
      alternative: answers.distribution === 'approximately-normal' ? '配对数据改用配对 t；严重偏态改用 Mann–Whitney。' : '如果可通过预先设定的变换改善分布，可考虑 t 检验或线性模型。',
      paperWording: answers.distribution === 'approximately-normal'
        ? '采用 Welch 独立样本 t 检验比较两组均数，报告均数差、95% CI、t 值、自由度和 P 值。'
        : '采用 Mann–Whitney U 检验比较两组分布，报告中位数、四分位距、U 值和 P 值。',
      caution: '统计学显著不等于临床显著，应结合最小临床重要差异解释。',
    }
  }
  if (answers.groups >= 3) {
    return {
      name: answers.distribution === 'approximately-normal' ? '单因素方差分析（ANOVA）' : 'Kruskal–Wallis 检验',
      shortName: answers.distribution === 'approximately-normal' ? '单因素 ANOVA' : 'Kruskal–Wallis',
      why: '需要比较三个或以上独立组的连续结局，先进行总体检验。',
      conditions: ['各组相互独立', answers.distribution === 'approximately-normal' ? '组内近似正态、方差具有可比性' : '结局至少为有序变量'],
      alternative: '总体检验显著后需要预先定义的事后比较，并控制多重比较错误。',
      paperWording: '报告总体 F（或 H）统计量、自由度、P 值及事后比较的校正结果。',
      caution: '总体 P 值显著不能告诉你具体哪两组不同。',
    }
  }
  return {
    name: '请补充研究设计信息', shortName: '信息不足', why: '当前答案无法唯一确定方法。', conditions: [], alternative: '从研究目的、结局类型和组间关系重新填写。', paperWording: '在明确研究设计后再确定统计方法。', caution: '不要仅凭变量名称选择方法。',
  }
}
