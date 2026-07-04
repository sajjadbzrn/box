# Error Handling

Box provides structured error handling with customizable 404 and 500 handlers, plus validation errors from the validator package.

## Default Error Handlers

By default, Box returns plain text error responses:

- **404** — `"Not Found"`
- **500** — `"Internal Server Error"`

## Custom 404 Handler

```ts
app.notFound((c) => {
  return c.json({
    error: "Route not found",
    path: c.path,
    method: c.method,
  }, 404);
});
```

## Custom Error Handler

```ts
app.onError((error, c) => {
  console.error("Unhandled error:", error);

  return c.json({
    error: "Internal Server Error",
    message: error.message,
    ...(c.env("NODE_ENV") === "development" && { stack: error.stack }),
  }, 500);
});
```

## Throwing Errors in Handlers

Errors thrown synchronously or asynchronously are caught by the error handler:

```ts
app.get("/crash", (c) => {
  throw new Error("Boom!");
});

app.get("/async-crash", async (c) => {
  await doSomething();
  throw new Error("Async boom!");
});
```

## Validation Errors

When using `boxfw-validator`, validation failures return a structured 400 response:

```ts
app.get("/user/:id", v(
  { params: z.object({ id: z.string().uuid() }) },
  (c) => c.json(c.validated.params),
));

// GET /user/abc → 400
// {
//   "error": "Invalid params",
//   "issues": [
//     {
//       "path": ["params", "id"],
//       "message": "Invalid uuid",
//       "code": "invalid_string"
//     }
//   ]
// }
```

## i18n Error Responses

With `boxfw-i18n`, errors can be translated:

```ts
app.get("/item/:id", (c) => {
  const item = findItem(c.params.id);
  if (!item) return bilingualError(c, "not_found", dict, 404);
  return c.json(item);
});
```

## Error Handling in Middleware

```ts
app.use(async (c, next) => {
  try {
    return await next();
  } catch (error) {
    console.error("Middleware caught:", error);
    return c.json({ error: "Middleware error" }, 500);
  }
});
```

## Best Practices

1. **Always return a Response** from middleware — don't let errors propagate
2. **Use `onError`** for global error formatting
3. **Don't expose stack traces** in production
4. **Log errors** using the logger package for debugging
5. **Validate early** with `v()` to catch bad input before business logic

---

> 📚 [Back to Index](../index.md) · [Previous: WebSocket](websocket.md) · [Next: Testing](testing.md)
