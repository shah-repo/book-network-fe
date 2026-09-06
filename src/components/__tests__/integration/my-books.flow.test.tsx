// import React from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../api/api";
import { MyBooks } from "../../../components/MyBooks";
import { useAuth } from "../../../contextApi/ContextApi";

const mockNavigate = jest.fn();
const mockRemoveToken = jest.fn();

const mockLocation = {
  pathname: "/my-books",
  search: "",
  hash: "",
  state: null,
  key: "default",
};



jest.mock("../../../api/api", () => {
const mockApiGet = jest.fn();
const mockAxiosPrivatePost = jest.fn();
const mockAxiosPrivatePatch = jest.fn();
const mockInterceptorUse = jest.fn(() => 1);
const mockInterceptorEject = jest.fn();

  return {
  __esModule: true,
  default: {
    get: mockApiGet,
  },
  axiosPrivate: {
    post: mockAxiosPrivatePost,
    patch: mockAxiosPrivatePatch,
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
}});

jest.mock("../../../contextApi/ContextApi", () => ({
  useAuth: jest.fn(),
}));

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
  },
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

describe("MyBooks integration flow", () => {
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

  it("fetches books on mount and renders the list", async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        content: [
          {
            id: 1,
            title: "Atomic Habits",
            authorName: "James Clear",
            isbn: "111",
            owner: "me",
            synopsis: "Habits",
            cover: "data:image/png;base64,test-cover-1",
            rate: 5,
            archived: false,
            shareable: true,
          },
          {
            id: 2,
            title: "Deep Work",
            authorName: "Cal Newport",
            isbn: "222",
            owner: "me",
            synopsis: "Focus",
            cover: "data:image/png;base64,test-cover-2",
            rate: 4,
            archived: false,
            shareable: true,
          },
        ],
      },
    });

    render(
      <MemoryRouter initialEntries={["/my-books"]}>
        <MyBooks />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/v1/books/owner", {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer fake-token",
        },
      });
    });

    expect(await screen.findByText(/my books list/i)).toBeInTheDocument();
    expect(await screen.findByText(/atomic habits/i)).toBeInTheDocument();
    expect(await screen.findByText(/deep work/i)).toBeInTheDocument();
  });

  it("opens the add-book dialog from the page action", async () => {
    const user = userEvent.setup();

    (api.get as jest.Mock).mockResolvedValue({
      data: { content: [] },
    });

    render(
      <MemoryRouter initialEntries={["/my-books"]}>
        <MyBooks />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole("button", { name: "Add New Book" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/add new book/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("opens the bulk upload dialog from the page action", async () => {
    const user = userEvent.setup();

    (api.get as jest.Mock).mockResolvedValue({
      data: { content: [] },
    });

    render(
      <MemoryRouter initialEntries={["/my-books"]}>
        <MyBooks />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByRole("button", { name: "Add New Books In Bulk" })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Add New Books In Bulk" })
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/add books in bulk/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
  });

  it("opens the edit flow from a rendered book card", async () => {
    const user = userEvent.setup();

    (api.get as jest.Mock).mockResolvedValue({
      data: {
        content: [
          {
            id: 7,
            title: "Clean Code",
            authorName: "Robert C. Martin",
            isbn: "777",
            owner: "me",
            synopsis: "Code quality",
            cover: "data:image/png;base64,test-cover-7",
            rate: 5,
            archived: false,
            shareable: true,
          },
        ],
      },
    });

    render(
      <MemoryRouter initialEntries={["/my-books"]}>
        <MyBooks />
      </MemoryRouter>
    );

    expect(await screen.findByText(/clean code/i)).toBeInTheDocument();

    const card = screen.getByTestId("book-card-7");
    const editButtons = within(card).getAllByRole("button", { name: /edit book Clean Code/i });
    const editButton = editButtons[0];
    await user.click(editButton);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/add new book/i)).toBeInTheDocument();
  });

  it("closes the real dialog and refetches books", async () => {
    const user = userEvent.setup();

    (api.get as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          content: [
            {
              id: 1,
              title: "Atomic Habits",
              authorName: "James Clear",
              isbn: "111",
              owner: "me",
              synopsis: "Habits",
              cover: "data:image/png;base64,test-cover-1",
              rate: 5,
              archived: false,
              shareable: true,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          content: [
            {
              id: 1,
              title: "Atomic Habits",
              authorName: "James Clear",
              isbn: "111",
              owner: "me",
              synopsis: "Habits",
              cover: "data:image/png;base64,test-cover-1",
              rate: 5,
              archived: false,
              shareable: true,
            },
          ],
        },
      });

    render(
      <MemoryRouter initialEntries={["/my-books"]}>
        <MyBooks />
      </MemoryRouter>
    );

    expect(await screen.findByText(/atomic habits/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add New Book" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  it("shows toast error when fetch fails", async () => {
    (api.get as jest.Mock).mockRejectedValue({
      status: 500,
    });

    render(
      <MemoryRouter initialEntries={["/my-books"]}>
        <MyBooks />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("error");
    });

    expect(mockRemoveToken).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("removes token and redirects to login on 403", async () => {
    (api.get as jest.Mock).mockRejectedValue({
        isAxiosError: true,
        response: { status: 403, }
    });

    render(
      <MemoryRouter initialEntries={["/my-books"]}>
        <MyBooks />
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