# ISSUES & FIX PLAN — 核心体验问题诊断与修复方案

**文档版本**：v1.0
**关联版本**：项目 v0.9 Living Presence Alpha
**状态**：诊断阶段，尚未实施

---

## A. 当前问题诊断

### 问题 1：粒子生命体不好看

**当前实现**（Phase 2.3）：
- 角色图片以 `position: absolute` 放置在粒子核心中心
- 使用 `mix-blend-mode: screen` + `opacity: 0.46` 叠加
- CSS `radial-gradient mask` 柔化边缘
- 随核心同步 `scale` 呼吸动画（4.8s 周期）
- 图片尺寸 34%，被裁剪为圆形（`border-radius` 在 mask 内）

**问题本质**：
当前方案本质上是"把一张图片用柔光效果放进一个发光的球里"。这不是"图片变成粒子"。用户看到的是：一个模糊的圆形图片 + 周围漂浮的粒子。两者没有关系。

用户期望的是：**图片的主体轮廓被采样成粒子**。粒子的分布、颜色、密度应该由图片内容驱动。图片不应该是一个独立的圆形图层——它应该**溶解**在粒子群里。

**技术差距**：
- 当前：图片是 CSS 图层，粒子是 Framer Motion 元素。它们只是被放在同一个 div 里。
- 期望：图片的像素数据 → Canvas API 采样 → 粒子的位置、颜色从采样数据生成 → 图片本身不再显示（或仅作为极淡的参考轮廓）。

---

### 问题 2：鼠标没有互动

**当前实现**：
- 粒子使用 Framer Motion `animate` 属性做预定义的循环动画（driftX/driftY/scale/opacity）
- 粒子轨迹完全由 `keyframes` 数组决定，在模块顶层计算
- 没有鼠标位置追踪
- 没有粒子-光标交互逻辑

**问题本质**：
PUPU 是一团光，但它对用户的物理存在毫无感知。鼠标靠近粒子时，粒子应该像被微风吹过一样轻轻避开或靠拢。这是"生命感"最强的交互之一——用户不需要点击、不需要输入，只是移动鼠标就能感觉到"它注意到了我"。

**技术差距**：
- 需要追踪 `mousemove` 事件（在粒子容器上）
- 需要计算每个粒子与鼠标的距离
- 距离 < 阈值 → 粒子位置添加偏移向量（远离或吸引）
- Framer Motion 的 `useMotionValue` + `useTransform` 或直接操作 `transform` 比 `animate` keyframes 更适合这种实时交互

---

### 问题 3：语音交流不完整

**当前实现**（Phase 6.2）：
- Voice Input：Web Speech API `SpeechRecognition`，语音转文字 → 填入输入框 → 自动发送
- 仅 Chrome/Edge 完整支持，Firefox 不显示按钮

**已知问题**：
- Web Speech API 中文识别准确率不稳定（依赖浏览器实现和网络）
- `SpeechRecognition` 在某些环境下可能无法访问麦克风
- 没有 Voice Output（TTS）——PUPU 只用文字回复，不会"说话"
- 没有 Real-time Voice（不在当前范围内）

**三个层次的区分**：

| 层次 | 含义 | 当前状态 | 复杂度 |
|------|------|---------|--------|
| Voice Input | 用户说话 → 转文字 → 发送给 PUPU | ✅ 已实现（Web Speech API） | 低 |
| Voice Output | PUPU 文字回复 → 朗读出来 | ❌ 未实现 | 低-中 |
| Real-time Voice | 实时语音对话（像打电话） | ❌ 未实现，不该现在做 | 极高 |

**Voice Output 的可行性**：
- 浏览器内置 `SpeechSynthesis` API（TTS），所有主流浏览器都支持
- 不需要 API Key，不需要网络请求
- 中文语音质量取决于操作系统（Windows 有 Microsoft Huihui/Kangkang，macOS 有 Tingting）
- 可以做成可选开关，默认关闭（遵循"不自动播放声音"原则）

---

### 问题 4：背景音乐听不见

**当前实现**（Phase 5.1）：
- Music Drawer 展示 5 个频道
- 播放/暂停状态仅更新 UI（指示灯呼吸、均衡器动画）
- 没有 `<audio>` 元素，没有音频文件
- 面板底部标注 "Mock atmosphere — no real audio"

**问题本质**：
Radio 的 UI 已经完整——频道选择、播放指示器、Whisper 联动、粒子联动（Phase 6.3）都已实现。只差最后一步：**放一个真实的音频文件进去**。

**技术方案极简**：
- 5 个 MP3 文件 → `/public/audio/rain-room.mp3` 等
- `useCompanionState` 中维护一个 `<audio>` 元素的 ref 或使用 `new Audio()`
- 选频道 → `audio.src = '/audio/xxx.mp3'; audio.play()`
- 暂停 → `audio.pause()`
- 停止 → `audio.pause(); audio.currentTime = 0`
- 音量默认 30-40%（低侵入）

