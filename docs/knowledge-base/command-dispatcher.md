# Command Dispatcher

The command dispatcher is the modular owner of command normalization, queue
ordering, capability gating, and handler routing inside the deterministic kernel.
It exists so the tick loop can own time and event sequencing without also owning
the details of how every command family is routed.

## Runtime placement

- `runtime/kernel/command-dispatcher.mjs` is the executable reference model for
  command envelope normalization, queue ordering, ready-command release,
  capability-gated dispatch, and handler routing.
- `runtime/kernel/command-dispatcher.d.ts` fixes the TypeScript-facing host and
  future Wasm replacement shape.
- `runtime/kernel/wasm/command-dispatcher-core.mjs` is the first staged
  Wasm-facing proof for the command-dispatcher boundary. It boots from an
  immutable capability mask and exposes only gated queue metadata.

This follows the same staged pattern as the deterministic tick loop and process
state container: keep complete behavior in a zero-cost `.mjs` reference model,
then add a tiny compiler-free Wasm slice to prove the host/kernel ABI before
moving richer routing semantics into compiled Wasm memory.

## Boundary rule

The dispatcher owns command routing. It does not own time advancement, event
sequence numbers, process mutation, browser APIs, persistence, UI projection, or
content authoring.

Current command families:

- `process`: routes process command envelopes to the process state container.

The tick loop asks the dispatcher for events from ready commands on the current
tick. The dispatcher returns semantic event drafts. The tick loop remains the
owner of final event sequencing and tick stamping.

## Capability gate

The dispatcher has an explicit kernel module flag:

- `kernel.module.commandDispatcher`

It also depends on:

- `kernel.wasm.processCore`

When the dispatcher capability is enabled:

- command envelopes are normalized before they enter the queue;
- queued commands are sorted by target tick, received order, and command ID;
- ready commands are routed through registered command-family handlers;
- process commands reach the process state container only when process core is
  enabled.

When the dispatcher capability is explicitly disabled:

- ready process commands emit `CommandRejected` with
  `capability-disabled:kernel.module.commandDispatcher`;
- queued command release remains deterministic;
- process state is not mutated by rejected commands.

For backward compatibility with the earlier process-core reference model,
missing `kernel.module.commandDispatcher` values do not disable dispatch in the
`.mjs` reference model. Once a boot snapshot declares the flag explicitly,
`false` is treated as a hard module disablement. The staged Wasm dispatcher core
uses an explicit dispatcher bit and therefore requires both process-core and
command-dispatcher bits to expose queue metadata.

## Security posture

The dispatcher validates externally supplied command envelopes before commands
enter the queue. Command IDs and process IDs must use the kernel safe identifier
policy. This prevents commands from becoming accidental HTML, path, selector, or
diagnostic injection payloads when later projected into traces, journals,
authoring tools, or replay inspectors.

The dispatcher snapshots only normalized command envelopes, target ticks, and
received order values. It does not snapshot handler functions, platform objects,
or mutable host references.

The Wasm dispatcher wrapper validates queue depth before values cross the Wasm
boundary and gates queue metadata behind immutable boot capabilities.

## Test-first contract

The command dispatcher is covered by executable tests for:

- routing process commands through the process command handler;
- releasing ready queued commands by target tick then received order;
- deterministic enqueue and queue snapshots;
- explicit dispatcher-capability disablement;
- process-core disablement;
- unsafe command identifier rejection;
- deriving the staged Wasm command-dispatcher capability mask;
- booting the Wasm command-dispatcher core with enabled capabilities;
- keeping the Wasm command-dispatcher core inert when dispatcher or process core
  capability is disabled;
- rejecting invalid queue depths before values cross the Wasm boundary.

The deterministic tick-loop tests also cover integrated dispatcher degradation so
command routing failure remains visible at the runtime boundary that consumes it.

## Extension rule

Add new command families by adding a focused handler and executable coverage.
Do not add family-specific routing logic to the tick loop. Do not let content
branch on raw kernel flag IDs. Content and domain runtime code should express
capabilities at the domain level and let the platform shell resolve kernel module
flags before boot.
