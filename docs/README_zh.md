# Java MCP Server & Gemini Extension (简体中文)

[English](../README.md) | [简体中文](./README_zh.md)

本项目是一个高性能的 AI Agent 与 Java 代码库之间的桥梁。它同时支持 **Model Context Protocol (MCP)** 和 **Gemini CLI Extension** 规范，通过 Eclipse JDT.LS 提供专业级的 Java 语言智能。

## 🌟 核心特性

- **Gemini Extension & Agent Skills**：内置结构化的 [Agent Skills](../skills/)（导航、验证、生命周期管理），确保 AI Agent 遵循最优工作流。
- **原生 JDT.LS 启动**：直接通过 JVM 启动 Java 语言服务器，性能更强，启动更稳。
- **企业级项目分析**：支持加载整个 Maven 项目，实现全库范围内的依赖解析和符号索引。
- **实时代码诊断**：支持实时获取编译错误和警告，帮助 AI Agent 自我验证代码变更。
- **环境与实例隔离**：基于工作区路径哈希创建独立数据目录，并自动清理冲突环境变量（如 `PORT`），确保通信可靠。
- **全量 LSP 能力**：支持定义跳转、引用查找、Javadoc 悬停、全局符号搜索以及文件符号提取。

## 🛠️ 环境要求

- **Node.js**: v18.0.0 或更高版本。
- **Java Development Kit (JDK)**: Java 17 或更高版本（推荐使用 Java 21+）。
- **Eclipse JDT.LS**: 已安装 [Eclipse JDT.LS](https://download.eclipse.org/jdtls/snapshots/?v=latest)。

## 🚀 安装与配置

### 作为 Gemini CLI 扩展使用

本项目针对 Gemini CLI 进行了深度优化。

```bash
# 克隆仓库
git clone <repository-url>
cd java-jdtls-mcp-server
npm install && npm run build

# 安装为 Gemini 扩展
gemini extensions install .
```

### 作为 Claude Code 或其他 MCP 客户端使用

```bash
# 在您的 MCP 客户端（如 Claude Desktop）中进行配置
# 在配置文件中添加相应的 entry 即可
```

## 📖 详细配置

### 环境变量说明

服务器支持从**自身安装目录**下的 `.env` 文件加载环境变量。本地 `.env` 中的值将优先于系统环境变量。

| 变量名 | 描述 | 是否必填 | 默认值 |
| :--- | :--- | :--- | :--- |
| `JDTLS_HOME` | JDT.LS 安装根目录路径 | **是** (用于自动启动) | - |
| `JDTLS_JAVA_HOME` | JDT.LS 专用的 JDK 路径 (覆盖 `JAVA_HOME`) | 否 | 系统 `JAVA_HOME` |
| `JDTLS_JAVA_RUNTIMES` | 多版本 Java 运行时配置 (JSON 数组) | 否 | - |
| `JDTLS_MAVEN_USER_SETTINGS` | 自定义 Maven `settings.xml` 路径 | 否 | - |
| `JDTLS_MAVEN_OFFLINE` | 是否开启 Maven 离线模式 (`true`/`false`) | 否 | `false` |
| `JAVA_WORKSPACE_PATH` | Java 项目的根目录路径 | 否 | 当前工作目录 (CWD) |

### `.env` 文件示例

```ini
JDTLS_HOME=/path/to/jdtls
JDTLS_JAVA_HOME=/path/to/jdk-21
JAVA_WORKSPACE_PATH=/path/to/my-java-project
# 支持多版本 JDK 自动映射与自定义 Maven
JDTLS_JAVA_RUNTIMES=[{"name":"JavaSE-1.8","path":"/path/to/jdk-8"},{"name":"JavaSE-21","path":"/path/to/jdk-21","default":true}]
JDTLS_MAVEN_USER_SETTINGS=/path/to/maven/conf/settings.xml
JDTLS_MAVEN_OFFLINE=false
```

## 🧰 可用工具

| 工具名称 | 功能描述 | 核心参数 |
| :--- | :--- | :--- |
| `java_start` | 初始化并启动 JDT.LS。如果已运行则重启。 | `jdtlsHome`, `workspacePath`, `javaHome` |
| `java_restart` | 强制重启 JDT.LS 进程。 | `jdtlsHome`, `workspacePath`, `javaHome` |
| `java_load_maven_project` | **新增!** 加载整个 Maven 项目并建立符号索引。 | `projectPath` |
| `java_search_symbols` | **新增!** 在工作区全局范围内搜索符号。 | `query` |
| `java_get_file_symbols` | **新增!** 提取单个文件内的所有符号（类/方法等）。 | `filePath` |
| `java_open_file` | 同步文件内容（获取诊断信息前必须调用）。 | `filePath`, `content` |
| `java_get_diagnostics` | 获取特定文件的错误和警告。 | `filePath` |
| `java_get_definition` | 获取符号的定义位置。 | `filePath`, `line`, `character` |
| `java_get_references` | 查找符号的所有引用。 | `filePath`, `line`, `character` |
| `java_get_hover` | 获取符号的类型信息和文档说明。 | `filePath`, `line`, `character` |

## 🧠 Agent Skills

`skills/` 目录包含了专门的 Markdown 文档，引导 AI Agent 高效使用这些工具：

- **[代码导航](../skills/java-navigation/SKILL.md)**：探索代码库及使用符号搜索的策略。
- **[代码验证](../skills/java-verification/SKILL.md)**：通过诊断工具自检代码正确性的工作流。
- **[生命周期](../skills/java-lifecycle/SKILL.md)**：服务器启动与自动启动配置处理。

## 📚 设计文档

本项目遵循规范的设计流程，详细的技术文档请参阅 `design/` 目录：

- **[概要设计说明书](../design/TD-D-01_概要设计说明书.md)**：涵盖系统架构、核心模块划分及外部接口处理。
- **[详细设计说明书](../design/TD-D-02_详细设计说明书.md)**：包含类模型、时序图以及 `JavaLanguageServer` 的内部实现细节。

## 📄 开源协议

本项目采用 ISC 协议授权。
