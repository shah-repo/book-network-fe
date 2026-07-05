import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../api/api";
import { useAuth } from "../../../contextApi/ContextApi";
import Home from "../../Home";

const mockNavigate = jest.fn();
const mockRemoveToken = jest.fn();

const mockLocation = {
  pathname: "/",
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

describe("Home integration flow", () => {
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

  it("fetches books on mount and renders homepage list", async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        content: [
          {
            id: 1,
            title: "Atomic Habits",
            authorName: "James Clear",
            isbn: "111",
            owner: "library-user",
            synopsis: "Build better habits.",
            cover: "test-cover-1",
            rate: 5,
            archived: false,
            shareable: true,
          },
          {
            id: 2,
            title: "Deep Work",
            authorName: "Cal Newport",
            isbn: "222",
            owner: "library-user",
            synopsis: "Focus without distraction.",
            cover: "test-cover-2",
            rate: 4,
            archived: false,
            shareable: true,
          },
        ],
      },
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Home />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/v1/books", {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer fake-token",
        },
      });
    });

    expect(await screen.findByText(/books list/i)).toBeInTheDocument();
    expect(await screen.findByText(/atomic habits/i)).toBeInTheDocument();
    expect(await screen.findByText(/deep work/i)).toBeInTheDocument();
  });

  it("renders the page shell even when the API returns an empty list", async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: { content: [] },
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Home />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText(/books list/i)).toBeInTheDocument();
    expect(screen.queryByText(/atomic habits/i)).not.toBeInTheDocument();
  });

  it("shows toast error when fetch fails", async () => {
    (api.get as jest.Mock).mockRejectedValue({
      status: 500,
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Home />
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
      response: { status: 403 },
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Home />
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