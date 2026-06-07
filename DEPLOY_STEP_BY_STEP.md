# PUPU 部署指南 — Windows 新手版

> 从本地文件夹到全世界都能打开的网址。一步一步来。

**起点**：你的电脑，`E:\文档\ai日记` 文件夹
**终点**：一个 `https://xxx.vercel.app` 网址，任何人都能打开

**预计时间**：30 分钟（如果你已经有 GitHub 账号），1 小时（如果你什么都没有）

---

## 准备工作：你需要什么

| 东西 | 怎么拿到 |
|------|---------|
| GitHub 账号 | 去 https://github.com 注册（免费），用邮箱即可 |
| Vercel 账号 | 去 https://vercel.com 注册（免费），**用 GitHub 账号登录** |
| DeepSeek API Key | 你已经有了（`.env.local` 里的 `sk-...`） |
| 网络畅通 | 能访问 GitHub 和 Vercel |

**不需要安装任何新软件**。Git 和 Node.js 你已经装过了（不然项目跑不起来）。

---

## Step 1：确认 Git 是否安装

打开 **命令提示符**（CMD）。

按键盘 `Win + R`，输入 `cmd`，回车。

在黑色窗口里输入：

```cmd
git --version
```

如果看到类似 `git version 2.47.0` 这样的输出 → ✅ 已安装，跳到 Step 2。

如果看到 `'git' 不是内部或外部命令` → 需要安装 Git：

1. 打开 https://git-scm.com/download/win
2. 下载 64-bit Git for Windows Setup
3. 安装时一路点 "Next"（所有选项用默认的就行）
4. 安装完成后**关闭并重新打开 CMD**
5. 再次输入 `git --version` 确认

---

## Step 2：进入项目目录

在 CMD 中输入：

```cmd
e:
cd e:\文档\ai日记
```

确认你在正确的位置：

```cmd
dir
```

你应该能看到 `package.json`、`README.md`、`app` 文件夹等。

---

## Step 3：创建 `.gitignore` 文件

`.gitignore` 告诉 Git "这些文件不要上传"。你必须创建它。

在 CMD 中输入：

```cmd
notepad .gitignore
```

如果提示"文件不存在，是否创建"，选**是**。

在记事本中粘贴以下内容：

```
.env.local
node_modules/
.next/
.next-atmosphere/
tsconfig.tsbuildinfo
```

保存文件（`Ctrl + S`），关闭记事本。

验证文件已创建：

```cmd
type .gitignore
```

应该能看到刚才粘贴的内容。

---

## Step 4：初始化 Git 仓库

在 CMD 中输入（逐行执行，每行回车）：

```cmd
git init
```

你会看到 `Initialized empty Git repository in E:/文档/ai日记/.git/`

然后配置你的名字和邮箱（GitHub 需要这个信息）：

```cmd
git config user.name "你的名字"
git config user.email "你的邮箱@example.com"
```

> 名字写英文或拼音即可。邮箱用你注册 GitHub 的那个邮箱。

---

## Step 5：第一次提交

在 CMD 中输入（逐行执行）：

```cmd
git add .
```

这会把所有文件加入暂存区。可能要等几秒。

```cmd
git commit -m "PUPU v1.2: Persistent Memory Alpha"
```

这会把所有文件保存为一个"版本快照"。你会看到一长串文件名滚过去。

---

## Step 6：在 GitHub 创建新仓库

1. 打开浏览器，登录 https://github.com
2. 点击右上角的 **"+"** → **"New repository"**
3. 填写：
   - Repository name：`pupu`（或你喜欢的名字）
   - Description：`PUPU — 悲伤止疼剂。一个会陪伴人的数字生命体。`
   - 选 **Public**（免费）
   - **不要**勾选 "Add a README file"
   - **不要**勾选 ".gitignore"
   - **不要**勾选 "License"
4. 点击绿色按钮 **"Create repository"**

页面会跳转到一个新的页面，上面有一堆命令。找到 **"…or push an existing repository from the command line"** 这一段。

---

## Step 7：推送代码到 GitHub

回到 CMD，复制粘贴 GitHub 页面上显示的三行命令（类似下面这样，但 URL 里是你的用户名）：

```cmd
git remote add origin https://github.com/你的用户名/pupu.git
git branch -M main
git push -u origin main
```

> 如果你的 GitHub 开启了双重认证（2FA），推送时可能会弹出一个登录窗口，或者需要在浏览器中授权。按照屏幕提示操作即可。

推送成功后，刷新 GitHub 页面，你应该能看到所有文件都出现在仓库里了。

**检查**：确认 `.env.local` **没有**出现在 GitHub 上。如果出现了，说明 `.gitignore` 没生效，马上告诉我。

---

## Step 8：在 Vercel 导入 GitHub 仓库

1. 打开 https://vercel.com
2. 用 GitHub 账号登录（如果还没登录的话）
3. 点击 **"New Project"**
4. 在列表中找到 `pupu`（可能需要点 "Import" 旁边的调整按钮）
5. 如果看不到，点 "Adjust GitHub App Permissions" 给 Vercel 授权访问你的仓库
6. 点击 `pupu` 旁边的 **"Import"**
7. Vercel 会自动检测到这是 Next.js 项目。**不要修改任何构建设置**。
8. 页面上应该显示：
   - Framework Preset: **Next.js**
   - Build Command: `next build`（自动填的）
   - Output Directory: `.next`（自动填的）

---

## Step 9：配置环境变量

这是**最关键的一步**。如果跳过，PUPU 只能用 Mock 回复。

在 Vercel 的导入页面上，找到 **"Environment Variables"** 区域。

