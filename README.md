# Java MCP Server

This is a Model Context Protocol (MCP) server that provides Java language features by interfacing with the Eclipse JDT.LS (Java Language Server).

## Features

- **MCP Support**: Works with Claude Code, Gemini, and other MCP clients.
- **LSP Client**: Acts as a client to JDT.LS.
- **Tools**:
  - `java_start`: Connect to JDT.LS.
  - `java_open_file`: Open a file in the server.
  - `java_get_definition`: Go to definition.
  - `java_get_references`: Find references.
  - `java_get_hover`: Get hover documentation.

## Prerequisites

- Node.js installed.
- Java Development Kit (JDK) installed (Java 17+ recommended for recent JDT.LS).
- **Eclipse JDT.LS** installed. You can download it from [Eclipse JDT.LS project](https://projects.eclipse.org/projects/eclipse.jdt.ls).

## Installation

```bash
npm install
npm run build
```

## Usage

### Configuring in Claude Code / MCP Client

Add the following to your MCP configuration:

```json
{
  "mcpServers": {
    "java": {
      "command": "node",
      "args": ["/path/to/java-mcp-server/dist/index.js"]
    }
  }
}
```

### Starting the Server

Once the MCP server is running, you must first call the `java_start` tool to initialize the connection to JDT.LS.

**Parameters for `java_start`:**
- `javaPath`: Path to your `java` executable (e.g., `java` or `/usr/bin/java`).
- `launcherPath`: Path to the JDT.LS launcher JAR file. This is usually located in the `plugins` directory of your JDT.LS installation (e.g., `/path/to/jdtls/plugins/org.eclipse.equinox.launcher_....jar`).
- `workspacePath`: Path to your Java project root.

### Example Workflow

1.  **Start JDT.LS**:
    Call `java_start` with:
    ```json
    {
      "javaPath": "java",
      "launcherPath": "C:/tools/jdtls/plugins/org.eclipse.equinox.launcher_1.6.400.v20210924-0641.jar",
      "workspacePath": "C:/Projects/MyJavaProject"
    }
    ```

2.  **Open a File**:
    Call `java_open_file` with the file path and content to ensure the server knows about it (or rely on workspace scanning if configured).

3.  **Get Definition**:
    Call `java_get_definition` with file path, line, and character.

## License

ISC
