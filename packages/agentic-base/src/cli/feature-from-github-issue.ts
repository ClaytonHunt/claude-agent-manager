#!/usr/bin/env node

import { Command } from 'commander';
import { Octokit } from '@octokit/rest';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { config } from 'dotenv';

// Load environment variables
config();

interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  labels: Array<string | { name?: string; color?: string }>;
  assignees: Array<{ login: string }>;
  milestone: { title: string } | null;
  created_at: string;
  updated_at: string;
  user: { login: string };
}

interface TriageResult {
  businessValue: number; // 1-10 scale
  difficulty: number; // 1-10 scale
  priority: number; // calculated from business value / difficulty
  reasoning: string;
  tags: string[];
}

const program = new Command();

program
  .name('feature-from-github-issue')
  .description('Create feature specification from GitHub issue with automated triage')
  .option('-i, --issue <number>', 'GitHub issue number')
  .option('-r, --repo <repo>', 'GitHub repository (owner/repo)')
  .option('--auto', 'Automatically select highest priority untriaged issue')
  .option('--triage-only', 'Only run triage on existing issues')
  .parse();

const options = program.opts();

async function main() {
  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    if (!process.env.GITHUB_TOKEN) {
      console.error(chalk.red('Error: GITHUB_TOKEN environment variable is required'));
      process.exit(1);
    }

    const repo = options.repo || await getCurrentRepo();
    const [owner, repoName] = repo.split('/');

    if (options.triageOnly) {
      await triageAllIssues(octokit, owner, repoName);
      return;
    }

    let issueNumber = options.issue;

    if (options.auto) {
      issueNumber = await selectHighestPriorityIssue(octokit, owner, repoName);
    }

    if (!issueNumber) {
      console.error(chalk.red('Error: Issue number is required. Use -i <number> or --auto'));
      process.exit(1);
    }

    const issue = await fetchIssue(octokit, owner, repoName, parseInt(issueNumber));
    const triage = await triageIssue(issue);
    
    await updateIssueWithTriage(octokit, owner, repoName, issue.number, triage);
    await createFeatureDocument(issue, triage, repo);

    console.log(chalk.green(`✓ Feature document created from issue #${issue.number}`));
    console.log(chalk.blue(`  Priority Score: ${triage.priority.toFixed(2)}`));
    console.log(chalk.blue(`  Business Value: ${triage.businessValue}/10`));
    console.log(chalk.blue(`  Difficulty: ${triage.difficulty}/10`));

  } catch (error) {
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

async function getCurrentRepo(): Promise<string> {
  // Try to get repo from git remote
  try {
    const { execSync } = require('child_process');
    const remote = execSync('git remote get-url origin', { encoding: 'utf-8' });
    const match = remote.match(/github\.com[:/]([^/]+\/[^/]+)\.git/);
    if (match) {
      return match[1];
    }
  } catch (error) {
    // Ignore error
  }

  throw new Error('Could not determine repository. Please use --repo option');
}

async function fetchIssue(octokit: Octokit, owner: string, repo: string, issueNumber: number): Promise<GitHubIssue> {
  const { data } = await octokit.issues.get({
    owner,
    repo,
    issue_number: issueNumber
  });

  return data as GitHubIssue;
}

async function triageIssue(issue: GitHubIssue): Promise<TriageResult> {
  // Business value assessment
  let businessValue = 5; // Default medium value
  
  // Analyze labels for business value indicators
  const labels = issue.labels.map(l => typeof l === 'string' ? l.toLowerCase() : l.name?.toLowerCase() || '').filter(Boolean);
  if (labels.includes('critical') || labels.includes('blocker')) businessValue += 3;
  if (labels.includes('high-priority') || labels.includes('urgent')) businessValue += 2;
  if (labels.includes('enhancement') || labels.includes('feature')) businessValue += 1;
  if (labels.includes('bug') || labels.includes('security')) businessValue += 2;
  if (labels.includes('documentation') || labels.includes('refactor')) businessValue -= 1;
  if (labels.includes('nice-to-have') || labels.includes('low-priority')) businessValue -= 2;

  // Analyze title and body for complexity indicators
  let difficulty = 5; // Default medium difficulty
  
  const text = `${issue.title} ${issue.body || ''}`.toLowerCase();
  
  // Complexity indicators
  if (text.includes('architecture') || text.includes('refactor') || text.includes('migration')) difficulty += 2;
  if (text.includes('database') || text.includes('schema') || text.includes('backend')) difficulty += 1;
  if (text.includes('frontend') || text.includes('ui') || text.includes('component')) difficulty += 1;
  if (text.includes('test') || text.includes('fix') || text.includes('typo')) difficulty -= 1;
  if (text.includes('documentation') || text.includes('readme')) difficulty -= 2;
  if (text.includes('breaking change') || text.includes('major change')) difficulty += 3;

  // Word count as complexity indicator
  const wordCount = (issue.body || '').split(/\s+/).length;
  if (wordCount > 500) difficulty += 1;
  if (wordCount > 1000) difficulty += 1;

  // Clamp values
  businessValue = Math.max(1, Math.min(10, businessValue));
  difficulty = Math.max(1, Math.min(10, difficulty));

  const priority = businessValue / difficulty;

  // Generate tags
  const tags = ['triage-complete'];
  if (priority > 1.5) tags.push('high-priority');
  else if (priority < 0.8) tags.push('low-priority');
  else tags.push('medium-priority');

  if (businessValue >= 8) tags.push('high-value');
  if (difficulty >= 8) tags.push('complex');
  if (difficulty <= 3) tags.push('easy');

  const reasoning = `
Business Value (${businessValue}/10):
- Base score: 5
- Label indicators: ${labels.filter(l => ['critical', 'blocker', 'high-priority', 'urgent', 'enhancement', 'feature', 'bug', 'security'].includes(l)).join(', ') || 'none'}
- Content analysis: ${businessValue > 5 ? 'increased' : businessValue < 5 ? 'decreased' : 'neutral'}

Difficulty (${difficulty}/10):
- Base score: 5
- Complexity indicators: ${text.includes('architecture') || text.includes('refactor') ? 'high complexity' : text.includes('test') || text.includes('fix') ? 'low complexity' : 'standard'}
- Content length: ${wordCount} words

Priority Score: ${priority.toFixed(2)} (Business Value / Difficulty)
  `.trim();

  return {
    businessValue,
    difficulty,
    priority,
    reasoning,
    tags
  };
}

async function triageAllIssues(octokit: Octokit, owner: string, repo: string): Promise<void> {
  console.log(chalk.blue('Triaging all open issues...'));

  const { data: issues } = await octokit.issues.listForRepo({
    owner,
    repo,
    state: 'open',
    per_page: 100
  });

  let triaged = 0;
  let skipped = 0;

  for (const issue of issues) {
    const hasTriageLabel = issue.labels.some(label => {
      const labelName = typeof label === 'string' ? label : label.name || '';
      return labelName.includes('triage-complete') || labelName.includes('priority');
    });

    if (hasTriageLabel) {
      skipped++;
      continue;
    }

    const triage = await triageIssue(issue as GitHubIssue);
    await updateIssueWithTriage(octokit, owner, repo, issue.number, triage);
    triaged++;

    console.log(chalk.green(`✓ Triaged #${issue.number}: ${issue.title} (Priority: ${triage.priority.toFixed(2)})`));
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(chalk.blue(`\nTriage complete: ${triaged} issues triaged, ${skipped} already triaged`));
}

async function selectHighestPriorityIssue(octokit: Octokit, owner: string, repo: string): Promise<number> {
  const { data: issues } = await octokit.issues.listForRepo({
    owner,
    repo,
    state: 'open',
    labels: 'triage-complete,high-priority',
    sort: 'created',
    direction: 'desc',
    per_page: 10
  });

  if (issues.length === 0) {
    throw new Error('No high-priority triaged issues found. Run --triage-only first');
  }

  console.log(chalk.blue(`Selected highest priority issue: #${issues[0].number}`));
  return issues[0].number;
}

async function updateIssueWithTriage(
  octokit: Octokit, 
  owner: string, 
  repo: string, 
  issueNumber: number, 
  triage: TriageResult
): Promise<void> {
  // Add labels
  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: issueNumber,
    labels: triage.tags
  });

  // Add comment with triage results
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: `## 🤖 Automated Triage Results

**Priority Score:** ${triage.priority.toFixed(2)}
**Business Value:** ${triage.businessValue}/10
**Difficulty:** ${triage.difficulty}/10

**Reasoning:**
${triage.reasoning}

**Tags:** ${triage.tags.join(', ')}

---
*Generated by Claude Agent Manager*`
  });
}

