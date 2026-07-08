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
- [ ] T3.3 [Interface] 匯出：Save + `exportedAt` → 下載 `hmtv-save-YYYYMMDD.json`（驗證：手動下載、內容與 localStorage 一致）(dep: T3.1)
- [ ] T3.4 [Interface] 匯入：驗證 schemaVersion／calendar 合法 → 先備份 `hmtv:save:backup` → 覆蓋；失敗原檔不動（驗證：unit test 壞檔不動原檔；手動 round-trip 匯出→清空→匯入一致）(dep: T3.3)
- [ ] T3.5 [Interface] 從備份還原：`restoreBackup()` 讀 `hmtv:save:backup` 回寫為現行存檔，無備份時回報（驗證：unit test 匯入覆蓋後 restore 還原到匯入前狀態）(dep: T3.4)

## Phase 4 — Interface：UseCase 整合層

- [ ] T4.1 [Interface] `advanceDayUseCase`：日曆推進 + 查當日生日/節慶提醒（讀 characters/festivals 資料）+ 存檔（驗證：unit test fixture：推進到 春-27 回傳娜娜）(dep: T1.2, T1.13, T3.1)
- [ ] T4.2 [Interface] `waterPlotUseCase`／`careAnimalUseCase`／`feedTreatUseCase`：冪等邏輯 + 即存（驗證：unit test 同日重複呼叫存檔不變）(dep: T1.7, T3.1)
- [ ] T4.3 [Interface] `addPlot`／`addAnimal`／`removePlot`／`harvestPlotUseCase`：uuid 生成、slug 失配容錯（未知條目保留原始資料）（驗證：unit test 含 slug 查無案例）(dep: T1.9, T3.1)
- [ ] T4.4 [Interface] 匯入匯出 orchestration + checklist 勾選 UseCase（驗證：unit test round-trip；checklist 勾選後存檔含該項）(dep: T3.5, T1.10)

## Phase 5 — UX：App 基礎骨架

- [ ] T5.1 [UX] 全站 layout：頂部導覽（查詢入口/行事曆/追蹤器）、羊皮紙底、內容卡片殼；村色 utility（`data-village` variant）（驗證：dev server 目視 + 手機寬度不破版）(dep: T0.4, T0.2)
- [ ] T5.2 [UX] Home：全站搜尋框（先 UI）、各系統入口卡、今日提醒區（tracker 有日曆才顯示）（驗證：無存檔時提醒區隱藏；手動建測試存檔、日期推到 春-27 → 顯示娜娜生日提醒）(dep: T5.1, T4.1)
- [ ] T5.3 [UX] Radix 基礎包裝：安裝 Dialog/Toast 單包，做出配羊皮紙樣式的 `<GameDialog>`／`<GameToast>` 包裝元件 + demo（驗證：開關 Dialog focus trap 正常、Esc 可關）(dep: T5.1)

## Phase 6 — UX：查詢系統

- [ ] T6.1 [UX] CollectionConfig 機制 + characters/crops 兩份 config（columns/filters/sorts 宣告式）（驗證：兩 collection 用同一元件渲染出不同欄位）(dep: T2.8, T5.1)
- [ ] T6.2 [UX] CollectionPage + EntryCard：列表、村色標示（驗證：角色列表顯示生日與 loves；藍鈴/此花卡片色正確）(dep: T6.1)
- [ ] T6.3 [UX] FilterBar + 排序 + URL 即狀態（hash query）（驗證：篩選「此花村+可攻略」後重新整理保留；作物依賣價排序正確）(dep: T6.2, T1.12)
- [ ] T6.4 [UX] SearchBar 接 T1.11：全站搜尋 + 結果分組（驗證：搜「ナナ」找到娜娜；「たき込みご飯」命中娜娜 loves）(dep: T6.2, T1.11)
- [ ] T6.5 [UX] EntryPage：frontmatter 資訊卡 + 內文 html + 來源區 + wikilink 可點（驗證：娜娜頁 wikilink 跳轉正常）(dep: T6.2)
- [ ] T6.6 [UX] 物品連結渲染：loves/likes chips 與內文物品字串渲染 build 時已解析的連結欄位（T2.6 產出），查無顯純文字（驗證：卡薩布蘭卡在某角色 likes 中可點；查無物品不產生死連結）(dep: T6.5, T2.6)
- [ ] T6.7 [UX] GuidePage：`prose` 排版 + 圖片 + 表格橫向捲動（驗證：主食類食譜長表格橫向可捲、手機寬度不破版、圖片正常）(dep: T6.1)
- [ ] T6.8 [UX] CalendarPage：4 季 × SEASON_DAYS 格、生日/節慶點擊跳條目（驗證：春-27 顯示娜娜、點擊進入角色頁）(dep: T6.5, T1.13)
- [ ] T6.9a [UX] animals/festivals 的 CollectionConfig（驗證：兩列表頁可開、動物顯示 species/village、節慶顯示日期）(dep: T6.3)
- [ ] T6.9b [UX] recipes/fishes 的 CollectionConfig（驗證：兩列表頁可開；條目未建前顯示空狀態不崩——C2/C4 補齊後自動有料）(dep: T6.3)
- [ ] T6.9c [UX] insects/minerals/villages/items 的 CollectionConfig（驗證：四列表頁可開、items 顯示 7 筆）(dep: T6.3)
- [ ] T6.10 [UX] 搜尋字串 URL 即狀態：SearchBar 查詢字串寫入 hash query，重新整理／分享保留（驗證：搜「ナナ」後重新整理仍顯示結果與關鍵字）(dep: T6.4)
- [ ] T6.12 [UX] 類別食材與遞迴料理連結：ingredients 中類別食材（きのこ類）點擊展開可用清單、料理作食材遞迴跳 recipes（驗證：recipes 條目化後——主食類含きのこ類項可展開清單；烏龍麵→狐狸烏龍麵可遞迴跳轉）(dep: T6.6) ※受 C2 內容缺口阻擋，資料補齊後才可驗收

