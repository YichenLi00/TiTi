# Claude Code Project Guidelines


## 🧠 Workflow & Plugins Strategy
This project uses specific plugins to enhance workflow. Please follow this loop:

1.  **Planning (Superpowers)**: For complex tasks, ALWAYS start by outlining a plan. Do not jump straight to coding.
    - If the request is ambiguous, ask clarifying questions.
2.  **Knowledge Retrieval (Context7)**: Before using 3rd-party libraries or frameworks, if you are not 100% sure about the latest API changes, explicitly use `context7` to fetch documentation.
    - *Example*: "Using context7, check the latest syntax for [library_name]."
3.  **Implementation**: Write clean, modular code.
4.  **Refactoring (Code Simplifier)**: Prioritize readability. If a function gets too complex, suggest a refactor or split it up. Keep code DRY (Don't Repeat Yourself).
5.  **Testing**: Verify changes using the test command provided above.

## 📝 Git & Commit Standards
**IMPORTANT: Git Configuration**
- **NO CO-AUTHOR**: Never add "Co-authored-by: Claude Code" or any similar attribution trailer to commit messages.
- **Format**: Use Semantic Commits (Conventional Commits).
  - `feat: add new login handler`
  - `fix: resolve crash on startup`
  - `refactor: simplify data parsing logic`
  - `docs: update API documentation`
- **Style**:
  - Use imperative mood ("add" not "added").
  - Lowercase subject line.
  - Keep the first line under 72 characters.

## ✅ Trusted Tools
# Claude is allowed to run these commands without asking for permission:
- git
- npm
- python
- pip
- ls
- cat
- grep
- pytest

## 🚫 Anti-Patterns
- Do not leave "TODO" comments without a plan to address them immediately.
- Do not leave commented-out code (dead code).
- Do not make assumptions about library versions; verify with Context7.