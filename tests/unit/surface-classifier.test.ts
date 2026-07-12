import { describe, expect, it } from 'vitest';
import type { InputSurfaceDescriptor } from '../../src/core/models/input-surface';
import { classifyInputSurface } from '../../src/core/surface-classifier';

function descriptor(overrides: Partial<InputSurfaceDescriptor> = {}): InputSurfaceDescriptor {
  return {
    tagName: 'input',
    inputType: 'text',
    autocompleteTokens: [],
    semanticText: '',
    isContentEditable: false,
    role: '',
    ...overrides,
  };
}

describe('input surface classifier', () => {
  it('classifies explicit password fields', () => {
    expect(classifyInputSurface(descriptor({ inputType: 'password' }))).toEqual({
      surfaceType: 'password',
      confidence: 'explicit',
      observability: 'observable',
    });
  });

  it('classifies payment fields from autocomplete metadata', () => {
    expect(classifyInputSurface(descriptor({ autocompleteTokens: ['cc-number'] }))).toMatchObject({
      surfaceType: 'payment',
      confidence: 'explicit',
    });
  });

  it('classifies email or ID fields from explicit metadata', () => {
    expect(classifyInputSurface(descriptor({ inputType: 'email' }))).toMatchObject({
      surfaceType: 'email_or_id',
      confidence: 'explicit',
    });
  });

  it('classifies personal information using semantic metadata', () => {
    expect(
      classifyInputSurface(descriptor({ semanticText: 'customer phone number' })),
    ).toMatchObject({
      surfaceType: 'personal_information',
      confidence: 'heuristic',
    });
  });

  it('treats textareas as high-uncertainty free text', () => {
    expect(classifyInputSurface(descriptor({ tagName: 'textarea' }))).toEqual({
      surfaceType: 'free_text',
      confidence: 'generic',
      observability: 'high_uncertainty',
    });
  });

  it('keeps unsupported input types as partially observable unknowns', () => {
    expect(classifyInputSurface(descriptor({ inputType: 'file' }))).toEqual({
      surfaceType: 'unknown',
      confidence: 'generic',
      observability: 'partially_observable',
    });
  });
});
