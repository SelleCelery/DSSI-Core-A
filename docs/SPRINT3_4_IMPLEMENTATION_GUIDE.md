# Sprint 3.4 Implementation Guide

## Theme

**Domain Observation Profiles and Log Export Boundaries**

Sprint 3.4 separates four responsibilities:

1. pulse observation,
2. communication explanation,
3. viscosity-bound attention,
4. later collation through observation logs.

A hostname profile changes display density only. It is not a trust, safety, reputation, permission, or allow-list decision.

## 1. Settings model

Global settings now include independently selectable route colors and pulse opacity.

```ts
communicationPulseDomColor:
  | 'magenta'
  | 'cyan'
  | 'yellow'
  | 'neutral';

communicationPulseWebRequestColor:
  | 'magenta'
  | 'cyan'
  | 'yellow'
  | 'neutral';

communicationPulseOpacity: 1 | 0.8 | 0.6 | 0.4;
```

The semantic grammar remains fixed:

- outer geometry: HTTP method,
- center glyph: communication mechanism,
- top-right marker: Cookie-header-name detection state,
- top-left corner mark: cross-origin relation,
- color: observation-route aid selected by the user,
- opacity: visual foreground strength.

Color does not encode safety, danger, warning, intention, or harmfulness.

## 2. Host display profiles

`src/storage/host-display-profile-store.ts` stores exact-hostname profiles in `chrome.storage.local`.

```ts
interface HostDisplayProfile {
  hostname: string;
  pulseVisible?: boolean;
  communicationTextVisible?: boolean;
  position?: FactChipPosition;
  pulseDurationMs?: CommunicationPulseDurationMs;
  pulseOpacity?: CommunicationPulseOpacity;
  domColor?: CommunicationPulseColor;
  webRequestColor?: CommunicationPulseColor;
  updatedAt: number;
}
```

The profile is applied over global settings:

```text
hostname profile
  overrides display fields

global settings
  remain the default

viscosity level and reporting mode
  are not changed by the hostname profile
```

The hostname is normalized conservatively. Sprint 3.4 does not collapse subdomains into an eTLD+1 site identity. `www.example.test` and `api.example.test` remain different profile keys.

The profile cache is invalidated in the Service Worker when `dssiHostDisplayProfiles` changes. This avoids stale record-time settings snapshots after a page HUD update.

## 3. Page HUD controls

The communication-pulse HUD provides:

```text
Ⅱ / ▶  pause or resume pulse rendering for the current page
×       clear currently rendered pulses
◉ / ○   save pulse visibility for the exact hostname
T       save communication-explanation visibility for the exact hostname
D       cycle and save the DOM route color
W       cycle and save the webRequest route color
α       cycle and save pulse opacity
↺       remove the hostname profile and return to global settings
```

Pause and clear remain transient page operations. Visibility, text visibility, color, opacity, and position are persisted automatically as hostname display preferences.

## 4. Attention boundary

Fact chips are divided internally into:

```ts
type ChipCategory = 'attention' | 'communication';
```

Communication text checks the independent transient/profile state. Attention chips do not.

Therefore, hiding communication pulses or communication explanatory chips cannot suppress viscosity-bound password, payment, personal-information, focus, first-host, MAX-boundary, or stale-profile attention cues.

Attention chip opacity remains fixed by the component stylesheet. Sprint 3.4 does not expose attention opacity customization.

## 5. First observation and profile review

The observed-host registry stores:

- normalized hostname,
- first observation time,
- last observation time.

A first observation produces an informational cue without automatically changing viscosity. Repeat visits update `lastObservedAt` no more than once per hour to reduce local-storage writes.

A host profile becomes review-eligible after 90 days without an update. The cue returns a review opportunity; it does not claim that the host changed or became unsafe.

## 6. Record-time settings snapshots

Observation record schema version 10 adds:

```ts
settingsSnapshotId?: string;
```

Before session persistence, the Service Worker captures the effective settings for the record hostname:

- viscosity level,
- reporting mode,
- position,
- pulse visibility,
- communication text visibility,
- duration,
- size,
- DOM and webRequest colors,
- opacity,
- local classification state,
- network-observation state,
- whether a hostname profile was applied.

Snapshots are stored in `chrome.storage.session` and de-duplicated by a stable settings fingerprint. Up to 64 snapshots are retained. Clearing all session records also clears the snapshot store.

Older records may not contain `settingsSnapshotId`; exports represent this honestly as `partial` or `unavailable` rather than applying current settings retroactively.

## 7. JSON export

`src/core/log-export.ts` creates a structured document with:

```text
export
observationContext
useBoundary
records
integrity
```

The export declares:

- application version,
- record schema version,
- exported time,
- record count,
- all-record or current-view scope,
- activity/diagnostic view filter,
- timestamp-descending record order,
- selection-and-order-only processing,
- export-time global settings,
- referenced record-time settings snapshots,
- Coverage Manifest,
- explicit exclusions,
- use boundaries,
- `integrity.status = not_provided`.

The records are shallow copies of the already privacy-validated primary observation records. No communication aggregation, purpose classification, danger scoring, missing-value inference, or host classification is added during export.

## 8. CSV export

CSV uses a fixed, stable column set and one row per observation record. Array values, such as safe autocomplete tokens, are JSON-encoded inside one CSV cell. Stable internal enum values are exported rather than Japanese presentation labels.

CSV cannot preserve nested settings and Coverage Manifest structures. Therefore, CSV-only export also downloads a context JSON document without a duplicate `records` array.

## 9. Download mechanism

Sprint 3.4 creates a `Blob`, an object URL, and a temporary anchor with the `download` attribute from the extension log page. It does not add the `downloads` permission or select an arbitrary filesystem folder. The browser's normal download location and download policy remain the storage boundary.

## 10. Use and integrity boundaries

The exported document states that the log is intended for user collation and judgment support and does not prove:

- user intent,
- user responsibility,
- communication content,
- harmfulness,
- safety.

Version 0.4.6 does not provide:

- encryption,
- digital signatures,
- authenticated integrity,
- tamper evidence,
- write protection,
- a verification utility.

These remain follow-up research because stronger evidence preservation can also strengthen coercive monitoring, compulsory disclosure, assessment, or responsibility attribution.

## 11. Deferred work

Sprint 3.4 deliberately does not implement:

- fully custom viscosity policies,
- encrypted exports,
- signing-key creation or custody,
- log re-import,
- verification tools,
- persistent history outside explicit export,
- eTLD+1 domain merging,
- trust or safety scoring.
