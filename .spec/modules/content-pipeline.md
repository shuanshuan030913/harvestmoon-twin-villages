---
title: 模組規格 — 內容管線
created: 2026-07-07
tags: [game/牧場物語雙子村, project/spec]
---

# 內容管線（Content Pipeline）

`scripts/build-content.js`：把 `content/` 的 markdown 轉成前端可用的 JSON。**`content/` 在網站開發中唯讀**——發現內容錯誤記入 todo「內容回報區」，走 vault skill `harvest-moon-twin-villages` 流程修正。

## Entity 欄位

### Collection 對照表

| 資料夾 | collection | 主要 frontmatter 欄位（schema 全文見 vault skill SKILL.md） |
|--------|-----------|------------------------------------------------------------|
| `characters/` | `characters` | title, name, name_jp, village, birthday(`季-日`), marriageable, gender, loves[], likes[] |
| `farming/crops/` | `crops` | name, name_jp, season[], village, buy_price, sell_price, grow_days(區間字串), regrowable |
| `livestock/animals/` | `animals` | name, name_jp, species, village, buy_price, product, product_value, care_required[]；**新增選填欄位 `treat_requirements`**（副產品升級點心累計門檻，見下方規則 5） |
| `cooking/recipes/` | `recipes` | name, name_jp, category（主食/沙拉/湯/拼盤/甜點/其他，遊戲內 6 分類）, cookware（鍋子/平底鍋/調味料台/無）, ingredients[]（依「＋」拆槽、每槽保留 `中文（日文）` 原文）, sell_price_5star |
| `fishing/fishes/` | `fishes` | name, name_jp, 地點/季節等 |
| `fishing/items/`＋`basics/items/`＋`farming/items/`＋`life/items/`＋`livestock/items/` | `items` | 跨系統物品 collection（2026-07-07 深度審查裁決：日後其他系統道具也歸此；2026-07-14 C3 落實）：釣魚戲外道具 7＋山道採集物 26＋商店食材 9＋花束/香水 13＋製造機/水車加工品 85＋蜂蜜/畜產品 18，共 158 筆。欄位：name, name_jp, location, sell_price／buy_price（字串或數字）, season[]（選填）, aliases[]（選填，見規則 6） |
| `bugs/insects/` | `insects` | 同上 |
| `mining/minerals/` | `minerals` | name, name_jp, 樓層/價格等 |
| `life/festivals/` | `festivals` | name, name_jp, season, day（**2026-07-08 修正**：實測欄位是拆開的 `season`＋`day` 而非合併字串，且村別欄位名為 `participants` 非 `village`） |
| `villages/` | `villages` | 兩村介紹 |
| `<system>/guide/`、`basics/` | `guides` | title, created, tags, source；附 `system` 欄位（來源資料夾） |

### 輸出

| 產物 | 說明 |
|------|------|
| `src/data/<collection>.json` | 每 collection 一檔：`[{ slug, ...frontmatter, html, plain }]`（html = marked 轉出；plain = 去標籤純文字，供搜尋索引） |
| `src/data/manifest.json` | `{ builtAt, contentHash, counts: {collection: n}, warnings: [...] }` |
| `public/images/` | `content/images/` 原樣複製 |

## 核心業務規則

1. **slug 規則**：檔名去 `.md`；characters 保留村名前綴檔名作 slug（如 `此花村-娜娜`），顯示名用 `name`。slug 必須全站唯一，重複 → build error（唯一會中斷 build 的情況）。
2. **Wikilink 解析**：對照表以三種鍵建立 → `name`、`title`、檔名（去 `.md`）。
   - `[[娜娜]]` → 對照表查得 → `<a href="#/c/characters/此花村-娜娜">娜娜</a>`。
   - **撞名**：同一鍵指向多個條目 → 該鍵作廢並列 warning，僅保留檔名精確鍵；內文使用該撞名鍵時轉純文字。
   - **查無目標**：轉純文字 + warning（列於 manifest.warnings），不中斷 build。
   - 支援 `[[目標|顯示文字]]` 別名格式。
3. **圖片路徑改寫**：`../images/...`、`../../images/...` → `{BASE_URL}images/...`；`<!-- img: url -->` 註解（ingest 失敗留痕）原樣忽略。
4. **frontmatter 驗證**：必填欄位（各 schema 的 title／name_jp 等）缺漏 → warning 進 manifest，**不中斷、不塞預設值**（修正回 content/ 做）。`grow_days` 接受 `"10"` 與 `"10-14"` 兩種格式，其他格式 → warning。
5. **`treat_requirements`**（動物副產品升級點心門檻，2026-07-07 修正：升級機制是點心累計制而非照顧天數，依據 [[動物飼養管理攻略]]）：選填。結構為各點心種類 → 目標數量 2～5 的累計門檻陣列：
   ```yaml
   treat_requirements:        # 累計數，不歸零；null = 該動物不吃此類（如羊駝無茶點）
     茶點: [2, 4, 6, 8]       # 依序為升到 2/3/4/5 個副產品的累計門檻
     野菜: [12, 24, 36, 48]
     穀物: [12, 24, 36, 48]
     魚味: [5, 10, 15, 20]
   ```
   缺欄位 → 不警告（待補資料，記於 todo 內容回報區；家畜條目本身也未建，見 tracker 模組後期規劃）；有欄位但陣列長度 ≠ 4 或含非數字（null 除外）→ warning。
