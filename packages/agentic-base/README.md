# Agentic Base - Claude Code Starter Kit

A language-agnostic starter kit for Claude Code projects featuring Context Engineering templates, proven command patterns, and project scaffolding.

## What is Agentic Base?

Agentic Base is a collection of templates and configurations that help you quickly set up new projects optimized for working with Claude Code. It includes:

- **Context Engineering Templates**: Documentation structure that provides Claude with comprehensive project context
- **Claude Code Commands**: Proven slash command patterns for common workflows
- **Project Templates**: Starter files for different project types
- **Configuration Templates**: CLAUDE.md and project setup files

## Quick Start

### 1. Copy to Your New Project

```bash
# Copy the entire contents to your new project
cp -r packages/agentic-base/* /path/to/your/new/project/

# Or copy specific components you need
cp -r packages/agentic-base/.claude /path/to/your/project/
cp packages/agentic-base/CLAUDE.md /path/to/your/project/
```

### 2. Customize for Your Project

1. **Update CLAUDE.md**: Edit the project configuration template with your specific details
2. **Set up Documentation**: Copy templates from `templates/docs/` to your project's documentation folder
3. **Configure Commands**: Customize the Claude Code commands in `.claude/commands/` for your workflow
4. **Add Project Files**: Use templates from `templates/` as starting points

### 3. Initialize Context Engineering

The starter kit includes templates for Context Engineering, a methodology that provides comprehensive context to AI coding assistants:

```bash
# Copy Context Engineering documentation structure
cp -r templates/docs/context-engineering /path/to/your/project/docs/

# Customize each template file for your project:
# - planning.md: Project overview and links
# - architecture.md: System architecture details  
# - coding-standards.md: Language-specific conventions
```

## What's Included

### Claude Code Commands (`.claude/commands/`)

Pre-configured slash commands for common workflows:

- **`/init-context-engineering`**: Set up Context Engineering structure
- **`/generate-prp`**: Create comprehensive Product Requirements Prompts
- **`/execute-prp`**: Execute implementation plans with validation
- **`/feature-from-ado`**: Create features from Azure DevOps work items
- **`/feature-from-description`**: Create features from text descriptions
- **`/work`**: General work task management

### Project Templates (`templates/`)

- **`README-template.md`**: Comprehensive README template
- **`docs/context-engineering/`**: Complete Context Engineering documentation structure
  - `planning.md`: Project planning and overview
  - `architecture.md`: System architecture documentation
  - `coding-standards.md`: Coding standards and conventions

### Configuration Templates

- **`CLAUDE.md`**: Main project configuration for Claude Code
- **Project-specific templates**: Ready to customize for your technology stack

## Context Engineering Methodology

Context Engineering is a systematic approach to providing AI coding assistants with comprehensive project context. The templates include:

### Core Principles
- **Context is King**: Provide all necessary documentation and examples
- **Validation Loops**: Include executable tests and validation commands  
- **Information Dense**: Use patterns and keywords from your codebase
- **Progressive Success**: Start simple, validate, then enhance

### Document Structure
```
docs/context-engineering/
├── planning.md              # Project overview with technology stack
├── architecture.md          # System design and component relationships
├── coding-standards.md      # Language-specific conventions and patterns
├── testing-strategy.md      # Testing frameworks and approaches
├── deployment-process.md    # CI/CD and deployment procedures
└── domain-knowledge.md      # Business logic and domain concepts
```

## Customization Guide

### For Different Project Types

**Node.js/React Projects**:
- Update validation commands in CLAUDE.md to use npm/yarn
- Customize coding-standards.md for JavaScript/TypeScript
- Include package.json patterns and build tools

**Python Projects**:
- Update validation commands for pytest, ruff, mypy
- Customize coding-standards.md for Python conventions
- Include requirements.txt and pyproject.toml patterns

**Other Languages**:
- Adapt validation commands for your build tools
- Update coding standards for your language conventions
- Include language-specific configuration files

### Command Customization

Edit the commands in `.claude/commands/` to match your workflow:

1. **Update validation gates**: Change build/test commands for your stack
2. **Modify templates**: Adjust document templates for your project structure
3. **Add custom commands**: Create new commands for your specific workflows

## Usage Patterns

### Context Engineering Workflow

1. **Initialize**: Copy templates and customize for your project
2. **Plan**: Use `/generate-prp` to create comprehensive implementation plans
3. **Execute**: Use `/execute-prp` to implement with continuous validation
4. **Maintain**: Keep documentation updated as the project evolves

### Integration with Claude Code

The starter kit is designed to work seamlessly with Claude Code:

- **CLAUDE.md** provides essential project context
- **Slash commands** enable consistent workflows
- **Documentation templates** give Claude comprehensive understanding
- **Validation gates** ensure code quality throughout development

## Best Practices

### Documentation Maintenance
- Keep CLAUDE.md updated with project changes
- Update Context Engineering docs as architecture evolves
- Add new patterns to coding-standards.md as they emerge

### Command Usage
- Use `/generate-prp` for complex features requiring planning
- Use `/execute-prp` with validation gates for implementation
- Customize commands as your workflow evolves

### Template Evolution
- Start with provided templates and adapt to your needs
- Add project-specific patterns and conventions
- Share successful patterns back to the community

## No Installation Required

Agentic Base is not an npm package - it's simply a collection of templates and files to copy into your projects. This approach ensures:

- **Language Agnostic**: Works with any programming language or framework
- **No Dependencies**: No external dependencies to manage or maintain
- **Full Customization**: Complete freedom to adapt templates to your needs
- **Simple Distribution**: Easy to share and modify across teams

## Contributing

Found useful patterns or improvements? Consider contributing:

1. Test patterns with real projects
2. Document successful adaptations
3. Share templates for new project types
4. Improve documentation clarity

## License

MIT License - use freely in your projects.