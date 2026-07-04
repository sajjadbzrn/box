# WebSocket — ارتباط بلادرنگ

Box از WebSocket بومی Bun با همان API هندلرهای مسیر پشتیبانی می‌کند.

## ثبت مسیر WebSocket

```ts
app.ws("/chat", {
  open: (ws) => {
    console.log("[ws] کاربر متصل شد");
    ws.send(JSON.stringify({ type: "welcome", message: "خوش آمدید!" }));
  },
  message: (ws, data) => {
    const msg = typeof data === "string" ? data : new TextDecoder().decode(data);
    ws.send(JSON.stringify({ type: "echo", message: `شما گفتید: ${msg}` }));
  },
  close: (ws, code, reason) => {
    console.log(`[ws] کاربر قطع شد: ${code} ${reason}`);
  },
});
```

## رویدادها

| رویداد | امضا | توضیحات |
|--------|------|---------|
| `open` | `(ws: WebSocket) => void` | کاربر متصل شد |
| `message` | `(ws: WebSocket, data: string \| ArrayBuffer) => void` | پیام دریافت شد |
| `close` | `(ws: WebSocket, code: number, reason: string) => void` | کاربر قطع شد |
| `drain` | `(ws: WebSocket) => void` | فشار برگشتی کاهش یافت |

## مثال: سرور چت

```ts
const clients = new Map<string, WebSocket>();

app.ws("/chat", {
  open: (ws) => {
    const id = crypto.randomUUID();
    clients.set(id, ws);
    ws.send(JSON.stringify({ type: "id", id }));
  },
  message: (ws, data) => {
    const msg = typeof data === "string" ? JSON.parse(data) : JSON.parse(new TextDecoder().decode(data));
    for (const ws of clients.values()) {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
    }
  },
  close: (ws) => {
    for (const [id, client] of clients) {
      if (client === ws) { clients.delete(id); break; }
    }
  },
});
```

---

> 📚 [بازگشت به فهرست](../index.md) · [قبلی: Logger](../packages/logger.md) · [بعدی: مدیریت خطا](error-handling.md)
