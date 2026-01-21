# 分子油藏采收可视化工具

一个基于 React 的分子级油藏采收过程可视化工具，用于展示和解释增强采油技术（EOR）的科学原理。

## 功能特性

- 🔬 **科学可视化**: 实时展示分子级别的油藏采收过程
- 🎯 **智能解释**: 基于 Gemini AI 的科学原理解释
- 🎨 **交互式界面**: 直观的用户界面和参数调节
- 📱 **响应式设计**: 支持多种设备和屏幕尺寸

## 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **AI 服务**: Google Gemini API
- **部署**: Vercel

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 环境配置

创建 `.env.local` 文件并添加你的 Gemini API Key：

```env
GEMINI_API_KEY=your_api_key_here
```

### 开发运行

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

### 构建部署

```bash
npm run build
```

## 部署指南

详细的部署说明请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 项目结构

```
├── components/          # React 组件
│   ├── ExplanationPanel.tsx
│   ├── Layout.tsx
│   ├── VideoPlayer.tsx
│   └── VisualPanel.tsx
├── services/           # 服务层
│   └── geminiService.ts
├── types.ts           # TypeScript 类型定义
├── App.tsx           # 主应用组件
└── index.tsx         # 应用入口
```

## 在线演示

View your app in AI Studio: https://ai.studio/apps/drive/1CBw4C9ukWw6m4h9VrOPG_TiSyJLGEEsK

## 许可证

MIT License
