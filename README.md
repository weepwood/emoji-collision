# Emoji Collision Lab

[![测试并部署 GitHub Pages](https://github.com/weepwood/emoji-collision/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/weepwood/emoji-collision/actions/workflows/deploy-pages.yml)

一个可玩的像素风 Emoji 物理碰撞实验室。抓取、投掷和撞击 Emoji，在足够强烈的碰撞中发现隐藏的组合反应。

## 在线体验

GitHub Pages：`https://weepwood.github.io/emoji-collision/`

## 当前功能

- 基于 Matter.js 的实时物理碰撞、旋转、弹跳和堆积
- 鼠标与触屏拖拽投掷，双击触发冲击波
- 像素化 Emoji 渲染、碰撞形变、粒子和屏幕震动
- 6 组隐藏反应：蒸汽、雨后彩虹、箱中猫、爱心碎片、情绪爆炸、登月成功
- 8-bit Web Audio 合成音效，无外部音频资源
- 碰撞计数、连击、最高连击和反应图鉴
- 重力、弹性、声音、震动和低动态设置
- 移动端布局与 `prefers-reduced-motion` 支持
- GitHub Actions 自动测试、构建并部署到 GitHub Pages

## 技术栈

- Vue 3 + TypeScript
- Vite
- Matter.js
- Canvas 2D
- Vitest
- GitHub Pages

## 本地运行

```bash
npm install
npm run dev
```

## 测试与构建

```bash
npm run test
npm run build
```

## 说明

首版使用低分辨率离屏 Canvas 将系统 Emoji 像素化，尽量兼顾跨平台和零资源依赖。后续可以替换为统一授权的 Sprite Sheet，使不同操作系统上的图形完全一致。
