# Sprint 0 Backlog - G-Credit Project

**Sprint Duration:** 2026-01-23 (Thursday) → 2026-02-05 (Thursday) - 2 weeks  
**Sprint Goal:** 搭建Phase 1最小基础设施，开发者能够运行Hello World前后端应用  
**Team:** Solo全栈开发者（业余时间，20-30小时总投入）  
**Scrum Master:** BMAD System  
**Product Owner:** LegendZhu

---

## 📊 Sprint Overview

**Total Story Points:** 16-19小时估算  
**Available Capacity:** 20-30小时（业余时间）  
**Buffer:** 4-11小时（学习、调试、unexpected issues）

**Sprint Success Criteria:**
- ✅ 前端React项目运行，显示基础UI
- ✅ 后端NestJS API运行，/health返回200
- ✅ Azure PostgreSQL连接成功，User表创建
- ✅ Azure Blob Storage能上传/下载图片
- ✅ 代码提交到Git仓库
- ✅ README.md包含完整的本地开发指南

---

## 🛠️ Pre-Sprint Setup

### Step 0.1: 验证并安装Node.js 20 LTS

**验证当前Node.js版本：**

```powershell
# 在PowerShell中运行
node --version
```

**期望输出：** `v20.x.x` (例如 v20.11.0)

**如果版本不是20.x或没有安装Node.js，请按以下步骤安装：**

#### 方法A：使用官方安装包（推荐）

1. **下载Node.js 20 LTS：**
   - 访问：https://nodejs.org/
   - 点击 "20.11.0 LTS" (或当前最新的20.x LTS版本)
   - 选择 "Windows Installer (.msi)" 64-bit

2. **运行安装程序：**
   - 双击下载的 `.msi` 文件
   - 接受协议
   - 安装路径保持默认：`C:\Program Files\nodejs\`
   - **重要：** 勾选 "Automatically install the necessary tools" (自动安装构建工具)
   - 点击 Install

3. **验证安装：**
   ```powershell
   # 重启PowerShell后运行
   node --version   # 应显示 v20.x.x
   npm --version    # 应显示 10.x.x
   ```

4. **配置npm国内镜像（可选，加速下载）：**
   ```powershell
   npm config set registry https://registry.npmmirror.com
   ```

#### 方法B：使用Winget（如果Windows 11已有winget）

```powershell
# 搜索Node.js 20
winget search nodejs

# 安装Node.js 20 LTS
winget install OpenJS.NodeJS.LTS

# 重启PowerShell验证
node --version
```

#### 方法C：使用nvm-windows（如果需要管理多个Node版本）

1. **下载nvm-windows：**
   - 访问：https://github.com/coreybutler/nvm-windows/releases
   - 下载 `nvm-setup.exe`

2. **安装nvm：**
   - 运行 `nvm-setup.exe`
   - 安装路径保持默认

3. **使用nvm安装Node.js 20：**
   ```powershell
   nvm install 20
   nvm use 20
   node --version
   ```

**安装时间估算：** 15-20分钟

---

### Step 0.2: 验证开发环境

**检查VS Code：**
```powershell
code --version
```

**推荐VS Code扩展（可选安装）：**
- ESLint
- Prettier - Code formatter
- Prisma
- Thunder Client (API测试)
- GitLens

**检查Git：**
```powershell
git --version
```

如果没有Git：
```powershell
winget install Git.Git
```

---

### Step 0.3: 克隆或创建Git仓库

**选项A：如果GitHub仓库是空的**

```powershell
# 创建项目目录
cd C:\G_Credit\CODE
mkdir gcredit-project
cd gcredit-project

# 初始化Git
git init
git branch -M main

