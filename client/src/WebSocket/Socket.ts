import { BaseMessage } from "../../../shared/Messages";

/**
 * Custom socket class that extends websockets
 * but provides utility methods ontop of it.
 */
export class Socket extends WebSocket {
  public request<T extends BaseMessage>(
    responseType: string,
    requestMsg: BaseMessage,
    timeout: number = 3000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const listener = (event: MessageEvent) => {
        const message: BaseMessage = BaseMessage.parse(event.data);
        if (message.type === responseType) {
          const error = (message as any).error;
          if (error) {
            reject(error);
          }

          resolve(message as T);
          cleanup();
        }
      };

      this.addMessageListener(listener);

      // Send request
      this.send(JSON.stringify(requestMsg));

      const cleanup = () => {
        clearTimeout(timeoutTimer);
        this.removeMessageListener(listener);
      };

      // Timeout if no response is received
      const timeoutTimer = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            `Timeout occured while waiting for event of type: ${responseType}`
          )
        );
      }, timeout);
    });
  }

  public addMessageListener(
    listener: (this: WebSocket, ev: MessageEvent) => any
  ) {
    this.addEventListener("message", listener);
  }

  public removeMessageListener(
    listener: (this: WebSocket, ev: MessageEvent) => any
  ) {
    this.removeEventListener("message", listener);
  }
}
