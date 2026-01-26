# Java MCP Server & Gemini Extension

[English](./README.md) | [简体中文](./docs/README_zh.md)

This project is a high-performance bridge between AI agents and Java codebases. It functions as both a **Model Context Protocol (MCP) server** and a **Gemini CLI Extension**, providing professional-grade Java language intelligence through Eclipse JDT.LS.

## 🌟 Key Features

- **Gemini Extension & Agent Skills**: Pre-packaged with structured [Agent Skills](./skills/) for Navigation, Verification, and Lifecycle management, ensuring AI agents follow optimal workflows.
- **Native JDT.LS Launch**: Directly spawns the Java Language Server via JVM for maximum stability and performance.
- **Diagnostics Support**: Real-time retrieval of compilation errors and warnings to help AI agents verify their code changes.
- **Instance Isolation**: Uses workspace path hashing to create isolated data directories, preventing workspace locking and allowing multi-project workflows.
- **Environment Isolation**: Automatically clears conflicting environment variables (like `PORT`) for reliable StdIO communication.
- **Full LSP Capabilities**: Supports Go to Definition, Find References, Hover documentation, and efficient file synchronization.

## 🛠️ Prerequisites

- **Node.js**: v18.0.0 or higher.
- **Java Development Kit (JDK)**: Java 17 or higher (Java 21+ recommended).
- **Eclipse JDT.LS**: An installation of [Eclipse JDT.LS](https://download.eclipse.org/jdtls/snapshots/?v=latest).

## 🚀 Installation & Setup

### For Gemini CLI (Extension Mode)

This project is optimized for use as a Gemini CLI extension. It includes `gemini-extension.json` and `GEMINI.md` for seamless integration.

```bash
# Clone the repository
git clone <repository-url>
cd java-jdtls-mcp-server
npm install && npm run build

# Add to your gemini-cli configuration
# The CLI will automatically recognize the extension and the bundled Agent Skills
```

### For Claude Code / Other MCP Clients

```bash
# Install globally via Git
npm install -g git+https://git.wind.com.cn/zxwang.sachiew/java-jdtls-mcp-server.git
```

## 📖 Configuration

### MCP Client Config (e.g., `claude_desktop_config.json`)

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
| `java_start` | Initializes JDT.LS. Restarts if already running. | `jdtlsHome`, `workspacePath` |
| `java_restart` | Forces a fresh restart of the JDT.LS process. | `jdtlsHome`, `workspacePath` |
| `java_open_file` | Synchronizes file content to the server. | `filePath`, `content` |
| `java_get_diagnostics` | **New!** Retrieves cached errors and warnings. | `filePath` |
| `java_get_definition` | Retrieves the definition location for a symbol. | `filePath`, `line`, `character` |
| `java_get_references` | Finds all references for a symbol. | `filePath`, `line`, `character` |
| `java_get_hover` | Gets type info and documentation for a symbol. | `filePath`, `line`, `character` |

## 🧠 Agent Skills

The folder `skills/` contains specialized Markdown files that guide AI agents on how to use these tools effectively:

- **[Navigation](./skills/java-navigation/SKILL.md)**: Strategies for exploring codebases.
- **[Verification](./skills/java-verification/SKILL.md)**: Workflows for checking code correctness.
- **[Lifecycle](./skills/java-lifecycle/SKILL.md)**: Handling server initialization.

## 📄 License

This project is licensed under the ISC License.

