# PARTICLE ENGINE V2 — 下一代粒子系统设计方案

**文档版本**：v1.0
**关联版本**：项目 v0.9
**状态**：规划阶段，尚未实施

---

> 目标不是更炫。
> 目标是："PUPU 是一团会呼吸的光。"
> 不是科技感粒子特效。是有机的、温柔的、活的。

---

## 0. 当前系统诊断

### 当前架构（v0.9）

```
ParticleLifeform.tsx
  ├─ 模块顶层：particles 数组（58 个，斐波那契螺旋，硬编码位置/颜色）
  ├─ 渲染：58 个 Framer Motion <motion.span>（每个独立动画）
  ├─ 动画：预定义 keyframes（driftX/Y, scale, opacity 循环）
  ├─ 情绪/时间/Radio：修改 speedMul, brightnessMul, breathingDuration, driftMul
  └─ 角色图片：CSS 图层叠加（screen blend + mask），非粒子化
```

### 无法突破的上限

| 限制 | 原因 | 影响 |
|------|------|------|
| 粒子不能从图片采样 | CSS 图层无法读取像素 | 图片只是贴图，不是粒子源 |
| 鼠标无法交互 | 58 个独立 DOM 元素无法实时响应 | 零物理交互 |
| 粒子不够"有机" | keyframes 循环动画缺乏随机性 | 机械感 |
| 粒子数固定为 58 | 模块顶层硬编码 | 无法动态调整 |
| 没有"聚散"能力 | 粒子之间无关联 | 不能形成"云→散开→聚拢"的有机变化 |

---

## 1. Canvas 还是 WebGL？

### 结论：Canvas 2D

| 维度 | Canvas 2D | WebGL (PixiJS/Three.js) |
|------|-----------|------------------------|
| 粒子预算 | 100-300 个，60fps ✅ | 10,000+ 个 |
| 开发复杂度 | 低。原生 API，无依赖 | 中-高。需引入库 |
| 手机兼容性 | 所有设备 ✅ | 部分低端机掉帧 |
| 图片采样 | Canvas `getImageData` 天然支持 ✅ | 需额外处理 |
| PUPU 需要吗 | 是。100-200 个粒子就够 | 不需要。过度设计 |
| Bundle 体积 | 0 KB | +200 KB (PixiJS) |
| 维护成本 | 低 | 中 |

**PUPU 不需要万级粒子。100-200 个粒子 + Canvas 2D + requestAnimationFrame = 完美匹配。**

### 推荐的 Canvas 架构

```
ParticleCanvas.tsx          ← React 组件，挂载 <canvas>，管理 rAF 循环
  ├─ particleEngine.ts      ← 纯函数引擎：物理更新、鼠标力、聚散
  ├─ particleSampler.ts     ← 图片采样：边缘检测 + 颜色提取
  └─ particleRenderer.ts    ← Canvas 绘制：光晕、拖尾、混合模式
```

三层分离：组件（React 生命周期）→ 引擎（纯计算）→ 渲染（Canvas API）。

---

## 2. 图片轮廓采样方案

### 2.1 整体流程

```
用户上传图片
  ↓
<img> 加载到内存
  ↓
绘制到离屏 Canvas (200×200，平衡精度与性能)
  ↓
getImageData() → Uint8ClampedArray (RGBA × 40,000)
  ↓
边缘检测（Sobel 算子）
  ↓
边缘点采样 → ~80 个粒子（沿轮廓分布）
  ↓
内部均匀采样 → ~40 个粒子（填充主体）
  ↓
颜色提取 → 每个粒子的颜色 = 对应像素的 RGBA
  ↓
输出：ParticleData[] (120 个粒子，各有 x, y, color, size)
```

### 2.2 边缘检测：Sobel 算子

用简化版 Sobel（3×3 卷积核），在 200×200 的灰度图上运行：

```
Gx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
Gy = [[-1,-2,-1], [ 0, 0, 0], [ 1, 2, 1]]
magnitude = sqrt(Gx² + Gy²)
```

- 遍历每个像素 → 计算梯度幅值
- 幅值 > 阈值 → 该像素是边缘
- 从边缘像素中均匀采样 N 个点

