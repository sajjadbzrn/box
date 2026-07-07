import { Box, cors } from "boxfw-core";

import { createLogger, requestLogger } from "boxfw-logger";


import { localeDetect, t, rtlMeta } from "boxfw-i18n";


import { v, z } from "boxfw-validator";


import { openapi } from "boxfw-openapi";


import { D, typedDb } from "./db";
import { db } from "./db";
import * as schema from "../drizzle/schema";



const app = new Box();


const log = createLogger({ level: "debug", name: "test-proj" });
app.use(requestLogger({ logger: log }));


app.use(cors({ origin: "*" }));


app.use(localeDetect({
  default: "en",
  supported: ["en", "fa"],
}));



app.use(D(db));





openapi(app, {
  info: {
    title: "test-proj",
    version: "0.0.0",
    description: "test-proj API",
  },
  path: "/openapi.json",
});


app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

app.onError((c, err) => {
  
  log.error("Unhandled error", { error: err.message });
  
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

// Routes
app.get("/", (c) => {
  return c.json({
    message: "Hello, Box!",
    project: "test-proj",
    runtime: "bun",
    
    locale: c.locale,
    dir: rtlMeta(c.locale).dir,
    
  });
});


// Zod validation example
const helloQuery = z.object({
  name: z.string().optional().default("World"),
});

app.get("/hello", v({ query: helloQuery }, (c) => {
  return c.json({ message: `Hello, ${c.validated.query.name}!` });
}));



// Drizzle CRUD example
app.get("/users", async (c) => {
  const users = await typedDb(c).select().from(schema.users);
  return c.json(users);
});





const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen({ port });
{{#if hasLogger}}
log.info(`Server running at http://localhost:${port}`);
{{else}}
console.log(`Server running at http://localhost:${port}`);

{{/if}}
