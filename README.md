# PUPU &mdash; 悲伤止疼剂

> v1.2 — Persistent Memory Alpha

PUPU 是一个会陪伴人的数字生命体。

不是助手。不是工具。不是心理医生。

v1.2 实现了 Memory Garden 的浏览器本地持久化——保存的记忆卡片刷新后不再消失。记忆只保存在当前浏览器的 localStorage 中（不上传、不同步、不跨设备）。最多 50 条。数据损坏时自动恢复为空花园，不崩溃。

## 项目定位

这是一个高审美、情绪陪伴型 AI 朋友。不是聊天工具，而是一个以"数字生命体在场感"为核心的沉浸式空间。

## v1.2 当前功能

### Canvas 粒子引擎（v1.1）
- 140 个粒子，高斯分布，径向渐变光晕。rAF 驱动，ResizeObserver 自适应。
- **图片采样粒子化**：Sobel 边缘检测 + 加权采样，角色图片转化为粒子形态。
- **Pointer Interaction**：鼠标/手指靠近粒子被轻轻推开（130px，pow 2.2，max 16px）。
- **粒子状态机**：idle / listening / thinking / responding / remembering 五种姿态，lerp 平滑过渡。

### 持久化记忆（v1.2）
- **localStorage 持久化**：Memory Card 保存到浏览器本地，刷新后仍保留。
- Key：`pupu.memoryCards.v1`，版本化数据结构。最多 50 条（超出自动删除最旧）。
- 数据损坏自动恢复为空花园，不崩溃。写入 quota 超限静默跳过。
- DeepSeek 上下文注入最近 3 条记忆摘要。用户必须手动点击 Save Memory 才会保存。
- **隐私**：记忆只保存在当前浏览器。不上传服务器、不同步、不跨设备。清除浏览器数据即永久删除。

### 真实 AI + 生命感
- **DeepSeek API**：蒸馏系统提示词 ~700 tokens，上下文注入，Mock fallback。
- **语音输入**：Web Speech API 语音转文字。Firefox 不显示按钮。
- **真实背景音乐**：`/public/audio/*.mp3`，5 频道，loop。
- **5 分钟在场消息**：静默 5 分钟后轻消息（最多 2 条/会话）。
- **Radio 影响粒子 + 角色在场 Whisper**。
- **时间感知**：Morning/Day/Evening/Deep Night 自动调整粒子基线和 Whisper。
- **9 类情绪视觉**（旧 ParticleLifeform；Canvas 引擎待接入）。
- Memory Card + Memory Drawer。

### Fallback
- `USE_CANVAS = false` 回退旧 Framer Motion 粒子系统。
- `DEEPSEEK_API_KEY` 未配置时自动使用 Mock 聊天引擎。

### 设计文档（10 份）
- `COMPANION_PERSONA.md` / `WORLD.md` / `FIRST_ARRIVAL.md`
- `LIVING_PRESENCE.md` / `INNER_LIFE.md` / `THE_HUMAN.md`
- `MANIFESTATION_PLAN.md` / `PHASE6_ARCHITECTURE.md`
- `ISSUES_AND_FIX_PLAN.md` / `PARTICLE_ENGINE_V2.md`

## 技术栈

Next.js (App Router) · TypeScript · React · Tailwind CSS · Canvas 2D · Framer Motion · Web Speech API · DeepSeek API · localStorage

## 本地运行

```powershell
npm.cmd install
npm.cmd run dev       # 需要 .env.local 中的 DEEPSEEK_API_KEY
npm.cmd run build
npm.cmd run start
npm.cmd run lint / typecheck
```

## 项目结构

```text
设计文档（10 份）

app/
  globals.css / layout.tsx / page.tsx
  api/chat/route.ts

  components/
    CanvasLifeform.tsx        ← Canvas 2D 粒子引擎（主力）
    ParticleLifeform.tsx      ← Framer Motion 旧版（fallback）
    AmbientField / CharacterUploadPanel / ChatInput (语音)
    ChatMessages / CompanionPanel / MemoryDrawer
    MusicDrawer / WhisperBubble

  hooks/useCompanionState.ts  ← 含 localStorage 持久化逻辑
  lib/chat-engine.ts / system-prompt.ts / types.ts

public/audio/README.md
.env.local.example
```

## 隐私说明

| 数据 | 存储位置 | 持久化 | 说明 |
|------|---------|--------|------|
| Memory Cards | 浏览器 localStorage | ✅ 刷新保留 | `pupu.memoryCards.v1`，最多 50 条 |
| 聊天历史 | React state | ❌ 刷新消失 | 仅在当前会话 |
| 角色图片 | object URL | ❌ 刷新消失 | 仅在当前会话 |
| Radio 频道 | React state | ❌ 刷新消失 | 仅在当前会话 |
| API Key | `.env.local` | — | 仅服务端使用 |

## 开发路线图

- [x] Phase 1-5 — 全 Mock 阶段
- [x] Phase M1 — Late Night Mode
- [x] Phase 6.1-6.3 — DeepSeek AI + Voice + Living Presence
- [x] P1 — 真实背景音乐
- [x] Phase 7.0-7.3 — Canvas 引擎 + 图片采样 + 指针 + 状态机
- [x] Phase 8.0 — 持久化记忆（localStorage）
- [ ] Phase 7.4 — Canvas 视觉增强
- [ ] Phase 8.1 — 用户画像 + 记忆注入优化
- [ ] Phase 9 — 部署
