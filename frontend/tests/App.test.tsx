import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import type { PaginatedTodos, Todo } from "../src/api";

const baseTodo: Todo = {
  id: "665f1f1f1f1f1f1f1f1f1f1f",
  title: "Buy milk",
  description: "Two bottles",
  completed: false,
  createdAt: "2026-05-18T12:00:00.000Z",
  updatedAt: "2026-05-18T12:00:00.000Z",
};

function todo(overrides: Partial<Todo> = {}): Todo {
  return {
    ...baseTodo,
    ...overrides,
  };
}

function page(data: Todo[], overrides: Partial<PaginatedTodos> = {}): PaginatedTodos {
  return {
    data,
    page: 1,
    limit: 10,
    total: data.length,
    totalPages: 1,
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function emptyResponse(): Response {
  return new Response(null, { status: 204 });
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("loads todos and renders summary counts", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        page([
          todo(),
          todo({
            id: "775f1f1f1f1f1f1f1f1f1f1f",
            title: "Ship frontend",
            description: null,
            completed: true,
          }),
        ]),
      ),
    );

    render(<App />);

    expect(screen.getByText("Loading todos...")).toBeInTheDocument();
    expect(await screen.findByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByText("Ship frontend")).toBeInTheDocument();
    expect(screen.getByText("Two bottles")).toBeInTheDocument();
    const stats = within(screen.getByLabelText("Todo statistics"));
    expect(stats.getByText("2")).toBeInTheDocument();
    expect(stats.getByText("1")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/todos?page=1&limit=10",
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it("creates a todo and refreshes the list", async () => {
    const user = userEvent.setup();
    const created = todo({
      id: "885f1f1f1f1f1f1f1f1f1f1f",
      title: "Write tests",
      description: "Cover the main todo flow",
    });

    fetchMock
      .mockResolvedValueOnce(jsonResponse(page([])))
      .mockResolvedValueOnce(jsonResponse(created, 201))
      .mockResolvedValueOnce(jsonResponse(page([created])));

    render(<App />);

    await screen.findByText("No todos in this view.");
    await user.type(screen.getByLabelText("Title"), " Write tests ");
    await user.type(screen.getByLabelText("Description"), "Cover the main todo flow");
    await user.click(screen.getByRole("button", { name: "Add todo" }));

    expect(await screen.findByText("Write tests")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3000/todos",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          title: "Write tests",
          description: "Cover the main todo flow",
        }),
      }),
    );
    expect(screen.getByLabelText("Title")).toHaveValue("");
  });

  it("toggles completion and filters visible todos", async () => {
    const user = userEvent.setup();
    const active = todo({ title: "Pay bills", completed: false });
    const completed = todo({
      id: "995f1f1f1f1f1f1f1f1f1f1f",
      title: "Read docs",
      completed: true,
    });

    fetchMock
      .mockResolvedValueOnce(jsonResponse(page([active, completed])))
      .mockResolvedValueOnce(jsonResponse({ ...active, completed: true }));

    render(<App />);

    await screen.findByText("Pay bills");
    await user.click(screen.getByRole("button", { name: "Mark completed" }));
    await user.click(screen.getByRole("button", { name: "completed" }));

    expect(screen.getByText("Pay bills")).toBeInTheDocument();
    expect(screen.getByText("Read docs")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `http://localhost:3000/todos/${active.id}`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ completed: true }),
      }),
    );

    await user.click(screen.getByRole("button", { name: "active" }));
    expect(screen.getByText("No todos in this view.")).toBeInTheDocument();
  });

  it("edits and deletes todos", async () => {
    const user = userEvent.setup();
    const first = todo();
    const second = todo({
      id: "aa5f1f1f1f1f1f1f1f1f1f1f",
      title: "Clean desk",
      description: null,
    });
    const updated = {
      ...first,
      title: "Buy coffee",
      description: "Whole bean",
      updatedAt: "2026-05-18T13:00:00.000Z",
    };

    fetchMock
      .mockResolvedValueOnce(jsonResponse(page([first, second])))
      .mockResolvedValueOnce(jsonResponse(updated))
      .mockResolvedValueOnce(emptyResponse())
      .mockResolvedValueOnce(jsonResponse(page([updated])));

    render(<App />);

    await screen.findByText("Buy milk");
    const firstCard = screen.getByText("Buy milk").closest("article");
    expect(firstCard).not.toBeNull();

    await user.click(within(firstCard as HTMLElement).getByRole("button", { name: "Edit" }));
    const titleInput = within(firstCard as HTMLElement).getByDisplayValue("Buy milk");
    const descriptionInput = within(firstCard as HTMLElement).getByDisplayValue("Two bottles");

    await user.clear(titleInput);
    await user.type(titleInput, "Buy coffee");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Whole bean");
    await user.click(within(firstCard as HTMLElement).getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Buy coffee")).toBeInTheDocument();
    expect(screen.getByText("Whole bean")).toBeInTheDocument();

    const secondCard = screen.getByText("Clean desk").closest("article");
    expect(secondCard).not.toBeNull();
    await user.click(within(secondCard as HTMLElement).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(screen.queryByText("Clean desk")).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "http://localhost:3000/todos?page=1&limit=10",
      expect.any(Object),
    );
  });
});
