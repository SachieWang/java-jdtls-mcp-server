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

如果是使用 Claude Code、Claude Desktop 或其他 MCP 客户端，您需要将其显式配置为 MCP Server。

1. 按照上述步骤完成项目构建（`npm run build`）。
2. 编辑您的客户端配置文件（例如 Claude Desktop 的 `claude_desktop_config.json`）。
3. 添加服务器配置，并直接在 `env` 节点下定义您的全局环境变量：

```json
{
  "mcpServers": {
    "java-mcp-server": {
      "command": "node",
      "args": [
        "/绝对路径/指向/java-jdtls-mcp-server/dist/index.js"
      ],
      "env": {
        "JDTLS_HOME": "D:/software/jdt-language-server-latest",
        "JDTLS_JAVA_HOME": "D:/software/java/jdk-23.0.1",
        "JDTLS_JAVA_RUNTIMES": "[{\"name\":\"JavaSE-1.8\",\"path\":\"C:/Program Files/Java/jdk1.8.0_361\"},{\"name\":\"JavaSE-17\",\"path\":\"D:/software/jdk-17.0.7\"}]",
        "JDTLS_MAVEN_USER_SETTINGS": "D:/software/apache-maven-3.9.3/conf/settings.xml",
        "JDTLS_MAVEN_GLOBAL_SETTINGS": "D:/software/apache-maven-3.9.3/conf/settings.xml"
      }
    }
  }
}
```

*注意：使用 Claude Code 时，项目级的 `.env` 文件逻辑（如 `JAVA_PROJECT=true`）可能不会被原生加载（取决于具体的 MCP 客户端实现）。您可能需要直接在客户端配置中管理项目特定的变量。*

### 1. 全局配置 (用户级 `.env`)

全局环境变量推荐配置一些通用的路径信息，以避免在每个项目中重复配置。全局配置文件的主路径通常位于：`USER_HOME\.gemini\extensions\java-jdtls-mcp-server\.env`（其中 `USER_HOME` 为当前用户目录，如 `C:\Users\用户1`）。

**配置方式：**
1. **安装时配置 (推荐):** 如果在使用 Gemini CLI 时启用了 `experimental.extensionConfig` 配置项，初次安装本插件时会提示您输入以下环境变量。输入完毕后，Gemini CLI 会自动在上述路径生成 `.env` 文件。
2. **手动配置:** 您也可以自行在上述路径创建 `.env` 文件，并填写推荐的全局配置信息。

**推荐全局配置示例：**
```ini
JDTLS_HOME=D:/software/jdt-language-server-latest
JDTLS_JAVA_HOME=D:/software/java/jdk-23.0.1
JAVA_WORKSPACE_PATH=
JDTLS_JAVA_RUNTIMES=[{"name":"JavaSE-1.8","path":"C:/Program Files/Java/jdk1.8.0_361"},{"name":"JavaSE-17","path":"D:/software/jdk-17.0.7"}]
JDTLS_MAVEN_USER_SETTINGS=D:/software/apache-maven-3.9.3/conf/settings.xml
JDTLS_MAVEN_GLOBAL_SETTINGS=D:/software/apache-maven-3.9.3/conf/settings.xml
```

| 变量名 | 描述 | 是否必填 | 默认值 |
| :--- | :--- | :--- | :--- |
| `JDTLS_HOME` | JDT.LS 安装根目录路径 | **是** | - |
| `JDTLS_JAVA_HOME` | JDT.LS 专用的 JDK 路径 (覆盖 `JAVA_HOME`) | 否 | 系统 `JAVA_HOME` |
| `JAVA_WORKSPACE_PATH` | Java 项目的根目录路径 | 否 | 当前工作目录 (CWD) |
| `JDTLS_JAVA_RUNTIMES` | 多版本 Java 运行时配置 (JSON 数组) | 否 | - |
| `JDTLS_MAVEN_USER_SETTINGS` | 自定义 Maven 用户 `settings.xml` 路径 | 否 | - |
| `JDTLS_MAVEN_GLOBAL_SETTINGS`| 自定义 Maven 全局 `settings.xml` 路径 | 否 | - |
| `JDTLS_MAVEN_OFFLINE` | 是否开启 Maven 离线模式 (`true`/`false`) | 否 | `false` |

### 2. 项目级配置 (项目级 `.env`)

项目级别的 env 信息是由 Gemini CLI 等 Agent 工具加载读取的。例如，使用 Gemini CLI 时，项目级别的 env 路径通常为：`[项目根目录]/.gemini/.env`。

为了避免在非 Java 项目中意外启动重量级的 Java 语言服务器，您**必须在项目级别显式激活**。请在项目级别的 `.env` 配置文件中添加以下内容：

```ini
# 必填项：声明当前为 Java 项目，允许自动启动 JDT.LS
JAVA_PROJECT=true
```
*(可选)* 您也可以在此项目级的 `.env` 文件中覆盖上述任何全局环境变量，以实现针对当前环境的隔离与自定义设置。

## 🧩 专家技能与 AI 规则 (Skills & Rules)

本项目在 `skills/` 目录下提供了一套高阶**专家技能 (Expert Skills)**。这些技能本质上是经过优化的指令集，指导 AI Agent 以最高效的方式与 Java 语言服务器交互，避免常见陷阱（如重复启动服务器）并提升代码分析的准确性。

| 技能名称 | 专家指南作用 | 核心优势 |
| :--- | :--- | :--- |
| `java-lifecycle` | 服务器生命周期管理 | 规范化 JDT.LS 的启动、状态检查及错误恢复流程。 |
| `java-navigation` | 代码智能导航 | 优化查找定义、引用和符号的策略。 |
| `java-project-load`| 项目索引加载 | 加速 Maven 项目加载，无需手动扫描文件。 |
| `java-verification`| 代码诊断与校验 | 强制执行实时错误检查，确保代码变更的正确性。 |

### 🚀 在 Gemini CLI 中使用

Gemini CLI 原生支持这些技能。安装扩展后，它们会自动加载或按需激活：
- `activate_skill java-lifecycle`
- `activate_skill java-navigation`

### 🤖 在 Claude Code 或其他 MCP 客户端中使用

虽然 Claude Code 不支持 Gemini 的扩展包协议，但它可以通过其 **Rules (规则)** 系统完美集成这些技能：

1.  **项目级规则**：将 `skills/` 目录下各 `SKILL.md` 文件的核心内容手动复制或引用到您 Java 项目根目录的 `.clauderules` 文件中。
2.  **全局规则**：或者，您可以将这些指令添加到 Claude 的全局配置文件中。

通过将这些规则放置在 `.clauderules` 中，Claude Code 在检测到当前处于该项目环境时，会自动遵循这些“专家工作流”，从而表现得更像一名资深的 Java 工程师。

---

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
