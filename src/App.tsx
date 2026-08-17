import { useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity, ArrowRight, BarChart3, BookOpen, BrainCircuit, Check, CheckCircle2, ChevronDown,
  CircleAlert, ClipboardCheck, Clock3, Database, FileText, Flame, Home, Info, Lightbulb,
  Moon, Network, Play, Plus, Search, Settings, ShieldCheck, Sparkles, Stethoscope,
  Sun, Target, TestTube2, TrendingUp, Upload, X, Zap,
} from 'lucide-react'
import { chapters, questions } from './data/content'
import { fisherExact2x2, oneSampleT, parseValues, summarize, welchT, chiSquare2x2 } from './lib/statistics'
import { initialAnswers, recommendMethod, type SelectorAnswers } from './lib/methodSelector'
import type { CalculationResult, Lesson, PageId, ProgressState } from './types/domain'

const defaultProgress: ProgressState = { completedLessons: [], completedQuestions: [], mistakes: [], bookmarkedLessons: [], studyMinutes: 0, streak: 0 }

const navItems: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: '总览', icon: Home },
  { id: 'learn', label: '课程学习', icon: BookOpen },
  { id: 'selector', label: '方法选择器', icon: Network },
  { id: 'calculator', label: '统计计算器', icon: TestTube2 },
  { id: 'practice', label: '练习题', icon: ClipboardCheck },
  { id: 'data', label: '数据分析', icon: Database },
  { id: 'visualize', label: '数据可视化', icon: BarChart3 },
  { id: 'paper', label: '论文阅读器', icon: FileText },
  { id: 'tutor', label: 'AI 统计老师', icon: BrainCircuit },
]

const secondaryItems: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'mistakes', label: '错题本', icon: CircleAlert },
  { id: 'progress', label: '学习进度', icon: TrendingUp },
  { id: 'settings', label: '设置', icon: Settings },
]

const formatNumber = (value: number | undefined, digits = 2) => value === undefined || !Number.isFinite(value) ? '—' : value.toFixed(digits)
const formatP = (value: number | undefined) => value === undefined || !Number.isFinite(value) ? '—' : value < 0.001 ? '<0.001' : value.toFixed(3)

const loadProgress = (): ProgressState => {
  try {
    const raw = localStorage.getItem('medstats-progress')
    return raw ? { ...defaultProgress, ...JSON.parse(raw) } : defaultProgress
  } catch { return defaultProgress }
}

export default function App() {
  const [page, setPage] = useState<PageId>('dashboard')
  const [progress, setProgress] = useState<ProgressState>(loadProgress)
  const [dark, setDark] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(chapters[0].lessons[0] ?? null)

  useEffect(() => { localStorage.setItem('medstats-progress', JSON.stringify(progress)) }, [progress])
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light' }, [dark])

  const completeLesson = (lesson: Lesson) => {
    setProgress((current) => current.completedLessons.includes(lesson.id) ? current : {
      ...current,
      completedLessons: [...current.completedLessons, lesson.id],
      studyMinutes: current.studyMinutes + lesson.duration,
      streak: Math.max(current.streak, 1),
      lastStudyDate: new Date().toISOString().slice(0, 10),
    })
  }
  const toggleBookmark = (lessonId: string) => setProgress((current) => ({
    ...current,
    bookmarkedLessons: current.bookmarkedLessons.includes(lessonId)
      ? current.bookmarkedLessons.filter((id) => id !== lessonId)
      : [...current.bookmarkedLessons, lessonId],
  }))
  const goToLesson = (lesson: Lesson) => { setSelectedLesson(lesson); setPage('learn') }

  const searchResults = useMemo(() => {
    if (search.trim().length < 2) return []
    const query = search.trim().toLowerCase()
    return chapters.flatMap((chapter) => chapter.lessons
      .filter((lesson) => `${lesson.title}${lesson.summary}${lesson.caseStudy}`.toLowerCase().includes(query))
      .map((lesson) => ({ lesson, chapter }))).slice(0, 5)
  }, [search])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark"><Activity size={20} /></div>
          <div><strong>MedStats</strong><span>医学统计学学习助手</span></div>
        </div>
        <div className="mode-chip"><span className="status-dot" />标准学习模式 <ChevronDown size={14} /></div>
        <nav className="main-nav" aria-label="主导航">
          <p className="nav-caption">学习空间</p>
          {navItems.map((item) => <NavButton key={item.id} item={item} active={page === item.id} onClick={() => setPage(item.id)} />)}
          <p className="nav-caption secondary-caption">我的记录</p>
          {secondaryItems.map((item) => <NavButton key={item.id} item={item} active={page === item.id} onClick={() => setPage(item.id)} />)}
        </nav>
        <div className="sidebar-footer">
          <div className="privacy-badge"><ShieldCheck size={16} /><span>本机数据 · 隐私优先</span></div>
          <div className="version-line">MedStats v0.1 · 离线可用</div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><div className="brand-mark"><Activity size={18} /></div><strong>MedStats</strong></div>
          <div className="search-wrap">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索课程、公式、案例和练习题" aria-label="全局搜索" />
            {searchResults.length > 0 && <div className="search-results">
              {searchResults.map(({ lesson, chapter }) => <button key={lesson.id} onClick={() => { goToLesson(lesson); setSearch('') }}><BookOpen size={15} /><span><b>{lesson.title}</b><small>第 {chapter.number} 章 · {lesson.summary}</small></span><ArrowRight size={15} /></button>)}
            </div>}
          </div>
          <div className="top-actions">
            <button className="icon-button" title={dark ? '切换浅色模式' : '切换深色模式'} onClick={() => setDark((value) => !value)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <div className="profile-avatar">医</div>
          </div>
        </header>
        <div className="content-area">
          {page === 'dashboard' && <Dashboard progress={progress} onNavigate={setPage} onLesson={goToLesson} />}
          {page === 'learn' && <LearnPage progress={progress} selectedLesson={selectedLesson} onSelect={setSelectedLesson} onComplete={completeLesson} onBookmark={toggleBookmark} />}
          {page === 'selector' && <SelectorPage />}
          {page === 'calculator' && <CalculatorPage />}
          {page === 'practice' && <PracticePage progress={progress} setProgress={setProgress} />}
          {page === 'data' && <DataPage onNavigate={setPage} />}
          {page === 'visualize' && <VisualizePage />}
          {page === 'paper' && <PaperPage />}
          {page === 'tutor' && <TutorPage />}
          {page === 'mistakes' && <MistakesPage progress={progress} onPractice={() => setPage('practice')} />}
          {page === 'progress' && <ProgressPage progress={progress} />}
          {page === 'settings' && <SettingsPage dark={dark} setDark={setDark} />}
        </div>
      </main>
    </div>
  )
}

