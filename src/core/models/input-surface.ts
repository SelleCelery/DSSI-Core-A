import type { ClassificationConfidence, SurfaceType } from './observation';

export interface InputSurfaceDescriptor {
  tagName: string;
  inputType: string;
  autocompleteTokens: readonly string[];
  semanticText: string;
  isContentEditable: boolean;
  role: string;
}

export interface InputSurfaceClassification {
  surfaceType: SurfaceType;
  confidence: ClassificationConfidence;
}

export interface SafeInputSurfaceStructure {
  tagName: string;
  inputType: string;
  role: string;
  isContentEditable: boolean;
  autocompleteTokens: string[];
}
