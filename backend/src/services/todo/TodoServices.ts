import type {
  CreateTodoDto,
  PaginatedTodosDto,
  Todo,
  UpdateTodoDto,
} from "../../dtos/TodoDto";
import { todoLogger } from "../../logger";
import type { TodoRepository } from "../../repository/todo/TodoRepository";

export function CreateTodo(repo: TodoRepository) {
  return async function (todoData: CreateTodoDto): Promise<Todo> {
    todoLogger.info({ title: todoData.title }, "Creating todo");
    const todo = await repo.createTodo(todoData);
    todoLogger.info({ todoId: todo.id }, "Todo created");

    return todo;
  };
}

export function GetAllTodos(repo: TodoRepository) {
  return async function (page: number, limit: number): Promise<PaginatedTodosDto> {
    todoLogger.debug({ page, limit }, "Listing todos");
    const todos = await repo.getAllTodos(page, limit);
    todoLogger.debug(
      { page, limit, total: todos.total, data: todos.data },
      "Todos listed",
    );

    return todos;
  };
}

export function GetTodoById(repo: TodoRepository) {
  return async function (id: string): Promise<Todo | null> {
    todoLogger.debug({ todoId: id }, "Getting todo by id");
    const todo = await repo.getTodoById(id);
    todoLogger.debug({ todoId: id, found: Boolean(todo) }, "Todo lookup complete");

    return todo;
  };
}

export function UpdateTodo(repo: TodoRepository) {
  return async function (id: string, todoData: UpdateTodoDto): Promise<Todo | null> {
    todoLogger.info({ todoId: id }, "Updating todo");
    const todo = await repo.updateTodo(id, todoData);
    todoLogger.info({ todoId: id, updated: Boolean(todo) }, "Todo update complete");

    return todo;
  };
}

export function DeleteTodo(repo: TodoRepository) {
  return async function (id: string): Promise<boolean> {
    todoLogger.info({ todoId: id }, "Deleting todo");
    const deleted = await repo.deleteTodo(id);
    todoLogger.info({ todoId: id, deleted }, "Todo delete complete");

    return deleted;
  };
}
