import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BorrowedBooks } from "../BorrowedBooks";
import api from "../../api/api";
import { useAuth } from "../../contextApi/ContextApi";
import { toast } from "react-toastify";

const mockNavigate = jest.fn();
const mockRemoveToken = jest.fn();

const mockLocation = {
    pathname: "/borrowed-books",
    search: "",
    hash: "",
    state: null,
    key: "default",
};

const mockManageBookDialog = jest.fn();
const mockBasicTable = jest.fn();

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
    default: ({ title }: { title: string }) => <h2>{title}</h2>,
}));

jest.mock("../Table", () => ({
    __esModule: true,
    default: (props: any) => {
        mockBasicTable(props);

        return (
            <div data-testid="basic-table">
                <div>Rows: {props.data?.length ?? 0}</div>
                {props.data?.map((book: any) => (
                    <button
                        key={book.id}
                        onClick={() => props.returnBook(book)}
                    >
                        Return {book.title}
                    </button>
                ))}
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
                <div>{props.title}</div>
                <button onClick={props.handleClose}>Close Dialog</button>
            </div>
        ) : null;
    },
}));

jest.mock("../ReturnBorrowedBook", () => ({
    __esModule: true,
    default: () => <div data-testid="return-borrowed-book">ReturnBorrowedBook</div>,
}));

jest.mock("@fortawesome/react-fontawesome", () => ({
    FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

describe("BorrowedBooks component", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (useAuth as jest.Mock).mockReturnValue({
            token: "fake-token",
            removeToken: mockRemoveToken,
        });
    });

    it("fetches borrowed books on mount and passes them to the table", async () => {
  (api.get as jest.Mock).mockResolvedValue({
    data: {
      content: [
        {
          id: 1,
          title: "Atomic Habits",
          authorName: "James Clear",
          isbn: "111",
          owner: "owner-1",
          synopsis: "Good",
          cover: "cover-1",
          rate: 5,
          archived: false,
          shareable: true,
          borrowed: true,
        },
        {
          id: 2,
          title: "Deep Work",
          authorName: "Cal Newport",
          isbn: "222",
          owner: "owner-2",
          synopsis: "Focus",
          cover: "cover-2",
          rate: 4,
          archived: false,
          shareable: true,
          borrowed: true,
        },
      ],
    },
  });

  render(<BorrowedBooks />);

  expect(
    screen.getByRole("heading", { name: /my borrowed books/i })
  ).toBeInTheDocument();

  await waitFor(() => {
    expect(api.get).toHaveBeenCalledWith("/api/v1/books/borrowed", {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer fake-token",
      },
    });
  });

  await waitFor(() => {
    const latestTableProps =
      mockBasicTable.mock.calls[mockBasicTable.mock.calls.length - 1][0];

    expect(latestTableProps.data).toHaveLength(2);
    expect(latestTableProps.data[0].title).toBe("Atomic Habits");
    expect(latestTableProps.data[1].title).toBe("Deep Work");
  });
});

    it("opens the dialog with selected book data when returnBook is triggered", async () => {
        (api.get as jest.Mock).mockResolvedValue({
            data: {
                content: [
                    {
                        id: 10,
                        title: "Clean Code",
                        authorName: "Robert C. Martin",
                        isbn: "1010",
                        owner: "owner-10",
                        synopsis: "Code quality",
                        cover: "cover-10",
                        rate: 5,
                        archived: false,
                        shareable: true,
                        borrowed: true,
                    },
                ],
            },
        });

        render(<BorrowedBooks />);

        expect(await screen.findByRole("button", { name: /return clean code/i })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /return clean code/i }));

        expect(screen.getByTestId("manage-book-dialog")).toBeInTheDocument();
        expect(screen.getByText(/return and share feedback/i)).toBeInTheDocument();

        const latestDialogProps =
            mockManageBookDialog.mock.calls[mockManageBookDialog.mock.calls.length - 1][0];

        expect(latestDialogProps.isDialogOpen).toBe(true);
        expect(latestDialogProps.data).toMatchObject({
            id: 10,
            title: "Clean Code",
        });
    });

    it("closes the dialog and refetches borrowed books", async () => {
        (api.get as jest.Mock).mockResolvedValue({
            data: {
                content: [
                    {
                        id: 99,
                        title: "Refetch Book",
                        authorName: "Author",
                        isbn: "999",
                        owner: "owner-99",
                        synopsis: "Synopsis",
                        cover: "cover-99",
                        rate: 3,
                        archived: false,
                        shareable: true,
                        borrowed: true,
                    },
                ],
            },
        });

        render(<BorrowedBooks />);

        const returnButton = await screen.findByRole("button", {
            name: /return refetch book/i,
        });

        fireEvent.click(returnButton);

        expect(await screen.findByTestId("manage-book-dialog")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /close dialog/i }));

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledTimes(2);
        });
    });

    it("shows toast error when fetch fails", async () => {
        (api.get as jest.Mock).mockRejectedValue({
            status: 500,
        });

        render(<BorrowedBooks />);

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

        render(<BorrowedBooks />);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith("error");
            expect(mockRemoveToken).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith("/login", {
                state: { from: mockLocation },
                replace: true,
            });
        });
    });
});