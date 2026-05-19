import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createTodo,
  deleteTodo,
  listTodos,
  Todo,
  updateTodo,
} from "./api";

type Filter = "all" | "active" | "completed";

const PAGE_SIZE = 10;

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completedCount = useMemo(
    () => todos.filter((todo) => todo.completed).length,
    [todos],
  );

  const visibleTodos = useMemo(() => {
    if (filter === "active") return todos.filter((todo) => !todo.completed);
    if (filter === "completed") return todos.filter((todo) => todo.completed);
    return todos;
  }, [filter, todos]);

  async function loadTodos(nextPage = page) {
    setLoading(true);
    setError(null);

    try {
      const result = await listTodos(nextPage, PAGE_SIZE);
      setTodos(result.data);
      setPage(result.page);
      setTotal(result.total);
      setTotalPages(Math.max(result.totalPages, 1));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load todos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTodos(1);
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createTodo({
        title: cleanTitle,
        description: description.trim() || null,
      });
      setTitle("");
      setDescription("");
      await loadTodos(1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create todo");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(todo: Todo) {
    setEditingId(todo.id);
    setDraftTitle(todo.title);
    setDraftDescription(todo.description ?? "");
  }

  function cancelEditing() {
    setEditingId(null);
    setDraftTitle("");
    setDraftDescription("");
  }

  async function saveEditing(todo: Todo) {
    const cleanTitle = draftTitle.trim();
    if (!cleanTitle) {
      setError("Title cannot be empty");
      return;
    }

    setBusyId(todo.id);
    setError(null);

    try {
      const updated = await updateTodo(todo.id, {
        title: cleanTitle,
        description: draftDescription.trim() || null,
      });
      setTodos((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      cancelEditing();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update todo");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleTodo(todo: Todo) {
    setBusyId(todo.id);
    setError(null);

    try {
      const updated = await updateTodo(todo.id, {
        completed: !todo.completed,
      });
      setTodos((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update todo");
    } finally {
      setBusyId(null);
    }
  }

  async function removeTodo(todo: Todo) {
    setBusyId(todo.id);
    setError(null);

    try {
      await deleteTodo(todo.id);
      await loadTodos(page);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete todo");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Todo List</p>
          <h1>Plan the day, then move through it.</h1>
        </div>
        <div className="stats" aria-label="Todo statistics">
          <span>
            <strong>{total}</strong>
            total
          </span>
          <span>
            <strong>{completedCount}</strong>
            done here
          </span>
        </div>
      </section>

      <section className="todo-panel">
        <form className="todo-form" onSubmit={handleCreate}>
          <label>
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Write a task"
              disabled={saving}
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional details"
              disabled={saving}
              rows={3}
            />
          </label>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Adding..." : "Add todo"}
          </button>
        </form>

        <div className="toolbar">
          <div className="filters" aria-label="Todo filters">
            {(["all", "active", "completed"] as Filter[]).map((item) => (
              <button
                key={item}
                type="button"
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <button
            className="ghost-button"
            type="button"
            onClick={() => loadTodos(page)}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {error ? <div className="alert">{error}</div> : null}

        <div className="todo-list" aria-live="polite">
          {loading ? (
            <div className="empty-state">Loading todos...</div>
          ) : visibleTodos.length === 0 ? (
            <div className="empty-state">No todos in this view.</div>
          ) : (
            visibleTodos.map((todo) => {
              const isEditing = editingId === todo.id;
              const isBusy = busyId === todo.id;

              return (
                <article
                  className={`todo-item ${todo.completed ? "completed" : ""}`}
                  key={todo.id}
                >
                  <button
                    className="check-button"
                    type="button"
                    aria-label={todo.completed ? "Mark active" : "Mark completed"}
                    onClick={() => toggleTodo(todo)}
                    disabled={isBusy}
                  >
                    {todo.completed ? "✓" : ""}
                  </button>

                  <div className="todo-content">
                    {isEditing ? (
                      <div className="edit-fields">
                        <input
                          value={draftTitle}
                          onChange={(event) => setDraftTitle(event.target.value)}
                          disabled={isBusy}
                        />
                        <textarea
                          value={draftDescription}
                          onChange={(event) =>
                            setDraftDescription(event.target.value)
                          }
                          disabled={isBusy}
                          rows={2}
                        />
                      </div>
                    ) : (
                      <>
                        <h2>{todo.title}</h2>
                        {todo.description ? <p>{todo.description}</p> : null}
                        <span className="timestamp">
                          Updated {formatDate(todo.updatedAt)}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="item-actions">
                    {isEditing ? (
                      <>
                        <button
                          className="small-button"
                          type="button"
                          onClick={() => saveEditing(todo)}
                          disabled={isBusy}
                        >
                          Save
                        </button>
                        <button
                          className="text-button"
                          type="button"
                          onClick={cancelEditing}
                          disabled={isBusy}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="small-button"
                          type="button"
                          onClick={() => startEditing(todo)}
                          disabled={isBusy}
                        >
                          Edit
                        </button>
                        <button
                          className="danger-button"
                          type="button"
                          onClick={() => removeTodo(todo)}
                          disabled={isBusy}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>

        <footer className="pagination">
          <button
            className="ghost-button"
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => loadTodos(page - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            className="ghost-button"
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => loadTodos(page + 1)}
          >
            Next
          </button>
        </footer>
      </section>
    </main>
  );
}
