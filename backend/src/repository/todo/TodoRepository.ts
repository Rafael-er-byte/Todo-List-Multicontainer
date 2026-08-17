import type {
  CreateTodoDto,
  PaginatedTodosDto,
  Todo,
  UpdateTodoDto,
} from "../../dtos/TodoDto";

export type TodoRepository = {
  createTodo: (todoData: CreateTodoDto) => Promise<Todo>;
  getAllTodos: (page: number, limit: number) => Promise<PaginatedTodosDto>;
  getTodoById: (id: string) => Promise<Todo | null>;
  updateTodo: (id: string, todoData: UpdateTodoDto) => Promise<Todo | null>;
  deleteTodo: (id: string) => Promise<boolean>;
};
