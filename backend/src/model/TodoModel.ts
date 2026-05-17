import { Schema, model, type HydratedDocument } from "mongoose";
import type { Todo } from "../dtos/TodoDto";

type TodoDocument = HydratedDocument<Omit<Todo, "id">>;

const todoSchema = new Schema<Omit<Todo, "id">>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

todoSchema.set("toJSON", {
  transform: (_doc: TodoDocument, ret: Record<string, unknown>) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const TodoModel = model<Omit<Todo, "id">>("Todo", todoSchema);
