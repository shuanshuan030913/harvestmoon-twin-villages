---
title: 軟體設計說明書（SDD）— 牧場物語 雙子村 攻略網站
created: 2026-07-07
tags: [game/牧場物語雙子村, project/spec]
---

# 軟體設計說明書（SDD）— 牧場物語 雙子村 攻略網站

> 版本：1.0（2026-07-07）
> 狀態：規格定稿，開發任務拆解見 `.spec/` 與 `todo.md`
>
> **修訂註記（2026-07-07）**：本文為原始 SDD 快照。定稿後的決策修訂（動物升級改點心累計制、物品日文主鍵索引、樣式改 Tailwind v4 + Radix primitives、迴圈改本機自駕三層機制）記錄於 [README.md](./README.md) 的「已確認的關鍵決策」，與本文衝突時**以 README 與各 module 為準**。

---

## 1. 專案概述

《牧場物語 雙子村》（ふたごの村 / Tale of Two Towns）中文攻略靜態網站，兼具兩種角色：

1. **資料查詢系統（Query System）**：快速檢索 NPC 生日／喜好、劇情事件觸發條件、作物／畜牧／料理／魚類／昆蟲／礦物基礎資料。
2. **玩家進度追蹤器（Save-State Tracker）**：記錄玩家自己的種植與畜牧進度（已澆水／餵食 X 天、還需 Y 天收成／升級），關閉瀏覽器後下次訪問無縫續用。

### 1.1 非目標（Non-Goals）

- 無後端、無帳號系統、無跨裝置同步（以 JSON 匯出／匯入替代）。
- 不做內容線上編輯 — `content/` 由 vault skill `harvest-moon-twin-villages` 擷取維護，是唯一 source of truth。
- 不做多語系；介面與內容為繁體中文，專有名詞附日文原文（既有內容已遵循 `中文（日文）` 格式）。

---

## 2. 技術堆疊

沿用 `jackjeanne-merch` 的既有選型，降低維護心智負擔：

| 層 | 選型 | 備註 |
|----|------|------|
| 框架 | React 19 + Vite | SPA，靜態建置輸出 |
| 路由 | react-router（`createHashRouter`） | GitHub Pages 免 404 fallback 處理 |
| 樣式 | 純 CSS（CSS variables + 少量 utility class） | 不引入 Tailwind，與範本一致 |
| 內容管線 | Node 腳本（`gray-matter` + `marked`） | build 前把 markdown 轉 JSON |
| 使用者資料 | `localStorage`（versioned schema） | 含 JSON 匯出／匯入 |
| Lint | ESLint 9（沿用範本 config） | |
| 部署 | GitHub Pages + GitHub Actions | push main → 自動 build & deploy |

---

## 3. 系統架構

```
content/                     ← source of truth（267+ 篇 markdown，已存在）
   │
   │  npm run build:content（scripts/build-content.js）
   ▼
src/data/*.json              ← 每個 collection 一個 JSON（characters.json、crops.json…）
public/images/               ← content/images/ 同步複製
   │
   │  npm run build（Vite）
   ▼
dist/                        ← 靜態產物 → GitHub Pages
```

### 3.1 內容管線（scripts/build-content.js）

- 掃描 `content/` 全部 `.md`，用 `gray-matter` 解析 frontmatter、`marked` 把內文轉 HTML 字串。
- 依資料夾歸入 collection：`characters`、`crops`、`animals`、`recipes`、`fishes`、`insects`、`minerals`、`festivals`、`villages`、各系統 `guide`、`basics`。
- **Wikilink 解析**：先建立「title/name → 路由 slug」對照表，把內文 `[[條目名]]` 轉成站內 `<a href="#/...">`；找不到目標的 wikilink 轉純文字並在 build log 列警告（不中斷 build）。
- **圖片路徑改寫**：`../images/...`、`../../images/...` → `/images/...`（隨 `public/` 部署）。
- frontmatter 驗證：必填欄位（`title`、`name_jp` 等，依 skill schema）缺漏時列警告清單，不中斷 build — 內容修正回 `content/` 做，不在管線裡塞預設值。
- 輸出附 `contentHash`，前端可據此顯示「資料版本」。

### 3.2 前端模組

