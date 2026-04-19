/**
 * 根据标题内容返回对应的 Emoji 图标
 */
export const getIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("计划") || t.includes("安排")) return "📅";
  if (t.includes("分析") || t.includes("逻辑")) return "🧠";
  if (t.includes("事实") || t.includes("百科")) return "📖";
  if (t.includes("偏好") || t.includes("习惯")) return "👤";
  if (t.includes("创意") || t.includes("灵感")) return "💡";
  return "✨";
};
