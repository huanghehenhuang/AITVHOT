// 可选模块。模型榜和 Codex 监控只对 AI 大模型行业有意义，aitvhot 两项都关。
// 关掉以后：导航里不再出现入口，对应的定时任务不再运行，页面与接口返回 404。
// 想彻底删掉代码，按 docs/customize.md 第 6 节删对应目录。

export const FEATURES = {
  /** 模型榜（/leaderboard）：aitvhot 用不到，关闭。 */
  leaderboard: false,
  /** Codex 重置监控（/codex-reset）：aitvhot 用不到，关闭。 */
  codexResetMonitor: false,
} as const;
