import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import type { Todo } from "../src/dtos/TodoDto";
import type { TodoRepository } from "../src/repository/todo/TodoRepository";
import TodoRoutes from "../src/routes/TodoRoutes";

const validId = "507f1f77bcf86cd799439011";
const missingId = "507f1f77bcf86cd799439012";

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  const now = new Date("2026-05-17T00:00:00.000Z");

  return {
    id: validId,
    title: "Write tests",
    description: null,
    completed: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeRepo(): TodoRepository {
  const todos = new Map<string, Todo>([[validId, makeTodo()]]);

  return {
    createTodo: async (todoData) => {
      const todo = makeTodo({
        id: "507f1f77bcf86cd799439013",
        title: todoData.title,
        description: todoData.description ?? null,
        completed: todoData.completed ?? false,
      });
      todos.set(todo.id, todo);
      return todo;
    },

    getAllTodos: async (page, limit) => ({
      data: Array.from(todos.values()),
      page,
      limit,
      total: todos.size,
      totalPages: Math.ceil(todos.size / limit),
    }),

    getTodoById: async (id) => todos.get(id) ?? null,

    updateTodo: async (id, todoData) => {
      const existing = todos.get(id);
      if (!existing) return null;

      const updated = {
        ...existing,
        ...todoData,
        updatedAt: new Date("2026-05-17T01:00:00.000Z"),
      };
      todos.set(id, updated);
      return updated;
    },

    deleteTodo: async (id) => todos.delete(id),
  };
}

function makeApp(repo = makeRepo()) {
  const app = express();
  app.use(express.json());
  app.use("/todos", TodoRoutes(repo));
  return app;
}

describe("TodoRoutes", () => {
  let app: express.Express;

  beforeEach(() => {
    app = makeApp();
  });

  it("creates a todo with valid data", async () => {
    const response = await request(app)
      .post("/todos")
      .send({ title: "  New todo  ", description: "Body", completed: true })
      .expect(201);

    expect(response.body).toMatchObject({
      title: "New todo",
      description: "Body",
      completed: true,
    });
  });

  it("rejects create requests without a title", async () => {
    const response = await request(app)
      .post("/todos")
      .send({ description: "Missing title" })
      .expect(400);

    expect(response.body.error).toBe("Validation error");
  });

  it("lists todos with validated pagination query params", async () => {
    const response = await request(app)
      .get("/todos?page=2&limit=5")
      .expect(200);

    expect(response.body).toMatchObject({
      page: 2,
      limit: 5,
      total: 1,
      totalPages: 1,
    });
    expect(response.body.data).toHaveLength(1);
  });

  it("rejects invalid pagination query params", async () => {
    await request(app).get("/todos?page=0&limit=101").expect(400);
  });

  it("gets a todo by id", async () => {
    const response = await request(app).get(`/todos/${validId}`).expect(200);

    expect(response.body).toMatchObject({
      id: validId,
      title: "Write tests",
    });
  });

  it("rejects invalid todo ids before reaching the controller", async () => {
    await request(app).get("/todos/not-a-mongo-id").expect(400);
  });

  it("returns 404 when a todo does not exist", async () => {
    await request(app).get(`/todos/${missingId}`).expect(404);
  });

  it("updates a todo with valid data", async () => {
    const response = await request(app)
      .patch(`/todos/${validId}`)
      .send({ title: "  Updated  ", completed: true })
      .expect(200);

    expect(response.body).toMatchObject({
      id: validId,
      title: "Updated",
      completed: true,
    });
  });

  it("rejects empty update requests", async () => {
    await request(app).patch(`/todos/${validId}`).send({}).expect(400);
  });

  it("deletes a todo", async () => {
    await request(app).delete(`/todos/${validId}`).expect(204);
    await request(app).get(`/todos/${validId}`).expect(404);
  });
});
