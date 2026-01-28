---
name: java-project-load
title: Java Maven Project Loading
description: Efficiently load and index entire Maven projects.
---

# Skill: Java Maven Project Loading

## Description
This skill enables the agent to load an entire Maven project into the Java Language Server's workspace context at once. This is significantly more efficient than opening files individually because it triggers JDT.LS to parse the `pom.xml`, resolve dependencies, and index the codebase for symbol navigation and diagnostics.

## Tools
- `java_load_maven_project`: Loads a Maven project from a specified path.

## Workflow

### 1. Identify Maven Project
If the user's request involves a specific project directory and you see a `pom.xml` at the root, it is a Maven project.

### 2. Pre-condition: Check Server Status
**Crucial**: Before calling the load tool, you MUST ensure the Java Language Server is ready:
1.  Follow the **`java-lifecycle`** skill to check the server status using `java_get_status`.
2.  Wait until the status is **`READY`**. If it is `STARTING` or `INITIALIZING`, inform the user and wait; do NOT trigger the project load prematurely as it may cause timeouts or index corruption.

### 3. Load the Project
Once the server is `READY`, load the project:

```json
{
  "projectPath": "c:/absolute/path/to/project_root"
}
```

**Benefits**:
- **Full Context**: You can immediately query for symbols (definitions, references) across the entire project without `java_open_file`.
- **Diagnostics**: You will receive project-wide errors (e.g., missing dependencies).

### 3. Verify
After loading, you can expect the server to know about classes in that project. You might verify by checking for diagnostics or simple symbol lookup.
