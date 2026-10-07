// 精选的门槛。评分标准本身写在 prompts/selection-score.md；这里只决定“多少分算入选”。
// 每篇资料由评分模型独立打两次分（0–100），两次之和 ≥ 2 × 门槛才进精选，卡片上显示两次的平均分。
// 门槛按信源分级区分：官方一手信源的门槛低一些，媒体和个人的高一些。改了门槛或评分提示词，
// 用 scripts/eval-selection.ts 在你自己标注的样本上重跑一遍，再决定上线（见 docs/selection.md）。

export const SELECTION = {
  /**
   * 信源分级 → 入选门槛（平均分）。分级在后台“信源”里给每个源设置：
   *   T1 官方一手（官网、官方博客、机构）· T1_5 官方账号、准官方创作者 · T2 媒体与个人
   * 分级 EXCLUDE_MP 以及这里没有列出的分级，不参与精选评分（只进“全部动态”）。
   */
  thresholds: { T1: 60, T1_5: 65, T2: 65 } as Record<string, number>,
  /**
   * 没入选、但平均分高于这个数的资料，也用精选的写法（内容理解：标题、摘要、推荐理由、标签）来写，
   * 其余用更便宜的“标题摘要翻译”。
   */
  understandFloor: 50,
} as const;

/**
 * 日报分节的均衡配额（packages/backend/src/reports/compose.ts 读取）。
 * 每个分节进日报正文的上限由这里决定，超出的条目降级进文末简讯（flashes，溢出保护）。
 * sectionLimits 没列出的分节用 defaultSectionLimit；**不限用 Infinity，绝不要用 null**
 * （compose 里 `?? 默认值` 会把 null 吞成默认上限，不限语义静默失效——validate-fork 会拦 null）。
 * aitvhot 的取向：垂直行业的读者注意力紧，日报宁紧勿滥（默认 6 条/节，上游宽赛道默认是 8）；
 * 核心价值区“平台与监管”不设限——规则与监管的日常密度本来就低，每条都该进正文。
 */
export const REPORT = {
  defaultSectionLimit: 6,
  sectionLimits: { "平台与监管": Infinity } as Record<string, number>,
  flashLimit: 10,
} as const;
