---
title: 模組規格 — 遊戲日曆
created: 2026-07-07
tags: [game/牧場物語雙子村, project/spec]
---

# 遊戲日曆（Game Calendar）

跨模組共用的 Domain 核心：查詢系統的行事曆頁與追蹤器的日期推進都依賴它。純邏輯、零 I/O、零 UI。

## Entity 欄位

### GameDate

| 欄位 | 型別 | 說明 |
|------|------|------|
| `year` | number ≥ 1 | 遊戲年次 |
| `season` | `"春" \| "夏" \| "秋" \| "冬"` | 季節，順序固定 春→夏→秋→冬 |
| `day` | number，1..SEASON_DAYS | 日 |

### 常數

| 常數 | 值 | 說明 |
|------|-----|------|
| `SEASON_DAYS` | **31**（預設，可設定） | 每季天數。單一定義點，全站唯一來源（2026-07-07 用戶決策：預設 31，之後對照遊戲內月曆確認，若不同只改此處） |
| `SEASONS` | `["春","夏","秋","冬"]` | 季節順序 |

## 核心業務規則

1. **推進（advanceDay）**：`day + 1`；若 `day > SEASON_DAYS` → 進入下一季 `day = 1`；冬季最後一天的下一天 → `year + 1`、春 1。純函數，回傳新 GameDate，不改參數。
2. **日期字串解析（parseSeasonDay）**：frontmatter 的 `birthday`／節慶日期格式為 `"季-日"`（如 `"春-27"`）。parse 失敗（季不在 SEASONS、日超界或非數字）回傳 `null`，呼叫端負責警告，不 throw。
3. **天數差（diffDays）**：兩個 GameDate 之間的絕對天數差（以 SEASON_DAYS 換算），用於「已種植 N 天」等顯示。`b` 早於 `a` 時回傳負數。
4. **序列化**：GameDate 與 JSON 表示 `{year, season, day}` 一對一，存檔直接存物件（見 [tracker.md](./tracker.md)）。
5. **邊界**：所有建構／解析入口都要驗證 `1 ≤ day ≤ SEASON_DAYS`；非法值一律拒絕（回 `null`），不得靜默夾擠（clamp）。

## 狀態機

無（純值物件與純函數）。

## 後期規劃

- 若遊戲實際每季天數與 31 不符：改 `SEASON_DAYS` 一處即可，unit test 用常數而非寫死 31 撰寫。
- 天氣／季節事件表非 MVP。
