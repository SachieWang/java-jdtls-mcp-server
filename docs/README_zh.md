# Java MCP Server & Gemini Extension (简体中文)

[English](../README.md) | [简体中文](./README_zh.md)

本项目是一个高性能的 AI Agent 与 Java 代码库之间的桥梁。它同时支持 **Model Context Protocol (MCP)** 和 **Gemini CLI Extension** 规范，通过 Eclipse JDT.LS 提供专业级的 Java 语言智能。

## 🌟 核心特性

- **Gemini Extension & Agent Skills**：内置结构化的 [Agent Skills](../skills/)（导航、验证、生命周期管理），确保 AI Agent 遵循最优工作流。
- **原生 JDT.LS 启动**：直接通过 JVM 启动 Java 语言服务器，绕过不稳定的脚本包装器，性能更强，启动更稳。
- **实时代码诊断**：新增 `java_get_diagnostics` 工具，支持实时获取编译错误和警告，帮助 AI Agent 自我验证代码变更。
- **动态实例隔离**：基于工作区路径哈希自动创建独立的数据目录，支持多项目并发开发，防止工作区锁定。
- **环境隔离优化**：自动清理 `PORT` 等冲突环境变量，确保 StdIO 通信的可靠性。
- **全量 LSP 能力**：支持定义跳转、引用查找、Javadoc 悬停说明以及高效的文件同步。

## 🛠️ 环境要求

- **Node.js**: v18.0.0 或更高版本。
- **Java Development Kit (JDK)**: Java 17 或更高版本（推荐使用 Java 21+）。
- **Eclipse JDT.LS**: 已安装 [Eclipse JDT.LS](https://download.eclipse.org/jdtls/snapshots/?v=latest)。

## 🚀 安装与配置

### 作为 Gemini CLI 扩展使用

本项目针对 Gemini CLI 进行了深度优化，包含 `gemini-extension.json` 和 `GEMINI.md` 配置。

```bash
# 克隆仓库
git clone <repository-url>
cd java-jdtls-mcp-server
npm install && npm run build

# 在 Gemini CLI 中添加该扩展
# CLI 将自动识别内置的 Agent Skills 和指令规则
```

### 作为 Claude Code 或其他 MCP 客户端使用

```bash
# 通过 Git 直接全局安装
npm install -g git+https://git.wind.com.cn/zxwang.sachiew/java-jdtls-mcp-server.git
```

## 📖 详细配置

### MCP 客户端配置 (例如 `claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "java": {
      "command": "node",
      "args": ["D:/path/to/java-mcp-server/dist/index.js"],
      "env": {
        "JDTLS_HOME": "D:/tools/jdtls",
        "JAVA_WORKSPACE_PATH": "C:/Projects/MyJavaProject",
        "JAVA_HOME": "C:/Program Files/Java/jdk-21"
      }
    }
  }
}
```

### 环境变量说明

| 变量名 | 描述 | 是否必填 | 默认值 |
| :--- | :--- | :--- | :--- |
| `JDTLS_HOME` | JDT.LS 安装根目录路径 | **是** (用于自动启动) | - |
| `JAVA_WORKSPACE_PATH` | Java 项目的根目录路径 | 否 | 当前工作目录 (CWD) |
| `JAVA_HOME` | JDK 的安装路径 | 否 | 系统默认 `JAVA_HOME` |

## 🧰 可用工具

| 工具名称 | 功能描述 | 核心参数 |
| :--- | :--- | :--- |
| `java_start` | 初始化并启动 JDT.LS。 | `jdtlsHome`, `workspacePath` |
| `java_restart` | 强制重启 JDT.LS 进程。 | `jdtlsHome`, `workspacePath` |
| `java_open_file` | 向服务器同步文件内容。 | `filePath`, `content` |
| `java_get_diagnostics` | **新增!** 获取文件的错误和警告。 | `filePath` |
| `java_get_definition` | 获取符号的定义位置。 | `filePath`, `line`, `character` |
| `java_get_references` | 查找符号的所有引用。 | `filePath`, `line`, `character` |
| `java_get_hover` | 获取符号的 Javadoc 和类型信息。 | `filePath`, `line`, `character` |

## 🧠 Agent Skills

`skills/` 目录包含了专门的 Markdown 文档，引导 AI Agent 高效使用这些工具：

- **[代码导航](../skills/java-navigation/SKILL.md)**：探索代码库的策略。
- **[代码验证](../skills/java-verification/SKILL.md)**：通过诊断工具自检代码正确性的流程。
- **[生命周期](../skills/java-lifecycle/SKILL.md)**：服务器启动与异常恢复处理。

## 📄 开源协议

本项目采用 ISC 协议授权。
