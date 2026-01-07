import { spawn, ChildProcess } from 'child_process';
import * as rpc from 'vscode-jsonrpc/node.js';
import { pathToFileURL } from 'url';
import * as path from 'path';
import * as fs from 'fs';

export class JavaLanguageServer {
    private process: ChildProcess | null = null;
    private connection: rpc.MessageConnection | null = null;
    private capabilities: any = null;

    constructor() { }

    async start(
        scriptPath: string,
        workspacePath: string
    ): Promise<void> {
        if (this.connection) {
            return;
        }

        const args = [
            '-data', workspacePath
        ];

        console.error(`Starting JDT.LS with: ${scriptPath} ${args.join(' ')}`);

        this.process = spawn(scriptPath, args, {
            cwd: workspacePath,
            env: process.env,
            shell: true
        });

        if (!this.process.stdout || !this.process.stdin) {
            throw new Error('Failed to spawn JDT.LS process');
        }

        this.connection = rpc.createMessageConnection(
            new rpc.StreamMessageReader(this.process.stdout),
            new rpc.StreamMessageWriter(this.process.stdin)
        );

        this.connection.listen();

        // Initialize
        const initResult = await this.connection.sendRequest('initialize', {
            processId: process.pid,
            rootUri: pathToFileURL(workspacePath).toString(),
            capabilities: {
                workspace: {
                    configuration: true,
                    didChangeConfiguration: { dynamicRegistration: true }
                },
                textDocument: {
                    synchronization: {
                        dynamicRegistration: true,
                        willSave: true,
                        willSaveWaitUntil: true,
                        didSave: true
                    },
                    completion: { dynamicRegistration: true },
                    hover: { dynamicRegistration: true },
                    signatureHelp: { dynamicRegistration: true },
                    definition: { dynamicRegistration: true },
                    references: { dynamicRegistration: true },
                    documentHighlight: { dynamicRegistration: true },
                    documentSymbol: { dynamicRegistration: true },
                    codeAction: { dynamicRegistration: true },
                    codeLens: { dynamicRegistration: true },
                    formatting: { dynamicRegistration: true },
                    rangeFormatting: { dynamicRegistration: true },
                    onTypeFormatting: { dynamicRegistration: true },
                    rename: { dynamicRegistration: true },
                    documentLink: { dynamicRegistration: true },
                    typeDefinition: { dynamicRegistration: true },
                    implementation: { dynamicRegistration: true },
                    colorProvider: { dynamicRegistration: true },
                    foldingRange: { dynamicRegistration: true },
                    selectionRange: { dynamicRegistration: true }
                }
            },
            workspaceFolders: [
                {
                    name: 'workspace',
                    uri: pathToFileURL(workspacePath).toString()
                }
            ]
        });

        this.capabilities = initResult;
        await this.connection.sendNotification('initialized', {});
        console.error('JDT.LS Initialized');
    }

    isRunning(): boolean {
        return !!this.connection;
    }

    async stop() {
        if (this.connection) {
            await this.connection.sendRequest('shutdown');
            this.connection.sendNotification('exit');
            this.connection.dispose();
            this.connection = null;
        }
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }

    async getDefinition(filePath: string, line: number, character: number) {
        if (!this.connection) throw new Error('Server not started');
        const uri = pathToFileURL(filePath).toString();
        return this.connection.sendRequest('textDocument/definition', {
            textDocument: { uri },
            position: { line, character }
        });
    }

    async getReferences(filePath: string, line: number, character: number) {
        if (!this.connection) throw new Error('Server not started');
        const uri = pathToFileURL(filePath).toString();
        return this.connection.sendRequest('textDocument/references', {
            textDocument: { uri },
            position: { line, character },
            context: { includeDeclaration: true }
        });
    }

    async getHover(filePath: string, line: number, character: number) {
        if (!this.connection) throw new Error('Server not started');
        const uri = pathToFileURL(filePath).toString();
        return this.connection.sendRequest('textDocument/hover', {
            textDocument: { uri },
            position: { line, character }
        });
    }

    async didOpen(filePath: string, content: string) {
        if (!this.connection) throw new Error('Server not started');
        const uri = pathToFileURL(filePath).toString();
        return this.connection.sendNotification('textDocument/didOpen', {
            textDocument: {
                uri,
                languageId: 'java',
                version: 1,
                text: content
            }
        });
    }
}