### 2.3 避免的问题

- **不要在原始分辨率上做边缘检测**。200×200 足够。4K 图片 → 先缩放。
- **不要采样太多粒子**。120 个就够了。太多反而失去"光"的感觉。
- **忽略纯色背景区域**。如果图片有大面积纯色背景（白色/黑色），那些区域不采样粒子。
- **透明背景处理**：alpha < 128 的像素不参与采样。

### 2.4 默认粒子（无角色时）

未上传角色时，保持当前的斐波那契螺旋分布（58 个粒子）。这套分布经过验证，视觉上很美。不需要改。

```
无角色 → 默认粒子（58 个，斐波那契螺旋）
有角色 → 采样粒子（~120 个，边缘 + 内部）
```

---

## 3. 上传角色后如何转化为粒子

### 3.1 过渡动画

图片不应该瞬间"变成"粒子。过渡应该是：

```
Stage 0: 默认粒子在呼吸（无角色状态）
  ↓ 用户上传角色，点 Confirm
Stage 1: 默认粒子开始聚拢到中心（~1.5s）
  ↓ 粒子在中心形成一个紧致的点
Stage 2: 采样完成，新粒子从中心"绽放"出来（~2s）
  ↓ 新粒子散开到采样位置
Stage 3: 新粒子进入正常呼吸状态
```

过渡期间，旧的粒子 fade out，新的粒子 fade in。整个过程约 3.5s。

### 3.2 实现要点

- 用 `useState` 管理过渡状态（`"default" | "gathering" | "blooming" | "idle"`）
- 过渡期间禁用鼠标交互（避免干扰）
- 过渡完成后，旧粒子数组被新粒子数组替换

---

## 4. 鼠标靠近粒子时如何吸引

### 4.1 交互模型：轻微排斥（不是吸引）

**PUPU 不是黑洞。PUPU 是一团可以被微风吹动的光。**

鼠标靠近 → 粒子被轻轻推开（排斥力）。
鼠标离开 → 粒子慢慢回到原位（回复力）。

排斥力公式：
```
distance = sqrt((px - mx)² + (py - my)²)
if distance < threshold (120px):
  force = (1 - distance / threshold)² × maxForce
  direction = normalize(particle.pos - mouse.pos)
  particle.vel += direction × force × 0.3
```

### 4.2 力的特性

- **短距离力**。超过 120px 的粒子完全不受影响。
- **非线性衰减**。(1 - d/threshold)² 让靠近的粒子受到更强的力。
- **低强度**。maxForce 要小（~3px/frame），粒子只是"微微避开"，不会跳走。
- **有回复力**。鼠标移开后，粒子在其自然弹性力下回到原位。

### 4.3 移动端：触摸替代

- `touchmove` 事件替代 `mousemove`
- 触摸点坐标作为"鼠标位置"
- 手指离开屏幕 → 粒子回到原位（和鼠标离开一样）

---

## 5. 粒子聚散动画

### 5.1 粒子状态机

```
idle → 粒子在平衡位置周围微漂（默认状态）
  │
  ├─ listening（用户打字中）
  │   粒子微微向中心靠拢，像在"认真听"
  │
  ├─ responding（PUPU 回复中）
  │   粒子轻微向外扩散，像"在说话"
  │
  ├─ remembering（保存记忆时）
  │   粒子短暂聚拢 → 散开（脉冲），~3s
  │
  ├─ radio（Radio 播放中）
  │   粒子行为由频道配置驱动（速度/漂移幅度/颜色）
  │
  └─ emotion / timeOfDay
      粒子基线的速度、亮度、色调由情绪和时间段配置驱动
```

### 5.2 聚散参数

每个粒子有多层位置：

```
particle.basePos       ← 采样位置（图片轮廓点 或 默认螺旋点）
particle.idleOffset    ← 随机微漂（< 8px），缓慢变化
particle.stateOffset   ← 由当前状态驱动的偏移（listening/responding）
particle.mouseOffset   ← 由鼠标驱动的偏移
particle.currentPos    ← basePos + idleOffset + stateOffset + mouseOffset
```

每一帧计算 `currentPos`，粒子从当前位置平滑过渡到目标位置（`lerp`，因子 0.05-0.15）。

