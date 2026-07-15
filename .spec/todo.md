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
- [ ] T6.12 [UX] 類別食材與遞迴料理連結：ingredients 中類別食材（きのこ類）點擊展開可用清單、料理作食材遞迴跳 recipes（驗證：recipes 條目化後——主食類含きのこ類項可展開清單；烏龍麵→狐狸烏龍麵可遞迴跳轉）(dep: T6.6)（2026-07-12 C2 完成解除 blocked：recipes.json 已有 273 筆，資料層已驗證 狐狸烏龍麵 ingredientsLinks 含 `#/c/recipes/烏龍麵` 可遞迴；類別食材字串「蘑菇類（きのこ類）」等 22 則現為物品索引查無警告，正是本任務要處理的展開對象）

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

- [x] U1 左上返回鈕：header 左上 ← 鈕（非首頁才顯示；深連結直開無站內歷史時退回首頁，不跳出網站）
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
- [ ] U12 [UX] 條目頁手帳化：角色頁拍立得頭像、村莊印章章、虛線資訊列、禮物撕紙 chips（最愛 seal 紅／討厭刪除線），依 DESIGN.md §元件樣式（驗證：千尋、亞修兩頁截圖目視）(dep: U11)

- [ ] T8.1 [UX] HUD 風進度元件：愛心列（動物）、水滴列（澆水進度）（驗證：截圖目視對照遊戲 HUD 風格）(dep: T7.3, T7.4b)
- [ ] T8.2 [UX] EntryPage 資訊卡改遊戲對話框風（粗邊框、圓角木框）（驗證：截圖對照 content/images 裡的遊戲截圖）(dep: T6.5)
- [ ] T8.3 [UX] 版面總 pass（App 殼置中，README 決策 8）：375px 容器滿版不破版、桌機容器置中背景紋理正常、行事曆/長表格容器內橫向捲動、追蹤器大拇指可按（驗證：375px/768px/1280px 三寬度截圖檢視）(dep: T7.6, T6.9c)
- [ ] T8.4 [UX] 全站視覺一致性檢查 + 細節（favicon、頁 title、載入態）（驗證：全頁面截圖集一輪目視）(dep: T8.1, T8.2, T8.3)

---

## 內容回報區（不進開發迴圈，走 vault skill `harvest-moon-twin-villages`）