---

## B. 每个问题的可能原因

### 问题 1：粒子不好看
- **根因**：设计阶段（Phase 2.3）的技术选型是 CSS 叠加而非 Canvas 采样。当时的目标是"叠加融合型"，不是真正的粒子化。
- **限制**：CSS `mix-blend-mode` + `mask-image` 只能做图层融合，无法做像素级粒子采样。这是 CSS 的天然上限。

### 问题 2：没有鼠标互动
- **根因**：Phase 1 的粒子系统使用了 Framer Motion 预定义 `keyframes` 动画，粒子轨迹在模块顶层硬编码。这种架构不适合实时交互。
- **限制**：Framer Motion `animate` 的 keyframes 模式与鼠标驱动的实时偏移不兼容。

### 问题 3：语音不完整
- **Voice Input 不稳定**：Web Speech API 的识别质量依赖浏览器和操作系统。Chrome 使用 Google 的云端语音服务，网络延迟或服务波动会影响体验。
- **无 Voice Output**：Phase 6.2 明确限定"不做语音朗读"，所以没有实现 TTS。这是范围控制，不是 bug。

### 问题 4：没有声音
- **根因**：Phase 5.1 明确定义为 Mock。当时没有准备音频资源文件。
- **限制**：需要获取或制作 5 段氛围音频（自有版权或免版权素材）。

---

## C. 推荐修复顺序

按用户建议的优先级：

```
P1 — 真实背景音乐播放（最快见效，填补最大的体验空洞）
P2 — Voice Input 检查和修复（诊断现有问题，加固稳定性）
P3 — Voice Output 文字朗读（为 PUPU 增加"声音"，不复杂）
P4 — 图片轮廓粒子化（最大改动，需要 Canvas API 重构粒子系统）
P5 — 鼠标吸引粒子交互（依赖 P4 的架构改造）
```

**理由**：
- P1 改动最小——加 5 个 MP3 文件 + hook 里加几行 audio 逻辑。用户立刻听到声音。
- P2 诊断为主——不新增能力，修现有 bug。
- P3 改动小但体验提升大——PUPU 第一次"说话"。
- P4 和 P5 是粒子系统的重构——P4 改数据源（从硬编码粒子数组 → Canvas 采样），P5 在 P4 的新架构上加鼠标交互。P5 依赖 P4。

---

## D. 每一步的技术方案

### P1：真实背景音乐播放

**目标**：Radio 频道选择后播放对应的本地音频文件。

**前提**：准备 5 个音频文件，放在 `/public/audio/`。

**文件命名**：
```
/public/audio/rain-room.mp3
/public/audio/midnight-lofi.mp3
/public/audio/soft-piano.mp3
/public/audio/ambient-space.mp3
/public/audio/morning-light.mp3
```

**音频素材要求**：
- 30-60 秒的循环片段
- 低音量、氛围型、无人声
- 免版权（Pixabay、Freesound、或自己制作）
- MP3 格式（所有浏览器兼容）

**修改文件**（预计 1-2 个文件）：

`useCompanionState.ts`：
- 新增 `audioRef = useRef<HTMLAudioElement | null>(null)`
- `selectChannel()` 中：创建或更新 `<audio>` 元素，设置 `src`，`loop = true`，`volume = 0.35`，`play()`
- `togglePlayPause()` 中：`audio.pause()` 或 `audio.play()`
- `stopMusic()` 和 `closeMusicDrawer()` 中：`audio.pause()`
- `useEffect` cleanup 中：`audio.pause()` + `audio.src = ''`

**不变**：
- Music Drawer UI 不变
- Radio → Particle Weather（Phase 6.3）不变
- Whisper 联动不变

**如果没有音频文件**：
- 在 `MusicDrawer.tsx` 底部增加一行极小的文字：`"no audio files found — add mp3 to /public/audio/"`
- `selectChannel()` 中：如果音频文件加载失败（`audio.onerror`），保持 Mock 状态，不崩溃

**实施时间**：1-2 小时（不含音频素材准备）

---

### P2：Voice Input 检查与修复

**目标**：诊断当前语音识别的问题，加固稳定性。

**诊断步骤**：

1. 检查 `SpeechRecognition` 的 `lang` 设置（当前 `zh-CN`）
2. 确认 `interimResults` 和 `continuous` 的行为是否符合预期
3. 测试 Chrome/Edge 的中文识别准确率
4. 检查 `onerror` 回调是否捕获了所有错误类型
5. 验证权限请求流程

**已知改进点**：