```
src/
├── data/                  # 管線產物（勿手動編輯）
├── pages/
│   ├── Home.jsx           # 首頁：搜尋框 + 各系統入口 + 今日提醒（生日/節慶，若 tracker 有設定日期）
│   ├── CollectionPage.jsx # 條目列表（characters/crops/... 共用，欄位由 collection config 決定）
│   ├── EntryPage.jsx      # 單一條目詳情（frontmatter 表格 + 內文 HTML）
│   ├── GuidePage.jsx      # guide 文章閱讀頁
│   ├── CalendarPage.jsx   # 行事曆：生日 + 節慶總覽（按季節/日期）
│   └── TrackerPage.jsx    # 玩家進度追蹤器
├── components/
│   ├── SearchBar.jsx      # 全站搜尋（title / name_jp / likes / loves 全欄位）
│   ├── FilterBar.jsx      # 篩選（村別、季節、可攻略、可重複收成…）
│   ├── EntryCard.jsx      # 條目卡片
│   └── tracker/           # 追蹤器子元件（見 §5）
├── utils/
│   ├── search.js          # 索引建立與查詢（含日文/中文雙向）
│   ├── storage.js         # localStorage 讀寫 + schema 版本遷移 + 匯出/匯入
│   └── gameCalendar.js    # 遊戲內日期運算（季節、天數推進）
└── App.jsx / App.css
```

---

## 4. 查詢系統設計

### 4.1 搜尋

- Build 時對每個條目產生扁平索引欄位（title、name、name_jp、likes、loves、tags、內文純文字前 N 字）。
- 前端載入後在記憶體建索引（資料量 ~300 條，直接線性掃描 + 小寫正規化即可，不需引入搜尋函式庫；若日後條目破千再評估 fuse.js）。
- 支援中文與日文關鍵字（`name_jp` 一律入索引）。

### 4.2 篩選與檢視

- **角色**：村別（藍鈴／此花／共通）、可否攻略、性別；列表直接顯示生日與最愛（loves）。
- **作物**：季節、村別、可否重複收成、依賣價／成長天數排序。
- **動物／料理／魚／蟲／礦**：依各自 frontmatter 欄位提供對應篩選。
- **行事曆頁**：把 `birthday`（`季-日` 格式）與 `festivals` 的日期彙整成 4 季 × 31 日總表，點擊跳條目。

### 4.3 條目頁

- frontmatter 以「遊戲 HUD 風資訊卡」呈現（見 §6 視覺），內文 HTML 原樣渲染，wikilink 已轉站內連結。
- 每頁附「來源」區（frontmatter `source`）。

---

## 5. 玩家進度追蹤器設計

### 5.1 核心模型：遊戲日推進制

**不用現實日期**。玩家一鍵「過一天」推進自己的遊戲內日曆，所有追蹤項目跟著推進：

```jsonc
// localStorage key: "hmtv:save:v1"
{
  "schemaVersion": 1,
  "calendar": { "year": 1, "season": "春", "day": 12 },
  "plots": [            // 種植追蹤
    {
      "id": "uuid",
      "cropSlug": "卡薩布蘭卡",
      "plantedOn": { "year": 1, "season": "春", "day": 3 },
      "wateredDays": 9,           // 玩家按「今日已澆水」累計
      "note": ""
    }
  ],
  "animals": [          // 畜牧追蹤
    {
      "id": "uuid",
      "animalSlug": "大型犬",
      "nickname": "小黑",
      "careDays": 14,             // 累計照顧天數
      "lastCared": { "year": 1, "season": "春", "day": 12 }
    }
  ],
  "checklists": {       // 通用勾選（事件旗標、耀珠、食譜收集…）
    "6色耀珠": ["藍"],
    "已看事件": ["娜娜-紅花事件"]
  }
}
```

- **剩餘天數計算**：以條目資料的 `grow_days` 等欄位為準（如 `"10-14"` 顯示區間「最快還需 X 天／最慢 Y 天」），來自 `src/data/crops.json`，不複製進存檔 — 存檔只存 slug 與玩家行為。
- **「過一天」動作**：日曆 +1（處理季末 31 → 次季 1、冬 → 次年春）；當日有生日／節慶則顯示提醒。
- 未澆水的日子不計入 `wateredDays`（與遊戲機制一致：進度看澆水次數）。

### 5.2 持久化與匯出／匯入

- `storage.js` 統一讀寫；每次寫入即存（無「儲存」按鈕）。
- `schemaVersion` 欄位 + 遷移函式表：未來 schema 變動時舊存檔自動升級，**絕不清除使用者資料**。
- **匯出**：下載 `hmtv-save-YYYYMMDD.json`（就是 localStorage 原文 + 匯出時間戳）。
- **匯入**：檔案選擇器讀 JSON → 驗證 `schemaVersion` 與必要欄位 → 覆蓋前先自動把現有存檔備份到 `hmtv:save:backup`，並提示可還原。
- 損毀防護：parse 失敗時不覆蓋，顯示錯誤並保留原資料。

