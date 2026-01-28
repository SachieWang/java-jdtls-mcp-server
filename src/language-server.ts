import { spawn, ChildProcess, execSync } from 'child_process';
import * as rpc from 'vscode-jsonrpc/node.js';
import { pathToFileURL } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

export enum ServerState {
    STOPPED = 'STOPPED',
    STARTING = 'STARTING',
    INITIALIZING = 'INITIALIZING',
    READY = 'READY',
    ERROR = 'ERROR'
}

export interface MavenConfig {
    userSettings?: string;
    globalSettings?: string;
    offline?: boolean;
}

export class JavaLanguageServer {
    private process: ChildProcess | null = null;
    private connection: rpc.MessageConnection | null = null;
    private capabilities: any = null;
    private diagnostics: Map<string, any[]> = new Map();
    private state: ServerState = ServerState.STOPPED;
    private lastError: string | null = null;
    private currentWorkspace: string | null = null;

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
        jdtlsHomeInput: string,
        workspacePath: string,
        javaHomeInput?: string,
        javaRuntimes?: any[],
        mavenConfig?: MavenConfig
    ): Promise<void> {
        if (this.state !== ServerState.STOPPED && this.state !== ServerState.ERROR) {
            return;
        }

        this.state = ServerState.STARTING;
        this.lastError = null;

        // 1. 推断 JDT.LS 的安装根目录
        if (!jdtlsHomeInput) {
            throw new Error('未指定 JDT.LS 的安装路径 (JDTLS_HOME)。请设置该环境变量，或在调用 java_start 时直接提供路径。');
        }
        let jdtlsHome = jdtlsHomeInput;
        // 兼容性处理：如果传入的是 bin/jdtls 或 bin/jdtls.bat
        if (jdtlsHomeInput.endsWith('.bat') || jdtlsHomeInput.endsWith('jdtls') || jdtlsHomeInput.includes('bin')) {
            if (fs.existsSync(jdtlsHomeInput) && fs.statSync(jdtlsHomeInput).isFile()) {
                jdtlsHome = path.dirname(path.dirname(jdtlsHomeInput));
            }
        }

        // 2. 确定 Java Home 和 可执行文件路径
        // 优先级: 参数 > JDTLS_JAVA_HOME > JAVA_HOME
        let javaHome = javaHomeInput || process.env.JDTLS_JAVA_HOME || process.env.JAVA_HOME;
        let javaExec = 'java';

        if (javaHome) {
            const ext = process.platform === 'win32' ? '.exe' : '';
            const testPath = path.join(javaHome, 'bin', `java${ext}`);
            if (fs.existsSync(testPath)) {
                javaExec = testPath;
            } else {
                console.error(`[WARNING] 指定的 JAVA_HOME 中未找到 java 可执行文件: ${testPath}，尝试使用系统默认 java`);
            }
        }

        this.logDiagnostics(javaExec);

        // --- 核心修复：清理环境变量 ---
        const cleanEnv = { ...process.env };
        // 必须清理掉 PORT 和 CLIENT_PORT
        // 因为 MCP Inspector 会设置 PORT 环境变量，这会误导 JDT.LS 切换到 Socket 模式
        delete cleanEnv.PORT;
        delete cleanEnv.CLIENT_PORT;

        // 显式设置 JAVA_HOME，防止 JDT.LS 脚本内部再次读取系统环境变量
        if (javaHome) {
            cleanEnv.JAVA_HOME = javaHome;
        }
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
            '-Dlog.level=ALL',
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

        const currentProcess = this.process;
        currentProcess.on('error', (err) => {
            if (this.process === currentProcess) {
                console.error(`[JDT.LS Process Error] ${err.message}`);
                this.state = ServerState.ERROR;
                this.lastError = err.message;
            }
        });

        currentProcess.on('exit', (code, signal) => {
            console.error(`[JDT.LS Process Exit] Code: ${code}, Signal: ${signal}`);
            // 仅当退出的进程是当前活跃进程时，才清理连接状态
            if (this.process === currentProcess) {
                this.connection = null;
                this.process = null;
                this.capabilities = null;
                this.state = ServerState.STOPPED;
            }
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

        this.connection.onRequest('client/registerCapability', (params) => {
            // console.error(`[DEBUG] client/registerCapability: ${JSON.stringify(params, null, 2)}`);
            return {};
        });

        this.connection.onRequest('client/unregisterCapability', (params) => {
            // console.error(`[DEBUG] client/unregisterCapability: ${JSON.stringify(params, null, 2)}`);
            return {};
        });

        this.connection.onNotification('textDocument/publishDiagnostics', (params) => {
            const uri = params.uri;
            this.diagnostics.set(uri, params.diagnostics);
            console.error(`[DEBUG] publishDiagnostics: ${uri}`);
        });

        this.connection.onNotification('language/status', (params) => {
            console.error(`[DEBUG] language/status: ${JSON.stringify(params, null, 2)}`);
        });

        this.connection.onNotification('language/actionableNotification', (params) => {
            console.error(`[DEBUG] language/actionableNotification: ${JSON.stringify(params, null, 2)}`);
        });

        // 5. 异步初始化过程 (不阻塞工具调用)
        this.currentWorkspace = workspacePath;
        this.state = ServerState.INITIALIZING;
        this.initializeAsync(workspacePath, javaRuntimes, mavenConfig).catch(err => {
            console.error(`[CRITICAL] Background initialization failed: ${err.message}`);
        });
    }

    private async initializeAsync(workspacePath: string, javaRuntimes?: any[], mavenConfig?: MavenConfig) {
        if (!this.connection) return;

        console.error('[STEP 3] Sending "initialize" request (Async)...');
        try {
            const initResult = await this.connection.sendRequest('initialize', {
                processId: process.pid,
                rootUri: pathToFileURL(workspacePath).toString(),
                capabilities: {
                    workspace: {
                        configuration: true,
                        didChangeConfiguration: { dynamicRegistration: true },
                        workspaceFolders: true,
                        executeCommand: { dynamicRegistration: true },
                        symbol: {
                            dynamicRegistration: true,
                            symbolKind: {
                                valueSet: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]
                            }
                        }
                    },
                    textDocument: {
                        synchronization: {
                            dynamicRegistration: true,
                            willSave: true,
                            willSaveWaitUntil: true,
                            didSave: true
                        },
                        callHierarchy: { dynamicRegistration: true },
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
                            import: {
                                gradle: { enabled: false },
                                maven: {
                                    enabled: true,
                                    offline: mavenConfig?.offline ?? false

                                }
                            },
                            maven: {
                                downloadSources: true,
                                updateSnapshots: true
                            },
                            configuration: {
                                runtimes: javaRuntimes || [],
                                maven: {
                                    userSettings: mavenConfig?.userSettings,
                                    globalSettings: mavenConfig?.globalSettings,
                                }
                            },
                            references: {
                                includeAccessors: true,
                                includeDecompiledSources: true
                            },
                            symbols: {
                                includeSourceMethodDeclarations: true
                            }
                        }
                    }
                },
                workspaceFolders: [
                    {
                        name: 'workspace',
                        uri: pathToFileURL(workspacePath).toString()
                    }
                ],
                extendedClientCapabilities: {
                    progressReportsSupported: true,
                    classFileContentsSupport: true,
                    overrideMethodsPromptSupport: true,
                    hashCodeEqualsPromptSupport: true,
                    advancedOrganizeImportsSupport: true,
                    generateConstructorsPromptSupport: true,
                    generateDelegateMethodsPromptSupport: true,
                    advancedExtractRefactoringSupport: true,
                    moveRefactoringSupport: true,
                    clientHoverProvider: true,
                    clientDocumentSymbolProvider: true,
                    gradleChecksumWrapperPromptSupport: true,
                    resolveAdditionalTextEditsSupport: true,
                    advancedIntroduceParameterRefactoringSupport: true
                }
            });

            this.capabilities = initResult;
            console.error('[DEBUG] the server capabilities:', JSON.stringify(this.capabilities, null, 2));
            console.error('[STEP 4] "initialize" finished.');
            await this.connection.sendNotification('initialized', {});
            this.state = ServerState.READY;
            console.error('JDT.LS is ready.');
        } catch (error: any) {
            console.error(`[CRITICAL ERROR] Initialization failed: ${error.message}`);
            this.state = ServerState.ERROR;
            this.lastError = error.message;
        }
    }

    isRunning(): boolean {
        // 对于启动逻辑来说，只有处于 STOPPED 或 ERROR 状态才算“未运行”
        return this.state !== ServerState.STOPPED && this.state !== ServerState.ERROR;
    }

    getState(): ServerState {
        return this.state;
    }

    ensureReady() {
        if (this.state === ServerState.STOPPED) {
            throw new McpError(ErrorCode.InvalidRequest, 'Java Language Server not started. Please call java_start first.');
        }
        if (this.state === ServerState.STARTING || this.state === ServerState.INITIALIZING) {
            throw new McpError(ErrorCode.InternalError, 'Java Language Server is still initializing. Please wait.');
        }
        if (this.state === ServerState.ERROR) {
            throw new McpError(ErrorCode.InternalError, `Java Language Server failed to start: ${this.lastError}`);
        }
        if (!this.connection) {
            throw new McpError(ErrorCode.InternalError, 'Server connection lost. Try java_restart.');
        }
    }

    async stop() {
        if (this.connection) {
            try {
                // 尝试优雅关闭，但不强制等待成功
                await Promise.race([
                    this.connection.sendRequest('shutdown'),
                    new Promise(resolve => setTimeout(resolve, 800))
                ]).catch(() => { });
                this.connection.sendNotification('exit');
            } catch (e) { }

            try {
                this.connection.dispose();
            } catch (e) { }
            this.connection = null;
        }

        if (this.process) {
            try {
                this.process.removeAllListeners();
                this.process.kill('SIGKILL'); // 确保物理销毁
            } catch (e) { }
            this.process = null;
        }

        this.capabilities = null;
        this.diagnostics.clear(); // 清理旧的诊断信息
        this.currentWorkspace = null;
        this.state = ServerState.STOPPED;
    }

    getWorkspace(): string | null {
        return this.currentWorkspace;
    }

    private toUri(pathOrUri: string): string {
        // If it looks like a URI (contains ://), return it as is.
        // This handles jdt://, file://, etc.
        if (pathOrUri.includes('://')) {
            return pathOrUri;
        }
        // Otherwise treat it as a file path
        return pathToFileURL(pathOrUri).toString();
    }

    async getDefinition(filePath: string, line: number, character: number) {
        this.ensureReady();
        const uri = this.toUri(filePath);
        return this.connection!.sendRequest('textDocument/definition', {
            textDocument: { uri },
            position: { line, character }
        });
    }

    async getReferences(filePath: string, line: number, character: number) {
        this.ensureReady();
        const uri = this.toUri(filePath);
        return this.connection!.sendRequest('textDocument/references', {
            textDocument: { uri },
            position: { line, character },
            context: { includeDeclaration: true }
        });
    }

    async getHover(filePath: string, line: number, character: number) {
        this.ensureReady();
        const uri = this.toUri(filePath);
        return this.connection!.sendRequest('textDocument/hover', {
            textDocument: { uri },
            position: { line, character }
        });
    }

    async didOpen(filePath: string, content: string) {
        this.ensureReady();
        const uri = this.toUri(filePath);
        return this.connection!.sendNotification('textDocument/didOpen', {
            textDocument: {
                uri,
                languageId: 'java',
                version: 1,
                text: content
            }
        });
    }

    async getDiagnostics(filePath: string) {
        // 允许直接查询诊断，甚至在 READY 前（可能已经开始 publish 了）
        const uri = this.toUri(filePath);
        return this.diagnostics.get(uri) || [];
    }

    async addWorkspaceFolder(folderPath: string) {
        this.ensureReady();
        const uri = this.toUri(folderPath);
        const baseName = path.basename(folderPath);

        return this.connection!.sendNotification('workspace/didChangeWorkspaceFolders', {
            event: {
                added: [
                    {
                        uri: uri,
                        name: baseName
                    }
                ],
                removed: []
            }
        });
    }

    async searchSymbols(query: string) {
        this.ensureReady();
        return this.connection!.sendRequest('workspace/symbol', { query });
    }

    async getDocumentSymbols(filePath: string) {
        this.ensureReady();
        const uri = this.toUri(filePath);
        return this.connection!.sendRequest('textDocument/documentSymbol', {
            textDocument: { uri }
        });
    }
}
