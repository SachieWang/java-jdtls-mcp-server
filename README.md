# Java MCP Server

[English](./README.md) | [简体中文](./docs/README_zh.md)

This is a Model Context Protocol (MCP) server that provides professional Java language features by interfacing with the Eclipse JDT.LS (Java Language Server). It acts as a bridge, allowing AI agents like Claude Code, Gemini, and other MCP clients to understand and navigate Java codebases with high precision.

## 🌟 Key Features

- **Native JDT.LS Launch**: Directly launches the Java Language Server via JVM, bypassing fragile shell wrappers (`.bat` or `.py`) for better stability.
- **Environment Isolation**: Automatically clears conflicting environment variables (like `PORT`) often injected by MCP Inspector, ensuring reliable StdIO communication.
- **Instance Isolation**: Uses workspace path hashing to create unique, isolated data directories in the system cache, preventing workspace locking issues.
- **Smart Pathing**: 
  - Automatically identifies JDT.LS home from the provided path.
  - Automatically locates the Equinox launcher and OS-specific configuration.
  - Automatically falls back to the current working directory (CWD) if no workspace path is provided.
- **Full LSP Capabilities**: Supports symbol definitions, references, hover documentation, and file synchronization.
- **Cross-Platform**: Fully compatible with Windows, macOS, and Linux.

## 🛠️ Prerequisites

- **Node.js**: v18.0.0 or higher.
- **Java Development Kit (JDK)**: Java 17 or higher (Java 21+ recommended).
- **Eclipse JDT.LS**: An installation of the [Eclipse JDT.LS](https://download.eclipse.org/jdtls/snapshots/?v=latest).

## 🚀 Installation

### Option A: Install via Git (Recommended)

The most elegant way to install without a public npm repository:

```bash
# Install globally (provides 'java-mcp-server' command)
npm install -g git+https://git.wind.com.cn/zxwang.sachiew/java-jdtls-mcp-server.git
```

### Option B: Run with npx

```bash
npx git+https://git.wind.com.cn/zxwang.sachiew/java-jdtls-mcp-server.git
```

### Option C: Source-based Installation

```bash
git clone <repository-url>
cd java-jdtls-mcp-server
npm install
npm run build
```

## 📖 Usage

### MCP Client Configuration

Add the following to your MCP configuration file (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "java": {
      "command": "node",
      "args": ["/path/to/java-mcp-server/dist/index.js"],
      "env": {
        "JDTLS_HOME": "/path/to/jdtls-installation-root",
        "JAVA_WORKSPACE_PATH": "/path/to/your/project/root",
        "JAVA_HOME": "/path/to/jdk"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `JDTLS_HOME` | Path to JDT.LS installation root directory | **Yes** (for auto-start) | - |
| `JAVA_WORKSPACE_PATH` | Root path of your Java project | No | Current Working Directory |
| `JAVA_HOME` | Path to your JDK installation | No | System `JAVA_HOME` |

## 🧰 Available Tools

| Tool Name | Description | Key Parameters |
| :--- | :--- | :--- |
| `java_start` | Initializes JDT.LS. Restarts if already running. | `jdtlsHome`, `workspacePath` (optional) |
| `java_restart` | Forces a restart of the JDT.LS process. | `jdtlsHome`, `workspacePath` (optional) |
| `java_open_file` | Synchronizes file content to the server. | `filePath`, `content` |
| `java_get_definition` | Retrieves the definition location for a symbol. | `filePath`, `line`, `character` |
| `java_get_references` | Finds all references for a symbol. | `filePath`, `line`, `character` |
| `java_get_hover` | Gets type info and documentation for a symbol. | `filePath`, `line`, `character` |

## 🔍 Technical Details

### Instance Data Storage
The server stores JDT.LS internal data in a hashed directory within the OS's standard cache folder:
- **Windows**: `%APPDATA%\jdtls\jdtls-<projectName>-<hash>`
- **macOS**: `~/Library/Caches/jdtls/jdtls-<projectName>-<hash>`
- **Linux**: `~/.cache/jdtls/jdtls-<projectName>-<hash>`

### Encoding
Forces `UTF-8` encoding via `JAVA_TOOL_OPTIONS` for cross-platform consistency of logs and source code.

## 📄 License

This project is licensed under the ISC License.
