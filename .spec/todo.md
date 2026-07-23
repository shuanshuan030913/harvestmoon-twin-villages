---
title: 牧場物語 雙子村 攻略網站 — 開發進度追蹤
created: 2026-07-07
tags: [game/牧場物語雙子村, project/spec]
---

# 牧場物語 雙子村 攻略網站 — 開發進度追蹤

> 任務顆粒度：每項任務約 15–30 分鐘可實作完成並通過驗證。
> 標籤：[Domain] 核心邏輯 ｜ [Interface] 資料/儲存/管線 ｜ [UX] 畫面/互動
> 狀態：`[ ]` 未開始 ｜ `[~]` 進行中 ｜ `[x]` 完成（過審） ｜ `[!]` blocked（附原因，待人工）
> 依賴：`(dep: T2.6)` = 該任務完成（`[x]`）前不得認領。
> 版本：v1.1（2026-07-07 深度審查後修訂：+8 任務、2 拆分、5 依賴修正、push 節奏改制）

## 迴圈運行規則（本機自駕，2026-07-07 拍板；同日審查修訂）

三層自我驗證修復機制保留自 [[Loop Engineering 實作教學]]，佇列與觸發落在本機：

| 角色 | 每圈職責 | 邊界 |
|------|---------|------|
| **Planner pass** | 掃本檔：①依賴自我修復——`(dep:)` 指向的任務已 `[x]` 就解除等待；`[!]` 的阻塞原因若已消失就還原 `[ ]`；**發現 `[~]` 但 git log 無該任務 ID 的 commit → 斷點殘留，檢查 working tree 後重新認領（續做或重來）**。②選出**第一個**無未滿足依賴的 `[ ]` 任務 | 不寫碼 |
| **Implementor** | 認領任務標 `[~]`，實作，跑該任務的（驗證: …）＋固定驗證（`npm run lint && npm run build`，Domain 任務加 `npm test`） | 一圈只做一個任務；驗證沒過不得進 review |
| **Reviewer** | 以獨立視角審 diff（`/code-review` 或 review pass）：正確性、是否偏離 `.spec/`、是否越界改了任務外的東西。過 → commit（訊息含任務 ID）＋標 `[x]`；不過 → 退回 implementor 修 | 審完才處置；**commit 權在 reviewer** |

- **停機訊號**：某一圈 planner 找不到可認領任務（全部 `[x]` 或剩 `[!]`／被依賴卡住）→ 停機並回報現況。以「本圈零 commit」為客觀事實判定，不靠自我報告。
- **安全閥**：同一任務 implement→review 往返達 **3 次**未過 → 標 `[!]` 記原因、跳下一任務；單一 session 連跑上限 **10 圈**，到頂回報再續。
- **push 節奏（2026-07-07 審查修訂 S-4）**：**每累積 5 個 commit 或 planner 停機時 push**；Pages 部署後由使用者**事後抽驗**，發現問題記回本檔為回饋任務。Phase 標題僅作組織用，**執行順序以依賴為準**，允許跨 Phase 交錯。
- **規格缺口**：迴圈中發現規格沒定的事 → 回寫 `.spec/`（README 決策清單或對應 module）再繼續，不在 code 裡即興決定。
- `content/` **唯讀**：內容錯誤記到文末〈內容回報區〉，走 vault skill `harvest-moon-twin-villages` 流程修。

---

## Phase 0 — 專案建立（迴圈前置：綠色基準）

依 [[外層迴圈與記憶外化]] 的決策前置原則，本 Phase 是**迴圈開始前的 bootstrap**，可單次連續執行，但每項仍須過驗證。

- [x] T0.1 [Interface] Vite + React 19 scaffold：沿用 jackjeanne-merch 的 eslint 設定與 `.gitignore`，清掉範本頁（驗證：`npm run dev` 起得來、`npm run lint` 綠）
- [x] T0.2 [Interface] Tailwind CSS v4 + `@tailwindcss/typography` 安裝；`@theme` 定義 tokens：`--color-bluebell: #4a7fb5`、`--color-konohana: #5a9e4b`、羊皮紙底 `#f5ead1`、深棕文字 `#4a3728`（驗證：首頁放一個各 token 上色的測試區塊，dev server 目視正確）(dep: T0.1)
- [x] T0.3 [Interface] Vitest 安裝設定 + 一個 smoke test（驗證：`npm test` 綠）(dep: T0.1)
- [x] T0.4 [UX] `createHashRouter` 骨架：`#/`、`#/tracker`、`#/calendar` 三個佔位頁 + 共用 layout 殼（驗證：三路由可切換、重新整理不掉頁）(dep: T0.1)
- [x] T0.5 [Interface] `vite.config.js` 設 `base: '/harvestmoon-twin-villages/'`；`.github/workflows/deploy.yml`（push main → build → Pages）（驗證：Actions 綠、Pages URL 看得到佔位首頁）(dep: T0.4)
- [x] T0.6 [Interface] 建立專案 CLAUDE.md：薄指標式——專案一句話、憲章位置（`.spec/`，README > PLAN）、任務佇列與迴圈規則位置（`.spec/todo.md`）、`content/` 唯讀原則、指令表、「中文（日文）」與 name_jp 主鍵慣例（驗證：新開 Claude session 冷啟動，能自行說出迴圈規則位置與下一個可認領任務）(dep: T0.5)

## Phase 1 — Domain：核心實體與純邏輯（全部帶 unit test）

- [x] T1.1 [Domain] `gameCalendar.js`：`SEASONS`、`SEASON_DAYS`（=31，單一常數）、GameDate 建構驗證（非法值回 null，不 clamp）（驗證：unit test 含 day=0、day=32、季名錯）(dep: T0.3)
- [x] T1.2 [Domain] `advanceDay`：+1 日、跨季、冬末跨年（驗證：unit test 三案例，用 SEASON_DAYS 常數寫 test 不寫死 31）(dep: T1.1)
- [x] T1.3 [Domain] `parseSeasonDay`（`"春-27"` → GameDate 片段）+ `diffDays`（驗證：unit test 含非法格式回 null、跨季差值、負值）(dep: T1.1)
- [x] T1.4 [Domain] `parseGrowDays`：`"10-14"`→`{min:10,max:14}`、`"10"`→`{min:10,max:10}`、非法→null（驗證：unit test 三類）(dep: T0.3)
- [x] T1.5 [Domain] 物品字串 parser：`中文（日文）`→`{zh,jp}`（全形括號）、`＋` 分隔材料欄拆項（驗證：unit test 含「米飯（ごはん）＋胡蘿蔔（にんじん）」、無括號純中文、類別食材「きのこ類」）(dep: T0.3)
- [x] T1.6 [Domain] Save schema v1：型別定義、空存檔工廠、遷移框架（版本→遷移函式表；高於現行版本→拒絕）（驗證：unit test 含 schemaVersion=2 拒絕）(dep: T1.1)
- [x] T1.7 [Domain] 同日冪等純函數：`waterPlot`（wateredDays/lastWatered）與 `feedTreat`（treatsFed/lastTreated，每日限 1 個）共用邏輯（驗證：unit test 同日二次 no-op、隔日累計）(dep: T1.6)
- [x] T1.8 [Domain] 點心門檻計算：`treat_requirements` + `treatsFed` → 下一級還差各幾個（負值取 0；null 種類不列；缺欄位回 null）（驗證：unit test 用真實案例——羊、已餵魚味 3：還差 茶點2/野菜12/穀物12/魚味2）(dep: T1.7)
- [x] T1.9 [Domain] 收成狀態機 `harvestPlot`：regrowable true→歸零續種、false→harvested；收成倒數區間計算（驗證：unit test 兩分支 + `wateredDays≥min` 顯示條件）(dep: T1.6)
- [x] T1.10 [Domain] checklist 生成純函數：collection 條目陣列→checklist 項目；6色耀珠靜態 6 項；romance-events＝marriageable 角色 × 階段骨架；**條目為空的 collection 產出空清單屬預期，不得 throw**（驗證：unit test 用 fixture 含空陣列案例）(dep: T0.3)
- [x] T1.11 [Domain] 搜尋純函數：haystack 建構、小寫正規化、多關鍵字 AND（驗證：unit test 含日文命中「ナナ」）(dep: T0.3)
- [x] T1.12 [Domain] 排序/篩選純函數：grow_days 取下限排序、缺值排最後（不當 0）（驗證：unit test）(dep: T1.4)
- [x] T1.13 [Domain] 行事曆彙整：條目陣列→4 季 × SEASON_DAYS 格（parse 失敗跳過）（驗證：unit test：fixture 含 `春-27` 娜娜、一筆壞格式）(dep: T1.3)

## Phase 2 — Interface：內容管線

- [x] T2.1 [Interface] `scripts/build-content.js` 骨架：掃 `content/`、gray-matter 解析、依資料夾歸 collection（含 `fishing/items/` → `items`）、輸出 `src/data/crops.json`（驗證：crops.json 條數 = 45、抽查卡薩布蘭卡欄位）(dep: T0.1)
- [x] T2.2 [Interface] 全 collection 輸出 + marked 轉 `html` + `plain` 純文字抽取（驗證：guides 含 system 欄位；items.json 條數 = 7；characters slug 保留村名前綴——抽查「此花村-娜娜」；抽查主食類食譜 html 表格完整）(dep: T2.1)
- [x] T2.3 [Interface] wikilink 對照表（name/title/檔名三鍵）+ `[[目標]]`／`[[目標|別名]]` 轉站內連結；撞名廢鍵、查無轉純文字，皆入 warnings（驗證：抽查 [[動物飼養管理攻略]] 內 [[藍鈴村商店指南]] 連結；warnings 列表可讀）(dep: T2.2)
- [x] T2.4 [Interface] 圖片路徑改寫（`../images/`、`../../images/` → base 路徑；`<!-- img: url -->` 註解原樣忽略）+ `content/images/` 複製到 `public/images/`（驗證：抽查一篇 guide 圖片在 dev server 顯示；含 img 註解的檔案不產生壞連結）(dep: T2.2)
- [x] T2.5 [Interface] frontmatter 驗證：必填欄位缺漏、grow_days 格式、treat_requirements 結構（長度 4、數字或 null）→ warnings 不中斷；slug 重複→中斷（驗證：用 scratch 目錄的壞 fixture 跑出預期 warnings；正式 content 跑完 warnings 清單人工過目）(dep: T2.2)
- [x] T2.6 [Interface] 物品索引 + **build 時參照解析**（2026-07-07 裁決 S-1）：以 `name_jp` 主鍵、中文名輔鍵建索引；loves/likes/ingredients 於 build 時解析成連結欄位隨 JSON 輸出，查無入 warnings（驗證：「たき込みご飯」查無條目時列入 warnings——recipes 未條目化前的預期行為；「卡薩布蘭卡」在某角色 likes 中解析為 crops 連結）(dep: T2.2, T1.5)
- [x] T2.7 [Interface] `manifest.json`：builtAt、contentHash、counts、warnings（含 T2.6 的查無清單）；輸出排序固定；**build 收尾 console 印分組彙總警告摘要**（驗證：連跑兩次產物 diff 為空；console 摘要含各類 warning 計數）(dep: T2.5, T2.6)
- [x] T2.8 [Interface] npm scripts 串接：`build:content` → `build`；deploy workflow 加入 build:content 步驟（驗證：`npm run build` 全流程綠；CI 綠）(dep: T2.7, T0.5)

## Phase 3 — Interface：本地儲存

- [x] T3.1 [Interface] `storage.js`：load/save（每變更即寫）、parse 失敗不覆蓋、寫入失敗回報狀態旗標（驗證：unit test mock localStorage：壞 JSON、QuotaExceeded）(dep: T1.6)
- [x] T3.2 [Interface] 遷移執行器接上 T1.6 框架：舊版存檔載入時逐版升級後回寫（驗證：unit test v0 fixture → v1）(dep: T3.1)
- [x] T3.3 [Interface] 匯出：Save + `exportedAt` → 下載 `hmtv-save-YYYYMMDD.json`（驗證：手動下載、內容與 localStorage 一致）(dep: T3.1)
- [x] T3.4 [Interface] 匯入：驗證 schemaVersion／calendar 合法 → 先備份 `hmtv:save:backup` → 覆蓋；失敗原檔不動（驗證：unit test 壞檔不動原檔；手動 round-trip 匯出→清空→匯入一致）(dep: T3.3)
- [x] T3.5 [Interface] 從備份還原：`restoreBackup()` 讀 `hmtv:save:backup` 回寫為現行存檔，無備份時回報（驗證：unit test 匯入覆蓋後 restore 還原到匯入前狀態）(dep: T3.4)

## Phase 4 — Interface：UseCase 整合層

- [x] T4.1 [Interface] `advanceDayUseCase`：日曆推進 + 查當日生日/節慶提醒（讀 characters/festivals 資料）+ 存檔（驗證：unit test fixture：推進到 春-27 回傳娜娜）(dep: T1.2, T1.13, T3.1)
- [x] T4.2 [Interface] `waterPlotUseCase`／`careAnimalUseCase`／`feedTreatUseCase`：冪等邏輯 + 即存（驗證：unit test 同日重複呼叫存檔不變）(dep: T1.7, T3.1)
- [x] T4.3 [Interface] `addPlot`／`addAnimal`／`removePlot`／`harvestPlotUseCase`：uuid 生成、slug 失配容錯（未知條目保留原始資料）（驗證：unit test 含 slug 查無案例）(dep: T1.9, T3.1)
- [x] T4.4 [Interface] 匯入匯出 orchestration + checklist 勾選 UseCase（驗證：unit test round-trip；checklist 勾選後存檔含該項）(dep: T3.5, T1.10)

## Phase 5 — UX：App 基礎骨架

- [x] T5.1 [UX] 全站 layout（App 殼置中，README 決策 8）：羊皮紙紋理頁背景 + 置中 app 容器（max-width 480–560px）、app bar 頂部導覽（查詢入口/行事曆/追蹤器）、大圓角內容卡片殼；村色 utility（`data-village` variant）（驗證：dev server 目視 + 375px 手機寬不破版 + 桌機寬容器置中）(dep: T0.4, T0.2)
- [x] T5.2 [UX] Home：全站搜尋框（先 UI）、**九宮格系統入口**（動森參考圖式 icon 格，README 決策 9）、今日提醒區（tracker 有日曆才顯示）（驗證：無存檔時提醒區隱藏；手動建測試存檔、日期推到 春-27 → 顯示娜娜生日提醒）(dep: T5.1, T4.1)
- [x] T5.3 [UX] Radix 基礎包裝：安裝 Dialog/Toast 單包，做出配羊皮紙樣式的 `<GameDialog>`／`<GameToast>` 包裝元件 + demo（驗證：開關 Dialog focus trap 正常、Esc 可關）(dep: T5.1)

## Phase 6 — UX：查詢系統

- [x] T6.1 [UX] CollectionConfig 機制 + characters/crops 兩份 config（columns/filters/sorts 宣告式）（驗證：兩 collection 用同一元件渲染出不同欄位）(dep: T2.8, T5.1)
- [x] T6.2 [UX] CollectionPage + EntryCard：列表、村色標示（驗證：角色列表顯示生日與 loves；藍鈴/此花卡片色正確）(dep: T6.1)
- [x] T6.3 [UX] FilterBar + 排序 + URL 即狀態（hash query）（驗證：篩選「此花村+可攻略」後重新整理保留；作物依賣價排序正確）(dep: T6.2, T1.12)
- [x] T6.4 [UX] SearchBar 接 T1.11：全站搜尋 + 結果分組（驗證：搜「ナナ」找到娜娜；「たき込みご飯」命中娜娜 loves）(dep: T6.2, T1.11)
- [x] T6.5 [UX] EntryPage：frontmatter 資訊卡 + 內文 html + 來源區 + wikilink 可點（驗證：娜娜頁 wikilink 跳轉正常）(dep: T6.2)
- [x] T6.6 [UX] 物品連結渲染：loves/likes chips 與內文物品字串渲染 build 時已解析的連結欄位（T2.6 產出），查無顯純文字（驗證：卡薩布蘭卡在某角色 likes 中可點；查無物品不產生死連結）(dep: T6.5, T2.6)
- [x] T6.7 [UX] GuidePage：`prose` 排版 + 圖片 + 表格橫向捲動（驗證：主食類食譜長表格橫向可捲、手機寬度不破版、圖片正常）(dep: T6.1)
- [x] T6.8 [UX] CalendarPage：4 季 × SEASON_DAYS 格、生日/節慶點擊跳條目（驗證：春-27 顯示娜娜、點擊進入角色頁）(dep: T6.5, T1.13)
- [x] T6.9a [UX] animals/festivals 的 CollectionConfig（驗證：兩列表頁可開、動物顯示 species/village、節慶顯示日期）(dep: T6.3)
- [x] T6.9b [UX] recipes/fishes 的 CollectionConfig（驗證：兩列表頁可開；條目未建前顯示空狀態不崩——C2/C4 補齊後自動有料）(dep: T6.3)
- [x] T6.9c [UX] insects/minerals/villages/items 的 CollectionConfig（驗證：四列表頁可開、items 顯示 7 筆）(dep: T6.3)
- [x] T6.10 [UX] 搜尋字串 URL 即狀態：SearchBar 查詢字串寫入 hash query，重新整理／分享保留（驗證：搜「ナナ」後重新整理仍顯示結果與關鍵字）(dep: T6.4)
- [x] T6.12 [UX] 類別食材與遞迴料理連結（2026-07-19 完成）：遞迴部分（烏龍麵→狐狸烏龍麵）data 層透過既有 `resolveItemStrings` 已天然成立（recipes 本身在 `ITEM_INDEX_COLLECTIONS` 內，同名即命中），前端 `ItemChips` 泛用 href 渲染即可點擊，未額外改碼；Playwright 手動核對點擊「烏龍麵」chip 正確跳轉。類別食材展開：新增 `scripts/ingredientCategories.js`（`CATEGORY_MEMBERS` 對照表＋`parseCategoryIngredient`），`itemIndex.js` 的 `resolveOne` 前置類別解析——收錄可從既有 items/recipes 目錄直接判定、不需臆測的 7 類（きのこ／ジャム／キムチ／つけもの／ピクルス／バター／はちみつ，含平假名片假名寫法歸一），每類成員逐一經 itemIndex 查 href，查無另記警告不靜默丟失；「水果類（フルーツ類）」**不收錄**——crops.json 無蔬果分類欄位，無法不猜判定成員（如杏桃未條目化），維持原「查無」警告，留給 U21 一併處理。前端 `ItemChips.jsx` 新增 `CategoryChip`：dashed 樣式按鈕＋▼/▲，點擊展開巢狀成員 chips（一般可點樣式）。驗證：build 警告 69→53（16 則類別食材查無警告解消，characters 側類別/フルーツ相關 warning 不受影響）；新增 unit test（`ingredientCategories.test.js` 5 則、`itemIndex.test.js` +3 則）共 189 全過；lint／build 綠；Playwright 截圖核對「烤蘑菇」展開顯示 6 個蘑菇 chips 皆可點、「錫紙蘑菇蒸」帶「，松露除外」註記完整保留（未被解析邏輯剝除）、角色頁 loves/likes/hates chips 無視覺回歸。

## Phase 7 — UX：追蹤器

- [x] T7.1 [UX] 遊戲日曆 HUD：當前 年/季/日、「過一天」按鈕、提醒 Toast（驗證：連按跨季跨年正確；春-27 跳娜娜生日 Toast）(dep: T4.1, T5.3)
- [x] T7.2 [UX] 種植追蹤：清單 + 新增 Dialog（crops 搜尋選擇）+ 倒數區間顯示（驗證：加卡薩布蘭卡→顯示「最快還需 10／最慢 14 天」）(dep: T4.3, T5.3)
- [x] T7.3 [UX] 澆水/收成互動：今日已澆水按鈕（同日冪等、按過變樣式）、可收成提示、收成→regrowable 分支（驗證：同日重複點無效；收成後不可重複收成的作物移歷史區）(dep: T7.2, T4.2)
- [x] T7.4a [UX] 畜牧追蹤：清單 + 新增 Dialog（animals 選擇 + 暱稱）+ 照顧天數顯示（驗證：新增動物、careDays 隔日 +1 顯示正確）(dep: T4.2, T5.3)
- [x] T7.4b [UX] 點心餵食 UI：四種類 +1 按鈕（每日限 1、同日冪等）+ 升級還差顯示（有 `treat_requirements` 才顯示倒數，註明「依攻略建議配方計算」；缺欄位只顯累計）（驗證：手動建測試存檔重現羊+魚味 3 案例——顯示還差 茶點2/野菜12/穀物12/魚味2；家畜條目未建前顯示累計數即符合規格）(dep: T1.8, T7.4a)
- [x] T7.5 [UX] Checklists 頁：Tabs 分四種、Checkbox 勾選即存（驗證：勾 6色耀珠兩項→重新整理保留；fishes/recipes 等空 checklist 顯示空狀態不崩）(dep: T4.4, T5.3)
- [x] T7.6 [UX] 匯出/匯入 UI：下載按鈕、檔案選擇匯入、備份還原按鈕（接 T3.5）（驗證：手動 round-trip；匯壞檔顯錯且原資料不動；匯入後按還原回到匯入前）(dep: T4.4, T5.3)
- [x] T7.7 [UX] slug 失配呈現：plots／animals 引用 slug 查無現行條目時顯示「未知條目（slug）」並保留原始資料不刪不藏（驗證：手動塞入不存在 cropSlug 的存檔，清單顯示 fallback 且不崩）(dep: T7.2, T7.4a)
- [x] T7.8 [UX] 儲存失敗警告橫幅：storage 寫入失敗旗標為真時顯示常駐橫幅，App 續以記憶體狀態運作（驗證：mock localStorage 丟 QuotaExceeded，橫幅出現且互動不中斷）(dep: T7.2, T3.1)

