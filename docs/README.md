# Docs

Index of everything under `docs/`. Project rules and commands live in [AGENTS.md](../AGENTS.md).

## What are you doing?

| Task                                        | Read                                                          |
| ------------------------------------------- | ------------------------------------------------------------- |
| Setting up the project locally              | [dev/setup.md](dev/setup.md)                                  |
| Understanding how a request is served       | [llm/architecture.md](llm/architecture.md)                    |
| Adding a project, a page or a dynamic route | [llm/architecture.md](llm/architecture.md) (how-to sections)  |
| Writing components, styles or tests         | [llm/conventions.md](llm/conventions.md)                      |
| Changing security headers or the CSP        | [llm/architecture.md](llm/architecture.md) (Security headers) |
| Planning a bigger change                    | Write a plan in [plans/](plans/)                              |

## Directories

| Directory        | Holds                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| [dev/](dev/)     | Running, building, testing and deploying                                                           |
| [llm/](llm/)     | How the site is built, written so an agent can act on it; each file says when to read it on line 1 |
| [plans/](plans/) | In-flight implementation plans only; finished plans are folded into `llm/` and deleted             |
