# Conventional Commits

The Pit uses Conventional Commits 1.0.0 for every commit message, every squash-merge PR title, and every AI-generated change summary that may become a commit message.

The upstream specification is the source of truth: <https://www.conventionalcommits.org/en/v1.0.0/>.

## Required shape

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

The header is mandatory. The body and footer are optional. When they exist, separate them from the header with one blank line.

## Allowed types

Use the smallest type that accurately describes the change.

| Type       | Use when                                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `feat`     | The commit adds a user-visible, author-visible, runtime-visible, or capability-visible feature.                      |
| `fix`      | The commit corrects broken behavior.                                                                                 |
| `docs`     | The commit changes documentation, canon, prompts, instructions, agents, or skills without changing runtime behavior. |
| `test`     | The commit adds or changes tests, executable examples, fixtures, specifications, or mutation-test support.           |
| `refactor` | The commit restructures code without changing behavior or fixing a bug.                                              |
| `perf`     | The commit improves performance without changing intended behavior.                                                  |
| `build`    | The commit changes package dependencies, build scripts, generated build surfaces, or local developer tooling.        |
| `ci`       | The commit changes GitHub Actions, deployment automation, or pipeline behavior.                                      |
| `style`    | The commit changes formatting only.                                                                                  |
| `chore`    | The commit performs repository maintenance that does not fit the other types.                                        |
| `revert`   | The commit reverts a previous commit.                                                                                |

## Recommended scopes

Scopes are optional, but use them whenever they make history easier to scan. Scopes must be lowercase kebab-case.

Common scopes:

- `canon`
- `content`
- `delivery`
- `docs`
- `engine`
- `kernel`
- `flags`
- `security`
- `persistence`
- `replay`
- `ui`
- `workflow`
- `agent`
- `skill`
- `commit`

Prefer a domain scope over a file-name scope. For example, use `feat(kernel)` rather than `feat(wasm-kernel-md)`.

## Description rules

The description must be short, imperative, and lower-case after the type prefix unless a proper noun is required.

Good:

```text
feat(kernel): add boot-time capability snapshot
fix(content): prevent oracle debt from bypassing commitment cost
docs(canon): clarify unfinished engine cost model
ci(commit): validate pull request title
```

Bad:

```text
update files
fixed bug
WIP
changes
docs: Documentation updates.
```

## Breaking changes

Use either `!` in the header or a `BREAKING CHANGE:` footer.

```text
feat(content)!: rename closure state identifiers

BREAKING CHANGE: content packs must migrate `closed` to `settled`.
```

A breaking change may use any type, but it must be explicit. Do not hide breaking behavior in the body prose.

## Body guidance

Use the body when the header alone cannot explain the decision.

A useful body answers:

- why this change exists
- what tradeoff was accepted
- which canon, engineering, or delivery rule it preserves
- how the change should be reviewed

Do not use the body as a substitute for documentation that belongs in `docs/knowledge-base/`.

## Footer guidance

Use footers for machine-readable metadata such as issue links, review notes, and breaking changes.

```text
Refs: #42
Reviewed-by: name
BREAKING CHANGE: replay snapshots must include capability provenance.
```

## Commit construction workflow

1. Identify the single intent of the change.
2. Choose the type by asking what changed for the next reader of history.
3. Choose a scope only when it reduces ambiguity.
4. Write the description as an imperative action.
5. Add a body only when context is needed.
6. Add footers for issues, reviewers, or breaking changes.
7. Validate before committing.

## Line length rules

The header is limited to 100 characters (`header-max-length`).

Body and footer lines have **no enforced maximum length** (`body-max-line-length` and `footer-max-line-length` are disabled). This is intentional: machine-generated footers such as `Agent-Logs-Url:`, `Co-authored-by:`, `Refs:`, and URLs routinely exceed 100 characters. Wrapping them would corrupt their semantic value.

Keep body prose lines under 100 characters as a human-readability convention even though the linter does not enforce it.

## Local validation

Install the local Git hook:

```bash
npm install
npm run hooks:install
```

Validate the current commit message file:

```bash
npm run lint:commit-msg -- --edit .git/COMMIT_EDITMSG
```

Validate a commit range:

```bash
COMMITLINT_FROM=origin/main COMMITLINT_TO=HEAD npm run lint:commits
```

## AI agent requirements

AI agents must produce Conventional Commits by default and must not propose vague commit messages. Before creating a commit, an agent should explain the chosen type and scope when the choice is not obvious.

If a change includes multiple unrelated intents, split the work or select the dominant intent only when the repository owner has explicitly requested a single squashed commit.

## Squash merge rule

When squash merging, the PR title becomes the final commit header. Therefore PR titles must also be valid Conventional Commit headers.

Good PR titles:

```text
docs(commit): add conventional commits policy
ci(commit): enforce conventional commit messages
feat(kernel): add deterministic module manifest loading
```

Bad PR titles:

```text
Add stuff
Conventional commits
WIP: cleanup
```
