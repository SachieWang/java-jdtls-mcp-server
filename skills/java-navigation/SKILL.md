---
name: java-code-navigation
title: Java Code Navigation
description: Navigate Java projects, find definitions, and implementation details.
---

# Skill: Java Code Navigation

## Description
This skill enables the agent to navigate a Java project, understanding its structure, symbols, and dependencies. It is essential for any task involving reading or modifying Java code.

## Tools
- `java_search_symbols`: Search for symbols by name (Class, Method) across the workspace. **Preferred for natural language requests.**
- `java_get_file_symbols`: List all symbols in a specific file. Useful for exploring a file's structure.
- `java_get_definition`: Find where a symbol is defined. Requires coordinates.
- `java_get_references`: Find where a symbol is used. Requires coordinates.
- `java_get_hover`: Get Javadocs and signatures. Requires coordinates.
- `java_open_file`: ONLY needed if the file on disk is not up-to-date or you are making edits.

## Workflow

### 1. Finding a Symbol (Natural Language)
When a user asks "Where is the `UserService` class?" or "Find the `save` method":

1.  **Search**: Call `java_search_symbols` with the name.
    ```json
    { "query": "UserService" }
    ```
2.  **Locate**: Use the returned URI and range to find the file and coordinates.
3.  **Inspect**: Call `java_get_hover` or `java_get_definition` at those coordinates if you need more detail.

### 2. Understanding a File Structure
Instead of reading the whole file:
1.  **List Symbols**: Call `java_get_file_symbols`.
2.  **Summary**: Review the list of methods and classes to understand what the file does.
3.  **Read Selective**: Read only the relevant line ranges if needed.

### 2. Following Dependencies (Go to Definition)
When you see a class usage (e.g., `UserService service`) and need to see its implementation:

1.  Call `java_get_definition` on the symbol `UserService`.
2.  The server returns the location (URI + range).
3.  Read the target file at that location.

### 3. Impact Analysis (Find References)
Before modifying a public method or class:

1.  Call `java_get_references` on the symbol.
2.  Review the list of call sites to ensure your changes won't break dependents.
