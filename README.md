# harvestmoon-twin-villages

《牧場物語 雙子村》（ふたごの村 / Tale of Two Towns）中文攻略網站。

## 現況

內容累積階段。`content/` 是所有攻略內容的 source of truth；前端網站（React + Vite）尚未建立。

## 內容結構

```
content/
├── basics/        # 新手向（操作、初期、自宅配置）
├── farming/       # 種植系統（guide + crops）
├── livestock/     # 畜牧系統（guide + animals）
├── mining/        # 採礦系統（guide + minerals）
├── cooking/       # 料理系統（guide + recipes）
├── fishing/       # 釣魚系統（guide + fishes）
├── bugs/          # 捕蟲系統（guide + insects）
├── romance/       # 戀愛系統（guide，角色資料在 characters/）
├── life/          # 人生系統（guide + festivals）
├── villages/      # 兩村介紹
└── characters/    # 所有角色（村民 + 可攻略對象）
```

每個系統內：
- `guide/` 放教學文章
- `<entries>/` 放單一實體的資料條目（每檔一個 entity）

## 撰寫與擷取

內容主要透過 vault skill `harvest-moon-twin-villages` 從外部攻略網站擷取後寫入這裡。
也可以直接用 Obsidian 把這個 `content/` 資料夾當 vault 開啟編輯。

frontmatter schema 見 vault 的 `.claude/skills/harvest-moon-twin-villages/SKILL.md`。
