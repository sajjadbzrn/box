# WebSocket — Real-Time Communication

Box supports native Bun WebSockets with the same API as route handlers.

## Registering a WebSocket Route

```ts
app.ws("/chat", {
  open: (ws) => {
    console.log("[ws] Client connected");
    ws.send(JSON.stringify({ type: "welcome", message: "Welcome!" }));
  },
  message: (ws, data) => {
    const msg = typeof data === "string" ? data : new TextDecoder().decode(data);
    console.log(`[ws] Received: ${msg}`);
    ws.send(JSON.stringify({ type: "echo", message: `You said: ${msg}` }));
  },
  close: (ws, code, reason) => {
    console.log(`[ws] Client disconnected: ${code} ${reason}`);
  },
  drain: (ws) => {
    console.log("[ws] Backpressure relieved");
  },
});
```

## Handler Events

| Event | Signature | Description |
|-------|-----------|-------------|
| `open` | `(ws: WebSocket) => void` | Client connected |
| `message` | `(ws: WebSocket, data: string \| ArrayBuffer) => void` | Message received |
| `close` | `(ws: WebSocket, code: number, reason: string) => void` | Client disconnected |
| `drain` | `(ws: WebSocket) => void` | Backpressure relieved |

## Sending Messages

```ts
// Send text
ws.send("Hello!");

// Send JSON
ws.send(JSON.stringify({ type: "event", data: payload }));

// Send binary
ws.send(new TextEncoder().encode("binary data"));

// Send to all connected clients (requires tracking)
const clients = new Set<WebSocket>();

app.ws("/broadcast", {
  open: (ws) => clients.add(ws),
  message: (ws, data) => {
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  },
  close: (ws) => clients.delete(ws),
});
```

## Cloudflare Workers

Workers use `WebSocketPair` instead of `Bun.serve()`. The route definitions remain identical — only the entry point differs:

```ts
// worker-entry.ts
export default {
  async fetch(request) {
    return app.fetch(request);
  },
};
```

## Example: Chat Server

```ts
const clients = new Map<string, WebSocket>();

app.ws("/chat", {
  open: (ws) => {
    const id = crypto.randomUUID();
    clients.set(id, ws);
    ws.send(JSON.stringify({ type: "id", id }));
    broadcast({ type: "join", id, count: clients.size });
  },
  message: (ws, data) => {
    const msg = typeof data === "string" ? JSON.parse(data) : JSON.parse(new TextDecoder().decode(data));
    broadcast({ type: "message", id: msg.id, text: msg.text });
  },
  close: (ws) => {
    const id = [...clients.entries()].find(([, v]) => v === ws)?.[0];
    if (id) { clients.delete(id); broadcast({ type: "leave", id, count: clients.size }); }
  },
});

function broadcast(data: unknown) {
  const msg = JSON.stringify(data);
  for (const ws of clients.values()) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}
```

---

> 📚 [Back to Index](../index.md) · [Previous: Logger](../packages/logger.md) · [Next: Error Handling](error-handling.md)
