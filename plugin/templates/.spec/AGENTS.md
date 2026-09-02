# 项目中心文档

本项目使用 [LumioAgentSpec](https://github.com/Go1c/LumioAgentSpec) 插件提供的调度与编码规程。
**通用规程(调度核心 / 编码约定 / 交回物格式 / 宿主差异)由插件在每次会话注入,本文件不复述**——这里只写本项目独有的东西。

## 项目是什么

<!-- 填写:一句话定位 / 技术栈 / 关键边界与不做什么。 -->

## 收口门槛

<!-- 填写本项目的验证命令,交付前必须全部通过。例: -->

```bash
pnpm lint && pnpm test
```

## 项目专属约定

<!-- 可选。只写与插件通用规程「不同」或「更严」的部分,相同的不要复制过来。
     例:本项目额外要求 E2E 通过才可收口;或本项目自建了 agents/,在此登记名册。 -->

## 知识与决策

- 规范与功能记录:[`knowledge/README.md`](knowledge/README.md)(导航)
- 决策唯一落点:[`decisions/`](decisions/README.md)(ADR,不改写、只新增取代)
- 实现计划:[`plans/`](plans/README.md)(历史记录,日期前缀、不设索引)
- 离线任务卡:[`tasks/`](tasks/README.md)(无内置任务工具的宿主用)
