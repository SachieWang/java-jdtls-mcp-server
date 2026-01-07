# Java MCP Server

This is a Model Context Protocol (MCP) server that provides Java language features by interfacing with the Eclipse JDT.LS (Java Language Server).

## Features

- **MCP Support**: Works with Claude Code, Gemini, and other MCP clients.
- **LSP Client**: Acts as a client to JDT.LS.
- **Auto-start**: Automatically starts JDT.LS if environment variables are configured.
- **Tools**:
  - `java_start`: Connect to JDT.LS (or restart if running).
  - `java_restart`: Restart JDT.LS.
  - `java_open_file`: Open a file in the server.
  - `java_get_definition`: Go to definition.
  - `java_get_references`: Find references.
  - `java_get_hover`: Get hover documentation.

## Prerequisites

- Node.js installed.
- Java Development Kit (JDK) installed (Java 17+ recommended).
- **Eclipse JDT.LS** installed.

## Installation

```bash
npm install
npm run build
```

## Usage

### Configuring in Claude Code / MCP Client

Add the following to your MCP configuration. You can configure environment variables to auto-start JDT.LS.

```json
{
  "mcpServers": {
    "java": {
      "command": "node",
      "args": ["/path/to/java-mcp-server/dist/index.js"],
      "env": {
        "JDTLS_SCRIPT_PATH": "/path/to/jdtls/bin/jdtls",
        "JAVA_WORKSPACE_PATH": "/path/to/your/project/root",
        "JAVA_HOME": "/path/to/jdk" 
      }
    }
  }
}
```

*Note: `JAVA_HOME` is optional if it's already set in your system environment, but JDT.LS requires it.*

### Starting the Server

If you configured the environment variables (`JDTLS_SCRIPT_PATH` and `JAVA_WORKSPACE_PATH`), the server will start JDT.LS automatically when the MCP server initializes.

If you need to start it manually or restart it with different parameters, use `java_start`.

**Parameters for `java_start`:**
- `jdtlsScriptPath`: Path to the JDT.LS wrapper script (e.g., `bin/jdtls` or `bin/jdtls.bat`).
- `workspacePath`: Path to your Java project root.

### Example Workflow

1.  **Start JDT.LS** (if not auto-started):
    Call `java_start` with:
    ```json
    {
      "jdtlsScriptPath": "C:/tools/jdtls/bin/jdtls.bat",
      "workspacePath": "C:/Projects/MyJavaProject"
    }
    ```

2.  **Open a File**:
    Call `java_open_file` with the file path and content.

3.  **Get Definition**:
    Call `java_get_definition` with file path, line, and character.

## License

ISC
