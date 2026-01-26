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
    - If it's missing, **STOP** and ask the user: "I couldn't find the JDTLS installation path. Could you please provide the absolute path to your JDT.LS root directory?"
2.  **Start**: Once you have the path (either from environment or user), call `java_start`.
    ```json
    { "jdtlsHome": "/path/to/jdtls" }
    ```
    *Note: If the user provides the path, remember it for the duration of the session.*

### 2. Recovering from Stale State
If the server seems unresponsive or symbol lookups are consistently failing:

1.  **Restart**:
    ```json
    { "jdtlsHome": "..." }
    ```
    This kills the subprocess and spawns a fresh one, re-indexing the workspace.
