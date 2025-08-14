# Vibe i18n

[![CI](https://github.com/becoolme/vibe-i18n/workflows/CI/badge.svg)](https://github.com/becoolme/vibe-i18n/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/vibei18n.svg)](https://badge.fury.io/js/vibei18n)
[![Node.js Version](https://img.shields.io/node/v/vibei18n)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

專為 Vue.js、Next.js 和其他 JavaScript 專案設計的強大 i18n 翻譯管理 CLI 工具。特別為 AI 代理優化，可高效管理翻譯而無需讀取大型語言環境檔案，節省 token 並防止檔案損壞。

## 功能特性

- 🚀 **CLI 優先方式** - 使用 `npx vibei18n` 管理翻譯
- 📁 **智慧語言環境掃描** - 自動發現語言環境檔案
- 🔍 **翻譯完整性檢查** - 查找缺失的翻譯
- 🔧 **硬編碼字串檢測** - 掃描程式碼庫中的硬編碼字串
- 📊 **詳細統計** - 獲取翻譯覆蓋率洞察
- 🎯 **重複檢測** - 查找跨語言環境的重複翻譯
- 💻 **程式設計式 API** - 在 Node.js 專案中作為函式庫使用
- 🌐 **多種格式支援** - 支援 JSON 和 JS 語言環境檔案

## AI 代理整合

對於使用翻譯的 AI 代理，請使用 CLI 命令而不是直接讀寫檔案，以確保資料完整性和正確驗證：

### AI 代理提示詞：
```
在處理 i18n 翻譯時，始終使用 CLI 命令而不是直接讀取或修改語言環境檔案。這確保了正確的驗證、格式化並防止損壞。

可用的翻譯管理命令：
- 獲取翻譯: npx vibei18n get <locale> <key>
- 設定翻譯: npx vibei18n set <locale> <key> <value>
- 檢查是否存在: npx vibei18n has <locale> <key>
- 獲取鍵的所有語言環境: npx vibei18n getAll <key>
- 查找缺失: npx vibei18n missing <key>
- 檢查完整性: npx vibei18n check --detailed
- 顯示統計: npx vibei18n stats
- 列出語言環境: npx vibei18n locales
- 查找硬編碼字串: npx vibei18n hardcode-check --verbose

範例工作流程：
1. 檢查目前狀態: npx vibei18n stats
2. 獲取特定翻譯: npx vibei18n get en-US common.loading
3. 更新翻譯: npx vibei18n set zh-hans common.loading "載入中..."
4. 驗證變更: npx vibei18n get zh-hans common.loading
```

## 快速開始

1. **初始化語言環境結構：**
```bash
npx vibei18n init
```
   建立 `i18n/locales` 目錄並包含範例檔案。如果目錄已存在可跳過。

2. **檢查翻譯完整性：**
```bash
npx vibei18n check --detailed
```

3. **查找程式碼中的硬編碼字串：**
```bash
npx vibei18n hardcode-check --verbose
```

4. **新增新翻譯：**
```bash
npx vibei18n set zh-hant page.title "頁面標題"
```

## CLI 命令

### 基本操作

```bash
# 獲取翻譯值
npx vibei18n get en-US common.loading

# 設定翻譯值
npx vibei18n set zh-hant page.title "頁面標題"

# 檢查翻譯是否存在
npx vibei18n has en-US common.loading

# 獲取某個鍵的所有翻譯
npx vibei18n getAll common.loading

# 查找缺失的翻譯
npx vibei18n missing page.title
```

### 分析命令

```bash
# 檢查翻譯完整性
npx vibei18n check --detailed

# 顯示翻譯統計
npx vibei18n stats --verbose

# 查找重複翻譯
npx vibei18n duplicates

# 列出可用語言環境
npx vibei18n locales
```

### 硬編碼字串檢測

```bash
# 基本硬編碼字串掃描
npx vibei18n hardcode-check

# 詳細輸出和上下文
npx vibei18n hardcode-check --verbose

# 掃描特定檔案類型
npx vibei18n hardcode-check --ext vue,tsx,jsx

# 掃描特定目錄
npx vibei18n hardcode-check ./src --verbose
```

### 初始化

```bash
# 初始化預設結構 (./i18n/locales)
npx vibei18n init

# 使用自訂目錄初始化
npx vibei18n init --dir ./locales
```

`init` 命令建立帶有範例檔案的初始語言環境目錄結構。預設在目前工作目錄中建立 `i18n/locales` 目錄。如果目錄已存在，您可以選擇跳過初始化或覆寫現有檔案。

## 自訂語言環境目錄

預設情況下，vibei18n 在 `./i18n/locales` 中查找語言環境檔案。您可以指定自訂目錄：

```bash
npx vibei18n check --dir ./my-locales
npx vibei18n stats --dir ./custom/path/locales
```

## 安裝和程式設計式使用

### 安裝

```bash
# 直接使用 npx（推薦）
npx vibei18n --help

# 或全域安裝
pnpm add -g vibei18n

# 或作為開發相依性安裝
pnpm add -D vibei18n
```

### 程式設計式使用

您也可以在 Node.js 專案中將 vibei18n 作為函式庫使用：

```javascript
import { I18nHelper } from 'vibei18n';

// 使用預設目錄初始化 (./i18n/locales)
const helper = new I18nHelper();

// 或指定自訂目錄
const helper = new I18nHelper('./custom/locales');

// 獲取所有可用語言環境
const locales = helper.getLocales();
console.log('可用語言環境:', locales);

// 獲取翻譯
const value = helper.get('en-US', 'common.loading');
console.log('翻譯:', value);

// 設定翻譯
helper.set('zh-hant', 'page.title', '頁面標題');

// 檢查完整性
const results = helper.checkTranslations(true);
console.log('缺失翻譯:', results.summary.totalMissing);

// 批次更新多個翻譯
helper.batchUpdate({
  'en-US': {
    'page.title': 'Page Title',
    'page.description': 'Page Description'
  },
  'zh-hant': {
    'page.title': '頁面標題',
    'page.description': '頁面描述'
  }
});

// 查找硬編碼字串
const findings = helper.checkHardcodedStrings('./src', {
  extensions: ['.vue', '.js', '.ts'],
  verbose: true
});
```

## 檔案結構

vibei18n 期望 JSON 格式的語言環境檔案：

```
i18n/
  locales/
    en-US.json
    zh-hant.json
    fr-FR.json
    ...
```

語言環境檔案範例 (`en-US.json`)：
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

## 硬編碼字串檢測

硬編碼字串檢測功能幫助您找到應該國際化的文字：

- **智慧過濾** - 跳過技術字串、URL、檔案路徑以及 `<code>` 和 `<pre>` 標籤內的內容
- **上下文感知** - 區分 HTML 屬性和內容
- **優先順序分類** - 高/中/低優先順序分類
- **多種格式** - 支援 Vue、JSX、TypeScript 等

範例輸出：
```
🔴 高優先順序 (3 項)：
  📄 src/components/Header.vue:15
     "歡迎來到我們的網站" (title)

🟡 中優先順序 (2 項)：
  📄 src/pages/About.vue:8
     "了解更多關於我們公司的資訊" (description)
```

## 配置

### 支援的檔案副檔名

對於硬編碼字串檢測，vibei18n 支援：
- `.vue` (Vue.js 元件)
- `.jsx` (React JSX)
- `.tsx` (TypeScript JSX)
- `.js` (JavaScript)
- `.ts` (TypeScript)

### 排除的目錄

預設情況下，這些目錄會被排除在掃描之外：
- `node_modules`
- `.git`
- `dist`
- `build`
- `.nuxt`
- `.output`

## 最佳實務

1. **從初始化開始：**
   ```bash
   npx vibei18n init
   ```

2. **定期完整性檢查：**
   ```bash
   npx vibei18n check --detailed
   ```

3. **及早發現硬編碼字串：**
   ```bash
   npx vibei18n hardcode-check --verbose
   ```

4. **使用批次更新提高效率：**
   ```bash
   # 對於複雜操作使用程式設計式 API
   node your-translation-script.js
   ```

5. **保持翻譯有序：**
   - 使用巢狀物件進行邏輯分組
   - 遵循一致的命名慣例
   - 使用描述性鍵名

## 貢獻

我們歡迎貢獻！請查看我們的貢獻指南了解更多詳情。

## 授權條款

MIT 授權條款 - 詳見 LICENSE 檔案。

## 支援

- 🐛 **問題回報**: [GitHub Issues](https://github.com/becoolme/vibe-i18n/issues)
- 📚 **文件**: 本 README 和內嵌說明 (`npx vibei18n --help`)
- 💬 **討論**: [GitHub Discussions](https://github.com/becoolme/vibe-i18n/discussions)

---

❤️ 為國際化社群而製作。