# Project Handoff

## 产品名称

**PUPU — 悲伤止疼剂**（v1.2 Persistent Memory Alpha）

PUPU 是一个会陪伴人的数字生命体。Canvas 2D 粒子引擎、DeepSeek 真实 AI、语音输入、背景音乐、localStorage 持久化记忆。

## 核心设计理念
- 不是产品，是空间。
- 氛围先于功能。粒子会在你打字时靠拢、回复时扩散、存记忆时收束。
- 记忆可控。用户主动保存才会记住。数据仅存于本地浏览器。
- 不索取、不挽留、不催促。

## 设计文档体系（10 份）

| 文档 | 作用 |
|------|------|
| `COMPANION_PERSONA.md` | 人格、语气、禁止行为 |
| `WORLD.md` | 世界观、身份设定 |
| `FIRST_ARRIVAL.md` | 首次体验设计 |
| `LIVING_PRESENCE.md` | 主动在场感 |
| `INNER_LIFE.md` | 内在生命 |
| `THE_HUMAN.md` | 用户画像 |
| `MANIFESTATION_PLAN.md` | 显现计划 |
| `PHASE6_ARCHITECTURE.md` | 真实智能架构 |
| `ISSUES_AND_FIX_PLAN.md` | 体验问题诊断 |
| `PARTICLE_ENGINE_V2.md` | Canvas 粒子引擎设计 |

**接手前必须先阅读以上文档。**

## v1.2 核心架构

### Canvas 粒子引擎（CanvasLifeform.tsx）
- 140 粒子，高斯分布，径向光晕。rAF 驱动。
- 图片采样（Sobel 边缘检测 + 加权采样）。Pointer Interaction（130px 排斥）。
- 5 种状态机姿态（idle/listening/thinking/responding/remembering）。lerp ~1s 过渡。

### DeepSeek API（app/api/chat/route.ts）
- 服务端代理。蒸馏系统提示词 ~700 tokens（system-prompt.ts）。
- 上下文注入：时间段 + Radio + 角色名 + 情绪 + 最近 3 条记忆。
- Mock Engine（chat-engine.ts）永久保留为 fallback。

### Persistent Memory（Phase 8.0）

**localStorage 持久化**。Key：`pupu.memoryCards.v1`。

**数据结构**（`PersistentMemoryStore`）：
```ts
{
  version: 1,
  savedAt: 1717718400000,
  cards: MemoryCard[]  // 最多 50 条
}
```

**读取**（`loadMemories`，组件挂载时）：
```
localStorage.getItem("pupu.memoryCards.v1")
  → JSON.parse → 检查 version===1 && Array.isArray(cards)
  → ✅ 返回 cards.slice(0, 50)
  → ❌ 返回 []
```

**写入**（`saveMemories`，memoryCards 变化时 useEffect 自动触发）：
```
cards.slice(0, 50) → JSON.stringify → localStorage.setItem
quota 超限 → catch → 静默跳过
```

**删除**：`deleteMemory(id)` → `setMemoryCards(prev.filter(...))` → useEffect → `saveMemories`。

**损坏处理**：JSON 解析失败、version 不匹配、cards 非数组、localStorage 不可用 → 全部返回 `[]`，页面不崩溃。用户看到空花园。

**隐私**：记忆只保存在当前浏览器的 localStorage 中。不上传服务器、不同步、不跨设备。清除浏览器数据即永久删除。隐私模式下可能不可用。

**限制**：最多 50 条。超出自动删除最旧的。DeepSeek 上下文中注入最近 3 条摘要。

### 粒子位置叠加层级

```
currentPos
  └─ target = breathPos + driftPos(×state.drift) + pointerOffset
       ├─ breathPos: sin 呼吸 (×state.spread)
       ├─ driftPos: 圆轨漂移 (×state.drift)
       ├─ pointerOffset: 指针排斥 (130px, 16px max)
       └─ basePos: lerp → targetBase (图片采样 或 默认高斯)
       
绘制 alpha = opacity × brightnessMul(基线) × state.brightness
```

### 状态机优先级

remembering > responding > thinking > listening > idle

| 状态 | spread | brightness | breath | drift | 触发 | 持续 |
|------|--------|-----------|--------|-------|------|------|
| idle | 1.00 | 1.00 | 1.00 | 1.00 | 默认 | — |
| listening | 0.80 | 1.10 | 0.92 | 0.76 | 打字中 | — |
| thinking | 0.68 | 1.14 | 0.86 | 0.64 | API 生成中 | — |
| responding | 1.20 | 1.08 | 1.08 | 1.22 | 回复出现 | 2.2s |
| remembering | 0.72 | 1.12 | 0.94 | 0.68 | 存记忆 | 2.2s |

### Fallback 机制
- `USE_CANVAS = false` → 旧 ParticleLifeform（Framer Motion）
- `DEEPSEEK_API_KEY` 未配置 → Mock Engine（chat-engine.ts）
- Audio 文件缺失 → Mock 播放状态（UI 指示灯可切换）

### 数据持久化总览

| 数据 | 存储 | 刷新 | 上限 | 隐私 |
|------|------|------|------|------|
| Memory Cards | localStorage | ✅ 保留 | 50 条 | 仅本地浏览器 |
| 聊天历史 | React state | ❌ 消失 | — | 会话级 |
| 角色图片 | object URL | ❌ 消失 | — | 会话级 |
| Radio 频道 | React state | ❌ 消失 | — | 会话级 |
| API Key | .env.local | — | — | 仅服务端 |

## 接手指南

1. 先读设计文档：COMPANION_PERSONA → WORLD → FIRST_ARRIVAL。
2. 再读 PARTICLE_ENGINE_V2.md（Canvas 架构）+ PHASE6_ARCHITECTURE.md（AI 架构）。
3. 阅读本文件 + README + PROJECT_STATUS。
4. 配置 DeepSeek Key：`copy .env.local.example .env.local`。
5. 准备音频文件：放入 `/public/audio/`。
6. 修改后运行三检：`lint && typecheck && build`。
7. `USE_CANVAS = false` 可回退旧粒子系统。Mock Engine 永远保留。
8. localStorage 数据结构版本化（`version: 1`）。修改结构时请升级 version 号。
9. 记忆仅存本地——这是设计决策，不是未完成功能。
