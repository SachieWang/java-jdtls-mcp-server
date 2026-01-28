---
name: java-server-lifecycle
title: Java Server Lifecycle
description: Manage the Java Language Server process.
---

# Skill: Java Server Lifecycle

## Description
This skill manages the underlying Eclipse JDT.LS process. It is the foundation for all other skills.

## Tools
- `java_start`: Starts the server.
- `java_restart`: Restarts the server (clears state).
- `java_get_status`: Checks current server status (READY, INITIALIZING, etc.).

## Workflow

### 1. Initialization
When the session begins, or if you receive "Server not started" errors:

1.  **Check Status**: Call `java_get_status` to see if the server is already running and for which workspace.
    - If status is `READY` and workspace matches current project: **STOP**, the server is ready.
    - If status is `STARTING` or `INITIALIZING`: **Wait** and inform the user that JDT.LS is warming up in the background. Do NOT call `java_start`.
    - If status is `STOPPED`, `ERROR`, or workspace mismatch: Proceed to start.
2.  **Check Environment**:
    - Try to find `JDTLS_HOME` in the environment.
    - Optionally check for `JDTLS_JAVA_HOME` if a specific Java version is needed.
    - If `JDTLS_HOME` is missing, **STOP** and ask the user properly.
3.  **Start**: Call `java_start`. 
    ```json
    { 
      "jdtlsHome": "/path/to/jdtls",
      "workspacePath": "/current/project/path"
    }
    ```
    *Note: `java_start` is now idempotent. If called on an already running workspace, it will simply return the current status instead of restarting.*

