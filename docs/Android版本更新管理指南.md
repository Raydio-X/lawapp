# Android 应用版本更新管理指南

## 目录

- [概述](#概述)
- [版本号规则](#版本号规则)
- [Android Studio 操作](#android-studio-操作)
- [发布新版本流程](#发布新版本流程)
- [强制更新机制](#强制更新机制)
- [后端 API 接口](#后端-api-接口)
- [常见问题](#常见问题)

---

## 概述

本应用实现了完整的 Android 端版本更新机制，包括：

- ✅ 版本号管理系统（符合 Android 规范）
- ✅ 自动检查更新（可配置检查频率）
- ✅ 强制更新功能（大版本更新或指定版本）
- ✅ 可选更新功能（支持跳过、忽略）
- ✅ APK 下载与安装（使用系统 DownloadManager）
- ✅ 更新日志展示

**注意**：版本更新检查**仅在 Android 原生平台**生效，Web 端不会触发更新检查。

---

## 版本号规则

### 版本号定义

Android 应用有两个版本号：

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `versionCode` | int | 递增整数，用于系统判断版本新旧 | 1, 2, 3, 4... |
| `versionName` | String | 显示给用户的版本名 | "1.0.0", "1.1.0", "2.0.0" |

### 版本名命名规范

采用 **主版本号.次版本号.修订号** 格式（Semantic Versioning）：

```
主版本号.次版本号.修订号
    ↓         ↓        ↓
   2   .     1     .   0
```

**更新规则**：

| 更新类型 | versionCode | versionName | 说明 |
|----------|-------------|-------------|------|
| 主版本更新 | 1 → 2 | 1.0.0 → 2.0.0 | 重大架构变更、不兼容更新 |
| 次版本更新 | 2 → 3 | 2.0.0 → 2.1.0 | 新增功能、较大改动 |
| 修订版本更新 | 3 → 4 | 2.1.0 → 2.1.1 | Bug 修复、小优化 |

### 版本号比较逻辑

```javascript
// 比较函数
function compareVersions(v1, v2) {
  // "1.0.0" vs "1.1.0" → 返回 -1（v1 < v2）
  // "1.1.0" vs "1.1.0" → 返回 0（v1 = v2）
  // "2.0.0" vs "1.1.0" → 返回 1（v1 > v2）
}
```

---

## Android Studio 操作

### 1. 打开版本号配置文件

**文件路径**：`web/android/app/build.gradle`

在 Android Studio 中：
1. 左侧项目导航栏展开 `app` → `Gradle Scripts`
2. 双击打开 `build.gradle (Module: app)`

### 2. 版本号配置位置

```gradle
android {
    namespace "com.lawapp.app"
    compileSdkVersion rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "com.lawapp.app"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1           // ← 版本号（整数）
        versionName "1.0.0"     // ← 版本名（字符串）
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
}
```

### 3. 修改版本号示例

假设当前版本是 `1.0.0`，要更新到 `1.1.0`：

```gradle
defaultConfig {
    // ... 其他配置
    versionCode 2           // 从 1 改为 2（必须递增）
    versionName "1.1.0"     // 从 "1.0.0" 改为 "1.1.0"
}
```

### 4. 同步 Gradle

修改后点击右上角的 **"Sync Now"** 按钮。

### 5. 打包 APK

#### 方式一：Generate Signed Bundle / APK

1. 菜单栏：**Build** → **Generate Signed Bundle / APK**
2. 选择 **APK** → 点击 **Next**
3. 选择或创建签名密钥（KeyStore）
4. 选择 **release** 构建变体
5. 点击 **Finish**

#### 方式二：命令行打包

```bash
cd web/android
./gradlew assembleRelease
```

生成的 APK 位置：
```
web/android/app/release/app-release.apk
```

---

## 发布新版本流程

### 完整流程图

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: 更新 Android 版本号                                 │
│  编辑 build.gradle 中的 versionCode 和 versionName           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: 打包 APK                                            │
│  Build → Generate Signed Bundle / APK → release              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: 手动放置 APK 到服务器                                │
│  复制到 lawapp/后端/download/ 目录                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: 创建版本记录                                        │
│  POST /api/version/create                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: 测试更新流程                                        │
│  安装旧版本 APK，验证更新提示是否正常                         │
└─────────────────────────────────────────────────────────────┘
```

### Step 1: 更新版本号

编辑 `web/android/app/build.gradle`：

```gradle
// 示例：从 1.0.0 更新到 1.1.0
versionCode 2
versionName "1.1.0"
```

### Step 2: 打包 APK

在 Android Studio 中打包 release 版本。

### Step 3: 上传 APK

将打包好的 APK 文件手动复制到服务器目录：
```
lawapp/后端/download/lawapp-1.1.0.apk
```

APK 文件命名建议格式：`lawapp-{版本号}.apk`
- `lawapp-1.0.0.apk`
- `lawapp-1.1.0.apk`
- `lawapp-2.0.0.apk`

下载 URL 格式：
```
https://www.lawapp.top/download/lawapp-1.1.0.apk
```

### Step 4: 创建版本记录

调用后端 API 创建版本记录：

```bash
curl -X POST https://lawapp.top/api/version/create \
  -H "Content-Type: application/json" \
  -d '{
    "versionCode": 2,
    "versionName": "1.1.0",
    "platform": "android",
    "downloadUrl": "https://www.lawapp.top/download/lawapp-1.0.0.apk",
    "forceUpdate": false,
    "updateLog": "1. 新增版本更新功能\n2. 修复QQ头像显示问题",
    "forceUpdateVersions": []
  }'
```

### Step 5: 测试验证

1. 安装旧版本 APK（如 1.0.0）
2. 启动应用，观察是否弹出更新提示
3. 点击更新，验证下载和安装流程

---

## 强制更新机制

### 触发条件

满足以下**任一条件**即触发强制更新：

| 条件 | 说明 |
|------|------|
| 主版本号变化 | 如 1.x.x → 2.x.x |
| `forceUpdate` 为 true | 数据库字段标记 |
| 当前版本在强制列表中 | `forceUpdateVersions` 包含当前版本 |

### 示例配置

#### 示例 1：主版本更新（自动强制）

```json
{
  "versionCode": 10,
  "versionName": "2.0.0",
  "forceUpdate": false,
  "forceUpdateVersions": []
}
```

当用户从 1.x.x 升级到 2.0.0 时，自动触发强制更新。

#### 示例 2：指定版本强制更新

```json
{
  "versionCode": 5,
  "versionName": "1.4.0",
  "forceUpdate": false,
  "forceUpdateVersions": ["1.0.0", "1.1.0", "1.2.0"]
}
```

只有 1.0.0、1.1.0、1.2.0 版本的用户会被强制更新。

#### 示例 3：全局强制更新

```json
{
  "versionCode": 5,
  "versionName": "1.4.0",
  "forceUpdate": true,
  "forceUpdateVersions": []
}
```

所有用户都会被强制更新。

### 强制更新弹窗特点

- ❌ 不可关闭
- ❌ 无跳过按钮
- ❌ 无忽略按钮
- ✅ 只显示"立即更新"按钮
- ✅ 显示更新说明

---

## 后端 API 接口

### 1. 检查版本更新

**接口**：`POST /api/version/check`

**请求**：
```json
{
  "currentVersion": "1.0.0",
  "platform": "android"
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "needUpdate": true,
    "currentVersion": "1.0.0",
    "latestVersion": {
      "versionCode": 2,
      "versionName": "1.1.0",
      "platform": "android",
      "downloadUrl": "https://www.lawapp.top/download/lawapp-1.1.0.apk",
      "forceUpdate": false,
      "updateLog": "1. 新增功能\n2. 修复问题",
      "releaseDate": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

### 2. 获取最新版本

**接口**：`GET /api/version/latest?platform=android`

### 3. 创建新版本（管理员）

**接口**：`POST /api/version/create`

**请求**：
```json
{
  "versionCode": 2,
  "versionName": "1.1.0",
  "platform": "android",
  "downloadUrl": "https://www.lawapp.top/download/lawapp-1.1.0.apk",
  "forceUpdate": false,
  "updateLog": "更新日志",
  "forceUpdateVersions": []
}
```

### 4. 获取版本列表（管理员）

**接口**：`GET /api/version/list?platform=android`

### 5. 更新版本信息（管理员）

**接口**：`PUT /api/version/:id`

### 6. 删除版本（管理员）

**接口**：`DELETE /api/version/:id`

### 7. 获取已放置的 APK 文件列表

**接口**：`GET /api/version/apk-files`

用于查看 `后端/download/` 目录中的 APK 文件。

**响应**：
```json
{
  "success": true,
  "data": [
    {
      "filename": "lawapp-1.1.0.apk",
      "size": 15728640,
      "uploadTime": "2024-01-15T10:00:00.000Z",
      "downloadUrl": "https://www.lawapp.top/download/lawapp-1.1.0.apk"
    }
  ]
}
```

---

## 检查频率配置

### 可选值

| 值 | 说明 |
|----|------|
| `always` | 每次启动都检查 |
| `daily` | 每天检查一次（默认） |
| `weekly` | 每周检查一次 |
| `never` | 从不检查 |

### 设置方式

```typescript
import { setCheckFrequency } from '@/utils/versionService'

// 设置检查频率
setCheckFrequency('daily')
```

---

## 忽略版本功能

对于**非强制更新**，用户可以选择"忽略此版本"。

### 实现原理

忽略的版本号存储在 `localStorage` 中：

```javascript
localStorage.setItem('version_ignored', '1.1.0')
```

### 清除忽略

```typescript
import { clearIgnoredVersion } from '@/utils/versionService'

clearIgnoredVersion()
```

---

## 数据库表结构

### app_versions 表

```sql
CREATE TABLE app_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version_code INT NOT NULL COMMENT '版本号（数字）',
    version_name VARCHAR(20) NOT NULL COMMENT '版本名（如 1.0.0）',
    platform VARCHAR(20) DEFAULT 'android' COMMENT '平台：android, ios',
    download_url VARCHAR(500) NOT NULL COMMENT '下载地址',
    force_update TINYINT(1) DEFAULT 0 COMMENT '是否强制更新',
    force_update_versions JSON COMMENT '强制更新的版本列表',
    update_log TEXT COMMENT '更新日志',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_platform (platform),
    INDEX idx_version_code (version_code),
    INDEX idx_is_active (is_active)
);
```

---

## 常见问题

### Q1: versionCode 和 versionName 的关系？

**A**: 
- `versionCode` 是整数，用于系统比较版本新旧，**必须递增**
- `versionName` 是字符串，用于显示给用户，可以是任意格式

### Q2: 如何测试版本更新功能？

**A**: 
1. 方法一：临时降低本地版本号，打包安装测试
2. 方法二：使用后端 API 创建一个更高版本记录

### Q3: APK 下载后无法安装？

**A**: 
- Android 8.0+ 需要授予"安装未知应用"权限
- 插件会自动请求权限
- 也可手动在设置中开启：设置 → 应用 → 特殊访问 → 安装未知应用

### Q4: 如何查看当前版本号？

**A**: 
```typescript
import { App } from '@capacitor/core'

const info = await App.getInfo()
console.log('版本:', info.version)
```

### Q5: 更新弹窗不显示？

**A**: 
检查以下项：
1. 确认是 Android 原生平台（非 Web）
2. 检查后端 API 是否正常返回
3. 查看控制台日志是否有错误
4. 确认检查频率设置不是 `never`

### Q6: 如何撤销已发布的版本？

**A**: 
调用 API 将版本设为不活跃：
```bash
curl -X PUT https://lawapp.top/api/version/1 \
  -H "Content-Type: application/json" \
  -d '{ "isActive": false }'
```

---

## 附录：版本发布检查清单

- [ ] 更新 `build.gradle` 中的 `versionCode` 和 `versionName`
- [ ] 同步 Gradle
- [ ] 打包 release APK
- [ ] 上传 APK 到服务器
- [ ] 调用 API 创建版本记录
- [ ] 填写更新日志
- [ ] 配置强制更新（如需要）
- [ ] 测试更新流程
- [ ] 发布上线

---

**文档版本**：1.0.0  
**最后更新**：2024年1月
