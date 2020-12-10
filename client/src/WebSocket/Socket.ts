import {
  BaseMessage,
  RequestTypeMap,
  ResponseTypeMap,
} from "../../../shared/Messages";

/**
 * Custom socket class that extends websockets
 * but provides utility methods ontop of it.
 */
export class Socket extends WebSocket {
  public request<K extends keyof (RequestTypeMap & ResponseTypeMap)>(
    responseType: K,
    requestMsg: RequestTypeMap[K],
    timeout: number = 3000
  ): Promise<ResponseTypeMap[K]> {
    return new Promise((resolve, reject) => {
      const listener = (event: MessageEvent) => {
        const message: BaseMessage = JSON.parse(event.data);
        if (message.type === responseType) {
          const error = (message as any).error;
          if (error) {
            reject(error);
          }

          resolve(message as any);
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
            `Timeout occured while waiting for event of type: ${responseType} `
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