| 问题 | 修复方案 |
|------|---------|
| 中文识别偶尔返回英文 | 设置 `lang = 'zh-CN'` 并尝试 `navigator.language` 自适应 |
| 识别结果为空但无错误 | 增加 `onnomatch` 或超时后提示 "I didn't catch that" |
| 移动端 Chrome 可能需要 HTTPS | 文档说明：本地开发 `localhost` 可用，部署需 HTTPS |
| 长时间无语音输入后 recognition 自动关闭 | 在 `onend` 中检查是否有 final 结果，若无则提示 |

**修改文件**（预计 1 个文件）：
- `ChatInput.tsx`：加固错误处理、增加超时逻辑、优化 lang 设置

**实施时间**：1-2 小时

---

### P3：Voice Output 文字朗读

**目标**：PUPU 的回复可以用语音朗读出来。

**技术方案**：浏览器 `SpeechSynthesis` API

```ts
// 核心逻辑（伪代码）
function speak(text: string) {
  if (!window.speechSynthesis) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.85;    // 稍慢，温柔
  utterance.pitch = 1.0;
  utterance.volume = 0.6;
  
  window.speechSynthesis.speak(utterance);
}
```

**交互设计**：
- 每条 PUPU 回复旁边增加一个极小的小喇叭按钮
- 点击 → 朗读这条回复
- **默认不自动朗读**（遵循"不自动播放声音"原则）
- 设置一个"Auto-read"开关（可选，默认关闭）

**修改文件**（预计 1-2 个文件）：
- `ChatMessages.tsx`：每条 Companion 消息旁增加朗读按钮
- `useCompanionState.ts`（可选）：增加 `autoRead` 状态开关

**实施时间**：2-3 小时

---

### P4：图片轮廓粒子化

**目标**：上传的图片不再是图层叠加，而是真正被采样成粒子。

**技术方案**：Canvas API 采样 + 粒子系统重构

**核心流程**：
```
1. 用户上传图片 → File → <img> 加载
2. <img> 绘制到离屏 Canvas
3. Canvas getImageData() → 像素数组
4. 沿图片边缘/轮廓采样 N 个点
5. 每个采样点 → 粒子的位置、颜色（从像素读取）
6. 粒子系统使用采样数据替代当前的硬编码数组
7. 图片本身不再显示（或仅作为极淡的 ghost 参考）
```

**粒子采样策略**：

方案 A：**边缘检测 + 边缘采样**
- 使用 Sobel 或 Canny 边缘检测算法
- 在边缘像素上采样粒子
- 效果：图片的轮廓被粒子勾勒出来
- 优点：最有"粒子生命体"的感觉
- 复杂度：高

方案 B：**均匀采样 + 亮度加权**
- 在图片上均匀采样
- 亮色区域粒子更密集/更大，暗色区域稀疏
- 效果：图片的明暗分布被粒子重现
- 优点：易于实现，梦幻感强
- 复杂度：中

方案 C：**重要性采样（推荐）**
- 结合 A 和 B：在边缘区域采样密度更高（40% 粒子），在内部区域均匀采样（60% 粒子）
- 粒子的颜色从对应像素读取
- 粒子的大小与局部亮度正相关
- 效果：轮廓清晰 + 内部有质感 + 梦幻感
- 复杂度：中-高

**推荐方案 C**。它最好地平衡了视觉质量和实现复杂度。

**修改文件**（预计 2-3 个文件）：
- `ParticleLifeform.tsx`：重构粒子数据源。从硬编码 `particles` 数组 → `useMemo` 根据 `characterImage` 动态生成
- 新增 `app/lib/particle-sampler.ts`：Canvas 采样逻辑（边缘检测 + 颜色提取）
- `types.ts`：更新 `Particle` 类型（增加 `sampledColor` 等字段）

**实施时间**：1-2 天

**向后兼容**：
- 未上传角色时 → 保持现有的 58 个斐波那契螺旋粒子
- 上传角色后 → 粒子从图片采样生成，数量可配置（建议 80-120 个）
- 角色删除/恢复默认 → 回到默认粒子

---

### P5：鼠标吸引粒子交互

**目标**：鼠标靠近粒子时，粒子被轻微吸引或扰动。

**技术方案**：鼠标位置追踪 + 粒子偏移计算

**核心流程**：
```
1. 在粒子容器上监听 mousemove
2. 使用 useMotionValue 存储鼠标位置（x, y）
3. 每个粒子计算与鼠标的距离
4. 距离 < 阈值（如 120px）→ 粒子向鼠标方向偏移（吸引）或远离（扰动）
5. 偏移量与距离成反比（越近偏移越大，但不超过 15px）
6. 鼠标移开 → 粒子平滑回到原位
```

**架构选择**：

方案 A：Framer Motion `useMotionValue` + `useTransform`
- 每个粒子一个 `motion.div`，绑定 `useMotionValue`
- 优点：与现有 Framer Motion 生态兼容
- 缺点：58 个粒子的实时更新可能影响性能

