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
import * as fs from "fs";
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
                            description: "Absolute path to the file or a URI (e.g. jdt://...)",
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
                            description: "Absolute path to the file or a URI (e.g. jdt://...)",
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
                            description: "Absolute path to the file or a URI (e.g. jdt://...)",
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
                            description: "Absolute path to the file or a URI (e.g. jdt://...)",
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
                description: "Get diagnostics (errors/warnings) for a file. This tool now attempts to pull diagnostics actively from the server if supported (LSP 3.17+), otherwise falls back to cached results from asynchronous publishing.",
                inputSchema: {
                    type: "object",
                    properties: {
                        filePath: {
                            type: "string",
                            description: "Absolute path to the file or a URI (e.g. jdt://...)",
                        },
                    },
                    required: ["filePath"],
                },
            },
            {
                name: "java_get_workspace_diagnostics",
                description: "Pull diagnostics for the entire workspace (LSP 3.17+). Note: This may not be supported by all language server versions.",
                inputSchema: {
                    type: "object",
                    properties: {},
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
                            description: "Absolute path to the Java file or a URI (e.g. jdt://...)",
                        },
                    },
                    required: ["filePath"],
                },
            },
            {
                name: "java_get_status",
                description: "Get the current status of the Java Language Server.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "configure_jdt_ls",
                description: "Dynamically update JDT.LS configuration (e.g. enable source downloading).",
                inputSchema: {
                    type: "object",
                    properties: {
                        settings: {
                            type: "object",
                            description: "The settings object to send to the server",
                        },
                    },
                    required: ["settings"],
                },
            },
            {
                name: "find_references",
                description: "Find references for a symbol. This is an enhanced version of java_get_references that marks external library results.",
                inputSchema: {
                    type: "object",
                    properties: {
                        filePath: {
                            type: "string",
                            description: "Absolute path to the file or a URI (e.g. jdt://...)",
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
                name: "read_java_content",
                description: "Read the content of a Java file, including local files and external library source code (jdt:// or jrt:// URIs).",
                inputSchema: {
                    type: "object",
                    properties: {
                        uri: {
                            type: "string",
                            description: "The URI or file path to read",
                        },
                    },
                    required: ["uri"],
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

                // 幂等性检查：如果工作区一致且已经在运行，直接返回状态
                if (javaServer.isRunning() && javaServer.getWorkspace() === finalWorkspacePath) {
                    return {
                        content: [{ type: "text", text: `Java Language Server is already running for this workspace. Status: ${javaServer.getState()}` }],
                    };
                }

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
            case "java_get_workspace_diagnostics": {
                const result = await javaServer.pullWorkspaceDiagnostics();
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
            case "java_get_status": {
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify({
                            state: javaServer.getState(),
                            workspace: javaServer.getWorkspace()
                        }, null, 2)
                    }],
                };
            }
            case "configure_jdt_ls": {
                const { settings } = args as any;
                await javaServer.configure(settings);
                return {
                    content: [{ type: "text", text: "Configuration updated." }],
                };
            }
            case "find_references": {
                const { filePath, line, character } = args as any;
                const results = await javaServer.getReferences(filePath, line, character) as any[];

                if (results && Array.isArray(results)) {
                    results.forEach(loc => {
                        if (loc.uri && (loc.uri.startsWith("jdt://") || loc.uri.startsWith("jrt://"))) {
                            loc.remark = "[External Library (Source Available)]";
                        }
                    });
                }

                return {
                    content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
                };
            }
            case "read_java_content": {
                const { uri } = args as any;
                if (uri.startsWith("jdt://") || uri.startsWith("jrt://")) {
                    const content = await javaServer.getClassFileContents(uri);
                    return {
                        content: [{ type: "text", text: content }],
                    };
                } else {
                    // Treat as local file
                    const filePath = uri.startsWith("file://") ? new URL(uri).pathname : uri;
                    const content = fs.readFileSync(filePath, "utf-8");
                    return {
                        content: [{ type: "text", text: content }],
                    };
                }
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

    const javaProject = process.env.JAVA_PROJECT || false;
    const jdtlsHome = process.env.JDTLS_HOME;
    const workspacePath = process.env.JAVA_WORKSPACE_PATH;
    const finalWorkspacePath = workspacePath || process.cwd();
    const javaHome = process.env.JDTLS_JAVA_HOME;
    const javaRuntimes = parseRuntimes(process.env.JDTLS_JAVA_RUNTIMES);
    const mavenConfig = getMavenConfigFromEnv();

    console.error("[DEBUG] mcp server start envs: javaProject", javaProject);
    console.error("[DEBUG] mcp server start envs: jdtlsHome", jdtlsHome);
    console.error("[DEBUG] mcp server start envs: workspacePath", finalWorkspacePath);
    console.error("[DEBUG] mcp server start envs: javaHome", javaHome);
    console.error("[DEBUG] mcp server start envs: javaRuntimes", JSON.stringify(javaRuntimes, null, 2));
    console.error("[DEBUG] mcp server start envs: mavenConfig", JSON.stringify(mavenConfig, null, 2));

    if (javaProject && jdtlsHome && finalWorkspacePath && javaHome && javaRuntimes && mavenConfig) {
        javaServer.start(jdtlsHome, finalWorkspacePath, javaHome, javaRuntimes, mavenConfig)
            .catch((e: any) => console.error(`[WARNING] Auto-start failed: ${e.message}`));
    }
}

import * as path from "path";

function normalizePath(p: string | undefined): string | undefined {
    return p ? path.resolve(p) : undefined;
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
        console.error(`[DEBUG] JDTLS_JAVA_RUNTIMES: ${envStr}`);
        // 关键点：容错处理。由于环境变量不同载体或 .env 文件解析可能导致引号带上反斜杠字面量 (如 \")
        // 把转义的 \" 替换回标准双引号 "
        const normalizedJsonStr = envStr.replace(/\\"/g, '"');
        const runtimes = JSON.parse(normalizedJsonStr);
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
