# DEPLOYMENT CHECKLIST — PUPU v1.2 部署准备文档

**文档版本**：v1.0
**关联版本**：项目 v1.2 Persistent Memory Alpha
**目标平台**：Vercel
**状态**：检查阶段，尚未部署

---

## 1. 当前项目是否适合部署到 Vercel

**结论：✅ 完全适合。**

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Next.js App Router | ✅ | Vercel 原生支持，零配置 |
| API Route (`/api/chat`) | ✅ | Vercel Serverless Functions 原生支持 |
| 静态资源 (`/public/audio/`) | ✅ | Vercel 自动部署 public 目录 |
| 无数据库依赖 | ✅ | 无需配置数据库 |
| 无外部服务依赖（除 DeepSeek） | ✅ | 仅需一个环境变量 |
| Build 通过 | ✅ | `npm run build` 零错误 |
| TypeScript 严格模式 | ✅ | `tsc --noEmit` 零错误 |
| ESLint | ✅ | 零错误零警告 |

**不适合的部分**：无。PUPU 是纯 Next.js 应用，不依赖任何 Vercel 不支持的特性。

---

## 2. 部署前必须检查的文件

### 必须提交到 Git 的文件

```
✅ 所有源代码（app/）
✅ 配置文件（package.json, tsconfig.json, next.config.ts, tailwind.config.ts, etc.）
✅ public/ 目录
✅ .env.local.example（不含真实 Key）
✅ 锁文件（package-lock.json）
✅ README.md / PROJECT_STATUS.md / PROJECT_HANDOFF.md
✅ 所有设计文档（*.md）
```

### 绝不能提交到 Git 的文件

```
❌ .env.local（含 DEEPSEEK_API_KEY）
❌ node_modules/
❌ .next/
❌ .next-atmosphere/
❌ tsconfig.tsbuildinfo
```

### 检查 .gitignore

确认以下条目存在：

```gitignore
.env.local
node_modules/
.next/
.next-atmosphere/
tsconfig.tsbuildinfo
```

如果项目还没有 `.gitignore`，需要创建。

---

## 3. `.env.local` 与 Vercel Environment Variables 的对应关系

| 本地 (.env.local) | Vercel Dashboard | 说明 |
|-------------------|-----------------|------|
| `DEEPSEEK_API_KEY=sk-...` | `DEEPSEEK_API_KEY` = `sk-...` | 完全一致，直接复制值 |

**操作步骤**：
1. Vercel Dashboard → 项目 → Settings → Environment Variables
2. Key: `DEEPSEEK_API_KEY`
3. Value: 从本地 `.env.local` 复制
4. Environments: 勾选 Production + Preview + Development
5. 点击 Save

**不需要的其他环境变量**：无。PUPU 只需要这一个。

---

## 4. `public/audio` 文件是否会一起部署

**✅ 会。** `public/` 目录中的所有文件会被 Vercel 自动部署为静态资源。

| 文件 | 部署后 URL | 状态 |
|------|-----------|------|
| `public/audio/rain-room.mp3` | `https://<域名>/audio/rain-room.mp3` | 如果存在则部署 |
| `public/audio/README.md` | `https://<域名>/audio/README.md` | 建议保留，帮助理解 |

**注意事项**：
- Vercel 免费套餐（Hobby）有 100GB 带宽/月。5 个 MP3 文件（假设各 30-60s，约 1-5MB 每个）在正常使用下不会触及限制。
- 如果音频文件很大（>10MB 每个），建议压缩到 128kbps MP3 或使用更短的循环片段。
- 如果某个音频文件不存在，PUPU 会自动降级为 Mock 播放状态，不影响整体功能。

---

## 5. DeepSeek API 在 Vercel 上如何配置

### 架构

```
用户浏览器
  ↓ POST /api/chat
Vercel Serverless Function (app/api/chat/route.ts)
  ↓ 读取 process.env.DEEPSEEK_API_KEY
  ↓ POST https://api.deepseek.com/v1/chat/completions
DeepSeek API
  ↓ 返回回复
Vercel → 用户浏览器
```

**API Key 永远不会暴露到前端**。前端通过 `/api/chat` 代理调用，Key 只在 Vercel 服务端环境变量中。

### 跨区域延迟

- DeepSeek API 服务器在亚洲（推测）。
- Vercel Serverless Functions 默认在 `iad1`（美国东部）。
- 每次 API 调用会有额外的跨区域延迟（~200-400ms）。

**优化建议**（可选）：
- Vercel Pro 套餐可以将 Functions 部署到 `hnd1`（日本）或 `sin1`（新加坡），减少延迟。
- 或保持默认区域，PUPU 的 typing 动画已经覆盖了延迟感。

### 速率限制

- DeepSeek API 免费/付费套餐有各自的速率限制（RPM/TPM）。
- 个人使用不太可能触及。
- 如果未来用户量增长，可在 `/api/chat` 中添加简单的速率限制。

