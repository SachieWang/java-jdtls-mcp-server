import { spawn, ChildProcess, execSync } from 'child_process';
import * as rpc from 'vscode-jsonrpc/node.js';
import { pathToFileURL } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';

export class JavaLanguageServer {
    private process: ChildProcess | null = null;
    private connection: rpc.MessageConnection | null = null;
    private capabilities: any = null;
    private diagnostics: Map<string, any[]> = new Map();

    constructor() { }

    private toForwardSlashes(p: string): string {
        return p.replace(/\\/g, '/');
    }

    private logDiagnostics(javaExec: string) {
        try {
            // 在 Windows 上引用路径并执行
            const version = execSync(`"${javaExec}" -version 2>&1`, { env: process.env }).toString();
            console.error(`[ENV] Java Version: ${version.split('\n')[0]}`);
        } catch (e) {
            console.error(`[ENV] Failed to get Java version for: ${javaExec}`);
        }
        console.error(`[ENV] JAVA_HOME: ${process.env.JAVA_HOME || 'NOT SET'}`);
    }

    private findEquinoxLauncher(jdtlsHome: string): string {
        const pluginsDir = path.join(jdtlsHome, 'plugins');
        if (!fs.existsSync(pluginsDir)) {
            throw new Error(`JDT.LS 'plugins' directory not found in: ${jdtlsHome}`);
        }

        // 优先尝试无版本的 jar (某些安装方式会提供)
        const defaultLauncher = path.join(pluginsDir, 'org.eclipse.equinox.launcher.jar');
        if (fs.existsSync(defaultLauncher)) return defaultLauncher;

        const files = fs.readdirSync(pluginsDir);
        const launcher = files.find(f => f.startsWith('org.eclipse.equinox.launcher_') && f.endsWith('.jar'));

        if (!launcher) {
            throw new Error(`Equinox launcher jar not found in: ${pluginsDir}`);
        }
        return path.join(pluginsDir, launcher);
    }

    private getConfigDir(jdtlsHome: string): string {
        const platform = process.platform;
        let configDir = '';
        if (platform === 'win32') configDir = 'config_win';
        else if (platform === 'darwin') configDir = 'config_mac';
        else configDir = 'config_linux';

        const configPath = path.join(jdtlsHome, configDir);
        if (!fs.existsSync(configPath)) {
            throw new Error(`JDT.LS configuration directory not found: ${configPath}`);
        }
        return configPath;
    }

    private getDataDir(workspacePath: string): string {
        // 参考 jdtls.py 逻辑制作唯一的实例路径
        const workspaceHash = crypto.createHash('sha1').update(workspacePath).digest('hex');
        const baseName = path.basename(workspacePath);

        let cacheDir: string;
        if (process.platform === 'win32' && process.env.APPDATA) {
            cacheDir = process.env.APPDATA;
        } else if (process.platform === 'darwin') {
            cacheDir = path.join(os.homedir(), 'Library', 'Caches');
        } else {
            // Linux 或其他
            cacheDir = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
        }

        const jdtlsCache = path.join(cacheDir, 'jdtls');
        // 使用 hash 确保同一工作区的实例路径唯一且稳定
        return path.join(jdtlsCache, `jdtls-${baseName}-${workspaceHash}`);
    }

