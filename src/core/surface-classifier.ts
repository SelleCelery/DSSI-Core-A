import type { InputSurfaceClassification, InputSurfaceDescriptor } from './models/input-surface';

const PAYMENT_AUTOCOMPLETE_TOKENS = [
  'cc-name',
  'cc-number',
  'cc-exp',
  'cc-exp-month',
  'cc-exp-year',
  'cc-csc',
  'cc-type',
] as const;

const PERSONAL_AUTOCOMPLETE_TOKENS = [
  'name',
  'honorific-prefix',
  'given-name',
  'additional-name',
  'family-name',
  'honorific-suffix',
  'organization-title',
  'organization',
  'street-address',
  'address-line1',
  'address-line2',
  'address-line3',
  'address-level1',
  'address-level2',
  'address-level3',
  'address-level4',
  'country',
  'country-name',
  'postal-code',
  'tel',
  'tel-country-code',
  'tel-national',
  'tel-area-code',
  'tel-local',
  'bday',
  'bday-day',
  'bday-month',
  'bday-year',
] as const;

const PAYMENT_TERMS = [
  'creditcard',
  'cardnumber',
  'cardno',
  'cardholder',
  'expiry',
  'expiration',
  'securitycode',
  'cvv',
  'cvc',
  '決済',
  'カード番号',
  '有効期限',
  'セキュリティコード',
] as const;

const EMAIL_OR_ID_TERMS = [
  'email',
  'mailaddress',
  'username',
  'userid',
  'loginid',
  'accountid',
  'signin',
  'メール',
  'ユーザーid',
  'ログインid',
  'アカウントid',
] as const;

const PERSONAL_TERMS = [
  'fullname',
  'firstname',
  'lastname',
  'familyname',
  'givenname',
  'phonenumber',
  'telephone',
  'postalcode',
  'zipcode',
  'streetaddress',
  '住所',
  '氏名',
  '電話番号',
  '郵便番号',
] as const;

function includesAny(value: string, candidates: readonly string[]): boolean {
  return candidates.some((candidate) => value.includes(candidate));
}

function hasAutocompleteToken(
  descriptor: InputSurfaceDescriptor,
  candidates: readonly string[],
): boolean {
  return descriptor.autocompleteTokens.some((token) => candidates.includes(token));
}

export function normalizeSemanticText(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/gu, '');
}

export function classifyInputSurface(
  descriptor: InputSurfaceDescriptor,
): InputSurfaceClassification {
  const inputType = descriptor.inputType.toLowerCase();
  const semanticText = normalizeSemanticText(descriptor.semanticText);

  if (
    inputType === 'password' ||
    descriptor.autocompleteTokens.includes('current-password') ||
    descriptor.autocompleteTokens.includes('new-password')
  ) {
    return {
      surfaceType: 'password',
      confidence: 'explicit',
      observability: 'observable',
    };
  }

  if (
    hasAutocompleteToken(descriptor, PAYMENT_AUTOCOMPLETE_TOKENS) ||
    includesAny(semanticText, PAYMENT_TERMS)
  ) {
    return {
      surfaceType: 'payment',
      confidence: hasAutocompleteToken(descriptor, PAYMENT_AUTOCOMPLETE_TOKENS)
        ? 'explicit'
        : 'heuristic',
      observability: 'observable',
    };
  }

  if (
    inputType === 'email' ||
    descriptor.autocompleteTokens.includes('email') ||
    descriptor.autocompleteTokens.includes('username') ||
    includesAny(semanticText, EMAIL_OR_ID_TERMS)
  ) {
    return {
      surfaceType: 'email_or_id',
      confidence:
        inputType === 'email' ||
        descriptor.autocompleteTokens.includes('email') ||
        descriptor.autocompleteTokens.includes('username')
          ? 'explicit'
          : 'heuristic',
      observability: 'observable',
    };
  }

  if (
    inputType === 'tel' ||
    hasAutocompleteToken(descriptor, PERSONAL_AUTOCOMPLETE_TOKENS) ||
    includesAny(semanticText, PERSONAL_TERMS)
  ) {
    return {
      surfaceType: 'personal_information',
      confidence:
        inputType === 'tel' || hasAutocompleteToken(descriptor, PERSONAL_AUTOCOMPLETE_TOKENS)
          ? 'explicit'
          : 'heuristic',
      observability: 'observable',
    };
  }

  if (
    descriptor.tagName.toLowerCase() === 'textarea' ||
    descriptor.isContentEditable ||
    descriptor.role.toLowerCase() === 'textbox' ||
    ['text', 'search', 'url'].includes(inputType)
  ) {
    return {
      surfaceType: 'free_text',
      confidence: 'generic',
      observability: 'high_uncertainty',
    };
  }

  return {
    surfaceType: 'unknown',
    confidence: 'generic',
    observability: 'partially_observable',
  };
}
