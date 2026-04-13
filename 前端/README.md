# 法硕背诵小程序

法硕背诵小程序是一个帮助法律硕士考生进行知识点背诵和学习的微信小程序。采用 [TDesign 企业级设计体系小程序解决方案](https://tdesign.tencent.com/miniprogram/overview) 进行搭建。

## 项目介绍

### 功能特性

- **知识库管理**：创建和管理法律知识库，支持分类整理
- **卡片学习**：通过问答卡片形式进行知识点记忆
- **学习统计**：记录学习进度和统计数据
- **错题本**：收藏错题，便于复习
- **社区分享**：分享知识库，与其他用户交流

### 页面结构

```
|-- pages
|   |-- home        // 首页（社区）
|   |-- create      // 创作页面
|   |-- profile     // 个人中心
|   |-- login       // 登录页面
|   |-- library     // 知识库详情
|   |-- card        // 卡片学习
```

### 项目目录结构

```
|-- lawapp
    |-- 前端
    |   |-- components    // 公共组件库
    |   |-- config        // 基础配置
    |   |-- custom-tab-bar // 自定义 tabbar
    |   |-- middlewares   // 中间件
    |   |-- model         // 数据模型
    |   |-- pages         // 页面
    |   |-- services      // 请求接口
    |   |-- style         // 公共样式
    |   |-- utils         // 工具库
    |-- 后端
        |-- src
            |-- config    // 配置文件
            |-- middlewares // 中间件
            |-- models    // 数据模型
            |-- routes    // API路由
            |-- test      // 测试文件
```

## 快速开始

### 前端

1. 安装依赖
```bash
cd 前端
npm install
```

2. 在微信开发者工具中导入项目
3. 构建 npm

### 后端

1. 安装依赖
```bash
cd 后端
npm install
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接信息
```

3. 初始化数据库
```bash
npm run init-db
npm run seed
```

4. 启动服务
```bash
npm start
```

## API 接口

后端提供以下主要接口：

- `/api/auth` - 用户认证
- `/api/libraries` - 知识库管理
- `/api/cards` - 卡片管理
- `/api/study` - 学习记录
- `/api/comments` - 评论
- `/api/favorites` - 收藏
- `/api/wrong-cards` - 错题本

## 技术栈

- 前端：微信小程序 + TDesign
- 后端：Node.js + Express + MySQL
- 认证：JWT

## 开源协议

MIT
