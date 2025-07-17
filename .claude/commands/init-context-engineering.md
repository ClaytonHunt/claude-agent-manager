# Initialize Context Engineering

## Project Context Engineering Setup

Initialize Context Engineering structure in the current project. Detect project type and create customized templates and documentation structure.

## Setup Process

1. **Detect Project Type**
   - Launch async specialist subagents for parallel project analysis
   - Architecture specialist: Analyze project structure and technology stack
   - DevOps specialist: Identify build tools and CI/CD patterns
   - Quality specialist: Detect testing frameworks and coverage tools
   - Consolidate findings to determine optimal Context Engineering setup

2. **Detect Documentation Location**
   - Check for existing documentation folders:
     - `docs/`, `documentation/`, `doc/`
     - `README.md`, `CONTRIBUTING.md`
     - Project-specific documentation patterns
   - If found, create Context Engineering subfolder
   - If not found, create standard `docs/` structure

3. **Create Project Structure**
   - Set up `.claude/` directory if needed
   - Create documentation structure in detected location
   - Set up Context Engineering workflow files

## Directory Structure Creation

### Always Create in .claude/
```
.claude/
├── feature.md               # Feature specification template
├── work-analysis.md         # PRP template
├── task.md                  # Current task template
└── context-links.md         # Dynamic context links
```

### Documentation Structure (in detected location)
```
docs/context-engineering/    # or docs/ if no existing structure
├── planning.md              # Main project overview
├── architecture.md          # System architecture
├── coding-standards.md      # Language-specific conventions
├── testing-strategy.md      # Testing approaches
├── deployment-process.md    # CI/CD and deployment
└── domain-knowledge.md      # Business logic and domain
```

## Project Type Detection & Customization

### Node.js/React Projects
**Detect**: `package.json`, `node_modules/`, `.tsx?` files
**Validation Gates**:
```bash
npm run lint && npm run type-check
npm run test
npm run build
```

### Python Projects
**Detect**: `requirements.txt`, `pyproject.toml`, `setup.py`, `.py` files
**Validation Gates**:
```bash
ruff check --fix && mypy .
pytest tests/ -v
python -m build
```

### .NET Projects
**Detect**: `*.csproj`, `*.sln`, `Program.cs`
**Validation Gates**:
```bash
dotnet build && dotnet test
dotnet format --verify-no-changes
```

### Rust Projects
**Detect**: `Cargo.toml`, `src/main.rs`
**Validation Gates**:
```bash
cargo clippy -- -D warnings
cargo test
cargo build --release
```

### Java Projects
**Detect**: `pom.xml`, `build.gradle`, `*.java`
**Validation Gates**:
```bash
mvn clean compile
mvn test
mvn package
```

## Template Customization

### Language-Specific Templates
Create templates adapted to detected project:

#### Coding Standards Template
```markdown
# Coding Standards

## [Detected Language] Standards
[Language-specific conventions]

## Project Conventions
[Project-specific patterns detected]

## Linting & Formatting
[Detected tools: ESLint, Prettier, Ruff, etc.]

## Testing Patterns
[Detected testing frameworks and patterns]
```

#### Testing Strategy Template
```markdown
# Testing Strategy

## Framework: [Detected - Jest, Pytest, NUnit, etc.]

## Test Structure
[Project-specific test organization]

## Coverage Requirements
[Based on existing coverage configuration]

## E2E Testing
[If Playwright, Cypress, etc. detected]
```

## Initialization Steps

1. **Create Base Structure**
   - Set up `.claude/` directory with templates
   - Create documentation structure in detected location
   - Copy base templates with project customizations

2. **Generate Planning Document**
   - Create initial `planning.md` with detected project information
   - Include technology stack and build tools
   - Add links to other Context Engineering documents

3. **Configure Validation Gates**
   - Set up project-specific validation commands
   - Include in generate-prp and execute-prp templates
   - Test validation gates to ensure they work

4. **Create Context Links**
   - Generate `context-links.md` with dynamic links
   - Include paths to key project files
   - Add links to documentation and examples

## Success Criteria

- [ ] Project type correctly detected
- [ ] Documentation structure created in appropriate location
- [ ] Context Engineering templates customized for project
- [ ] Validation gates configured and tested
- [ ] Planning document initialized with project information
- [ ] Ready for Context Engineering workflow usage

## Output Messages

Display setup summary:
```
Context Engineering initialized for [Project Type]
✓ Documentation structure: [Location]
✓ Validation gates: [Commands]
✓ Templates customized for: [Stack]
✓ Ready for workflow: /feature-from-ado → /generate-prp → /execute-prp
```

## Error Handling

- If unable to detect project type, use generic templates
- If documentation location unclear, default to `docs/`
- If validation commands fail, provide manual setup instructions
- Provide clear error messages and recovery suggestions