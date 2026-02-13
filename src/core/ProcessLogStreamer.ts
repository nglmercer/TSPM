import { LogManager, log } from "../utils/logger";
import { EventEmitter, createEvent } from "../utils/events";
import { EventTypeValues, EventPriorityValues } from "../utils/events";
import { LOG_TYPE, type LogType } from "../utils/config/constants";

export class ProcessLogStreamer {
  constructor(
    private processName: string,
    private instanceId: number,
    private eventEmitter: EventEmitter
  ) {}

  /**
   * Stream process output to a file with rotation
   */
  async streamToFile(stream: ReadableStream, path: string, type: LogType): Promise<void> {
    const writer = stream.getReader();
    const decoder = new TextDecoder();
    let bytesWritten = 0;
    const rotateThreshold = 64 * 1024; // Check rotation every 64KB written

    try {
      while (true) {
        const { done, value } = await writer.read();
        if (done) break;
        
        const message = decoder.decode(value);
        
        // Emit log event
        this.eventEmitter.emit(createEvent(
          EventTypeValues.PROCESS_LOG,
          'ProcessLogStreamer',
          {
            processName: this.processName,
            instanceId: this.instanceId,
            message,
            type,
          },
          EventPriorityValues.LOW
        ));

        // @ts-ignore - Bun.write supports append in newer versions
        await Bun.write(path, value, { append: true });
        
        bytesWritten += value.length;
        if (bytesWritten >= rotateThreshold) {
            LogManager.rotate(path);
            bytesWritten = 0;
        }
      }
    } catch (e) {
      log.error(`[TSPM] Error writing to ${path}: ${e}`);
    }
  }
}
