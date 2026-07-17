---
title: 模組規格 — 進度追蹤器
created: 2026-07-07
tags: [game/牧場物語雙子村, project/spec]
---

# 進度追蹤器（Save-State Tracker）

玩家個人存檔：遊戲日推進制（**不用現實日期**），localStorage 持久化，JSON 匯出匯入。依賴 [game-calendar.md](./game-calendar.md) 的 GameDate 與 [content-pipeline.md](./content-pipeline.md) 的條目資料（存檔只存 slug 與玩家行為，**不複製條目數值**，資料更新自動生效）。

## Entity 欄位

### Save（localStorage key：`hmtv:save:v1`）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `schemaVersion` | number | 目前 = 1 |
| `calendar` | GameDate | 玩家當前遊戲日 |
| `plots` | Plot[] | 種植追蹤 |
| `animals` | TrackedAnimal[] | 畜牧追蹤 |
| `animalsUpdatedAt` | string (ISO) \| null | 畜牧追蹤區塊最後編輯時間戳（新增/刪除/點心增減皆更新），供 UI 於區塊標題上方顯示 |
| `checklists` | `{ [checklistId]: string[] }` | 各 checklist 已勾選項目 id |

### Plot

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | string (uuid) | |
| `cropSlug` | string | 對應 crops 條目 |
| `plantedOn` | GameDate | 種植日 |
| `wateredDays` | number | 已澆水天數（玩家手動按） |
| `lastWatered` | GameDate \| null | 最後澆水日（同一遊戲日防重複計數） |
| `status` | `"growing" \| "harvested"` | 見狀態機 |
| `note` | string | 自由備註 |

### TrackedAnimal

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | string (uuid) | |
| `animalSlug` | string | 對應 animals 條目 |
| `nickname` | string | 暱稱 |
| `careDays` | number | 累計照顧天數 |
| `lastCared` | GameDate \| null | 最後照顧日（同日防重複） |
| `treatsFed` | `{ 茶點: n, 野菜: n, 穀物: n, 魚味: n }` | 各種類點心累計餵食數（副產品升級進度） |
| `lastTreated` | GameDate \| null | 最後餵點心日（遊戲規則：每天限餵 1 個，同日防重複） |

### 內建 Checklist（2026-07-07 決策：四種全進 MVP）

| checklistId | 項目來源 | 生成方式 |
|-------------|---------|---------|
| `bell-jewels` | `basics/6色耀珠.md` 定義的六色 | 靜態定義於 config（6 項） |
| `recipes` | recipes collection | build 產物全條目 slug |
| `encyclopedia-fish` / `-insect` / `-mineral` | fishes / insects / minerals collections | 同上，各自一份。**注意：fishes 條目未建（同 recipes，見 content-pipeline 內容缺口），該 checklist 在 C4 補齊前為空——屬預期，UI 顯示空狀態不得崩** |
| `romance-events` | characters（marriageable=true）× 事件階段 | 骨架自動生成：每位可攻略角色 × {心動事件各階段}；細部事件名待 romance guide 結構化後補（見後期規劃） |

**頂層導覽命名（2026-07-17 使用者裁決）**：網站頂層導覽原標示「追蹤器」，因種植追蹤／收集清單已停用（見上方 TrackerPage 註解），現況內容僅剩畜牧點心累計＋匯出入，改名為「存檔」以貼合實際功能（畜牧資料＋存檔備份），route path（`/tracker`）不變，僅改顯示文字。

## 核心業務規則

