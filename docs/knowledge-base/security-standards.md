# Security Standards

## Security stance

The Pit should adopt security as a built-in engineering discipline, not a late hardening phase.

Use OWASP guidance as a standing baseline and express security controls as tests, mutation-backed assertions, and build gates wherever practical.

## Baseline

- Treat ASVS Level 1 as the minimum global application baseline.
- Escalate toward ASVS Level 2 for any auth, persistence, file handling, API, session, token, or externally facing runtime surface.
- Keep security decisions documented alongside architecture and workflow decisions.

## Practical control families

### Input, encoding, and sanitization

- validate all external inputs explicitly
- encode output by context
- sanitize only where validation cannot fully constrain content
- define dangerous parser behavior out of existence where possible

### Business logic and anti-automation

- document domain invariants
- test abuse cases and invalid state transitions
- guard high-cost or repeated actions against automation misuse

### Frontend and browser security

- set secure headers by default
- use strict content boundaries
- keep origin and resource policies intentional
- review any script, storage, or iframe expansion carefully

### API and service security

- validate message shape and method semantics
- keep contracts explicit
- reject malformed or ambiguous requests early
- constrain integration boundaries and remote trust assumptions

### File and content handling

- treat file and content ingestion as hostile until proven otherwise
- separate storage concerns from presentation concerns
- validate type, size, and processing path

### Authentication, session, and authorization

- make access rules explicit and testable
- keep least-privilege boundaries visible in code and docs
- test both success paths and forbidden paths
- treat recovery and session lifecycle as first-class behavior

### Tokens, secrets, and cryptography

- minimize token scope and lifetime
- never bake secrets into content or client code
- prefer modern platform cryptography and documented key handling
- maintain a cryptographic inventory when those surfaces appear

### Logging, monitoring, and failure handling

- log enough to diagnose security-relevant events
- avoid logging secrets or unsafe personal data
- make build and pipeline failures visible immediately
- preserve lawful degraded states rather than undefined behavior

### Dependencies, supply chain, and configuration

- prefer zero-cost, open-source tooling
- keep dependencies intentional and minimal
- review CI, deployment, and hosting configuration as part of security posture
- reject insecure defaults instead of planning to fix them later

## Testing rule

Security controls should be represented in automation through a mix of:

- executable examples
- unit and integration tests
- mutation-backed assertions at the nearest executable domain layer
- delivery-pipeline gates for critical regressions

## Working principle

Security in this project is not only about exploits.

It is also about preserving predictable, lawful behavior under hostile, malformed, or high-stress conditions.
