#!/usr/bin/env node
import * as dotenv from "dotenv";
dotenv.config({ override: true });
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ErrorCode,
    McpError
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { JavaLanguageServer } from "./language-server.js";

const server = new Server(
    {
        name: "java-mcp-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

const javaServer = new JavaLanguageServer();

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "java_start",
                description: "Start the Java Language Server (JDT.LS). Required before other commands. If already running, it will restart.",
                inputSchema: {
                    type: "object",
                    properties: {
                        jdtlsHome: {
                            type: "string",
                            description: "Path to JDT.LS installation root directory",
                        },
                        workspacePath: {
                            type: "string",
                            description: "Path to the workspace root (default: current directory)",
                        },
                        javaHome: {
                            type: "string",
                            description: "Path to Java Home (overrides JAVA_HOME env var)",
                        },
                    },
                    required: ["jdtlsHome"],
                },
            },
            {
                name: "java_restart",
                description: "Restart the Java Language Server (JDT.LS).",
                inputSchema: {
                    type: "object",
                    properties: {
                        jdtlsHome: {
                            type: "string",
                            description: "Path to JDT.LS installation root directory",
                        },
                        workspacePath: {
                            type: "string",
                            description: "Path to the workspace root (default: current directory)",
                        },
                        javaHome: {
                            type: "string",
                            description: "Path to Java Home (overrides JAVA_HOME env var)",
                        },
                    },
                    required: ["jdtlsHome"],
                },
            },
            {
                name: "java_open_file",
                description: "Notify the language server that a file is open (didOpen).",
                inputSchema: {
                    type: "object",
                    properties: {
                        filePath: {
                            type: "string",
                            description: "Absolute path to the file",
                        },
                        content: {
                            type: "string",
                            description: "Content of the file",
                        },
                    },
                    required: ["filePath", "content"],
                },
            },
            {
                name: "java_get_definition",
                description: "Get definition location for a symbol.",
                inputSchema: {
                    type: "object",
                    properties: {
                        filePath: {
                            type: "string",
                            description: "Absolute path to the file",
                        },
                        line: {
                            type: "number",
                            description: "Line number (0-indexed)",
                        },
                        character: {
                            type: "number",
                            description: "Character offset (0-indexed)",
                        },
                    },
                    required: ["filePath", "line", "character"],
                },
            },
            {
                name: "java_get_references",
                description: "Get references for a symbol.",
                inputSchema: {
                    type: "object",
                    properties: {
                        filePath: {
                            type: "string",
                            description: "Absolute path to the file",
                        },
                        line: {
                            type: "number",
                            description: "Line number (0-indexed)",
                        },
                        character: {
                            type: "number",
                            description: "Character offset (0-indexed)",
                        },
                    },
                    required: ["filePath", "line", "character"],
                },
            },
            {
                name: "java_get_hover",
                description: "Get hover information for a symbol.",
                inputSchema: {
                    type: "object",
                    properties: {
                        filePath: {
                            type: "string",
                            description: "Absolute path to the file",
                        },
                        line: {
                            type: "number",
                            description: "Line number (0-indexed)",
                        },
                        character: {
                            type: "number",
                            description: "Character offset (0-indexed)",
                        },
                    },
                    required: ["filePath", "line", "character"],
                },
            },
            {
                name: "java_get_diagnostics",
                description: "Get diagnostics (errors/warnings) for a file. Note: This tool relies on the server's asynchronous publishing of diagnostics. You may need to wait a moment after opening or editing a file before calling this.",
                inputSchema: {
                    type: "object",
                    properties: {
                        filePath: {
                            type: "string",
                            description: "Absolute path to the file",
                        },
                    },
                    required: ["filePath"],
                },
            },
            {
                name: "java_load_maven_project",
                description: "Load a Maven Java project into the language server workspace. This causes JDTLS to index the project, resolving dependencies and symbols across the entire project without needing to open files individually.",
                inputSchema: {
                    type: "object",
                    properties: {
                        projectPath: {
                            type: "string",
                            description: "Absolute path to the root of the Maven project (containing pom.xml)",
                        },
                    },
                    required: ["projectPath"],
                },
            },
            {
                name: "java_search_symbols",
                description: "Search for symbols (classes, methods, fields) across the entire workspace by name.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "The symbol name to search for (e.g., 'UserService')",
                        },
                    },
                    required: ["query"],
                },
            },
            {
                name: "java_get_file_symbols",
                description: "Get all symbols (classes, methods, fields) defined in a specific file.",
                inputSchema: {
                    type: "object",
                    properties: {
                        filePath: {
                            type: "string",
                            description: "Absolute path to the Java file",
                        },
                    },
                    required: ["filePath"],
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "java_start": {
                const { jdtlsHome, workspacePath, javaHome } = args as any;
                const finalWorkspacePath = workspacePath || process.cwd();
                if (javaServer.isRunning()) {
                    await javaServer.stop();
                }
                await javaServer.start(jdtlsHome, finalWorkspacePath, javaHome);
                return {
                    content: [{ type: "text", text: "Java Language Server started successfully." }],
                };
            }
            case "java_restart": {
                const { jdtlsHome, workspacePath, javaHome } = args as any;
                const finalWorkspacePath = workspacePath || process.cwd();
                await javaServer.stop();
                await javaServer.start(jdtlsHome, finalWorkspacePath, javaHome);
                return {
                    content: [{ type: "text", text: "Java Language Server restarted successfully." }],
                };
            }
            case "java_open_file": {
                const { filePath, content } = args as any;
                await javaServer.didOpen(filePath, content);
                return {
                    content: [{ type: "text", text: "File opened in Language Server." }],
                };
            }
            case "java_get_definition": {
                const { filePath, line, character } = args as any;
                const result = await javaServer.getDefinition(filePath, line, character);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }
            case "java_get_references": {
                const { filePath, line, character } = args as any;
                const result = await javaServer.getReferences(filePath, line, character);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }
            case "java_get_hover": {
                const { filePath, line, character } = args as any;
                const result = await javaServer.getHover(filePath, line, character);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }
            case "java_get_diagnostics": {
                const { filePath } = args as any;
                const result = await javaServer.getDiagnostics(filePath);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }
            case "java_load_maven_project": {
                const { projectPath } = args as any;
                await javaServer.addWorkspaceFolder(projectPath);
                return {
                    content: [{ type: "text", text: `Project loaded: ${projectPath}` }],
                };
            }
            case "java_search_symbols": {
                const { query } = args as any;
                const result = await javaServer.searchSymbols(query);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }
            case "java_get_file_symbols": {
                const { filePath } = args as any;
                const result = await javaServer.getDocumentSymbols(filePath);
                return {
                    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
                };
            }
            default:
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
    } catch (error: any) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});

