---
title: 模組規格 — 查詢系統
created: 2026-07-07
tags: [game/牧場物語雙子村, project/spec]
---

# 查詢系統（Query System）

讀取內容管線產出的 JSON，提供搜尋、篩選、行事曆。無寫入行為。

## Entity 欄位

### SearchDoc（記憶體索引項）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `collection` | string | 所屬 collection |
| `slug` | string | 路由用 |
| `haystack` | string | 小寫串接：title + name + name_jp + tags + loves/likes + plain 前 200 字 |

### CollectionConfig（列表頁驅動設定）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `columns` | array | 列表顯示欄位（label + frontmatter key + 格式器） |
| `filters` | array | 篩選器定義（key、型態：單選/多選/布林、選項來源） |

## 核心業務規則

1. **搜尋**：關鍵字小寫正規化後對 `haystack` 做 substring 比對；多關鍵字（空白分隔）取 AND。中文、日文（name_jp）皆可命中。~300 條線性掃描，不引搜尋函式庫。
2. **篩選（各 collection）**：
   - characters：村別（藍鈴村／此花村／其他）、marriageable、gender。
   - crops：season（多選）、village、regrowable。
   - animals／recipes／fishes／insects／minerals／festivals：依各自欄位，實作時由 CollectionConfig 宣告，不硬編碼進元件。
3. **排序（2026-07-17 使用者裁決：移除）**：列表一律維持資料原始順序，不提供排序下拉選單；`applySort`／`sortByGrowDaysMin` 已移除，不留死程式碼。
4. **行事曆彙整**：characters.birthday 與 festivals 日期以 `parseSeasonDay`（[game-calendar.md](./game-calendar.md)）解析；parse 失敗的條目不進表並在 console 警告。輸出 4 季 × SEASON_DAYS 格；一格多事件全部列出，點擊跳條目頁。
5. **條目頁資訊卡**：依 collection 顯示 frontmatter 欄位表（沿用 CollectionConfig 的欄位定義），內文 html 直接渲染（來源是自家管線，非用戶輸入，XSS 風險受控——但 build 時仍過 marked 預設 escape）。
6. **物品連結解析（2026-07-07 新增；同日深度審查裁決：解析在 build 時、前端只渲染已解析欄位，見 [content-pipeline.md](./content-pipeline.md) 規則 6）**：凡經物品索引命中的物品字串都渲染成站內連結，支撐「喜好 → 配方 → 來源」查詢鏈：
   - 角色頁 loves/likes 以 chip 呈現，命中料理 → 跳 recipes 條目頁。
   - recipes 條目頁列出食材，每項食材再經索引解析：作物 → crops 條目；**料理作食材**（如 烏龍麵 → 狐狸烏龍麵）→ 遞迴跳 recipes 條目；魚 → fishes 條目；商店販售品 → 商店指南 guide 錨點；類別食材（きのこ類）→ 展開可用清單。
   - 查無來源 → 顯示純文字（不做死連結）。此鏈是資料驅動：物品索引覆蓋率提升（補條目）即自動生效，前端不改碼。
7. **URL 即狀態**：搜尋字串與篩選條件反映在 hash query（可分享、重新整理不丟）。

## 狀態機

無。

## 後期規劃

- fuse.js／預建索引（條目破千才評估，只動 `search.js`）。
- 全文搜尋含 guide 內文全文（MVP 只索引前 200 字）。