## Phase 8 — UX：視覺打磨

### 使用者回饋調整（2026-07-14 直接指示，優先於原規劃）

- [x] U1 左上返回鈕：header 左上 ← 鈕（非首頁才顯示；深連結直開無站內歷史時退回首頁，不跳出網站）（2026-07-18 使用者裁決追加：主標題「雙子村攻略手帳」改為可點擊連結，點擊直接回首頁；← 鈕保留原「回上一頁」語意不變，兩者並存、功能不同）
- [x] U2 篩選改版（參照 jackjeanne-merch，複選語意經確認採「同群組 OR、跨群組 AND」）：collection 頁自由輸入搜尋（name/name_jp/title）＋「篩選 N ▼」展開鈕＋chips 複選面板＋清除篩選；URL 逗號分隔複選值，深連結帶篩選直開時面板自動展開
- [x] U3 修正篩選無法輸入中文：新增 IME 安全的 `SearchInput`（組字期間不 setSearchParams——每鍵擊寫 URL 造成 router 重渲染打斷注音/拼音組字），Home 與 collection 頁共用；已用 Playwright 模擬 compositionstart/end 驗證「番茄」組字輸入正常
- [x] U4 條目明細不顯示資料查證註記：build 時 `stripEditorialNotes` 剝除 `> **…說明/修正/沿革/狀態/矛盾/關於…**` blockquote（guides 保留——那是文章沿革記錄；content/ 檔案不動，只影響產物）
- [x] U5 characters 九宮格頭像卡：3 欄 grid、build 時 `extractPortrait` 抽第一張 alt 以角色名開頭的圖（12/32 有頭像，其餘字首佔位）、整卡可點進明細；其他 collection 的 EntryCard 也改整卡可點；各 collection 補中文 label
- [x] U6 前端隱藏澆水與收集清單（資料結構與存檔遷移保留，只藏 UI）：PlantingTracker 移除澆水鈕、倒數改依 plantedOn 起算經過天數（隨「過一天」自動前進，Playwright 驗證 4/5 天→過一天→3/4 天）；TrackerPage 移除 ChecklistsSection 渲染
  - 註：T7.3（澆水互動）、T7.5（Checklists 頁）的既有實作與測試保留，功能停用中；T8.1 的水滴列（澆水進度）隨之失效，屆時改愛心列 only
- [x] U7 移除種植追蹤（2026-07-14 使用者裁決）：前端停用 PlantingTracker，元件/usecases/存檔結構保留
- [x] U8 虛擬遊戲日曆整組移除（2026-07-14 討論後裁決：依賴玩家逐日手動按「過一天」不現實，漂移後的提醒比沒有提醒更糟）：追蹤器 HUD/過一天/生日節慶 Toast、首頁今日提醒、動物照顧天數與「今日已照顧/已餵」同日鎖全部停用；追蹤器存檔改自動建立（無「開始新遊戲」）。點心改**無日期累計 stepper**（`adjustTreat` ±1、0 下限 clamp、−鈕防誤觸復原——「每日限 1」是遊戲內規則由玩家遵守，追蹤器只記帳）＋2 單元測試。T7.1/T7.4a 的相關實作與測試保留停用。影響後續：T8.1 愛心列（好感度）也隨照顧天數停用而失去資料源，屆時重新評估
- [x] U9 行事曆自導覽降級（同時裁決）：定位改為「生日/節慶索引頁」（價值在點擊→角色/節慶→喜好→來源的查詢鏈，非日曆本身；不依賴虛擬日期），自頂部導覽移除、入口改放首頁九宮格（📅 第 10 格）；CalendarPage 本體與路由不動
- [x] U10 UI 方向定案（2026-07-15 使用者自「A 牧場手帳／B 雙村對照」兩方向 mockup 比較後選 A）：`DESIGN.md` 落地為視覺憲章（色盤角色、排版、元件樣式、Do's and Don'ts），CLAUDE.md 憲章位置補指標。後續視覺任務以 DESIGN.md 為準——**T8.2 的「遊戲對話框風」改依 DESIGN.md 的拍立得／貼紙／資訊列語言執行**
- [x] U11 [UX] 首頁與 App 殼手帳化（依 DESIGN.md）：emoji 圖示→印章框線條圖示（新增 `icons.jsx` sprite）、九宮格→貼紙卡（紙膠帶／微旋轉／硬陰影／筆數）、搜尋→虛線底線、行事曆入口→緞帶列、header→手帳封面卡＋貼紙 nav（驗證：lint/test/build 綠＋375px 截圖目視）
- [x] U12 [UX] 條目頁手帳化：角色頁拍立得頭像、村莊印章章（藍鈴/此花/共通）、虛線資訊列、禮物撕紙 chips（最愛 seal 紅／討厭刪除線——hates 原本完全沒渲染，一併補上）、條目資訊區塊桌機置中 max-w-2xl，依 DESIGN.md §元件樣式（驗證：千尋 375／亞修 1280／番茄 375 截圖目視、lint/test/build 綠）(dep: U11)
- [x] U13 [UX] RWD 階梯式加寬（2026-07-15 使用者回饋「只限手機寬度在 web 上很怪」，修訂 README 決策 8）：殼 `max-w-lg → md:3xl → xl:5xl`、首頁貼紙牆 md 5×2（行事曆併入湊滿、緞帶列 `md:hidden`）、characters md:4/xl:6 欄、其他列表 md:2/xl:3 欄、main md:p-6；DESIGN.md §響應式行為同步
- [x] U14 [UX] 搜尋框 focus 外框移除（使用者回饋）：全域 `:focus-visible` 規則移入 `@layer base`，讓 `focus:outline-none` utility 能覆蓋；搜尋框 focus 回饋只靠底線虛線轉實線（DESIGN.md 記為唯一例外）

- [x] U15 [UX] 條目頁明細與內文左右間距一致（2026-07-17 使用者回饋）：移除 U12 加的條目資訊區塊桌機置中 `md:max-w-2xl`，明細列與 prose 內文同寬對齊（驗證：小型犬 1280 截圖目視）
- [x] U16 [UX] 追蹤器與行事曆手帳化（2026-07-17，手帳化收尾）：動物卡改貼紙（紙膠帶）、點心列改虛線格線、行事曆日格改點狀格＋楷體日數、🎉🎂 emoji→flag/cake sprite 圖示、季節鈕與各頁 h1 統一手帳語言（含 CollectionPage/GuidePage）、GameDialog 改細邊硬陰影＋ink 遮罩、匯出／匯入標題統一（驗證：375/1280 截圖目視）
- [x] ~~T8.1 [UX] HUD 風進度元件：愛心列（動物）、水滴列（澆水進度）~~——**2026-07-17 使用者裁決取消結案**：兩個資料源均已停用（U6 澆水、U8 照顧天數），元件無資料可顯示。若日後恢復日曆/照顧機制，屆時開新任務
- [x] T8.2 [UX] EntryPage 資訊卡改遊戲對話框風（粗邊框、圓角木框）(dep: T6.5)——**由 U12 實現結案**：U10 已裁定改依 DESIGN.md 手帳語言（拍立得／印章章／虛線資訊列）取代原「對話框風」構想
- [x] T8.3 [UX] 版面總 pass（2026-07-17，依修訂後決策 8 階梯式加寬執行）：三寬度 375/768/1280 × 7 頁（首頁/角色/料理/條目/guide 長表格/行事曆/追蹤器）自動化掃描（playwright 腳本檢查 `scrollWidth > clientWidth`）全數無頁面級橫向溢出；追蹤器點心按鈕行動版加大至 44px（`h-11 w-11 md:h-7 md:w-7`）；長表格維持容器內橫向捲動（驗證：21 張截圖＋溢出檢查腳本輸出）(dep: T7.6, T6.9c)
- [x] T8.4 [UX] favicon／頁 title／載入態三項細節（2026-07-20 完成）：①favicon.svg 原為 scaffold 殘留的預設 Vite 圖示（紫色抽象圖形，與站無關），改為呼應站內既有「印章章」視覺語言（DESIGN.md §Chips 同系列，seal/stamp 雙圈章）的羊皮紙圓底＋雙圈墨框＋「手帳」二字圓章；②頁 title：hash router 換頁不會重載 index.html，先前全站分頁標題固定不變，新增 `src/hooks/useDocumentTitle.js`（`document.title` 副作用 hook）並掛進 6 個頁面元件（Home 重置為站名／CalendarPage「行事曆」／TrackerPage「存檔」／CollectionPage `config.label`／EntryPage `entry.name??entry.title`／GuidePage `entry.displayTitle??entry.title`／GuidesIndexPage「攻略總覽」）；EntryPage／GuidePage 的 hook 呼叫特別放在「找不到條目」早退回傳**之前**（Hooks 規則不可條件式呼叫），查無條目時自然回退站名。RadixDemoPage（T5.3 元件驗證用、不進導覽列）不列入。③載入態：`index.html` 加 `<style>`，React 掛載前 `html,body` 先上羊皮紙底色避免白閃，`#root:empty::before` 顯示「載入中…」，React render 後 `#root` 不再是空的、偽元素自動消失，不需額外 JS 收尾。原依賴 T8.1 已 [!] 取消，改依 T8.2/T8.3（皆已完成）。驗證：lint／`npm test`（189）／`npm run build` 皆綠；Playwright 核對 8 條路由的 `document.title` 皆正確（含查無條目頁回退站名）、favicon.svg 直接開啟渲染正確、`javaScriptEnabled:false` 模擬掛載前畫面確認羊皮紙底＋「載入中…」置中顯示。
- [x] U17 [UX] 角色條目頁收斂為原始出處角色卡形態（2026-07-19 使用者多輪裁決）：(1) build 端 `stripCharacterTemplateSections`（禮物攻略/禮物攻略重點/約會資訊/來源段——frontmatter 全額覆蓋）＋`stripCharacterIntro`（開頭編輯句整段剝除——WebFetch 查證原始出處無介紹文，生日/家人/店家資訊皆由結構化欄位承接）＋`stripPortraitImage`（頭像與內文圖去重）＋`extractSources`（「## 來源」→ 頁尾弱化出處列，支援多來源＋擷取日期，32/32 覆蓋）；(2) characters 新增 `detailColumns`（條目頁限定欄：登場條件/居住地點/喜歡的服裝/約會時段/約會地點三級，列表卡 EntryCard 不受影響），缺值列不渲染；(3) 資訊列多值變體（陣列值 label 一行、值換行左對齊）；(4) 拍立得放大至 DS 截圖原生 1:1（容器 272px＝254＋相紙邊）、條目頁內文圖上限 255px 不放大；(5) 條目頁 prose 列表去圓點改手帳虛線行（guide 長文不套用）；(6) DESIGN.md 補記：拍立得原生尺寸、資訊列多值變體、條目頁三語言分工（欄位值→資訊列／可點物品→chips／敘事→手帳行）。驗證：176 測試全過、build 警告 73 無新增、亞修/伊爾薩 390px 全頁截圖目視。留尾：「家庭關係」「解鎖條件」內文段待 C11 補欄位後剝（先留避免資訊消失）
- [x] U18 [UX] 攻略總覽頁（guide 瀏覽入口）（2026-07-19 完成，4 項剩餘待決逐項對齊後動工——①首頁入口用行事曆同款緞帶列第二條，不塞貼紙格；②life 22 篇接受平面長列表不二層分組；③新增 2 個圖示（compass/house）補 basics/life 缺口；④GuidePage 加回鏈，皆已用 AskUserQuestion 對齊）：新增獨立路由 `/guides` → `GuidesIndexPage`，53 篇依 `system` 分組（新建全站唯一 `src/config/systemLabels.js` 的 `SYSTEM_LABELS`：basics 基礎/farming 農耕/livestock 畜牧/cooking 料理/fishing 釣魚/bugs 昆蟲/mining 採礦/life 生活/romance 戀愛，各配印章圖示），組內用資訊列同款點狀虛線行列出標題連結；`icons.jsx` sprite 新增 `book`（首頁緞帶列用）/`house`（生活）/`compass`（基礎）3 個圖示；首頁加第二條緞帶列「攻略總覽」（`#/guides`，全尺寸顯示，不像行事曆緞帶只在行動版顯示——因為沒有對應貼紙格可在桌機併入）；搜尋整合：`siteSearch.js` `SEARCH_FIELDS` 加 `guides: ['title']`、Home.jsx 匯入 guides.json 併入 `COLLECTIONS`、`SearchResults` 連結依 collection 分流 `#/guide/:system/:slug`（原本寫死 `#/c/...` 會連錯）；`GuidePage.jsx` 頂部加「← 攻略總覽」回鏈。DESIGN.md 補〈攻略總覽頁〉與〈緞帶列多條堆疊〉兩節。驗證：lint／`npm test`（179）／`npm run build` 皆綠；`npm run dev` 起 headless Chromium 截圖確認 `/guides`（375／1280px）、首頁雙緞帶列、GuidePage 回鏈皆正確渲染、console 無錯誤。**過程中發現的既有缺陷，同日追加修復**：`GuidePage.jsx` 的 `<h1>{entry.title}</h1>` 與 `entry.html` 內文本身開頭的 `<h1>`（來自原始 markdown 的 `# 標題`）重複渲染，每篇 guide 標題顯示兩次。修法：新增 `extractAndStripLeadingHeading`（build 端），53 篇中 38 篇內文開頭有 `# 標題`（15 篇本來就沒有）；抽出的內文標題文字存入 `entry.displayTitle` 取代 frontmatter `title` 顯示——不能無腦改用 frontmatter title，因為內文標題有時更豐富（服裝系統一篇內文是「服裝系統（衣装システム）攻略」含日文名，frontmatter title 只有「服裝系統攻略」，若捨棄內文標題會漏資訊）。`GuidePage.jsx`／`GuidesIndexPage.jsx`／Home 搜尋結果列表三處顯示皆改 `entry.displayTitle ?? entry.title`。驗證：lint／test（179）／build 皆綠；截圖確認山道系統（單一標題）、服裝系統（顯示含日文名的豐富標題、不重複）皆正確。

### 全站同型問題掃描（2026-07-19，依 C11–C13 修過的三類問題——重複／缺漏／分類混亂——掃描其餘集合與 guide 所得）

- [x] U19 [UX] 條目頁內文樣板重複清理——strip 機制擴及其餘集合（2026-07-20，子項 a–g 全數完成，收工）（U17/recipes 同型：資訊列已由 frontmatter 渲染，內文開頭句與樣板 bullet 全量重複）。**共同執行紀律**：每集合動工前先逐篇驗證開頭句/樣板 pattern 齊一（比照 RECIPE_INTRO 全 273 篇驗證），內文獨有資訊（欄位沒有的值、品質/星度註記語意）不可剝——有欄位缺口的先走 C 側補欄位再剝（C11 教訓）。各集合一子項（15–30 分）：
  - [x] U19a fishes 64 篇（2026-07-19 完成）：新增 `stripFishIntro`（build 端）比對開頭句兩種樣板變體——「X（Y）可在…釣獲，季節為…[,需…]。5★ 品質賣價…。」與「依地點而異：…」；逐篇驗證 64 篇僅 1 篇例外（短種螃蟹「可在…徒手抓取」——捕捉方式與「此花村」村莊資訊未結構化，屬獨有內容，pattern 天然不命中，保留原句不剝）。`collectionConfigs.js` fishes 加 `condition` 欄（原本開頭句是它唯一顯示處，剝除前先補欄避免資訊消失）、`sell_price` label 改「賣價（5★）」承接被剝除的品質語意。順手發現：鰻魚內文原句「…見下方說明」其實已因既有 `stripEditorialNotes`（U4）把下方「關於賣價」說明段當編輯註記剝除而形成斷頭引用（非本次新增問題），這次一併剝除開頭句後斷頭引用消失。驗證：`npm run build:content` 警告維持 69（無新增）、`npm test` 179 全過、`npm run lint`／`npm run build` 皆綠；JSON 產物抽查大種泥鰍/鰻魚/小河蟹已無開頭句，短種螃蟹保留完整原句。
  - [x] U19b insects 85 篇（2026-07-19 完成，範圍比原描述保守）：逐篇驗證發現「開頭句」本身（昆蟲顏色＋地區代碼連結）從未提及 season/location/time，全篇無重複，屬獨有內容，維持原判斷不剝；真正 100% 重複的只有「- 出貨賣價：NG」bullet（85 篇數值與 sell_price 欄逐一比對全數吻合，無例外），已由新增的 `stripInsectSellPriceBullet` 剝除。驗證：build 警告維持 69（無新增）、`npm test` 179 全過、lint／build 皆綠；抽查蟋蟀（bullet 緊接開頭句）／南洋大甲蟲／大帛斑蝶（bullet 在「## 特殊條件」段之後）三種版面皆正確移除 bullet、其餘內容完整保留。
  - [x] U19c items 158 篇（2026-07-19 完成，5 子目錄逐一驗證，結論比原描述分歧）：先於 `collectionConfigs.js` items 加 `buy_price` 欄（16 篇有商店購買價卻原本沒欄位顯示，剝內文前先補，同 C14 教訓）。逐子目錄結論——**basics/items（35 篇，2 樣板）**：山道採集物 25 篇剝開頭句＋「採集季節」bullet（賣價品質註記「1.5☆／隨年份成長」隨賣價 bullet 整列保留）；雜貨店食材/飼料 9 篇剝開頭句＋「購買價」bullet（「販售處」哪家店老闆未結構化保留）；鴻喜菇 1 篇因帶食譜引用附加句不符樣板，pattern 天然不命中，原句保留。**life/items（85 篇加工品）**：驗證後判定**無安全可剝內容**——材料／加工時間無對應欄位，售價 bullet 一律帶「來源未標星級品質」註記且未欄位化，剝了會丟語意，維持原樣。**farming/items（13 篇花束香水）**：intro（顏色／購買與否敘述）為獨有內容保留，「賣價」「商店購買價」bullet 與 sell_price／buy_price 欄逐篇比對數值一致，剝除。**fishing/items（7 篇戰利品）**：全篇「## 說明」皆為資料查證/取得方式敘事，未重複任何欄位，維持原樣。**livestock/items（18 篇，2 樣板）**：蜂箱蜂蜜 6 篇（不含取得方式特殊的蜂王漿）剝開頭句（與 location 欄「蜂箱（藍鈴村自宅增築）」全額重複），「取得條件」「賣價（5.0☆）」bullet 未欄位化保留；動物副產品 11 篇（蛋/奶/羊毛/羊駝毛）intro 收穫頻率/加工用途未欄位化保留，「賣價」bullet 與 sell_price 欄字串逐篇比對一致，剝除；蜂王漿因「與蜂箱蜂蜜同系列但無法取得」為獨有關係說明，intro 不剝。新增 `stripItemsTemplateIntro`（build 端，登記 4 組已驗證樣板，逐一比對 intro／bullet 正則，不命中維持原樣）。驗證：build 警告維持 69（無新增）、`npm test` 179 全過、lint／build 皆綠；JSON 產物逐案例（杏鮑菇/樹枝/雜草/咖哩粉/馬用曲奇/鴻喜菇/冬之燈火/多彩的大地/蜂蜜/蜂王漿/牛奶/軟羊毛）目視核對皆符合預期。
  - [x] U19d crops 45 篇（2026-07-20 完成，C14 解除 blocked 後接續）：`collectionConfigs.js` crops 新增 `detailColumns`（購入價 buy_price／澆水次數 water_times／購買地點 seed_shop／可重複收成 regrowable／再生間隔 regrow_days，後兩者組合承接原「可重複收成，每 N 天再生一次」語意，regrowable=false 時 regrow_days 為 null、EntryPage 既有欄位過濾邏輯自動不渲染該列）。`entryTransforms.js` 新增 `stripCropStatBullets`（5 個樣板 bullet 正則，逐篇核對零例外，U23①已把「賣價」的 5★ 語意落地在 label，剝除不丟資訊）；開頭句（作物類型／花卉加工連結／種植面積等獨有內容）不動；茶樹的季節分價段落寫法與 5 個樣板皆不同，正則天然不命中，維持原樣。驗證：build 警告維持 198（純樣板剝除不影響驗證規則）；新增 4 則 unit test 共 201 全過；lint／build 綠；Playwright 核對蕪菁（不可重複收成，無再生間隔列）／番茄（可重複收成＋再生間隔 3）／茶樹（澆水次數 0、季節分價段落完整保留）三種案例皆正確，列表卡無回歸。
  - [x] U19e festivals 19 篇（2026-07-19 完成）：新增 `stripFestivalScheduleSection`（沿用既有 `stripSectionsByHeading` 機制）剝除「## 舉辦時間」整段，與 day/season/location 欄重複的 14 篇（作物祭/倒數計時日/兒童節/動物祭/南瓜祭/天體觀賞日/年夜飯/抓蟲大會/抓魚大會/星夜祭/賞月日/賞花日/釣魚大會/雪節）套用；呼叫端加 `!entry.occurrences` 條件天然排除料理大會／花之日——兩篇用 `occurrences`（C6）表達多重日期，「## 舉辦時間」段是條目頁目前唯一顯示這些日期的地方（entry 頁 columns 只認單值 `day` 欄），剝了會讓使用者看不到確切日期，故不剝；音樂節 heading 名是「舉辦時間與地點」不同字串，pattern 天然不命中，其內文查證註記（地點原文矛盾說明）維持；冬之感謝祭／春之感謝祭本來就沒有這段（location 為「原文未提供」佔位值，屬 C15 範疇，非本任務處理）。玩法/獎勵段全數保留（獨有內容）。驗證：build 警告維持 69（無新增）、`npm test` 179 全過、lint／build 皆綠；JSON 產物抽查作物祭（段落消失）／料理大會／花之日（occurrences 段落完整保留）／音樂節／冬之感謝祭皆符合預期。
  - [x] U19f minerals 19 篇＋villages 2 篇（2026-07-19 完成，minerals 部分結論與原描述不同）：**minerals** 逐篇驗證後判定**無安全可剝內容**——開頭句實際寫的是「礦山隧道內的寶石／礦物」分類敘述（非原描述所說的「與 sell_price 重複」），這個寶石/礦物分類未有對應欄位，剝了會丟資訊；星度賣價表（獨有內容）本來就保留不動。**villages** 2 篇：先於 `collectionConfigs.js` 補 `shops` 欄（原本「## 商店」段的清單 bullet 是它唯一顯示處），新增 `stripVillageShopBullets` 只剝清單 bullet，段落標題與導覽句「村內共N家商店，完整商品清單…見[[商店指南]]」（家數統計＋連結，獨有內容）保留。驗證：build 警告維持 69（無新增）、`npm test` 179 全過、lint／build 皆綠；JSON 產物確認兩村 shops 陣列完整、html 已無清單 bullet。
  - [x] U19g animals 12 篇（2026-07-20 逐篇核對後裁決：維持不剝，結案）：逐篇讀 12 份 content 開頭句核對，確認每一篇都混合「與 buy_price 重複的價格」與「無對應欄位的購買地點／前置條件」——如貓「在...薛‧古拉尼或...青梅竹馬的馬屋購買，5,000 G，需**有飼養雞的經驗**才能購買」、羊「需**先飼養過牛（小牛）且有雞（小雞）**...才會開始隨機出售」，12 篇無一例外皆同型混合，非單純重複句，找不到可以只剝重複部分、保留獨有部分的安全切法（U19a/e/f 那種「整句可由既有欄位百分之百重建」的前提不成立）。維持原判斷：欄位化屬 C 側（見 C17），本項在 C17 之前沒有可安全執行的 code 動作，不需等 C17，直接結案不剝；C17 若日後落地，屆時若仍想剝再開新任務。
