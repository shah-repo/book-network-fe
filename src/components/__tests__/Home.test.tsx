import { render, screen, waitFor } from "@testing-library/react";
import Home from "../Home";
import api from "../../api/api";
import { useAuth } from "../../contextApi/ContextApi";
import { toast } from "react-toastify";
// import { jest } from "@jest/globals";

const mockNavigate = jest.fn();
const mockRemoveToken = jest.fn();
const mockUseLocation = {
    pathname: "/",
    search: "",
    hash: "",
    state: null,
    key: "default",
};

jest.mock("../../api/api", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
    },
}));

jest.mock("../../contextApi/ContextApi", () => ({
    useAuth: jest.fn(),
}));

jest.mock("react-toastify", () => ({
    toast: {
        error: jest.fn(),
    },
}));

jest.mock("../Hero", () => ({
    Hero: () => <div data-testid="hero">Hero Section</div>,
}));

jest.mock("../BookCard", () => ({
    __esModule: true,
    default: ({ book }: any) => (
        <div data-testid="book-card">{book.name}</div>
    ),
}));

jest.mock("../SectionHeading", () => ({
    __esModule: true,
    default: ({ title }: { title: string }) => <h2>{title}</h2>,
}));

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation,
}));

describe("Home component", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (useAuth as jest.Mock).mockReturnValue({
            token: "fake-token",
            removeToken: mockRemoveToken,
        });
    });

    it("renders static homepage sections", async () => {
        (api.get as jest.Mock).mockResolvedValue({
            data: { content: [] },
        });

        render(<Home />);

        expect(screen.getByTestId("hero")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: /books list/i })).toBeInTheDocument();

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledTimes(1);
        });
    });

    it("fetches books on mount and renders book cards", async () => {
        (api.get as jest.Mock).mockResolvedValue({
            data: {
                content: [
                    { id: 1, name: "Atomic Habits" },
                    { id: 2, name: "Deep Work" },
                ],
            },
        });

        render(<Home />);

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith("/api/v1/books", {
                headers: {
                    Accept: "application/json",
                    Authorization: "Bearer fake-token",
                },
            });
        });

        expect(await screen.findByText("Atomic Habits")).toBeInTheDocument();
        expect(await screen.findByText("Deep Work")).toBeInTheDocument();
        expect(screen.getAllByTestId("book-card")).toHaveLength(2);
    });

    it("shows toast error when API call fails", async () => {
        (api.get as jest.Mock).mockRejectedValue({
            status: 500,
        });

        render(<Home />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("error");
        });

        expect(mockRemoveToken).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("removes token and redirects to login on 403 error", async () => {
        (api.get as jest.Mock).mockRejectedValue({
            isAxiosError: true,
            response: { status: 403, }
        });

        render(<Home />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("error");
            expect(mockRemoveToken).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith("/login", {
                state: { from: mockUseLocation },
                replace: true,
            });
        });
    });
});