## Phase 7 — UX：追蹤器

- [ ] T7.1 [UX] 遊戲日曆 HUD：當前 年/季/日、「過一天」按鈕、提醒 Toast（驗證：連按跨季跨年正確；春-27 跳娜娜生日 Toast）(dep: T4.1, T5.3)
- [ ] T7.2 [UX] 種植追蹤：清單 + 新增 Dialog（crops 搜尋選擇）+ 倒數區間顯示（驗證：加卡薩布蘭卡→顯示「最快還需 10／最慢 14 天」）(dep: T4.3, T5.3)
- [ ] T7.3 [UX] 澆水/收成互動：今日已澆水按鈕（同日冪等、按過變樣式）、可收成提示、收成→regrowable 分支（驗證：同日重複點無效；收成後不可重複收成的作物移歷史區）(dep: T7.2, T4.2)
- [ ] T7.4a [UX] 畜牧追蹤：清單 + 新增 Dialog（animals 選擇 + 暱稱）+ 照顧天數顯示（驗證：新增動物、careDays 隔日 +1 顯示正確）(dep: T4.2, T5.3)
- [ ] T7.4b [UX] 點心餵食 UI：四種類 +1 按鈕（每日限 1、同日冪等）+ 升級還差顯示（有 `treat_requirements` 才顯示倒數，註明「依攻略建議配方計算」；缺欄位只顯累計）（驗證：手動建測試存檔重現羊+魚味 3 案例——顯示還差 茶點2/野菜12/穀物12/魚味2；家畜條目未建前顯示累計數即符合規格）(dep: T1.8, T7.4a)
- [ ] T7.5 [UX] Checklists 頁：Tabs 分四種、Checkbox 勾選即存（驗證：勾 6色耀珠兩項→重新整理保留；fishes/recipes 等空 checklist 顯示空狀態不崩）(dep: T4.4, T5.3)
- [ ] T7.6 [UX] 匯出/匯入 UI：下載按鈕、檔案選擇匯入、備份還原按鈕（接 T3.5）（驗證：手動 round-trip；匯壞檔顯錯且原資料不動；匯入後按還原回到匯入前）(dep: T4.4, T5.3)
- [ ] T7.7 [UX] slug 失配呈現：plots／animals 引用 slug 查無現行條目時顯示「未知條目（slug）」並保留原始資料不刪不藏（驗證：手動塞入不存在 cropSlug 的存檔，清單顯示 fallback 且不崩）(dep: T7.2, T7.4a)
- [ ] T7.8 [UX] 儲存失敗警告橫幅：storage 寫入失敗旗標為真時顯示常駐橫幅，App 續以記憶體狀態運作（驗證：mock localStorage 丟 QuotaExceeded，橫幅出現且互動不中斷）(dep: T7.2, T3.1)

## Phase 8 — UX：視覺打磨

- [ ] T8.1 [UX] HUD 風進度元件：愛心列（動物）、水滴列（澆水進度）（驗證：截圖目視對照遊戲 HUD 風格）(dep: T7.3, T7.4b)
- [ ] T8.2 [UX] EntryPage 資訊卡改遊戲對話框風（粗邊框、圓角木框）（驗證：截圖對照 content/images 裡的遊戲截圖）(dep: T6.5)
- [ ] T8.3 [UX] RWD 總 pass：列表手機單欄、行事曆橫向捲動、追蹤器大拇指可按（驗證：375px/768px/1280px 三寬度截圖檢視）(dep: T7.6, T6.9c)
- [ ] T8.4 [UX] 全站視覺一致性檢查 + 細節（favicon、頁 title、載入態）（驗證：全頁面截圖集一輪目視）(dep: T8.1, T8.2, T8.3)

---

## 內容回報區（不進開發迴圈，走 vault skill `harvest-moon-twin-villages`）

- [ ] C1 家畜條目補建：雞/牛/羊/羊駝 + 變種（黑雞/茶牛/黑羊/薩福克羊），含 `treat_requirements`；一般家畜只有目標 2 門檻 + 公式，**3–5 級門檻回 pixnet 來源查證**（羊駝實表不符公式，不可無腦套）→ 補齊後 T7.4b 的升級倒數自動生效
- [ ] C2 recipes 條目化：5 篇食譜 guide 表格 → `cooking/recipes/` 條目（確定性轉換腳本 + 人工抽查，不確定的列停下來問）→ 補齊後 T6.6/T6.12 喜好→配方鏈與食譜 checklist 自動生效
- [ ] C3（後期）採集物條目：山菜等，食材來源鏈斷點消除
- [ ] C4 fishes 條目化（2026-07-07 深度審查發現）：`釣魚系統與地點總覽.md` 魚類表 → `fishing/fishes/` 條目（name、name_jp、地點、季節、時段、價格；確定性腳本 + 人工抽查）→ 補齊後 fishes.json、魚圖鑑 checklist、魚類篩選/查詢鏈自動生效
- [ ] C5 `grow_days` 未加引號（2026-07-08 T2.5 驗證發現）：13 篇 crops（可可豆/咖啡/大豆/小麥/桃子/橘子/櫻桃/米/紫葡萄/茶樹/蕎麥/蘋果/香蕉）的 `grow_days` 寫成裸數字（如 `grow_days: 59`），YAML 解析成 number 而非 spec 要求的字串格式，build 產生 warning。修法：改成加引號字串（如 `grow_days: "59"`）