---

## 6. 視覺設計

參考遊戲畫面：懷舊溫馨、羊皮紙底、遊戲 HUD 元素。

- **雙村色調（核心識別）**：
  - 藍鈴村 Bluebell：`--bluebell: #4a7fb5`（歐風藍）
  - 此花村 Konohana：`--konohana: #5a9e4b`（和風綠）
  - 條目卡、角色頁、篩選 chip 依 `village` 欄位自動套村色；`雙村共通` 用中性土色。
- **基調**：羊皮紙背景（`#f5ead1` 系 + 細紋理）、深棕文字（`#4a3728`）、圓角木框卡片、粗邊框模擬遊戲對話框。
- **字型**：系統繁中字型堆疊 + 標題可用像素風 web-safe 替代（不引外部字型服務，保持全靜態、離線可用）。
- **HUD 元素**：追蹤器的進度以「愛心／水滴」圖示列呈現（模仿遊戲好感度愛心）；行事曆仿遊戲月曆畫面。
- RWD：手機優先（玩家常邊玩邊查），列表單欄、桌機多欄。

---

## 7. 部署

- `.github/workflows/deploy.yml`：push `main` → `npm ci` → `npm run build:content && npm run build` → 部署 GitHub Pages。
- `vite.config.js` 設 `base: '/harvestmoon-twin-villages/'`。
- `content/` 更新（skill ingest 後 push）即自動重建 — 內容更新零手動步驟。

---

## 8. 迴圈工程（Loop Engineering）執行策略

開發不採一次大爆炸，而是**小迴圈疊代**：每個迴圈 = 一個可獨立驗收的任務 → 實作 → 驗證 → commit。任務清單由 `.spec/` + `todo.md` 管理（spec-planner 產出）。

### 8.1 階段劃分

| 階段 | 產出 | 驗收條件 |
|------|------|----------|
| **P0 鷹架** | Vite + React 專案、ESLint、deploy workflow | `npm run dev` 起得來、`npm run build` 成功、Pages 上看得到 hello page |
| **P1 內容管線** | `build-content.js`、全 collection JSON、wikilink/圖片改寫 | 267+ 篇全數轉出、warning 清單可讀、JSON 欄位抽查正確 |
| **P2 查詢系統** | 列表／詳情／guide 頁、搜尋、篩選、行事曆 | 指定抽查案例通過（如：搜「ナナ」找到娜娜；作物依賣價排序正確；行事曆春 27 顯示娜娜生日） |
| **P3 追蹤器** | 遊戲日曆、種植／畜牧追蹤、checklist、匯出匯入 | 過一天推進正確（含跨季跨年）；重新整理資料不丟；匯出再匯入 round-trip 一致 |
| **P4 視覺打磨** | 雙村色調、羊皮紙主題、RWD、HUD 元素 | 手機/桌機截圖檢視；對照遊戲截圖風格確認 |

### 8.2 每迴圈固定節奏

1. 從 `todo.md` 取下一個未完成任務（一次只做一項）。
2. 實作。
3. **驗證**：`npm run lint` + `npm run build` 必過；涉及 UI 的任務跑 dev server 實際操作或截圖；涉及管線的任務抽查 JSON 輸出。
4. 勾掉 todo、commit（訊息含任務 ID）。
5. 迴圈間發現規格缺口 → 回寫 `.spec/`，不在 code 裡即興決定。

### 8.3 護欄

- `content/` 在本專案開發迴圈中**唯讀**：發現內容錯誤記到 todo 的「內容回報」區，交由 vault skill 流程修，不直接改。
- 追蹤器 schema 一旦上線（P3 之後）視為 API：只能加欄位 + 寫遷移，不可破壞舊存檔。
- 每階段結束 push 一次到 Pages，實機驗收後才進下一階段。

---

## 9. 風險與備註

- **生日／節慶日期格式**：現有 frontmatter 用 `季-日`（如 `春-27`），行事曆與遊戲日曆運算統一以此格式 parse；季節天數以遊戲實際天數為準（實作 P3 前先以遊戲內月曆確認每季天數，不要假設 30/31）。
- **`grow_days` 是區間字串**（如 `"10-14"`，依工具等級變動）：追蹤器顯示區間而非單值，parse 時容忍純數字與區間兩種格式。
- **條目量成長**：搜尋目前線性掃描即可；若 content 破千條再引入索引函式庫，屆時只改 `search.js`。