function NavButton({ item, active, onClick }: { item: { id: PageId; label: string; icon: LucideIcon }; active: boolean; onClick: () => void }) {
  const Icon = item.icon
  return <button className={`nav-button ${active ? 'active' : ''}`} onClick={onClick}><Icon size={18} /><span>{item.label}</span>{item.id === 'mistakes' && <span className="nav-count">2</span>}</button>
}

function Dashboard({ progress, onNavigate, onLesson }: { progress: ProgressState; onNavigate: (page: PageId) => void; onLesson: (lesson: Lesson) => void }) {
  const firstIncomplete = chapters.flatMap((chapter) => chapter.lessons).find((lesson) => !progress.completedLessons.includes(lesson.id)) ?? chapters[0].lessons[0]
  const totalLessons = chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0)
  const mastery = totalLessons === 0 ? 0 : Math.round((progress.completedLessons.length / totalLessons) * 100)
  const featureCards: { title: string; description: string; icon: LucideIcon; color: string; page: PageId }[] = [
    { title: '开始学习', description: '按知识树掌握核心概念', icon: BookOpen, color: 'teal', page: 'learn' },
    { title: '方法选择器', description: '从研究问题走到统计方法', icon: Network, color: 'blue', page: 'selector' },
    { title: '统计计算器', description: '计算并理解分析结果', icon: TestTube2, color: 'amber', page: 'calculator' },
    { title: '今日练习', description: '用医学案例巩固判断', icon: ClipboardCheck, color: 'coral', page: 'practice' },
  ]
  return <>
    <div className="page-heading"><div><p className="eyebrow">2026 年 8 月 17 日 · 星期一</p><h1>欢迎学习医学统计学</h1><p className="heading-copy">把每一个研究问题，变成清晰、可靠的统计证据。</p></div><div className="heading-actions"><button className="button primary" onClick={() => firstIncomplete && onLesson(firstIncomplete)}><Play size={16} />继续学习</button><button className="button quiet" onClick={() => onNavigate('practice')}><ClipboardCheck size={16} />今日练习</button></div></div>
    <section className="metric-grid">
      <MetricCard label="今日学习" value={`${progress.studyMinutes}`} unit="分钟" hint="离线记录已保存" icon={Clock3} tone="teal" />
      <MetricCard label="今日完成" value={`${progress.completedQuestions.length}`} unit={`/ ${questions.length}`} hint="完成练习题" icon={CheckCircle2} tone="blue" />
      <MetricCard label="当前掌握度" value={`${mastery}`} unit="%" hint="基于已完成知识点" icon={Target} tone="amber" />
      <MetricCard label="连续学习" value={`${progress.streak}`} unit="天" hint="保持今天的节奏" icon={Flame} tone="coral" />
    </section>
    <section className="section-block">
      <div className="section-title-row"><div><h2>今天从这里开始</h2><p>为你准备的四个高频入口</p></div><button className="text-button" onClick={() => onNavigate('progress')}>查看学习进度 <ArrowRight size={15} /></button></div>
      <div className="feature-grid">{featureCards.map((card) => <button key={card.title} className={`feature-tile ${card.color}`} onClick={() => onNavigate(card.page)}><div className="feature-icon"><card.icon size={20} /></div><span className="feature-title">{card.title}</span><span className="feature-description">{card.description}</span><ArrowRight className="feature-arrow" size={17} /></button>)}</div>
    </section>
    <div className="dashboard-columns">
      <section className="section-block continue-panel"><div className="section-title-row"><div><h2>继续上次学习</h2><p>从短小而关键的知识点开始</p></div><BookOpen size={20} className="section-icon" /></div>{firstIncomplete ? <button className="continue-card" onClick={() => onLesson(firstIncomplete)}><div className="lesson-thumb"><span>第 {chapters.find((chapter) => chapter.lessons.some((item) => item.id === firstIncomplete.id))?.number} 章</span><BookOpen size={23} /></div><div className="continue-copy"><span className="tag">推荐 · {firstIncomplete.duration} 分钟</span><strong>{firstIncomplete.title}</strong><span>{firstIncomplete.summary}</span><div className="progress-line"><i style={{ width: progress.completedLessons.includes(firstIncomplete.id) ? '100%' : '18%' }} /></div></div><ArrowRight size={20} /></button> : <EmptyState title="已完成全部当前课程" description="下一批知识内容会在课程更新后加入。" />}</section>
      <section className="section-block mastery-panel"><div className="section-title-row"><div><h2>我的统计学能力</h2><p>按模块查看掌握情况</p></div><BrainCircuit size={20} className="section-icon" /></div><MasteryRow label="描述性统计" value={progress.completedLessons.some((id) => id.startsWith('l-02')) ? 65 : 18} tone="blue" /><MasteryRow label="假设检验" value={progress.completedLessons.some((id) => id.startsWith('l-07')) ? 48 : 10} tone="amber" /><MasteryRow label="方法选择" value={progress.completedQuestions.length > 0 ? 32 : 5} tone="teal" /><MasteryRow label="回归分析" value={0} tone="coral" /></section>
    </div>
    <div className="privacy-note"><ShieldCheck size={18} /><div><strong>医学数据隐私提醒</strong><span>课程和练习数据只保存在本机。导入患者数据前，请确认已去除姓名、住院号等直接标识信息。</span></div><button className="icon-button" title="关闭提醒"><X size={16} /></button></div>
  </>
}

