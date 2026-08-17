# 修改日志

本项目遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)，并参考 Keep a Changelog 的结构记录重要变化。

## [Unreleased]

### 计划中

- 数据文件导入和变量概览
- 更多统计检验与回归模型
- 自动化 Windows 构建与签名发布

### 开源

- 仓库转为公开项目并采用 MIT License。

## [0.1.0] - 2026-08-17

首个可安装的 Windows 桌面版本。

### 新增

- 15 章医学统计学课程框架，覆盖描述性统计、概率、抽样、参数估计、假设检验、t 检验、χ² 检验、ANOVA、非参数检验、回归、诊断试验和生存分析。
- 医学研究场景驱动的统计方法选择器，可输出适用条件、替代方案、论文写法和注意事项。
- 描述性统计、单样本 t 检验、Welch 独立样本 t 检验、2×2 χ² 检验和 Fisher 精确检验计算器。
- 病例练习、即时解析、错题记录和学习进度追踪。
- 常见论文统计结果解析，支持 P 值、OR 和 95% CI 的基础识别与解释。
- 深色模式和本地隐私模式。
- 基于 Tauri 2 的 Windows NSIS 安装包。

### 验证

- 为统计汇总、t 检验、χ² 检验、Fisher 精确检验和方法选择逻辑建立 14 项自动化测试。
- 完成 TypeScript 类型检查、Vite 生产构建和 Windows x64 安装包构建验证。

### 已知限制

- 数据导入和图表导出页面当前使用示例数据，尚未连接真实文件解析流程。
- 离线辅导使用内置知识内容，不是生成式 AI 模型。
- Windows 安装包尚未进行代码签名，首次运行可能显示系统安全提示。

[Unreleased]: https://github.com/ctxedkbh1/medstats-learning-assistant/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ctxedkbh1/medstats-learning-assistant/releases/tag/v0.1.0
