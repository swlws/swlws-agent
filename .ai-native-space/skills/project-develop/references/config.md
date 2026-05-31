# 配置与环境变量

## 环境变量

| 变量 | 用途 | 必须 |
|------|------|------|
| `SWLWS_TEXT_LLM_API_KEY` | 文本 LLM API Key | ✅ |
| `SWLWS_TEXT_LLM_BASE_URL` | 文本 LLM Base URL（OpenAI 兼容格式）| ✅ |
| `SWLWS_TEXT_LLM_MODEL` | 文本 LLM 模型名 | ✅ |
| `SWLWS_IMAGE_GEN_API_KEY` | 图片生成 API Key | 仅图片功能 |
| `SWLWS_IMAGE_GEN_BASE_URL` | 图片生成 Base URL | 仅图片功能 |
| `SWLWS_IMAGE_GEN_MODEL` | 图片生成模型名 | 仅图片功能 |
| `SWLWS_SEARCH_API_KEY` | 搜索 API Key | 仅搜索功能 |
| `SWLWS_SEARCH_BASE_URL` | 搜索 Base URL | 仅搜索功能 |

新增功能如需环境变量，命名遵循 `SWLWS_<SERVICE>_<FIELD>` 规范。

## AppSettings 类型（`src/be/config/settings.ts`）

```typescript
interface AppSettings {
  // LLM
  textLlmModel: string
  textLlmBaseUrl: string
  textLlmApiKey: string
  // 意图解析
  intentMode: 'rule' | 'llm' | 'disabled'
  intentConfidenceThreshold: number
  // Agent
  agentMode: AgentMode        // 'text' | 'react' | 'plan-and-solve' | 'reflection'
  deepThink: boolean
  // 记忆
  maxMessagesCount: number
  maxContextMessages: number
  summaryTriggerCount: number
  // 心智卡片
  mindCardsUpdateHours: number
  mindCardsDisplayCount: number
  // ... 其他字段
}
```

## 配置优先级（三级合并）

```
硬编码默认值（HARDCODED_DEFAULTS）
  ← 文件级覆盖（src/be/config/setting.json）
    ← 用户级覆盖（.swlws/sessions/user/<uid>/setting.json）
```

优先级从低到高。用户通过 SettingsPanel 修改的配置存入用户级文件。

## 新增配置字段的完整步骤

必须同步更新以下 **3 处**，缺一不可：

1. **类型定义**：`src/be/config/settings.ts` 的 `AppSettings` interface 添加字段
2. **默认值**：同文件 `HARDCODED_DEFAULTS` 对象添加对应默认值
3. **设置面板**：`src/fe/pages/Chat/SettingsPanel.tsx` 添加对应 UI 控件

前端 `src/fe/apis/settings.ts` 直接 re-export 后端类型，无需单独维护前端类型声明。

## 持久化数据目录

```
.swlws/                                      # 由 paths.ts 中 DATA_DIR 指向
├── sessions/
│   └── user/<uid>/
│       ├── conversation/
│       │   └── <conversationId>.json        # 单个会话数据
│       ├── mindcards.json                   # 心智卡片
│       └── setting.json                     # 用户配置覆盖
├── mcp.json                                 # MCP 服务配置
└── skills-state.json                        # Skill 启停状态
```

`.swlws/` 目录不纳入版本控制（`.gitignore`）。

## MCP 配置格式（`.swlws/mcp.json`）

```json
{
  "servers": {
    "<serverName>": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-xxx"],
      "enabled": true
    }
  }
}
```

`transport` 支持 `stdio`（子进程）和 `sse`（远程 HTTP）两种。兼容 Claude Desktop 配置格式。
