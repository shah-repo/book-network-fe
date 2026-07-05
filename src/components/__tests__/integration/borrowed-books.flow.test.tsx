import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../api/api";
import { useAuth } from "../../../contextApi/ContextApi";
import { BorrowedBooks } from "../../BorrowedBooks";

const mockNavigate = jest.fn();
const mockRemoveToken = jest.fn();

const mockLocation = {
  pathname: "/borrowed-books",
  search: "",
  hash: "",
  state: null,
  key: "default",
};

jest.mock("../../../api/api", () => {
  const mockApiGet = jest.fn();
  const mockApiPost = jest.fn();
  const mockApiPatch = jest.fn();
  const mockInterceptorUse = jest.fn(() => 1);
  const mockInterceptorEject = jest.fn();

  return {
    __esModule: true,
    default: {
      get: mockApiGet,
      post: mockApiPost,
      patch: mockApiPatch,
    },
    axiosPrivate: {
      post: mockApiPost,
      patch: mockApiPatch,
      interceptors: {
        request: {
          use: mockInterceptorUse,
          eject: mockInterceptorEject,
        },
        response: {
          use: jest.fn(),
          eject: jest.fn(),
        },
      },
    },
  };
});

jest.mock("../../../contextApi/ContextApi", () => ({
  useAuth: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

describe("BorrowedBooks integration flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      token: "fake-token",
      removeToken: mockRemoveToken,
    });
  });

  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it("fetches borrowed books on mount and renders the table content", async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        content: [
          {
            id: 11,
            title: "Clean Code",
            authorName: "Robert C. Martin",
            isbn: "111",
            owner: "library-user",
            synopsis: "Code quality",
            cover: "test-cover-11",
            rate: 5,
            archived: false,
            shareable: true,
            borrowed: true,
          },
          {
            id: 12,
            title: "Deep Work",
            authorName: "Cal Newport",
            isbn: "222",
            owner: "library-user",
            synopsis: "Focus deeply",
            cover: "test-cover-12",
            rate: 4,
            archived: false,
            shareable: true,
            borrowed: true,
          },
        ],
      },
    });

    render(
      <MemoryRouter initialEntries={["/borrowed-books"]}>
        <BorrowedBooks />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/v1/books/borrowed", {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer fake-token",
        },
      });
    });

    expect(await screen.findByText(/my borrowed books/i)).toBeInTheDocument();
    expect(await screen.findByText(/clean code/i)).toBeInTheDocument();
    expect(await screen.findByText(/deep work/i)).toBeInTheDocument();
  });

  it("opens the return dialog from rendered borrowed books table", async () => {
    const user = userEvent.setup();

    (api.get as jest.Mock).mockResolvedValue({
      data: {
        content: [
          {
            id: 21,
            title: "Atomic Habits",
            authorName: "James Clear",
            isbn: "333",
            owner: "library-user",
            synopsis: "Habits",
            cover: "test-cover-21",
            rate: 5,
            archived: false,
            shareable: true,
            borrowed: true,
          },
        ],
      },
    });

    render(
      <MemoryRouter initialEntries={["/borrowed-books"]}>
        <BorrowedBooks />
      </MemoryRouter>
    );

    expect(await screen.findByText(/atomic habits/i)).toBeInTheDocument();

    const table = screen.getByRole("table");
    const row = within(table).getByText(/atomic habits/i).closest("tr");

    expect(row).not.toBeNull();

    const buttons = within(row as HTMLElement).getAllByRole("button");
    await user.click(buttons[0]);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText(/return and share feedback/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /rate & return/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /just return/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("closes the real dialog and refetches borrowed books", async () => {
    const user = userEvent.setup();

    (api.get as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          content: [
            {
              id: 31,
              title: "The Pragmatic Programmer",
              authorName: "Andrew Hunt",
              isbn: "444",
              owner: "library-user",
              synopsis: "Pragmatic development",
              cover: "test-cover-31",
              rate: 5,
              archived: false,
              shareable: true,
              borrowed: true,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          content: [
            {
              id: 31,
              title: "The Pragmatic Programmer",
              authorName: "Andrew Hunt",
              isbn: "444",
              owner: "library-user",
              synopsis: "Pragmatic development",
              cover: "test-cover-31",
              rate: 5,
              archived: false,
              shareable: true,
              borrowed: true,
            },
          ],
        },
      });

    render(
      <MemoryRouter initialEntries={["/borrowed-books"]}>
        <BorrowedBooks />
      </MemoryRouter>
    );

    expect(
      await screen.findByText(/the pragmatic programmer/i)
    ).toBeInTheDocument();

    const table = screen.getByRole("table");
    const row = within(table).getByText(/the pragmatic programmer/i).closest("tr");

    expect(row).not.toBeNull();

    const buttons = within(row as HTMLElement).getAllByRole("button");
    await user.click(buttons[0]);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  it("shows toast error when borrowed books fetch fails", async () => {
    (api.get as jest.Mock).mockRejectedValue({
      status: 500,
    });

    render(
      <MemoryRouter initialEntries={["/borrowed-books"]}>
        <BorrowedBooks />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("error");
    });

    expect(mockRemoveToken).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("removes token and redirects to login on borrowed books 403", async () => {
    (api.get as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: { status: 403 },
    });

    render(
      <MemoryRouter initialEntries={["/borrowed-books"]}>
        <BorrowedBooks />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("error");
      expect(mockRemoveToken).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/login", {
        state: { from: mockLocation },
        replace: true,
      });
    });
  });
});