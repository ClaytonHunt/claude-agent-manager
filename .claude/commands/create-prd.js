#!/usr/bin/env node

/**
 * Create Product Requirements Document (PRD) Command
 * 
 * Interactive command for creating comprehensive PRDs through:
 * 1. New Application: Full product discovery interview
 * 2. Existing Application: Codebase analysis + feature gaps
 * 3. Modify Existing PRD: Update and refine requirements
 * 
 * Part of the Agentic Development Methodology
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(message) {
  log(`\n🚀 ${message}`, colors.bright);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function warn(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Utility function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset} `, resolve);
  });
}

// Utility function to ask yes/no questions
async function askYesNo(question) {
  const answer = await askQuestion(`${question} (y/n): `);
  return answer.toLowerCase().startsWith('y');
}

// PRD Template Structure
const PRD_TEMPLATE = {
  title: '',
  overview: {
    vision: '',
    targetUsers: '',
    valueProposition: '',
    successMetrics: ''
  },
  problemStatement: {
    currentState: '',
    desiredState: ''
  },
  userPersonas: [],
  features: {
    mvp: [],
    phase2: [],
    future: []
  },
  technicalRequirements: {
    architecture: '',
    stack: '',
    integrations: '',
    performance: '',
    security: ''
  },
  userFlows: [],
  successCriteria: {
    launchCriteria: [],
    metrics: []
  },
  risks: [],
  timeline: '',
  appendices: {}
};

class PRDCreator {
  constructor() {
    this.prd = { ...PRD_TEMPLATE };
    this.scenario = null;
    this.existingPRD = null;
  }

  async start() {
    try {
      header('Product Requirements Document (PRD) Creator');
      log('🎯 Create comprehensive PRDs using the Agentic Development Methodology', colors.blue);
      
      // Determine scenario
      await this.determineScenario();
      
      // Execute scenario-specific flow
      switch (this.scenario) {
        case 'new':
          await this.newApplicationFlow();
          break;
        case 'existing':
          await this.existingApplicationFlow();
          break;
        case 'modify':
          await this.modifyPRDFlow();
          break;
      }
      
      // Generate PRD
      await this.generatePRD();
      
      // Review and finalize
      await this.reviewAndFinalize();
      
    } catch (error) {
      log(`❌ Error: ${error.message}`, colors.red);
    } finally {
      rl.close();
    }
  }

  async determineScenario() {
    header('Scenario Selection');
    
    log('What would you like to do?');
    log('1) Create PRD for new application');
    log('2) Create PRD for existing application');
    log('3) Modify existing PRD');
    
    const choice = await askQuestion('Select option (1-3): ');
    
    switch (choice) {
      case '1':
        this.scenario = 'new';
        info('Selected: New Application PRD Creation');
        break;
      case '2':
        this.scenario = 'existing';
        info('Selected: Existing Application Analysis');
        break;
      case '3':
        this.scenario = 'modify';
        info('Selected: Modify Existing PRD');
        break;
      default:
        throw new Error('Invalid option selected');
    }
  }

  async newApplicationFlow() {
    header('New Application Product Discovery Interview');
    
    // Phase 1: Vision & Context
    await this.conductVisionInterview();
    
    // Phase 2: Core Functionality  
    await this.conductFunctionalityInterview();
    
    // Phase 3: Technical & Constraints
    await this.conductTechnicalInterview();
    
    // Phase 4: Success & Risks
    await this.conductSuccessRisksInterview();
  }

  async conductVisionInterview() {
    log('\n📋 Phase 1: Vision & Context (5-10 minutes)', colors.blue);
    
    this.prd.title = await askQuestion('What is the name of your application? ');
    
    this.prd.overview.vision = await askQuestion('What problem are you trying to solve with this application? ');
    
    this.prd.overview.targetUsers = await askQuestion('Who are your target users and what are their pain points? ');
    
    this.prd.overview.valueProposition = await askQuestion('What\'s your vision for success? How will you measure it? ');
    
    this.prd.overview.successMetrics = await askQuestion('What\'s the business value or impact you\'re expecting? ');
    
    const hasCompetitors = await askYesNo('Are there any existing solutions you\'re inspired by or competing against?');
    if (hasCompetitors) {
      this.prd.appendices.competitiveAnalysis = await askQuestion('Please describe the competitive landscape: ');
    }
  }

  async conductFunctionalityInterview() {
    log('\n⚙️ Phase 2: Core Functionality (10-15 minutes)', colors.blue);
    
    const coreFeatures = await askQuestion('What are the 3-5 core features that must exist for MVP? ');
    this.prd.features.mvp = coreFeatures.split(',').map(f => f.trim());
    
    const userJourney = await askQuestion('Can you walk me through the primary user journey? ');
    this.prd.userFlows.push({
      name: 'Primary User Journey',
      description: userJourney
    });
    
    const dataManagement = await askQuestion('What data will the application need to manage? ');
    this.prd.technicalRequirements.dataModel = dataManagement;
    
    const integrations = await askQuestion('Are there any external systems or APIs to integrate with? ');
    this.prd.technicalRequirements.integrations = integrations;
    
    const prioritization = await askQuestion('What are the non-negotiable requirements vs nice-to-haves? ');
    this.prd.appendices.prioritization = prioritization;
  }

  async conductTechnicalInterview() {
    log('\n🔧 Phase 3: Technical & Constraints (5-10 minutes)', colors.blue);
    
    const techPreferences = await askQuestion('Any specific technology preferences or constraints? ');
    this.prd.technicalRequirements.stack = techPreferences;
    
    const timeline = await askQuestion('What\'s your timeline and budget considerations? ');
    this.prd.timeline = timeline;
    
    const securityRequirements = await askQuestion('Any security, compliance, or performance requirements? ');
    this.prd.technicalRequirements.security = securityRequirements;
    
    const platforms = await askQuestion('What platforms/devices need to be supported? ');
    this.prd.technicalRequirements.platforms = platforms;
    
    const infrastructure = await askQuestion('Any existing infrastructure or systems to work with? ');
    this.prd.technicalRequirements.infrastructure = infrastructure;
  }

  async conductSuccessRisksInterview() {
    log('\n🎯 Phase 4: Success & Risks (5 minutes)', colors.blue);
    
    const successDefinition = await askQuestion('How will you know if this application is successful? ');
    this.prd.successCriteria.metrics = successDefinition.split(',').map(m => m.trim());
    
    const risks = await askQuestion('What are the biggest risks or unknowns? ');
    this.prd.risks = risks.split(',').map(r => ({
      risk: r.trim(),
      impact: 'TBD',
      mitigation: 'TBD'
    }));
    
    const failureScenarios = await askQuestion('What would cause this project to fail? ');
    this.prd.appendices.failureScenarios = failureScenarios;
    
    const compliance = await askQuestion('Any regulatory or legal considerations? ');
    if (compliance.toLowerCase() !== 'none' && compliance.trim() !== '') {
      this.prd.technicalRequirements.compliance = compliance;
    }
  }

  async existingApplicationFlow() {
    header('Existing Application Analysis');
    
    // Get project path
    const projectPath = await askQuestion('What is the path to your existing application? (current directory): ') || process.cwd();
    
    info('🔍 Analyzing existing application...');
    
    // Launch async specialist subagents for analysis
    log('\n🤖 Launching Specialist Subagents for Analysis...', colors.yellow);
    log('   🏗️  Architecture Specialist: Analyzing system structure');
    log('   🎨 Frontend Specialist: Reviewing UI/UX patterns');
    log('   🗄️  Backend Specialist: Examining APIs and data flow');
    log('   🧪 Quality Specialist: Assessing test coverage');
    
    // Simulate analysis (in real implementation, would launch actual Task agents)
    await this.analyzeExistingCodebase(projectPath);
    
    // Gap analysis interview
    await this.conductGapAnalysis();
  }

  async analyzeExistingCodebase(projectPath) {
    // In real implementation, this would launch Task agents
    log('\n📊 Codebase Analysis Results:', colors.green);
    
    // Check for common files and patterns
    const packageJsonPath = path.join(projectPath, 'package.json');
    const readmePath = path.join(projectPath, 'README.md');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      this.prd.technicalRequirements.stack = `Node.js project with dependencies: ${Object.keys(packageJson.dependencies || {}).slice(0, 5).join(', ')}`;
      this.prd.title = packageJson.name || 'Existing Application';
    }
    
    if (fs.existsSync(readmePath)) {
      const readme = fs.readFileSync(readmePath, 'utf8');
      const description = readme.split('\n').find(line => line.trim() && !line.startsWith('#'));
      if (description) {
        this.prd.overview.vision = description.trim();
      }
    }
    
    // Identify common patterns
    const srcExists = fs.existsSync(path.join(projectPath, 'src'));
    const testsExist = fs.existsSync(path.join(projectPath, 'test')) || fs.existsSync(path.join(projectPath, 'tests'));
    
    this.prd.technicalRequirements.architecture = `${srcExists ? 'Source code organized in src/ directory. ' : ''}${testsExist ? 'Test suite present.' : 'No test directory found.'}`;
    
    success('Codebase analysis complete');
  }

  async conductGapAnalysis() {
    log('\n📋 Gap Analysis Interview', colors.blue);
    
    const newFeatures = await askQuestion('What new functionality needs to be added? ');
    this.prd.features.mvp = newFeatures.split(',').map(f => f.trim());
    
    const modifications = await askQuestion('What existing features need modification? ');
    this.prd.features.phase2 = modifications.split(',').map(f => f.trim());
    
    const removals = await askYesNo('Are there any features that should be removed?');
    if (removals) {
      const toRemove = await askQuestion('What features should be removed? ');
      this.prd.appendices.featureRemovals = toRemove;
    }
    
    const technicalDebt = await askQuestion('What technical debt needs addressing? ');
    this.prd.technicalRequirements.technicalDebt = technicalDebt;
    
    const performanceIssues = await askQuestion('Any performance or scalability issues to fix? ');
    this.prd.technicalRequirements.performance = performanceIssues;
  }

  async modifyPRDFlow() {
    header('Modify Existing PRD');
    
    // Find existing PRD
    const prdPath = path.join(process.cwd(), '.claude', 'prd.md');
    
    if (!fs.existsSync(prdPath)) {
      const customPath = await askQuestion('PRD not found in .claude/prd.md. Enter path to existing PRD: ');
      if (!fs.existsSync(customPath)) {
        throw new Error('PRD file not found');
      }
      this.existingPRD = fs.readFileSync(customPath, 'utf8');
    } else {
      this.existingPRD = fs.readFileSync(prdPath, 'utf8');
      success('Found existing PRD at .claude/prd.md');
    }
    
    // Parse existing PRD (simplified)
    this.prd.title = this.existingPRD.match(/# (.+)/)?.[1] || 'Existing PRD';
    
    // Modification interview
    await this.conductModificationInterview();
  }

  async conductModificationInterview() {
    log('\n✏️  PRD Modification Interview', colors.blue);
    
    log('Current PRD Summary:');
    log(`Title: ${this.prd.title}`);
    
    const aspectsToUpdate = await askQuestion('What aspects of the PRD need updating? (features, timeline, technical, success criteria): ');
    
    const trigger = await askQuestion('What triggered this update? (user feedback, market changes, technical constraints, business pivot): ');
    this.prd.appendices.updateTrigger = trigger;
    
    if (aspectsToUpdate.includes('features')) {
      const featureChanges = await askQuestion('Describe the feature changes needed: ');
      this.prd.features.updates = featureChanges;
    }
    
    if (aspectsToUpdate.includes('timeline')) {
      const timelineChanges = await askQuestion('What timeline adjustments are needed? ');
      this.prd.timeline = timelineChanges;
    }
    
    if (aspectsToUpdate.includes('technical')) {
      const technicalChanges = await askQuestion('What technical changes are required? ');
      this.prd.technicalRequirements.updates = technicalChanges;
    }
    
    const newInsights = await askQuestion('Any new insights since the original PRD? (usage data, customer feedback, technical learnings): ');
    if (newInsights.trim()) {
      this.prd.appendices.newInsights = newInsights;
    }
  }

  async generatePRD() {
    header('Generating Product Requirements Document');
    
    const prdContent = this.buildPRDContent();
    
    // Ensure .claude directory exists
    const claudeDir = path.join(process.cwd(), '.claude');
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }
    
    // Write PRD file
    const prdPath = path.join(claudeDir, 'prd.md');
    fs.writeFileSync(prdPath, prdContent);
    
    success(`PRD generated: ${prdPath}`);
  }

  buildPRDContent() {
    const timestamp = new Date().toISOString().split('T')[0];
    
    return `# Product Requirements Document: ${this.prd.title}

## Executive Summary
- **Product Vision**: ${this.prd.overview.vision}
- **Target Users**: ${this.prd.overview.targetUsers}
- **Key Value Proposition**: ${this.prd.overview.valueProposition}
- **Success Metrics**: ${this.prd.overview.successMetrics}

## Problem Statement
### Current State
${this.prd.problemStatement.currentState || 'TBD - To be defined during implementation planning'}

### Desired State
${this.prd.problemStatement.desiredState || this.prd.overview.vision}

## Feature Requirements
### MVP Features (Must Have)
${this.prd.features.mvp.map(f => `- ${f}`).join('\n') || '- TBD - To be defined during specialist analysis'}

### Phase 2 Features (Should Have)
${this.prd.features.phase2.map(f => `- ${f}`).join('\n') || '- TBD - To be defined based on MVP feedback'}

### Future Features (Nice to Have)
${this.prd.features.future.map(f => `- ${f}`).join('\n') || '- TBD - To be prioritized based on user adoption'}

## Technical Requirements
### Architecture
- **Type**: ${this.prd.technicalRequirements.architecture || 'TBD - To be determined by Architecture Specialist'}
- **Stack**: ${this.prd.technicalRequirements.stack || 'TBD - To be determined based on team expertise'}
- **Integrations**: ${this.prd.technicalRequirements.integrations || 'None specified'}
- **Performance**: ${this.prd.technicalRequirements.performance || 'Standard web application performance expectations'}

### Security & Compliance
- ${this.prd.technicalRequirements.security || 'Standard security best practices'}
- ${this.prd.technicalRequirements.compliance || 'No specific compliance requirements identified'}

## User Flows
### Primary Flow
${this.prd.userFlows.map(flow => `**${flow.name}**: ${flow.description}`).join('\n') || 'TBD - To be designed by Frontend Specialist'}

## Success Criteria
### Launch Criteria
- [ ] All MVP features implemented and tested
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] User acceptance testing completed

### Success Metrics
${this.prd.successCriteria.metrics.map(m => `- ${m}`).join('\n') || '- User adoption rate\n- Feature utilization\n- User satisfaction scores'}

## Risks & Mitigations
${this.prd.risks.map(r => `| ${r.risk} | ${r.impact} | ${r.mitigation} |`).join('\n') || '| Risk | Impact | Mitigation |\n|------|---------|------------|\n| TBD | TBD | TBD |'}

## Timeline & Milestones
${this.prd.timeline || 'TBD - To be determined during implementation planning with DevOps Specialist'}

## Appendices
${Object.entries(this.prd.appendices).map(([key, value]) => `### ${key.charAt(0).toUpperCase() + key.slice(1)}\n${value}`).join('\n\n')}

---

**Generated**: ${timestamp}  
**Method**: Agentic Development Methodology  
**Next Steps**: Launch async specialist subagents for implementation planning`;
  }

  async reviewAndFinalize() {
    header('PRD Review & Next Steps');
    
    const satisfied = await askYesNo('Are you satisfied with the generated PRD?');
    
    if (!satisfied) {
      const changes = await askQuestion('What changes would you like to make? ');
      warn('PRD saved. You can manually edit .claude/prd.md or run this command again.');
      this.prd.appendices.requestedChanges = changes;
    } else {
      success('PRD finalized successfully!');
    }
    
    log('\n🎯 Recommended Next Steps:', colors.blue);
    log('1. Review and refine the PRD manually if needed');
    log('2. Launch async specialist subagents for implementation planning:');
    log('   • Task: Architecture specialist - analyze technical requirements');
    log('   • Task: Frontend specialist - design user flows and interfaces');
    log('   • Task: Backend specialist - plan APIs and data architecture');
    log('   • Task: Quality specialist - define testing strategy');
    log('3. Create work-analysis.md from PRD findings');
    log('4. Begin implementation with TDD workflows');
    
    log('\n📋 PRD Location: .claude/prd.md', colors.green);
    log('🤖 Ready for agentic development workflow!', colors.green);
  }
}

// Main execution
if (require.main === module) {
  const creator = new PRDCreator();
  creator.start().catch(console.error);
}

module.exports = PRDCreator;