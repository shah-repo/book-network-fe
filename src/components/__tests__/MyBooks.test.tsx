import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "react-toastify";
import api from "../../api/api";
import { useAuth } from "../../contextApi/ContextApi";
import { MyBooks } from "../MyBooks";

const mockNavigate = jest.fn();
const mockRemoveToken = jest.fn();

const mockLocation = {
    pathname: "/my-books",
    search: "",
    hash: "",
    state: null,
    key: "default",
};

const mockManageBookDialog = jest.fn();
const mockBookCard = jest.fn();

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

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
}));

jest.mock("../SectionHeading", () => ({
    __esModule: true,
    default: ({ title, onClick }: { title: string; onClick?: () => void }) => (
        <div>
            <h2>{title}</h2>
            <button onClick={onClick}>Add Book</button>
        </div>
    ),
}));

jest.mock("../BookCard", () => ({
    __esModule: true,
    default: (props: any) => {
        mockBookCard(props);
        return (
            <div data-testid="book-card">
                <span>{props.book.title}</span>
                <button onClick={() => props.editBook(props.book.id)}>
                    Edit {props.book.id}
                </button>
            </div>
        );
    },
}));

jest.mock("../ManageBookDialog", () => ({
    __esModule: true,
    default: (props: any) => {
        mockManageBookDialog(props);
        return props.isDialogOpen ? (
            <div data-testid="manage-book-dialog">
                <div>Dialog Open</div>
                <button onClick={props.handleClose}>Close Dialog</button>
            </div>
        ) : null;
    },
}));

jest.mock("../ManageBookForm", () => ({
    __esModule: true,
    default: () => <div data-testid="manage-book-form">ManageBookForm</div>,
}));

describe("MyBooks component", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (useAuth as jest.Mock).mockReturnValue({
            token: "fake-token",
            removeToken: mockRemoveToken,
        });
    });

    it("fetches and renders my books on mount", async () => {
        (api.get as jest.Mock).mockResolvedValue({
            data: {
                content: [
                    {
                        id: 1,
                        title: "Atomic Habits",
                        authorName: "James Clear",
                        isbn: "111",
                        owner: "me",
                        synopsis: "Good",
                        cover: "cover-1",
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
                        cover: "cover-2",
                        rate: 4,
                        archived: false,
                        shareable: true,
                    },
                ],
            },
        });

        render(<MyBooks />);

        expect(screen.getByRole("heading", { name: /my books list/i })).toBeInTheDocument();

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith("/api/v1/books/owner", {
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

    it("opens add book dialog when add button is clicked", async () => {
        (api.get as jest.Mock).mockResolvedValue({
            data: { content: [] },
        });

        render(<MyBooks />);

        await waitFor(() => {
            expect(api.get).toHaveBeenCalled();
        });

        fireEvent.click(screen.getByRole("button", { name: /add book/i }));

        expect(screen.getByTestId("manage-book-dialog")).toBeInTheDocument();
        const addDialogProps = mockManageBookDialog.mock.calls
            .map((call) => call[0])
            .filter((props) => props.title === "Add New Book")
            .pop();

        expect(addDialogProps.isDialogOpen).toBe(true);
        expect(addDialogProps.data).toBeUndefined();
    });

    it("opens dialog with selected book data when edit is clicked", async () => {
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
                        cover: "cover-7",
                        rate: 5,
                        archived: false,
                        shareable: true,
                    },
                ],
            },
        });

        render(<MyBooks />);

        expect(await screen.findByText("Clean Code")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /edit 7/i }));

        expect(screen.getByTestId("manage-book-dialog")).toBeInTheDocument();
        const addDialogProps = mockManageBookDialog.mock.calls
            .map((call) => call[0])
            .filter((props) => props.title === "Add New Book")
            .pop();
        expect(addDialogProps.isDialogOpen).toBe(true);
        expect(addDialogProps.data).toMatchObject({
            id: 7,
            title: "Clean Code",
        });
    });

    it("shows toast error when fetch fails", async () => {
        (api.get as jest.Mock).mockRejectedValue({
            status: 500,
        });

        render(<MyBooks />);

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

        render(<MyBooks />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("error");
            expect(mockRemoveToken).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith("/login", {
                state: { from: mockLocation },
                replace: true,
            });
        });
    });

    it("closes dialog and refetches books", async () => {
        (api.get as jest.Mock).mockResolvedValue({
            data: { content: [] },
        });

        render(<MyBooks />);

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledTimes(1);
        });

        fireEvent.click(screen.getByRole("button", { name: /add book/i }));
        fireEvent.click(screen.getByRole("button", { name: /close dialog/i }));

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledTimes(2);
        });
    });
});