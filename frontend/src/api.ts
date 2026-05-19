const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type Todo = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedTodos = {
  data: Todo[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type TodoPayload = {
  title: string;
  description?: string | null;
  completed?: boolean;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let message = "Something went wrong";

    try {
      const body = (await response.json()) as { error?: string; message?: string };
      message = body.error ?? body.message ?? message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function listTodos(page = 1, limit = 10) {
  return request<PaginatedTodos>(`/todos?page=${page}&limit=${limit}`);
}

export function createTodo(payload: TodoPayload) {
  return request<Todo>("/todos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTodo(id: string, payload: Partial<TodoPayload>) {
  return request<Todo>(`/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteTodo(id: string) {
  return request<void>(`/todos/${id}`, {
    method: "DELETE",
  });
}
