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

### 2. Load the Project
**Immediately** after ensuring the server is started (see `java-lifecycle`), load the project:

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
