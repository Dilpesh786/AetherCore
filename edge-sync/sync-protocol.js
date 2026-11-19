/**
 * AetherCore - Edge Sync Protocol Module
 * 2050-Ready Open Architecture for Humanity
 * Zero-bloat queue and deterministic sync helper for intermittent or offline-first networks.
 */

export class EdgeSyncProtocol {
  constructor(options = {}) {
    this.maxBatchSize = Number.isInteger(options.maxBatchSize) && options.maxBatchSize > 0
      ? options.maxBatchSize
      : 50;
    this.queue = [];
  }

  enqueue(eventType, data = null) {
    if (!eventType || typeof eventType !== "string") {
      throw new Error("AetherCore EdgeSync: Valid eventType string is required.");
    }
    const entry = {
      id: `${Date.now()}-${this.queue.length + 1}`,
      eventType,
      data,
      queuedAt: new Date().toISOString()
    };
    this.queue.push(entry);
    return entry;
  }

  peekBatch(limit = this.maxBatchSize) {
    const safeLimit = Math.max(1, Math.min(limit, this.maxBatchSize));
    return this.queue.slice(0, safeLimit);
  }

  async flush(transportHandler, limit = this.maxBatchSize) {
    if (typeof transportHandler !== "function") {
      throw new Error("AetherCore EdgeSync: transportHandler function is required.");
    }
    const batch = this.peekBatch(limit);
    if (batch.length === 0) {
      return { syncedCount: 0, remainingCount: 0 };
    }

    const result = await transportHandler(batch);
    const syncedCount = batch.length;
    this.queue.splice(0, syncedCount);

    return {
      syncedCount,
      remainingCount: this.queue.length,
      transportResult: result ?? null
    };
  }

  getStatus() {
    return {
      pendingCount: this.queue.length,
      maxBatchSize: this.maxBatchSize
    };
  }
}
