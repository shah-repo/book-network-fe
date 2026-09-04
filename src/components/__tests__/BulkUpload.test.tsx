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
const mockLocation = {
  pathname: "/my-books",
  search: "",
  hash: "",
  state: null,
  key: "default",
};
jest.mock("../../api/api", () => {
  const mockApiGet = jest.fn();
  const mockApiPost = jest.fn();
  return {
    __esModule: true,
    default: {
      get: mockApiGet,
      post: mockApiPost,
    },
    axiosPrivate: {
      post: jest.fn(),
      patch: jest.fn(),
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

function createMockExcelFile(
  rows: Record<string, unknown>[],
  customHeaders?: string[],
  filename = "books.xlsx"
): File {
  const wb = XLSX.utils.book_new();
  let ws: XLSX.WorkSheet;
  if (customHeaders) {
    const data = [customHeaders, ...rows.map((r) => customHeaders.map((h) => r[h]))];
    ws = XLSX.utils.aoa_to_sheet(data);
  } else if (rows.length > 0) {
    ws = XLSX.utils.json_to_sheet(rows);
  } else {
    ws = XLSX.utils.aoa_to_sheet([["title", "authorName", "isbn", "synopsis", "shareable", "previewBookUrl"]]);
  }
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new File([buf], filename, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

describe("Bulk Book Upload Feature", () => {
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
  it("renders 'Add New Books In Bulk' button on My Books page", async () => {
    render(
      <MemoryRouter>
        <MyBooks />
      </MemoryRouter>
    );
    const bulkButton = await screen.findByRole("button", {
      name: /add new books in bulk/i,
    });
    expect(bulkButton).toBeInTheDocument();
  });
  it("opens 'Add Books In Bulk' dialog when bulk button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MyBooks />
      </MemoryRouter>
    );
    const bulkButton = await screen.findByRole("button", {
      name: /add new books in bulk/i,
    });
    await user.click(bulkButton);
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/Add Books In Bulk/i)).toBeInTheDocument();
  });
  it("displays error when submitting without selecting a file", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MyBooks />
      </MemoryRouter>
    );
    await user.click(screen.getByRole("button", { name: /add new books in bulk/i }));
    const dialog = await screen.findByRole("dialog");
    const saveButton = within(dialog).getByRole("button", { name: /save/i });
    await user.click(saveButton);
    expect(toast.error).toHaveBeenCalledWith("Please select an Excel (.xlsx) file to upload.");
    expect(screen.getByText("Please select an Excel (.xlsx) file to upload.")).toBeInTheDocument();
  });
  it("displays error when uploaded file is not .xlsx", async () => {
    render(
      <MemoryRouter>
        <MyBooks />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /add new books in bulk/i }));
    await screen.findByRole("dialog");
    const invalidFile = new File(["dummy content"], "test.txt", { type: "text/plain" });
    const fileInput = screen.getByLabelText(/upload excel file/i);
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    expect(toast.error).toHaveBeenCalledWith("Only .xlsx Excel files are supported.");
    expect(screen.getByText("Only .xlsx Excel files are supported.")).toBeInTheDocument();
  });
  it("displays error when Excel file is missing required columns", async () => {
    render(
      <MemoryRouter>
        <MyBooks />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /add new books in bulk/i }));
    await screen.findByRole("dialog");
    const invalidFile = createMockExcelFile(
      [{ title: "Book A", authorName: "Author A" }],
      ["title", "authorName"]
    );
    const fileInput = screen.getByLabelText(/upload excel file/i);
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("The uploaded file is missing one or more required columns.");
      expect(screen.getByText("The uploaded file is missing one or more required columns.")).toBeInTheDocument();
    });
  });
  it("displays error when Excel file contains invalid/incomplete row data", async () => {
    render(
      <MemoryRouter>
        <MyBooks />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /add new books in bulk/i }));
    await screen.findByRole("dialog");
    const invalidRowFile = createMockExcelFile([
      {
        title: "Book A",
        authorName: "Author A",
        isbn: "", // Empty ISBN!
        synopsis: "Synopsis A",
        shareable: true,
        previewBookUrl: "http://example.com/cover.jpg",
      },
    ]);
    const fileInput = screen.getByLabelText(/upload excel file/i);
    fireEvent.change(fileInput, { target: { files: [invalidRowFile] } });
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("One or more rows contain invalid or incomplete data. Please correct the Excel file and try again.");
      expect(screen.getByText("One or more rows contain invalid or incomplete data. Please correct the Excel file and try again.")).toBeInTheDocument();
    });
  });
  it("parses valid Excel file, renders preview cards, and handles Select All and individual selections", async () => {
    render(
      <MemoryRouter>
        <MyBooks />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /add new books in bulk/i }));
    await screen.findByRole("dialog");
    const validFile = createMockExcelFile([
      {
        title: "Bulk Book 1",
        authorName: "Author One",
        isbn: "10001",
        synopsis: "Synopsis 1",
        shareable: true,
        previewBookUrl: "http://example.com/book1.jpg",
      },
      {
        title: "Bulk Book 2",
        authorName: "Author Two",
        isbn: "10002",
        synopsis: "Synopsis 2",
        shareable: false,
        previewBookUrl: "http://example.com/book2.jpg",
      },
    ]);
    const fileInput = screen.getByLabelText(/upload excel file/i);
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    await waitFor(() => {
      expect(screen.getByText("Preview")).toBeInTheDocument();
    });
    expect(screen.getByText("Bulk Book 1")).toBeInTheDocument();
    expect(screen.getByText("Bulk Book 2")).toBeInTheDocument();
    const selectAllCheckbox = screen.getByRole("checkbox", { name: "Select All" });
    expect(selectAllCheckbox).toBeChecked();
    const book1Checkbox = screen.getByRole("checkbox", { name: "Select Bulk Book 1" });
    const book2Checkbox = screen.getByRole("checkbox", { name: "Select Bulk Book 2" });
    expect(book1Checkbox).toBeChecked();
    expect(book2Checkbox).toBeChecked();
    fireEvent.click(book2Checkbox);
    expect(book2Checkbox).not.toBeChecked();
    expect(selectAllCheckbox).not.toBeChecked();
    fireEvent.click(book2Checkbox);
    expect(book2Checkbox).toBeChecked();
    expect(selectAllCheckbox).toBeChecked();
    fireEvent.click(selectAllCheckbox);
    expect(selectAllCheckbox).not.toBeChecked();
    expect(book1Checkbox).not.toBeChecked();
    expect(book2Checkbox).not.toBeChecked();
    fireEvent.click(book1Checkbox);
    expect(book1Checkbox).toBeChecked();
    expect(selectAllCheckbox).not.toBeChecked();
    (api.post as jest.Mock).mockResolvedValue({ data: 101 });
    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith(
        "/api/v1/books",
        {
          title: "Bulk Book 1",
          authorName: "Author One",
          isbn: "10001",
          synopsis: "Synopsis 1",
          shareable: true,
        },
        expect.any(Object)
      );
    });
  });
});