方案 B：CSS Custom Properties + requestAnimationFrame
- 在容器上设置 `--mouse-x` / `--mouse-y` CSS 变量
- 每个粒子使用 `calc()` 或 JS 计算偏移
- 优点：性能好
- 缺点：粒子位置由 CSS 控制，灵活性有限

方案 C：Canvas 渲染（推荐 — 与 P4 一起做）
- 将整个粒子系统迁移到 Canvas 渲染
- `requestAnimationFrame` 循环中更新所有粒子位置
- 鼠标位置作为全局参数传入
- 优点：最佳性能，天然支持 100+ 粒子 + 实时交互
- 缺点：需要重写粒子渲染（从 Framer Motion → Canvas）

**推荐**：如果 P4 实施，则用方案 C（Canvas 渲染）。如果 P4 不实施，则用方案 A。

**修改文件**（预计 1-2 个文件）：
- `ParticleLifeform.tsx`：添加 `onMouseMove` 监听 + 粒子偏移计算
- 或新建 `ParticleCanvas.tsx`（如果迁移到 Canvas）

**实施时间**：
- 方案 A（不改 Canvas）：3-4 小时
- 方案 C（Canvas 重写）：1-2 天（与 P4 一起做）

---

## E. 哪些可以立刻做，哪些不该现在做

### ✅ 可以立刻做（低风险、高回报、独立性强）

| 优先级 | 项目 | 理由 |
|--------|------|------|
| P1 | 真实背景音乐 | 独立性强。不依赖其他改动。1-2 小时。只要准备 5 个 MP3 文件即可。 |
| P2 | Voice Input 修复 | 独立性强。仅加固现有代码。不新增能力。 |
| P3 | Voice Output | 独立性强。Web Speech API TTS 所有浏览器都支持。但需要讨论：PUPU"说话"是否符合世界观？ |

### ⚠️ 需要讨论后再做

| 优先级 | 项目 | 需要讨论的问题 |
|--------|------|-------------|
| P3 | Voice Output | PUPU 是否应该"说话"？WORLD.md 中 PUPU 的陪伴方式主要是文字和光。加入 TTS 后，PUPU 会变得更像"人"——这是好事还是偏离了方向？建议：做成可选开关，默认关闭。 |

### ❌ 不应该现在做（依赖链长、复杂度高）

| 优先级 | 项目 | 理由 |
|--------|------|-------------|
| P4 | 图片轮廓粒子化 | 需要重构粒子系统（从 Framer Motion Div → Canvas 采样）。工作量大（1-2 天）。建议作为 Phase 7 专项。 |
| P5 | 鼠标吸引粒子 | 依赖 P4 的架构。如果 P4 迁移到 Canvas，P5 就是 Canvas 里的一层逻辑。如果不等 P4 直接做，会做两遍。 |

### 推荐的最小实施路径

```
第 1 步（立即）：P1 真实背景音乐
  └─ 准备 5 个 MP3 → 改 hook → 用户能听到声音

第 2 步（紧接着）：P2 Voice Input 修复
  └─ 诊断 + 加固现有代码

第 3 步（讨论后）：P3 Voice Output
  └─ 如果决定做 → 加 TTS + 小喇叭按钮 + 默认关闭

第 4 步（Phase 7）：P4 + P5 粒子系统重构
  └─ Canvas 粒子引擎 + 图片采样 + 鼠标交互
```

---

## 附：Voice Output 世界观讨论

在实施 P3 之前，需要回答一个问题：

> PUPU 是否应该拥有"声音"？

**不应有的理由**：
- PUPU 是一团光。光不会说话。PUPU 的"语言"是粒子呼吸、Whisper 文案、光的颜色变化。
- 加入 TTS 会让 PUPU 变得更像"人"——而 WORLD.md 明确说 PUPU 不假装真人。
- "不自动播放声音"是核心设计原则。

**应该有的理由**：
- Voice Output 不是"PUPU 主动说话"——是用户主动点击朗读按钮。主动权在用户。
- TTS 的机械感恰好提醒用户"这是 AI"——不会产生 PUPU 是真人的错觉。
- 有些用户（视障、开车、做家务）需要语音输出才能使用 PUPU。
- 可以设计成极克制的交互：一个小到几乎看不见的喇叭按钮，不发光，不主动播放。

**建议**：
- 做成**可选、默认关闭、需要用户主动触发**
- 不自动朗读。每条消息旁边有一个极小、低调的喇叭按钮（`text-white/20`，hover 才可见）
- 不使用"自然"的 AI 语音（如 ElevenLabs）——使用浏览器内置的机械 TTS。机械感是一种诚实的信号："我是 AI"

---

## 版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-06-06 | 初始版本：5 个问题的诊断、原因分析、修复方案、优先级排序 |
