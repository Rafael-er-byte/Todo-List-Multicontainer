import type { Request, Response } from "express";
import type { CreateTodoDto, UpdateTodoDto } from "../dtos/TodoDto";
import type { TodoRepository } from "../repository/todo/TodoRepository";
import {
  CreateTodo,
  DeleteTodo,
  GetAllTodos,
  GetTodoById,
  UpdateTodo,
} from "../services/todo/TodoServices";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parsePagination(req: Request) {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

  return { page, limit };
}

function getParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  return null;
}

export default function TodoController(repo: TodoRepository) {
  const createTodo = CreateTodo(repo);
  const getAllTodos = GetAllTodos(repo);
  const getTodoById = GetTodoById(repo);
  const updateTodo = UpdateTodo(repo);
  const deleteTodo = DeleteTodo(repo);

  return {
    create: async (req: Request, res: Response) => {
      try {
        const todoData = req.body as CreateTodoDto;

        if (!isNonEmptyString(todoData.title)) {
          return res.status(400).json({ error: "Title is required" });
        }

        const todo = await createTodo({
          ...todoData,
          title: todoData.title.trim(),
        });
        return res.status(201).json(todo);
      } catch {
        return res.status(500).json({ error: "Internal server error" });
      }
    },

    list: async (req: Request, res: Response) => {
      try {
        const { page, limit } = parsePagination(req);
        const todos = await getAllTodos(page, limit);
        return res.json(todos);
      } catch {
        return res.status(500).json({ error: "Internal server error" });
      }
    },

    getById: async (req: Request, res: Response) => {
      try {
        const id = getParam(req.params.id);
        if (!id) return res.status(400).json({ error: "Todo id is required" });

        const todo = await getTodoById(id);
        if (!todo) return res.status(404).json({ error: "Todo not found" });
        return res.json(todo);
      } catch {
        return res.status(500).json({ error: "Internal server error" });
      }
    },

    update: async (req: Request, res: Response) => {
      try {
        const id = getParam(req.params.id);
        if (!id) return res.status(400).json({ error: "Todo id is required" });

        const todoData = req.body as UpdateTodoDto;

        if (
          Object.prototype.hasOwnProperty.call(todoData, "title") &&
          !isNonEmptyString(todoData.title)
        ) {
          return res.status(400).json({ error: "Title cannot be empty" });
        }

        const todo = await updateTodo(id, {
          ...todoData,
          ...(todoData.title ? { title: todoData.title.trim() } : {}),
        });
        if (!todo) return res.status(404).json({ error: "Todo not found" });
        return res.json(todo);
      } catch {
        return res.status(500).json({ error: "Internal server error" });
      }
    },

    delete: async (req: Request, res: Response) => {
      try {
        const id = getParam(req.params.id);
        if (!id) return res.status(400).json({ error: "Todo id is required" });

        const deleted = await deleteTodo(id);
        if (!deleted) return res.status(404).json({ error: "Todo not found" });
        return res.sendStatus(204);
      } catch {
        return res.status(500).json({ error: "Internal server error" });
      }
    },
  };
}