- [x] U20 [UX] guide 總覽表與條目頁全量重複的收整裁決（**UX 方向，須先與使用者逐 guide 討論，不可自駕**；C12「條目頁收整、guide 只留機制」同型延伸，但形態不同：戀愛事件是「單角色明細」搬家，這些是「一頁掃全部」的總覽比較表，收掉會失去總覽能力，替代案是列表頁排序/篩選是否已足夠、逐 guide 結論可能不同）。盤點清單：① cooking 5 篇食譜 guide——273 道全量表格與 recipes 條目 100% 重複（每篇 60–90 表格列），guide 獨有內容只剩廚具說明/料理系統機制/食譜改寫規則；② fishing 釣魚系統與地點總覽——「各地點完整資料表」＋「各釣魚點季節魚類」共 219 表格列重複 64 fishes 條目，獨有：基本操作/魚王/其他物品；③ bugs 捕蟲基礎與地區代碼——「完整昆蟲列表」108 列重複 85 insects 條目，獨有：捕蟲技巧/地區代碼/七大分類；④ mining 雙子村礦山攻略——「礦石寶石一覽（星度賣價）」重複 19 minerals 條目各自的星度表；⑤ life 四季節日總覽——「全年節日總表」重複 19 festivals 條目欄位；⑥ life 角色生日一覽——40 列生日表全額重複 characters birthday 欄，且行事曆頁已提供同功能（本篇是「整篇冗餘」候選，最接近可直接收掉的一端）；⑦ farming 花卉種植與加工——花卉種子/買賣價格表與 crops 花卉條目（玫瑰/瑪格麗特等已條目化）部分重複。附帶一併裁決：cooking/fishing guide 內「條目化狀態」章節是編輯 meta 非玩家內容（U4 曾裁決 guides 保留沿革記錄，收整時重新檢視）；C12 留尾的 5 篇 guide 措辭轉介微調併入。**2026-07-21 使用者追加疑問，併入本項一次討論**：④ mining 除了 guide vs 條目重複外，minerals 本身「列表頁 vs 明細頁」是否也高度相似到沒必要維持列表+明細兩層（現況：列表僅顯示賣價＋用途 2 欄，明細另加地點＋星度賣價表，重疊度不算最高，但值得與 guide 裁決一併考慮）；**收整前置檢查**：`minerals` 是 `scripts/itemIndex.js` 的 `ITEM_INDEX_COLLECTIONS` 六個可解析 collection 之一；已具體核對，多數角色 loves/likes/loathes 對礦石只寫類別字串（如「礦石類（礦石全部）」）不會命中個別條目，但確認有 2 個實際命中個別礦物 slug 的案例：`characters/賢者大人-優萊卡.md` likes 含「鑽石（ダイヤモンド）」→ 命中 `minerals/鑽石`；`characters/藍鈴村-羅萬.md` loathes 含「粉紅鑽石（ピンクダイヤモンド）」→ 命中 `minerals/粉紅鑽石`。這兩條連結（含 U27 送禮名單在鑽石／粉紅鑽石條目頁的反向 `giftFans` 區塊）都依賴 `#/c/minerals/鑽石`、`#/c/minerals/粉紅鑽石` 維持可定位的獨立路由/錨點，收整成單一頁面時必須保留（或等效改寫）這兩個目標，不能單純刪頁了事。（列表 vs 明細重疊度：已核對明細只比列表多一個零鑑別度的 `location` 欄「礦山隧道（雙村共通）」19 筆全同值，加上明細頁 body 只是單行敘述＋星度賣價表，佐證使用者「是否有必要維持列表+明細兩層」的觀察成立。）(dep: 建議 U18 攻略總覽頁先上——guide 瘦身後入口/導覽形態會影響裁決)

**2026-07-21 使用者逐項裁決並完成執行**：AskUserQuestion 確認 4 個決策——①②③④⑤⑦全量重複表格「移除重複表格」、⑥生日一覽「直接下架整篇」、④ minerals「只精簡 guide 重複表格（不合併列表/明細/guide 三者）」。逐檔執行前皆先查核是否真為 100% 重複（吸取 U19f「假設重複、驗證後發現不然」的教訓，非照單全收）：
- ⑥ `life/guide/角色生日一覽.md` 整篇刪除（`git rm`），`四季節日總覽.md` 移除指向它的「相關」bullet。
- ⑤ `四季節日總覽.md`「全年節日總表」（兩村共通/藍鈴村專屬/此花村專屬 3 張表）移除，改一句話指向各節日條目；機制段（料理大會評價/動物祭作物祭季節性/感謝祭）全數保留。
- ④ `雙子村礦山攻略.md`「礦石、寶石一覽（依星度賣價）」價格表移除，保留條目連結清單＋賢者之石／礦山石查證註記；採集點/敲礦技巧/入手管道/必須用到的地方等獨有內容不動。minerals 列表/明細維持現狀不合併。
- ⑦ `花卉種植與加工.md`「花卉種子」表格（種子售價/成長天數，與 crops 欄位逐筆核對 100% 一致）移除；**「花朵買賣價格」表格核實後判定並非重複，予以保留**——該表是商店收購的☆0.5 基礎價，crops 條目 `sell_price` 存的是 U23 已定案的 ☆5.0 頂級價，兩者是同一價格曲線不同切點（比對 12 筆花卉，比值穩定約 2.8×，與礦物星度倍率表同一規律），並非同一數字；花束/香水加工表格（材料/賣價/購入價，逐筆核對與 `farming/items` 欄位一致）移除。
- ① cooking 5 篇食譜 guide：主食類（73 道 4 張子表）、沙拉湯類（30 道 2 張食譜表＋2 張可追加材料表＋4 行基礎食材表）、甜點類（54 道，可追加材料表）、其他類（52 道 8 張子表）、拼盤類（64 道 3 張子表）皆移除逐項食材/賣價表，改一句話指向 recipes 條目＋分類篩選；**廚具說明／製作要點／材料分類說明（水果類/果醬類/蜂蜜類glossary）／各類「5★ 賣價排行 Top 10」皆保留不動**——後者查證後發現網站目前無任何「依價格排序」的查詢功能（`grep` 全站找不到 sort UI），guide 內的排行榜是唯一能看到「這個分類裡最貴的是哪幾道」的地方，屬獨有內容不可移除。
- ② fishing `釣魚系統與地點總覽.md`：「各地點的魚類、物品完整資料表」（6 個地點×表格）與「各個釣魚點的季節魚類」（4 季×表格，共 219 列）移除，改一句話說明——已於 C4 拆分條目時逐一核對，各魚種條目的 `location`／`sell_price` 欄已保留跨地點差異（含鰻魚兩地價格不同案例）；「其他物品」表格改指向 `fishing/items` 條目（該表原文早已標註條目版更準確）；基本操作/冬季釣魚/淺灘徒手抓魚/釣魚相關機制/地點總覽小表/關於魚王/條目化狀態 全數保留。
- ③ bugs `捕蟲基礎與地區代碼.md`：「完整昆蟲列表」（7 分類 108 列）移除，改一句話指向 insects 條目＋列表頁篩選；捕蟲技巧/地區代碼對照/七大分類總覽/資料矛盾說明 全數保留。

驗證：每一步都先用 script 抽查 crops/items/recipes/insects/fishes 的對應欄位逐筆比對過才動手（非憑印象假設重複）；`npm run build:content` 警告全程維持 201（無新增/減少）、`npm test`（204）／`npm run lint`／`npm run build` 全綠；guides.json 53→52 筆（僅生日一覽整篇下架）。
- [x] U21 [UX] 類別型物品參照統一機制（2026-07-21 完成主體，留一批明確擱置項）：查證後發現 recipes/characters 其實**共用同一套 `resolveItemStrings`／`resolveOne` 機制**（build-content.js 對 loves/likes/hates/loathes/ingredients 一視同仁呼叫），並非兩套做法各自為政——原 todo 文字寫的「應避免兩套」在動工前就已經是現況，不需要重新設計，只需要擴大既有 `resolveCategory` 認得的類別字串型態與成員清單涵蓋率。`ingredientCategories.js` 的 `parseCategoryIngredient`（T6.12 窄規則，僅認「XX類（YY類」）維持不動、既有 test 不受影響；新增 `parseCategoryReference` 寬規則，觸發條件是中文或日文任一側含「類／系／全部／全般／使った」（已核對全站現有物品/角色/料理/昆蟲中日文名稱皆不含這些字，不會誤判單一條目）。成員清單分兩種來源，皆非猜測：①`GAME_SPECIES_CATEGORIES`（ingredientCategories.js 新增，靜態清單）——昆蟲七類（蝴蝶/螢火蟲/蜻蜓/青蛙/獨角仙系/鍬形蟲系/蟬蝗蟲蟋蟀蜻蜓聯合）逐筆取自 pixnet 5011004184（insects 條目化既有來源，C16 用過）分類表格，獨角仙/鍬形蟲兩科來源沒分、改依各昆蟲 `name_jp` 是否含「カブト」/「クワガタ」判定（遊戲日文命名慣例本身，非分組猜測；長戟甲蟲兩邊都不含被排除，留白不猜）；②`itemIndex.js` 新增 `DYNAMIC_CATEGORY_RULES`——build 當下對 `collections` 動態過濾算出成員（自我全集如「農作物全部」「昆蟲全部」／recipes `category` 欄篩選如「湯」「沙拉」「甜點」／`name_jp` 關鍵字如「卵」「ミルク」「紅茶」「茶缶」「酒」「ジュース」「カレー」「フォンデュ」「生チョコ」／`ingredients` 陣列比對「含牛奶的料理」／`name` 前綴「大種」判定「デカ系の魚」），不手抄清單、內容增修自動同步。驗證：「物品索引查無」91→46（-45），無新增「類別食材成員查無」警告（新清單成員全數命中既有條目，零漏字）；`npm test`（214，含既有 `ingredientCategories.test.js` 5 則零改動全過）／`lint`／`build` 皆綠；Playwright 核對古恩貝「所有農作物」「所有昆蟲」「所有茶類」與女神大人「雞蛋類」「牛奶類」「蜂蜜」皆變成可展開 chips。**明確擱置（查不到源定義的不猜，維持警告現狀）**：花類／水果類／香草類——crops.json 無蔬果/花卉/穀物分類欄位，同 T6.12 當年判斷；辛辣刺激系料理（刺激物系の料理）——無結構化「辣度」欄位或字詞可過濾；菇類料理（きのこ系，亞修）——若沿用食譜蘑菇食材清單會把「料理」類別誤導向生食材條目（跨網域錯誤），寧可留白不接；賢者之石/杏桃/竹葉/香水/石材/木材/廢礦石/寶石/失敗品/紅酒/零食點心等——本來就是單一物品缺項，非類別參照，不屬本項範圍；蟬（セミ）／蝗蟲（バッタ，弗喬）／蝴蝶（蝴蝶，女神大人/雪莉露）——角色原文寫法沒有類／系標記字樣，嚴格對齊本項「類別型」定義之外，不擴大解釋。
- [x] U22 [UX] 操作介面 3 則 wikilink 查無目標（2026-07-22 完成，選方案一）：`[[作物]]`/`[[魚]]`/`[[昆蟲]]` 目標語意是 collection 列表頁而非單一條目，wikilink table 只索引條目建不出來。`wikilinks.js` 新增 `addCollectionAliases(table, aliases)`——條目鍵優先，別名不覆蓋既有鍵；`build-content.js` 新增 `COLLECTION_WIKILINK_ALIASES`（作物→`#/c/crops`、魚→`#/c/fishes`、昆蟲→`#/c/insects`）於 `buildWikilinkTable` 之後套用，全站通用機制、之後新增同類泛稱字只需擴充這份對照表。驗證：新增 2 則 unit test（別名生效／不覆蓋既有鍵）共 216 全過；lint／build 皆綠；`manifest.json` 的 `wikilink 查無目標` 警告歸零；JSON 產物核對「操作介面」guide 三處連結皆已解析成 `<a href="#/c/crops">`／`#/c/fishes`／`#/c/insects`。
- [x] U23 [UX] 作物「列表 vs 明細」差異化裁決（2026-07-20 完成①，結案）：分析與裁決見 2026-07-19 記錄——列表/明細相似是規則 5 的刻意設計，crops 現況因 C14/U19d 未落地而把相似放大成幾乎重複，主修正路徑已排定在 C14→U19d，不在本項另立。裁決①（不依賴 C14，可立即實作）：`collectionConfigs.js` crops 的 `sell_price` label 改「賣價（5★）」，列表/明細共用同一份 config 自動兩邊生效，也是 U19d 剝 bullet 的前置。裁決②（列表維持最小欄位，不加衍生比較欄）本就不實作，無動作。驗證：lint／test（189）／build 綠；Playwright 截圖核對 `/c/crops` 列表卡與蕪菁條目頁皆顯示「賣價（5★）」。
- [x] U24 [UX] 條目頁內文標題重複剝除（2026-07-20 完成）：動工前逐篇腳本抽驗 crops 45＋minerals 19＋villages 2 共 66 篇的 h1 文字，確認皆與 `name（name_jp）`（無 name_jp 時純 `name`）逐字相符、無額外資訊；minerals 金/銀/銅 3 篇的 h1 反而比 frontmatter `name_jp`（帶「（待確認）」查證後綴，屬 C22 待修範疇）更乾淨，同樣不含新資訊，剝除不受影響。`build-content.js` 新增一個 `name === 'crops' || 'minerals' || 'villages'` 分支，重用 guides 既有的 `extractAndStripLeadingHeading`，只取 `content`、不取 `heading`（不需要像 guides 那樣回填 displayTitle，entry 頁標題本就由 name/name_jp 欄位渲染）。驗證：JSON 產物 66 篇 html 皆無 `<h1>`（腳本核對 0 殘留）；build 警告維持 53（無新增/減少，符合預期——heading 剝除不影響物品索引/wikilink 判定）；lint／test（189）／build 皆綠；Playwright 截圖核對蕪菁／金／藍鈴村三頁標題不重複、其餘明細與 U19f shops 欄無回歸。
- [x] U25 [UX] 內文「## 來源」段整併頁尾出處列（2026-07-20 完成）：新增 `extractStandardSources`（比既有 `extractSources` 嚴格——要求每個 bullet「整行」都符合 `- [標題](url)（，擷取於 YYYY-MM-DD）?` 標準格式，undefined＝無此段／null＝段存在但格式不符／陣列＝可安全剝除）＋`stripSourcesSection`；`build-content.js` 對 fishes/insects/items/crops/minerals/festivals/animals（402 篇）套用，安全但不符者保留原段＋記警告，不靜默丟失。**逐篇掃描發現原規劃的「bullet 數與連結數對帳」安全閥不夠嚴**：402 篇中 95 篇的 bullet 帶查證補述文字（如「（2026-07-12 curl 重核對原文補日文名）」「（購買價、妊娠費用）」——後者是判斷「這條來源涵蓋哪些資料」的真實資訊，並非編輯註記），改用「整行完整匹配」規則，這 95 篇自動判定不符標準、保留原段，不會被結構化格式吃掉。驗證：307 篇成功剝除＋填 `entry.sources`、95 篇保留原段＋各記一則警告（build 警告 53→148，其中「其他」95 則皆為此安全閥觸發，可解釋）；新增 unit test（`extractStandardSources`／`stripSourcesSection` 各 3／1 則）共 193 全過；lint／build 綠；Playwright 核對大種泥鰍（307 類）顯示乾淨頁尾出處列、月淚草／牛（95 類）維持原內文「## 來源」段＋補述文字完整保留。
- [x] U26 [UX] 動物列表/追蹤器的寵物、畜牧分流（2026-07-21 完成，緊接 C21 落地同一輪做完——content 搬移後若不同步接上 code 端，wikilink 會斷 12 則，不留中間破損態）：③`build-content.js` COLLECTION_DIRS 加 `pets: ['livestock/pets']`；`validate.js` 加 `pets` 必填欄位表（不繼承 animals 的 product/product_value）。④`collectionConfigs.js` 加 pets config（label「寵物」，columns：species/village/buy_price，不設產物欄；filters 只有 species）。⑤`collectionsIndex.js`／`Home.jsx` 的 COLLECTIONS 加 pets；`siteSearch.js` SEARCH_FIELDS 加 `pets: ['name','name_jp']`。**首頁入口形態**：貼紙牆行動 3×3／桌機 5×2 已剛好填滿（同 U18 guides 當時的處境），不硬塞第 10 格，比照 U18 做法加緞帶列第三條，新增 `paw`（肉球）線條圖示。⑥畜牧追蹤器（AnimalTracker.jsx）不用改碼——直接 import `animals.json`，拆分後只剩家畜，寵物自然排除，已 Playwright 核對「新增動物」對話框搜尋不到寵物。⑦寵物舊 URL（`#/c/animals/貓` 等 5 個）不加轉跳——findEntry 查無已有「找不到條目」降級顯示，站內連結 build 時全量重算不受影響，只有外部書籤失效，成本效益判斷不加轉跳。順帶同步 `.spec/modules/tracker.md`〈後期規劃〉區「家畜條目補建（阻擋動物追蹤功能）」過時項目（C1 已建完，這次一併清掉，不再是待辦）。驗證：lint／test（204）／build 皆綠；Playwright 核對首頁寵物緞帶列與圖示、寵物列表 5 筆種類正確、動物列表縮為 7 筆純家畜、寵物條目頁無產物佔位、搜尋「貓頭鷹」正確歸戶「寵物」分組、追蹤器新增動物對話框不含寵物。
- [x] U27 [UX] 條目頁「送禮名單」——角色喜好反向索引（2026-07-20 完成）：新增 `scripts/giftFans.js` 的 `attachGiftFans(collections, computeHref)`——先建全站 href→entry 反查表（排除 characters/guides），再逐一走訪 characters 的 lovesLinks/likesLinks/hatesLinks/loathesLinks，依 href 目標反向歸戶成 `entry.giftFans = { loves: [{zh,jp,href}], likes, hates, loathes }`（陣列型別統一用 chip 慣用的 zh/jp/href 欄，方便前端直接餵 `ItemChips`，不另建 name 欄）；「或」擇一群組先攤平（`flatMap alternatives`）才歸戶，避免漏記。呼叫時機：`build-content.js` 主迴圈跑完 `characters` 那輪、其餘 collection 尚未 `writeCollection` 前呼叫一次，靠物件參照可變性讓 giftFans 在序列化前就掛上目標條目。「討厭」原本管線未解析（角色頁只渲染純文字刪除線），本次補 `entry.hatesLinks` 解析並**順勢**把角色頁自己的「討厭」區塊也從純文字改成 `ItemChips`（新增 `hate` variant：ink/55%＋刪除線，無邊框色，對齊 DESIGN.md「討厭」定義，與「最討厭」loathe seal 紅邊區隔）。EntryPage 新增「送禮名單」區塊，`GIFT_FAN_LEVELS` 宣告式渲染四級（無資料的級別/整區不渲染）。驗證：build 警告 148→189（新增 41 則皆為 hatesLinks 首次解析出的物品索引查無，屬預期——之前這欄從未走過索引查驗）；新增 `giftFans.test.js` 4 則（反向歸戶／alternatives 攤平／忽略查無與 characters/guides／同目標多粉絲累加）共 197 全過；lint／build 綠；Playwright 核對什錦炊飯頁送禮名單三級 chips 正確（娜娜/索娜最愛、7 位喜歡、瑪奧討厭）、娜娜頁「討厭」chips 改連結樣式且已解析項目可點。已知邊界（照設計不處理）：類別字串喜好（紅茶系/酒類全般等）未解析成連結者不進名單，留待 U21。
- [x] U28 [UX] recipes 列表縮減——名稱＋5★賣價一行卡（2026-07-20 完成）：查證 query-system.md 規則 3 的欄位取捨標準已由前次 session 回寫，本次直接沿用。`collectionConfigs.js` recipes：`columns` 縮為 `sell_price_5star` 一欄；「分類」欄移入 `detailColumns`（保留 guideHref 連結渲染，EntryPage 既有邏輯是通用 `columns.map` 不分 columns/detailColumns 來源，不需改動）、「廚具」欄轉篩選器（新增 `uniqueOptions(recipes, 'cookware')`，4 個動態選項）。**名稱帶不帶日文是先前規格未定的 UX 決策**（長名稱＋日文最長 18 字，手機寬度同行可能擠或換行），已用 AskUserQuestion 與使用者確認：帶日文、對齊全站慣例，接受換行代價。`EntryCard.jsx` 新增 `SingleColumnCard`（`config.columns.length === 1` 時觸發）：名稱（帶日文）左、值右一行，取代原本「標題+dl」兩段式；非 recipes 專屬——任何 collection 縮到單欄時同套用。`DESIGN.md` 補〈列表卡（EntryCard）〉一節記錄標準版與單欄版兩種版型。驗證：lint／test（197）／build 皆綠；Playwright 核對列表 273 筆皆一行卡呈現、篩選面板分類+廚具兩組 chips 正常、巧克力生日蛋糕（18 字最長名稱）換行但不破版、明細頁分類/廚具/賣價三列俱在且分類仍可點連到甜點類食譜 guide。
- [x] U29 [UX] 魚/蟲/礦列表欄修正三合一（2026-07-20 完成）：`collectionConfigs.js` 四處修改——①fishes `columns` 移除 `time`（64 篇全無此欄位的死欄）；②minerals `sell_price` label 改「賣價（☆0.5）」；③minerals `location` 欄從 `columns` 移到 `detailColumns`（EntryPage 通用 `columns.map` 邏輯不分來源，明細頁仍完整顯示，U28 已驗證同一機制）；④insects `filters` 新增 `time`（新常數 `TIME_OPTIONS = ['早晨','白天','傍晚','夜晚']`，固定遊戲時序而非字典排序）。`applyFilters`（`collectionQuery.js`）對陣列型欄位本就是 `entryValue.includes(candidate)` 的「包含」比對，`time` 是既有陣列欄位，未改動比對邏輯即可用。驗證：lint／test（197）／build 皆綠；Playwright 核對魚類列表無時段列、礦物列表帶「☆0.5」且無地點列／條目頁地點仍在、昆蟲篩選面板新增時段四選項、勾選「夜晚」85→84 筆正確排除僅白天出沒的光明女神蝶。

