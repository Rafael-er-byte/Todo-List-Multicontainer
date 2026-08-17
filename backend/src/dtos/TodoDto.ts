export type Todo = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTodoDto = {
  title: string;
  description?: string | null;
  completed?: boolean;
};

export type UpdateTodoDto = Partial<CreateTodoDto>;

export type PaginatedTodosDto = {
  data: Todo[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
