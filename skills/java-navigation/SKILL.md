---
title: java-code-navigation
title: Java Code Navigation
description: Navigate Java projects, find definitions, and implementation details.
---

# Skill: Java Code Navigation

## Description
This skill enables the agent to navigate a Java project, understanding its structure, symbols, and dependencies. It is essential for any task involving reading or modifying Java code.

## Tools
- `java_open_file`: Synchronize file content with the server. **MUST** be called before other navigation commands on a file.
- `java_get_definition`: Find where a symbol is defined.
- `java_get_references`: Find where a symbol is used.
- `java_get_hover`: Get Javadocs and type signatures.

## Workflow

### 1. Understanding a File
When you need to understand a specific file or a symbol within it:

1.  **Sync**: Call `java_open_file` first to ensure the server sees the latest content.
    ```json
    { "filePath": "/abs/path/to/File.java", "content": "..." }
    ```
2.  **Inspect**: Only *after* syncing, usage hover to understand complex types or methods.
    ```json
    { "filePath": "/..", "line": 10, "character": 5 }
    ```

### 2. Following Dependencies (Go to Definition)
When you see a class usage (e.g., `UserService service`) and need to see its implementation:

1.  Call `java_get_definition` on the symbol `UserService`.
2.  The server returns the location (URI + range).
3.  Read the target file at that location.

### 3. Impact Analysis (Find References)
Before modifying a public method or class:

1.  Call `java_get_references` on the symbol.
2.  Review the list of call sites to ensure your changes won't break dependents.
