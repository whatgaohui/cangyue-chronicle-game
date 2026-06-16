# 苍月纪元 · Cang Yue Chronicle

一款基于 Next.js 15 + TypeScript + Canvas 2D 的 2D 复古 MMORPG 单机/弱联网游戏。融合传奇类游戏的经典玩法（红蓝药水、技能栏、自动攻击、副本、装备强化、套装属性等）与苍月世界观的原创剧情。

## 技术栈

- **框架**：Next.js 15（App Router）+ React 19
- **语言**：TypeScript 5
- **样式**：Tailwind CSS 4 + shadcn/ui
- **渲染**：Canvas 2D（瓦片地图 + 实体精灵图）
- **数据**：Prisma ORM + SQLite（本地存档）
- **包管理**：Bun（兼容 npm）

## 快速开始

### 1. 安装依赖

```bash
bun install
# 或
npm install
```

### 2. 初始化数据库

```bash
cp .env.example .env
# 编辑 .env 调整 DATABASE_URL（默认 ./db/custom.db）

bunx prisma db push
bunx prisma generate
```

### 3. 启动开发服务器

```bash
bun run dev
# 或
npm run dev
```

打开 http://localhost:3000 即可开始游戏。

### 4. 生产构建

```bash
bun run build
bun run start
```

## 项目结构

```
.
├── src/
│   ├── app/                    # Next.js App Router 页面
│   ├── components/
│   │   ├── game/               # 游戏专用组件
│   │   │   ├── GameCanvas.tsx  # 主画布 + 游戏循环 + 输入处理
│   │   │   ├── HUD.tsx         # 顶层 UI（状态栏/技能栏/背包/NPC对话等）
│   │   │   └── DraggableWindow.tsx
│   │   └── ui/                 # shadcn/ui 基础组件
│   ├── game/
│   │   ├── data/               # 静态数据（地图/怪物/物品/技能/NPC）
│   │   ├── engine/             # 引擎（渲染器/战斗计算/寻路）
│   │   └── store/              # Zustand 全局状态
│   ├── hooks/                  # 通用 React Hooks
│   └── lib/                    # 工具库
├── prisma/                     # 数据库 schema
├── public/
│   ├── icons/                  # UI 图标
│   └── sprites/                # 角色/怪物/NPC 精灵图
├── scripts/                    # 构建/启动脚本
├── mini-services/              # 辅助微服务
└── next.config.ts              # Next.js 配置
```

## 核心玩法

| 系统 | 说明 |
|------|------|
| **三大职业** | 战士（近战物理）/ 法师（远程法术）/ 道士（召唤辅助） |
| **战斗** | 键盘 WASD 移动，鼠标点击锁定，空格攻击，1-8 释放技能 |
| **快捷栏** | Q/E 快速使用红蓝药水，F 与 NPC 互动，Tab 锁定附近怪物 |
| **装备** | 武器/头盔/项链/衣服/手镯/腰带/靴子/戒指 8 部位 + 套装属性 |
| **强化系统** | 强化 / 重铸 / 觉醒 / 奥义 / 修理 |
| **副本** | 多人副本挑战 + Boss 计时器 |
| **自动攻击** | 点开 AUTO 后点击怪物自动锁定并追击 |
| **GM 模式** | 聊天框输入 `/gm` 开启调试面板 |

## 快捷键

| 按键 | 功能 |
|------|------|
| WASD / 方向键 | 角色移动 |
| 1-8 | 释放对应技能栏技能 |
| Q / E | 快速使用红药 / 蓝药 |
| F | 与最近的 NPC 互动 |
| Tab | 锁定 10×10 范围内最近的怪物 |
| I / C / K | 背包 / 角色 / 技能面板 |
| M / N | 大地图 / 小地图开关 |
| J | 副本面板 |
| 空格 | 普通攻击 |
| Esc | 取消目标 / 关闭对话 |

## 部署说明

### 使用 Caddy 反向代理（可选）

仓库根目录提供了 `Caddyfile` 示例，可配合 `custom-server.js` 自定义 Node 服务器运行：

```bash
bun run build
node custom-server.js
# Caddy 监听 80/443，反代到 3000
```

### 数据持久化

- 玩家存档存储在 `db/custom.db`（默认），需定期备份
- 生产环境建议改用 PostgreSQL（修改 `prisma/schema.prisma` 的 `datasource` 和 `.env`）

## 贡献

欢迎提交 Issue 和 PR。

## License

MIT
