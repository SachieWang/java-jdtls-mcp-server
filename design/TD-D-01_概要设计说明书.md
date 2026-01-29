# Java MCP Server 概要设计说明书

----------

| **Document Form** |            |
| ----------------- | ---------- |
| **Subject**       | Java MCP Server 概要设计说明书 |
| **Version**       | 1.0.0      |
| **Content**       | Java MCP Server 系统架构与设计 |
| **Key Words**     | MCP, Java, JDT.LS, LSP, AI Agent |
| **Reference**     | 需求分析报告, MCP 协议文档, LSP 协议文档 |
| **Date**          | 2026-01-29 |
| **Owner**         | 项目组        |
| **Update by**     | Gemini CLI |

----------

> 请按照下述表单如实填写修订记录。

| **修订记录** |            |                     |            |                             |
| -------- | ---------- | ------------------- | ---------- | --------------------------- |
| **修订版本** | **修订方式**   | **修订人员**            | **修订日期**   | **修订内容**                    |
| V1.0     | AI生成       | Gemini CLI          | 2026-01-29 | 初版概要设计文档，基于现有代码库生成          |
|          |            |                     |            |                             |

**目  录**

- [Java MCP Server 概要设计说明书](#java-mcp-server-概要设计说明书)
- [文档撰写及关键评审点](#文档撰写及关键评审点)
- [1 引言](#1-引言)
  - [1.1 编写目的](#11-编写目的)
  - [1.2 背景](#12-背景)
  - [1.3 定义](#13-定义)
  - [1.4 参考资料](#14-参考资料)
- [2 总体设计](#2-总体设计)
  - [2.1 系统总体结构](#21-系统总体结构)
    - [2.1.1 系统结构](#211-系统结构)
    - [2.1.2 系统对象描述](#212-系统对象描述)
    - [2.1.3 系统对象关系表](#213-系统对象关系表)
    - [2.1.4 系统运行环境](#214-系统运行环境)
    - [2.1.5 可伸缩性考虑](#215-可伸缩性考虑)
  - [2.2 人工处理过程](#22-人工处理过程)
  - [2.3 尚未解决的问题](#23-尚未解决的问题)
- [3 接口设计](#3-接口设计)
  - [3.1 对外输出的接口](#31-对外输出的接口)
  - [3.2 对外依赖的接口](#32-对外依赖的接口)
  - [3.3 内部接口](#33-内部接口)
- [4 运行设计](#4-运行设计)
  - [4.1 运行模块组合](#41-运行模块组合)
  - [4.2 运行时间](#42-运行时间)
  - [4.3 运行控制](#43-运行控制)
- [5 系统安全性设计](#5-系统安全性设计)
  - [5.1 系统故障预防与恢复](#51-系统故障预防与恢复)
  - [5.2 用户管理与权限控制](#52-用户管理与权限控制)
  - [5.3 数据备份与恢复](#53-数据备份与恢复)
- [6 系统出错处理设计](#6-系统出错处理设计)
  - [6.1 出错信息及出错设计](#61-出错信息及出错设计)
  - [6.2 补救措施](#62-补救措施)
- [7 系统维护设计](#7-系统维护设计)
  - [7.1 数据维护](#71-数据维护)
  - [7.2 功能维护](#72-功能维护)

----------

# 文档撰写及关键评审点

> 请文档作者及评审官在撰写及评审文档时重点关注以下要点

| **对应概设文档章节** | **关键评审点**                                   |
| ------------ | ------------------------------------------- |
| 0 全局         | **内容**：内容主次分明、由浅入深，外部引用能够链接说明出处，整体文档成体系     |
| 1 引言         | **目的**：清晰的介绍了产品目的、背景，能让人清晰了解上下文           |
| 2.1.1 系统结构   | **结构**：模块结构、外部的依赖关系、通信关系图清晰准确               |
| 3 接口设计       | **接口**：各个模块之间的接口、接口协议定义清晰准确                 |
| 4 运行设计       | **内容**：包括系统的启动阶段、运行时、关闭阶段的设计                |
| 7 系统维护设计     | **部署**：清楚定义部署环境及依赖                         |

----------

# 1 引言

## 1.1 编写目的

本概要设计说明书的编写目的是为了说明 **Java MCP Server** 的系统总体技术方案。本文档详细描述了系统的基本处理流程、模块划分、功能分配、接口设计、运行设计和出错处理设计。

本系统旨在为 AI Agent 提供专业的 Java 语言智能支持，通过集成 Eclipse JDT.LS，实现代码导航、语法验证、符号搜索等 IDE 级功能。本文档将作为后续详细设计、编码实现及测试的依据。

适用读者：软件架构师、Java 开发人员、AI Agent 开发者、测试人员。

## 1.2 背景

随着 AI 辅助编程的普及，AI Agent 需要深入理解代码库的上下文和语法结构。通用的文本分析工具无法满足复杂的 Java 项目需求（如依赖解析、跨文件符号跳转）。**Java MCP Server** 项目应运而生，它充当 AI Agent 与 Java 代码库之间的桥梁，利用成熟的 LSP（Language Server Protocol）技术，提供精准的代码分析能力。

## 1.3 定义

| **名称** | **说明** |
| ------ | ------ |
| MCP    | Model Context Protocol，模型上下文协议，用于 AI 模型与外部工具交互的标准协议。 |
| JDT.LS | Eclipse Java Development Tools Language Server，基于 Eclipse JDT 的 Java 语言服务器。 |
| LSP    | Language Server Protocol，语言服务器协议，定义了编辑器与语言服务器之间的通信标准。 |
| Gemini | 本项目支持的 AI CLI 环境。 |

## 1.4 参考资料

| 编号  | 名称  | 作者  | 日期  | 密级  |
| --- | --- | --- | --- | --- |
| 1   | Model Context Protocol Specification | Anthropic/MCP Team | -   | 公开  |
| 2   | Language Server Protocol Specification | Microsoft | -   | 公开  |
| 3   | Eclipse JDT.LS Documentation | Eclipse Foundation | -   | 公开  |

------------

# 2 总体设计

## 2.1 系统总体结构

### 2.1.1 系统结构

系统整体架构采用 **Client-Server-Backend** 模式：

1.  **Client (AI Agent/Gemini CLI)**: 发起 MCP 请求（如“查找定义”、“读取文件”）。
2.  **MCP Server (Node.js)**: 系统的核心，负责解析 MCP 请求，管理 JDT.LS 进程生命周期，并将请求转换为 LSP 协议转发给 JDT.LS。
3.  **Backend (JDT.LS)**: 实际执行 Java 语言分析的引擎，运行在独立的 JVM 进程中。

```mermaid
graph LR
    A["AI Agent / Gemini CLI"] -- MCP Protocol --> B["Java MCP Server (Node.js)"]
    B -- LSP (JSON-RPC) --> C["Eclipse JDT.LS (JVM)"]
    C -- File Access --> D["Java Project Source Code"]
```

### 2.1.2 系统对象描述

| **编号** | **名称** | **描述** |
| ------ | ------ | ------ |
| 01     | `index.ts` (Entry Point) | 程序入口，负责初始化 MCP Server 实例，加载配置，注册工具（Tools）。 |
| 02     | `language-server.ts` | 核心逻辑类，封装了 JDT.LS 的进程管理（启动、停止、重启）、LSP 消息通信（发送 Request/Notification，接收 Response）。 |
| 03     | `skills/` Modules | 包含特定的业务逻辑技能，如生命周期管理 (`java-lifecycle`)、代码导航 (`java-navigation`)、代码验证 (`java-verification`)。 |
| 04     | MCP Tools | 暴露给 AI 的具体功能函数，如 `java_start`, `java_search_symbols`, `java_get_diagnostics` 等。 |

### 2.1.3 系统对象关系表

| 模块代码/名称 | 基本属性 | 架构属性 | 状态  | 来源  | 依赖组件 | 说明  |
| ------- | ---- | ---- | --- | --- | ---- | --- |
| Java MCP Server | Service, Console | Node.js, Cross-platform | 已有 | 自研 | `@modelcontextprotocol/sdk`, `vscode-languageserver-protocol` | 核心服务 |
| Eclipse JDT.LS | Service | JVM | 已有 | 第三方 | JDK 17+ | Java 语言分析引擎 |
| Agent Skills | Library | Markdown/Docs | 已有 | 自研 | - | AI 引导技能文档 |

### 2.1.4 系统运行环境

| 应用名称 | 硬件环境 | 软件环境 |
| ---- | ---- | ---- |
| Java MCP Server | CPU: 2 Core+ <br> RAM: 4GB+ (取决于项目规模) | OS: Windows/Linux/macOS <br> Runtime: Node.js v18+ <br> JDK: Java 17+ (推荐 Java 21) <br> JDT.LS: 最新快照版 |

### 2.1.5 可伸缩性考虑

*   **垂直扩展**：通过增加分配给 JVM 的内存（`Xmx`）来支持大型 Maven 项目的索引。
*   **水平扩展**：当前设计为单实例服务于单个 Agent 会话。未来可通过 MCP Server 路由机制支持多项目同时分析。

## 2.2 人工处理过程

本系统主要为自动化工具，但在以下场景可能涉及人工介入：
1.  **环境配置**：用户需手动安装 JDK 和 JDT.LS，并配置环境变量（如 `JDTLS_HOME`）。
2.  **故障排查**：当 JDT.LS 启动失败时，用户需查看日志进行排查。

## 2.3 尚未解决的问题

1.  目前对 Gradle 项目的支持尚未显式验证，主要侧重于 Maven。
2.  对于超大型单体项目，首次索引时间可能较长，需优化进度反馈机制。

-------------

# 3 接口设计

## 3.1 对外输出的接口

系统通过 MCP 协议对外暴露以下工具（Tools）：

| 工具名称 | 功能描述 | 关键参数 |
| :--- | :--- | :--- |
| `java_start` | 启动或重启 JDT.LS 服务 | `jdtlsHome`, `workspacePath` |
| `java_load_maven_project` | 加载并索引整个 Maven 项目 | `projectPath` |
| `java_search_symbols` | 全局符号搜索 | `query` |
| `java_get_file_symbols` | 获取文件内符号列表 | `filePath` |
| `java_open_file` | 打开文件以启用诊断 | `filePath`, `content` |
| `java_get_diagnostics` | 获取文件编译错误/警告 | `filePath` |
| `java_get_definition` | 跳转到定义 | `filePath`, `line`, `character` |
| `java_get_references` | 查找引用 | `filePath`, `line`, `character` |
| `java_get_hover` | 获取悬停文档信息 | `filePath`, `line`, `character` |

## 3.2 对外依赖的接口

系统依赖 Eclipse JDT.LS 提供的 LSP 接口：
*   `initialize`: 初始化服务器。
*   `textDocument/didOpen`: 通知文件打开。
*   `textDocument/didChange`: 通知文件修改。
*   `workspace/symbol`: 工作区符号搜索。
*   `textDocument/definition`: 定义跳转。
*   `java/projectConfiguration/update`: 更新项目配置（JDT.LS 扩展）。

## 3.3 内部接口

`JavaLanguageServer` 类提供内部方法供 MCP Tools 调用：
*   `start(params)`: 启动子进程。
*   `sendRequest(method, params)`: 发送 LSP 请求并等待响应。
*   `sendNotification(method, params)`: 发送 LSP 通知。

# 4 运行设计

## 4.1 运行模块组合

系统运行时，Node.js 主进程与 Java 子进程（JDT.LS）并发运行。Node.js 进程负责 stdio/socket 通信，Java 进程负责计算密集型的代码分析。

## 4.2 运行时间

| 运行模块组合名称 | 模块名称 | 运行时间 |
| -------- | ---- | ---- |
| 启动阶段 | `java_start` -> JDT.LS Process | 约 5-15 秒（取决于 JVM 启动及工作区初始化） |
| 索引阶段 | `java_load_maven_project` | 取决于项目大小，中型项目约 10-60 秒 |
| 查询阶段 | `java_get_hover` / `java_get_definition` | 毫秒级 (< 200ms) |

## 4.3 运行控制

1.  **启动**：通过 `java_start` 工具触发。系统会检查状态，若已运行则根据参数决定是否重启。
2.  **交互**：AI Agent 按需调用工具，Server 转换为 LSP 请求。
3.  **关闭**：MCP 连接断开时，Node.js 进程退出，自动销毁 Java 子进程。

# 5 系统安全性设计

## 5.1 系统故障预防与恢复

| 出错现象 | 可能原因 | 措施 |
| --- | --- | --- |
| JDT.LS 进程意外退出 | 内存溢出或 JVM 崩溃 | MCP Server 捕获进程退出事件，记录错误日志。用户调用 `java_restart` 可重新拉起服务。 |
| 端口冲突 | 调试端口被占用 | 启动前自动清理相关的环境变量（如 `PORT`），使用随机端口或标准输入输出通信。 |

## 5.2 用户管理与权限控制

本系统作为本地开发工具运行，继承当前操作系统用户的权限。系统操作范围仅限于用户指定的工作区目录及 JDK/JDT.LS 安装目录，不涉及额外的用户管理。

## 5.3 数据备份与恢复

系统生成的索引数据存储在 JDT.LS 的工作区缓存中（通常位于 `.gemini/tmp` 下）。这些数据是临时的，重启或清理缓存后可重新生成，无需专门备份。

# 6 系统出错处理设计

## 6.1 出错信息及出错设计

所有工具调用均遵循 MCP 错误处理规范。

| 错误类型 | 错误信息输出格式 | 含义 | 处理方法 |
| ---- | -------- | --- | ---- |
| JDT.LS 未就绪 | `Server is not ready. Status: STOPPED` | 服务未启动 | 提示用户先调用 `java_start` |
| 参数错误 | `Invalid params: ...` | 输入参数不符合 Schema | 检查参数类型及必填项 |
| 超时 | `Request timed out` | LSP 请求响应超时 | 检查 JDT.LS 是否卡死，重试或重启 |

## 6.2 补救措施

*   **状态重置**：提供 `java_restart` 工具，允许强制杀死旧进程并启动新实例，解决状态不一致问题。

# 7 系统维护设计

## 7.1 数据维护

系统运行期间产生的日志（stdio）可用于排查问题。JDT.LS 的工作区数据相互隔离（基于项目路径哈希），避免不同项目间的干扰。

## 7.2 功能维护

*   **扩展能力**：通过 `gemini-extension.json` 可定义新的 MCP 工具或环境变量配置。
*   **技能更新**：`skills/` 目录下的 Markdown 文件可独立更新，无需重新编译代码即可调整 AI 的操作流程。
