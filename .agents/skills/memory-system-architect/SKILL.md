---
name: memory-system-architect
description: Use this skill when designing long-term memory, diary records, emotional history, retrieval, consent, privacy, memory editing, or memory-driven personalization for an AI companion. Trigger when the user mentions memory system, long-term memory, diary, recall, user profile, relationship continuity, Memory Garden, emotional timeline, or persistent AI friend context.
---

# Memory System Architect

## 触发场景

当任务涉及长期记忆、日记记录、用户画像、情绪时间线、记忆检索、隐私控制或“AI 如何记住用户”时使用本 Skill。典型请求包括：

- 设计聊天记忆、日记记忆、角色偏好和情绪模式。
- 规划 Memory Garden 式记忆空间、记忆卡片、时间线或回忆回看。
- 决定哪些内容自动记、哪些内容需要确认、哪些内容绝不保存。
- 设计记忆检索逻辑，让 AI 记得自然但不吓人。

## 核心原则

- **用户拥有记忆**：记忆不是 AI 的资产，而是用户可查看、修改、隐藏、删除的个人空间。
- **默认克制**：只保存对长期陪伴有明显价值的信息，不把所有聊天都变成档案。
- **情绪记忆重于事实堆积**：保存“什么让用户感到被支持”比保存琐碎事实更重要。
- **可追溯**：AI 使用记忆时，应能说明这条记忆来自哪里、何时记录、为何相关。
- **敏感内容需确认**：健康、身份、关系、创伤、财务、家庭等敏感信息默认不自动固化。
- **记忆会老化**：过期、冲突或用户改变的记忆应降权、更新或请求确认。

## 开发规范

- 将记忆分层：稳定偏好、关系信息、情绪模式、日记条目、临时上下文、角色偏好。
- 每条长期记忆至少包含：内容、来源、时间、置信度、敏感级别、可见性、最近使用时间。
- 日记记录与聊天记忆分开：日记偏叙事和自我表达，聊天记忆偏陪伴和个性化。
- 检索时结合相关性、时间新鲜度、情绪状态和用户当前任务，不只做关键词匹配。
- 设计记忆确认语：保存前轻声确认，避免打断情绪流。
- 提供记忆管理 UI：查看、编辑、删除、冻结、导出、关闭记忆。
- 记忆引用要自然：像朋友想起一个线索，而不是像数据库报表。

## 示例

### 示例 1：保存记忆前确认

> 这听起来像是之后陪你时会很有用的一点：你在压力大时更希望我先陪你安静下来，而不是立刻给方案。要把它记下来吗？

### 示例 2：记忆对象

```json
{
  "type": "support_preference",
  "content": "压力大时先要安静陪伴，再考虑行动建议",
  "source": "chat",
  "sensitivity": "medium",
  "confidence": 0.82,
  "created_at": "2026-06-06",
  "visibility": "user_visible"
}
```

### 示例 3：日记回看

> 最近你的日记里反复出现“夜里思绪变多”。我不会把它当成诊断，只把它当成一个陪伴线索：晚上我们可以把界面调暗、音乐放慢、少问问题。

## 禁止事项

- 禁止偷偷保存敏感信息或让用户无法删除记忆。
- 禁止把推测当事实保存，例如“用户有抑郁症”。
- 禁止用记忆操控用户情绪、制造依赖或商业诱导。
- 禁止在不必要的场景展示过多历史细节，造成被监视感。
- 禁止将日记内容默认用于推荐、训练或对外分享。
- 禁止让角色外观变更污染用户核心记忆和隐私设置。