---

## 6. 本地 localStorage 记忆在部署后是否还能保留

**✅ 保留。**

localStorage 是浏览器特性，与部署平台无关。无论是 `localhost:3000` 还是 `pupu.vercel.app`，只要在同一浏览器中访问同一个域名，localStorage 数据都会保留。

**注意事项**：
- `localhost` 和 `pupu.vercel.app` 是**不同的域名**。本地开发时的记忆不会出现在部署版本中。
- 部署后，记忆绑定到 `https://<vercel域名>`。如果更换域名（如添加自定义域名），记忆会丢失（除非迁移 localStorage）。
- 隐私模式下 localStorage 可能不可用或会话级——这是浏览器行为，与 Vercel 无关。

---

## 7. 哪些东西不会同步到云端

| 数据 | 是否云端同步 | 说明 |
|------|------------|------|
| Memory Cards | ❌ 否 | 仅存于当前浏览器 localStorage |
| 聊天历史 | ❌ 否 | React state，刷新消失 |
| 角色图片 | ❌ 否 | object URL，刷新消失 |
| Radio 频道选择 | ❌ 否 | React state，刷新消失 |
| DeepSeek API 对话 | ❌ 否 | 每次请求独立，无会话持久化 |

**PUPU 是一个"本地优先"的应用。** 部署到 Vercel 只是让页面可以通过 URL 访问。数据仍然留在用户的浏览器中。

---

## 8. 当前项目的安全风险

### 低风险

| 风险 | 级别 | 缓解 |
|------|------|------|
| API Key 泄露 | 低 | Key 仅在服务端环境变量，前端不可见 |
| XSS | 低 | React 默认转义；用户输入仅通过 DeepSeek API 处理 |
| CSRF | 极低 | API Route 仅处理聊天请求，无状态变更操作 |

### 中等风险

| 风险 | 级别 | 缓解 |
|------|------|------|
| DeepSeek API 滥用 | 中 | 无速率限制。恶意用户可高频调用消耗配额。建议添加简单的速率限制 |
| Prompt Injection | 中 | 用户可通过聊天内容尝试覆盖系统提示词。当前系统提示词使用强约束，但 DeepSeek 可能被绕过 |

### 建议的安全增强（未来 Phase）

1. **速率限制**：在 `/api/chat` 中添加每 IP 每分钟 N 次的限制（使用 Vercel 的 `@vercel/rate-limit` 或手动实现）。
2. **输入长度限制**：限制用户消息最大长度（如 500 字符），防止超长 prompt injection。
3. **CSP Header**：添加 Content-Security-Policy 减少 XSS 风险。
4. **HTTPS**：Vercel 默认提供 HTTPS，无需额外配置。

### 当前不需要担心的

- **数据库攻击**：没有数据库。
- **用户认证攻击**：没有用户系统。
- **文件上传攻击**：角色图片使用 object URL（仅前端），不经过服务器。

---

## 9. 当前项目的隐私说明

### PUPU 收集什么

| 数据 | 存储位置 | 用途 | 共享 |
|------|---------|------|------|
| 聊天内容 | 每次 API 请求发送至 DeepSeek | 生成 AI 回复 | 发送至 DeepSeek API |
| Memory Cards | 浏览器 localStorage | 用户主动保存的记忆 | **不上传** |
| 角色图片 | 浏览器内存（object URL） | 前端粒子采样显示 | **不上传** |
| 语音输入 | 浏览器 Web Speech API | 语音转文字 | 发送至浏览器厂商语音服务 |

### PUPU 不收集什么

- ❌ 不收集用户身份信息（无注册、无邮箱、无手机号）。
- ❌ 不追踪用户行为（无 Google Analytics、无埋点、无 Cookie）。
- ❌ 不存储聊天历史到服务器。
- ❌ 不分享数据给第三方（除 DeepSeek API 用于生成回复）。

### DeepSeek API 隐私说明

- 聊天内容在每次请求时发送至 DeepSeek API（`api.deepseek.com`）。
- DeepSeek 的隐私政策见 https://platform.deepseek.com/privacy。
- 建议在 PUPU 页面底部或某个位置添加简短的隐私提示（未来 Phase）。

### 如需 GDPR/隐私合规

未来可添加：
- 首次访问时的隐私提示（温柔的一句话，不是弹窗）。
- 清除本地数据的按钮（删除 localStorage 中的 Memory Cards）。
- 关于 DeepSeek API 数据使用的简短说明。

---

## 10. 部署步骤

### Step 1：推到 GitHub

```powershell
# 确认 .gitignore 存在且包含 .env.local
git init
git add .
git commit -m "PUPU v1.2 Persistent Memory Alpha"
git remote add origin https://github.com/<你的用户名>/pupu.git
git push -u origin main
```

### Step 2：连接 Vercel

