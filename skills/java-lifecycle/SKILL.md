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

1.  **Check Environment**:
    - Try to find `JDTLS_HOME` in the environment.
    - Optionally check for `JDTLS_JAVA_HOME` if a specific Java version is needed that differs from the system default.
    - If `JDTLS_HOME` is missing, **STOP** and ask the user properly.
2.  **Start**: Call `java_start`. You can optionally provide `javaHome` if the user specifies a custom JDK path or if `JDTLS_JAVA_HOME` was found.
    ```json
    { 
      "jdtlsHome": "/path/to/jdtls",
      "javaHome": "/path/to/jdk-17" 
    }
    ```
    *Note: `javaHome` takes precedence over `JDTLS_JAVA_HOME` and system `JAVA_HOME`. Use it if you need to enforce a specific runtime.*

### 2. Recovering from Stale State
If the server seems unresponsive or symbol lookups are consistently failing:

1.  **Restart**:
    ```json
    { "jdtlsHome": "..." }
    ```
    This kills the subprocess and spawns a fresh one, re-indexing the workspace.
