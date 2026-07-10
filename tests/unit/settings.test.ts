import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/core/models/settings';

describe('default settings', () => {
  it('starts in silent mode with optional analysis disabled', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      enabled: true,
      viscosityLevel: 1,
      localClassificationEnabled: false,
      networkObservationEnabled: false,
      downloadObservationEnabled: false,
      persistentHistoryEnabled: false,
    });
  });
});