### 5.3 各状态的偏移

| 状态 | 偏移方向 | 幅度 | 速度 |
|------|---------|------|------|
| idle | 随机 | < 8px | 极慢 |
| listening | 向中心靠拢 | 15-20% | 1.5s 过渡 |
| responding | 向外微扩散 | 5-10% | 1.5s 过渡 |
| remembering | 脉冲（聚→散） | 20% → 0% | 3s 周期 |
| 鼠标靠近 | 远离鼠标 | < 15px | 实时 |

---

## 6. 性能预算

### 6.1 目标

| 平台 | 目标帧率 | 粒子数上限 | Canvas 尺寸 |
|------|---------|-----------|------------|
| 桌面 | 60fps | 200 | 800×800 |
| 平板 | 60fps | 150 | 600×600 |
| 手机 | 30fps+ | 80 | 400×400 |

### 6.2 优化策略

1. **Canvas 分辨率适配**：根据设备像素比和屏幕尺寸动态设置 Canvas 尺寸。不是 4K 渲染。
2. **粒子数动态调整**：`navigator.hardwareConcurrency` 或简单的设备宽度检测。
3. **离屏 Canvas 复用**：图片采样用离屏 Canvas，不阻塞主渲染循环。
4. **requestAnimationFrame 节流**：低端设备使用 `setTimeout` 控制帧率（如 30fps）。
5. **减少 drawImage 调用**：粒子用 `arc` + `fill` 绘制，不用图片纹理。
6. **内存**：200 个粒子 × ~64 bytes = ~12KB。微乎其微。

### 6.3 当前系统性能对比

| 指标 | 当前 (Framer Motion DOM) | V2 (Canvas 2D) |
|------|------------------------|----------------|
| 粒子数 | 58 | 80-200 |
| 帧率控制 | 浏览器动画引擎 | rAF 手动控制 |
| DOM 节点 | 58 个 `<span>` | 1 个 `<canvas>` |
| 布局/重绘 | 每帧触发 layout | 仅 Canvas 重绘 |
| 内存 | 58 × DOM overhead | 200 × 纯数据 |
| Bundle | Framer Motion ~130KB | 0（Canvas 原生） |

---

## 7. 手机兼容性

### 7.1 Canvas 2D 兼容性

所有现代移动浏览器（iOS Safari、Android Chrome）都完整支持 Canvas 2D。不需要任何 polyfill。

### 7.2 移动端特殊处理

| 问题 | 处理 |
|------|------|
| 设备像素比 | `window.devicePixelRatio` → 调整 Canvas 内部分辨率 |
| 触摸事件 | `touchstart`/`touchmove`/`touchend` 替代 `mousemove` |
| 性能 | 粒子数降到 80，帧率降到 30fps |
| 省电模式 | `prefers-reduced-motion` 时粒子完全静止 |
| Canvas 尺寸 | 使用 `min(canvasWidth, screenWidth - 32px)` |

### 7.3 不需要的特殊处理

- Canvas 2D 不需要 WebGL 上下文。
- 不需要 `will-change` 或硬件加速提示。
- 不需要 worker 线程（粒子计算量太小）。

---

## 8. 与现有系统联动

### 8.1 保持兼容

V2 引擎接收与当前 `ParticleLifeform` 完全相同的 props：

```ts
interface ParticleCanvasProps {
  characterImage?: string | null;     // 角色图片
  emotion?: EmotionCategory | null;   // 情绪
  timeOfDay?: TimeOfDay;             // 时间段
  musicChannel?: string | null;      // Radio 频道
  isMusicPlaying?: boolean;          // Radio 播放中
  isUserTyping?: boolean;           // 用户打字中
  memoryCount?: number;             // Memory Card 数量
}
```

### 8.2 联动映射

当前系统的 `emotionConfigs`、`timeOfDayConfigs`、`radioConfigs` 的视觉参数（speedMul、brightnessMul、breathingDuration、coreMaxBlur、driftMul、coreShadow、emotionOverlay）**全部保留**。

