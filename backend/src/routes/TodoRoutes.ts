import { Router } from "express";
import TodoController  from "../controller/TodoController";
import { validate } from "../middlewares/validate";
import type { TodoRepository } from "../repository/todo/TodoRepository";
import {
    createTodoBodySchema,
    listTodosQuerySchema,
    todoParamsSchema,
    updateTodoBodySchema,
} from "../schemas/TodoSchemas";

export default function TodoRoutes(repo: TodoRepository) {
    const router = Router();
    const controller = TodoController(repo);

    router.post("/", validate("body", createTodoBodySchema), controller.create);
    router.get("/", validate("query", listTodosQuerySchema), controller.list);
    router.get("/:id", validate("params", todoParamsSchema), controller.getById);
    router.put(
        "/:id",
        validate("params", todoParamsSchema),
        validate("body", updateTodoBodySchema),
        controller.update,
    );
    router.patch(
        "/:id",
        validate("params", todoParamsSchema),
        validate("body", updateTodoBodySchema),
        controller.update,
    );
    router.delete("/:id", validate("params", todoParamsSchema), controller.delete);

    return router;
}
