# Accessibility Tools Setup - Sprint 7 Day 1 准备

**任务**: 配置前端accessibility测试工具  
**负责人**: Amelia (Developer)  
**时间**: 30分钟  
**必须在**: Day 1 (Feb 3, 2026) 开始前完成  
**状态**: 📋 待执行

---

## 目标

为Sprint 7配置accessibility自动化测试工具，确保Story 0.2a (Login & Navigation MVP)符合基本accessibility标准。

---

## 安装步骤

### 1. 安装npm依赖包（15分钟）

```bash
cd gcredit-project/frontend

# 安装axe-core accessibility测试库
npm install --save-dev axe-core @axe-core/react

# 安装ESLint accessibility plugin
npm install --save-dev eslint-plugin-jsx-a11y
```

**依赖包说明:**
- `axe-core`: Deque的accessibility测试引擎（行业标准）
- `@axe-core/react`: React集成，开发模式下自动检测accessibility问题
- `eslint-plugin-jsx-a11y`: ESLint规则，编码时检测accessibility问题

---

### 2. 配置ESLint（10分钟）

更新 `gcredit-project/frontend/eslint.config.js`:

```javascript
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y'; // NEW

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      jsxA11y.configs.recommended, // NEW
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y, // NEW
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Accessibility rules for Sprint 7 MVP
      'jsx-a11y/alt-text': 'error', // Images must have alt text
      'jsx-a11y/aria-props': 'error', // Valid ARIA props only
      'jsx-a11y/aria-proptypes': 'error', // Valid ARIA values
      'jsx-a11y/aria-unsupported-elements': 'error', // ARIA on supported elements
      'jsx-a11y/role-has-required-aria-props': 'error', // Required ARIA props
      'jsx-a11y/label-has-associated-control': 'error', // Forms: labels must link to inputs
      'jsx-a11y/no-autofocus': 'warn', // Autofocus can disrupt screen readers (warn only)
    },
  },
);
```

**配置说明:**
- `jsxA11y.configs.recommended`: 启用推荐的accessibility规则
- 自定义规则: 强制form labels, alt text, valid ARIA
- `no-autofocus`: 警告级别（MVP可接受，Sprint 8修复）

---

### 3. 配置axe-core（5分钟）

创建 `gcredit-project/frontend/src/lib/axe-setup.ts`:

```typescript
/**
 * Axe-core accessibility testing setup
 * Runs in development mode only
 * Logs accessibility violations to console
 */

if (import.meta.env.DEV) {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000, {
      // Report all accessibility violations
      rules: {
        // Sprint 7 MVP rules (basic accessibility)
        'label': { enabled: true }, // Forms must have labels
        'button-name': { enabled: true }, // Buttons must have accessible names
        'link-name': { enabled: true }, // Links must have accessible names
        'aria-required-attr': { enabled: true }, // Required ARIA attributes
        'aria-valid-attr': { enabled: true }, // Valid ARIA attributes
        'color-contrast': { enabled: false }, // Defer to Sprint 8 (time-consuming)
      },
    });
  });
}
```

更新 `gcredit-project/frontend/src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/axe-setup'; // NEW: Load axe-core in dev mode

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

**配置说明:**
- 仅在development模式运行（`import.meta.env.DEV`）
- 1000ms延迟（等待页面渲染完成）
- Sprint 7 MVP规则：focus on form labels, ARIA, button names
- `color-contrast`: Sprint 8启用（需要手动测试，耗时）

---

## 验证步骤

### 1. 验证ESLint配置

```bash
cd gcredit-project/frontend
npm run lint
```

**期望输出:**
- 如果代码有accessibility问题，会看到警告/错误
- Example: `jsx-a11y/label-has-associated-control: Form controls must have labels`

### 2. 验证axe-core集成

```bash
npm run dev
```

打开浏览器: http://localhost:5173

**期望行为:**
- 打开浏览器DevTools Console
- 如果页面有accessibility violations，会看到红色axe-core报告
- Example: `[axe] 3 accessibility violations found`

### 3. 测试示例

创建临时测试页面验证工具是否工作：

```tsx
// src/pages/TestA11y.tsx (temporary)
export default function TestA11y() {
  return (
    <div>
      {/* ❌ BAD: No label */}
      <input type="text" />
      
      {/* ❌ BAD: No alt text */}
      <img src="/badge.png" />
      
      {/* ❌ BAD: Invalid ARIA */}
      <div role="button" aria-label="click me">Click</div>
      
      {/* ✅ GOOD: Proper label */}
      <label>
        Email:
        <input type="email" />
      </label>
    </div>
  );
}
```

访问 `/test-a11y` 路由，应该在Console看到3个violations。

---

## 完成确认清单

- [ ] axe-core, @axe-core/react, eslint-plugin-jsx-a11y 已安装
- [ ] eslint.config.js 已更新（jsx-a11y plugin配置）
- [ ] axe-setup.ts 已创建
- [ ] main.tsx 已导入axe-setup
- [ ] `npm run lint` 正常运行（无配置错误）
- [ ] `npm run dev` 后Console显示axe-core报告（如果有violations）
- [ ] 已删除 TestA11y.tsx 临时测试文件

---

## 参考文档

- [axe-core GitHub](https://github.com/dequelabs/axe-core)
- [@axe-core/react Documentation](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/react)
- [eslint-plugin-jsx-a11y GitHub](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 后续工作（Sprint 8）

Sprint 7 MVP仅需基本accessibility（form labels, ARIA, button names）。  
Sprint 8 (Story 0.2b) 会添加完整WCAG 2.1 AA compliance:

- Color contrast testing (axe-core rule)
- Screen reader testing (NVDA, VoiceOver)
- Keyboard navigation testing
- Focus management
- Skip to main content link
- ARIA live regions

---

**创建日期**: February 1, 2026  
**创建人**: Bob (Scrum Master)  
**用途**: Sprint 7 Day 1准备工作（Action Item #13）
