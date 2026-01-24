# Style Audit Workflow for AI Agents

This document describes a step-by-step process to audit styles. It is written
to be reusable across repositories regardless of programming language or project
structure.

## Goals

- Identify unused style definitions and unused design tokens.
- Find repeated inline style objects that could be consolidated.
- Check for hardcoded colors or theme inconsistencies (e.g., light/dark mode).
- Detect potential style-prop mismatches (e.g., text-only styles on containers).
- Document findings in a project-appropriate analysis document.

## Scope

- Style sources: shared style modules, component-local style blocks, inline styles.
- Design tokens: colors, typography, spacing, elevations, and constants.
- UI code: screen and component implementations.

## Step 0: Preconditions

- Write your findings to this document: `docs/style-audit.md`
- Execute all steps in order, collecting notes as you go.
- After each step:
  - Update the analysis document with the current step’s findings.

## Step 1: Unused Style Definitions

1. Enumerate style definitions:

   - Shared/global style modules.
   - Per-component style objects.
   - Inline styles (where applicable).

2. Find usage:

   - Search for references to each style key.
   - Verify each local style key is used in the file.

3. Check for dynamic access:
   - Look for index-based access (e.g., `styles[key]`) to avoid false removals.

## Step 2: Inline Style Duplicates

Goal: find repeated inline style objects that could be consolidated.

Suggested options:

- Manual scan for repeated inline objects.
- AST scan to find identical object literals in style props.

If you use an AST scan, report:

- The repeated object literal.
- Representative file/line locations.
- Whether consolidation is worth it (some inline styles are intentional).

## Step 3: Hardcoded Colors & Theme Consistency

1. Search for hardcoded colors:
   - Hex (`#fff`, `#000`, etc.), `rgba(...)`, and literal `"white"`/`"black"`.
2. Validate theme usage:
   - Ensure theme-aware colors are used consistently where applicable.
   - Watch for fixed colors on text/background that could break dark mode.

Document any likely theme issues or intentional design choices.

## Step 4: Unused Design Tokens

Audit tokens in the project's token files (colors, typography, spacing, etc.).

Search patterns:

- `Tokens.<key>` / `Colors.<key>` / `Spacing.<key>`
- Theme variants (e.g., `light`, `dark`, `palette`)

Be careful with false positives if tokens are referenced outside source code
(e.g., JSON, configuration, docs).

## Step 5: Style-Prop Mismatches (Heuristic)

Scan for obvious mismatches:

- Text-only properties on containers/images (e.g., `fontSize` on `View`).
- Container-only properties on text elements (some layout props may be valid).

Treat this as a heuristic and call out false positives explicitly.

## Step 6: Document Results

Add a section per step to the project's analysis document, including:

- Date and scope.
- Findings.
- Suggestions (if any).

## Finalization

After completing all steps:

- Ensure the analysis document contains a section per step and any overall notes.
- Propose a commit message.
- Summarize what/why.
- Wait for user OK before committing (commit only at the end).
