import { describe, expect, it, vi } from "vitest";
import type { Todo } from "../src/dtos/TodoDto";
import type { TodoRepository } from "../src/repository/todo/TodoRepository";
import {
  CreateTodo,
  DeleteTodo,
  GetAllTodos,
  GetTodoById,
  UpdateTodo,
} from "../src/services/todo/TodoServices";

const todo: Todo = {
  id: "507f1f77bcf86cd799439011",
  title: "Test todo",
  description: null,
  completed: false,
  createdAt: new Date("2026-05-17T00:00:00.000Z"),
  updatedAt: new Date("2026-05-17T00:00:00.000Z"),
};

function makeRepo(): TodoRepository {
  return {
    createTodo: vi.fn(async () => todo),
    getAllTodos: vi.fn(async (page, limit) => ({
      data: [todo],
      page,
      limit,
      total: 1,
      totalPages: 1,
    })),
    getTodoById: vi.fn(async () => todo),
    updateTodo: vi.fn(async () => ({ ...todo, completed: true })),
    deleteTodo: vi.fn(async () => true),
  };
}

describe("TodoServices", () => {
  it("creates a todo through the repository", async () => {
    const repo = makeRepo();
    const createTodo = CreateTodo(repo);

    const result = await createTodo({ title: "Test todo" });

    expect(result).toEqual(todo);
    expect(repo.createTodo).toHaveBeenCalledWith({ title: "Test todo" });
  });

  it("lists todos through the repository", async () => {
    const repo = makeRepo();
    const getAllTodos = GetAllTodos(repo);

    const result = await getAllTodos(1, 10);

    expect(result.total).toBe(1);
    expect(repo.getAllTodos).toHaveBeenCalledWith(1, 10);
  });

  it("gets a todo by id through the repository", async () => {
    const repo = makeRepo();
    const getTodoById = GetTodoById(repo);

    const result = await getTodoById(todo.id);

    expect(result).toEqual(todo);
    expect(repo.getTodoById).toHaveBeenCalledWith(todo.id);
  });

  it("updates a todo through the repository", async () => {
    const repo = makeRepo();
    const updateTodo = UpdateTodo(repo);

    const result = await updateTodo(todo.id, { completed: true });

    expect(result?.completed).toBe(true);
    expect(repo.updateTodo).toHaveBeenCalledWith(todo.id, { completed: true });
  });

  it("deletes a todo through the repository", async () => {
    const repo = makeRepo();
    const deleteTodo = DeleteTodo(repo);

    const result = await deleteTodo(todo.id);

    expect(result).toBe(true);
    expect(repo.deleteTodo).toHaveBeenCalledWith(todo.id);
  });
});