function MetricCard({ label, value, unit, hint, icon: Icon, tone }: { label: string; value: string; unit: string; hint: string; icon: LucideIcon; tone: string }) {
  return <div className={`metric-card ${tone}`}><div className="metric-header"><span>{label}</span><div className="metric-icon"><Icon size={17} /></div></div><div className="metric-value">{value}<small>{unit}</small></div><span className="metric-hint">{hint}</span></div>
}

function LearnPage({ progress, selectedLesson, onSelect, onComplete, onBookmark }: { progress: ProgressState; selectedLesson: Lesson | null; onSelect: (lesson: Lesson) => void; onComplete: (lesson: Lesson) => void; onBookmark: (id: string) => void }) {
  const [chapterId, setChapterId] = useState('ch-01')
  const chapter = chapters.find((item) => item.id === chapterId) ?? chapters[0]
  const completed = selectedLesson ? progress.completedLessons.includes(selectedLesson.id) : false
  return <div className="learn-layout"><aside className="course-tree"><div className="tree-heading"><div><p className="eyebrow">知识树</p><h2>课程学习</h2></div><span className="tree-total">{progress.completedLessons.length}/{chapters.reduce((sum, item) => sum + item.lessons.length, 0)}</span></div>{chapters.map((item) => <div key={item.id} className="chapter-group"><button className={`chapter-button ${chapter.id === item.id ? 'selected' : ''}`} onClick={() => { setChapterId(item.id); if (item.lessons[0]) onSelect(item.lessons[0]) }}><span className="chapter-number" style={{ background: item.color }}>0{item.number}</span><span><b>{item.title}</b><small>{item.lessons.length ? `${item.lessons.length} 个知识点` : '即将上线'}</small></span><ChevronDown size={15} /></button>{chapter.id === item.id && item.lessons.map((itemLesson) => <button key={itemLesson.id} className={`lesson-tree-item ${selectedLesson?.id === itemLesson.id ? 'active' : ''}`} onClick={() => onSelect(itemLesson)}><span className={`lesson-status ${progress.completedLessons.includes(itemLesson.id) ? 'done' : ''}`}>{progress.completedLessons.includes(itemLesson.id) ? <Check size={11} /> : <span />}</span><span>{itemLesson.title}</span><small>{itemLesson.duration}′</small></button>)}</div>)}</aside><article className="lesson-content">{selectedLesson ? <><div className="lesson-breadcrumb">第 {chapter.number} 章 <span>/</span> {chapter.title} <span>/</span> {selectedLesson.kind === 'method' ? '统计方法' : '核心概念'}</div><div className="lesson-title-row"><div><span className="tag blue-tag">{selectedLesson.kind === 'method' ? '方法理解' : '基础概念'} · {selectedLesson.duration} 分钟</span><h1>{selectedLesson.title}</h1><p>{selectedLesson.summary}</p></div><button className={`icon-button bookmark ${progress.bookmarkedLessons.includes(selectedLesson.id) ? 'bookmarked' : ''}`} title="收藏知识点" onClick={() => onBookmark(selectedLesson.id)}>★</button></div><div className="lesson-callout"><Lightbulb size={19} /><div><strong>先记住这一点</strong><p>{selectedLesson.explanation}</p></div></div><div className="lesson-section"><h2>医学场景</h2><div className="case-box"><Stethoscope size={20} /><div><span className="case-label">临床案例</span><p>{selectedLesson.caseStudy}</p></div></div></div>{selectedLesson.formula && <div className="lesson-section"><h2>公式</h2><div className="formula-box">{selectedLesson.formula}</div></div>}<div className="lesson-section"><h2>常见误区</h2><div className="pitfall-list">{selectedLesson.pitfalls.map((pitfall) => <div key={pitfall}><CircleAlert size={16} /><span>{pitfall}</span></div>)}</div></div><div className="lesson-footer"><span><Clock3 size={15} />预计阅读 {selectedLesson.duration} 分钟</span><button className={`button ${completed ? 'success' : 'primary'}`} onClick={() => onComplete(selectedLesson)}>{completed ? <><Check size={16} />已完成</> : <><CheckCircle2 size={16} />完成本节</>}</button></div></> : <EmptyState title="选择一个知识点" description="从左侧知识树开始学习。" />}</article></div>
}