6. **物品字串解析與全站物品索引（2026-07-07 新增，動機：喜好→配方→來源查詢鏈）**：
   - content 全站慣例 `中文（日文）` 字串（loves/likes、食譜材料欄、點心名等）解析成 `{ zh, jp }`；含 `＋` 分隔的材料欄先拆項再解析。
   - 建立**物品索引**：鍵以 `name_jp`（日文）為主、中文名為輔——**中文譯名在不同來源不穩定**（實例：characters 的 loves 寫「炊飯（たき込みご飯）」、食譜表寫「什錦炊飯（たき込みご飯）」，僅日文一致），日文鍵優先命中。
   - **`aliases` 選填欄位（2026-07-14 C3 新增）**：連日文都異寫時（魔法紅草（マジックレッド）vs 魔術紅草（マジックレッド草）、王様ミルクティー vs 王様ミルクティ），在條目 frontmatter 登記 `aliases: ["中文（日文）", …]`，解析後併入索引兩鍵；主名優先，別名不覆蓋任何既有鍵。條目內文需同步加異寫說明。
   - 值 = 條目引用（crops／recipes／fishes／…的 slug）。查無 → 保持純文字（同 wikilink 降級規則），不中斷、彙整進 manifest.warnings 供補資料參考。
   - **解析時機裁決（2026-07-07 深度審查 S-1）**：參照解析在 **build 時**完成——管線把 loves/likes/ingredients 解析成連結欄位隨 JSON 輸出、查無進 manifest.warnings（集中待辦）；前端只渲染已解析結果，不在執行期查索引。內容更新本來就要重 build，「資料驅動」語意不變。
7. **決定性輸出**：同樣輸入必產同樣輸出（排序固定），JSON 可 diff、contentHash 穩定。前端顯示 contentHash 的「資料版本標示」**移至後期規劃**（2026-07-07 裁決），MVP 不做。
8. **警告呈現點（2026-07-07 深度審查 S-6）**：warnings 兩個出口——manifest.warnings（資料，供補內容待辦）＋ **build 收尾 console 印彙總摘要**（人工過目點，依 warning 類型分組計數）。

## ⚠️ 內容缺口（阻擋跨條目查詢鏈與食譜 checklist）

- ~~**`fishing/fishes/` 目前是空的**~~（2026-07-12 C4 已補齊：63 筆條目，見 todo C4）。
- ~~**`cooking/recipes/` 目前是空的**~~（2026-07-12 C2 已補齊：273 筆條目，見 todo C2。category 最終採遊戲內 6 分類「主食/沙拉/湯/拼盤/甜點/其他」——原規劃的「沙拉湯」只是同一篇 guide 的包裝，非遊戲分類；`RECIPE_CATEGORY_OPTIONS` 已同步）。
- ~~**商店購買食材/加工品/畜產品無條目**~~（2026-07-14 C3 已補齊：151 筆 items 條目（山道採集物/商店食材/製造機小屋/水車小屋/蜂蜜/畜產品/花束香水）＋ 7 個異寫 aliases，物品索引警告 468→69，見 todo C3）。
- **剩餘 61 則物品索引查無（45 個唯一字串）皆屬既知範疇**：①類別字串（蘑菇類/水果類/蜂蜜類/昆蟲系…約 40 則）——T6.12 類別展開功能的資料面，屆時決定表達方式；②「或」替代鏈 4 則——既有降級設計；③真實資料缺口（竹葉（ササ）/杏桃（あんず）/失敗品/賢者之石/木材/石材等）——各來源均無賣價/取得資料，不猜不建。
- 「蘑菇類（きのこ類）」等**類別食材**：食譜表引用的是類別而非單一物品，ingredients 需支援類別標記（點擊顯示可用蘑菇清單，資料在主食類食譜 guide 已有表）。
- 採集物（山菜等）無結構化條目：食材來源解析先降級為純文字，後期補。

## 狀態機

無。單向批次轉換。

## 後期規劃

- 條目破千時改增量建置＋預建搜尋索引檔。
- guide 內文的章節目錄（TOC）抽取非 MVP。
