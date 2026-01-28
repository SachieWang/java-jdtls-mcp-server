---
name: java-code-verification
title: Java Code Verification
description: Verify Java code correctness, find syntax errors and compile-time issues.
---

# Skill: Java Code Verification

## Description
This skill allows the agent to verify code changes by checking for compilation errors and warnings reported by the Eclipse JDT.LS compiler.

## Tools
- `java_open_file`: Pushes content to the server to trigger compilation. **REQUIRED after every edit.**
- `java_get_diagnostics`: Retrieves compiler errors and warnings. **The ONLY source of truth for code correctness.**

## Workflow

### 1. Preparation
Before verifying:
1.  **Check Server**: Ensure JDT.LS is `READY` (see `java-lifecycle`).

### 2. Verify Changes (Edit-Sync-Verify Loop)
After applying any edits to a Java file, you MUST follow this loop to ensure correctness:


1.  **Sync & Compile**: Call `java_open_file` with the *new* content. This triggers the incremental compiler in JDT.LS.
    ```json
    { "filePath": "/path/to/File.java", "content": "new content..." }
    ```
    *Note: JDT.LS publishes diagnostics asynchronously. It's usually fast, but not instant.*

2.  **Wait**: Pause briefly (if your environment allows) or simply proceed to the next step (the tool note warns about async nature).

3.  **Check Errors**: Call `java_get_diagnostics`.
    ```json
    { "filePath": "/path/to/File.java" }
    ```

4.  **Analyze**:
    - **Empty List `[]`**: No errors. Code is syntactically valid.
    - **Errors**: detailed in the JSON. Parse the line number and message to fix the issue.

### 2. Batch Verification
If you modified multiple files:
1.  Call `java_open_file` for ALL modified files.
2.  Call `java_get_diagnostics` for each file to ensure no regressions were introduced.
