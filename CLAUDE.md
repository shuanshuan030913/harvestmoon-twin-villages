# CLAUDE.md

以 `content/`（267+ 篇結構化 markdown）為唯一資料來源的《牧場物語 雙子村》靜態攻略網站：白天查詢工具（NPC／作物／畜牧／料理／魚蟲礦資料、行事曆），晚上玩家存檔（種植畜牧進度追蹤 + 收集 checklist，localStorage 持久化）。

## 憲章位置

- 規格總覽：[.spec/README.md](.spec/README.md)（先讀這份）
- 完整原始規格書：[.spec/PLAN.md](.spec/PLAN.md)
- 各模組細節：[.spec/modules/](.spec/modules/)（game-calendar／content-pipeline／query-system／tracker）
- 視覺設計語言：[DESIGN.md](DESIGN.md)（動任何 UI 樣式前先讀；沒定的先補進去再實作）

## 任務佇列與迴圈規則

**[.spec/todo.md](.spec/todo.md)** 檔頭〈迴圈運行規則〉：本機自駕迴圈，Planner／Implementor／Reviewer 三層自我驗證，任務顆粒度 15–30 分鐘。新開 session 先讀這份，找第一個無未滿足依賴的 `[ ]` 任務認領。

## 先建 todo、後改程式碼（硬性規則）

任何更新一律先在 `.spec/todo.md` 建立 todo 項目記錄，**不得**在同一輪順手動
程式碼；只有使用者明確說明「執行 todo」（或指名該任務 ID 要求動工）才可以
改程式碼。使用者回報問題／提需求時，預設只寫 todo，即使修法看起來很直覺
也一樣，等使用者確認要動工再實作。

## `content/` 唯讀原則

`content/` 目錄在網站開發中**唯讀**，不得改動。發現內容錯誤記入 `.spec/todo.md` 文末〈內容回報區〉，走 vault skill `harvest-moon-twin-villages` 流程修正，不在 code 裡即興改資料。

## 指令表

| 指令 | 用途 |
|------|------|
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 產生正式建置（含未來的 `build:content` 內容管線） |
| `npm run lint` | ESLint 檢查 |
| `npm test` | Vitest（Domain 層 unit test） |
| `npm run preview` | 本地預覽正式建置產物 |

## 命名慣例

- 全站物品/角色字串慣例 `中文（日文）`（全形括號），如「炊飯（たき込みご飯）」。
- 跨來源物品參照以 **`name_jp`（日文）為主鍵**、中文名為輔鍵——中文譯名在不同來源不穩定，日文鍵優先命中。詳見 [content-pipeline.md](.spec/modules/content-pipeline.md) 規則 6。
