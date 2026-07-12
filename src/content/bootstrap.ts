import { loadSettings } from '../storage/settings-store';
import { InputSurfaceObserver } from './input-surface-observer';

async function bootstrap(): Promise<void> {
  const settings = await loadSettings();
  if (!settings.enabled) return;

  const observer = new InputSurfaceObserver(settings);
  observer.start();
}

void bootstrap();
