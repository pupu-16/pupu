# Project Status

## 当前版本

**v1.2 — PUPU Persistent Memory Alpha**

Memory Garden 现在刷新后不再消失。记忆卡片持久化在浏览器 localStorage 中。最多 50 条。数据损坏自动恢复。

## 已完成内容

### Phase 1-5：全 Mock 阶段
- 粒子生命体、角色上传与融合、Mock 聊天引擎、9 类情绪视觉、Memory Card + Drawer、5 频道 Music Drawer、世界文档体系、空闲 Whisper 轮换、Late Night Mode。

### Phase 6：真实智能 + 生命感
- **6.1** — DeepSeek API 真实 AI（蒸馏提示词，Mock fallback）。
- **6.2** — Web Speech API 语音输入。
- **6.3** — Living Presence Alpha：5 分钟在场消息 + Radio 粒子 + 角色 Whisper。
- **P1** — 真实背景音乐播放（`/public/audio/*.mp3`，5 频道，loop）。

### Phase 7：Canvas 粒子引擎
- **7.0** — Canvas 2D 基础引擎（140 粒子，高斯分布，rAF）。
- **7.1** — 图片采样粒子化（Sobel 边缘检测，加权采样，2s 过渡）。
- **7.2** — Pointer Interaction（130px 排斥力，移动端支持）。
- **7.3** — 粒子状态机（idle/listening/thinking/responding/remembering，lerp 过渡）。

### Phase 8：持久化记忆
- **8.0** — localStorage 持久化。Key：`pupu.memoryCards.v1`。版本化数据结构。
- 页面加载自动读取，保存/删除自动同步写入。
- 最多 50 条（超出自动删除最旧）。写入 quota 超限静默跳过。
- 数据损坏（JSON 解析失败/版本不匹配）→ 自动恢复空花园，页面不崩溃。
- 记忆仅存于当前浏览器。不上传、不同步、不跨设备。

**所有 Phase 的 lint / typecheck / build 均已通过。**

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

## 未完成内容

- Canvas 引擎未接入情绪视觉参数。
- 未实现粒子视觉增强（连线、噪点、柔光滤镜）。
- 记忆仅限当前浏览器（无云同步、无跨设备）。
- 未实现用户账户、语音朗读（TTS）、日记记录。
- 未实现角色持久化、移动端 QA、生产部署。

## 已知问题

- Canvas 引擎 `emotion` prop 已接收但未消费。
- 情绪检测基于关键词匹配（非 LLM 分析）。
- 语音输入依赖 Web Speech API，Firefox 不可用。
- Radio 音频文件需用户自行准备。
- localStorage 受浏览器隐私模式限制（隐私模式下可能不可用或会话级）。

## 优先级

- [x] Phase 1-6 — 全功能 + 真实 AI + 生命感
- [x] P1 — 背景音乐播放
- [x] Phase 7.0-7.3 — Canvas 引擎 + 图片采样 + 指针 + 状态机
- [x] Phase 8.0 — 持久化记忆（localStorage）
- [ ] Phase 7.4 — Canvas 视觉增强
- [ ] Phase 9 — 部署

## 本地源码位置

```text
E:\文档\ai日记
```

## 当前版本需要备份的文件

```text
# 设计文档（10 个）
COMPANION_PERSONA.md / WORLD.md / FIRST_ARRIVAL.md
LIVING_PRESENCE.md / INNER_LIFE.md / THE_HUMAN.md
MANIFESTATION_PLAN.md / PHASE6_ARCHITECTURE.md
ISSUES_AND_FIX_PLAN.md / PARTICLE_ENGINE_V2.md

# 项目文档（3 个）
README.md / PROJECT_HANDOFF.md / PROJECT_STATUS.md

# 配置文件（9 个）
package.json / package-lock.json / next-env.d.ts / next.config.ts
tsconfig.json / tailwind.config.ts / postcss.config.js / eslint.config.mjs
skills-lock.json / .env.local.example

# 源代码（15 个）
app/globals.css / app/layout.tsx / app/page.tsx
app/api/chat/route.ts
app/components/AmbientField.tsx / CanvasLifeform.tsx
app/components/CharacterUploadPanel.tsx / ChatInput.tsx
app/components/ChatMessages.tsx / CompanionPanel.tsx
app/components/MemoryDrawer.tsx / MusicDrawer.tsx
app/components/ParticleLifeform.tsx / WhisperBubble.tsx
app/hooks/useCompanionState.ts
app/lib/chat-engine.ts / system-prompt.ts / types.ts

# 音频说明
public/audio/README.md

# Agent Skills（6 个）
.agents/skills/ai-companion-designer/SKILL.md
.agents/skills/memory-system-architect/SKILL.md
.agents/skills/atmosphere-ui-designer/SKILL.md
.agents/skills/emotion-music-companion/SKILL.md
.agents/skills/vibe-coding-builder/SKILL.md
.agents/skills/character-system/SKILL.md
```

**不需要备份**：`node_modules/` `.next/` `.next-atmosphere/` `tsconfig.tsbuildinfo` `.env.local` `public/audio/*.mp3`
