export class SettingsMemoryQueue {
  #tail: Promise<void> = Promise.resolve();

  public afterWrites<T>(operation: () => Promise<T>): Promise<T> {
    return this.#tail.then(operation);
  }

  public enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.#tail.then(operation);
    this.#tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