1. 打开 https://vercel.com
2. 点击 "New Project"
3. 导入 GitHub 仓库（选择 `pupu`）
4. Vercel 自动检测为 Next.js 项目，无需修改任何构建设置
5. Framework Preset: Next.js（自动检测）
6. Build Command: `next build`（自动检测）
7. Output Directory: `.next`（自动检测）

### Step 3：配置环境变量

1. 在项目设置页面 → Environment Variables
2. 添加：
   - Key: `DEEPSEEK_API_KEY`
   - Value: `sk-...`（从本地 `.env.local` 复制）
   - Environments: ✅ Production ✅ Preview ✅ Development
3. 点击 Save

### Step 4：Build

1. 点击 "Deploy"
2. Vercel 自动：
   - `npm install`
   - `npm run build`
   - 部署到 `https://pupu-<hash>.vercel.app`
3. 等待约 1-2 分钟

### Step 5：测试网址

1. 打开 Vercel 提供的域名（如 `https://pupu.vercel.app`）
2. 按第 11 节的清单逐项测试
3. 如果成功，可以在 Vercel Dashboard → Settings → Domains 中添加自定义域名

---

## 11. 部署后测试清单

### 基础测试

| # | 测试项 | 预期结果 | 状态 |
|---|--------|---------|------|
| 1 | 打开页面 | 粒子光出现，"I am here, quietly awake." 显示 | ⬜ |
| 2 | 页面不白屏 | 无 404、500 错误 | ⬜ |
| 3 | HTTPS | 浏览器地址栏显示 🔒 | ⬜ |

### DeepSeek AI 测试

| # | 测试项 | 预期结果 | 状态 |
|---|--------|---------|------|
| 4 | 发送消息 | PUPU 回复（非 Mock 风格，自然语言） | ⬜ |
| 5 | 回复语气 | 温柔、短、不说教、不像 ChatGPT | ⬜ |
| 6 | DevTools Network | `/api/chat` 返回 200 | ⬜ |
| 7 | 断网或 API 失败 | 自动回退 Mock，页面不崩溃 | ⬜ |

### 语音输入测试（仅 Chrome/Edge）

| # | 测试项 | 预期结果 | 状态 |
|---|--------|---------|------|
| 8 | 麦克风按钮 | Chrome 显示，Firefox 不显示 | ⬜ |
| 9 | 点击麦克风 | 按钮变绿发光，浏览器请求权限 | ⬜ |
| 10 | 说话 | 文字实时填入输入框，自动发送 | ⬜ |

### 背景音乐测试

| # | 测试项 | 预期结果 | 状态 |
|---|--------|---------|------|
| 11 | 打开 Radio | Music Drawer 正常显示 | ⬜ |
| 12 | 选择频道 | 音频播放（如有 MP3 文件）或 Mock 状态 | ⬜ |
| 13 | Play/Pause | 按钮正常工作 | ⬜ |

### 角色上传测试

| # | 测试项 | 预期结果 | 状态 |
|---|--------|---------|------|
| 14 | 上传图片 | 面板打开，可拖拽/选择图片 | ⬜ |
| 15 | 确认上传 | 粒子 2s 过渡到图片形态 | ⬜ |
| 16 | 恢复默认 | 粒子回到默认光团 | ⬜ |

### 记忆持久化测试

| # | 测试项 | 预期结果 | 状态 |
|---|--------|---------|------|
| 17 | 保存记忆 | Memory Drawer 出现卡片 | ⬜ |
| 18 | 刷新页面 | 点击 Save Memory，卡片仍在 | ⬜ |
| 19 | 删除记忆 | 卡片消失，刷新后仍不存在 | ⬜ |
| 20 | DevTools → Application → Local Storage | `pupu.memoryCards.v1` 存在且格式正确 | ⬜ |

### 生命感测试

| # | 测试项 | 预期结果 | 状态 |
|---|--------|---------|------|
| 21 | 打字时 | 粒子微微靠拢（listening） | ⬜ |
| 22 | 等待回复 | 粒子明显聚拢（thinking） | ⬜ |
| 23 | 回复到达 | 粒子轻微扩散（responding） | ⬜ |
| 24 | 存记忆 | 粒子收束（remembering） | ⬜ |
| 25 | 移动鼠标穿过粒子 | 粒子被轻轻推开 | ⬜ |
| 26 | 凌晨打开 | Deep Night 模式生效（粒子更暗更慢） | ⬜ |

---

## 附：快速部署命令参考

```powershell
# 1. 本地验证
npm run lint
npm run typecheck
npm run build

# 2. 推送到 GitHub
git add .
git commit -m "Deploy: PUPU v1.2"
git push

# 3. Vercel 自动开始部署（如果已连接）
# 4. 部署完成后打开 Vercel 提供的 URL 测试
```

---

## 版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-06-06 | 初始版本：Vercel 部署检查清单、安全评估、隐私说明、测试矩阵 |
