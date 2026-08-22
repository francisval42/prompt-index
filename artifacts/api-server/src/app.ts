import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { WebhookHandlers } from "./lib/webhookHandlers";

const app: Express = express();

// Behind the Replit shared proxy; trust X-Forwarded-* so req.ip is the client.
// Trust exactly one hop (the Replit router in dev, the deployment sidecar in
// prod). `true` would trust the whole X-Forwarded-For chain, letting clients
// spoof req.ip with an arbitrary leftmost entry.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// Stripe webhook must be registered BEFORE express.json():
// signature verification needs the raw request body as a Buffer.
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res): Promise<void> => {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        req.log.error(
          "Stripe webhook body is not a Buffer; express.json() must not run before this route",
        );
        res.status(500).json({ error: "Webhook processing error" });
        return;
      }

      await WebhookHandlers.processWebhook(req.body, sig);

      res.status(200).json({ received: true });
    } catch (error) {
      req.log.error({ err: error }, "Stripe webhook processing failed");
      res.status(400).json({ error: "Webhook processing error" });
    }
  },
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