function SelectorPage() {
  const [answers, setAnswers] = useState<SelectorAnswers>(initialAnswers)
  const recommendation = recommendMethod(answers)
  const update = <K extends keyof SelectorAnswers>(key: K, value: SelectorAnswers[K]) => setAnswers((current) => ({ ...current, [key]: value }))
  return <><PageIntro eyebrow="统计决策工具" title="我应该用什么统计方法？" description="回答几个关于研究设计的问题，得到可解释、可复核的建议。" icon={Network} /><div className="selector-layout"><section className="selector-form section-block"><div className="section-title-row"><div><h2>研究问题画像</h2><p>每一步都对应一个统计学判断</p></div><span className="step-chip">1 / 6</span></div><QuestionSelect label="研究目的" value={answers.purpose} onChange={(value) => update('purpose', value as SelectorAnswers['purpose'])} options={[['compare', '比较组间差异'], ['association', '分析变量关联'], ['diagnosis', '评价诊断效能']]} /><QuestionSelect label="主要结局变量" value={answers.outcome} onChange={(value) => update('outcome', value as SelectorAnswers['outcome'])} options={[['continuous', '连续变量（血压、血糖）'], ['categorical', '分类变量（分级、构成）'], ['binary', '二分类变量（是/否）'], ['time-to-event', '生存时间']]} /><QuestionSelect label="比较几组" value={String(answers.groups)} onChange={(value) => update('groups', Number(value) as 1 | 2 | 3)} options={[['1', '一个样本 vs 参考值'], ['2', '两组'], ['3', '三组或以上']]} /><QuestionSelect label="组间关系" value={answers.design} onChange={(value) => update('design', value as SelectorAnswers['design'])} options={[['independent', '独立样本'], ['paired', '配对 / 前后测量']]} /><QuestionSelect label="数据分布" value={answers.distribution} onChange={(value) => update('distribution', value as SelectorAnswers['distribution'])} options={[['approximately-normal', '近似正态'], ['skewed', '明显偏态'], ['unknown', '尚未判断']]} /><label className="check-row"><input type="checkbox" checked={answers.smallExpected} onChange={(event) => update('smallExpected', event.target.checked)} /><span><b>分类表中存在较小的期望频数</b><small>2×2 表中有单元格期望频数小于 5</small></span></label></section><section className="recommendation-panel"><div className="recommendation-head"><div className="recommendation-icon"><Sparkles size={20} /></div><div><span className="eyebrow">推荐结果</span><h2>{recommendation.name}</h2></div></div><div className="recommendation-why"><strong>为什么？</strong><p>{recommendation.why}</p></div><div className="recommendation-section"><h3>使用条件</h3><ul>{recommendation.conditions.map((condition) => <li key={condition}><Check size={15} />{condition}</li>)}</ul></div><div className="recommendation-section"><h3>不满足条件时</h3><p>{recommendation.alternative}</p></div><div className="recommendation-section paper-wording"><h3>论文写法</h3><p>“{recommendation.paperWording}”</p></div><div className="recommendation-caution"><Info size={16} /><span>{recommendation.caution}</span></div></section></div></>
}

function QuestionSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="field-label"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, text]) => <option key={optionValue} value={optionValue}>{text}</option>)}</select></label>
}