    async start(
        jdtlsHomeInput: string, // JDT.LS 安装根目录 (或 bin/jdtls 路径)
        workspacePath: string
    ): Promise<void> {
        if (this.connection) {
            return;
        }

        // 1. 推断 JDT.LS 的安装根目录
        let jdtlsHome = jdtlsHomeInput;
        // 兼容性处理：如果传入的是 bin/jdtls 或 bin/jdtls.bat
        if (jdtlsHomeInput.endsWith('.bat') || jdtlsHomeInput.endsWith('jdtls') || jdtlsHomeInput.includes('bin')) {
            if (fs.statSync(jdtlsHomeInput).isFile()) {
                jdtlsHome = path.dirname(path.dirname(jdtlsHomeInput));
            }
        }

        // 2. 确定 Java 可执行文件路径
        let javaExec = 'java';
        if (process.env.JAVA_HOME) {
            const ext = process.platform === 'win32' ? '.exe' : '';
            const testPath = path.join(process.env.JAVA_HOME, 'bin', `java${ext}`);
            if (fs.existsSync(testPath)) {
                javaExec = testPath;
            }
        }

        this.logDiagnostics(javaExec);

        // --- 核心修复：清理环境变量 ---
        const cleanEnv = { ...process.env };
        // 必须清理掉 PORT 和 CLIENT_PORT
        // 因为 MCP Inspector 会设置 PORT 环境变量，这会误导 JDT.LS 切换到 Socket 模式
        delete cleanEnv.PORT;
        delete cleanEnv.CLIENT_PORT;
        // 确保编码正确
        cleanEnv.JAVA_TOOL_OPTIONS = (cleanEnv.JAVA_TOOL_OPTIONS || '') + ' -Dfile.encoding=UTF-8';

        // 3. 准备 JDT.LS 必需的文件路径
        const jarPath = this.findEquinoxLauncher(jdtlsHome);
        const configPath = this.getConfigDir(jdtlsHome);

        // 动态计算数据目录，参考 jdtls.py
        const dataDir = this.getDataDir(workspacePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // 4. 构建 Java 启动参数 (参考 jdtls.py)
        // 关键点：Java 参数中的路径建议统一使用正斜杠，避免反斜杠被转义
        const args = [
            '-Declipse.application=org.eclipse.jdt.ls.core.id1',
            '-Dosgi.bundles.defaultStartLevel=4',
            '-Declipse.product=org.eclipse.jdt.ls.core.product',
            '-Dosgi.checkConfiguration=true',
            `-Dosgi.sharedConfiguration.area=${this.toForwardSlashes(configPath)}`,
            '-Dosgi.sharedConfiguration.area.readOnly=true',
            '-Dosgi.configuration.cascaded=true',
            '-Xms1G',
            '-Xmx1G', // 调低到 1G 与 python 脚本一致
            '--add-modules=ALL-SYSTEM',
            '--add-opens', 'java.base/java.util=ALL-UNNAMED',
            '--add-opens', 'java.base/java.lang=ALL-UNNAMED',
            // JVM 编码设置
            '-Dfile.encoding=UTF-8',
            '-jar', this.toForwardSlashes(jarPath),
            '-data', this.toForwardSlashes(dataDir)
        ];

        console.error(`[STEP 1] Launching JDT.LS with direct Java and clean environment...`);
        console.error(`[STEP 1] Data Directory: ${dataDir}`);

        // 在 Windows 上，即使直接调用 exe，使用 shell: true 也能更好地处理带空格的路径
        this.process = spawn(javaExec, args, {
            cwd: workspacePath,
            env: cleanEnv,
            windowsVerbatimArguments: true, // 保持参数原样，减少转义干扰
            stdio: ['pipe', 'pipe', 'pipe']
        });

        this.process.on('error', (err) => {
            console.error(`[JDT.LS Process Error] ${err.message}`);
        });

        this.process.on('exit', (code, signal) => {
            console.error(`[JDT.LS Process Exit] Code: ${code}, Signal: ${signal}`);
            this.connection = null;
            this.process = null;
        });

        this.process.stderr?.on('data', (data) => {
            const message = data.toString();
            // 仅记录关键错误信息，避免过多日志干扰
            if (message.includes('ERROR') || message.includes('Exception') || message.includes('fail')) {
                console.error(`[JDT.LS ERROR] ${message.trim()}`);
            }
        });

        if (!this.process.stdout || !this.process.stdin) {
            throw new Error('Failed to spawn JDT.LS process: stdout or stdin is null');
        }

        console.error(`[STEP 2] Creating JSON-RPC connection...`);
        this.connection = rpc.createMessageConnection(
            new rpc.StreamMessageReader(this.process.stdout),
            new rpc.StreamMessageWriter(this.process.stdin)
        );

        this.connection.onDispose(() => {
            console.error('[CONNECTION] JSON-RPC connection disposed');
        });

        this.connection.listen();

        this.connection.onNotification('textDocument/publishDiagnostics', (params) => {
            const uri = params.uri;
            // Clean up URI to be a file path for easier mapping if needed, 
            // but keeping URI as key is safer.
            // We can normalize when retrieving.
            this.diagnostics.set(uri, params.diagnostics);
        });

        console.error('[STEP 3] Sending "initialize" request...');
        try {
            const initResult = await this.connection.sendRequest('initialize', {
                processId: process.pid,
                rootUri: pathToFileURL(workspacePath).toString(),
                capabilities: {
                    workspace: {
                        configuration: true,
                        didChangeConfiguration: { dynamicRegistration: true },
                        workspaceFolders: true,
                        executeCommand: { dynamicRegistration: true }
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
                initializationOptions: {
                    settings: {
                        java: {
                            import: { gradle: { enabled: false }, maven: { enabled: true } }
                        }
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
            console.error('[STEP 4] "initialize" finished.');
            await this.connection.sendNotification('initialized', {});
            console.error('JDT.LS is ready.');
        } catch (error: any) {
            console.error(`[CRITICAL ERROR] Initialization failed: ${error.message}`);
            this.connection = null;
            throw error;
        }
    }

    isRunning(): boolean {
        return !!this.connection;
    }

    async stop() {
        if (this.connection) {
            try {
                await this.connection.sendRequest('shutdown');
                this.connection.sendNotification('exit');
            } catch (e) { }
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

    async getDiagnostics(filePath: string) {
        // Normalize path to URI to match map keys
        const uri = pathToFileURL(filePath).toString();

        // Sometimes JDT.LS might use slightly different URI encoding, 
        // we might need to be careful, but pathToFileURL is standard.
        return this.diagnostics.get(uri) || [];
    }
}
