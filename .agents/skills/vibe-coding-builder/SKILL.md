---
name: vibe-coding-builder
description: Use this skill when planning or implementing the AI companion app while preserving emotional tone, aesthetic direction, product coherence, and careful scope. Trigger when the user asks to build, scaffold, code, refactor, or plan features for the companion, chat, diary, memory, music, character upload, particle lifeform, or immersive UI. Always respect requests to plan skills or architecture before writing business code.
---

# Vibe Coding Builder

## 触发场景

当任务进入“怎么开发、怎么拆功能、怎么落地代码、怎么保持审美和体验一致”时使用本 Skill。典型请求包括：

- 开发聊天、日记、记忆、音乐、角色上传、粒子生命体等功能。
- 搭建项目结构、组件体系、状态管理、数据模型或接口。
- 把高审美情绪陪伴方向转成可执行的开发步骤。
- 用户明确要求“先不要开发功能，只做规划/Skill/架构”时，也使用本 Skill 来守住范围。

## 核心原则

- **先保护气质，再写功能**：不要为了快把产品做成普通聊天工具。
- **小步验证**：每次只实现一个可体验的闭环，避免一次堆满功能。
- **体验即架构**：聊天、记忆、音乐、角色和粒子生命体应共享情绪状态，而不是互相孤立。
- **默认可回退**：复杂动效、音频和记忆系统都要有低配、静音、无记忆模式。
- **不抢用户控制权**：所有自动化行为都应可关闭、可解释。
- **不写用户没要的业务代码**：如果用户要求先规划，只创建规划产物。

## 开发规范

- 开始前确认当前阶段：Skill 设计、产品架构、原型、MVP、功能实现、视觉打磨、测试。
- 将系统拆成核心域：companion、memory、diary、music、character、atmosphere-ui。
- 优先建立共享情绪上下文：mood、energy、interaction_state、music_mode、memory_cue。
- 组件命名要贴合产品气质，但代码职责要清晰，不用玄学命名掩盖逻辑。
- UI 原型先保证主界面生命体、输入区、基础陪伴回应，再加日记和音乐。
- 业务实现要保留用户数据控制：记忆开关、日记私密、角色资源删除。
- 每次开发后做体验检查：移动端、低性能、无音频、减少动效、空状态。

## 示例

### 示例 1：合适的迭代顺序

```text
1. 主界面氛围和粒子生命体静态/待机态
2. 基础聊天输入和温柔回应展示
3. 情绪状态驱动粒子变化
4. 日记记录和回看
5. 长期记忆确认与管理
6. 背景音乐模式
7. 上传角色形象与角色展示
```

### 示例 2：共享状态

```ts
type CompanionAtmosphere = {
  mood: "calm" | "tired" | "bright" | "lonely" | "focused";
  energy: number;
  interactionState: "idle" | "listening" | "responding" | "remembering";
  musicMode?: "night" | "soft-focus" | "rain-room";
};
```

### 示例 3：范围控制

用户：“先生成 Skills，不写业务代码。”

正确行为：只创建 `.agents/skills/*/SKILL.md`。

错误行为：顺手创建 React 页面、后端接口或数据库模型。

## 禁止事项

- 禁止在用户要求规划时擅自开发业务功能。
- 禁止把项目做成普通客服聊天、SaaS dashboard 或模板落地页。
- 禁止一次性引入过多框架、状态库、动画库和复杂后端。
- 禁止隐藏用户数据流向或默认开启不可解释的记忆。
- 禁止为了视觉效果牺牲输入、阅读、性能和可访问性。
- 禁止未经确认接入真实外部音乐、部署、支付或用户数据服务。