### 2026-07-21 使用者回饋（UI／內容架構）——待討論項目為主，僅 U31 可直接自駕

- [x] U30 [UX] 底線類標題／內文排版統一為「標題在上、內容在下」（2026-07-21 完成）：使用者確認範圍為「全部資訊列都改成上下排（廢除並排變體）」，不含 EntryCard 列表卡的 `dl`（另一個獨立命名元件，未在本次範圍內）。`EntryPage.jsx` 移除 `column.stacked`/`Array.isArray(value)` 的分支判斷，`columns`／`detailColumns` 兩來源合併後統一走同一個 `dt` 標題在上、`dd` 值在下（`mt-0.5`，不再 `text-right`）的渲染路徑；`linkedItems`（chips）與 `category`→guideHref 連結兩種特例渲染邏輯原樣保留在統一後的區塊內；family 自訂渲染分支不受影響（本就是上下排）。`DESIGN.md` §資訊列同步改寫，移除「兩變體並存」的舊敘述。驗證：lint／test（204）／build 皆綠；Playwright 375px 截圖核對蕪菁（crops，原單值並排的季節/賣價/購入價等欄）與娜娜（characters，含 family 自訂渲染）兩頁全部資訊列皆已改為標題在上、值在下，無視覺回歸。
- [x] U31 [UX] 篩選 chip／展開鈕觸控目標偏小（2026-07-21 完成）：`FilterBar.jsx` 的 `ChipGroup` 按鈕與 `CollectionPage.jsx` 的「篩選 N ▼」開關鈕皆加上 `inline-flex min-h-11 items-center justify-center ... md:min-h-0`（行動版最小高度 44px，桌機縮回原尺寸，撕紙圓角／邊框視覺不變）；chip 列容器由 `flex-nowrap overflow-x-auto`（單行橫向捲動）改 `flex-wrap`（多行自然換行，移除橫向捲動依賴）；群組 label 同步包一層 `flex min-h-11 items-center md:min-h-0` 以在行動版與變高的 chip 對齊。驗證：lint／test（204）／build 皆綠；Playwright 375px 截圖核對 `/c/insects` 篩選面板，季節／時段 chips 換行呈現、視覺上明顯加大好點擊，篩選開關鈕同步加大。
- [x] U32 [UX] 清除篩選按鈕顏色核實（2026-07-21 完成）：dev server＋Playwright 375px 截圖復現「清除篩選」按鈕實際渲染色，確認就是 ink/60 棕色、非藍，靜態讀碼判斷成立——**但沒有就此結案**，因為截圖只能拍到靜態畫面，拍不到手機「按下當下」的瞬間反饋。查全站 CSS 未曾設定 `-webkit-tap-highlight-color`，代表點按互動元素時吃瀏覽器/系統預設值——WebKit／Chrome 行動版預設多是半透明藍灰色閃光，會在手指按下的瞬間罩在按鈕上，最可能是使用者「看到藍色」的來源（螢幕截圖或桌機滑鼠點擊不會重現，因為那是純觸控裝置的按下態視覺，不是元素本身顏色）。修法：`src/index.css` 全域 `* { -webkit-tap-highlight-color: transparent }`——各互動元素本就有 active/selected 樣式承擔按下回饋（chip 選取變色、篩選展開等），關掉預設閃色不影響可用性，且與 DESIGN.md「陰影一律硬陰影、不用發散效果」的靜態手帳質感更一致。驗證：lint／build 皆綠；桌機 Playwright 無法重現觸控閃光本身，但已排除是任何 CSS class 或元件顏色設定的問題，且從源頭消除了最可能的觸控閃色來源。
- [x] U33 [UX] 魚類／昆蟲「依地點查詢」頁（2026-07-21 完成，先寫完整實作計畫經使用者核准後執行）：使用者裁決互動形式為「選地點→看該地點各時段/季節能捕獲什麼」，魚蟲各一份、同一互動模式。**動工前查證關鍵風險**：`insects.json`／`fishes.json` 的 `location` 欄位是自由文字（C4/C16 刻意設計，非結構化陣列），用腳本對全部 85 筆昆蟲、64 筆魚類實測解析——魚類「地點[、地點]*[：季節[，備註]?]?」以「；」分段，64 筆零失敗；昆蟲「[季節：]地區[0-9、]+」以「；」分段，85 筆中 82 筆規則命中，另 3 筆（姬螢／黃脈翅螢／老爺樹蛙）原文本身就寫「似乎全區」「地區全」這類不確定用語（bugs 攻略也承認「攻略作者自己也不確定實際範圍」），不猜測拆代碼，標記 uncertain 另歸「地點不確定」分類。新增 `src/utils/locationBreakdown.js`（`parseFishLocation`／`parseInsectLocation`／`buildLocationIndex`，純函數、不動 build-content.js／JSON schema，純前端即時計算）＋ 8 則單元測試（含經典小河蟹兩地點季節/備註不同案例、瀑布下／瀑布下游前綴不誤吃案例、姬螢不確定案例）。新頁面 `LocationLookupPage.jsx`（路由 `lookup/:collection`），地點選擇列沿用 U31 剛加大的 `ChipGroup` 觸控目標語言；`collectionConfigs.js` fishes/insects 各加 `lookupHref` 欄（通用機制）；`CollectionPage.jsx` 搜尋列下方加一條小型緞帶連結「依地點查詢」（`icons.jsx` 新增 `pin` 圖示）。名稱行與季節/時段/賣價行分兩行顯示（不做同行左右並排，避免長物種名擠壓，與 U30 剛定案的「標題在上、值在下」精神一致）。驗證：`locationBreakdown.test.js`（8 則）＋既有 206 則共 214 全過；`npm run build:content` 警告維持 201（此功能不碰內容管線）；lint／build 皆綠；Playwright 375px 截圖核對 `/lookup/fishes` 選「瀑布下游」列出 20 筆與地點資料吻合、`/lookup/insects` 選「地區4」列出 32 筆含時段、選「地點不確定」列出 3 筆並標示「原文：⋯」；`/c/fishes`、`/c/insects` 列表頁「依地點查詢」連結正確導向。
- [x] U34 [UX] 村莊筆記併入商店指南內容（2026-07-21 完成，先寫完整實作計畫經使用者核准後執行）：使用者裁決「village 條目頁直接內嵌完整商店清單」。研究確認不需新結構化欄位/UI 元件——`EntryPage.jsx` 對所有 collection 皆用同一套泛用 `entry.html` prose 渲染（含表格 overflow 護欄），guide 的 markdown 表格/條列搬進 village 條目頁可直接沿用；兩者圖片相對路徑深度相同免改寫。執行：①`content/villages/藍鈴村.md`／`此花村.md` 的「## 商店」小節換成兩篇 guide 的完整內容（商店通則＋各店 `##`→`###` 降階＋內部子表 `###`→`####`），並新增「## 來源」段（村莊條目頁原本沒有這節）；②`git rm` 兩篇 guide 檔案；③`build-content.js` 移除已失效的 `stripVillageShopBullets` 呼叫（原本假設「## 商店」整節到下個 `##` 前都是可安全剝除的重複店名清單，若不移除、內容搬入後會把新搬進來的 `- **營業時間**` 等關鍵資訊全部誤刪——執行前已用逐行剝除邏輯核對出此地雷並排除），連帶刪除 `entryTransforms.js` 內已無呼叫方的函式本體；④`villages` 加入 `SOURCES_SECTION_COLLECTIONS`，新增的「## 來源」段自動整併頁尾出處列；⑤26 個引用 `[[藍鈴村商店指南]]`／`[[此花村商店指南]]` 的檔案（basics/items 9 篇×2、livestock/animals 7 篇、livestock/pets 5 篇、livestock/guide 3 篇、life/guide 1 篇、life/items 1 篇、farming/guide 1 篇、characters 1 篇）機械式改指向 `[[藍鈴村]]`／`[[此花村]]`，逐一複查句中引用語句仍通順；順手清掉 `livestock/guide/動物飼養管理攻略.md`「相關」段因此變成的一組字面重複連結。**搬移前額外查證發現並排除的重複**：此花村「古恩貝的種子屋」原文的 7 張分季種子售價表（春/夏/秋/冬/穀類/果樹茶樹）逐筆核對後確認與 crops.json 既有 `buy_price`／`seed_shop` 欄 100% 吻合（沿用本次 session 一貫的「先驗證再決定去留」方法），未搬入村莊條目頁、改一句話指向 crops 條目；肥料（非作物、無對應欄位）維持完整小表搬入。其餘表格（動物購買/寵物購買/馬匇租賃/馬車清單/妊娠服務/飼料茶點/餐廳菜單）逐一核對後皆混有未結構化的獨有欄位（入手條件/可選顏色/妊娠天數等），依 U19c/g 同型先例判斷維持完整搬入、不拆分剝除。驗證：`npm run build:content`（guides.json 52→50、警告維持 201，wikilink 查無目標由 46 降回 3）／`npm test`（204）／`npm run lint`／`npm run build` 皆綠；Playwright 375px 截圖核對 `/c/villages/藍鈴村` 完整顯示商店通則＋6 家店＋來源列、`/c/animals/牛` 條目頁「相關」的村莊連結已正確指向村莊條目頁（非查無降級純文字）。
- [x] U35 [UX] 畜牧點心追蹤計算邏輯改「湊滿一輪配方才進下一輪」（2026-07-21 完成）：使用者裁決採用湊滿當輪配方制。新增 `computeTreatProgress`（`src/utils/treats.js`，取代原 `computeTreatShortfall`）：現行等級＝1＋四類點心中「已達成門檻數」最少的那個（跑最慢的類別決定實際等級，非各類各自獨立比較自己的下一階）；還差＝現行等級門檻－`treatsFed`（負值取 0，已超前的類別顯示 0）；四類皆達最終門檻回傳 `maxed: true`。**不需改 `TrackedAnimal.treatsFed` 資料結構**——`treatsFed` 本就是永遠累計不歸零的原始計數，「湊滿當輪」純粹是還差／等級的計算與呈現邏輯調整，超前類別的累計數不會被浪費，等其餘類別跟上、等級推進後自然承接下一輪門檻比較。`AnimalTracker.jsx` 改用新函式，UI 加顯「目前 Lv.N」，四類是否顯示改直接看 `treat_requirements[type] === null`（不再靠 shortfall 物件是否含該 key 判斷，因為 maxed 時 shortfall 為 null）；提示文字改「湊滿當輪四類配方才會升級，超前的類別已滿足這一輪、暫顯 0」；maxed 時顯示「已達最高等級（Lv.N）」。`tracker.md` 規則 5 同步改寫記錄新模型。驗證：`treats.test.js` 重寫（含原經典案例羊+魚味3、新增「魚味超前但仍卡 tier 1」與「四類同步後等級推進」與「maxed」三則）；`npm test`（206）／lint／build 皆綠；Playwright 核對新增測試羊餵魚味到 3（tier1，還差同原案例）、繼續餵到 10（仍卡 tier1，魚味顯示 0，其餘不變）兩種畫面正確。