- [x] C1 家畜條目補建（2026-07-12 完成）：建立 7 個 `livestock/animals/` 條目——雞/黑雞/牛/茶牛/羊/黑羊/羊駝（白色／茶色羊駝數值全同、僅毛色不同，併一條目；黑羊＝薩福克羊、茶牛＝新澤西牛，同物異名不另建）。購買價/入手條件/妊娠費用取自 [[藍鈴村商店指南]]（原缺的 buy_price/village 已有著落），`village` 比照既有寵物條目慣例填「雙村共通」（動物屋在藍鈴村但兩村玩家皆可買）、羊駝 `species` 直接填「羊駝」（列表頁篩選選項是動態產生，填「其他」反而不可讀）。`treat_requirements` 已回 pixnet 原文（5011712126）curl 核對：來源對一般家畜只給目標 2 門檻，3–5 級為來源明文公式「給予數 ×（目標數 − 1）」（含明文例：雞升 5 需茶點 2×4=8），依公式推得並在條目內註明推導；羊駝為來源明文實表（穀物/魚味每級只遞增 5，確認不符公式）照表填、茶點填 null。build 驗證：animals.json 5→12 筆、警告數維持 641（無新增）、155 測試全過；`computeTreatShortfall` 重現 T7.4b 規格案例（羊+魚味3 → 還差 茶點2/野菜12/穀物12/魚味2），升級倒數自動生效。來源 guide〈動物總覽〉的未建條目註記已同步改為條目化狀態。
- [x] C2 recipes 條目化（2026-07-12 完成）：5 篇食譜 guide 表格用確定性 python 腳本產出 273 個 `cooking/recipes/` 條目（主食 73／沙拉 14／湯 16／甜點 54／其他 52／拼盤 64，與各 guide 自述數量完全對帳）。schema 依 content-pipeline 規則：name/name_jp/category/cookware/ingredients[]/sell_price_5star；ingredients 依「＋」拆槽、每槽保留原文（含「或」替代鏈與類別食材字串，解析失敗照設計降級純文字＋警告）；廚具正規化 調味料/調味料台→調味料台。category 用遊戲內 6 個真實分類（沙拉/湯 分開，非 spec 原寫的合併「沙拉湯」——那只是同一篇 guide 的包裝），消費端同步一行更新 `collectionConfigs.js` 的 RECIPE_CATEGORY_OPTIONS。特例四則（皆加註於條目內文，不猜值）：泰式酸辣湯 5★ 賣價來源未收錄→不填；拼盤「油炸豆腐（あげだし豆腐）」與「油炸豆腐（油あげ）」中文撞名→前者依來源括號別名改「油豆腐」，主名留給全站材料欄都在引用的 油あげ；米飯 name_jp 依來源表填「ご飯」並註明材料欄慣用「ごはん」為同詞異寫（中文輔鍵仍命中）；水果湯圓標※但來源可追加材料表未列→照實標註不一致。驗證：build 警告 641→468（喜好→配方鏈解掉 173 則物品索引查無，例：娜娜 loves 炊飯 以日文鍵命中 什錦炊飯）、155 測試全過；剩餘 recipes 警告 340 則組成＝或替代鏈 8＋類別食材 22（T6.12 範圍）＋商店品/加工品/採集物 310（C3 範圍）。T6.12 blocked 已解除。
- [x] C3 物品條目化：食材來源鏈斷點消除（2026-07-14 完成）：確定性腳本從 7 篇已入庫 guide 表格產出 **151 個 items 條目**，分置各系統 `items/` 子目錄（同一 collection）——山道採集物 26（`basics/items/`，花類/褐色蘑菇的「日文待補」已 curl 核對 pixnet 原文補上、鴻喜菇從原文「隨機出現物品」清單補建）、商店食材 9（油/海苔/咖哩粉等，價取兩村商店指南）、製造機小屋 59＋水車小屋 24（`life/items/`；種子 43 筆不建——作物條目已含種子價且無引用鏈需要；米不重建——與 crops/米 中文同名，中文輔鍵已命中）、蜂蜜 7＋畜產品 11（`livestock/items/`）、花束 6＋香水 7（`farming/items/`）。查證修正 6 組（皆條目內文加註）：上等/極品香草蛋黃醬日文（來源複製錯誤，curl 確認）、綠茶罐/紅茶罐/人參茶罐日文（來源該欄寫中文）、杏仁酒→杏子酒（あんず＝杏子，材料「杏仁」判定指杏子非アーモンド）、四種罐裝紅茶＋罐裝可可條目名改依全站食譜引用寫法。**新增 `aliases` 選填欄位**（itemIndex 解析、含 2 單元測試）：7 個條目登記異寫（魔法紅草/月滴草/皇家奶茶/炊き込みご飯/魚の煮つけ/夏茶葉→茶樹），解 19 則警告。**C4 螃蟹誤判修正**：チビシャンガニ 原判誤植併入短種河蟹，本次發現食譜/角色頁獨立引用＋外站（攻略Memo）證實四蟹並存數據吻合，拆回獨立條目 [[短種螃蟹]]（fishes 63→64），短種河蟹的季節污染同步修正。成效：物品索引警告 468→61（唯一 45），剩餘全屬既知範疇（類別字串＝T6.12、或替代鏈＝既有設計、竹葉/杏桃/失敗品等＝來源無資料不猜）；items.json 7→158 筆、157 測試全過。
- [x] C4 fishes 條目化（2026-07-07 深度審查發現，2026-07-12 完成）：`釣魚系統與地點總覽.md` 六個地點的魚類表用確定性 python 腳本合併（依 name_jp 去重、season 取聯集、location/condition 依 insects 慣例寫成可讀字串而非結構化陣列——核對後跨地點賣價衝突只有鰻魚 1 例，不需要為此讓全部 63 篇套用陣列 schema），共產出 63 個 `fishing/fishes/` 條目（65 魚種扣掉判定為來源誤植合併的 1 筆、5 隻魚王不獨立建條目）。`time`／`size_range` 來源缺，不填（非網站必填）。兩個資料疑點已用 curl 核對 pixnet 原始網頁確認**皆為來源本身資料，非先前轉錄錯誤**：鰻魚池/瀑布下游賣價不同（1960G／720G）→ `sell_price` 依地點分列，不取單一代表值；「チビシャンガニ／大種河蟹」→ 因「チビ」字首全篇無例外對應「短種」，判定為「チビサワガニ／短種河蟹」之誤植，併入該條目並加註判斷依據（**2026-07-14 C3 修正：此判斷錯誤**——食譜/角色頁獨立引用＋外站攻略Memo證實為獨立蟹種，已拆回 [[短種螃蟹]]，63→64 條目；「大種河蟹」中文欄仍為來源誤植）。來源 guide 的〈尚待處理〉章節已同步更新為〈條目化狀態〉。補齊後 fishes.json（63 筆）、魚圖鑑 checklist、魚類篩選/查詢鏈、35 則先前查無的物品索引連結自動生效。
- [x] C5 `grow_days` 未加引號（2026-07-08 T2.5 驗證發現，2026-07-09 修正）：13 篇 crops（可可豆/咖啡/大豆/小麥/桃子/橘子/櫻桃/米/紫葡萄/茶樹/蕎麥/蘋果/香蕉）的 `grow_days` 改成加引號字串（如 `grow_days: "59"`），build warning 消失（689→676 則）
- [x] C6 festivals `day` 欄位型別不一致（2026-07-09 T6.8 CalendarPage 使用時發現，2026-07-12 修正）：`花之日`／`料理大會` 移除單一 `day`，改用共用的 `occurrences: [{ season, day, village? }]` 陣列（`village` 只在花之日這種跨村不同日的情況才填）；`season` 欄位保留（仍是正確的「涵蓋季節集合」）。其餘 17 篇完全不動。消費端同步更新：`CalendarPage.jsx` 的 FESTIVAL_ITEMS 建構、`reminders.js` 的 `findRemindersForDate`（原本只認 `festival.day` 單值，沒改的話這兩篇會永遠不觸發今日提醒）都改成優先讀 `occurrences`、沒有才 fallback 舊邏輯；`scripts/validate.js` 的必填欄位表也把 festivals 的 `day` 改成 `['day', 'occurrences']` 擇一滿足（一般化寫法，非兩篇的特例判斷）。手動驗證：行事曆頁夏10正確顯示「花之日（藍鈴村）」、秋18顯示「花之日（此花村）」、春/夏/秋/冬各自 4 天顯示料理大會；追蹤器推進到夏-10 正確跳出花之日提醒 Toast。
- [x] C7 一般村民頭像未 ingest（2026-07-14 U5 角色卡上線後分析發現，同日完成）：20 位無頭像角色全部來自「所有村民簡單介紹」（pixnet 5010149856）同一次 ingest，該次**只取了文字、沒抓圖**（20 篇條目檔 0 張圖）——但已 curl 核對原始網頁本文有 37 張圖，其中含**每位村民的對話頭像截圖**（已抽樣下載確認：雪莉露對話截圖，風格與 12 位可攻略角色現有頭像一致；其餘為店面外觀照，需依前後文區分）。**非來源缺圖，是 ingest 缺口**。完成方式：下載全部 30 張候選圖並**逐張目視核對對話框名牌**建立村民↔頭像對照（不靠圖文順序推斷——因為發現店面照在本頁與商店指南兩處的標示互相矛盾，見下），20 張頭像入 `images/leomoon173-pixnet-5010149856/`、依 alt 慣例插入各條目 body 開頭，characters 32/32 全有頭像。**店面照這次不歸檔**：同一張圖（8d25…/1ccb…）在本頁與藍鈴村商店指南的建物標示互相矛盾（動物屋 vs 布提‧霍華德），無法不猜地判定誰對，留待日後有第三來源再處理。
- [x] C8 characters `marriageable` 全部誤標 true（2026-07-14 C7 分析時發現，同日修正）：依站內 romance guide 明文名單查證——女主 6 位（亞修/卡米爾/奇利克/千尋/米海爾/迪魯卡）＋男主 6 位（莉亞/拉茲貝莉/莉可麗絲/娜娜/賢者大人/艾瑞拉）共 12 位保留 true，與戀愛對象來源（5012321571）涵蓋者完全吻合；其餘 20 位（含女神大人——村民介紹頁明確將其歸「其他村民」、僅送禮互動，且頁首明示戀愛對象另見他篇）改 false。驗證：列表頁可攻略篩選 是→12、否→20。
- [x] C9 「暫缺/待補」說明整批刪除（2026-07-15 使用者裁決確立內容原則：**來源沒有就是沒有——缺值留空走 build warning，不寫欄位暫缺/待補/未解問題說明段**）：刪除 兩村 specialties 暫缺註記、3 篇 guide 增築「未解問題」註記、兩篇食譜 guide 的「食譜取得方式」臆測段（內容本身就是猜的）、生日一覽待補充 bullets、茶樹冬茶暫無數據、奇利克 occupation（待補）佔位值（改缺欄位，+1 warning 為誠實狀態）、木匠任務查無目標的 [[増築指南]]（待補）參照（-1 wikilink warning）。山道系統 4 個「日文待補」中可考證的 3 個直接補值（咖哩肉包＝カレーまん 同頁原文有載、廢礦石＝クズ鉱石 同作者角色頁多處攻證、賢者大人（賢者さま）站內條目既有），礦山石不可考證改「—」。查證紀錄類 blockquote（日文名來源說明等，U4 已不對讀者顯示）保留。
