# Vibe i18n

[![CI](https://github.com/becoolme/vibe-i18n/workflows/CI/badge.svg)](https://github.com/becoolme/vibe-i18n/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/vibei18n.svg)](https://badge.fury.io/js/vibei18n)
[![Node.js Version](https://img.shields.io/node/v/vibei18n)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

专为 Vue.js、Next.js 和其他 JavaScript 项目设计的强大 i18n 翻译管理 CLI 工具。特别为 AI 代理优化，可高效管理翻译而无需读取大型语言环境文件，节省 token 并防止文件损坏。

## 功能特性

- 🚀 **CLI 优先方式** - 使用 `npx vibei18n` 管理翻译
- 📁 **智能语言环境扫描** - 自动发现语言环境文件
- 🔍 **翻译完整性检查** - 查找缺失的翻译
- 🔧 **硬编码字符串检测** - 扫描代码库中的硬编码字符串
- 📊 **详细统计** - 获取翻译覆盖率洞察
- 🎯 **重复检测** - 查找跨语言环境的重复翻译
- 💻 **编程式 API** - 在 Node.js 项目中作为库使用
- 🌐 **多种格式支持** - 支持 JSON 和 JS 语言环境文件

## AI 代理集成

对于使用翻译的 AI 代理，请使用 CLI 命令而不是直接读写文件，以确保数据完整性和正确验证：

### AI 代理提示词：
```
在处理 i18n 翻译时，始终使用 CLI 命令而不是直接读取或修改语言环境文件。这确保了正确的验证、格式化并防止损坏。

可用的翻译管理命令：
- 获取翻译: npx vibei18n get <locale> <key>
- 设置翻译: npx vibei18n set <locale> <key> <value>
- 检查是否存在: npx vibei18n has <locale> <key>
- 获取键的所有语言环境: npx vibei18n getAll <key>
- 查找缺失: npx vibei18n missing <key>
- 检查完整性: npx vibei18n check --detailed
- 显示统计: npx vibei18n stats
- 列出语言环境: npx vibei18n locales
- 查找硬编码字符串: npx vibei18n hardcode-check --verbose

示例工作流程：
1. 检查当前状态: npx vibei18n stats
2. 获取特定翻译: npx vibei18n get en-US common.loading
3. 更新翻译: npx vibei18n set zh-hans common.loading "加载中..."
4. 验证更改: npx vibei18n get zh-hans common.loading
```

## 快速开始

1. **初始化语言环境结构：**
```bash
npx vibei18n init
```
   创建 `i18n/locales` 目录并包含示例文件。如果目录已存在可跳过。

2. **检查翻译完整性：**
```bash
npx vibei18n check --detailed
```

3. **查找代码中的硬编码字符串：**
```bash
npx vibei18n hardcode-check --verbose
```

4. **添加新翻译：**
```bash
npx vibei18n set zh-hans page.title "页面标题"
```

## CLI 命令

### 基本操作

```bash
# 获取翻译值
npx vibei18n get en-US common.loading

# 设置翻译值
npx vibei18n set zh-hans page.title "页面标题"

# 检查翻译是否存在
npx vibei18n has en-US common.loading

# 获取某个键的所有翻译
npx vibei18n getAll common.loading

# 查找缺失的翻译
npx vibei18n missing page.title
```

### 分析命令

```bash
# 检查翻译完整性
npx vibei18n check --detailed

# 显示翻译统计
npx vibei18n stats --verbose

# 查找重复翻译
npx vibei18n duplicates

# 列出可用语言环境
npx vibei18n locales
```

### 硬编码字符串检测

```bash
# 基本硬编码字符串扫描
npx vibei18n hardcode-check

# 详细输出和上下文
npx vibei18n hardcode-check --verbose

# 扫描特定文件类型
npx vibei18n hardcode-check --ext vue,tsx,jsx

# 扫描特定目录
npx vibei18n hardcode-check ./src --verbose
```

### 初始化

```bash
# 初始化默认结构 (./i18n/locales)
npx vibei18n init

# 使用自定义目录初始化
npx vibei18n init --dir ./locales
```

`init` 命令创建带有示例文件的初始语言环境目录结构。默认在当前工作目录中创建 `i18n/locales` 目录。如果目录已存在，您可以选择跳过初始化或覆盖现有文件。

## 自定义语言环境目录

默认情况下，vibei18n 在 `./i18n/locales` 中查找语言环境文件。您可以指定自定义目录：

```bash
npx vibei18n check --dir ./my-locales
npx vibei18n stats --dir ./custom/path/locales
```

## 安装和编程式使用

### 安装

```bash
# 直接使用 npx（推荐）
npx vibei18n --help

# 或全局安装
pnpm add -g vibei18n

# 或作为开发依赖安装
pnpm add -D vibei18n
```

### 编程式使用

您也可以在 Node.js 项目中将 vibei18n 作为库使用：

```javascript
import { I18nHelper } from 'vibei18n';

// 使用默认目录初始化 (./i18n/locales)
const helper = new I18nHelper();

// 或指定自定义目录
const helper = new I18nHelper('./custom/locales');

// 获取所有可用语言环境
const locales = helper.getLocales();
console.log('可用语言环境:', locales);

// 获取翻译
const value = helper.get('en-US', 'common.loading');
console.log('翻译:', value);

// 设置翻译
helper.set('zh-hans', 'page.title', '页面标题');

// 检查完整性
const results = helper.checkTranslations(true);
console.log('缺失翻译:', results.summary.totalMissing);

// 批量更新多个翻译
helper.batchUpdate({
  'en-US': {
    'page.title': 'Page Title',
    'page.description': 'Page Description'
  },
  'zh-hans': {
    'page.title': '页面标题',
    'page.description': '页面描述'
  }
});

// 查找硬编码字符串
const findings = helper.checkHardcodedStrings('./src', {
  extensions: ['.vue', '.js', '.ts'],
  verbose: true
});
```

## 文件结构

vibei18n 期望 JSON 格式的语言环境文件：

```
i18n/
  locales/
    en-US.json
    zh-hans.json
    fr-FR.json
    ...
```

语言环境文件示例 (`en-US.json`)：
```json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "success": "Success!"
  },
  "navigation": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  },
  "page": {
    "title": "Page Title",
    "description": "Page Description"
  }
}
```

## 硬编码字符串检测

硬编码字符串检测功能帮助您找到应该国际化的文本：

- **智能过滤** - 跳过技术字符串、URL、文件路径以及 `<code>` 和 `<pre>` 标签内的内容
- **上下文感知** - 区分 HTML 属性和内容
- **优先级分类** - 高/中/低优先级分类
- **多种格式** - 支持 Vue、JSX、TypeScript 等

示例输出：
```
🔴 高优先级 (3 项)：
  📄 src/components/Header.vue:15
     "欢迎来到我们的网站" (title)

🟡 中优先级 (2 项)：
  📄 src/pages/About.vue:8
     "了解更多关于我们公司的信息" (description)
```

## 配置

### 支持的文件扩展名

对于硬编码字符串检测，vibei18n 支持：
- `.vue` (Vue.js 组件)
- `.jsx` (React JSX)
- `.tsx` (TypeScript JSX)
- `.js` (JavaScript)
- `.ts` (TypeScript)

### 排除的目录

默认情况下，这些目录会被排除在扫描之外：
- `node_modules`
- `.git`
- `dist`
- `build`
- `.nuxt`
- `.output`

## 最佳实践

1. **从初始化开始：**
   ```bash
   npx vibei18n init
   ```

2. **定期完整性检查：**
   ```bash
   npx vibei18n check --detailed
   ```

3. **及早发现硬编码字符串：**
   ```bash
   npx vibei18n hardcode-check --verbose
   ```

4. **使用批量更新提高效率：**
   ```bash
   # 对于复杂操作使用编程式 API
   node your-translation-script.js
   ```

5. **保持翻译有序：**
   - 使用嵌套对象进行逻辑分组
   - 遵循一致的命名约定
   - 使用描述性键名

## 贡献

我们欢迎贡献！请查看我们的贡献指南了解更多详情。

## 许可证

MIT 许可证 - 详见 LICENSE 文件。

## 支持

- 🐛 **问题反馈**: [GitHub Issues](https://github.com/becoolme/vibe-i18n/issues)
- 📚 **文档**: 本 README 和内联帮助 (`npx vibei18n --help`)
- 💬 **讨论**: [GitHub Discussions](https://github.com/becoolme/vibe-i18n/discussions)

---

❤️ 为国际化社区而制作。