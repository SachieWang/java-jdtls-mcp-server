#!/usr/bin/env node
import * as dotenv from "dotenv";

// 强制所有日志到 stderr，防止污染 stdio 导致 JSON-RPC 解析失败
// 必须在所有可能产生输出的操作（如 new Server, dotenv.config 等）之前或尽可能早地执行
console.log = console.error;
console.info = console.error;
console.warn = console.error;
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
                        javaRuntimes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    path: { type: "string" },
                                    default: { type: "boolean" }
                                }
                            },
                            description: "List of Java Runtimes for different versions"
                        },
                        mavenConfig: {
                            type: "object",
                            properties: {
                                userSettings: { type: "string" },
                                globalSettings: { type: "string" },
                                offline: { type: "boolean" }
                            },
                            description: "Custom Maven configuration"
                        }
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
                        javaRuntimes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    path: { type: "string" },
                                    default: { type: "boolean" }
                                }
                            },
                            description: "List of Java Runtimes for different versions"
                        },
                        mavenConfig: {
                            type: "object",
                            properties: {
                                userSettings: { type: "string" },
                                globalSettings: { type: "string" },
                                offline: { type: "boolean" }
                            },
                            description: "Custom Maven configuration"
                        }
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
                const { jdtlsHome, workspacePath, javaHome, javaRuntimes, mavenConfig } = args as any;
                const finalWorkspacePath = workspacePath || process.cwd();
                if (javaServer.getState() !== "STOPPED") {
                    await javaServer.stop();
                }
                const finalRuntimes = javaRuntimes ? normalizeRuntimes(javaRuntimes) : parseRuntimes(process.env.JDTLS_JAVA_RUNTIMES);
                const finalMavenConfig = mavenConfig ? normalizeMavenConfig(mavenConfig) : getMavenConfigFromEnv();

                // 异步启动，不 await
                javaServer.start(jdtlsHome, finalWorkspacePath, javaHome, finalRuntimes, finalMavenConfig)
                    .catch(e => console.error(`[ERROR] java_start: ${e.message}`));

                return {
                    content: [{ type: "text", text: "Java Language Server start initiated. It will initialize in the background." }],
                };
            }
            case "java_restart": {
                const { jdtlsHome, workspacePath, javaHome, javaRuntimes, mavenConfig } = args as any;
                const finalWorkspacePath = workspacePath || process.cwd();
                await javaServer.stop();
                const finalRuntimes = javaRuntimes ? normalizeRuntimes(javaRuntimes) : parseRuntimes(process.env.JDTLS_JAVA_RUNTIMES);
                const finalMavenConfig = mavenConfig ? normalizeMavenConfig(mavenConfig) : getMavenConfigFromEnv();

                javaServer.start(jdtlsHome, finalWorkspacePath, javaHome, finalRuntimes, finalMavenConfig)
                    .catch(e => console.error(`[ERROR] java_restart: ${e.message}`));

                return {
                    content: [{ type: "text", text: "Java Language Server restart initiated. Background initialization started." }],
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

    const jdtlsHome = process.env.JDTLS_HOME;
    const workspacePath = process.env.JAVA_WORKSPACE_PATH;
    const javaHome = process.env.JDTLS_JAVA_HOME;
    const javaRuntimes = parseRuntimes(process.env.JDTLS_JAVA_RUNTIMES);
    const mavenConfig = getMavenConfigFromEnv();

    console.error("[DEBUG] mcp server start envs: jdtlsHome", jdtlsHome);
    console.error("[DEBUG] mcp server start envs: workspacePath", workspacePath);
    console.error("[DEBUG] mcp server start envs: javaHome", javaHome);
    console.error("[DEBUG] mcp server start envs: javaRuntimes", JSON.stringify(javaRuntimes, null, 2));
    console.error("[DEBUG] mcp server start envs: mavenConfig", JSON.stringify(mavenConfig, null, 2));

    if (jdtlsHome) {
        const finalWorkspacePath = workspacePath || process.cwd();
        javaServer.start(jdtlsHome, finalWorkspacePath, javaHome, javaRuntimes, mavenConfig)
            .catch((e: any) => console.error(`[WARNING] Auto-start failed: ${e.message}`));
    }
}

function normalizePath(p: string | undefined): string | undefined {
    return p ? p.replace(/\\/g, '/') : undefined;
}

function normalizeRuntimes(runtimes: any[]): any[] {
    return runtimes.map(rt => ({
        ...rt,
        path: normalizePath(rt.path)
    }));
}

function normalizeMavenConfig(config: any): any {
    return {
        ...config,
        userSettings: normalizePath(config.userSettings),
        globalSettings: normalizePath(config.globalSettings)
    };
}

function getMavenConfigFromEnv(): any {
    return normalizeMavenConfig({
        userSettings: process.env.JDTLS_MAVEN_USER_SETTINGS,
        globalSettings: process.env.JDTLS_MAVEN_GLOBAL_SETTINGS,
        offline: process.env.JDTLS_MAVEN_OFFLINE === 'true'
    });
}

function parseRuntimes(envStr: string | undefined): any[] | undefined {
    if (!envStr) return undefined;
    try {
        const runtimes = JSON.parse(envStr);
        if (Array.isArray(runtimes)) {
            return normalizeRuntimes(runtimes);
        }
        return undefined;
    } catch (e: any) {
        console.error(`[WARNING] Failed to parse JDTLS_JAVA_RUNTIMES: ${e.message}`);
        return undefined;
    }
}

run().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
