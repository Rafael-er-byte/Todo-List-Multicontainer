import type {
  CreateTodoDto,
  Todo,
  UpdateTodoDto,
} from "../../dtos/TodoDto";
import { TodoModel } from "../../model/TodoModel";
import type { TodoRepository } from "./TodoRepository";

function toTodo(todo: unknown): Todo {
  return JSON.parse(JSON.stringify(todo)) as Todo;
}

export function MongooseTodoRepository(): TodoRepository {
  return {
    createTodo: async (todoData: CreateTodoDto): Promise<Todo> => {
      const todo = await TodoModel.create({
        title: todoData.title,
        completed: todoData.completed ?? false,
        ...(todoData.description !== undefined
          ? { description: todoData.description }
          : {}),
      });

      return toTodo(todo);
    },

    getAllTodos: async (page: number, limit: number) => {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        TodoModel.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean({ virtuals: true }),
        TodoModel.countDocuments(),
      ]);

      return {
        data: data.map(toTodo),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      };
    },

    getTodoById: async (id: string): Promise<Todo | null> => {
      const todo = await TodoModel.findById(id).lean({ virtuals: true });
      return todo ? toTodo(todo) : null;
    },

    updateTodo: async (
      id: string,
      todoData: UpdateTodoDto,
    ): Promise<Todo | null> => {
      const data = {
        ...(todoData.title !== undefined ? { title: todoData.title } : {}),
        ...(todoData.description !== undefined
          ? { description: todoData.description }
          : {}),
        ...(todoData.completed !== undefined
          ? { completed: todoData.completed }
          : {}),
      };

      const todo = await TodoModel.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      }).lean({ virtuals: true });

      return todo ? toTodo(todo) : null;
    },

    deleteTodo: async (id: string): Promise<boolean> => {
      const todo = await TodoModel.findByIdAndDelete(id);
      return Boolean(todo);
    },
  };
}
