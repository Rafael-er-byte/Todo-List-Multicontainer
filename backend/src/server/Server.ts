import express from "express";
import cors from "cors";
import dotenv from "dotenv/config";
import pinoHttp from "pino-http";
import { connectMongo } from "../database/mongo";
import { logger } from "../logger";
import { MongooseTodoRepository } from "../repository/todo/MongooseTodoRepository.js";
import TodoRoutes from "../routes/TodoRoutes";

const app = express();
app.use(cors());
app.use(
    pinoHttp({
        logger,
        customProps: (req) => ({
            requestId: req.id,
        }),
    }),
);
app.use(express.json());
app.use("/todos", TodoRoutes(MongooseTodoRepository()));

const port = process.env.PORT || 3000;

async function startServer(): Promise<void> {
    await connectMongo();

    app.listen(port, () => {
        logger.info({ port }, "Server is running");
    });
}

startServer().catch((error: unknown) => {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
});

export default app;
