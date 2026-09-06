import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import api from "../../api/api";
import { useAuth } from "../../contextApi/ContextApi";
import { MyBooks } from "../MyBooks";

const mockNavigate = jest.fn();
const mockRemoveToken = jest.fn();
const mockLocation = { pathname: "/my-books", search: "", hash: "", state: null, key: "default" };

jest.mock("../../api/api", () => {
  const mockGet = jest.fn();
  const mockPost = jest.fn();
  const mockPatch = jest.fn();
  return {
    __esModule: true,
    default: {
      get: mockGet,
      post: mockPost,
      patch: mockPatch,
    },
    axiosPrivate: {
      post: mockPost,
      patch: mockPatch,
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    },
  };
});

jest.mock("../../contextApi/ContextApi", () => ({
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

const createExcelFile = (
  rows: unknown[][],
  fileName = "books.xlsx"
): File => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new File([buffer], fileName, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

describe("Bulk Book Upload feature", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      token: "fake-token",
      removeToken: mockRemoveToken,
    });
    (api.get as jest.Mock).mockResolvedValue({
      data: { content: [] },
    });
  });

  it("renders 'Add New Books In Bulk' button next to 'Add New Book' and opens the dialog", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/my-books"]}>
        <MyBooks />
      </MemoryRouter>
    );

    const bulkBtn = await screen.findByRole("button", {
      name: /add new books in bulk/i,
    });
    expect(bulkBtn).toBeInTheDocument();

    const addBtn = screen.getByRole("button", {
      name: /^add new book$/i,
    });
    expect(addBtn).toBeInTheDocument();

    await user.click(bulkBtn);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/add books in bulk/i)).toBeInTheDocument();
  });

  it("shows error when Save is clicked with no file selected", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/my-books"]}>
        <MyBooks />
      </MemoryRouter>
    );

    await user.click(
      await screen.findByRole("button", { name: /add new books in bulk/i })
    );

    const dialog = await screen.findByRole("dialog");
    const saveBtn = within(dialog).getByRole("button", { name: /save/i });
    await user.click(saveBtn);

    expect(
      within(dialog).getByText("Please select an Excel (.xlsx) file to upload.")
    ).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(
      "Please select an Excel (.xlsx) file to upload."
    );
  });

  it("shows error when a non-.xlsx file is selected", async () => {
    render(
      <MemoryRouter initialEntries={["/my-books"]}>
        <MyBooks />
      </MemoryRouter>
    );

    fireEvent.click(
      await screen.findByRole("button", { name: /add new books in bulk/i })
    );

    const input = screen.getByTestId("bulk-excel-input");
    const invalidFile = new File(["dummy content"], "books.csv", {
      type: "text/csv",
    });

    fireEvent.change(input, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(
        screen.getByText("Only .xlsx Excel files are supported.")
      ).toBeInTheDocument();
    });
    expect(toast.error).toHaveBeenCalledWith(
      "Only .xlsx Excel files are supported."
    );
  });

  it("shows error when required columns are missing", async () => {
    render(
      <MemoryRouter initialEntries={["/my-books"]}>
        <MyBooks />
      </MemoryRouter>
    );

    fireEvent.click(
      await screen.findByRole("button", { name: /add new books in bulk/i })
    );

    const file = createExcelFile([
      ["title", "authorName", "isbn"],
      ["Book 1", "Author 1", "123"],
    ]);

    const input = screen.getByTestId("bulk-excel-input");
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText(
          "The uploaded file is missing one or more required columns."
        )
      ).toBeInTheDocument();
    });
    expect(toast.error).toHaveBeenCalledWith(
      "The uploaded file is missing one or more required columns."
    );
  });

  it("shows error when the Excel file contains no books", async () => {
    render(
      <MemoryRouter initialEntries={["/my-books"]}>
        <MyBooks />
      </MemoryRouter>
    );

    fireEvent.click(
      await screen.findByRole("button", { name: /add new books in bulk/i })
    );

    const file = createExcelFile([
      ["title", "authorName", "isbn", "synopsis", "shareable", "previewBookUrl"],
    ]);

    const input = screen.getByTestId("bulk-excel-input");
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText("The uploaded Excel file contains no books to import.")
      ).toBeInTheDocument();
    });
    expect(toast.error).toHaveBeenCalledWith(
      "The uploaded Excel file contains no books to import."
    );
  });

  it("shows error when a row contains invalid or incomplete data", async () => {
    render(
      <MemoryRouter initialEntries={["/my-books"]}>
        <MyBooks />
      </MemoryRouter>
    );

    fireEvent.click(
      await screen.findByRole("button", { name: /add new books in bulk/i })
    );

    const file = createExcelFile([
      ["title", "authorName", "isbn", "synopsis", "shareable", "previewBookUrl"],
      ["Book 1", "", "123", "Some synopsis", true, "https://example.com/img.png"],
    ]);

    const input = screen.getByTestId("bulk-excel-input");
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText(
          "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again."
        )
      ).toBeInTheDocument();
    });
    expect(toast.error).toHaveBeenCalledWith(
      "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again."
    );
  });

  it("shows error when prohibited columns are present in the Excel file", async () => {
    render(
      <MemoryRouter initialEntries={["/my-books"]}>
        <MyBooks />
      </MemoryRouter>
    );

    fireEvent.click(
      await screen.findByRole("button", { name: /add new books in bulk/i })
    );

    const file = createExcelFile([
      [
        "title",
        "authorName",
        "isbn",
        "synopsis",
        "shareable",
        "previewBookUrl",
        "id",
      ],
      [
        "Book 1",
        "Author 1",
        "123",
        "Some synopsis",
        true,
        "https://example.com/img.png",
        10,
      ],
    ]);

    const input = screen.getByTestId("bulk-excel-input");
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText(
          "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again."
        )
      ).toBeInTheDocument();
    });
  });

  it("renders live preview with 'Preview' heading, 'Select All' checkbox, and BookCards in responsive grid", async () => {
    render(
      <MemoryRouter initialEntries={["/my-books"]}>
        <MyBooks />
      </MemoryRouter>
    );

    fireEvent.click(
      await screen.findByRole("button", { name: /add new books in bulk/i })
    );

    const validFile = createExcelFile([
      ["title", "authorName", "isbn", "synopsis", "shareable", "previewBookUrl"],
      [
        "Refactoring",
        "Martin Fowler",
        "111222333",
        "Improving code design",
        true,
        "https://example.com/refactoring.jpg",
      ],
      [
        "Design Patterns",
        "Gang of Four",
        "444555666",
        "Reusable elements",
        false,
        "https://example.com/patterns.jpg",
      ],
    ]);

    const input = screen.getByTestId("bulk-excel-input");
    fireEvent.change(input, { target: { files: [validFile] } });

    expect(await screen.findByText("Preview")).toBeInTheDocument();

    const selectAllCheckbox = screen.getByRole("checkbox", {
      name: /select all/i,
    });
    expect(selectAllCheckbox).toBeInTheDocument();
    expect(selectAllCheckbox).toBeChecked();

    expect(screen.getByText("Refactoring")).toBeInTheDocument();
    expect(screen.getByText("Design Patterns")).toBeInTheDocument();

    const refactoringCheckbox = screen.getByRole("checkbox", {
      name: /select refactoring/i,
    });
    const patternsCheckbox = screen.getByRole("checkbox", {
      name: /select design patterns/i,
    });
    expect(refactoringCheckbox).toBeChecked();
    expect(patternsCheckbox).toBeChecked();

    const covers = screen.getAllByRole("img", {
      name: /book cover/i,
    });
    expect(covers[0]).toHaveAttribute(
      "src",
      "https://example.com/refactoring.jpg"
    );
    expect(covers[1]).toHaveAttribute(
      "src",
      "https://example.com/patterns.jpg"
    );
  });

  it("handles Select All and individual book selections correctly", async () => {
    render(
      <MemoryRouter initialEntries={["/my-books"]}>
        <MyBooks />
      </MemoryRouter>
    );

    fireEvent.click(
      await screen.findByRole("button", { name: /add new books in bulk/i })
    );

    const validFile = createExcelFile([
      ["title", "authorName", "isbn", "synopsis", "shareable", "previewBookUrl"],
      ["Book A", "Author A", "111", "Syn A", true, "https://example.com/a.jpg"],
      ["Book B", "Author B", "222", "Syn B", false, "https://example.com/b.jpg"],
    ]);

    fireEvent.change(screen.getByTestId("bulk-excel-input"), {
      target: { files: [validFile] },
    });

    expect(await screen.findByText("Preview")).toBeInTheDocument();

    const selectAll = screen.getByRole("checkbox", { name: /select all/i });
    const checkA = screen.getByRole("checkbox", { name: /select book a/i });
    const checkB = screen.getByRole("checkbox", { name: /select book b/i });

    expect(selectAll).toBeChecked();
    expect(checkA).toBeChecked();
    expect(checkB).toBeChecked();

    // Deselect Book A
    fireEvent.click(checkA);
    expect(checkA).not.toBeChecked();
    expect(checkB).toBeChecked();
    expect(selectAll).not.toBeChecked();

    // Re-select Book A
    fireEvent.click(checkA);
    expect(checkA).toBeChecked();
    expect(selectAll).toBeChecked();

    // Deselect All via Select All
    fireEvent.click(selectAll);
    expect(selectAll).not.toBeChecked();
    expect(checkA).not.toBeChecked();
    expect(checkB).not.toBeChecked();

    // Select All again
    fireEvent.click(selectAll);
    expect(selectAll).toBeChecked();
    expect(checkA).toBeChecked();
    expect(checkB).toBeChecked();
  });

  it("submits only selected books and calls single-book creation API without previewBookUrl or cover", async () => {
    (api.post as jest.Mock).mockResolvedValue({ data: 101 });

    render(
      <MemoryRouter initialEntries={["/my-books"]}>
        <MyBooks />
      </MemoryRouter>
    );

    fireEvent.click(
      await screen.findByRole("button", { name: /add new books in bulk/i })
    );

    const validFile = createExcelFile([
      ["title", "authorName", "isbn", "synopsis", "shareable", "previewBookUrl"],
      ["Book A", "Author A", "111", "Syn A", true, "https://example.com/a.jpg"],
      ["Book B", "Author B", "222", "Syn B", false, "https://example.com/b.jpg"],
    ]);

    fireEvent.change(screen.getByTestId("bulk-excel-input"), {
      target: { files: [validFile] },
    });

    expect(await screen.findByText("Preview")).toBeInTheDocument();

    // Deselect Book B
    const checkB = screen.getByRole("checkbox", { name: /select book b/i });
    fireEvent.click(checkB);

    // Click Save
    const dialog = screen.getByRole("dialog");
    const saveBtn = within(dialog).getByRole("button", { name: /save/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(1);
    });

    // Book A only
    expect(api.post).toHaveBeenCalledWith(
      "/api/v1/books",
      {
        title: "Book A",
        authorName: "Author A",
        isbn: "111",
        synopsis: "Syn A",
        shareable: true,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer fake-token",
        },
      }
    );

    // Verify previewBookUrl and cover are never sent
    const callPayload = (api.post as jest.Mock).mock.calls[0][1];
    expect(callPayload).not.toHaveProperty("previewBookUrl");
    expect(callPayload).not.toHaveProperty("cover");
    expect(callPayload).not.toHaveProperty("id");
    expect(callPayload).not.toHaveProperty("owner");

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Books Saved Successfully!");
    });
  });
});