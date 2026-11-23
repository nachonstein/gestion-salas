# Discovery Agent

The Discovery Agent is an AI-powered Copilot agent for discovery and reverse engineering of legacy systems. It deploys three independent agents that scan source code, ingest documentation, and observe running applications, producing a Sprint 0 foundation baseline.

It integrates directly into GitHub Copilot (`@discovery-code`, `@discovery-knowledge`, `@discovery-runtime`), enabling teams to reverse-engineer legacy codebases, extract knowledge from existing documentation, and map runtime behavior — all through natural language interaction without leaving the editor.

![alt text](docs/images/discovery_agent.png)

Key capabilities:

- **Three-agent architecture** — separates concerns into static code analysis, documentation ingestion, and runtime observation, each runnable independently or in combination.
- **Foundation-first output** — all agents converge on `.foundation/` documents that serve as the authoritative baseline for downstream delivery work.
- **Multi-language code indexing** — uses Tree-sitter/Roslyn for deterministic parsing with pluggable semantic resolvers (TypeScript, Java, C#, Python, Go, Kotlin, AngularJS) for deep type resolution.
- **Universal document ingestion** — converts PDF, DOCX, Excel, PowerPoint, Draw.io, images, and audio/video into structured Markdown ready for AI consumption.
- **Runtime behavioral mapping** — observes running applications via Playwright, records user flows, and cross-references observed behavior back to source code.
- **Extensible skill architecture** — add new resolvers, converters, or pipeline phases without modifying the core agent logic.


## Documentation

| Document | Audience | Contents |
|----------|----------|----------|
| [Installation Guide](how-to/install.md) | All users | Step-by-step installation, PAT setup, verification |
| [User Guide](how-to/discovery_user_guide.md) | End users | Getting started, agent commands, output artifacts |
| [Architecture Guide](how-to/discovery_architecture.md) | Advanced users | Internal ecosystem, pipelines, artifact schemas |
| [Extension Guide](how-to/discovery_extension_guide.md) | Contributors | Creating skills, resolvers, and agents |


## Sub Agents

| Agent | File | Main Responsibility |
|-------|------|---------------------|
| `@discovery-code` | `discovery-code-agent.md` | Scan source code, extract symbols, build graph, technical reports, technical foundation docs |
| `@discovery-knowledge` | `discovery-knowledge-agent.md` | Ingest/convert docs, transcribe/translate content, documentation foundation docs |
| `@discovery-runtime` | `discovery-runtime-agent.md` | Observe running apps, explore flows, test planning, cross-reference, behavioral foundation docs |


## Quick Start

**Install** (one-time per repository, requires a Vanguard PAT — see [Install Guide](how-to/install.md)):

```bash
npx vg-discovery-agent
```

**Update to latest:**

```bash
npx vg-discovery-agent@latest
```

Feed: `https://dev.azure.com/genaivanguard/Public%20Vanguard%20Assets/_artifacts/feed/vg-discovery-agent`

Then open GitHub Copilot Chat in your IDE (e.g. VS Code) and start with `@discovery-code`, `@discovery-knowledge`, or `@discovery-runtime`.

## Pipelines

Each sub-agent runs its own independent pipeline. All pipelines end with `write-foundation` to produce the Sprint 0 baseline.

**`@discovery-code` — Static code analysis**

```
scan → index (extract-symbols + build-graph) → write-foundation
```

| Phase | Description |
|-------|-------------|
| 1. Scan | Discover repo structure, languages, frameworks, and entry points |
| 2. Index | Extract symbols from all files and build the relationship graph |
| 3. Write foundation | Synthesize technical foundation documents into `.foundation/` |

**`@discovery-knowledge` — Documentation analysis**

```
ingest → [transcribe / translate] → write-foundation
```

| Phase | Description |
|-------|-------------|
| 1. Ingest | Convert and index documents (PDF, DOCX, Excel, PPT, Draw.io, images, audio/video) |
| 2. Transcribe / Translate | Optional enrichment of ingested content |
| 3. Write foundation | Synthesize knowledge base into documentation foundation documents |

**`@discovery-runtime` — Runtime behavioral analysis**

```
observe → explore → extract → testplan → crossref → write-foundation
```

| Phase | Description |
|-------|-------------|
| 1. Observe | Capture sitemap and DOM snapshots of the running application |
| 2. Explore | Record interactive user flows |
| 3. Extract | Synthesize the functional capability map |
| 4. Test plan | Generate a risk-based test plan |
| 5. Cross-reference | Map observed behavior to source code |
| 6. Write foundation | Synthesize behavioral foundation documents into `.foundation/` |

## Foundation Metadata Contract

All `.foundation/*.md` documents must be sealed with deterministic metadata after each write/merge.

Mandatory frontmatter fields:

- `version`
- `generated_at`
- `last_modified_by`
- `last_modified_by_version`
- `foundation_hash`
- `produced_from`

Standard command:

```bash
node .github/tools/foundation/version-foundation.js \
  --file .foundation/<document>.md \
  --agent <discovery-code|discovery-knowledge|discovery-runtime> \
  --produced-from <artifact-1>,<artifact-2>
```

Versioning behavior:

- Initializes documents at `1.0.0`
- Keeps the same version when content hash is unchanged
- Bumps `patch` by default when content changes (`--bump minor|major` available)

## Commands

**`@discovery-code`**

| Command | Purpose |
|---------|---------|
| `scan` | Discover repo structure, languages, and entry points |
| `index` | Extract symbols and build the relationship graph |
| `full` | Run the complete pipeline (scan + index) |
| `write-foundation --slug <module>` | Generate technical foundation documents |

**`@discovery-knowledge`**

| Command | Purpose |
|---------|---------|
| `ingest <path>` | Convert and ingest documents |
| `transcribe <path>` | Transcribe audio/video files |
| `translate <path> -t <language>` | Translate documents to a target language |
| `write-foundation` | Synthesize knowledge base into foundation documents |

**`@discovery-runtime`**

| Command | Purpose |
|---------|---------|
| `observe <url>` | Capture sitemap and DOM snapshots |
| `explore <url>` | Record interactive user flows |
| `extract` | Synthesize the functional capability map |
| `testplan` | Generate a risk-based test plan |
| `crossref` | Map observed behavior to source code |
| `full <url>` | Run the complete pipeline |
| `write-foundation --slug <module>` | Generate behavioral foundation documents |

## Architecture

Responsibility split:

- **Agents** (`agents/`): global policy and pipeline orchestration per domain — no procedural logic
- **Skills** (`skills/`): atomic operational procedures grouped by agent (`discovery-code-*`, `discovery-knowledge-*`, `discovery-runtime-*`)
- **Tools** (`tools/`): deterministic executable scripts (Node.js / Python) invoked by skills — not run directly by the user
- **Templates** (`templates/`): structure of the output foundation documents

Each agent produces two types of output: **foundation documents** (`.foundation/`) — cross-cutting, reusable by delivery agents — and **functional requirements** (`.requirement/<slug>/`) — module-specific behavioral artifacts.

## Project Structure

```
.github/
  agents/
    discovery-code-agent.md
    discovery-knowledge-agent.md
    discovery-runtime-agent.md
  skills/
    discovery-code-*/        # static analysis: scan, index, extract-symbols, build-graph…
    discovery-knowledge-*/   # document processing: convert-pdf, convert-docx, translate…
    discovery-runtime-*/     # behavioral analysis: observe-app, explore-flows, testplan…
    clean-workspace/
  templates/
    foundational_context/    # output document templates
  tools/
    static-code-analysis/    # scan and symbol extraction scripts
    knowledge/               # document ingestion and conversion scripts
    observation/             # Playwright scripts
    foundation/              # deterministic metadata/versioning for .foundation/*.md
```

## npm Package

This repository is packaged and published to the Vanguard Azure DevOps Artifacts feed. When installed, it copies `.github/` into the consumer project root.

| File | Purpose |
|------|---------|
| `package.json` | Package metadata, bundled files, and install hooks |
| `cli.js` | Copies `.github/` to consumer project root on install |
| `.npmrc` | Registry configuration |
| `azure-pipelines.yml` | Bump patch version and publish to Azure Artifacts on every push to `main` |
| `azure-pipelines-mirror.yml` | Mirror private `main` to the public repository after each release |

Every push to `main` triggers the publish pipeline to bump the patch version, publish to Azure Artifacts, and commit the bump back using `[skip ci]`. The mirror pipeline then syncs the result to the public repository.

## Contribute

1. Keep agents, skills, and tools aligned with the architecture model above.
2. Branch from `main` and validate with a real workspace run.
3. Reflect stable knowledge in foundation docs when applicable.
4. See [Extension Guide](how-to/discovery_extension_guide.md) for adding new skills, resolvers, or agents.
5. Open a PR with affected flow, expected outputs, and compatibility notes.

## Changelog

### 2.0.1

- **Three-agent architecture** — renamed and reorganized agents into `@discovery-code`, `@discovery-knowledge`, and `@discovery-runtime` with clear separation of responsibilities.
- **Complete documentation overhaul** — new User Guide, Architecture Guide, Extension Guide, and Install Guide written from scratch in English.
- **Foundation document system** — introduced `.foundation/` as the single output target, with layered contributions (normative, observed, behavioral) from each agent.
- **Multi-module support** — all pipelines now support slug-based segregation for analyzing multiple modules independently.
- **Pluggable semantic resolvers** — added resolvers for AngularJS, TypeScript, Java, Python, Go, C#, and Kotlin. C# uses Roslyn instead of Tree-sitter.
- **`create-resolver` meta-skill** — the agent can now guide creation of new resolvers for unsupported frameworks.
- **Universal document ingestion** — added converters for PDF, DOCX, Excel, PowerPoint, Draw.io, images, and audio/video transcription.
- **Runtime behavioral analysis** — full Playwright MCP integration for observing running apps, recording flows, generating test plans, and cross-referencing with code.
- **Screen specifications and flow storyboards** — new artifacts in `.requirement/<slug>/screen-specs/`.
- **Functional coverage reports** — risk heat maps and actionable recommendations from combined analysis.
- **Conditional Null-Field Delegation Pattern** — documented for multiple languages.
- **JSON wire name mapping** — cross-language pattern documentation.
- **Foundation document classification guidelines** — standardized header format and classification rules.
- **Recursive LLM analysis (`rlm-analyze`)** — hierarchical decomposition for large multi-file queries.
- **Repomix integration** — compressed XML codebase representation for token-efficient analysis.
- **Pipeline orchestrator script** — `pipeline.js` for non-interactive CI/CD execution.
- **Registry files** — `registry.json` for tracking analyzed modules across agents.
- **Removed reporting agent** — consolidated into existing agents.
- **Removed unused tools and skills** — streamlined the skill set.

### 1.0.0

- Initial release with three agents: `@discovery-code`, `@discovery-doc`, `@discovery-nav`.
- Basic static code analysis: scan repo structure, extract symbols via Tree-sitter, build dependency graph.
- Documentation analysis: ingest PDF and DOCX documents.
- Navigation observation: basic Playwright-based app observation.
- Foundation document output to `.foundation/`.
- npm package with `postinstall` hook to copy `.github/` into consumer projects.
- Azure Pipelines for automated versioning and publishing to Azure Artifacts feed.
- Mirror pipeline to sync private repository to public.

---

## License

This project is licensed under the **Apache License, Version 2.0** with additional terms and conditions from Capgemini.

See [Capgemini Agentic Workbench - license, terms and conditions](Capgemini%20Agentic%20Workbench%20-%20license,%20terms%20and%20conditions.md) for the full text (also available as [PDF](Capgemini%20Agentic%20Workbench%20-%20license,%20terms%20and%20conditions.pdf)).