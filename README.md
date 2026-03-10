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

For Claude Code, Claude Desktop, or other MCP clients, you'll need to configure the server explicitly as an MCP tool.

1. Build the project as shown above.
2. Edit your client's configuration file (e.g., `claude_desktop_config.json` for Claude Desktop).
3. Add the server configuration and define your global environment variables directly within the `env` section:

```json
{
  "mcpServers": {
    "java-mcp-server": {
      "command": "node",
      "args": [
        "/absolute/path/to/java-jdtls-mcp-server/dist/index.js"
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

*Note: When using Claude Code, the project-level `.env` file logic (like `JAVA_PROJECT=true`) might not be loaded natively unless supported by the specific MCP client implementation. You may need to manage project-specific variables within the client's configuration directly.*

### 1. Global Setup (User-level `.env`)

Global environment variables are recommended for common paths to avoid repeating them in every project. The global configuration file is typically located at: `USER_HOME\.gemini\extensions\java-jdtls-mcp-server\.env` (where `USER_HOME` is your user directory, e.g., `C:\Users\User1`).

**How to Configure:**
1. **During Installation (Recommended):** If you have enabled the `experimental.extensionConfig` setting in Gemini CLI, you will be prompted to input these environment variables during the initial installation. Gemini CLI will then auto-generate the `.env` file at the path above.
2. **Manual Configuration:** Alternatively, you can manually create the user-level `.env` file at this location and fill in the recommended information.

**Recommended Configuration Example:**
```ini
JDTLS_HOME=D:/software/jdt-language-server-latest
JDTLS_JAVA_HOME=D:/software/java/jdk-23.0.1
JAVA_WORKSPACE_PATH=
JDTLS_JAVA_RUNTIMES=[{"name":"JavaSE-1.8","path":"C:/Program Files/Java/jdk1.8.0_361"},{"name":"JavaSE-17","path":"D:/software/jdk-17.0.7"}]
JDTLS_MAVEN_USER_SETTINGS=D:/software/apache-maven-3.9.3/conf/settings.xml
JDTLS_MAVEN_GLOBAL_SETTINGS=D:/software/apache-maven-3.9.3/conf/settings.xml
```

| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `JDTLS_HOME` | Path to JDT.LS installation root directory | **Yes** | - |
| `JDTLS_JAVA_HOME` | Dedicated JDK path for JDT.LS (Overrides `JAVA_HOME`) | No | System `JAVA_HOME` |
| `JAVA_WORKSPACE_PATH` | Root path of your Java project | No | Current Working Directory |
| `JDTLS_JAVA_RUNTIMES` | JSON list of Java Runtimes for different project versions | No | - |
| `JDTLS_MAVEN_USER_SETTINGS` | Path to custom Maven user `settings.xml` | No | - |
| `JDTLS_MAVEN_GLOBAL_SETTINGS` | Path to custom Maven global `settings.xml` | No | - |
| `JDTLS_MAVEN_OFFLINE` | Enable Maven offline mode (`true`/`false`) | No | `false` |

### 2. Project-Level Activation (Project-level `.env`)

Project-level env info is loaded and read by agent tools like Gemini CLI. For example, when using Gemini CLI, the project-level env path is usually: `[Project Root]/.gemini/.env`.

To prevent the Java language server from starting unnecessarily in non-Java projects, you **must enable it explicitly** per project. Please add the following to your project-level `.env` file:

```ini
# REQUIRED: Activates the Java Language Server for this specific workspace
JAVA_PROJECT=true
```
*(Optional)* You can also place any of the global settings in this local `.env` file to override them for a specific project.

## 🧩 Expert Skills & AI Rules

This project provides a set of high-level **Expert Skills** (located in `skills/`) that guide AI agents on the most efficient ways to interact with the Java Language Server. These skills prevent common pitfalls (like redundant server restarts) and improve code intelligence accuracy.

| Skill | Expert Guide | Key Benefit |
| :--- | :--- | :--- |
| `java-lifecycle` | Server management | Standardizes JDT.LS startup, status checks, and error recovery. |
| `java-navigation` | Code intelligence | Optimizes finding definitions, references, and symbols. |
| `java-project-load`| Project indexing | Speeds up Maven project loading without manual file scanning. |
| `java-verification`| Diagnostics | Enforces real-time error checking and verification. |

### 🚀 Usage in Gemini CLI

Gemini CLI can install these skills as part of the extension. Once installed, they are activated automatically or on-demand:
- `activate_skill java-lifecycle`
- `activate_skill java-navigation`

### 🤖 Usage in Claude Code / Other MCP Clients

While Claude Code doesn't support Gemini's extension packaging, it can still leverage these skills through its **Rules** system:

1.  **Project-Level Rules**: Copy the contents (or relevant parts) of the `SKILL.md` files from the `skills/` directory into a `.clauderules` file in your Java project's root.
2.  **Global Rules**: Alternatively, you can add these instructions to your global Claude configuration.

By placing these rules in `.clauderules`, Claude Code will automatically adopt these "expert workflows" whenever it detects it is working within this project environment.

---

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

## 📚 Design Documentation

This project follows a structured design process. Detailed technical documents can be found in the `design/` directory:

- **[High-level Design](./design/TD-D-01_概要设计说明书.md)**: Describes the system architecture, core modules, and external interfaces.
- **[Detailed Design](./design/TD-D-02_详细设计说明书.md)**: Covers class models, sequence diagrams, and internal implementation details of the `JavaLanguageServer`.

## 📄 License

This project is licensed under the ISC License.
