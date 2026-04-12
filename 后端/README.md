# 法硕背诵小程序 - 后端服务

基于 Node.js + Express + MySQL 的后端 API 服务。

## 快速开始

### 1. 安装依赖

```bash
cd 后端
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
copy .env.example .env
```

编辑 `.env` 文件：

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=lawapp

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

### 3. 初始化数据库

确保 MySQL 服务已启动，然后执行：

```bash
npm run init-db
```

### 4. 导入模拟数据

```bash
npm run seed
```

### 5. 启动服务

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务启动后访问：http://localhost:3000

## API 接口

### 基础路径

所有 API 接口前缀为 `/api`

### 接口列表

| 模块 | 路径 | 说明 |
|------|------|------|
| 认证 | `/api/auth` | 登录、用户信息 |
| 知识库 | `/api/libraries` | 知识库 CRUD |
| 卡片 | `/api/cards` | 卡片 CRUD |
| 章节 | `/api/chapters` | 章节 CRUD |
| 学习 | `/api/study` | 学习记录、统计 |
| 评论 | `/api/comments` | 评论 CRUD |
| 收藏 | `/api/favorites` | 收藏管理 |
| 错题 | `/api/wrong-cards` | 错题本 |

### 认证方式

需要认证的接口需在请求头携带 Token：

```
Authorization: Bearer <token>
```

## 运行测试

```bash
npm test
```

## 前端对接

修改前端 `utils/api.js` 中的 API 地址：

```javascript
const API_BASE_URL = 'http://localhost:3000/api'; // 本地开发
// const API_BASE_URL = 'http://192.168.x.x:3000/api'; // 局域网访问
```

## 数据库表结构

- `users` - 用户表
- `libraries` - 知识库表
- `chapters` - 章节表
- `cards` - 卡片表
- `study_records` - 学习记录表
- `comments` - 评论表
- `favorites` - 收藏表
- `wrong_cards` - 错题表
- `user_stats` - 用户统计表

## 开发说明

### 项目结构

```
后端/
├── src/
│   ├── app.js              # 应用入口
│   ├── config/
│   │   └── database.js     # 数据库配置
│   ├── database/
│   │   ├── init.js         # 数据库初始化
│   │   └── seed.js         # 模拟数据
│   ├── middlewares/
│   │   └── auth.js         # 认证中间件
│   ├── models/             # 数据模型
│   │   ├── User.js
│   │   ├── Library.js
│   │   ├── Card.js
│   │   └── ...
│   ├── routes/             # 路由
│   │   ├── auth.js
│   │   ├── libraries.js
│   │   ├── cards.js
│   │   └── ...
│   └── test/
│       └── api.test.js     # API 测试
├── package.json
└── .env
```

### 添加新接口

1. 在 `src/models/` 创建模型
2. 在 `src/routes/` 创建路由
3. 在 `src/app.js` 注册路由
