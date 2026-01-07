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
        javaPath: string,
        launcherPath: string,
        workspacePath: string
    ): Promise<void> {
        if (this.connection) {
            return;
        }

        const configName = process.platform === 'win32' ? 'config_win' : 'config_linux';
        // Assuming standard JDT.LS structure where config is sibling to plugins or inside
        // Actually, usually the launcher is in plugins/ and config is in config_win/ at root of jdtls install
        // We might need the user to point to the server home, or just the launcher jar.
        // Let's try to deduce config path from launcher path if possible, or just ask for server home.

        // For simplicity, let's assume the user passes the full command or we construct it carefully.
        // Let's assume 'serverHome' is passed.

        const serverHome = path.dirname(path.dirname(launcherPath)); // assuming plugins/launcher.jar

        const args = [
            '-Declipse.application=org.eclipse.jdt.ls.core.id1',
            '-Dosgi.bundles.defaultStartLevel=4',
            '-Declipse.product=org.eclipse.jdt.ls.core.product',
            '-Dlog.level=ALL',
            '-noverify',
            '-Xmx1G',
            '--add-modules=ALL-SYSTEM',
            '--add-opens', 'java.base/java.util=ALL-UNNAMED',
            '--add-opens', 'java.base/java.lang=ALL-UNNAMED',
            '-jar', launcherPath,
            '-configuration', path.join(serverHome, configName),
            '-data', workspacePath
        ];

        console.error(`Starting JDT.LS with: ${javaPath} ${args.join(' ')}`);

        this.process = spawn(javaPath, args, {
            cwd: workspacePath,
            env: process.env
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

    // Add more methods as needed
}
