import type { IntentTag, IntentResult } from "./types";

/**
 * 每个意图标签对应的关键词 / 正则规则组
 * 规则之间是 OR 关系；所有标签的规则并行执行，命中的全部加入结果集合
 */
const TAG_RULES: Record<IntentTag, RegExp[]> = {
  code: [
    /写(一个|个|段|些)?(代码|程序|脚本|函数|方法|类|组件|接口|模块)/,
    /帮(我|忙)?(实现|编写|开发|生成|补全)/,
    /\b(debug|调试|报错|bug|修复|fix|重构|refactor|优化代码)\b/i,
    /代码(怎么写|实现|示例|片段)/,
    /\b(function|class|const|let|var|import|export|interface|type)\b/,
  ],
  image: [
    /(生成|画|绘制|创作|制作)(一(张|幅|个)|张|幅)?(图片|图像|插图|海报|头像|壁纸)/,
    /图(片|像)(风格|样式|效果)/,
    /\b(image|illustration|poster|avatar|wallpaper)\b/i,
  ],
  search: [
    /(最新|实时|今天|今日|最近|当前)(的|消息|新闻|资讯|数据|价格|行情)/,
    /(查(一下|询)|搜(索|一下)|找(一下|找看看))/,
    /\b(search|google|bing|最新版本|latest|release)\b/i,
    /现在.*(几点|多少|怎么样)/,
  ],
  plan: [
    /(制定|规划|列出|给出|设计)(一个|个)?(计划|方案|步骤|流程|大纲)/,
    /分(步骤|阶段|批次)(完成|实现|讲解|介绍)/,
    /如何(一步步|逐步|系统(地|性))(实现|完成|做)/,
    /从(零|头)(开始|到尾)(实现|完成|搭建|开发)/,
  ],
  reflect: [
    /(检查|审查|审阅|校验|核查)(一下|这段|这个|代码|内容|文章)?/,
    /(有(没有|无)|是否)(问题|错误|漏洞|缺陷|不足|改进空间)/,
    /帮(我|忙)?(review|评审|critique|评价)/i,
    /找(出|到)(其中的)?(问题|错误|bug|漏洞)/,
  ],
  qa: [
    /(解释|说明|介绍|讲解)(一下|一下什么是)?/,
    /什么是|是什么|为什么|怎么理解|如何理解/,
    /\b(what|why|how|explain|describe)\b/i,
    /(原理|概念|定义|区别|对比|比较)/,
  ],
};

/**
 * 基于规则匹配的意图解析
 *
 * - 所有标签的规则并行执行，命中的全部加入 tags
 * - 无任何命中时默认注入 "qa"
 * - confidence 根据命中标签数量线性估算
 */
export function parseByRules(content: string): IntentResult {
  const tags = new Set<IntentTag>();

  for (const [tag, patterns] of Object.entries(TAG_RULES) as [
    IntentTag,
    RegExp[],
  ][]) {
    const hit = patterns.some((re) => re.test(content));
    if (hit) tags.add(tag);
  }

  // 无任何命中 → 默认 qa
  if (tags.size === 0) {
    tags.add("qa");
  }

  // 置信度：命中 1 个标签给 0.7，每多命中 1 个加 0.1，上限 1.0
  const confidence = Math.min(0.7 + (tags.size - 1) * 0.1, 1.0);

  return { tags, confidence };
}