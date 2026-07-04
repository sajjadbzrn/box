# Benchmarking — Performance

Box uses an internal benchmark comparing raw throughput against Hono (a similar Bun framework) by calling the `fetch` handler directly — no network overhead.

## Running Benchmarks

```bash
bun run packages/benchmark/src/run-bench.ts
```

## Current Results (200k requests)

| Route | Box (req/s) | Hono (req/s) | Ratio |
|-------|-------------|--------------|-------|
| Static `GET /` | ~2,000,000 | ~3,000,000 | ~66% |
| Param `GET /user/:id` | ~1,600,000 | ~2,000,000 | ~80% |

*(Results vary by hardware — run the benchmark on your machine)*

## What's Measured

- **Raw `fetch()` throughput** — no network stack
- **Wall-clock time** for 200,000 sequential requests
- **Warmup** — 10,000 requests before measurement to warm up JIT

## Performance Design

Box is designed for **real-world application performance**, not micro-benchmarks:

| Feature | Cost | Why |
|---------|------|-----|
| Radix tree | O(path_length) | Fast enough for any path depth |
| Context object | ~1μs allocation | One per request, negligible |
| Middleware pipeline | ~0.5μs per layer | Scales linearly |
| Zod validation | ~5–50μs per schema | Only when you use `v()` |
| JSON formatting | payload-dependent | Standard `JSON.stringify` |

## Optimization Tips

1. **Use static routes** when possible — they're faster than dynamic `:param` routes
2. **Minimize middleware** — each layer adds ~0.5μs overhead
3. **Skip validation** on high-throughput internal routes if input is trusted
4. **Use `c.text()`** for simple responses — less overhead than `c.json()`

## Comparison Notes

Box targets **solo/indie developers** building full-stack apps — not the absolute fastest request throughput. The framework prioritizes:

- **Developer experience** — full type safety, rich middleware ecosystem
- **Zero-cost batteries** — everything works out of the box
- **Dual runtime** — same code on Bun and Workers

For 99.9% of applications, Box's throughput is more than sufficient.

---

> 📚 [Back to Index](../index.md) · [Previous: Architecture](architecture.md)
