# Vercel 部署指南

## 方法一：通过 GitHub 部署（推荐）

1. **上传代码到 GitHub**
   - 在 GitHub 上创建一个新的仓库
   - 将项目代码上传到该仓库

2. **连接 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录
   - 点击 "New Project"
   - 选择你刚创建的 GitHub 仓库
   - 点击 "Import"

3. **配置环境变量**
   - 在 Vercel 项目设置中，找到 "Environment Variables"
   - 添加环境变量：
     - Name: `GEMINI_API_KEY`
     - Value: 你的实际 Gemini API Key
   - 点击 "Add"

4. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成
   - 获得部署 URL

## 方法二：通过 Vercel CLI 部署

1. **安装 Node.js**
   - 访问 [nodejs.org](https://nodejs.org)
   - 下载并安装最新的 LTS 版本

2. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

3. **登录 Vercel**
   ```bash
   vercel login
   ```

4. **部署项目**
   ```bash
   vercel
   ```

5. **设置环境变量**
   ```bash
   vercel env add GEMINI_API_KEY
   ```

## 注意事项

- 确保你有有效的 Gemini API Key
- 项目将自动使用 Vite 进行构建
- 部署后的 URL 将可以直接在浏览器中访问