1. **過一天（advanceDay UseCase）**：`calendar` 推進一日 → 回傳當日提醒（生日／節慶，查詢自 query 資料）。**不自動累計** plots 的 `wateredDays` 與 animals 的 `careDays`——與遊戲機制一致，沒照顧就沒進度。
2. **澆水（waterPlot）**：`lastWatered` 等於今日 → no-op（冪等）；否則 `wateredDays + 1`、更新 `lastWatered`。照顧動物（careAnimal）同規則作用於 `careDays`／`lastCared`。
3. **收成倒數**：`grow_days` 解析成 `{min, max}`（`"10-14"` → 10/14；`"10"` → 10/10）。顯示「最快還需 `max(0, min - wateredDays)` 天／最慢還需 `max(0, max - wateredDays)` 天」；`wateredDays ≥ min` 起顯示「可能可收成」，`≥ max` 顯示「應可收成」。**不自動轉收成狀態**——玩家按「已收成」。
4. **收成（harvestPlot）**：`regrowable: true` → `wateredDays` 歸 0、`plantedOn` 設為今日、狀態保持 `growing`（下一輪）；`false` → 狀態 `harvested`（保留於歷史區，可刪除——刪除僅指從玩家自己的存檔陣列移除）。
5. **動物副產品升級（點心累計制，2026-07-07 修正）**：依據 [[動物飼養管理攻略]]，升級靠**點心累計數**而非照顧天數：
   - 每天限餵 1 個點心（`lastTreated` 同日冪等，同 waterPlot 規則）。
   - 條目 `treat_requirements` 定義各點心種類到各目標數量（2～5 個）的**累計門檻**（累計不歸零、給滿即止）。
   - 顯示「距離下一級還差：茶點 X／野菜 Y／穀物 Z／魚味 W 個」= 門檻 − `treatsFed` 各項（負值取 0）。
   - **模型限制**：攻略提供的是「配方式」門檻表（各種類各需幾個），未提供單一點心的點數換算；玩家若以任意組合餵食，精確剩餘量無法保證——UI 須註明「依攻略建議配方計算」。
   - 條目缺 `treat_requirements` → 只顯示 `treatsFed` 累計，不顯示倒數、不猜數值（資料補齊走內容回報流程）。
6. **刪除動物（removeAnimal，2026-07-17 新增）**：直接從 `animals` 陣列移除（無復原機制，僅能靠匯出備份救回）。UI 須先跳確認視窗（防手滑）才能執行。新增／刪除／點心增減皆更新 `animalsUpdatedAt`（ISO 時間戳），UI 於畜牧追蹤區塊標題上方顯示「最後編輯：YYYY-MM-DD HH:mm」。
7. **持久化**：每次變更立即寫入（無儲存按鈕）。寫入失敗（配額／隱私模式）→ 顯示警告橫幅，App 繼續以記憶體狀態運作。
8. **Schema 遷移**：讀檔時 `schemaVersion < 目前` → 依遷移函式表逐版升級後回寫；`> 目前`（來自較新版本的匯入檔）→ 拒絕匯入並提示。**任何情況都不得清除或默默丟棄使用者資料。**
9. **匯出**：下載 `hmtv-save-YYYYMMDD.json` = Save 原文 + `exportedAt`（ISO 時間戳，僅供辨識檔案）。
10. **匯入**：JSON parse → 驗證 `schemaVersion` 存在且為數字、`calendar` 為合法 GameDate → 通過才動作：現有存檔先備份到 `hmtv:save:backup` → 覆蓋 → 提示「已匯入，可還原」。驗證失敗 → 顯示錯誤、**原資料不動**。
11. **slug 失配容錯**：存檔引用的 slug 在現行資料找不到（條目改名）→ 該項顯示「未知條目（slug）」並保留原始資料，不刪不藏——等資料修復或玩家手動處理。

## 狀態機

### Plot.status

```
growing ──玩家按「已收成」──▶ regrowable? ──true──▶ growing（wateredDays 歸 0，新一輪）
                                        └─false─▶ harvested（終態，可從清單移除）
```

## 後期規劃

- `romance-events` 細部事件清單：待 romance guide 文章結構化（或補 frontmatter events 欄位）後，checklist 項目改由資料生成；MVP 先用「角色 × 階段」骨架 + 允許自由勾選。
- 多存檔槽（slot）：schema 已預留擴充空間（key 帶版本），非 MVP。
- **家畜條目補建（阻擋動物追蹤功能）**：`animals/` 目前只有寵物（犬／貓／貓頭鷹／馬），雞、牛、羊、羊駝與變種（黑雞、茶牛、黑羊、薩福克羊）條目未建。需走 ingest 流程從 [[動物飼養管理攻略]] 文末〈動物總覽〉與茶點表建立條目（含 `treat_requirements`），必要時回來源網站（leomoon173 pixnet）查證 3～5 個目標數量的完整門檻（一般家畜攻略只給目標 2 的行 + 公式；羊駝有完整表且**不符**該公式，故各級門檻以表列明文為準、公式推得的數值需查證）。
- 點心點數制（任意組合換算）：若日後查得單一點心的點數值，可把配方模型升級為點數模型。
