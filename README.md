<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AgentArchitect AI (中文版)

<div align="center">
  <p align="center">
    <strong>一个专为 AI Agent 开发者打造的全栈 AI 学习与进化系统</strong>
  </p>
  <p align="center">
    <a href="#核心功能">核心功能</a> •
    <a href="#技术栈">技术栈</a> •
    <a href="#快速启动">快速启动</a> •
    <a href="#项目结构">项目结构</a>
  </p>
</div>

---

## 🌟 项目简介

**AgentArchitect AI** 是一款集成化的 AI 学习助手，旨在帮助开发者从零开始构建、理解并掌握 AI Agent（人工智能代理）技术。不同于通用的学习平台，它深度集成了 Google Gemini AI，为用户提供端到端的个性化学习体验，包括从路线规划到面试模拟的全流程支持。

## 🚀 核心功能

- 🧠 **AI 学习路径生成器 (Plan Generator)**：根据用户的目标岗位（如 Prompt 工程师、Agent 架构师）和学习周期，自动生成详细的每日学习计划。
- 💬 **智能私教 (Tutor Chat)**：内置专业的 AI 导师，支持多轮对话，随时解答在学习 LangChain、AutoGPT 等框架时遇到的疑难杂症。
- 🎙️ **模拟面试系统 (Interview Simulator)**：针对 AI 行业岗位进行压力面试模拟，并在结束后提供多维度的反馈与改进建议。
- 📰 **实时行业资讯 (Real-time News)**：自动抓取并总结最新的 AI 行业动态与技术突破，确保学习内容永不过时。
- 📝 **知识库管理 (Review Section)**：支持管理 LeetCode 刷题记录、典型面试题及项目笔记，构建个人专属的 AI 知识图谱。
- 📊 **可视化进度看板 (Dashboard)**：通过直观的卡片式布局，实时追踪学习进度与活跃计划。

## 🛠️ 技术栈

- **前端框架**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [Vite 6](https://vitejs.dev/)
- **样式方案**: [Tailwind CSS](https://tailwindcss.com/)
- **AI 智能体**: [Google Gemini API (@google/genai)](https://ai.google.dev/)
- **图标库**: [Lucide React](https://lucide.dev/)
- **Markdown 渲染**: [Marked](https://marked.js.org/)

## 📦 项目结构

```text
├── components/          # UI 组件库
│   ├── TutorChat.tsx    # AI 对话组件
│   ├── PlanGenerator.tsx # 计划生成逻辑
│   ├── NewsFeed.tsx      # 资讯流组件
│   └── ...
├── services/            # 后端服务
│   └── geminiService.ts # Gemini API 集成封装
├── types.ts             # 全局 TypeScript 类型定义
├── App.tsx              # 应用主入口与路由控制
└── index.tsx            # 挂载点
```

## ⚙️ 快速启动

### 前置要求
- Node.js (推荐 v18+)
- Google AI Studio API Key ([获取地址](https://aistudio.google.com/app/apikey))

### 安装步骤

1. **克隆并进入项目目录**
   ```bash
   git clone <your-repo-url>
   cd agent-architect-ai
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   在根目录创建 `.env.local` 文件并添加你的 API Key：
   ```env
   GEMINI_API_KEY=你的_GEMINI_API_KEY
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```
   访问 `http://localhost:3000` 即可开始使用。

## 🤝 贡献说明

欢迎开发者提交 Pull Request 或 Issue。如果你有关于 AI 学习路线的优化建议，欢迎在 Github Discussions 中探讨。

---

**AgentArchitect AI** - *Build your path to the AGI era.*
