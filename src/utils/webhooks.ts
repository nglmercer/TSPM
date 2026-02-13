/**
 * Webhook Implementation for TSPM
 * Sends event notifications to external HTTP endpoints
 * @module utils/webhooks
 */

import { log } from "./logger";
import { type TSPMEvent } from "./events";

export interface WebhookConfig {
  /** Webhook URL */
  url: string;
  /** Events to trigger this webhook (empty means all) */
  events?: string[];
  /** HTTP headers to send */
  headers?: Record<string, string>;
  /** Whether the webhook is enabled */
  enabled?: boolean;
}

/**
 * Webhook service to send event notifications
 */
export class WebhookService {
  private configs: WebhookConfig[];

  constructor(configs: WebhookConfig[] = []) {
    this.configs = configs.filter(c => c.enabled !== false);
  }

  /**
   * Send an event to all configured webhooks
   * @param event The event to send
   */
  async send(event: TSPMEvent): Promise<void> {
    const promises = this.configs.map(config => this.sendToWebhook(config, event));
    await Promise.allSettled(promises);
  }

  /**
   * Send an event to a specific webhook
   */
  private async sendToWebhook(config: WebhookConfig, event: TSPMEvent): Promise<void> {
    // Filter by event type if configured
    if (config.events && config.events.length > 0 && !config.events.includes(event.type)) {
      return;
    }

    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TSPM-Webhook/1.0',
          ...config.headers,
        },
        body: JSON.stringify({
          ts: Date.now(),
          event: event.type,
          data: event,
        }),
      });

      if (!response.ok) {
        log.error(`[TSPM Webhook] Failed to send to ${config.url}: ${response.status} ${response.statusText}`);
      }
    } catch (e) {
      log.error(`[TSPM Webhook] Error sending to ${config.url}: ${e}`);
    }
  }
}