- [x] C1 家畜條目補建（2026-07-12 完成）：建立 7 個 `livestock/animals/` 條目——雞/黑雞/牛/茶牛/羊/黑羊/羊駝（白色／茶色羊駝數值全同、僅毛色不同，併一條目；黑羊＝薩福克羊、茶牛＝新澤西牛，同物異名不另建）。購買價/入手條件/妊娠費用取自 [[藍鈴村商店指南]]（原缺的 buy_price/village 已有著落），`village` 比照既有寵物條目慣例填「雙村共通」（動物屋在藍鈴村但兩村玩家皆可買）、羊駝 `species` 直接填「羊駝」（列表頁篩選選項是動態產生，填「其他」反而不可讀）。`treat_requirements` 已回 pixnet 原文（5011712126）curl 核對：來源對一般家畜只給目標 2 門檻，3–5 級為來源明文公式「給予數 ×（目標數 − 1）」（含明文例：雞升 5 需茶點 2×4=8），依公式推得並在條目內註明推導；羊駝為來源明文實表（穀物/魚味每級只遞增 5，確認不符公式）照表填、茶點填 null。build 驗證：animals.json 5→12 筆、警告數維持 641（無新增）、155 測試全過；`computeTreatShortfall` 重現 T7.4b 規格案例（羊+魚味3 → 還差 茶點2/野菜12/穀物12/魚味2），升級倒數自動生效。來源 guide〈動物總覽〉的未建條目註記已同步改為條目化狀態。
- [x] C2 recipes 條目化（2026-07-12 完成）：5 篇食譜 guide 表格用確定性 python 腳本產出 273 個 `cooking/recipes/` 條目（主食 73／沙拉 14／湯 16／甜點 54／其他 52／拼盤 64，與各 guide 自述數量完全對帳）。schema 依 content-pipeline 規則：name/name_jp/category/cookware/ingredients[]/sell_price_5star；ingredients 依「＋」拆槽、每槽保留原文（含「或」替代鏈與類別食材字串，解析失敗照設計降級純文字＋警告）；廚具正規化 調味料/調味料台→調味料台。category 用遊戲內 6 個真實分類（沙拉/湯 分開，非 spec 原寫的合併「沙拉湯」——那只是同一篇 guide 的包裝），消費端同步一行更新 `collectionConfigs.js` 的 RECIPE_CATEGORY_OPTIONS。特例四則（皆加註於條目內文，不猜值）：泰式酸辣湯 5★ 賣價來源未收錄→不填；拼盤「油炸豆腐（あげだし豆腐）」與「油炸豆腐（油あげ）」中文撞名→前者依來源括號別名改「油豆腐」，主名留給全站材料欄都在引用的 油あげ；米飯 name_jp 依來源表填「ご飯」並註明材料欄慣用「ごはん」為同詞異寫（中文輔鍵仍命中）；水果湯圓標※但來源可追加材料表未列→照實標註不一致。驗證：build 警告 641→468（喜好→配方鏈解掉 173 則物品索引查無，例：娜娜 loves 炊飯 以日文鍵命中 什錦炊飯）、155 測試全過；剩餘 recipes 警告 340 則組成＝或替代鏈 8＋類別食材 22（T6.12 範圍）＋商店品/加工品/採集物 310（C3 範圍）。T6.12 blocked 已解除。
- [x] C3 物品條目化：食材來源鏈斷點消除（2026-07-14 完成）：確定性腳本從 7 篇已入庫 guide 表格產出 **151 個 items 條目**，分置各系統 `items/` 子目錄（同一 collection）——山道採集物 26（`basics/items/`，花類/褐色蘑菇的「日文待補」已 curl 核對 pixnet 原文補上、鴻喜菇從原文「隨機出現物品」清單補建）、商店食材 9（油/海苔/咖哩粉等，價取兩村商店指南）、製造機小屋 59＋水車小屋 24（`life/items/`；種子 43 筆不建——作物條目已含種子價且無引用鏈需要；米不重建——與 crops/米 中文同名，中文輔鍵已命中）、蜂蜜 7＋畜產品 11（`livestock/items/`）、花束 6＋香水 7（`farming/items/`）。查證修正 6 組（皆條目內文加註）：上等/極品香草蛋黃醬日文（來源複製錯誤，curl 確認）、綠茶罐/紅茶罐/人參茶罐日文（來源該欄寫中文）、杏仁酒→杏子酒（あんず＝杏子，材料「杏仁」判定指杏子非アーモンド）、四種罐裝紅茶＋罐裝可可條目名改依全站食譜引用寫法。**新增 `aliases` 選填欄位**（itemIndex 解析、含 2 單元測試）：7 個條目登記異寫（魔法紅草/月滴草/皇家奶茶/炊き込みご飯/魚の煮つけ/夏茶葉→茶樹），解 19 則警告。**C4 螃蟹誤判修正**：チビシャンガニ 原判誤植併入短種河蟹，本次發現食譜/角色頁獨立引用＋外站（攻略Memo）證實四蟹並存數據吻合，拆回獨立條目 [[短種螃蟹]]（fishes 63→64），短種河蟹的季節污染同步修正。成效：物品索引警告 468→61（唯一 45），剩餘全屬既知範疇（類別字串＝T6.12、或替代鏈＝既有設計、竹葉/杏桃/失敗品等＝來源無資料不猜）；items.json 7→158 筆、157 測試全過。
- [x] C4 fishes 條目化（2026-07-07 深度審查發現，2026-07-12 完成）：`釣魚系統與地點總覽.md` 六個地點的魚類表用確定性 python 腳本合併（依 name_jp 去重、season 取聯集、location/condition 依 insects 慣例寫成可讀字串而非結構化陣列——核對後跨地點賣價衝突只有鰻魚 1 例，不需要為此讓全部 63 篇套用陣列 schema），共產出 63 個 `fishing/fishes/` 條目（65 魚種扣掉判定為來源誤植合併的 1 筆、5 隻魚王不獨立建條目）。`time`／`size_range` 來源缺，不填（非網站必填）。兩個資料疑點已用 curl 核對 pixnet 原始網頁確認**皆為來源本身資料，非先前轉錄錯誤**：鰻魚池/瀑布下游賣價不同（1960G／720G）→ `sell_price` 依地點分列，不取單一代表值；「チビシャンガニ／大種河蟹」→ 因「チビ」字首全篇無例外對應「短種」，判定為「チビサワガニ／短種河蟹」之誤植，併入該條目並加註判斷依據（**2026-07-14 C3 修正：此判斷錯誤**——食譜/角色頁獨立引用＋外站攻略Memo證實為獨立蟹種，已拆回 [[短種螃蟹]]，63→64 條目；「大種河蟹」中文欄仍為來源誤植）。來源 guide 的〈尚待處理〉章節已同步更新為〈條目化狀態〉。補齊後 fishes.json（63 筆）、魚圖鑑 checklist、魚類篩選/查詢鏈、35 則先前查無的物品索引連結自動生效。
- [x] C5 `grow_days` 未加引號（2026-07-08 T2.5 驗證發現，2026-07-09 修正）：13 篇 crops（可可豆/咖啡/大豆/小麥/桃子/橘子/櫻桃/米/紫葡萄/茶樹/蕎麥/蘋果/香蕉）的 `grow_days` 改成加引號字串（如 `grow_days: "59"`），build warning 消失（689→676 則）
- [x] C6 festivals `day` 欄位型別不一致（2026-07-09 T6.8 CalendarPage 使用時發現，2026-07-12 修正）：`花之日`／`料理大會` 移除單一 `day`，改用共用的 `occurrences: [{ season, day, village? }]` 陣列（`village` 只在花之日這種跨村不同日的情況才填）；`season` 欄位保留（仍是正確的「涵蓋季節集合」）。其餘 17 篇完全不動。消費端同步更新：`CalendarPage.jsx` 的 FESTIVAL_ITEMS 建構、`reminders.js` 的 `findRemindersForDate`（原本只認 `festival.day` 單值，沒改的話這兩篇會永遠不觸發今日提醒）都改成優先讀 `occurrences`、沒有才 fallback 舊邏輯；`scripts/validate.js` 的必填欄位表也把 festivals 的 `day` 改成 `['day', 'occurrences']` 擇一滿足（一般化寫法，非兩篇的特例判斷）。手動驗證：行事曆頁夏10正確顯示「花之日（藍鈴村）」、秋18顯示「花之日（此花村）」、春/夏/秋/冬各自 4 天顯示料理大會；追蹤器推進到夏-10 正確跳出花之日提醒 Toast。
- [x] C7 一般村民頭像未 ingest（2026-07-14 U5 角色卡上線後分析發現，同日完成）：20 位無頭像角色全部來自「所有村民簡單介紹」（pixnet 5010149856）同一次 ingest，該次**只取了文字、沒抓圖**（20 篇條目檔 0 張圖）——但已 curl 核對原始網頁本文有 37 張圖，其中含**每位村民的對話頭像截圖**（已抽樣下載確認：雪莉露對話截圖，風格與 12 位可攻略角色現有頭像一致；其餘為店面外觀照，需依前後文區分）。**非來源缺圖，是 ingest 缺口**。完成方式：下載全部 30 張候選圖並**逐張目視核對對話框名牌**建立村民↔頭像對照（不靠圖文順序推斷——因為發現店面照在本頁與商店指南兩處的標示互相矛盾，見下），20 張頭像入 `images/leomoon173-pixnet-5010149856/`、依 alt 慣例插入各條目 body 開頭，characters 32/32 全有頭像。**店面照這次不歸檔**：同一張圖（8d25…/1ccb…）在本頁與藍鈴村商店指南的建物標示互相矛盾（動物屋 vs 布提‧霍華德），無法不猜地判定誰對，留待日後有第三來源再處理。
- [x] C8 characters `marriageable` 全部誤標 true（2026-07-14 C7 分析時發現，同日修正）：依站內 romance guide 明文名單查證——女主 6 位（亞修/卡米爾/奇利克/千尋/米海爾/迪魯卡）＋男主 6 位（莉亞/拉茲貝莉/莉可麗絲/娜娜/賢者大人/艾瑞拉）共 12 位保留 true，與戀愛對象來源（5012321571）涵蓋者完全吻合；其餘 20 位（含女神大人——村民介紹頁明確將其歸「其他村民」、僅送禮互動，且頁首明示戀愛對象另見他篇）改 false。驗證：列表頁可攻略篩選 是→12、否→20。
- [x] C9 「暫缺/待補」說明整批刪除（2026-07-15 使用者裁決確立內容原則：**來源沒有就是沒有——缺值留空走 build warning，不寫欄位暫缺/待補/未解問題說明段**）：刪除 兩村 specialties 暫缺註記、3 篇 guide 增築「未解問題」註記、兩篇食譜 guide 的「食譜取得方式」臆測段（內容本身就是猜的）、生日一覽待補充 bullets、茶樹冬茶暫無數據、奇利克 occupation（待補）佔位值（改缺欄位，+1 warning 為誠實狀態）、木匠任務查無目標的 [[増築指南]]（待補）參照（-1 wikilink warning）。山道系統 4 個「日文待補」中可考證的 3 個直接補值（咖哩肉包＝カレーまん 同頁原文有載、廢礦石＝クズ鉱石 同作者角色頁多處攻證、賢者大人（賢者さま）站內條目既有），礦山石不可考證改「—」。查證紀錄類 blockquote（日文名來源說明等，U4 已不對讀者顯示）保留。
- [x] C10 characters `hates` 陣列未區分「最討厭」與「討厭」（2026-07-17 使用者提出角色頁要拆出「最討厭」欄發現，**2026-07-19 確認已由 eaba3d7 完成銷帳**：欄位名採 `loathes` 而非原擬 `most_hate`，32 篇全數補齊，EntryPage 已拆「最討厭」chips——seal 紅邊＋刪除線）：現行 frontmatter 只有 `loves`（=最喜歡，已獨立成欄）／`likes`／`hates`（討厭與最討厭合併一個陣列），沒有 `most_hate` 欄位。查了 32 篇角色條目，僅 10 篇（多為有詳細戀愛攻略頁的可攻略角色）內文有「**最討厭**：某項」粗體段落可辨識單一項目，其餘 22 篇（含 2 位可攻略角色：卡米爾、奇利克）原始來源沒有這層區分，`hates` 就是未排序清單。需要走 vault skill 回頭逐篇核對原始出處頁面，比照 `loves` 已獨立「最喜歡」的做法補一個 `most_hate` 欄位（沒有的角色就留空，不猜）；補齊後再回 code 端（`collectionConfigs.js` 加欄、`EntryPage.jsx` 拆出「最討厭」區塊）。
- [x] C11 characters 角色卡欄位補齊（2026-07-19 使用者裁決：條目頁以原始出處角色卡為明細規格）：資料段——從 pixnet 5027225964（12 位可攻略戀愛頁）與 5010149856（全村民介紹頁）curl 拿原始 HTML 逐字核對，32 篇全數補上 `debut`（登場條件）；`family`（家庭成員，格式 `["母親：傑西卡（ジェシカ）", …]`）補 18 篇（14 篇來源本身無家人資料照實不寫欄位，非猜值）；`residence`（居住地點）補 29 篇——3 篇（神·羅、羅萬、穆喬）交叉查證官方站/wikiwiki 攻略 Wiki/web search 後，神·羅／羅萬仍無法不猜地判定、依使用者裁決留空，穆喬循 villages.md 商店清單＋items.json 商店指南引用＋全站店名皆以老闆本名命名的慣例確認「穆穆喬」補上；奇利克／迪魯卡／賢者大人／米海爾用自身條目已收錄的「居住地點外觀」路線圖說更精確值取代 source1 摘要值。職業／介紹欄**不建**（查證出處無此資料）。code 段：`entryTransforms.js` 新增 `resolveFamilyLinks`（family 字串「稱謂：中文（日文）」→ 站內角色連結，查無留純文字＋警告，含 3 條 unit test）；`build-content.js` 產出 `entry.familyLinks`；`collectionConfigs.js` characters `detailColumns` 加 `family`；`EntryPage.jsx` 資訊列自訂渲染 family（chips 不支援前綴稱謂，改逐行 `稱謂：<a>連結</a>`，DESIGN.md 補規範）；`CHARACTER_TEMPLATE_HEADINGS` 加入「家庭關係」「解鎖條件」，內文樣板段隨結構化欄位到位一併剝除。驗證：`npm run lint`／`npm run build:content`（警告 73 無新增）／`npm test`（179 全過，+3 新測試）／`npm run build` 皆綠。
- [x] C12 characters「戀愛事件」段缺漏＋wikilink 誤植（2026-07-19 使用者抽驗發現）：12 位可攻略角色中僅 2 位（卡米爾、奇利克）條目有「## 戀愛事件」段指向 [[戀愛事件-女主人公]]／[[戀愛事件-男主人公]] 兩篇既有完整逐角色事件攻略（愛情度花朵等級、4 個戀愛事件觸發條件與對話選項、求婚條件），其餘 10 位完全沒有這段——**資料本來就有，只是條目頁沒連過去**。連帶發現這 2 個既有連結本身也是壞的：`[[romance/guide/戀愛事件-女主人公|...]]` 誤把資料夾路徑當 wikilink target（`buildWikilinkTable` 只用裸 slug 建索引，不含路徑），實際 render 成純文字，屬既有 7 則 wikilink 查無目標警告的其中 2 則。修正：① 卡米爾/奇利克 2 篇的路徑寫法改回裸 slug（連同卡米爾另一條 `[[basics/藍鈴村商店指南]]` 同誤一併修正）；② 其餘 10 篇補「## 戀愛事件」段連到對應性別的攻略篇，其中 4 位（米海爾／迪魯卡／賢者大人／艾瑞拉）依來源攻略篇的「特殊規則」摘要一句提醒（迪魯卡無觸發式事件、賢者大人與艾瑞拉花朵計數/顏色機制特殊、艾瑞拉婚後不能生子）；③ 艾瑞拉條目內另一處 `[[#解鎖條件|解鎖]]` 頁內錨點原本就不曾生效（wikilink table 不支援 `#標題` 片段語法）且該標題已在 C11 隨結構化欄位剝除，改純文字「解鎖」。驗證：build 警告 73→69（4 則 wikilink 查無目標消解，剩 3 則為既有無關的 guides/操作介面「作物/魚/昆蟲」分類頁缺口）；lint／test（179）／build 全綠；抽查全部 12 位可攻略角色 html 產物確認「## 戀愛事件」段皆有、連結皆為真正 `<a href>`。**同日延伸（使用者提出兩個後續問題後追加）**：①換頁不回頂部——`Layout.jsx` 加 `<ScrollRestoration />`（react-router data router 內建元件），全站換頁自動回頂部、瀏覽器上一頁/下一頁仍還原原位置；②戀愛事件內容架構改為「條目頁收整、guide 只留通用機制」（使用者裁決，與 C11 的「條目頁以角色卡為明細規格」方向一致）：12 位角色的 4 個戀愛事件表格＋求婚條件從 [[戀愛事件-女主人公]]／[[戀愛事件-男主人公]] 兩篇搬進各自條目頁「戀愛事件」段（含 4 位特殊規則角色摘要），guide 兩篇只留愛情度花朵等級／通用求婚說明／共通道具（角色專屬求婚道具如迪魯卡奶油炸肉餅、艾瑞拉冰淇淋移除，改留言指向角色頁）；搬移時去重guide 附的角色頭像（與角色自己拍立得同一張照片的直接丟棄，不同張的視為冗餘一併不搬，維持手帳低密度原則）。連帶修正：`EntryPage.jsx` prose 補上 `[&_table]` overflow-x-auto 護欄（角色頁首次出現表格內容，之前沒這個需求），DESIGN.md 版面原則補記。**留尾**：其餘 5 篇引用 `[[戀愛事件-女主人公/男主人公]]` 的 guide（結婚與婚後生活、藍鈴村/此花村村民事件、約會與嫉妒事件、四季節日總覽）措辭仍暗示細節在該 guide，實際已搬到角色頁（guide 本身開頭已加註說明可自行連過去，不算斷鏈，但措辭略有一層轉介，非阻塞問題，日後可考慮微調成直接點名角色頁）。
- [x] C13 characters「戀愛事件」對話選項缺中文＋數值誤植＋整段缺漏（2026-07-19 使用者回報「來源有中文說明，攻略沒有了」，查證後範圍擴大）：curl 重抓 pixnet 5010168176／5010160702 兩篇原文（比 C12 用的舊版 guide 更完整），逐句核對 12 位角色全部戀愛事件選項，發現三類問題：①**全部缺中文**——舊版 guide 只留日文對話原文，來源每句都附中文翻譯，12 位角色全數補回（逐句照抄來源翻譯，不自行校訂——娜娜戀愛事件1 來源翻譯「幸災樂禍就好了」明顯文不對題但仍照抄，加註「來源翻譯」字樣提醒非我方誤植）；②**亞修戀愛事件1 數值錯誤**——「わたしと遊んで！」／「遊んであげなよ♪」兩個選項的加減分在網站上是反的，對照來源訂正（－3,000／＋3,000）；③**整段缺漏**——12 位角色的求婚條件原本只列「愛情度＋前置條件」，來源另有「求婚後」「※婚禮」加分效果全數缺漏，12 篇全部補上；亞修／奇利克／千尋 3 位另有「逆求婚」（女主人公主動求婚）完整機制（條件、對話選項、拒絕逆求婚後的求婚分支）先前完全沒收錄，本次整段新增；順手補 3 則來源既有但先前漏收的小提醒：卡米爾戀愛事件1 選對也不會出現花朵動畫（遊戲特殊情況）、米海爾結婚後不再季節性離開、迪魯卡奶油炸肉餅來源註記「似乎不送也可求婚」。驗證：build 警告 69 無新增、lint／test（179）／build 全綠、抽查亞修 html 產物確認訂正後數值與新增逆求婚段落正確渲染。
- [x] C14 crops 欄位補齊（2026-07-20 完成）：45 篇作物條目的「澆水次數」「種子購買地點」資訊**已存在於已ingest的內文**（如蕪菁「澆水次數：5 次」、開頭句「此花村「古恩貝種子屋（ゴンベの種屋）」」），只是沒結構化進 frontmatter——不需回頭查證外部來源，純粹把既有內文資訊機械抽取進欄位，逐篇腳本抽取後人工核對零例外：①`water_times`：內文明確二擇一「澆水次數：N 次」或「不需澆水」，後者填 `0`（真值，非缺值）；②`seed_shop`：45 篇的商店只有兩間，且與 `village` 欄一一對應（此花村→古恩貝的種子屋，藍鈴村→卡米爾鮮花店，兩店名沿用 `villages/*.md` 既有 `shops` 陣列的寫法，非重新命名），逐篇核對 village 欄與內文提及村莊一致、無例外。腳本核對：45 篇 water_times 與內文 bullet 逐字比對零誤差、village↔shop 對應零例外。驗證：`build:content`（警告維持 198，符合預期——新增欄位不影響既有驗證規則）／`test`（197）／`lint`／`build` 皆綠。解除 U19d blocked。
- [x] C15 festivals `name_jp: 原文未提供` 佔位值 10 篇（2026-07-20 完成，走 vault skill `harvest-moon-twin-villages` 流程，結論與原推測相反）：curl 重抓來源 pixnet 5012066366（全年節日簡介）全文，逐一核對 10 個節日名稱——**原本推測「節日名如収穫祭很可能原文有、當初 ingest 漏抓」查證後不成立**：作物祭/動物祭/料理大會/天體觀賞日/星夜祭/雪節/音樂節/春之感謝祭/冬之感謝祭 這 9 個名稱在來源全文（節日總表＋各村逐節日詳細段，逐段落逐標題核對）確實從未帶日文，是來源本身只寫中文節日名，不是 ingest 疏漏；只有南瓜祭在此花村詳細段找到日文「かぼちゃ祭の日」，補上真值。其餘 9 篇依 C9「來源沒有就是沒有」原則直接移除 `name_jp` 欄位（不留佔位字面值）——`validate.js` 本就把 festivals 的 `name_jp` 列必填，缺欄位自動產生 build warning（189→198，誠實反映缺值狀態，非錯誤）。驗證：`build:content`／`test`（197）／`build` 皆綠；Playwright 截圖確認「作物祭（原文未提供）」的顯示瑕疵消失、南瓜祭正確顯示「南瓜祭（かぼちゃ祭の日）」。工作日誌已記入 vault `projects/牧場物語-雙子村-攻略網站.md`。
- [x] C16 insects「昆蟲顏色」欄位化查證（2026-07-20 完成，走 vault skill 流程）：curl 重抓來源 pixnet 5011004184 全文，來源以分類表格（蝴蝶類/蝗蟲類/螢火蟲類/…）列出每種昆蟲的「昆蟲顏色」欄，5 個跨類別抽驗（蟋蟀/蟈蟈/中東王蝶/南洋大甲蟲/大窗螢）與已 ingest 內文的「昆蟲顏色為X」逐字比對皆吻合，確認當初 ingest 忠實轉錄、非猜值；**5 篇青蛙來源表格本身沒有「昆蟲顏色」欄**（表頭只到「出現地區」），這 5 篇天生無值可補，非缺漏。腳本逐篇抽取 80 篇（85 減 5 蛙）的「昆蟲顏色為X」補 `color` 欄，零例外。解除 U19b 當時「顏色未欄位化」的限制：新增 `stripInsectColorClause`（entryTransforms.js）剝除開頭句「，昆蟲顏色為X」子句，`collectionConfigs.js` insects 加 `detailColumns: color`（先補欄再剝，符合 U19 教訓）；「，鑑定盒顏色為Y」（選單顯示用的鑑定盒顏色，非昆蟲本身顏色）是另一件獨有資訊，regex 只移除昆蟲顏色子句，不誤刪。驗證：build 警告維持 198；新增 3 則 unit test 共 204 全過；lint／build 綠；Playwright 核對蟋蟀（顯示「顏色：褐色」）、南洋大甲蟲（鑑定盒顏色子句完整保留）、黑斑蛙（無顏色列，句子不受影響）三種案例皆正確。
- [x] C17 animals 購買資訊欄位化查證（2026-07-20 結案，未補欄）：本項存在的唯一理由是讓 U19g 能安全剝除內文——U19g（2026-07-20 已完成）逐篇核對 12 篇後判定「維持不剝」，不只因為缺 buy_shop/buy_condition，而是內文還混著解鎖時機（如「第 2 年後才會開始隨機出售」）等更多欄位沒有的獨有資訊，補了這兩個欄位也解決不了「找不到安全切法」的根本問題。沒有其他任務依賴這兩個欄位，依 C17 自身文字「若裁決 animals 內文保留不剝，本項可一併關閉不做」直接結案，不需另走 vault 流程查證。
- [x] C18 romance 兩篇 guide 的角色名清單補 wikilink（2026-07-19 使用者發現：`戀愛事件-女主人公`／`戀愛事件-男主人公` 內文提及個別角色（開頭段落括號清單、「## 相關」bullet、專屬求婚道具舉例句）皆是純文字，未連回角色條目頁）：12 位角色全數已有既存條目頁（`name` 欄位逐一核對存在），純語法層級補 `[[角色名]]`，不涉及任何新資料查證，故直接編輯，未走完整 vault ingest 流程。驗證：build 警告維持 69（無新增撞名/查無目標）、lint／test（179）／build 皆綠；JSON 產物確認兩篇文全部 12 個連結皆解析成真正 `<a href>`。
- [x] C19 characters「任務」段收整：32 位角色任務表從 7 篇 guide 搬入各角色頁（2026-07-19 使用者裁決「跟戀愛事件一樣處理方式」，C12 同型延伸）：原本只有 4 位（米海爾／女神大人／艾瑞拉／賢者大人）條目有「## 任務」段且僅一句轉介到 [[米海爾女神大人艾瑞拉賢者任務]]，其餘 28 位任務資料只存在 guide、角色頁完全沒有。7 篇任務 guide（米海爾女神大人艾瑞拉賢者／藍鈴村任務系統／藍鈴村村民／藍鈴村雜貨店木匠神父／此花村村長家種子屋奇利克／此花村醫院迪魯卡熊貓大叔／此花村果樹園食堂雜貨店）的逐角色 RANK D～S 表格全數搬進各自角色頁「## 任務」段：4 位既有段保留原摘要句、舊轉介句改為機制指引句（隨機物品／謝禮數量註記＋連到 [[委託任務系統]]）；28 位新增段帶告示板接取導語（村別依角色歸屬）＋通用機制連結，任務相關 intro 句跟著搬（艾琳增築建材、神·羅限界突破），純角色描述 intro（動物屋老闆等，與角色頁欄位冗餘）與段內角色圖（與拍立得同源冗餘，C12 同規則）不搬；★不可思議的水註腳、RANK S blockquote、打工任務子列等全數保留。guide 7 篇瘦身為任務機制＋「完整列表已收錄於各自角色條目頁」指回句＋相關/來源；32 位角色頁 ## 來源 補對應 pixnet 來源行（URL 去重）。驗證：搬移前後表格列數完全一致（1223→1223）、build 警告維持 69、[[委託任務系統]] 32 個連結全數解析為 `<a href>`、guides.json 不再含 RANK 小節（characters.json 32 個）、lint／test（183）／build 全綠。搬移腳本走 scratchpad 未進 repo。
- [x] C20 外部連結一律另開新分頁（2026-07-19 使用者裁決）：UI 元件出處列（EntryPage 頁尾多來源/單來源、GuidePage source）原本就有 `target="_blank" rel="noreferrer"`，缺口在 build 產物 entry.html 的內文連結（marked 產出的 `<a href="https://…">`）。entryTransforms 新增 `openExternalLinksInNewTab(html)`（僅 http/https 開頭補 target/rel，站內 `#/` 連結不動）掛在 build-content marked.parse 之後，帶 2 則 unit test。驗證：guides.json 53 個外部連結全數帶上 target/rel、無殘留裸 `<a href="http`。
- [x] C21 animals 寵物/畜牧分類欄位化（2026-07-21 完成）：①寵物 5 篇（大型犬/小型犬/貓/貓頭鷹/馬）用 `git mv` 從 `livestock/animals/` 搬到新資料夾 `livestock/pets/`（slug 不變）；②`species` 欄位從「寵物」改真物種（犬/貓/貓頭鷹/馬——大型犬/小型犬同物種不同品種，不自行合併）；③移除 `product`（散文佔位「無（純陪伴寵物，無副產品）」）／`product_jp`／`product_value`（`"-"` 佔位）三欄，寵物 collection 不設產物欄。code 端接續見 U26（同一輪完成，兩者緊密耦合——搬移後若不立刻接上 collection 註冊，全站會斷 12 則既有 wikilink，不留中間破損態）。驗證：`build:content` 確認 animals.json 7 筆／pets.json 5 筆，wikilink 警告數與搬移前持平（U26 code 端接上後）。
- [x] C22 fishes condition 佔位清空＋minerals name_jp 查證（2026-07-20 完成，走 vault skill 流程）：①逐篇核對 32 篇 `condition: "-"` 的內文，確認皆無任何「奇蹟釣竿／夜晚／颱風／暴風雪」等特殊條件描述殘留，是純佔位字面值，移除欄位（前端缺值不渲染）；「依地點而異，見地點說明」1 篇維持不動。②minerals 金/銀/銅 3 篇：WebSearch 找到遊戲專屬日文攻略 Wiki（[鉱石 - 牧場物語 ふたごの村 攻略 Wiki*](https://wikiwiki.jp/futago/%E9%89%B1%E7%9F%B3)），WebFetch 兩輪核對品名表，確認遊戲內品名就是單字「金」「銀」「銅」（無「鉱石」字尾，與「依系列慣例猜的」原值不同——金屬類原礦在本作直接沿用常用漢字，不像寶石類走片假名譯名），且 Wiki 賣價表與站內既有星度賣價表數值逐一吻合，交叉確認來源正確；順帶查到敲礦山石的掉落機率（金 1%／銀 3%／銅 30%），補進內文並列為第二來源。三篇的「尚待確認」查證 blockquote 隨查證完成移除，外洩問題解決。驗證：build 產物 fishes 32 篇無殘留「-」condition；minerals 3 篇無查證註記、標題不再出現冗餘「（金鉱石）」；build 警告 198→201（+3，minerals 三篇因新增雙來源、其中一則帶查證補述文字，觸發 U25 安全閥保留原段＋記警告，屬預期，非缺陷）；lint／test（204）／build 皆綠；Playwright 核對金條目標題乾淨無重複、雙來源段落完整保留，柳葉魚條目無「條件：-」列。
- [x] C23 festivals `location: 原文未提供` 佔位值 3 篇（2026-07-21 完成，沿用 C15 已抓取的來源全文核對，結論與初步推測一致）：春/冬之感謝祭逐字核對確認是「在戀愛對象們上門贈禮的時間，可以收到禮物，進入自宅即可觸發」——與南瓜祭同一種「自宅觸發」機制、無特定時段窗口，寫法沿用南瓜祭既有慣例填 `location: 進入自宅後`。花之日核對確認來源全文從未描述單一「舉辦地點」（送花對象是全村任何村民，整天皆可，無集合地點這個概念）——`location` 欄位本身在這篇沒有意義，`validate.js` 的 festivals 必填欄位表本就不含 `location`，直接移除欄位（非漏填，不留任何字面值）。驗證：build 警告維持 201（location 非必填欄位，增減不影響驗證規則）；lint／test（204）／build 皆綠；Playwright 核對花之日無「地點」列、春之感謝祭正確顯示「地點：進入自宅後」。
- [x] C24 guide 內殘留「條目化狀態」「資料矛盾說明」等編輯 meta 段清除（2026-07-22 使用者回報「攻略裡不應該出現這種字眼」完成，修正 U4 對 guides 的過寬豁免）：U4（2026-07-xx）當時裁決 `stripEditorialNotes` 只剝除非 guide collection 的查證註記，guides 因「保留文章沿革記錄」全數豁免；但豁免範圍太寬，放過了一批**談的是本站自己的建置流程**（collection 路徑如 `cooking/recipes/`、frontmatter 欄位如 `category`/`season`/`time`/`size_range`、內部任務代號如「C2 完成」「C4（2026-07-12）」）而非遊戲本身或原始來源資訊的段落——這類文字對玩家毫無意義，是內容產出過程遺留的工程備忘，不是攻略的一部分。逐篇核對後刪除 13 處：①「條目化狀態」blockquote／區塊 12 處（cooking 5 篇、life 2 篇、livestock 1 篇、basics 1 篇、farming 1 篇皆為單行 blockquote 直接刪除；fishing〈釣魚系統與地點總覽〉1 處是完整 `##` 區塊含 3 段內部決策過程敘事，一併整段刪除——其中提到的鰻魚跨地點賣價差異、蟹種辨識結果等玩家可能關心的事實，已分別存在於同篇〈各地點的魚類、物品完整資料表〉一節與 [[短種螃蟹]]／[[鰻魚]] 條目本身，刪除不流失資訊）；②「資料矛盾說明」2 處——bugs〈捕蟲基礎與地區代碼〉的 `##` 區塊純粹重複 5 種昆蟲條目各自「特殊條件」欄已有的「來源矛盾」註記（逐篇核對黃紋粉蝶/紫蝶/蟈蟈/巨雨濱蛙/老爺樹蛙 5 篇確認皆已有對應說明），整段刪除零資訊流失；livestock〈動物飼養管理攻略〉的冠軍牛 blockquote 說明「優勝したヒツジ」是原文誤植，內容與上方表格已有的「，原文如此」inline 註記重複，且行文本身即是站方編輯口吻（「本頁保留原文並加註提醒」），一併刪除、保留表格 inline 註記已足夠提示讀者。純內容編輯，不涉及外部來源查證（刪除的是本站自己寫的建置備忘，非遊戲事實），故不需走 vault 流程。驗證：`grep -r "條目化狀態\|資料矛盾說明" content/` 清空；build 警告維持 153（純 guide 內文刪除不影響 frontmatter 驗證規則）；lint／test（216）／build 皆綠；`guides.json` 逐篇核對 html 已無殘留字串。

- [x] C25 cooking guide「N 道已收錄於條目」複讀句清除，5 篇食譜 guide 一併重審完成（2026-07-22 使用者回報「這樣的攻略放在攻略書裡沒有意義」，原先只打算修拼盤/其他 2 篇，使用者看過草稿後追加關鍵修正：**連合併成單句的「N 道已收錄於…可篩選查看」本身也沒有資訊意義，不是合併就好，是整句要刪**——因此擴大範圍把 5 篇食譜 guide 一次重審，避免只改 2 篇留下風格不一致）：逐篇核對後，實際刪除量比原草稿判斷得更保守精準——
  - `主食類食譜.md`：唯一一句複讀句（含廚具子計數）直接整句刪除，無其他改動。
  - `甜點類食譜.md`：唯一一句複讀句（`## 甜點類食譜` 整個標題+句子）整段刪除。
  - `拼盤類料理總覽.md`：3 個 `##` 子分類標題與複讀句全刪，只留「油炸豆腐→條目名『油豆腐』撞名」這句解讀輔助（審查原則保留類第 4 項），不再另立標題、併入前段。
  - `其他類食譜.md`：8 個 `##` 子分類標題與計數句全刪（含原判斷會留的計數括號——使用者確認計數本身也無意義，不併不留），改立一個「## 特殊食譜備註」小節，只留 4 則真正的機制/取得管道說明（審查原則保留類第 1 項，比原草稿多抓到 1 則——**咖啡與熱飲**「牛奶咖啡/卡布奇諾需先製作熱咖啡再加入牛奶」原本漏記，重讀原文才發現）：英式茶（罐裝茶葉購買管道＋王家奶茶/俄羅斯茶二階段食譜）、咖啡與熱飲（二階段食譜）、果汁類（調味料台專用＋混合果奶二階段食譜）、酒類（製造機事先製作或特定管道取得）；其餘 4 個子分類（主食類/果醬類/中式茶/奶昔類）無額外資訊，標題與計數句一併消失、不留痕跡。
  - `沙拉類與湯類食譜.md`：「## 沙拉類食譜」「## 湯類食譜」2 個標題與計數句刪除；湯類藏著 2 則真資訊改寫成獨立句保留（「湯類廚具：全部使用鍋子」「泰式酸辣湯缺賣價：5★ 賣價未收錄於原文來源，條目照缺不填」）；「### 基礎食材製法」句尾「其廚具與材料已收錄於各自 recipes 條目」複讀子句砍掉，保留前半「米飯/粥/麵包/吐司常作為其他食譜材料的基礎食材」真資訊。
  - **範圍外發現，記錄不處理**：`grep` 全站發現同一種「已收錄於各自…條目」複讀句還出現在 `farming/guide/花卉種植與加工.md`、`fishing/guide/釣魚系統與地點總覽.md`、`bugs/guide/捕蟲基礎與地區代碼.md`、`mining/guide/雙子村礦山攻略.md`、`life/guide/` 7 篇任務類 guide、`life/guide/四季節日總覽.md`——這次只處理使用者指名的 cooking 5 篇食譜 guide，其餘系統的同類問題留待日後另開任務逐篇核對（不同 guide 的「複讀句底下是否藏著真資訊」需要逐篇讀過才能判斷，不能照抄這次的結論批次處理）。
  - 驗證：`grep -rn "已收錄於各自 recipes 條目" content/cooking/guide/` 清空；lint／test（216）／build 皆綠，警告維持 153；`guides.json` 逐篇核對 html 輸出，5 篇皆讀起來是完整段落，不再是「一堆只有一句話的標題」。
- [x] C26 cooking 5 篇之外，同一種「已收錄於各自…條目」複讀句在其他系統 guide 的清查（2026-07-22 完成，使用者解除「禁止直接執行」限制後逐篇判斷處理）：12 處逐一讀過上下文才動手，結論跟原始猜測不完全一樣——
  - `farming/guide/花卉種植與加工.md`：「## 花卉種子」整節（標題＋單句）純複讀，整節刪除；花束／香水加工兩節各自保留前半機制說明（3 朵才能加工、費用多少、此花村主人公費用不同、香水可商店購買或自製），只砍尾端「已收錄於各自條目」子句。
  - `fishing/guide/釣魚系統與地點總覽.md`：「其他物品」段保留真事實（跳河獲得硬幣/魚骨頭、耀珠不可出貨丟棄）＋耀珠完整資料指向 [[6色耀珠收集與願望系統攻略]] 這個真正的跨guide索引，砍掉「7項非耀珠物品已收錄於...條目」複讀句與「比本文原始摘要更準確，已依各地點魚類表核對修正過」的站方編輯口吻（同 C24 類）；「## 各地點的魚類、物品完整資料表」整節（引用內部任務代號「C4（2026-07-12）」＋談自己 schema 欄位）整節刪除，屬 C24 同類問題；順帶修掉此節刪除後在「## 關於魚王」段留下的斷頭引用「（見下方各地點資料表）」，改「詳見上表」指回本來就在上方的魚王表格。
  - `bugs/guide/捕蟲基礎與地區代碼.md`：「## 完整昆蟲列表」整節刪除——其計數（蝴蝶15/蝗蟲14/…）本來就跟上面「## 七大分類總覽」表格的數字重複兩次，複讀程度比原本設想更嚴重。
  - `mining/guide/雙子村礦山攻略.md`：**不動**——核對後確認這句是逐一列出 19 個礦物 wikilink 的真索引（不是空泛「已收錄，可篩選」），且 U20 就裁決要保留這份連結清單，維持現狀。
  - `life/guide/四季節日總覽.md`：只刪「各節日的舉辦日期與村莊已收錄於各自條目」這個子句，保留「這篇聚焦共通機制與評價規則」的文章範圍說明（解釋為什麼這篇不列日期，屬正當的篇章定位，不是複讀）。
  - `life/guide/` 7 篇任務類 guide：6 篇（此花村村長家種子屋奇利克任務／此花村醫院迪魯卡熊貓大叔任務／藍鈴村任務系統／此花村果樹園食堂雜貨店任務／藍鈴村村民任務／藍鈴村雜貨店木匠神父任務）的「見上方連結」句直接刪除——角色 wikilink 已經在同一篇稍早的「本文涵蓋N位委託角色：[[...]]」句給過一次，這句純粹是對剛講過的話再講一次；**米海爾女神大人艾瑞拉賢者任務不動**——這篇沒有「本文涵蓋」式的前導連結句（角色名只在粗體條列出現、未帶 wikilink），這句是全篇唯一的角色連結出處，不是複讀。
  - 驗證：`grep -rn "已收錄於各自" content/*/guide/*.md` 只剩 mining 與米海爾任務兩篇既定保留的例外；lint／test（217）／build 皆綠，警告維持 55（純 guide 內文編輯不影響驗證規則）；`guides.json` 逐篇核對 html 無殘留複讀句、無斷頭引用。

### 2026-07-22 使用者回饋（列表頁框線精簡）

- [x] U36 [UX] 列表頁（CollectionPage）框線精簡——邊框改底色分層（2026-07-22 完成）：使用者原始抱怨是 `/c/crops` 這類列表頁「框中框」——外層篩選面板虛線框、裡面篩選 chips 各自描邊、下面條目卡又各自整圈村色實邊框，疊起來不優雅。分析 3 張參考圖（筆記軟體側欄／FAQ 手風琴／todo 卡片列表）得出共通原理：這些介面把「邊框」保留給互動當下的強調（如 FAQ 展開項的焦點框），常態的分組/選中/歸屬一律靠**底色深淺分層**（page bg → card bg → selected bg）與文字色，不畫框把每個單位圈起來。逐項執行：
  1. **搜尋框 bug 修正**：`CollectionPage.jsx` 改用 `Home.jsx` 同款底線風格（`<label>` 包 `border-b-2 border-dashed border-ink/45 focus-within:border-solid` ＋ `Icon id="search"`），拿掉整圈圓角實邊框。
  2. **FilterBar 外層拿掉大框**：最外層 `<div>` 拿掉 `border-ink/20 bg-cream rounded-2xl border-2 border-dashed p-3`，改純 `flex flex-col gap-3` 間距排列。
  3. **篩選 chips 改實心填色、拿掉描邊**：`ChipGroup` 按鈕未選 `bg-ink/8 hover:bg-ink/15`、已選維持 `bg-ink text-parchment`，皆拿掉 `border`。範圍限定「篩選 chip」，`ItemChips`（角色頁禮物清單）不動——DESIGN.md 已補一句區分兩者語意不同。
  4. **「篩選 N ▼」開關鈕同套處理**：`CollectionPage.jsx` 篩選開關按鈕比照第 3 點改實色去邊框。
  5. **EntryCard／SingleColumnCard 村色從整圈邊框改淡底色**：兩元件皆改 `bg-(--village)/8`、拿掉 `border-(--village) border-2`；卡名文字維持 `text-(--village)` 深色字。**Tailwind 語法已核對**：build 產物 CSS 確認 `.bg-\(--village\)\/8` 正確編譯出 `@supports (color:color-mix(...))` 漸進增強規則（同站內其餘 opacity modifier 慣例），非死語法。
  6. **DESIGN.md 同步更新**：「搜尋框」段補一句 CollectionPage/Home 共用同規格；「Chips」段新增「篩選 chip vs ItemChips」語意區分＋篩選面板拿掉外框的說明；「列表卡（EntryCard）」段落改寫為淡底色分層，移除舊「村色 2px 邊框」描述。
  - **使用者手動核對後追加修正（2026-07-22，因本次無瀏覽器工具、使用者自行跑 `npm run dev` 截圖多輪發現，共 4 項）**：①`CollectionEntryList.jsx` 的 `CharacterCard`（characters 專屬格狀卡）原本刻意不在第 5 點範圍內，使用者截圖看到角色卡仍是整圈村色邊框，判定要一併統一，改成同款 `bg-(--village)/8`、拿掉 `border-(--village) border-2`。②篩選開關鈕「篩選 ▲/▼」文字歪斜——裸文字三角形符號（U+25B2/25B3）跟 CJK 文字混排基線對不齊，非本次改動引入的新 bug，但趁這次一併修正：`icons.jsx` 新增 `chevron` 圖示（SVG，24×24 viewBox，同站內圖示規格），`CollectionPage.jsx` 改用 `<Icon id="chevron">` 搭配 `rotate-180` class 表達開/關兩態，取代裸文字符號。**範圍外發現，未動**：`ItemChips.jsx`（角色頁禮物清單展開鈕）用同一種裸文字 `▲/▼`，可能有同樣的基線問題，這次沒有截圖佐證、不在使用者所見範圍內，故不比照處理，留待日後需要時再確認。③**真正的回歸 bug**：`fishes`/`recipes`/`insects`/`minerals`/`items` 這 5 個 collection 的 frontmatter 本來就沒有 `village` 欄位，`entry.village` 為 `undefined`、React 不渲染 `data-village` 屬性本身，CSS `[data-village]` 選擇器選不到——`index.css` 註解原本就寫著「未標村者落在中性土色」，但這條保底規則從未真的生效過（邊框版本失效時退回 `currentColor` 意外還看得出一圈邊框蓋住了這個缺口，改底色後失效直接變 `transparent`，使用者截圖 `/c/fishes`／`/c/recipes` 才第一次看出卡片完全無分隔）。修法：`index.css` 把保底值從 `[data-village]` 選擇器改掛到 `:root`，靠 CSS 繼承讓沒有 `data-village` 屬性的卡片也拿得到土色；build 產物確認 `:root,[data-village]{--village:var(--color-soil)}` 正確合併。④**篩選 chip 群組 label 與 chip 垂直沒對齊**：`ChipGroup`（如「季節」label＋春/夏/秋/冬 chips 那排）在桌機寬度（`md:min-h-0` 生效、不再靠 `min-h-11` 強制等高）下，label `<p>` 沒有上下 padding、chip `<button>` 有 `py-1`，兩者實際框高不同，容器又用 `items-start` 頂對齊，導致 chip 文字比 label 文字明顯偏低、視覺上歪斜；修法：label 補上同款 `py-1`，讓兩者框高一致，`items-start` 頂對齊時文字基線自然對齊（維持 `items-start` 是為了 chip 換行成兩排時 label 仍固定在第一排，不是判斷失誤，只補齊 padding）。
  - **第二輪使用者截圖複核（2026-07-22）**：④篩選 chip 對齊確認修好；再抓到 2 個新問題——⑤**村色淡底色跟篩選 chip 未選底色撞色**：`bg-(--village)/8` 與 `ChipGroup` 未選狀態的 `bg-ink/8` 都是 8% 透明度的棕色調，尤其「雙村共通」用的 soil 色跟 ink 色本身就相近，兩者疊在 cream 底上幾乎分不出「這是有上色的卡片」還是「這是一般篩選 chip」；修法：`EntryCard.jsx`（2 處）／`CollectionEntryList.jsx` 的 `CharacterCard`（1 处）三處淡底色從 `/8` 提高到 `/16`，篩選 chip 的 `bg-ink/8` 維持不動，讓卡片讀起來明顯「有主題色」。⑥**同一排卡片之間欄位錯開**：`animals` 列表卡「購入價」欄是帶條件括號說明的長字串（如「1500 / 3000（小牛／成牛，成牛為此花村限定販售）」），換行成 2 行時把同張卡片裡排在它後面的「產物」欄往下推，導致同一排相鄰卡片（如牛卡 2 行、羊卡 1 行）的「產物」欄橫向對不齊；修法：`collectionConfigs.js` 的 `animals.columns` 把 `buy_price` 移到最後一欄（`species`／`village`／`product`／`buy_price`），換行只會影響卡片自己的底部高度，不會拖累同張卡片內排在它後面的欄位。**範圍限定**：只確認並修了 `animals`，其餘 collection 的欄位若也有類似長字串且未排最後，這次沒有逐一核對，之後如果又看到同款「同排卡片欄位錯開」再個別處理，不要照搬這次結論批次改。
  - **第三輪使用者截圖複核（2026-07-22）**：⑤淡底色調到 /16 後使用者回饋「顏色變得過重，而且沒有和篩選有明顯區別」，⑥「牛和羊卡片不一樣高，還是沒解決問題」。逐一釐清：
    - ⑥的真正原因：CSS Grid 預設 `align-items: stretch` 讓 `<li>` 格子本身已經跟同排最高的格子等高，但格子內的 `<a>`（實際上色的卡片本體）是 `display:block` 自然高度，沒有 `h-full`，所以「羊」卡片的色塊只到自己內容的高度，看起來比「牛」矮一截、底部對不齊。修法：`EntryCard.jsx` 兩個元件的 `<li>` 補 `className="h-full"`、`<a>` 補 `h-full`，讓色塊撐滿格子高度（`CharacterCard` 本來就有這個寫法，這次只是補齊 `EntryCard`／`SingleColumnCard`）。
    - ⑤的真正原因：soil（雙村共通用）跟 ink（篩選 chip 用）本質上是同一色系的深淺兩階，數學上不管疊多少 % 透明度、算出來的最終顏色都會收斂到很接近的淺褐色，調透明度治標不治本。跟使用者確認方向後（先給了「卡片不上色」與「篩選換色系」兩個選項，使用者選「調色盤開一個新顏色」），做了一個色卡比對 artifact 讓使用者挑，選定 **plum（`#8d6b7a`）**：`index.css` 新增 `--color-plum` token（`@theme`）＋更新註解；`:root`／`[data-village]` 保底規則從 `var(--color-soil)` 改成 `var(--color-plum)`（只影響「無特定村莊」卡片的底色語意，`--color-soil` token 本身不動、紙膠帶等其他用途不受影響）。`DESIGN.md` 色盤表新增 plum 一列＋一句用途限定說明（只用在無村莊卡片底色，不作強調色）。
    - **透明度數值反覆**：淡底色先後試過 `/8`（太淡看不出來）→`/16`（撞色，跟 plum 換色一起處理）→`/25`（plum 選定後使用者指定，但藍鈴村/此花村沿用同數值未經確認，回饋「都太重了」）→`/16`（回饋仍「太重」）→**最終 `/10`**（`EntryCard.jsx` 2 處／`CollectionEntryList.jsx` 的 `CharacterCard` 1 處，`DESIGN.md`「列表卡」段落同步）。plum／bluebell／konohana 三色共用同一個 `bg-(--village)/N` class，Tailwind 透明度綁在 class 名稱上、無法對不同村色分別設定數值，每輪「都太重」的回饋涵蓋全部三色，統一調整。
  - 驗證：每輪修正後都重跑 lint／test（216）／build 皆綠；build 產物確認 `:root,[data-village]{--village:var(--color-plum)}` 與 `.bg-(--village)/10{...color-mix(in oklab, var(--village) 10%, transparent)}` 皆正確編譯。**仍待使用者截圖複核**：`/c/animals`（牛/羊卡片高度是否已經一致、plum 底色跟篩選 chip 是否明顯不同）與任一藍鈴村/此花村卡片（`/10` 這次是否三色都剛好）。

### 2026-07-22 使用者回饋（點擊範圍／來源格式，僅記錄未執行）

- [x] U37 [UX] 「依地點查詢」結果列表與「攻略總覽」guide 列表，連結可點擊範圍過小（2026-07-22 完成）：`<li>` 本身有 `border-ink/40 border-b-[1.5px] border-dotted` 撐出一整排的視覺範圍，但 `<a>` 只包住標題文字，點文字以外的整排空白沒有反應。比照站內已有的正確寫法（`Home.jsx` 首頁搜尋結果列表——`<a>` 本身 `flex px-2 py-2.5 -mx-2` 撐滿整排，用負 margin 抵消讓點擊區域延伸到跟 `<li>` 視覺寬度一致）：
  - `LocationLookupPage.jsx`：把季節/賣價那行從 `<a>` 外面移進去，`<a>` 改 `hover:bg-parchment -mx-2 flex flex-col rounded-lg px-2 py-2`，`<li>` 拿掉原本自己扛的 `py-2`（改由 `<a>` 承擔），魚名維持 `underline decoration-dotted` 視覺上仍是「這是連結」的提示，但點擊區域擴大到含季節/賣價那行的整排。
  - `GuidesIndexPage.jsx`：`<a>` 改 `hover:bg-parchment -mx-2 flex rounded-lg px-2 py-2.5`（原本只是裸文字加 `hover:underline`），`<li>` 同樣拿掉自己的 `py-2`。
  - 驗證：lint／test（216）／build 皆綠（純互動範圍調整，不影響資料/測試）。
- [x] C27 「## 來源」多筆來源格式不一致，98 篇條目落在 U25 安全閥、沒套用清爽的頁尾出處列（2026-07-22 完成，使用者選「擴充資料結構」方向）：根本原因是 U25（2026-07-20）的 `extractStandardSources` 要求每個來源 bullet「整行」都符合嚴格格式，只要帶額外說明文字（如「（購買價、妊娠費用、羊出售解鎖條件）」）就整段判定不符標準、保留原始 `## 來源` markdown 區塊、只記警告。修法：
  - `scripts/entryTransforms.js` 的 `STANDARD_SOURCE_BULLET` 正則新增選填的尾端 `（...）` note group（`(?:（([^）]*)）)?`），`extractStandardSources` 解析出 `note` 一併塞進 source 物件；新寫法是舊寫法的超集合（沒有 note 的行為完全不變），不影響原本就能解析的條目。
  - `EntryPage.jsx` 頁尾出處列渲染同步補上 `source.note`，跟 `retrieved` 合併進同一個括號（有兩者用「，」相接，如「（擷取於 2026-07-01，購買價、妊娠費用）」）。
  - 測試：`entryTransforms.test.js` 原本斷言「帶額外文字回傳 null」的測試改寫為「note 被正確解析」，另補一則「真正壞掉（無合法 markdown 連結語法）才回傳 null」確認安全閥沒被廢掉，只是判定範圍縮小。
  - **範圍外發現、未動**：`extractSources`（characters 專用的較寬鬆版本，`build-content.js` 只用在 characters）目前若 bullet 帶尾端文字，會直接靜默丟棄、連警告都沒有——比這次修的問題更隱蔽，但沒在使用者回報範圍內，這次不動，需要的話另開任務。
  - 驗證：`grep -rn "格式不符標準 bullet" manifest.json` 相關警告從 98 筆降到 **0 筆**；`npm test`（217）／lint／build 皆綠；JSON 產物核對 `animals.json` 的「羊」條目 3 筆 sources 皆帶正確 note、html 內文已無殘留「## 來源」標題。
- [x] C28 家畜條目「副產品升級點心門檻」表格下方殘留推導方法論 blockquote（2026-07-22 完成）：與 C24 同一類問題——這句話講的是**本站怎麼推算出表格數字**（引用「來源明文」「公式」「推得」這些站方查證用語），不是遊戲本身的資訊。刪除範圍：
  - `livestock/animals/牛.md`／`羊.md`／`茶牛.md`／`黑羊.md`／`黑雞.md`：一字不差的同一句 blockquote 整句刪除。
  - `livestock/animals/雞.md`：同句但多帶來源附例（「雞升到 5 個副產品需茶點 2 × (5 − 1) = 8 個」），一併整句刪除。
  - `livestock/animals/羊駝.md`：句子結構不同（沒有 blockquote，是表格前一句夾雜真資訊與方法論），拆開處理——保留真正的遊戲事實「**羊駝沒有茶點選項**（只吃野菜、穀物、魚味茶點）」，砍掉後半方法論部分（「且門檻不適用其他家畜的公式——下表全為來源明文實表，穀物與魚味每級只遞增 5」），該公式本身邏輯已經體現在下面的表格數字裡，不需要文字重複解釋。
  - 決策：拿掉後不在任何地方保留「目標2是來源明文、3-5是推算」這件事——公式推導只是本站建置時的驗證過程，不是玩家需要的資訊，純刪除不留痕跡。
  - 驗證：`grep -rn "來源明文" content/livestock/animals/` 清空；build 警告維持 153（此類 blockquote 不影響任何驗證規則）；lint／test（216）／build 皆綠。

### 2026-07-22 使用者回饋（首頁資料分布／全站條目連結）

- [x] U38 首頁資料分布討論＋孤兒條目全站連結補齊＋首頁緞帶列調整（2026-07-22 完成，多輪討論後執行）：
  1. **研究：列表頁排序規律**——查證後確認目前**沒有任何排序邏輯**，`build-content.js` 的 `readMarkdownDir` 用 `.sort()` 排檔名，中文字等於 Unicode 編碼順序，不是拼音/筆畫/任何遊戲邏輯；前端 `collectionQuery.js` 只有 `applyFilters`，從未呼叫任何排序函式。舊規格書（T1.12/T6.3）規劃過的「依賣價排序」從未真正做出來（U28 已查證過一次，這次二次確認）。**未執行修正，純研究記錄**，若要做真正的排序功能需另立任務。
  2. **研究：items 孤兒條目**——158 筆 items 裡，一開始查出 60 筆完全沒被任何條目/guide 引用過（無 loves/likes/ingredientsLinks、無 guide wikilink），首頁又完全沒有 `/c/items` 入口，等於這 60 筆是死路。
  3. **3-tab 提案評估（討論後裁決不執行）**：使用者提議把攻略總覽從首頁緞帶列升級成跟「查詢／存檔」平行的第三個頂層 tab。裁決不採用——「查詢／存檔」是網站立項時定案的核心概念（README「白天查詢工具、晚上玩家存檔」），代表兩種遊玩情境，不是內容分類；攻略文章本質上跟結構化資料一樣是「查詢」底下的一種內容形式（敘事長文 vs 結構化欄位），不是獨立情境，硬升第三個 tab 會稀釋掉這個核心二分概念。寵物排序的誤導改用下面第 5 點的緞帶列重排解決，不需要動頂層 tab。
  4. **全站條目名稱純文字提及自動補 wikilink**（範圍依使用者裁決從「60 筆孤兒 items」擴大到「全站所有條目」；連結次數依使用者裁決採「每篇只連第一次出現」）：寫 script（`/private/tmp/.../scratchpad/auto-link.js`，未進 repo）掃描全站 709 個條目名稱（`characters`/`crops`/`animals`/`pets`/`recipes`/`fishes`/`insects`/`minerals`/`festivals`/`villages`/`items`），排除長度 <2 的 11 個單字名稱（牛/羊/雞/貓/馬/粥/金/銀/銅/油/米，避免大量誤判子字串）、排除全站撞名（查證 0 撞名）、由長至短逐一找每篇第一次未被 `[[ ]]`／既有 markdown 連結／code span 包住的純文字出現處插入 wikilink。**過程中修正一個真實 bug**：條目自己名字包含另一個較短條目名字時（如「巨鍬形蟲」含「鍬形蟲」、「大種泥鰍」含「泥鰍」），原本會誤連自己介紹自己的那句話——修法是動手前先把「自己名字」在全文出現的所有位置佔位擋住，短名字才不會鑽進去；套用後從 3708 處降到 3547 處（600→545 個檔案），抽樣覆核 12 個檔案確認品質（商店價目表、任務謝禮表、材料分類表逐項連結皆合理；僅 1 處「壽司卷、飯糰類料理」這種籠統分類敘述算是語意上偏鬆散，非硬傷，未特別處理）。驗證：`npm run lint`／`npm test`（217）／`npm run build` 皆綠，警告數維持 55（無新增查無/撞名，確認 3547 處全數解析成功）；孤兒 items 由 60 降到 13（剩下這 13 筆是全站零提及，不是「有提到沒連」，屬於下面第 5 點要另外補入口解決的部分）。
  5. **首頁 items 入口補齊＋緞帶列重排**：`Home.jsx` 加 `items` 進 `COLLECTIONS`／`COLLECTION_LABELS`／`COLLECTION_ICONS`（新圖示 `box`，`icons.jsx` 木箱線條圖）；`siteSearch.js` 的 `SEARCH_FIELDS` 補 `items: ['name','name_jp']`（原本全站搜尋也搜不到 items，是同一個「沒入口」問題的另一面）。緞帶列從「行事曆(手機)→攻略→寵物」重排成「行事曆(手機)→寵物→物品→攻略」——把跟九宮格同性質的「結構化查詢入口」（寵物、物品）排在一起、緊接行事曆之後，性質不同的「文章目錄」（攻略）排最後跟前面明顯分開，解決「寵物排在攻略下面像是從屬關係」的誤讀（不涉及使用者原本問的第 2 點 3-tab 提案，純粹緞帶列內部重排）。`DESIGN.md`〈緞帶列〉段補排序原則說明。
  - 驗證：lint／test（217）／build 皆綠。
  6. **緞帶列改貼紙卡（2026-07-22 使用者追加指示：「把最後的幾項也改成卡片，不滿版就左右置中」）**：第 5 點才剛把寵物/物品/攻略排成緞帶列，使用者接著要求連緞帶列本身也不要、統一改成跟九宮格一樣的貼紙卡。改法：`Home.jsx` 貼紙牆容器從 `grid grid-cols-3 md:grid-cols-5` 改成 `flex flex-wrap justify-center`，每張貼紙固定寬度用 `basis-[calc(33.333%-0.5rem)] md:basis-[calc(20%-0.8rem)]`（扣掉 gap 換算成 3 欄／5 欄等寬，`shrink-0 grow-0` 避免最後一列被拉伸）；寵物/物品/攻略三個原本的緞帶列 `<a>` 改寫成跟九宮格同款的貼紙卡（stamp 圖示＋手寫標籤＋筆數），併入同一個 flex-wrap 容器。行事曆維持原樣不動（桌機卡片＋手機緞帶列，使用者沒要求改）。效果：手機版 9+3=12 張卡剛好整除 3 欄無需置中；桌機版 9+1(行事曆)+3=13 張卡，5 欄排完 2 列後剩 3 張自動置中，不再貼齊左邊留白。`DESIGN.md`〈貼紙卡〉段補 flex-wrap 改法說明；〈緞帶列〉段改寫為「縮編為只剩行事曆手機版單一用途」，原本的排序原則說明作廢（不再有多條緞帶列需要排序）。
  - 驗證：lint／test（217）／build 皆綠；build 產物 CSS 核對 `calc(33.333% - .5rem)`／`calc(20% - .8rem)` 正確編譯成 `flex-basis`。**未做的驗證**：本次無瀏覽器工具，置中效果與貼紙卡視覺（尤其桌機版最後一列 3 張置中）未經目視核對，麻煩使用者截圖複核 `/`（首頁）手機與桌機兩種寬度。
  - 已 commit：`aebd2f5`（全站自動連結，545 檔）、`64e0e4e`（items 入口＋緞帶列重排）；第 6 點（緞帶列改貼紙卡）待下一次 commit。

### 2026-07-22 使用者回饋（微互動動效，DESIGN.md〈微互動〉章節已定案，僅記錄未執行）

三種動效技法參考 Amicro（React 微互動模式庫，vault 筆記《Amicro——React 微互動設計模式參考》），
套件本身不採用，只借技法詞彙；「收藏變色」因無對應可點擊 toggle 元件，本輪不收。
技術選型純 CSS transition/keyframe，不裝動畫函式庫。詳細規格（token／逐元件行為）見
[DESIGN.md](../DESIGN.md)〈微互動〉章節。

- [x] U39 [UX] 動效 token 定義 + 蓋章漣漪（stamp-ripple）套用到主要動作按鈕（2026-07-22 完成）：
  `index.css` `@theme` 補 `--ease-tap`／`--duration-fast`／`--duration-tap`／`--duration-bounce`／
  `--duration-ripple` 5 個 token（Tailwind v4 會依 `--duration-*`/`--ease-*` 命名空間自動產生對應
  utility，U40/U41 可直接用 `duration-fast`/`ease-tap` 等 class，不用重新定義）；新增 `.btn-stamp`
  component class：`:active` 立即下壓 `scale(0.96)` ＋ `::after` 環立即顯形（`transition: none`），
  放開時（`:active` 移除、回到預設值）觸發 `--duration-bounce`／`--ease-tap` 的按鈕回彈與
  `--duration-ripple`（400ms）的環一次性外擴淡出——用「預設狀態才掛 transition」達成「press 瞬間
  無動畫、release 才播放」，不需要 JS 監聽 click 事件。套用到 `ExportImportSection` 三顆按鈕
  （下載存檔／選擇檔案匯入／還原匯入前備份）、`AnimalTracker`（點心＋、確認新增）、
  `PlantingTracker`（收成）。**範圍調整**：原規劃含「PlantingTracker 新增作物確認」，但實際
  UI 是搜尋清單直接點選即新增（`handlePick`），沒有獨立的確認按鈕可套，故此項未套用，不強行
  湊一個確認步驟。刪除動物的「確認刪除」按鈕（`DeleteAnimalDialog`）不在原規劃列表內，維持不動。
  驗證：`npm run lint`／`npm run build` 皆綠；build 產物 CSS 核對 `.btn-stamp`／`:active`／
  `::after`／`prefers-reduced-motion` 規則皆正確編譯。**未做的驗證**：本次無瀏覽器工具，
  press/release 視覺回饋與 `prefers-reduced-motion` 降級效果未經目視核對，麻煩使用者實機操作
  存讀檔／點心＋／收成按鈕複核手感。
- [x] U40 [UX] 戳一下回彈（poke-tilt）套用到首頁貼紙卡（`.sticker`）與列表卡（`EntryCard`／
  `SingleColumnCard`／`CharacterCard`）（2026-07-22 完成）：`index.css` 把貼紙牆既定旋轉檔位
  從直接 `rotate: -1.4deg` 改存進 `--tilt` 自訂屬性（`rotate: var(--tilt)`，數值不變，只是
  多暴露一個可疊加的基準值）；新增 `.poke-tilt` class：hover 時 `rotate: calc(var(--tilt, 0deg)
  + 1deg)`（貼紙卡在既定檔位上疊加、列表卡無既定檔位則從 0deg 疊加）；press/tap 用 `:active`
  （天然涵蓋觸控）`scale(0.98)`。**陰影加深範圍收斂**：只給 `.sticker.poke-tilt:hover` 疊
  `box-shadow: 2.5px 2.5px 0 ink16%`（比原本 `2px 2px 0` 深 0.5px）——列表卡（EntryCard 等）
  本來就沒有基礎陰影（U36 已改底色分層，不靠陰影表達層級），沒有陰影可加深，強行加等於
  違反 U36 的既定方向，故列表卡只套 rotate＋press、不套陰影。套用範圍：Home.jsx 5 個貼紙卡
  （九宮格入口、行事曆、寵物/物品/攻略）、`EntryCard`／`SingleColumnCard`／`CharacterCard`
  的 `<a>`。**範圍外未動**：`Layout.jsx` 站名 `.sticker`（回首頁連結）與 `AnimalTracker.jsx`
  的 `<li className="sticker">`（動物列，非連結/按鈕，不是「卡片可點」情境）不在 U40 原始
  範圍內，維持不動。驗證：`npm run lint`／`npm run build` 皆綠；build 產物 CSS 核對
  `--tilt`／`.poke-tilt:hover`／`.sticker.poke-tilt:hover`／`prefers-reduced-motion` 規則
  皆正確編譯。**未做的驗證**：本次無瀏覽器工具，hover 旋轉手感與觸控 `:active` 實機回饋
  未經目視核核，麻煩使用者截圖或實機複核首頁貼紙牆與任一列表頁（如 `/c/crops`）。
- [x] U41 [UX] 箭頭滑出（arrow-slide）套用到行事曆緞帶列、`GuidesIndexPage` 條目列表、
  首頁搜尋結果列（2026-07-22 完成）：`index.css` 新增 `.arrow-slide`（`display: inline-block`
  ＋`transform` transition）＋ `a:hover .arrow-slide { transform: translateX(3px) }`，
  不用 Tailwind `group` 語法，靠父層 `a:hover` 觸發子層箭頭位移（全站尚未用過 `group`/
  `group-hover`，維持跟既有 CSS component class 一致的寫法）。行事曆緞帶列本來就有箭頭
  span，只補 class；`GuidesIndexPage`／首頁搜尋結果列**原本沒有箭頭**（僅裸文字標題，
  U38/U41 研究階段已查證），兩處新增箭頭 `<span aria-hidden="true">→</span>`（`text-ink/40`，
  比照緞帶列既有箭頭的淡色調），`<a>` 從單一文字節點改 `flex items-center justify-between`
  排版容納標題＋箭頭兩個 flex item。**範圍未含** `LocationLookupPage.jsx`（U37 已處理過
  點擊範圍但同樣無箭頭）——U41 原始範圍只列 3 處，這次不擴大。驗證：`npm run lint`／
  `npm run build` 皆綠；build 產物 CSS 核對 `.arrow-slide`／`a:hover .arrow-slide`／
  `prefers-reduced-motion` 規則皆正確編譯。**未做的驗證**：本次無瀏覽器工具，hover 箭頭
  位移視覺與新增箭頭後的版面（標題過長時是否擠壓箭頭）未經目視核對，麻煩使用者複核
  `/guides`、首頁搜尋結果、行動版首頁行事曆緞帶列。

### 2026-07-22 使用者回饋（列表排序邏輯，僅記錄未執行）

- [x] U42 [UX] 全站列表頁排序邏輯收斂（2026-07-22 完成，U50 items 除外）：新增
  `sortEntries(entries, sortConfig)`（`src/utils/collectionQuery.js`）——宣告式，
  `collectionConfigs.js` 每個 collection 各自的 `sort: { groupBy, groupOrder,
  secondaryBy }` 決定分組相鄰＋組內次序，`secondaryBy` 對應內建的 `VALUE_EXTRACTORS`
  （`grow_days_min`／`sell_price`／`sell_price_5star`／`day_asc_null_first`／
  `buy_price_leading`）；`CollectionPage.jsx` 在 `applyFilters` 後接 `sortEntries`。
  分組欄位可能是單值（`village`）或陣列（`season` 常見一物件跨多季）——`groupWeight`
  取陣列中「最早出現的分組」當權重，讓跨季條目落在最早適用的那組。animals：依
  `species` 分組、組內 `buy_price_leading` 升冪（`buy_price` 是複合字串如
  「1500 / 3000（小牛／成牛...）」，取第一個數字＝基礎品種價格）；`ANIMAL_SPECIES_ORDER`
  沿用篩選器已在用的 `uniqueOptions(animals, 'species')`。**單元測試核對真實資料**：
  用 U38 截圖的實際 7 筆 animals 資料模擬排序，確認輸出為
  `牛→茶牛→羊→黑羊→羊駝→雞→黑雞`——牛/茶牛、羊/黑羊皆相鄰，符合使用者原始訴求。
  驗證：`npm test`（227，含 5 則新測試涵蓋分組/跨季/day null-first/缺值排最後）／
  `npm run lint`／`npm run build` 皆綠。**未做的驗證**：本次無瀏覽器工具，實際列表頁
  視覺排序未經目視核對，麻煩使用者複核 `/c/animals`（牛/茶牛、羊/黑羊是否相鄰）。

  - [x] U43 [UX] **festivals**：`sort: { secondaryBy: 'day_asc_null_first' }`——
    `day_asc_null_first` extractor 用 `entry.day ?? -Infinity`，同時涵蓋 `null` 與
    `undefined`（實際資料是後者：無 `day` 欄位的 frontmatter 序列化後是 `undefined`
    不是 `null`，兩者都要接住）。料理大會／花之日排最前，其餘依 `day` 升冪。
  - [x] U44 [UX] **recipes**：`sort: { groupBy: 'category', groupOrder:
    RECIPE_CATEGORY_OPTIONS, secondaryBy: 'sell_price_5star' }`。**發現並修正todo
    記錄錯誤**：分析階段筆記誤寫分類順序為「主食→拼盤→甜點→湯→沙拉→其他」，實作時
    對照 `collectionConfigs.js` 才發現既有 `RECIPE_CATEGORY_OPTIONS` 實際順序是
    `['主食','沙拉','湯','拼盤','甜點','其他']`——決策是「沿用既有 config 順序」，
    以程式碼中的真實陣列為準，不是分析筆記裡憑印象寫的順序。
  - [x] U45 [UX] **crops**：`sort: { groupBy: 'season', groupOrder: SEASON_OPTIONS,
    secondaryBy: 'grow_days_min' }`，`grow_days_min` extractor 呼叫既有
    `parseGrowDays()` 取 `.min`。
  - [x] U46 [UX] **characters**：`sort: { groupBy: 'village', groupOrder:
    VILLAGE_OPTIONS, secondaryBy: 'birthday_calendar' }`（2026-07-22 使用者追加：
    組內次序原本未討論，追加裁決要生日曆序）。新增 `birthday_calendar` extractor：
    `parseSeasonDay`（既有 `gameCalendar.js` 工具，T1.3）解析 `"春-8"` 格式，
    換算成 `季節序 × SEASON_DAYS + 日` 的單一可比較數值，查無或格式錯誤排最後。
    驗證：新增單元測試（同村莊內生日早的排前面），`npm test`（223）／lint／build 皆綠。
  - [x] U47 [UX] **fishes**：`sort: { groupBy: 'season', groupOrder: SEASON_OPTIONS,
    secondaryBy: 'sell_price' }`。
  - [x] U48 [UX] **insects**：同 fishes 邏輯，`sort: { groupBy: 'season', groupOrder:
    SEASON_OPTIONS, secondaryBy: 'sell_price' }`。
  - [x] U49 [UX] **minerals**：`sort: { secondaryBy: 'sell_price' }`，無 `groupBy`
    （沒有分類型欄位可分組）。
  - [ ] U50 [UX] **items**（158 筆，雜項集合，**本輪仍跳過，維持原判**）：無正式
    `category`/`type` 欄位，`tags[1]` 可間接分組但語意上是否合理仍需額外討論，
    `collectionConfigs.js` 的 `items` 未加 `sort` 欄位（`sortEntries` 對缺 `sort`
    設定的 collection 原樣回傳，不影響現有順序）——待其餘 collection 排序上線、
    使用者確認公式好用之後再回頭處理。
  - [x] U51 [UX] **pets**：`sort: { groupBy: 'species', groupOrder: PET_SPECIES_ORDER }`，
    無 `secondaryBy`（本輪未討論組內次序，5 筆之內影響有限）。

  依「檔名序 vs 有意義排序」落差程度的優先順序（實作皆已完成，僅供歷史記錄）：
  festivals → recipes → crops／characters → fishes／insects → minerals → pets →
  items（仍跳過）。

### 2026-07-22 使用者回饋（存檔頁視覺補印章、意外發現死程式碼）

- [x] U52 [UX] 存檔頁補印章圖示（2026-07-22 完成）：使用者截圖反映 `/tracker`
  UI「像是沒有經過設計過」，查證後定位在 `AnimalTracker`／`ExportImportSection`
  的區塊級 `<h2>` 是裸文字，沒跟上 `GuidesIndexPage`／首頁搜尋結果分組已有的
  「`<span className="stamp"><Icon/></span>` + h2」慣例（按鈕/GameDialog 樣式
  本身沒問題，不是全面重做）。`icons.jsx` 新增 `save` 圖示（箭頭插入托盤，圖示庫
  原本沒有存檔/下載語意的圖示）；「畜牧追蹤」借用既有 `sheep`（DESIGN.md 本來就
  對應 livestock）；「+ 新增動物」觸發鈕補 `btn-stamp`（跟對話框內確認鈕一致）。
  驗證：`npm test`（223）／lint／build 皆綠；build 產物核對新圖示 path data 正確
  編譯進 bundle。**未做的驗證**：本次無瀏覽器工具，實機視覺未經核對，麻煩使用者
  複核 `/tracker`。
- [ ] U53 [UX] **意外發現、非本輪處理**：`PlantingTracker.jsx`／`ChecklistsSection.jsx`
  確認是死程式碼——全域 grep 只有檔案本體與 `TrackerPage.jsx` 一行註解提及「同前
  已停用」，沒有任何頁面 import/渲染。使用者裁決本輪先不動，記錄待日後決定
  刪除或重新啟用（種植追蹤／收集清單功能）。

### 2026-07-23 使用者回饋（新增動物流程重新設計，已完成）

- [x] U55 [UX] 重新設計 `AnimalTracker.jsx` 的 `AddAnimalDialog` 新增動物流程
  （2026-07-23 完成）：①`animals.json` 只有 7 筆固定資料（牛／羊／羊駝／茶牛／
  雞／黑羊／黑雞），現有搜尋框（`searchEntries`＋`<input type="search">`）對
  7 筆清單無實質作用，對話框 `max-h-64 overflow-y-auto` 本就一眼看完，搜尋
  只是多餘的輸入步驟，已移除（連同 `searchEntries` import 一併拿掉，改直接
  `animals.map`）；②原本選動物→取名是兩層畫面切換（`selectedSlug` 條件渲染
  整個替換對話框內容），改成單一畫面：清單常駐顯示（點狀底線手帳行，沿用
  U54 樣式），選中項目變實心反白；下方暱稱輸入框初始 `disabled`，點選動物後
  啟用，不再需要「重新選擇」回頭鍵——直接點清單裡別隻即可切換（暱稱欄已輸入
  的文字會保留，不因換動物清空）。
  **實作中發現並修正的 bug**：自動聚焦一開始寫在 `onClick` handler 裡呼叫
  `nicknameInputRef.current?.focus()`，但當下 React 還沒重繪，input 在
  瀏覽器眼中仍是 `disabled`——對 disabled 元素呼叫 `focus()` 無效，實際测过
  才發現聚焦沒有生效（`focused: false`）。改用 `useEffect` 依賴
  `selectedSlug`，等 disabled 屬性真的解除後再聚焦，修正後複測通過。
  驗證：`npm run lint`／`npm test`（225）／`npm run build` 皆綠；本機起
  `npm run dev`＋Playwright（scratchpad 暫裝，未動專案 `package.json`）
  headless Chromium 實際點擊操作＋截圖核對：搜尋框已移除、7 筆清單完整
  顯示、選中項目反白、暱稱欄啟用且確實取得焦點、確認新增按鈕在未選動物/
  未輸入暱稱時皆為 disabled、切換動物保留已輸入暱稱、console 無錯誤。

### 2026-07-23 使用者回饋（料理查詢：食材找料理＋總攬表格，待實作）

- [ ] U56 [UX] `/c/recipes` 補「食材找料理」與「總攬表格」兩個查詢能力（使用者
  裁決不要低成本折衷、要根源解決，見對話紀錄）：使用者指出來源網站（食譜
  blog 原文）可一次看到 70 幾道料理、自己選食材決定要做什麼，現站做不到——
  `CollectionPage.jsx` 目前 recipes 搜尋只比對 `['name', 'name_jp', 'title']`
  （硬編碼，非 config 驅動），食材完全沒進搜尋/篩選；列表也在 U28（2026-07-20）
  精簡成「名稱＋5★賣價」一行卡，食材要點進單一條目頁才看得到，無法一頁掃視
  比對。全站食材共 182 種不重複（`recipes.json` `ingredientsLinks` 統計），
  多到不能沿用 `FilterBar.jsx` 現有 `ChipGroup`（按鈕列，適合分類/廚具這種
  個位數選項），需要新的標籤輸入式（打字加選）篩選元件。
  - ①**食材找料理**：新增食材篩選——玩家輸入/選取手邊食材（可疊加多個），
    只列出「每個食材欄位都湊得到」的菜。比對邏輯需注意：`ingredients` 每欄
    可能是單一食材，也可能是「或」的多選一（如「煮雞蛋（ゆで卵）或蛋黃醬
    （マヨネーズ）」，`ingredientsLinks` 已解析成 `alternatives` 陣列）——
    判斷「這道做得出來」是**每一欄都至少命中玩家已選清單裡一項**，不是
    「隨便碰到一種食材就算」。
  - ②**總攬表格**：新增「總覽表格」檢視切換鈕（**預設仍是現有一行卡列表**，
    不動 U28 決策、不影響其他 8 個分類頁共用的同一套列表版型——使用者裁決
    只加平行切換，不整個 recipes 列表改掉，理由：全站列表版型一致性、風險
    最低、不動既有已上線設計），切過去顯示 名稱｜食材｜廚具｜賣價 的寬表格，
    比照站內既有 guide 內文表格 `overflow-x-auto` 的護欄寫法。
  **本項僅記錄使用者已拍板的方向，尚未實作**——認領前需要規劃：搜尋/篩選
  欄位是否要改成 config 驅動（目前 recipes 搜尋欄位是 `CollectionPage.jsx`
  裡的硬編碼 `['name','name_jp','title']`，其他 collection 共用同一行，加
  食材專屬搜尋前要先確認會不會動到其他 8 個分類頁的搜尋行為）、新篩選元件
  的互動細節（標籤輸入框長什麼樣子、跟現有 `FilterBar` 是否共用容器）、
  總覽表格在手機版窄螢幕的排版（多顆食材 chips 塞一格會不會需要換行/截斷）。

### 2026-07-23 使用者回饋（同邏輯掃全站：反向查詢缺口，待實作）

- [x] U57 [UX] 用 U56 同一套「正向連結做了、反向查詢沒做」邏輯掃過全站，
  抓到兩個同型缺口（使用者裁決記錄，見對話紀錄）：
  - [x] ①**食材條目頁看不到「能做哪些料理」**（2026-07-23 完成）：`recipes`
    的 `ingredients` 早就解析成 `ingredientsLinks`（build-content.js:183），
    連到對應的 crops／fishes／minerals／items 條目，但反向沒做——玩家在番茄
    條目頁看不到「番茄可以做哪些料理」。做法：新增 `scripts/usedInRecipes.js`
    的 `attachUsedInRecipes`，手法直接沿用 `giftFans.js` 的 `attachGiftFans`
    （反向索引 hrefIndex＋`flattenLinks` 攤平「A 或 B」擇一群組）——recipes 在
    `COLLECTION_DIRS` 順序上排在 crops/fishes/items/minerals 之前，比照
    `attachGiftFans` 在 `name === 'characters'` 當下呼叫的作法，`build-content.js`
    在 `name === 'recipes'` 處理完當下呼叫 `attachUsedInRecipes`，寫入目標條目的
    `usedInRecipes` 欄位（含料理作食材的遞迴案例，如 烏龍麵→炒烏龍麵/狐狸烏龍麵/
    天婦羅烏龍麵，三筆皆正確反向歸戶）；`EntryPage.jsx` 比照「食材」區塊新增
    「可做料理」區塊（`ItemChips` 渲染 `entry.usedInRecipes`）。
    驗證：新增 `scripts/usedInRecipes.test.js`（4 則，鏡射 `giftFans.test.js`
    案例結構）；`npm test`（229）／`npm run lint`／`npm run build` 皆綠（警告數
    維持 55 則，未新增）；`npm run build` 產物核對番茄條目正確收到 13 筆
    `usedInRecipes`；本機起 `npm run dev`＋Playwright（scratchpad 暫裝，未動
    專案 `package.json`）截圖核對 `/c/crops/番茄` 頁面「可做料理」區塊正確渲染
    13 顆可點擊 chip，console 無錯誤。
  - [x] ②**攻略文章連不回查詢列表**（2026-07-23 完成，範圍收斂說明見下）：
    `recipes` 條目頁「分類」值已連到對應攻略總覽文章（`entry.guideHref`，
    build-content.js:210-217，如「主食」跳去讀「主食類料理完整食譜」），但反向
    沒做——`GuidePage.jsx` 讀完文章想看完整列表，沒有連結跳回
    `/c/recipes?category=主食` 這類篩選結果。做法：新增 `GUIDE_RECIPE_CATEGORIES`
    （`RECIPE_CATEGORY_GUIDES` 分類→guide 對照的反向 map，一篇 guide 可能涵蓋
    多分類，如「沙拉類與湯類食譜」對應沙拉／湯兩類，join 成
    `?category=沙拉,湯`——`collectionQuery.js` 的 `parseMultiParam` 本來就是
    逗號分隔多值，不用額外處理），build-content.js 在主迴圈前就近寫入
    `guide.collectionHref`（guides 在 `COLLECTION_DIRS` 排最後，不會提早被
    序列化）；`GuidePage.jsx` 比照 `CollectionPage.jsx` 既有的「依地點查詢」
    虛線框 CTA 樣式，新增「查看完整清單→」連結（icon 用 `pot`，對應料理
    collection）。**範圍收斂**：`entry.guideHref`（正向連結）目前只有 recipes
    有建，U20 瘦身過的 fishing／bugs／mining／life 那幾篇 guide 並沒有對應的
    「分類值→guide」正向連結存在——這次只做「反向」，不是連正向一起補上其他
    四個系統，超出「補反向連結」的範圍，若要擴大到其他系統得先評估各自的
    分類/篩選欄位是否對得上（fishes 用 location/season、非 recipes 這種單一
    category 欄位），列為未來待評估項目，不在本次動工。
    驗證：`npm test`（229，無新增測試——`GUIDE_RECIPE_CATEGORIES` 是純資料
    對照表，行為由既有 `attachGiftFans` 同款手法與 `parseMultiParam` 既有
    測試覆蓋，未新增邊界邏輯）／`npm run lint`／`npm run build` 皆綠（警告數
    維持 55 則）；建置產物核對 5 篇料理 guide 皆正確產出 `collectionHref`
    （含沙拉/湯雙分類 join 正確）；本機起 `npm run dev`＋Playwright 截圖核對
    `/guide/cooking/主食類食譜` 頁尾正確顯示「查看完整清單」CTA，點擊後跳轉
    `#/c/recipes?category=主食`，篩選面板正確顯示「篩選 1」且已選中「主食」，
    console 無錯誤。

### 2026-07-22 使用者回饋（存檔頁重新設計：框中框、標題複讀、對話框按鈕排列）

- [x] U54 [UX] 存檔頁深度重新設計（2026-07-22 完成，先出視覺稿 artifact 對過方向
  才落地，見對話紀錄）：U52 只補了印章圖示，使用者接續截圖指出更根本的問題——
  ①頁面 `<h1>存檔</h1>` 跟上方已選中的「存檔」tab 複讀，資訊量為零；②「最後編輯」
  排在頁面最上方，比玩家真正要看的內容還優先；③動物點心累計卡片點狀分隔線＋
  每顆圓鈕各自描邊，「框中框」（同 U36 已處理過的病灶，這裡漏套）；④新增動物
  候選清單每項各自描邊成方塊，讀起來像表單不像手帳；⑤新增動物對話框「確認
  新增」跟 `GameDialog` 固定附加的「關閉」用同一種實心樣式，語意相反（送出 vs
  放棄）卻長得一樣。逐項修法：
  - `TrackerPage.jsx` 拿掉重複的 h1；`AnimalTracker.jsx` 的「畜牧追蹤」升格唯一 h1。
  - 「最後編輯」搬到 `ExportImportSection.jsx`（下載備份前最相關的資訊），
    `formatUpdatedAt` 從 `AnimalTracker.jsx` 抽成共用 `utils/formatDate.js`
    （兩處都要用，新增單元測試）。
  - 點心累計列：拿掉點狀分隔線與圓鈕描邊，改純間距（`gap-4`）＋固定對齊排節奏，
    不畫框也不塗底色分帶（比「換一種框」更進一步——使用者回饋第一版底色分帶
    提案「從一堆線變成一堆底色」沒有真的解決數量感問題）；「還差 N」改成
    `text-seal bg-seal/10` 徽章，全區唯一色塊；標籤跟徽章原本 `flex flex-col`
    疊兩行（非本次新問題，是既有程式碼寫法），改同一行 `flex`，不再多佔垂直空間。
  - 新增動物候選清單：`border rounded-lg` 方塊改成全站既有的點狀底線手帳行
    （`GuidesIndexPage`／搜尋結果同款），不是新設計，照抄既有規格風險最低。
  - `GameDialog.jsx`：底部實心「關閉」大按鈕改成角落描邊圓形 ×（沿用
    `DeleteAnimalDialog` 觸發鈕已經在用的裸「×」寫法），內容自己需要的動作
    （確認新增／重新選擇、確認刪除）不再被迫跟通用關閉鈕搶視覺權重；
    `DeleteAnimalDialog`（確認刪除對話框）連帶受益，不用另外改。
  驗證：`npm test`（225，含 2 則新 `formatUpdatedAt` 測試）／`npm run lint`／
  `npm run build` 皆綠。**未做的驗證**：本次無瀏覽器工具，實機視覺與互動（尤其
  角落 × 是否好按、點心列間距是否夠鬆）未經核對，麻煩使用者複核 `/tracker`。