function CalculatorPage() {
  const [mode, setMode] = useState<'summary' | 'one-sample' | 'welch' | 'chi' | 'fisher'>('summary')
  const [values, setValues] = useState('132, 128, 140, 136, 125, 131, 129, 138')
  const [groupB, setGroupB] = useState('145, 139, 142, 151, 136, 147, 143, 140')
  const [mu0, setMu0] = useState('130')
  const [table, setTable] = useState(['32', '18', '20', '30'])
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [error, setError] = useState('')
  const run = () => {
    setError(''); setResult(null)
    try {
      if (mode === 'summary') { const summary = summarize(parseValues(values)); setResult({ method: '描述性统计', estimate: summary.mean, interpretation: `共 ${summary.n} 个有效观测值，均数为 ${formatNumber(summary.mean)}，中位数为 ${formatNumber(summary.median)}。标准差描述个体波动，标准误描述均数的抽样不确定性。`, warnings: summary.n < 30 ? ['样本量较小，建议同时查看原始数据和分布图。'] : [] }) }
      if (mode === 'one-sample') setResult(oneSampleT(parseValues(values), Number(mu0)))
      if (mode === 'welch') setResult(welchT(parseValues(values), parseValues(groupB)))
      if (mode === 'chi') { const numbers = table.map(Number) as [number, number, number, number]; setResult(numbers.some((value) => !Number.isFinite(value)) ? (() => { throw new Error('四格表请输入数字。') })() : chiSquare2x2([[numbers[0], numbers[1]], [numbers[2], numbers[3]]])) }
      if (mode === 'fisher') { const numbers = table.map(Number) as [number, number, number, number]; setResult(numbers.some((value) => !Number.isFinite(value)) ? (() => { throw new Error('四格表请输入数字。') })() : fisherExact2x2([[numbers[0], numbers[1]], [numbers[2], numbers[3]]])) }
    } catch (err) { setError(err instanceof Error ? err.message : '输入无法计算，请检查格式。') }
  }
  const tableMode = mode === 'chi' || mode === 'fisher'
  return <><PageIntro eyebrow="统计计算中心" title="医学统计计算器" description="输入数据，查看统计量、置信区间和符合医学语境的解释。" icon={TestTube2} /><div className="calculator-layout"><section className="calculator-input section-block"><div className="calc-tabs">{[['summary', '描述'], ['one-sample', '单样本 t'], ['welch', 'Welch t'], ['chi', 'χ²'], ['fisher', 'Fisher']].map(([id, label]) => <button key={id} className={mode === id ? 'active' : ''} onClick={() => { setMode(id as typeof mode); setResult(null) }}>{label}</button>)}</div><div className="privacy-strip"><ShieldCheck size={15} />数据仅在本机计算，不会上传。</div><label className="field-label"><span>{tableMode ? '四格表频数（a, b, c, d）' : mode === 'welch' ? 'A 组数值' : '输入数值（逗号或换行分隔）'}</span>{tableMode ? <div className="table-inputs">{table.map((value, index) => <input key={index} value={value} onChange={(event) => setTable((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} aria-label={`四格表第 ${index + 1} 格`} />)}</div> : <textarea value={values} onChange={(event) => setValues(event.target.value)} rows={mode === 'welch' ? 4 : 7} />}</label>{mode === 'welch' && <label className="field-label"><span>B 组数值</span><textarea value={groupB} onChange={(event) => setGroupB(event.target.value)} rows={4} /></label>}{mode === 'one-sample' && <label className="field-label"><span>假设总体均数 μ₀</span><input value={mu0} onChange={(event) => setMu0(event.target.value)} /></label>}{mode === 'welch' && <p className="helper-text">默认使用 Welch 版本，不强制两组方差相等。</p>}<button className="button primary wide" onClick={run}><Zap size={16} />计算并解释</button>{error && <div className="error-message"><CircleAlert size={16} />{error}</div>}</section><section className="result-panel section-block">{result ? <ResultView result={result} mode={mode} /> : <EmptyState title="等待一次计算" description="选择左侧方法并输入数据，结果会在这里展开。" icon={BarChart3} />}</section></div></>
}

function ResultView({ result, mode }: { result: CalculationResult; mode: string }) {
  const summary = mode === 'summary' && result.estimate !== undefined
  return <div className="result-view"><div className="result-title-row"><div><span className="eyebrow">计算完成</span><h2>{result.method}</h2></div><div className="result-check"><CheckCircle2 size={18} /></div></div>{summary ? <div className="summary-result-grid"><ResultMetric label="均数" value={formatNumber(result.estimate)} /><ResultMetric label="输入数据" value="有效值" /></div> : <div className="stat-result-grid"><ResultMetric label="统计量" value={formatNumber(result.statistic)} /><ResultMetric label="P 值" value={formatP(result.pValue)} highlight={result.pValue !== undefined && result.pValue < 0.05} /><ResultMetric label="自由度" value={formatNumber(result.df, 1)} /><ResultMetric label="95% CI" value={result.ci ? `${formatNumber(result.ci[0])} ~ ${formatNumber(result.ci[1])}` : '—'} /></div>}<div className="interpretation-box"><div className="interpretation-label"><Lightbulb size={16} />结果解释</div><p>{result.interpretation}</p></div>{result.warnings.length > 0 && <div className="warning-list">{result.warnings.map((warning) => <div key={warning}><CircleAlert size={15} />{warning}</div>)}</div>}</div>
}

function ResultMetric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) { return <div className={`result-metric ${highlight ? 'highlight' : ''}`}><span>{label}</span><strong>{value}</strong></div> }

function PracticePage({ progress, setProgress }: { progress: ProgressState; setProgress: React.Dispatch<React.SetStateAction<ProgressState>> }) {
  const [index, setIndex] = useState(0); const [selected, setSelected] = useState(''); const [submitted, setSubmitted] = useState(false)
  const question = questions[index % questions.length]
  const submit = () => { if (!selected) return; setSubmitted(true); setProgress((current) => ({ ...current, completedQuestions: current.completedQuestions.includes(question.id) ? current.completedQuestions : [...current.completedQuestions, question.id], mistakes: selected === question.answer ? current.mistakes : current.mistakes.includes(question.id) ? current.mistakes : [...current.mistakes, question.id] })) }
  const next = () => { setIndex((current) => (current + 1) % questions.length); setSelected(''); setSubmitted(false) }
  return <><PageIntro eyebrow="刻意练习" title="今日练习" description="每道题都来自医学研究场景，先做判断，再看统计学理由。" icon={ClipboardCheck} /><div className="practice-layout"><section className="practice-question section-block"><div className="practice-meta"><span className="tag blue-tag">{question.type}</span><span>{question.chapter}</span><span className="question-index">{index + 1} / {questions.length}</span></div><h2>{question.question}</h2>{question.options && <div className="answer-options">{question.options.map((option) => <button key={option} className={`answer-option ${selected === option ? 'selected' : ''} ${submitted && option === question.answer ? 'correct' : ''} ${submitted && selected === option && option !== question.answer ? 'wrong' : ''}`} onClick={() => !submitted && setSelected(option)}><span className="option-letter">{String.fromCharCode(65 + question.options!.indexOf(option))}</span><span>{option}</span>{submitted && option === question.answer && <CheckCircle2 size={17} />}{submitted && selected === option && option !== question.answer && <X size={17} />}</button>)}</div>} {!question.options && <textarea className="answer-text" placeholder="写下你的判断或理由……" />}{submitted && <div className={`answer-feedback ${selected === question.answer ? 'correct' : 'wrong'}`}><div><strong>{selected === question.answer ? '回答正确' : `正确答案：${question.answer}`}</strong><p>{question.explanation}</p></div></div>}<div className="practice-actions">{!submitted ? <button className="button primary" disabled={!selected} onClick={submit}><Check size={16} />提交答案</button> : <button className="button primary" onClick={next}>下一题 <ArrowRight size={16} /></button>}</div></section><aside className="practice-side"><div className="practice-score"><div className="score-ring"><strong>{progress.completedQuestions.length}</strong><span>已完成</span></div><div><h3>今日进度</h3><p>完成一题，掌握一个判断。</p></div></div><div className="tip-card"><Lightbulb size={18} /><div><strong>答题提示</strong><p>先看研究目的和结局变量，再考虑组间关系。不要从“哪个检验最常见”开始猜。</p></div></div></aside></div></>
}

function DataPage({ onNavigate }: { onNavigate: (page: PageId) => void }) { return <><PageIntro eyebrow="本地数据工作台" title="数据分析" description="导入 CSV、Excel 或 TXT，先完成变量概览，再决定分析方案。" icon={Database} /><div className="data-grid"><section className="import-panel section-block"><div className="drop-zone"><div className="drop-icon"><Upload size={22} /></div><h2>拖入医学数据文件</h2><p>支持 CSV、XLSX、TXT · 数据仅保存在本机</p><button className="button primary"><Plus size={16} />选择文件</button></div><div className="privacy-note compact"><ShieldCheck size={17} /><div><strong>导入前检查</strong><span>请先移除姓名、住院号、身份证号等直接标识信息。</span></div></div></section><section className="dataset-preview section-block"><div className="section-title-row"><div><h2>示例数据预览</h2><p>降压药疗效示例 · 24 行 · 5 个变量</p></div><span className="tag green-tag">可分析</span></div><div className="data-table"><div className="table-row table-head"><span>患者编号</span><span>治疗组</span><span>基线收缩压</span><span>8 周收缩压</span><span>是否达标</span></div>{[['P001', 'A', '158', '136', '是'], ['P002', 'B', '162', '145', '否'], ['P003', 'A', '151', '129', '是'], ['P004', 'B', '155', '139', '是'], ['P005', 'A', '169', '142', '是']].map((row) => <div className="table-row" key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}</div><div className="data-actions"><button className="button quiet" onClick={() => onNavigate('visualize')}><BarChart3 size={16} />查看图表</button><button className="button quiet" onClick={() => onNavigate('selector')}><Network size={16} />获取分析建议</button></div></section></div></> }

function VisualizePage() { const bars = [34, 48, 66, 82, 72, 54, 38, 22]; return <><PageIntro eyebrow="数据可视化" title="让分布和差异看得见" description="图表是理解数据结构的第一步，不能替代统计推断。" icon={BarChart3} /><div className="visual-grid"><section className="chart-panel section-block"><div className="section-title-row"><div><h2>治疗后收缩压分布</h2><p>示例直方图 · 单位：mmHg</p></div><button className="button quiet"><Upload size={15} />导出</button></div><div className="histogram"><div className="axis-y"><span>80</span><span>60</span><span>40</span><span>20</span><span>0</span></div><div className="bar-area">{bars.map((height, index) => <div className="bar-column" key={index}><i style={{ height: `${height}%` }} /><span>{120 + index * 5}</span></div>)}<div className="axis-line" /></div></div><div className="chart-legend"><span><i className="legend-dot teal-dot" />治疗后收缩压</span><span><Info size={14} />图表用于观察形状和异常值</span></div></section><section className="chart-panel section-block"><div className="section-title-row"><div><h2>散点关系预览</h2><p>BMI 与收缩压 · 示例数据</p></div><span className="tag blue-tag">r = 0.61</span></div><div className="scatter-plot">{[[10,75],[18,60],[24,55],[31,44],[40,38],[51,28],[62,18],[70,12],[35,50],[56,32],[28,62],[76,8]].map(([left, bottom], index) => <i key={index} style={{ left: `${left}%`, bottom: `${bottom}%` }} />)}<div className="trend-line" /></div><div className="chart-legend"><span><i className="legend-dot blue-dot" />观测值</span><span><TrendingUp size={14} />相关不等于因果</span></div></section></div></> }

function PaperPage() { const [text, setText] = useState('本研究发现干预组的 OR=2.31（95%CI 1.42–3.76），P=0.032。'); const result = useMemo(() => { const p = text.match(/P\s*[=＜<]\s*([0-9.]+)/i)?.[1]; const or = text.match(/\bOR\s*[=：:]\s*([0-9.]+)/i)?.[1]; const ci = text.match(/(?:95%\s*CI|95%CI)\s*([0-9.]+)\s*[–\-]\s*([0-9.]+)/i); return { p: p ? Number(p) : undefined, or: or ? Number(or) : undefined, ci: ci ? [Number(ci[1]), Number(ci[2])] as [number, number] : undefined } }, [text]); return <><PageIntro eyebrow="论文阅读器" title="读懂一段统计结果" description="粘贴论文中的统计结果，先拆解术语，再回到研究设计和临床语境。" icon={FileText} /><div className="paper-layout"><section className="paper-input section-block"><label className="field-label"><span>粘贴统计结果</span><textarea value={text} onChange={(event) => setText(event.target.value)} rows={7} /></label><div className="privacy-strip"><ShieldCheck size={15} />文本只在本机解析，不会上传。</div></section><section className="paper-result section-block"><div className="section-title-row"><div><h2>识别结果</h2><p>自动提取常见统计量</p></div><Sparkles size={19} className="section-icon" /></div><div className="paper-metrics"><ResultMetric label="P 值" value={formatP(result.p)} highlight={result.p !== undefined && result.p < 0.05} /><ResultMetric label="OR" value={result.or === undefined ? '—' : result.or.toFixed(2)} /><ResultMetric label="95% CI" value={result.ci ? `${result.ci[0]} ~ ${result.ci[1]}` : '—'} /></div>{(result.p !== undefined || result.or !== undefined) ? <div className="paper-explain"><div><strong>P 值</strong><p>{result.p !== undefined ? `在原假设成立时，观察到当前或更极端数据的概率约为 ${formatP(result.p)}，不是结果为真的概率。` : '没有识别到 P 值。'}</p></div><div><strong>OR 与 CI</strong><p>{result.or !== undefined ? `OR=${result.or.toFixed(2)} 表示暴露组的优势比约为对照组的 ${result.or.toFixed(2)} 倍；需要结合研究设计和 CI 判断精确度。` : '没有识别到 OR。'} 相关性不能直接解释为因果关系。</p></div></div> : <EmptyState title="等待统计文本" description="例如粘贴 P=0.032、OR=2.31（95%CI 1.42–3.76）。" />}</section></div></> }

function TutorPage() { const [question, setQuestion] = useState('为什么 P<0.05 就显著？'); const [asked, setAsked] = useState('为什么 P<0.05 就显著？'); const answer = asked.includes('P') || asked.includes('显著') ? 'P<0.05 只是表示：如果原假设成立，观察到当前或更极端数据的概率低于 5%。因此在事先设定 α=0.05 的规则下，我们拒绝原假设。它并不表示原假设为真的概率小于 5%，也不说明效果一定有临床意义。\n\n例如：一种新药让收缩压平均只下降 1 mmHg，在超大样本下也可能 P<0.05；这时还要看效应量、95% CI 和最小临床重要差异。' : '先从研究目的和结局变量开始。把你的问题改写成“研究谁、比较什么、结局是什么、数据如何测量”，再选择统计方法。'; return <><PageIntro eyebrow="离线辅导" title="AI 统计老师" description="先用清楚的语言理解概念，再用医学案例和正式定义巩固。" icon={BrainCircuit} /><div className="tutor-layout"><section className="tutor-chat section-block"><div className="chat-header"><div className="tutor-avatar"><BrainCircuit size={19} /></div><div><strong>MedStats Tutor</strong><span>离线知识库 · 即时回答</span></div><span className="online-dot">● 在线</span></div><div className="chat-message tutor"><div className="message-avatar">师</div><div><span className="message-label">统计老师</span><p>{answer}</p></div></div><div className="suggestion-row">{['什么是置信区间？', 't 检验怎么选？', '相关和因果有什么区别？'].map((item) => <button key={item} onClick={() => { setQuestion(item); setAsked(item) }}>{item}</button>)}</div><div className="chat-input"><input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') setAsked(question) }} placeholder="问一个统计学问题" /><button className="button primary" onClick={() => setAsked(question)}><ArrowRight size={17} /></button></div></section><aside className="tutor-side"><div className="tutor-note"><ShieldCheck size={18} /><div><strong>隐私边界</strong><p>当前使用本地内容，不会把数据集、患者信息或论文上传到网络。</p></div></div><div className="section-block tutor-topics"><h3>推荐学习主题</h3>{['P 值和临床意义', '独立样本 vs 配对样本', '95% CI 如何解读', '分类资料的检验选择'].map((item, index) => <button key={item} onClick={() => { setQuestion(item); setAsked(item) }}><span>0{index + 1}</span>{item}<ArrowRight size={15} /></button>)}</div></aside></div></> }

function MistakesPage({ progress, onPractice }: { progress: ProgressState; onPractice: () => void }) { const mistakes = questions.filter((question) => progress.mistakes.includes(question.id)); return <><PageIntro eyebrow="复习空间" title="错题本" description="错误不是终点，回看错因才会形成稳定的判断。" icon={CircleAlert} /><section className="section-block mistake-list">{mistakes.length === 0 ? <EmptyState title="还没有错题" description="完成练习后，答错的题目会自动出现在这里。" icon={CheckCircle2} /> : mistakes.map((question) => <div className="mistake-item" key={question.id}><div className="mistake-icon"><CircleAlert size={18} /></div><div><span className="tag coral-tag">{question.tag}</span><h3>{question.question}</h3><p>正确答案：{question.answer}</p></div><button className="icon-button" title="去练习" onClick={onPractice}><ArrowRight size={17} /></button></div>)}</section></> }

function ProgressPage({ progress }: { progress: ProgressState }) { const total = chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0); const percent = total ? Math.round((progress.completedLessons.length / total) * 100) : 0; return <><PageIntro eyebrow="学习画像" title="我的统计学能力" description="掌握度来自真实学习记录，不用一次考试定义自己。" icon={TrendingUp} /><div className="progress-overview"><div className="overall-progress section-block"><span className="eyebrow">课程完成度</span><div className="big-percent">{percent}<small>%</small></div><div className="large-progress"><i style={{ width: `${percent}%` }} /></div><p>已完成 {progress.completedLessons.length} / {total} 个当前知识点</p></div><div className="streak-card section-block"><div className="streak-icon"><Flame size={22} /></div><strong>{progress.streak} 天</strong><span>连续学习</span><small>每天完成一个小知识点即可保持节奏</small></div></div><section className="section-block skill-list"><div className="section-title-row"><div><h2>模块掌握度</h2><p>根据完成度和练习表现估算</p></div><Target size={20} className="section-icon" /></div><MasteryRow label="描述性统计" value={progress.completedLessons.some((id) => id.startsWith('l-02')) ? 65 : 18} tone="blue" /><MasteryRow label="假设检验" value={progress.completedLessons.some((id) => id.startsWith('l-07')) ? 48 : 10} tone="amber" /><MasteryRow label="t 检验和 χ² 检验" value={progress.completedLessons.some((id) => id.startsWith('l-08') || id.startsWith('l-09')) ? 52 : 8} tone="teal" /><MasteryRow label="回归与生存分析" value={0} tone="coral" /></section></> }

function SettingsPage({ dark, setDark }: { dark: boolean; setDark: (value: boolean) => void }) { return <><PageIntro eyebrow="应用设置" title="设置" description="调整学习环境，查看数据和隐私边界。" icon={Settings} /><section className="section-block settings-list"><SettingRow icon={dark ? Moon : Sun} title="深色模式" description="降低夜间学习时的屏幕亮度" control={<input type="checkbox" checked={dark} onChange={(event) => setDark(event.target.checked)} />} /><SettingRow icon={ShieldCheck} title="本机数据模式" description="课程记录、错题和计算结果仅保存在本机" control={<span className="setting-status">已启用</span>} /><SettingRow icon={Sparkles} title="在线 AI 辅导" description="当前版本使用离线知识库，联网模型将在后续版本中提供" control={<span className="setting-status muted">未连接</span>} /><SettingRow icon={Upload} title="检查更新" description="Tauri 安装包将使用签名更新包" control={<button className="button quiet">检查更新</button>} /></section></> }

function SettingRow({ icon: Icon, title, description, control }: { icon: LucideIcon; title: string; description: string; control: React.ReactNode }) { return <div className="setting-row"><div className="setting-icon"><Icon size={18} /></div><div><strong>{title}</strong><span>{description}</span></div><div className="setting-control">{control}</div></div> }
function PageIntro({ eyebrow, title, description, icon: Icon }: { eyebrow: string; title: string; description: string; icon: LucideIcon }) { return <div className="page-intro"><div className="intro-icon"><Icon size={22} /></div><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div></div> }
function MasteryRow({ label, value, tone }: { label: string; value: number; tone: string }) { return <div className="mastery-row"><div><span>{label}</span><strong>{value}%</strong></div><div className="mastery-track"><i className={tone} style={{ width: `${value}%` }} /></div></div> }
function EmptyState({ title, description, icon: Icon = BookOpen }: { title: string; description: string; icon?: LucideIcon }) { return <div className="empty-state"><div className="empty-icon"><Icon size={22} /></div><strong>{title}</strong><p>{description}</p></div> }