# 添加远程仓库（替换为你的仓库URL）
git remote add origin https://github.com/yourusername/gcredit.git
```

**选项B：如果GitHub仓库已有内容**

```powershell
cd C:\G_Credit\CODE
git clone https://github.com/yourusername/gcredit.git gcredit-project
cd gcredit-project
```

**创建项目结构：**

```powershell
# 在 gcredit-project 目录下
mkdir frontend
mkdir backend
```

---

## 📋 Sprint 0 Stories

---

### 🎨 Story 1.1: 初始化前端项目

**Story ID:** GCRED-1.1  
**Epic:** Epic 1 - Project Infrastructure Setup  
**Estimate:** 2小时  
**Priority:** MUST HAVE  

**User Story:**
> As a Developer,  
> I want to initialize a React 18+ project using Vite with TypeScript configured,  
> So that I have a modern, fast development environment for building the G-Credit frontend.

**Acceptance Criteria:**

**Given** I have Node.js 20 LTS installed  
**When** I run the Vite initialization command with React and TypeScript templates  
**Then** A new React 18+ project is created with Vite build tooling  
**And** TypeScript is configured with strict mode enabled  
**And** ESLint and Prettier are configured for code quality  
**And** Tailwind CSS is installed and configured  
**And** Project structure includes src/, public/, and config files  
**And** Development server starts successfully on `npm run dev`  
**And** Hot module replacement (HMR) works correctly  

**Implementation Tasks:**

1. **创建Vite项目 (15分钟):**
   ```powershell
   cd C:\G_Credit\CODE\gcredit-project\frontend
   
   # 使用Vite创建React + TypeScript项目
   npm create vite@latest . -- --template react-ts
   
   # 安装依赖
   npm install
   ```

2. **安装Tailwind CSS (20分钟):**
   ```powershell
   # 安装Tailwind及依赖
   npm install -D tailwindcss postcss autoprefixer
   
   # 重要：Tailwind CSS v4+ 需要额外的 PostCSS 插件
   npm install -D @tailwindcss/postcss
   ```
   
   **手动创建 `tailwind.config.js`（如果 npx tailwindcss init -p 失败）:**
   ```javascript
   /** @type {import('tailwindcss').Config} */
   export default {
     content: [
       "./index.html",
       "./src/**/*.{js,ts,jsx,tsx}",
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```
   
   **手动创建 `postcss.config.js`:**
   ```javascript
   export default {
     plugins: {
       '@tailwindcss/postcss': {},
       autoprefixer: {},
     },
   }
   ```
   
   **更新 `src/index.css`:**
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
   
   **⚠️ 常见问题排查：**
   - 如果浏览器报错 "tailwindcss directly as a PostCSS plugin"：确认已安装 `@tailwindcss/postcss`
   - 如果 `npx tailwindcss init -p` 报错：手动创建上述两个配置文件即可

3. **安装Shadcn/ui (20分钟):**
   
   **⚠️ 重要：先配置路径别名，否则 Shadcn 安装会失败！**
   
   **步骤 3.1: 配置 TypeScript 路径别名**
   
   编辑 `tsconfig.json`，添加 `compilerOptions`：
   ```json
   {
     "files": [],
     "references": [
       { "path": "./tsconfig.app.json" },
       { "path": "./tsconfig.node.json" }
     ],
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```
   
   编辑 `tsconfig.app.json`，在 `compilerOptions` 中添加路径映射：
   ```json
   {
     "compilerOptions": {
       // ... 其他配置保持不变 ...
       "jsx": "react-jsx",

       /* Path Mapping */
       "baseUrl": ".",
       "paths": {
         "@/*": ["./src/*"]
       },

       /* Linting */
       "strict": true,
       // ... 其他配置 ...
     }
   }
   ```
   
   **步骤 3.2: 配置 Vite 路径别名**
   
   编辑 `vite.config.ts`：
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import path from 'path'

   export default defineConfig({
     plugins: [react()],
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
   })
   ```
   
   **步骤 3.3: 初始化 Shadcn**
   
   ```powershell
   # 注意：使用 shadcn（不是 shadcn-ui，后者已弃用）
   npx shadcn@latest init
   
   # 交互式提示：
   # - Which color would you like to use as base color? 
   #   选择: Slate (用方向键↓移动，回车确认)
   
   # 会自动完成以下操作：
   # ✅ 创建 components.json
   # ✅ 更新 src/index.css 添加 CSS 变量
   # ✅ 安装依赖
   # ✅ 创建 src/lib/utils.ts
   ```
   
   **步骤 3.4: 安装常用组件**
   
   ```powershell
   # 安装 button 组件
   npx shadcn@latest add button
   
   # 安装 card 组件
   npx shadcn@latest add card
   
   # 安装 input 组件
   npx shadcn@latest add input
   ```
   
   **⚠️ 常见问题排查：**
   - 如果报错 "No import alias found"：确认 tsconfig.json 和 vite.config.ts 已配置路径别名
   - 如果提示安装 shadcn-ui：拒绝，改用 `npx shadcn@latest` 命令
   - 如果 npm 报错 "ENOENT npm directory"：运行 `mkdir C:\Users\你的用户名\AppData\Roaming\npm`

4. **配置ESLint和Prettier (15分钟):**
   ```powershell
   npm install -D prettier eslint-config-prettier eslint-plugin-prettier
   ```
   
   **创建 `.prettierrc`:**
   ```json
   {
     "semi": true,
     "trailingComma": "es5",
     "singleQuote": true,
     "printWidth": 100,
     "tabWidth": 2
   }
   ```

5. **创建Hello World页面 (20分钟):**
   
   **步骤 5.1: 更新 `src/App.tsx`**
   
   替换整个文件内容为：
   ```tsx
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
   import { Button } from '@/components/ui/button';
   
   function App() {
     return (
       <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
         <Card className="w-full max-w-md">
           <CardHeader>
             <CardTitle className="text-2xl text-center">
               🎓 G-Credit
             </CardTitle>
           </CardHeader>
           <CardContent className="text-center space-y-4">
             <p className="text-slate-600">
               Internal Digital Credentialing System
             </p>
             <p className="text-sm text-slate-500">
               Sprint 0 - Infrastructure Setup in Progress
             </p>
             <Button className="w-full">Coming Soon</Button>
           </CardContent>
         </Card>
       </div>
     );
   }
   
   export default App;
   ```
   
   **步骤 5.2: 修复 `src/index.css` 问题（重要！）**
   
   Shadcn 初始化后的 `src/index.css` 文件开头可能有问题导入，需要检查并修复：
   
   ```powershell
   # 打开 src/index.css 检查前几行
   cat src\index.css
   ```
   
   **如果看到 `@import "tw-animate-css";` 这一行，必须删除它！**
   
   正确的 `src/index.css` 开头应该是：
   ```css
   @plugin "tailwindcss-animate";

   @custom-variant dark (&:is(.dark *));

   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   
   /* 后面是 Shadcn 添加的 CSS 变量，保持不变 */
   ```
   
   **⚠️ 常见错误：** 如果不删除 `@import "tw-animate-css";`，会报错：
   ```
   ENOENT: no such file or directory, open 'C:\...\tw-animate-css'
   ```

6. **测试运行 (10分钟):**
   ```powershell
   npm run dev
   ```
   
   **期望结果：**
   - ✅ 终端显示：`VITE v7.x.x ready in XXX ms`
   - ✅ 显示：`Local: http://localhost:5173/`
   - ✅ 浏览器打开后看到漂亮的 G-Credit 卡片
   - ✅ 卡片有圆角、阴影、Slate 配色
   - ✅ "Coming Soon" 按钮有 hover 效果

7. **提交代码 (10分钟):**
   ```powershell
   git add .
   git commit -m "feat: initialize frontend with Vite, React 18, TypeScript, Tailwind CSS, Shadcn/ui"
   git push origin main
   ```

**Definition of Done:**
- ✅ `npm run dev` 启动成功，无报错
- ✅ 浏览器显示G-Credit欢迎页面，包含：
  - 🎓 标题 "G-Credit"
  - "Internal Digital Credentialing System" 描述
  - "Sprint 0 - Infrastructure Setup in Progress" 状态文本
  - "Coming Soon" 按钮（可点击，有 hover 效果）
- ✅ Hot reload工作正常（修改代码自动刷新）
- ✅ TypeScript编译无错误
- ✅ 代码提交到Git main分支

**Troubleshooting:**
- 如果报错 `ENOENT: tw-animate-css`：删除 `src/index.css` 中的 `@import "tw-animate-css";` 行
- 如果组件导入报错 `Cannot find module '@/components/ui/card'`：确认已运行 `npx shadcn@latest add card button`
- 如果 Tailwind 样式不生效（页面无样式）：检查 `postcss.config.js` 是否包含 `@tailwindcss/postcss` 插件
- 如果npm install慢：使用国内镜像 `npm config set registry https://registry.npmmirror.com`
- 如果端口5173被占用：Vite会自动使用5174等其他端口

---

### 🔧 Story 1.2: 初始化后端项目

**Story ID:** GCRED-1.2  
**Epic:** Epic 1 - Project Infrastructure Setup  
**Estimate:** 2小时  
**Priority:** MUST HAVE  

**User Story:**
> As a Developer,  
> I want to initialize a NestJS 10+ backend project with TypeScript and module structure,  
> So that I have a scalable, enterprise-ready API foundation.

**Implementation Tasks:**

1. **安装NestJS CLI (5分钟):**
   ```powershell
   npm install -g @nestjs/cli
   
   # 验证安装
   nest --version  # 应显示 10.x.x
   ```

2. **创建NestJS项目 (10分钟):**
   ```powershell
   cd C:\G_Credit\CODE\gcredit-project\backend
   
   # 创建项目（选择npm作为包管理器）
   nest new . --package-manager npm
   
   # 安装依赖（自动执行）
   ```

3. **安装Prisma ORM (10分钟):**
   ```powershell
   # 安装 Prisma CLI（开发依赖）和 Prisma Client（运行时依赖）
   npm install -D prisma
   npm install @prisma/client
   
   # 初始化Prisma
   npx prisma init
   ```
   
   **这会创建：**
   - `prisma/schema.prisma` - 数据模型定义
   - `.env` - 环境变量文件

4. **配置项目结构 (20分钟):**
   
   **安装配置模块：**
   ```powershell
   # 安装 NestJS 配置模块（用于环境变量管理）
   npm install @nestjs/config
   ```
   
   **创建模块目录：**
   ```powershell
   mkdir src\modules
   mkdir src\common
   mkdir src\config
   ```
   
   **更新 `src/app.module.ts`:**
   ```typescript
   import { Module } from '@nestjs/common';
   import { ConfigModule } from '@nestjs/config';
   import { AppController } from './app.controller';
   import { AppService } from './app.service';
   
   @Module({
     imports: [
       ConfigModule.forRoot({
         isGlobal: true,
         envFilePath: '.env',
       }),
     ],
     controllers: [AppController],
     providers: [AppService],
   })
   export class AppModule {}
   ```

5. **配置TypeScript严格模式 (10分钟):**
   
   **更新 `tsconfig.json`:**
   ```json
   {
     "compilerOptions": {
       "module": "commonjs",
       "declaration": true,
       "removeComments": true,
       "emitDecoratorMetadata": true,
       "experimentalDecorators": true,
       "allowSyntheticDefaultImports": true,
       "target": "ES2021",
       "sourceMap": true,
       "outDir": "./dist",
       "baseUrl": "./",
       "incremental": true,
       "skipLibCheck": true,
       "strictNullChecks": true,
       "noImplicitAny": true,
       "strictBindCallApply": true,
       "forceConsistentCasingInFileNames": true,
       "noFallthroughCasesInSwitch": true,
       "paths": {
         "@/*": ["src/*"]
       }
     }
   }
   ```

6. **创建健康检查endpoint (15分钟):**
   
   **更新 `src/app.controller.ts`:**
   ```typescript
   import { Controller, Get } from '@nestjs/common';
   import { AppService } from './app.service';
   
   @Controller()
   export class AppController {
     constructor(private readonly appService: AppService) {}
   
     @Get()
     getHello(): string {
       return this.appService.getHello();
     }
   
     @Get('health')
     getHealth() {
       return {
         status: 'ok',
         timestamp: new Date().toISOString(),
         service: 'gcredit-api',
         version: '0.1.0',
       };
     }
   }
   ```

7. **测试运行 (10分钟):**
   ```powershell
   npm run start:dev
   ```
   
   **验证：** 浏览器打开 http://localhost:3000/health
   
   **期望输出：**
   ```json
   {
     "status": "ok",
     "timestamp": "2026-01-23T10:30:00.000Z",
     "service": "gcredit-api",
     "version": "0.1.0"
   }
   ```

8. **提交代码 (10分钟):**
   ```powershell
   git add .
   git commit -m "feat: initialize backend with NestJS 10, Prisma, TypeScript strict mode"
   git push origin main
   ```

**Definition of Done:**
- ✅ `npm run start:dev` 启动成功
- ✅ http://localhost:3000/health 返回JSON
- ✅ TypeScript编译无错误
- ✅ Prisma已初始化（schema.prisma文件存在）
- ✅ 代码提交到Git

---

### 🗄️ Story 1.3: 配置Azure PostgreSQL数据库连接

**Story ID:** GCRED-1.3  
**Epic:** Epic 1 - Project Infrastructure Setup  
**Estimate:** 3小时  
**Priority:** MUST HAVE  

**User Story:**
> As a Developer,  
> I want to configure Prisma ORM with Azure PostgreSQL database connection,  
> So that I can define data models and perform database operations.

**Implementation Tasks:**

1. **在Azure创建PostgreSQL Flexible Server (30分钟):**
   
   **通过Azure Portal：**
   - 登录 https://portal.azure.com
   - 搜索 "Azure Database for PostgreSQL flexible servers"
   - 点击 "Create"
   
   **配置项：**
   - **Resource Group:** 创建新的 `rg-gcredit-dev`
   - **Server name:** `gcredit-dev-db` (必须全局唯一，加上你的名字initials)
   - **Region:** East Asia 或 Southeast Asia（选靠近你的）
   - **PostgreSQL version:** 16
   - **Workload type:** Development
   - **Compute + Storage:** 
     - Compute tier: Burstable
     - Compute size: B1ms (1 vCore, 2 GiB RAM) ← Phase 1配置
     - Storage: 32 GiB
   - **Authentication:** 
     - Method: PostgreSQL authentication only
     - Admin username: `gcreditadmin`
     - Password: 创建强密码（记下来！）
   - **Networking:**
     - Connectivity method: Public access (允许所有Azure services)
     - Firewall rules: 添加你的当前IP地址
     - ✅ Allow public access from any Azure service
   
   **点击 "Review + create" → "Create"**
   
   **等待部署完成（5-10分钟）**

2. **获取连接字符串 (10分钟):**
   
   **部署完成后：**
   - 进入你的PostgreSQL服务器
   - 左侧菜单：Settings → Connection strings
   - 复制 "ADO.NET" 或 "Node.js" 连接字符串
   
   **示例连接字符串：**
   ```
   postgresql://gcreditadmin:{your_password}@gcredit-dev-db.postgres.database.azure.com:5432/postgres?sslmode=require
   ```

3. **配置Prisma连接 (15分钟):**
   
   **更新 `backend/.env`:**
   ```env
   # Database
   DATABASE_URL="postgresql://gcreditadmin:YourPassword123!@gcredit-dev-db.postgres.database.azure.com:5432/postgres?sslmode=require"
   
   # JWT Secret (generate random string)
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   JWT_EXPIRES_IN="7d"
   
   # Server
   PORT=3000
   NODE_ENV="development"
   ```
   
   **⚠️ 安全提示：** 不要commit .env文件到Git！
   
   **创建 `.env.example` 模板：**
   ```env
   DATABASE_URL="postgresql://username:password@host:5432/dbname?sslmode=require"
   JWT_SECRET="your-secret-key"
   JWT_EXPIRES_IN="7d"
   PORT=3000
   NODE_ENV="development"
   ```

4. **定义User数据模型 (20分钟):**
   
   **更新 `prisma/schema.prisma`:**
   ```prisma
   generator client {
     provider = "prisma-client-js"
   }
   
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   
   enum UserRole {
     ADMIN
     ISSUER
     MANAGER
     EMPLOYEE
   }
   
   model User {
     id        String   @id @default(uuid())
     email     String   @unique
     password  String
     name      String?
     role      UserRole @default(EMPLOYEE)
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   
     @@map("users")
   }
   ```

5. **生成Prisma Client并运行Migration (20分钟):**
   ```powershell
   cd backend
   
   # 生成Prisma Client
   npx prisma generate
   
   # 创建并运行第一个migration
   npx prisma migrate dev --name init
   
   # 如果成功，会看到：
   # ✔ Migration applied successfully
   ```
   
   **验证数据库：**
   ```powershell
   # 打开Prisma Studio（可视化数据库工具）
   npx prisma studio
   ```
   
   浏览器会打开 http://localhost:5555，你应该能看到空的 `users` 表

6. **配置Prisma Service (30分钟):**
   
   **创建 `src/prisma/prisma.service.ts`:**
   ```typescript
   import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
   import { PrismaClient } from '@prisma/client';
   
   @Injectable()
   export class PrismaService 
     extends PrismaClient 
     implements OnModuleInit, OnModuleDestroy 
   {
     async onModuleInit() {
       await this.$connect();
       console.log('✅ Database connected successfully');
     }
   
     async onModuleDestroy() {
       await this.$disconnect();
     }
   }
   ```
   
   **创建 `src/prisma/prisma.module.ts`:**
   ```typescript
   import { Module, Global } from '@nestjs/common';
   import { PrismaService } from './prisma.service';
   
   @Global()
   @Module({
     providers: [PrismaService],
     exports: [PrismaService],
   })
   export class PrismaModule {}
   ```
   
   **更新 `src/app.module.ts`，添加PrismaModule：**
   ```typescript
   import { Module } from '@nestjs/common';
   import { ConfigModule } from '@nestjs/config';
   import { PrismaModule } from './prisma/prisma.module';
   import { AppController } from './app.controller';
   import { AppService } from './app.service';
   
   @Module({
     imports: [
       ConfigModule.forRoot({
         isGlobal: true,
         envFilePath: '.env',
       }),
       PrismaModule,
     ],
     controllers: [AppController],
     providers: [AppService],
   })
   export class AppModule {}
   ```

7. **更新健康检查包含数据库状态 (15分钟):**
   
   **更新 `src/app.controller.ts`:**
   ```typescript
   import { Controller, Get } from '@nestjs/common';
   import { AppService } from './app.service';
   import { PrismaService } from './prisma/prisma.service';
   
   @Controller()
   export class AppController {
     constructor(
       private readonly appService: AppService,
       private readonly prisma: PrismaService,
     ) {}
   
     @Get('health')
     async getHealth() {
       let dbStatus = 'disconnected';
       try {
         await this.prisma.$queryRaw`SELECT 1`;
         dbStatus = 'connected';
       } catch (error) {
         dbStatus = 'error';
       }
   
       return {
         status: 'ok',
         timestamp: new Date().toISOString(),
         service: 'gcredit-api',
         version: '0.1.0',
         database: dbStatus,
       };
     }
   
     @Get('ready')
     async getReady() {
       try {
         await this.prisma.$queryRaw`SELECT 1`;
         return {
           status: 'ready',
           database: 'connected',
         };
       } catch (error) {
         return {
           status: 'not ready',
           database: 'disconnected',
           error: error.message,
         };
       }
     }
   }
   ```

8. **测试数据库连接 (10分钟):**
   ```powershell
   npm run start:dev
   ```
   
   **验证：** 访问 http://localhost:3000/health
   
   **期望输出：**
   ```json
   {
     "status": "ok",
     "timestamp": "2026-01-23T...",
     "service": "gcredit-api",
     "version": "0.1.0",
     "database": "connected"
   }
   ```

9. **提交代码 (10分钟):**
   ```powershell
   # 不要commit .env！
   git add .
   git commit -m "feat: configure Azure PostgreSQL with Prisma, add User model"
   git push origin main
   ```

**Definition of Done:**
- ✅ Azure PostgreSQL Flexible Server部署成功
- ✅ Prisma连接到Azure数据库
- ✅ User表创建成功
- ✅ /health endpoint显示database: "connected"
- ✅ Prisma Studio能打开并显示users表
- ✅ .env.example已创建，.env在.gitignore中

**Troubleshooting:**
- **连接超时：** 检查Azure防火墙规则，确保你的IP地址在允许列表
- **SSL错误：** 确保连接字符串包含 `?sslmode=require`
- **Migration失败：** 检查DATABASE_URL是否正确，密码是否有特殊字符需要URL编码

---

### ☁️ Story 1.4: 配置Azure Blob Storage

**Story ID:** GCRED-1.4  
**Epic:** Epic 1 - Project Infrastructure Setup  
**Estimate:** 2小时  
**Priority:** MUST HAVE  

**User Story:**
> As a Developer,  
> I want to configure Azure Blob Storage for badge image uploads,  
> So that badge images are stored persistently and accessible via public URLs.

**Implementation Tasks:**

1. **在Azure创建Storage Account (20分钟):**
   
   **通过Azure Portal：**
   - 搜索 "Storage accounts"
   - 点击 "Create"
   
   **配置项：**
   - **Resource Group:** `rg-gcredit-dev` (同PostgreSQL)
   - **Storage account name:** `gcreditdevstorage` (必须全局唯一，只能小写字母和数字)
   - **Region:** 同PostgreSQL相同region
   - **Performance:** Standard
   - **Redundancy:** Locally-redundant storage (LRS) ← Phase 1最便宜
   - **Advanced → Security:**
     - ✅ Enable storage account key access
     - ✅ Allow Blob anonymous access
   
   **点击 "Review + create" → "Create"**

2. **创建Blob Containers (15分钟):**
   
   **部署完成后：**
   - 进入Storage Account
   - 左侧菜单：Data storage → Containers
   - 点击 "+ Container"
   
   **创建两个containers：**
   
   **Container 1: badges**
   - Name: `badges`
   - Public access level: **Blob (anonymous read access for blobs only)**
   - 用途：Badge模板图片（400×400px PNG）
   
   **Container 2: evidence**
   - Name: `evidence`
   - Public access level: **Private (no anonymous access)**
   - 用途：Badge发放证据文件

3. **获取Storage连接信息 (10分钟):**
   
   **获取Access Key：**
   - 左侧菜单：Security + networking → Access keys
   - 点击 "Show keys"
   - 复制 **key1** 的 "Connection string"
   
   **示例连接字符串：**
   ```
   DefaultEndpointsProtocol=https;AccountName=gcreditdevstorage;AccountKey=xxxxxx==;EndpointSuffix=core.windows.net
   ```

4. **配置Backend环境变量 (10分钟):**
   
   **更新 `backend/.env`:**
   ```env
   # Azure Blob Storage
   AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=gcreditdevstorage;AccountKey=your-key-here;EndpointSuffix=core.windows.net"
   AZURE_STORAGE_ACCOUNT_NAME="gcreditdevstorage"
   AZURE_STORAGE_CONTAINER_BADGES="badges"
   AZURE_STORAGE_CONTAINER_EVIDENCE="evidence"
   ```
   
   **更新 `.env.example`:**
   ```env
   AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=xxx;AccountKey=xxx;EndpointSuffix=core.windows.net"
   AZURE_STORAGE_ACCOUNT_NAME="your-storage-account"
   AZURE_STORAGE_CONTAINER_BADGES="badges"
   AZURE_STORAGE_CONTAINER_EVIDENCE="evidence"
   ```

5. **安装Azure SDK (5分钟):**
   ```powershell
   cd backend
   npm install @azure/storage-blob
   ```

6. **创建Storage Service (30分钟):**
   
   **创建 `src/storage/storage.service.ts`:**
   ```typescript
   import { Injectable, Logger } from '@nestjs/common';
   import { ConfigService } from '@nestjs/config';
   import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
   
   @Injectable()
   export class StorageService {
     private readonly logger = new Logger(StorageService.name);
     private blobServiceClient: BlobServiceClient;
     private badgesContainer: ContainerClient;
     private evidenceContainer: ContainerClient;
   
     constructor(private configService: ConfigService) {
       const connectionString = this.configService.get<string>(
         'AZURE_STORAGE_CONNECTION_STRING',
       );
       
       if (!connectionString) {
         throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
       }
   
       this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
       
       const badgesContainerName = this.configService.get<string>(
         'AZURE_STORAGE_CONTAINER_BADGES',
       );
       const evidenceContainerName = this.configService.get<string>(
         'AZURE_STORAGE_CONTAINER_EVIDENCE',
       );
       
       this.badgesContainer = this.blobServiceClient.getContainerClient(badgesContainerName);
       this.evidenceContainer = this.blobServiceClient.getContainerClient(evidenceContainerName);
       
       this.logger.log('✅ Azure Blob Storage initialized');
     }
   
     async uploadBadgeImage(
       file: Express.Multer.File,
       filename?: string,
     ): Promise<string> {
       const blobName = filename || `${Date.now()}-${file.originalname}`;
       const blockBlobClient = this.badgesContainer.getBlockBlobClient(blobName);
       
       await blockBlobClient.uploadData(file.buffer, {
         blobHTTPHeaders: { blobContentType: file.mimetype },
       });
       
       this.logger.log(`Badge image uploaded: ${blobName}`);
       return blockBlobClient.url;
     }
   
     async testConnection(): Promise<boolean> {
       try {
         await this.badgesContainer.exists();
         return true;
       } catch (error) {
         this.logger.error('Storage connection test failed:', error);
         return false;
       }
     }
   }
   ```
   
   **创建 `src/storage/storage.module.ts`:**
   ```typescript
   import { Module, Global } from '@nestjs/common';
   import { StorageService } from './storage.service';
   
   @Global()
   @Module({
     providers: [StorageService],
     exports: [StorageService],
   })
   export class StorageModule {}
   ```
   
   **更新 `src/app.module.ts`:**
   ```typescript
   import { Module } from '@nestjs/common';
   import { ConfigModule } from '@nestjs/config';
   import { PrismaModule } from './prisma/prisma.module';
   import { StorageModule } from './storage/storage.module';
   import { AppController } from './app.controller';
   import { AppService } from './app.service';
   
   @Module({
     imports: [
       ConfigModule.forRoot({
         isGlobal: true,
         envFilePath: '.env',
       }),
       PrismaModule,
       StorageModule,
     ],
     controllers: [AppController],
     providers: [AppService],
   })
   export class AppModule {}
   ```

7. **添加存储健康检查 (15分钟):**
   
   **更新 `src/app.controller.ts`:**
   ```typescript
   import { Controller, Get } from '@nestjs/common';
   import { AppService } from './app.service';
   import { PrismaService } from './prisma/prisma.service';
   import { StorageService } from './storage/storage.service';
   
   @Controller()
   export class AppController {
     constructor(
       private readonly appService: AppService,
       private readonly prisma: PrismaService,
       private readonly storage: StorageService,
     ) {}
   
     @Get('health')
     async getHealth() {
       let dbStatus = 'disconnected';
       let storageStatus = 'disconnected';
       
       try {
         await this.prisma.$queryRaw`SELECT 1`;
         dbStatus = 'connected';
       } catch (error) {
         dbStatus = 'error';
       }
       
       try {
         const connected = await this.storage.testConnection();
         storageStatus = connected ? 'connected' : 'error';
       } catch (error) {
         storageStatus = 'error';
       }
   
       return {
         status: 'ok',
         timestamp: new Date().toISOString(),
         service: 'gcredit-api',
         version: '0.1.0',
         database: dbStatus,
         storage: storageStatus,
       };
     }
   }
   ```

8. **测试连接 (10分钟):**
   ```powershell
   npm run start:dev
   ```
   
   **验证：** http://localhost:3000/health
   
   **期望输出：**
   ```json
   {
     "status": "ok",
     "timestamp": "2026-01-23T...",
     "service": "gcredit-api",
     "version": "0.1.0",
     "database": "connected",
     "storage": "connected"
   }
   ```

9. **提交代码 (10分钟):**
   ```powershell
   git add .
   git commit -m "feat: configure Azure Blob Storage with badge and evidence containers"
   git push origin main
   ```

**Definition of Done:**
- ✅ Azure Storage Account创建成功
- ✅ badges和evidence containers创建
- ✅ StorageService初始化成功
- ✅ /health endpoint显示storage: "connected"
- ✅ 代码提交到Git

---

### 📝 Story 1.5: 创建项目README和开发指南

**Story ID:** GCRED-1.5  
**Epic:** Epic 1 - Project Infrastructure Setup  
**Estimate:** 1小时  
**Priority:** SHOULD HAVE  

**User Story:**
> As a Developer,  
> I want comprehensive README documentation,  
> So that I (and future team members) can quickly set up and run the project.

**Implementation Tasks:**

1. **创建根目录README (30分钟):**
   
   **创建 `README.md` 在项目根目录：**
   ```markdown
   # G-Credit - Internal Digital Credentialing System
   
   🎓 Open Badges 2.0 compliant digital credentialing platform for enterprise badge issuance and verification.
   
   ## Project Status
   
   **Current Sprint:** Sprint 0 (Infrastructure Setup)  
   **Sprint Duration:** 2026-01-23 → 2026-02-05  
   **Progress:** 🟢 On Track
   
   ## Tech Stack
   
   **Frontend:**
   - React 18 + TypeScript
   - Vite (build tool)
   - Tailwind CSS + Shadcn/ui
   - React Router
   
   **Backend:**
   - NestJS 10 + TypeScript
   - Prisma 5 ORM
   - PostgreSQL 16
   - JWT Authentication
   
   **Infrastructure (Phase 1):**
   - Azure PostgreSQL Flexible Server (B1ms)
   - Azure Blob Storage (Standard LRS)
   
   ## Prerequisites
   
   - Node.js 20 LTS
   - npm 10+
   - Git
   - Azure subscription (for PostgreSQL and Blob Storage)
   
   ## Quick Start
   
   ### 1. Clone Repository
   
   \`\`\`bash
   git clone https://github.com/yourusername/gcredit.git
   cd gcredit
   \`\`\`
   
   ### 2. Setup Backend
   
   \`\`\`bash
   cd backend
   npm install
   
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your Azure connection strings
   # (PostgreSQL DATABASE_URL and Azure Storage)
   
   # Run database migrations
   npx prisma migrate dev
   
   # Generate Prisma Client
   npx prisma generate
   
   # Start dev server
   npm run start:dev
   \`\`\`
   
   Backend will run on http://localhost:3000
   
   ### 3. Setup Frontend
   
   \`\`\`bash
   cd frontend
   npm install
   
   # Start dev server
   npm run dev
   \`\`\`
   
   Frontend will run on http://localhost:5173
   
   ## Health Checks
   
   - **API Health:** http://localhost:3000/health
   - **API Readiness:** http://localhost:3000/ready
   
   Expected response:
   \`\`\`json
   {
     "status": "ok",
     "timestamp": "2026-01-23T...",
     "service": "gcredit-api",
     "version": "0.1.0",
     "database": "connected",
     "storage": "connected"
   }
   \`\`\`
   
   ## Database Management
   
   \`\`\`bash
   cd backend
   
   # Open Prisma Studio (visual database editor)
   npx prisma studio
   
   # Create new migration
   npx prisma migrate dev --name your_migration_name
   
   # Reset database (WARNING: deletes all data)
   npx prisma migrate reset
   \`\`\`
   
   ## Project Structure
   
   \`\`\`
   gcredit-project/
   ├── frontend/          # React frontend
   │   ├── src/
   │   │   ├── components/
   │   │   ├── pages/
   │   │   └── App.tsx
   │   └── package.json
   ├── backend/           # NestJS backend
   │   ├── src/
   │   │   ├── modules/
   │   │   ├── prisma/
   │   │   ├── storage/
   │   │   └── main.ts
   │   ├── prisma/
   │   │   └── schema.prisma
   │   └── package.json
   └── README.md
   \`\`\`
   
   ## Sprint Planning
   
   See `_bmad-output/implementation-artifacts/sprint-0-backlog.md` for detailed Sprint 0 plan.
   
   ## Documentation
   
   - [PRD](_bmad-output/planning-artifacts/PRD.md)
   - [Architecture](_bmad-output/planning-artifacts/architecture.md)
   - [Epics & Stories](_bmad-output/planning-artifacts/epics.md)
   - [Implementation Readiness](_bmad-output/planning-artifacts/implementation-readiness-report-2026-01-22.md)
   
   ## Development Notes
   
   **Phase 1 Limitations:**
   - JWT authentication only (no Azure AD SSO)
   - Email notifications only (no Teams bot)
   - Bulk issuance limited to 50 badges
   - Console logging (no Application Insights)
   
   These are intentional simplifications for MVP. Phase 3 will add full Azure suite.
   
   ## License
   
   MIT License
   \`\`\`

2. **创建Frontend README (15分钟):**
   
   **创建 `frontend/README.md`:**
   ```markdown
   # G-Credit Frontend
   
   React 18 + TypeScript + Vite + Tailwind CSS
   
   ## Development
   
   \`\`\`bash
   npm install
   npm run dev        # Start dev server
   npm run build      # Production build
   npm run preview    # Preview production build
   npm run lint       # Run ESLint
   \`\`\`
   
   ## Environment Variables
   
   Create `.env.local`:
   \`\`\`
   VITE_API_URL=http://localhost:3000
   \`\`\`
   
   ## Component Library
   
   Using [shadcn/ui](https://ui.shadcn.com/) components.
   
   Add new components:
   \`\`\`bash
   npx shadcn-ui@latest add <component-name>
   \`\`\`
   \`\`\`

3. **创建Backend README (15分钟):**
   
   **创建 `backend/README.md`:**
   ```markdown
   # G-Credit Backend API
   
   NestJS 10 + Prisma 5 + PostgreSQL 16
   
   ## Development
   
   \`\`\`bash
   npm install
   npm run start:dev  # Start dev server with hot reload
   npm run build      # Production build
   npm run start:prod # Start production server
   npm run test       # Run tests
   \`\`\`
   
   ## Environment Variables
   
   Required in `.env`:
   - DATABASE_URL
   - AZURE_STORAGE_CONNECTION_STRING
   - JWT_SECRET
   
   See `.env.example` for template.
   
   ## API Endpoints
   
   - `GET /health` - Health check
   - `GET /ready` - Readiness probe
   
   ## Database Migrations
   
   \`\`\`bash
   npx prisma migrate dev     # Create and apply migration
   npx prisma migrate deploy  # Apply migrations (production)
   npx prisma studio          # Open database GUI
   \`\`\`
   \`\`\`

**Definition of Done:**
- ✅ 项目根目录有完整README.md
- ✅ Frontend和Backend有各自的README
- ✅ Quick Start步骤清晰可执行
- ✅ 提交到Git

---

## 📅 Sprint 0 建议时间表

### Week 1 (Jan 23-26, 周四-周日)

**Day 1 (Thu Jan 23) - 3小时：**
- ⏱️ 1小时：验证/安装Node.js 20 LTS
- ⏱️ 2小时：Story 1.1 - 初始化前端项目

**Day 2 (Fri Jan 24) - 3小时：**
- ⏱️ 2小时：Story 1.2 - 初始化后端项目
- ⏱️ 1小时：开始Story 1.3 - 创建Azure PostgreSQL

**Day 3 (Sat Jan 25) - 4小时：**
- ⏱️ 2小时：完成Story 1.3 - PostgreSQL配置和Prisma连接
- ⏱️ 2小时：Story 1.4 - Azure Blob Storage配置

**Day 4 (Sun Jan 26) - 3小时：**
- ⏱️ 1小时：完成Story 1.4
- ⏱️ 1小时：Story 1.5 - 创建README文档
- ⏱️ 1小时：测试所有health checks

**Week 1 Total:** 13小时

---

### Week 2 (Jan 27 - Feb 2, 周一-周日)

**Day 5 (Mon Jan 27) - 2小时：**
- ⏱️ 2小时：开始Story 2.1 - User模型和CRUD

**Day 6 (Tue Jan 28) - 3小时：**
- ⏱️ 3小时：继续Story 2.1 - 完成User API endpoints

**Day 7 (Wed Jan 29) - 休息或buffer time**

**Day 8 (Thu Jan 30) - 2小时：**
- ⏱️ 2小时：前端登录页面UI（无功能）

**Day 9 (Fri Jan 31) - 2小时：**
- ⏱️ 2小时：前端基础layout和routing

**Day 10 (Sat Feb 1) - 3小时：**
- ⏱️ 3小时：Integration testing和bug fixes

**Day 11 (Sun Feb 2) - 2小时：**
- ⏱️ 2小时：Sprint Review准备，更新文档

**Week 2 Total:** 14小时

---

### Sprint 0 Final Day

**Day 12 (Wed Feb 5) - 1小时：**
- ⏱️ 1小时：Sprint Review和Retrospective（自我review）

**Sprint 0 Total Time:** 28小时

---

## ✅ Sprint 0 Definition of Done

**Infrastructure:**
- ✅ React 18 frontend项目运行
- ✅ NestJS 10 backend API运行
- ✅ Azure PostgreSQL连接成功
- ✅ Azure Blob Storage连接成功
- ✅ Prisma Client生成并能查询数据库
- ✅ User表创建成功

**Code Quality:**
- ✅ TypeScript编译无错误
- ✅ ESLint检查通过
- ✅ 代码提交到GitHub

**Documentation:**
- ✅ README.md包含完整setup指南
- ✅ .env.example提供配置模板
- ✅ 所有Azure资源配置文档化

**Health Checks:**
- ✅ GET /health 返回所有服务状态
- ✅ GET /ready 验证数据库连接
- ✅ 前端能访问并显示UI

---

## 📝 Daily Standup Template

每天开发前问自己三个问题：

**Yesterday (昨天):**
- 完成了什么story/task？
- 遇到了什么blockers？

**Today (今天):**
- 计划完成哪些task？
- 预计花费多少时间？

**Blockers (阻碍):**
- 有什么技术问题需要解决？
- 需要什么帮助或资源？

建议：在项目根目录创建 `daily-notes.md` 记录每天进展。

---

## 🚨 Troubleshooting Guide

### 常见问题

**1. npm install慢或失败：**
```powershell
# 使用国内镜像
npm config set registry https://registry.npmmirror.com

# 清除缓存重试
npm cache clean --force
npm install
```

**2. Azure PostgreSQL连接超时：**
- 检查防火墙规则包含你的IP
- 确保连接字符串包含 `?sslmode=require`
- 尝试ping数据库: `Test-NetConnection -ComputerName your-server.postgres.database.azure.com -Port 5432`

**3. Prisma migration失败：**
```powershell
# 重置数据库（删除所有数据）
npx prisma migrate reset

# 手动删除 prisma/migrations 文件夹，重新开始
```

**4. Azure Blob Storage 403 Forbidden：**
- 检查container的Public access level设置
- 确保connection string正确
- 验证Access Key未过期

**5. TypeScript编译错误：**
```powershell
# 删除node_modules重新安装
rm -r node_modules
rm package-lock.json
npm install
```

---

## 📞 Support & Communication

**Scrum Master:** 通过GitHub Issues提问，标签 `[Sprint 0]`

**Daily Check-in:** 建议每天commit代码，commit message格式：
- `feat: 新功能`
- `fix: bug修复`
- `docs: 文档更新`
- `chore: 配置或工具改动`

---

## 🎯 Sprint 0 Success Metrics

**Must Have (P0):**
- ✅ 前后端项目能运行
- ✅ 数据库连接成功
- ✅ Blob Storage连接成功

**Should Have (P1):**
- ✅ README文档完整
- ✅ Health checks工作
- ✅ User表创建

**Nice to Have (P2):**
- ✅ 前端基础UI美观
- ✅ 后端日志清晰
- ✅ Git commit历史干净

---

## 📈 Ready for Sprint 1?

Sprint 0完成后，你应该能够：
- ✅ 在本地运行前后端
- ✅ 连接到Azure PostgreSQL和Blob Storage
- ✅ 使用Prisma操作数据库
- ✅ 看到基础的前端UI

**Sprint 1 Preview:**
- Epic 2: JWT认证（登录/注册/token管理）
- Epic 3开始: Badge Template CRUD

---

**Good luck! Let's build something amazing! 🚀**

**Questions?** Review this document daily and track your progress!
