# Java MCP Server (简体中文)

这是一个基于 Model Context Protocol (MCP) 的服务器，通过与 Eclipse JDT.LS (Java Language Server) 交互，为 AI 编码助手（如 Claude Code, Gemini 等）提供专业的 Java 语言支持。它作为一个桥梁，通过标准化的工具接口，让 AI Agent 能够精准地理解、导航和操作 Java 代码库。

## 🌟 核心特性

- **原生 Java 启动**：直接通过 JVM 启动 Java 语言服务器，绕过了脆弱的脚本包装器（`.bat` 或 `.py`），启动更稳定。
- **环境隔离优化**：自动清理冲突的环境变量（如 `PORT`），有效解决在 MCP Inspector 调试环境下因端口冲突导致的启动失败问题。
- **动态实例隔离**：参考 `jdtls.py` 逻辑，基于工作区路径哈希自动在系统缓存目录创建独立的数据目录，避免工作区锁定及多项目干扰。
- **智能路径推断**：
  - 自动从安装路径识别 JDT.LS 核心组件。
  - 自动定位 Equinox Launcher 及系统相关的配置文件目录。
  - 支持无缝回退：若未配置工作区路径，自动使用当前目录（CWD）。
- **全量 LSP 能力**：支持符号跳转（Definition）、引用查找（References）、悬停文档（Hover）及文件同步等核心功能。
- **跨平台支持**：完美兼容 Windows, macOS 和 Linux。

## 🛠️ 环境要求

- **Node.js**: v18.0.0 或更高版本。
- **Java Development Kit (JDK)**: Java 17 或更高版本（推荐使用 Java 21+）。
- **Eclipse JDT.LS**: 已安装 [Eclipse JDT.LS](https://download.eclipse.org/jdtls/snapshots/?v=latest)。

## 🚀 安装步骤

```bash
git clone <repository-url>
cd java-jdtls-mcp-server
npm install
npm run build
```

## 📖 使用说明

### 在 MCP 客户端中配置

在你的 MCP 配置文件中（如 `claude_desktop_config.json`）添加如下配置：

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
| `java_start` | 初始化并启动 JDT.LS。如果已在运行则会重启。 | `jdtlsHome`, `workspacePath` (可选) |
| `java_restart` | 强制重启 JDT.LS 进程。 | `jdtlsHome`, `workspacePath` (可选) |
| `java_open_file` | 向服务器同步文件内容（didOpen）。 | `filePath`, `content` |
| `java_get_definition` | 获取符号的定义位置。 | `filePath`, `line`, `character` |
| `java_get_references` | 查找符号的所有引用位置。 | `filePath`, `line`, `character` |
| `java_get_hover` | 获取符号的 Javadoc 和类型信息。 | `filePath`, `line`, `character` |

## 🔍 技术细节

### 实例数据存储
为了避免锁定工作区并支持多项目并发，服务器会将 JDT.LS 的内部数据存储在系统标准缓存目录下的哈希目录中：
- **Windows**: `%APPDATA%\jdtls\jdtls-<项目名>-<哈希>`
- **macOS**: `~/Library/Caches/jdtls/jdtls-<项目名>-<哈希>`
- **Linux**: `~/.cache/jdtls/jdtls-<项目名>-<哈希>`

### 编码处理
服务器通过 `JAVA_TOOL_OPTIONS` 强制 JVM 使用 `UTF-8` 编码，确保在不同操作系统环境下源代码和日志传输的准确性。

## 📄 开源协议

本项目采用 ISC 协议授权。
