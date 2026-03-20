# FFXIV 繁中物品搜尋 — 進階版

> 本專案基於 [cycleapple/ffxiv-item-search-tc](https://github.com/cycleapple/ffxiv-item-search-tc) 原始專案開發，加入了素材統計列表等進階功能。

## 功能介紹

### 原有功能
- **物品搜尋**：支援繁中、英文、日文、簡中跨語言搜尋
- **物品詳情**：顯示製作配方、採集地點、NPC 商店、任務獎勵、怪物掉落
- **市場追蹤**：加入追蹤清單後可查詢 Universalis 市場價格與製作成本分析
- **採集鬧鐘**：設定限定時段採集點提醒
- **製作模擬器**：模擬製作流程與技能旋轉

### 新增功能：素材統計列表（購物車）
- **加入列表**：在搜尋結果中對任何可製作的道具點擊「加入列表」，快速加入素材統計
- **數量調整**：在統計頁面可調整每件道具要製作的數量，素材需求即時重算
- **三階素材分類**：自動將所需素材分為三個階層顯示
  - 第三階（高級）：本身可製作、且子材料也可製作的中間素材
  - 第二階（中級）：本身可製作、子材料均為原料的素材
  - 第一階（原料）：無製作配方的基礎素材
  - 晶體：製作用晶體/叢晶/巨晶（獨立顯示）
- **配方選擇**：同一素材若有多個職業配方（例如鍛冶師用火之水晶、甲冑師用冰之水晶），可自由切換，避免重複計算
- **正確聚合邏輯**：多件道具共用同一中間素材時，先彙總需求再計算原料，確保 `resultAmount > 1` 的配方不會多算

---

## 使用教學：素材統計列表

### Step 1：搜尋道具並加入列表

1. 在頂端搜尋欄輸入想製作的道具名稱
2. 在搜尋結果卡片中，找到綠色**購物車圖示**或「加入列表」按鈕
3. （僅可製作道具會顯示此按鈕）
4. 點擊後按鈕會變為「已加入」狀態，右上角導覽列的購物車圖示也會出現數字徽章

### Step 2：前往素材統計頁面

- 點擊右上角的 **購物車圖示**（綠色）即可進入「素材統計列表」頁面
- 或直接前往路徑 `/craftinglist`

### Step 3：調整製作數量

在「製作目標」欄（最左側）中：
- 點擊 `−` / `+` 按鈕調整每件道具的製作數量
- 也可以直接點擊數字欄位手動輸入數量
- 懸停在道具列上可看到刪除（✕）按鈕

### Step 4：切換配方職業（OR 配方）

在第二/三階材料欄中，若某素材有多種職業配方，其名稱旁會出現**職業下拉選單**：
- 例如「鐵錠」可由鍛冶師（火之水晶）或甲冑師（冰之水晶）製作
- 切換後第一階原料欄會即時更新，只計算對應職業所需的晶體，不會重複

### Step 5：對照原料採集/購買

- **第一階（原料）欄**：顯示最終需要親自採集或購買的素材與總數量
- **晶體欄**：顯示所有製作職業的晶體需求（同類型晶體已加總）
- 點擊任一素材名稱可導覽到該物品的詳情頁

---

## 本地開發

### 環境需求
- Node.js v20 以上

### 安裝與啟動

```bash
npm install
npm run dev
```

啟動後開啟瀏覽器前往 `http://localhost:5173/ffxiv-item-search-tc`

### 建置

```bash
npm run build
```

---

## 技術架構

- **框架**：React 19 + TypeScript + Vite
- **樣式**：Tailwind CSS v4
- **路由**：React Router v7
- **搜尋**：FlexSearch（本地全文搜尋）
- **市場資料**：Universalis API
- **靜態資料**：全部存放於 `public/data/`，無後端、無資料庫，可直接部署至 GitHub Pages
- **狀態持久化**：localStorage（追蹤清單、素材列表、鬧鐘設定）

---

## 致謝

- 原始專案：[cycleapple/ffxiv-item-search-tc](https://github.com/cycleapple/ffxiv-item-search-tc)
- 市場資料：[Universalis](https://universalis.app)
- 物品圖示：[XIVAPI](https://xivapi.com)
- 製作模擬核心：[ffxiv-best-craft](https://github.com/Tnze/ffxiv-best-craft)
- 配方/物品資料：[Teamcraft](https://ffxivteamcraft.com)

---

FINAL FANTASY XIV © SQUARE ENIX CO., LTD. All rights reserved.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
