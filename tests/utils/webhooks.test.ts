import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from 'bun:test';
import { WebhookService, type WebhookConfig } from '../../src/utils/webhooks';
import { EventTypeValues, type TSPMEvent } from '../../src/utils/events';
import { HTTP_METHODS } from '../../src/utils/constants';

// Mock global fetch
const originalFetch = global.fetch;

describe('WebhookService', () => {
  let webhookService: WebhookService;
  const mockUrl = 'http://example.com/webhook';
  
  beforeEach(() => {
    global.fetch = mock(() => Promise.resolve(new Response('OK'))) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    mock.restore();
  });

  it('should create service with enabled configs', () => {
    const configs: WebhookConfig[] = [
      { url: 'http://1', enabled: true },
      { url: 'http://2', enabled: false },
      { url: 'http://3' } // default enabled
    ];
    
    // Access private property for testing or strict check behavior
    const service = new WebhookService(configs);
    // @ts-ignore
    expect(service.configs).toHaveLength(2);
  });

  it('should send event to all enabled webhooks', async () => {
    const config: WebhookConfig = { url: mockUrl };
    webhookService = new WebhookService([config]);
    
    // Create a valid ProcessStartEvent
    const event: TSPMEvent = {
        type: EventTypeValues.PROCESS_START,
        data: { 
            processName: 'test',
            instanceId: 0,
            config: {}
        },
        timestamp: Date.now(),
        source: 'test-source',
        priority: 'normal'
    };

    await webhookService.send(event);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(mockUrl, expect.objectContaining({
      method: HTTP_METHODS.POST,
      body: expect.stringContaining(EventTypeValues.PROCESS_START)
    }));
  });

  it('should filter events based on config', async () => {
    const config: WebhookConfig = { 
      url: mockUrl,
      events: [EventTypeValues.PROCESS_STOP]
    };
    webhookService = new WebhookService([config]);
    
    const startEvent: TSPMEvent = {
        type: EventTypeValues.PROCESS_START,
        data: { 
            processName: 'test',
            instanceId: 0,
            config: {}
        },
        timestamp: Date.now(),
        source: 'test',
        priority: 'normal'
    };

    await webhookService.send(startEvent);
    expect(fetch).not.toHaveBeenCalled();

    const stopEvent: TSPMEvent = {
        type: EventTypeValues.PROCESS_STOP,
        data: { 
            processName: 'test',
            instanceId: 0,
            reason: 'manual'
        },
        timestamp: Date.now(),
        source: 'test',
        priority: 'normal'
    };

    await webhookService.send(stopEvent);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should include custom headers', async () => {
    const config: WebhookConfig = { 
      url: mockUrl,
      headers: { 'X-Custom-Auth': 'secret' }
    };
    webhookService = new WebhookService([config]);
    
    const event: TSPMEvent = {
        type: EventTypeValues.PROCESS_START,
        data: { 
            processName: 'test',
            instanceId: 0,
            config: {}
        },
        timestamp: Date.now(),
        source: 'test',
        priority: 'normal'
    };

    await webhookService.send(event);

    expect(fetch).toHaveBeenCalledWith(mockUrl, expect.objectContaining({
      headers: expect.objectContaining({
        'X-Custom-Auth': 'secret'
      })
    }));
  });

  it('should handle fetch errors gracefully', async () => {
    global.fetch = mock(() => Promise.reject(new Error('Network error'))) as any;
    
    const config: WebhookConfig = { url: mockUrl };
    webhookService = new WebhookService([config]);
    
    const event: TSPMEvent = {
        type: EventTypeValues.PROCESS_START,
        data: { 
            processName: 'test',
            instanceId: 0,
            config: {}
        },
        timestamp: Date.now(),
        source: 'test',
        priority: 'normal'
    };

    // Should not throw
    await webhookService.send(event);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle non-200 responses', async () => {
    global.fetch = mock(() => Promise.resolve(new Response('Error', { status: 500 }))) as any;
    
    const config: WebhookConfig = { url: mockUrl };
    webhookService = new WebhookService([config]);
    
    const event: TSPMEvent = {
        type: EventTypeValues.PROCESS_START,
        data: { 
            processName: 'test',
            instanceId: 0,
            config: {}
        },
        timestamp: Date.now(),
        source: 'test',
        priority: 'normal'
    };

    // Should not throw and log error (which we can't easily assert without mocking logger, but execution safety is key)
    await webhookService.send(event);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