async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Java MCP Server running on stdio");

    // Auto-start if env vars are present (Lazy / Non-blocking)
    const jdtlsHome = process.env.JDTLS_HOME;
    const workspacePath = process.env.JAVA_WORKSPACE_PATH;
    const javaHome = process.env.JDTLS_JAVA_HOME; // 支持 auto-start 时也使用专用环境变量

    console.error(`Checking auto-start env vars...`);
    console.error(`JDTLS_HOME: ${jdtlsHome || 'undefined'}`);
    console.error(`JAVA_WORKSPACE_PATH: ${workspacePath || 'undefined'}`);
    console.error(`JDTLS_JAVA_HOME: ${javaHome || 'undefined'}`);

    if (jdtlsHome) {
        const finalWorkspacePath = workspacePath || process.cwd();
        // Fire and forget - do NOT await this.
        // If it fails, we want the MCP server to stay alive so the agent can debug it.
        javaServer.start(jdtlsHome, finalWorkspacePath, javaHome)
            .then(() => console.error("JDT.LS auto-started successfully."))
            .catch((e: any) => console.error(`[WARNING] Failed to auto-start JDT.LS: ${e.message}`));
    } else {
        console.error("JDT.LS auto-start skipped: Missing JDTLS_HOME environment variable.");
    }
}

run().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