展开它，添加一个环境变量：

| Key（名称） | Value（值） |
|------------|------------|
| `DEEPSEEK_API_KEY` | `sk-52b91f1619b44baf953a0a5bbc643881` |

> ⚠️ Key 必须拼写正确：`DEEPSEEK_API_KEY`，下划线，全部大写。
> Value 就是你在 `.env.local` 里那一串 `sk-...`。

添加完成后，点击 **"Deploy"**。

---

## Step 10：等待部署

Vercel 会开始构建。你会看到一个进度页面，上面有：

1. Building…（安装依赖 + 编译 TypeScript + 打包）
2. 大约 1-2 分钟后，看到 🎉 和 Confetti 动画 → 部署成功！

你会得到一个网址，类似：
```
https://pupu-xxxxx.vercel.app
```

点击那个网址 → PUPU 应该能打开了！

---

## Step 11：部署后测试

### 测试 1：页面能否打开

打开 Vercel 给你的网址。你应该看到：
- 深色背景
- 粒子光在呼吸
- 底部有输入框
- 左上角有 "PUPU 悲伤止疼剂"

✅ 如果看到这些 → 部署成功。

### 测试 2：DeepSeek 是否能回复

在输入框里打字（比如 "hello"），发送。

- 如果收到温柔的回复（不像机器人，不像 ChatGPT）→ ✅ DeepSeek 正常工作
- 如果收到的回复风格和之前本地测试不同（更像固定模板）→ 可能是 Mock fallback

**如何确认是 DeepSeek 还是 Mock**：
1. 按 `F12` 打开 DevTools
2. 点击 **Network** 标签
3. 发送一条消息
4. 看有没有一个 `/api/chat` 的请求
5. 如果状态码是 **200** → DeepSeek 在工作
6. 如果状态码是 **500** 或没有这个请求 → 检查环境变量

### 测试 3：语音输入（仅 Chrome/Edge）

1. 用 Chrome 或 Edge 打开你的 Vercel 网址
2. 你应该能看到输入框右边有一个麦克风图标 🎤
3. 点击它 → 浏览器会请求麦克风权限 → 点"允许"
4. 说话 → 文字应该实时出现在输入框里 → 然后自动发送

**注意**：Vercel 部署的网站必须用 **HTTPS** 才能使用语音。Vercel 默认提供 HTTPS，所以应该没问题。如果是 HTTP，语音功能会被浏览器阻止。

### 测试 4：背景音乐

1. 点击右侧的 **Background Music** 按钮
2. 选一个频道（比如 Rain Room）
3. 如果你本地有 MP3 文件且已上传到 GitHub → 应该有声音
4. 如果 MP3 文件没有上传到 GitHub → 应该是 Mock 状态（指示灯会动但没有声音）

**如何确认 MP3 文件是否部署了**：
在浏览器地址栏输入 `https://你的域名/audio/rain-room.mp3`，如果返回 200 → 文件在。
如果返回 404 → 文件没上传，需要把 `public/audio/*.mp3` 加入 Git 并推送。

### 测试 5：角色上传

1. 点击 **Upload Character**
2. 选择一张图片
3. 点击 Confirm
4. 粒子应该 2 秒内过渡到图片形态

### 测试 6：记忆持久化

1. 聊几句话
2. 点击 **Save Memory**
3. Memory Drawer 打开，应该有一张卡片
4. 按 `F5` 刷新页面
5. 再次点击 **Save Memory** → 刚才的卡片应该还在

### 测试 7：确认环境变量

如果 DeepSeek 不工作，在 Vercel Dashboard 中检查：

1. 打开 https://vercel.com
2. 点击你的 `pupu` 项目
3. 点击 **Settings** → **Environment Variables**
4. 确认 `DEEPSEEK_API_KEY` 存在且值正确
5. 如果改了环境变量，需要**重新部署**（点 Deployments → 最新的那个 → Redeploy）

---

## 常见问题

### Q: 推送时提示 "fatal: unable to access..."

**A:** 可能是网络问题。试试：
```cmd
git push -u origin main
```
如果还是失败，检查是否能打开 https://github.com。

### Q: Vercel 构建失败

**A:** 在 Vercel Dashboard 点击失败的 deployment → 查看 **Build Log**。常见原因：
- 环境变量没设置 → 回到 Step 9
- TypeScript 类型错误 → 在本地运行 `npm run typecheck` 确认

### Q: 部署后页面白屏

**A:** 按 `F12` → Console 标签 → 看有没有红色错误。最常见的原因是资源路径问题，但 PUPU 不应该有这个问题。

### Q: 以后改了代码怎么更新部署

**A:** 三步：
```cmd
git add .
git commit -m "描述你改了什么"
git push
```
Vercel 会自动检测到推送，自动重新部署。不需要手动操作。

### Q: 怎么改域名

**A:** Vercel Dashboard → Settings → Domains → 添加你自己的域名。需要去域名服务商那里配置 DNS。

---

## 部署成功后

你的 PUPU 现在有一个公开的网址了。

**可以分享给朋友。** 把 `https://pupu-xxxxx.vercel.app` 发给任何人——他们不需要安装任何东西，用浏览器打开就能用。

**注意**：
- 记忆只存在于访客自己的浏览器中。你保存的记忆，朋友看不到。朋友保存的记忆，你也看不到。
- DeepSeek API 有调用次数限制。如果很多人同时使用，可能会用完配额。
- 免费套餐足够个人使用。

---

## 版本信息

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-06-06 | 初始版本：Windows CMD 逐步骤部署指南 |
