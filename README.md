# Java MCP Server & Gemini Extension

[English](./README.md) | [简体中文](./docs/README_zh.md)

This project is a high-performance bridge between AI agents and Java codebases. It functions as both a **Model Context Protocol (MCP) server** and a **Gemini CLI Extension**, providing professional-grade Java language intelligence through Eclipse JDT.LS.

## 🌟 Key Features

- **Gemini Extension & Agent Skills**: Pre-packaged with structured [Agent Skills](./skills/) for Navigation, Verification, and Lifecycle management, ensuring AI agents follow optimal workflows.
- **Native JDT.LS Launch**: Directly spawns the Java Language Server via JVM for maximum stability and performance.
- **Enterprise-Grade Analysis**: Supports loading entire Maven projects to resolve dependencies and symbols across the whole codebase.
- **Diagnostics Support**: Real-time retrieval of compilation errors and warnings to help AI agents verify their code changes.
- **Environment & Instance Isolation**: Uses workspace path hashing for isolated data directories and automatically clears conflicting environment variables (like `PORT`) for reliable communication.
- **Full LSP Capabilities**: Supports Go to Definition, Find References, Hover documentation, Global Symbol Search, and Document Symbol extraction.

## 🛠️ Prerequisites

- **Node.js**: v18.0.0 or higher.
- **Java Development Kit (JDK)**: Java 17 or higher (Java 21+ recommended).
- **Eclipse JDT.LS**: An installation of [Eclipse JDT.LS](https://download.eclipse.org/jdtls/snapshots/?v=latest).

## 🚀 Installation & Setup

### For Gemini CLI (Extension Mode)

This project is optimized for use as a Gemini CLI extension.

```bash
# Clone the repository
git clone <repository-url>
cd java-jdtls-mcp-server
npm install && npm run build

# Install as Gemini extension
gemini extensions install .
```

### For Claude Code / Other MCP Clients

```bash
# Configure in your MCP client (e.g., Claude Desktop)
# Add the following entry to your configuration file
```

## 📖 Configuration

### Environment Variables

The server supports loading environment variables from a `.env` file located in the **server's own installation directory**. Local `.env` values take priority over system environment variables.

| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `JDTLS_HOME` | Path to JDT.LS installation root directory | **Yes** (for auto-start) | - |
| `JDTLS_JAVA_HOME` | Dedicated JDK path for JDT.LS (Overrides `JAVA_HOME`) | No | System `JAVA_HOME` |
| `JAVA_WORKSPACE_PATH` | Root path of your Java project | No | Current Working Directory |

### Example `.env` file

```ini
JDTLS_HOME=/path/to/jdtls
JDTLS_JAVA_HOME=/path/to/jdk-21
JAVA_WORKSPACE_PATH=/path/to/my-java-project
```

## 🧰 Available Tools

| Tool Name | Description | Key Parameters |
| :--- | :--- | :--- |
| `java_start` | Initializes JDT.LS. Restarts if already running. | `jdtlsHome`, `workspacePath`, `javaHome` |
| `java_restart` | Forces a fresh restart of the JDT.LS process. | `jdtlsHome`, `workspacePath`, `javaHome` |
| `java_load_maven_project` | **New!** Loads an entire Maven project and indexes symbols. | `projectPath` |
| `java_search_symbols` | **New!** Performs global symbol search across the workspace. | `query` |
| `java_get_file_symbols` | **New!** Extracts all symbols (classes/methods) from a file. | `filePath` |
| `java_open_file` | Notifies the server about file content (required for diagnostics). | `filePath`, `content` |
| `java_get_diagnostics` | Retrieves errors and warnings for a specific file. | `filePath` |
| `java_get_definition` | Retrieves the definition location for a symbol. | `filePath`, `line`, `character` |
| `java_get_references` | Finds all references for a symbol. | `filePath`, `line`, `character` |
| `java_get_hover` | Gets type info and documentation for a symbol. | `filePath`, `line`, `character` |

## 🧠 Agent Skills

The folder `skills/` contains specialized Markdown files that guide AI agents on how to use these tools effectively:

- **[Navigation](./skills/java-navigation/SKILL.md)**: Strategies for exploring codebases and using symbol search.
- **[Verification](./skills/java-verification/SKILL.md)**: Workflows for checking code correctness via diagnostics.
- **[Lifecycle](./skills/java-lifecycle/SKILL.md)**: Handling server initialization and auto-start configuration.

## 📄 License

This project is licensed under the ISC License.

