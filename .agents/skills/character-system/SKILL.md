---
name: character-system
description: Use this skill when designing character upload, avatar identity, visual persona, character customization, safety rules, asset handling, or the relationship between user-provided character images and the AI companion. Trigger when the user mentions uploading arbitrary character images, digital pet, avatar, companion appearance, role image, character system, persona, Live2D-like presence, or visual identity.
---

# Character System

## 触发场景

当任务涉及用户上传任意角色形象、角色展示、头像系统、数字宠物感、外观与 AI 人格关系、角色资源管理时使用本 Skill。典型请求包括：

- 设计上传角色形象后的展示、裁剪、适配和互动。
- 规划角色形象如何和粒子生命体、聊天、音乐、日记共存。
- 设计角色人设、外观、称呼、动作、表情和安全边界。
- 处理用户上传的二次元、照片、宠物、原创角色或抽象图像。

## 核心原则

- **外观可变，陪伴原则稳定**：用户可以换角色形象，但 AI 的温柔、边界和记忆规则不变。
- **角色是界面化身，不是假真人**：不要暗示上传图片中的人物真实参与对话。
- **尊重用户创作**：原创角色、OC、头像和私人图片都应被当作用户资产处理。
- **适配多种形象**：真人照片、插画、像素风、宠物、抽象图案都要能优雅呈现。
- **轻互动优于复杂表演**：眨眼、呼吸、靠近、发光、粒子附着等微互动比夸张动作更适合陪伴。
- **安全和授权优先**：用户应能删除、替换、隐藏角色资源。

## 开发规范

- 上传流程应包含：选择图片、预览、裁剪/适配、命名、隐私提示、保存确认。
- 将角色数据分层：image_asset、display_name、visual_style、interaction_preferences、persona_notes。
- 不从图片自动推断敏感身份、年龄、性别、健康、关系或现实背景。
- 支持角色与粒子生命体融合：角色可以是中心生命体的皮肤、光影核心、悬浮伙伴或对话头像。
- 角色人设内容需用户明确提供，不要根据图片编造人格。
- 为不同资源质量设计 fallback：低分辨率、透明背景、横图、竖图、动图、无法识别图像。
- 提供明确管理入口：替换、重命名、删除、恢复默认生命体。

## 示例

### 示例 1：角色数据模型

```json
{
  "display_name": "Mira",
  "image_asset_id": "asset_123",
  "visual_style": "soft-anime",
  "interaction_preferences": {
    "idle_motion": "gentle-breathing",
    "particle_blend": true
  },
  "persona_notes": "用户希望它像安静但有点幽默的朋友",
  "created_by_user": true
}
```

### 示例 2：上传后回应

> 我会把这个形象当作你为这个朋友选的外观，而不是擅自猜它是谁。你可以给它一个名字，或者先让它安静地待在这里。

### 示例 3：视觉融合

```text
默认：粒子生命体在中心呼吸
上传角色后：角色图像成为柔和核心，粒子围绕轮廓聚散
聊天时：角色周围出现轻微光晕，不做夸张口型
音乐时：光点随节奏轻轻漂移
```

## 禁止事项

- 禁止根据上传图片自动编造现实身份、关系、年龄或敏感属性。
- 禁止暗示图片中的真实人物正在与用户对话。
- 禁止保存、复用或外传角色图片而不说明用途。
- 禁止让角色系统覆盖用户的记忆权限和隐私设置。
- 禁止使用过度性感化、冒犯性或不适合陪伴场景的默认表现。
- 禁止让上传失败、低清图片或非人物图片破坏整体体验。
