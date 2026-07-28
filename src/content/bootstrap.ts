import { loadSettings } from '../storage/settings-store';
import { InputSurfaceObserver } from './input-surface-observer';
import { SubmissionObserver } from './submission-observer';

async function bootstrap(): Promise<void> {
  const settings = await loadSettings();
  if (!settings.enabled) return;

  const sessionId = crypto.randomUUID();
  new InputSurfaceObserver(settings, sessionId).start();
  new SubmissionObserver(settings, sessionId).start();
}

void bootstrap();
