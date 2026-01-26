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

## Workflow

### 1. Initialization
When the session begins, or if you receive "Server not started" errors:

1.  **Check Environment**: Look for `JDTLS_HOME` environment variable or ask the user for the JDT.LS path.
2.  **Start**:
    ```json
    { "jdtlsHome": "/path/to/jdtls" }
    ```

### 2. Recovering from Stale State
If the server seems unresponsive or symbol lookups are consistently failing:

1.  **Restart**:
    ```json
    { "jdtlsHome": "..." }
    ```
    This kills the subprocess and spawns a fresh one, re-indexing the workspace.
