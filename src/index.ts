#!/usr/bin/env node
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
                description: "Start the Java Language Server (JDT.LS). Required before other commands.",
                inputSchema: {
                    type: "object",
                    properties: {
                        javaPath: {
                            type: "string",
                            description: "Path to java executable",
                        },
                        launcherPath: {
                            type: "string",
                            description: "Path to JDT.LS launcher jar (e.g. plugins/org.eclipse.equinox.launcher_....jar)",
                        },
                        workspacePath: {
                            type: "string",
                            description: "Path to the workspace root",
                        },
                    },
                    required: ["javaPath", "launcherPath", "workspacePath"],
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
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "java_start": {
                const { javaPath, launcherPath, workspacePath } = args as any;
                await javaServer.start(javaPath, launcherPath, workspacePath);
                return {
                    content: [{ type: "text", text: "Java Language Server started successfully." }],
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
}

run().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