async function createFeatureDocument(issue: GitHubIssue, triage: TriageResult, repo: string): Promise<void> {
  // Ensure .claude directory exists
  if (!existsSync('.claude')) {
    mkdirSync('.claude', { recursive: true });
  }

  const featureContent = `# Feature: ${issue.title}

## FEATURE:
${issue.body || 'No description provided'}

## BUSINESS VALUE:
Priority Score: ${triage.priority.toFixed(2)}/10
${triage.reasoning.split('Business Value')[1]?.split('Difficulty')[0]?.trim() || 'See triage analysis'}

## USER STORY:
*To be refined based on issue requirements*

## REQUIREMENTS:
*Extract from issue description and comments*

## ACCEPTANCE CRITERIA:
*Define based on issue requirements*

## TECHNICAL CONSIDERATIONS:
Difficulty Rating: ${triage.difficulty}/10
${triage.reasoning.split('Difficulty')[1]?.split('Priority Score')[0]?.trim() || 'See triage analysis'}

## EXAMPLES:
*Reference existing code patterns or similar features*

## DOCUMENTATION:
*Links to relevant documentation or external resources*

## OTHER CONSIDERATIONS:
*Edge cases, performance requirements, security considerations*

## TRACEABILITY:
- **Source**: GitHub Issue #${issue.number}
- **Repository**: ${repo}
- **Created**: ${new Date().toISOString()}
- **Triage Tags**: ${triage.tags.join(', ')}
- **Original Author**: ${issue.user.login}
- **Issue URL**: https://github.com/${repo}/issues/${issue.number}
`;

  writeFileSync('.claude/feature.md', featureContent);
}

if (require.main === module) {
  main();
}