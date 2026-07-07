---
title: 牧場物語 雙子村 攻略網站 — 規格總覽
created: 2026-07-07
tags: [game/牧場物語雙子村, project/spec]
---

# 牧場物語 雙子村 攻略網站 — 規格總覽

> 完整原始規格書：[PLAN.md](./PLAN.md)

## 核心概念

以既有 `content/`（267+ 篇結構化 markdown）為唯一資料來源的純靜態攻略網站：白天是**查詢工具**（NPC 生日喜好、作物畜牧料理魚蟲礦資料、行事曆），晚上是**玩家存檔**（遊戲日推進制的種植／畜牧進度追蹤 + 收集 checklist，localStorage 持久化、JSON 匯出匯入）。

## 技術選型

| 層次 | 選擇 | 備註 |
|------|------|------|
| 框架 | React 19 + Vite | 沿用 jackjeanne-merch 選型 |
| 路由 | react-router `createHashRouter` | GitHub Pages 免 404 fallback |
| 樣式 | Tailwind CSS v4（含 `@tailwindcss/typography`） | `@theme` tokens：藍鈴 `#4a7fb5`／此花 `#5a9e4b`／羊皮紙基調；guide 內文用 `prose`（2026-07-07 拍板，取代原「純 CSS」） |
| UI primitives | Radix UI 無樣式單包 | **僅追蹤器**用 Dialog／Select／Checkbox／Tabs／Toast；不用 Radix Themes |
| 內容管線 | Node 腳本：gray-matter + marked | markdown → `src/data/*.json` |
| 使用者資料 | localStorage（versioned schema） | key `hmtv:save:v1`，含匯出匯入 |
| 測試 | Vitest（Domain 層 unit test） | 新增 dev dependency |
| 部署 | GitHub Pages + Actions | push main 自動部署 |

## MVP 範圍

- [x] 判定：P0–P4 全部屬 MVP（2026-07-07 用戶確認）
- [ ] P0 專案鷹架 + 部署管線
- [ ] P1 內容管線（全 collection JSON、wikilink、圖片改寫、驗證警告）
- [ ] P2 查詢系統（列表／詳情／guide／搜尋／篩選／行事曆）
- [ ] P3 進度追蹤器（遊戲日曆、種植、畜牧、4 種 checklist、匯出匯入）
- [ ] P4 視覺打磨（雙村色調、羊皮紙主題、HUD 元素、RWD）

已確認的關鍵決策（2026-07-07）：

1. **每季天數**：Domain 常數 `SEASON_DAYS`，預設 31，可設定（單一修改點）。
2. **動物副產品升級**（2026-07-07 修正）：機制是**點心累計數制**（每天限 1 個，四種點心各有累計門檻，出處 [[動物飼養管理攻略]]），非照顧天數。animals 條目新增選填欄位 `treat_requirements`；家畜條目（雞/牛/羊/羊駝與變種）目前未建，補建與門檻查證回**來源網站**（走 ingest skill 流程）。條目缺欄位時 tracker 僅顯示點心累計，不顯示倒數。
3. **內建 checklist**：6色耀珠、食譜收集、魚／蟲／礦圖鑑、戀愛事件旗標，全部進 MVP。
4. **喜好 → 配方 → 來源查詢鏈**（2026-07-07 新增）：物品字串以**日文名為主鍵**解析成站內連結（中文譯名跨來源不穩定）。前置內容缺口：`cooking/recipes/` 需從 5 篇食譜 guide 條目化（食譜 checklist 也依賴它）——詳見 content-pipeline 模組的內容缺口清單。
5. **技術棧修訂**（2026-07-07 拍板）：Tailwind CSS v4 全站 + Radix primitives 限追蹤器（理由：村色 design token 化、marked 內文靠 typography、樣式與 markup 同檔縮小每圈迴圈影響半徑；Radix 買斷互動元件的 a11y）。有意偏離 jackjeanne-merch 的純 CSS 方案。
6. **迴圈模式**（2026-07-07 拍板）：**本機自駕迴圈**——三層自我驗證修復機制（planner 依賴修復／implementor 實作驗證／reviewer 審後才 commit）保留，但任務佇列用版控內 `todo.md`、觸發在本機 session，**不用 GitHub Issues**。機制細節見 [todo.md](./todo.md) 檔頭〈迴圈運行規則〉。
7. **深度審查後修訂**（2026-07-07，Opus 審查代理三維審查後裁決）：①物品參照解析在 **build 時**（前端只渲染）；②Phase 閘門改為**每 5 commit 或停機時 push**、Pages 事後抽驗（放棄嚴格逐階段閘門，允許跨 Phase 依賴交錯）；③`fishing/items/` 新設 `items` collection；④contentHash 資料版本顯示移後期；⑤新增內容缺口 C4：`fishing/fishes/` 為空（同 recipes 平行狀態）。

## 畫面地圖

```
#/                          Home（搜尋框 + 系統入口 + 今日提醒）
#/c/:collection             CollectionPage（角色/作物/動物/料理/魚/蟲/礦/節慶，config 驅動）
#/c/:collection/:slug       EntryPage（資訊卡 + 內文）
#/guide/:system/:slug       GuidePage（教學文章）
#/calendar                  CalendarPage（4 季 × SEASON_DAYS 生日節慶總表）
#/tracker                   TrackerPage
   ├── 遊戲日曆 HUD（過一天）
   ├── 種植追蹤
   ├── 畜牧追蹤
   ├── Checklists（耀珠/食譜/圖鑑/戀愛事件）
   └── 匯出 / 匯入
```

## 模組索引

| 模組 | 內容 | 檔案 |
|------|------|------|
| 遊戲日曆 | GameDate entity、SEASON_DAYS、推進與日期運算 | [game-calendar.md](./modules/game-calendar.md) |
| 內容管線 | collection schema、wikilink 解析、驗證規則 | [content-pipeline.md](./modules/content-pipeline.md) |
| 查詢系統 | 搜尋索引、篩選 config、行事曆彙整 | [query-system.md](./modules/query-system.md) |
| 進度追蹤器 | 存檔 schema、種植/畜牧規則、checklist、匯出匯入 | [tracker.md](./modules/tracker.md) |

---

## ⚠️ 後期功能：有規格但無獨立模組

| 功能 | 不建模組原因 |
|------|-------------|
| 視覺主題（P4 羊皮紙／HUD／RWD） | 純 UI 層，無新 Entity 與業務規則；規則（村色對應 `village` 欄位）已寫在 PLAN.md §6，任務直接進 todo |
| PWA／離線快取 | 用戶確認排除於 MVP；未引入新 Entity，日後需要時再評估 |
| GitHub Actions 部署 | 平台層設定，無業務邏輯；任務進 todo Phase 0 |
| 搜尋函式庫（fuse.js 等） | 條目破千才評估；現行線性掃描已定於 query-system 模組 |