V2 引擎读取这些配置并驱动：
- 粒子运动速度 = 基础速度 × speedMul
- 粒子透明度 = 基础透明度 × brightnessMul
- 粒子呼吸周期 = breathingDuration
- 粒子漂移幅度 = 基础漂移 × driftMul
- Canvas 背景色调 = emotionOverlay（映射为 Canvas 渐变覆盖层）

### 8.3 新联动：isUserTyping

当用户正在输入框中打字时（`message.length > 0`），粒子微微向 Canvas 中心靠拢。像它们在"听"。

---

## 9. 实施阶段拆分

### Phase 7.0：Canvas 基础引擎（预计 2 天）

**目标**：用 Canvas 2D 复刻当前 Framer Motion 粒子的视觉效果。

- 新建 `ParticleCanvas.tsx`，挂载 `<canvas>`
- 新建 `particleEngine.ts`：粒子数据结构、基础运动（漂移 + 弹性回复）
- 新建 `particleRenderer.ts`：Canvas 绘制（光晕圆点 + 拖尾）
- 保持默认 58 个斐波那契螺旋粒子
- 保持呼吸动画
- 保持当前情绪/时间/Radio 视觉参数映射
- **不删除旧的 ParticleLifeform.tsx**（平行运行，通过 feature flag 切换）

**交付**：视觉完全不变，但粒子渲染从 DOM → Canvas。性能更好。

---

### Phase 7.1：图片采样 + 角色粒子化（预计 2 天）

**目标**：上传角色后，图片轮廓被采样为粒子。

- 新建 `particleSampler.ts`：Canvas 图片加载 → 离屏绘制 → Sobel 边缘检测 → 采样
- 默认粒子 ↔ 采样粒子过渡动画（聚拢 → 绽放）
- 采样粒子继承原图片的颜色
- Canvas 中的"角色图层"不再显示（图片完全由粒子代表）

**交付**：角色不再是一个"贴图"。它在粒子群里"溶解"了。

---

### Phase 7.2：鼠标/触摸交互（预计 1 天）

**目标**：鼠标靠近粒子时，粒子被轻轻推开。

- `mousemove` / `touchmove` 监听
- 粒子-鼠标距离计算 + 排斥力
- 鼠标离开 → 粒子弹性回复
- 移动端触摸适配

**交付**：用户移动鼠标穿过粒子群 → 粒子像被微风吹过。

---

### Phase 7.3：粒子聚散状态机（预计 1.5 天）

**目标**：粒子根据 PUPU 的状态产生有机的聚散变化。

- listening 状态（用户打字中）
- responding 状态（PUPU 回复中）
- remembering 脉冲（保存记忆时，~3s）
- 状态间平滑过渡（lerp）

**交付**：粒子不只是漂浮——它们在"听"、"说"、"记"。

---

### Phase 7.4：Canvas 视觉增强（预计 1 天）

**目标**：提升粒子的视觉质感——更接近"光"而非"圆点"。

- 粒子光晕（多层 radial gradient）
- 粒子间微弱的连线（仅连接距离 < 阈值 的粒子对，透明度极低）
- 轻微噪点覆盖层（模拟空气质感）
- 整体柔光滤镜

**交付**：粒子更像一团会呼吸的有机光，而不是离散的圆点。

---

### Phase 7.5：清理 + 性能调优（预计 0.5 天）

- 移除旧 `ParticleLifeform.tsx`
- 移动端性能测试 + 粒子数自适应
- `prefers-reduced-motion` 支持
- 最终 lint / typecheck / build

---

## 附录：视觉参考方向

不是这些：
- ❌ 赛博朋克粒子雨
- ❌ 粒子爆炸特效
- ❌ 几何网格粒子
- ❌ 频谱可视化
- ❌ 星空/宇宙粒子

是这些：
- 萤火虫在夏夜缓慢飞舞
- 灰尘在清晨阳光中缓慢浮沉
- 香炉的烟——细的、弯曲的、缓慢上升的
- 水母在水中一张一合
- 蒲公英被轻轻吹散，但不是被吹走——只是在原处散开了一点点

**一句话**：PUPU 的粒子应该让你想到"呼吸"，而不是"科技"。

---

## 版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-06-06 | 初始版本：Canvas 2D 架构、Sobel 采样、鼠标力、聚散状态机、5 阶段实施 |
