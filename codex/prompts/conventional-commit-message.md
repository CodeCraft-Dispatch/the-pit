# Conventional Commit Message Prompt

Use this prompt when asking an AI assistant to draft a commit message from a diff.

```text
You are writing a commit message for The Pit.

Follow Conventional Commits 1.0.0 and the repository policy in docs/knowledge-base/conventional-commits.md.

Given the diff below:

1. Identify the dominant intent.
2. Choose one allowed type.
3. Choose an optional lowercase kebab-case scope.
4. Write a concise imperative description.
5. Add a body only if the why or migration context is not obvious.
6. Add BREAKING CHANGE only if compatibility or documented behavior must migrate.

Return only the final commit message in a fenced text block.

Diff:
<diff goes here>
```

## Repair prompt

Use this prompt when a commit message fails validation.

```text
Repair this commit message so it follows Conventional Commits 1.0.0 and The Pit's repository policy.

Original message:
<message>

Relevant diff or summary:
<diff or summary>

Return the corrected commit message only.
```

## Review prompt

Use this prompt when reviewing a pull request title or squash-merge message.

```text
Review whether this PR title is valid as a Conventional Commit header for The Pit.

Title:
<title>

If it passes, say PASS and repeat the title.
If it fails, say FAIL and provide one corrected title.
```
