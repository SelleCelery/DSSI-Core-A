export type OnboardingInstallReason =
  'install' | 'update' | 'chrome_update' | 'shared_module_update';

export function shouldOpenOnboarding(
  reason: OnboardingInstallReason,
  currentPresentationRecorded: boolean,
): boolean {
  return reason === 'install' || !currentPresentationRecorded;
}
