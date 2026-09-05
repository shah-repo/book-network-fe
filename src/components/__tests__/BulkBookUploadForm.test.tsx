import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import api from "../../api/api";
import BulkBookUploadForm from "../BulkBookUploadForm";
import { BookType } from "../MyBooks";

const mockNavigate = jest.fn();
const mockRemoveToken = jest.fn();
const mockCloseDialog = jest.fn();

jest.mock("../../api/api", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
  axiosPrivate: {
    post: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(() => 1),
        eject: jest.fn(),
      },
      response: {
        use: jest.fn(),
        eject: jest.fn(),
      },
    },
  },
}));

jest.mock("../../contextApi/ContextApi", () => ({
  useAuth: () => ({
    token: "fake-token",
    removeToken: mockRemoveToken,
  }),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/my-books" }),
}));

jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const createExcelFile = (data: unknown[][], fileName = "books.xlsx") => {
  const worksheet = xlsx.utils.aoa_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const buffer = xlsx.write(workbook, { type: "array", bookType: "xlsx" });
  return new File([buffer], fileName, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

describe("BulkBookUploadForm component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders upload area initially without preview or errors", () => {
    render(
      <BulkBookUploadForm
        data={{} as BookType}
        closeDialog={mockCloseDialog}
      />
    );

    expect(screen.getByTestId("bulk-excel-input")).toBeInTheDocument();
    expect(screen.getByText("No file chosen")).toBeInTheDocument();
    expect(screen.queryByText("Preview")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("displays error message when submitted with no file selected", async () => {
    const ref = React.createRef<{ submitForm: () => void }>();
    render(
      <BulkBookUploadForm
        ref={ref}
        data={{} as BookType}
        closeDialog={mockCloseDialog}
      />
    );

    await act(async () => {
      ref.current!.submitForm();
    });

    expect(
      await screen.findByText("Please select an Excel (.xlsx) file to upload.")
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("displays error message for invalid file type", async () => {
    render(
      <BulkBookUploadForm
        data={{} as BookType}
        closeDialog={mockCloseDialog}
      />
    );

    const txtFile = new File(["test"], "test.txt", { type: "text/plain" });
    const input = screen.getByTestId("bulk-excel-input");
    fireEvent.change(input, { target: { files: [txtFile] } });

    expect(
      await screen.findByText("Only .xlsx Excel files are supported.")
    ).toBeInTheDocument();
  });

  it("displays error message for missing required columns", async () => {
    render(
      <BulkBookUploadForm
        data={{} as BookType}
        closeDialog={mockCloseDialog}
      />
    );

    const file = createExcelFile([
      ["title", "authorName", "isbn"],
      ["Book 1", "Author 1", "111"],
    ]);
    const input = screen.getByTestId("bulk-excel-input");
    fireEvent.change(input, { target: { files: [file] } });

    expect(
      await screen.findByText(
        "The uploaded file is missing one or more required columns."
      )
    ).toBeInTheDocument();
  });

  it("displays error message for empty Excel file", async () => {
    render(
      <BulkBookUploadForm
        data={{} as BookType}
        closeDialog={mockCloseDialog}
      />
    );

    const file = createExcelFile([
      ["title", "authorName", "isbn", "synopsis", "shareable", "previewBookUrl"],
    ]);
    const input = screen.getByTestId("bulk-excel-input");
    fireEvent.change(input, { target: { files: [file] } });

    expect(
      await screen.findByText(
        "The uploaded Excel file contains no books to import."
      )
    ).toBeInTheDocument();
  });

  it("displays error message for invalid or incomplete row data", async () => {
    render(
      <BulkBookUploadForm
        data={{} as BookType}
        closeDialog={mockCloseDialog}
      />
    );

    const file = createExcelFile([
      ["title", "authorName", "isbn", "synopsis", "shareable", "previewBookUrl"],
      ["", "Author 1", "111", "Synopsis", true, "http://example.com/cover.jpg"],
    ]);
    const input = screen.getByTestId("bulk-excel-input");
    fireEvent.change(input, { target: { files: [file] } });

    expect(
      await screen.findByText(
        "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again."
      )
    ).toBeInTheDocument();
  });

  it("successfully parses valid Excel file, displays preview, supports selection, and submits selected books", async () => {
    const ref = React.createRef<{ submitForm: () => void }>();
    render(
      <BulkBookUploadForm
        ref={ref}
        data={{} as BookType}
        closeDialog={mockCloseDialog}
      />
    );

    const file = createExcelFile([
      ["title", "authorName", "isbn", "synopsis", "shareable", "previewBookUrl"],
      [
        "Atomic Habits",
        "James Clear",
        "111",
        "Habits synopsis",
        true,
        "http://example.com/habits.jpg",
      ],
      [
        "Deep Work",
        "Cal Newport",
        "222",
        "Focus synopsis",
        false,
        "http://example.com/work.jpg",
      ],
    ]);

    const input = screen.getByTestId("bulk-excel-input");
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText("Preview")).toBeInTheDocument();
    expect(screen.getByText("Atomic Habits")).toBeInTheDocument();
    expect(screen.getByText("Deep Work")).toBeInTheDocument();

    const selectAll = screen.getByLabelText("Select All");
    expect(selectAll).toBeChecked();

    const habitCheckbox = screen.getByLabelText(/select atomic habits/i);
    const workCheckbox = screen.getByLabelText(/select deep work/i);
    expect(habitCheckbox).toBeChecked();
    expect(workCheckbox).toBeChecked();

    // Deselect Deep Work
    fireEvent.click(workCheckbox);
    expect(workCheckbox).not.toBeChecked();
    expect(selectAll).not.toBeChecked();

    // Submit form
    await act(async () => {
      ref.current!.submitForm();
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(1);
    });

    expect(api.post).toHaveBeenCalledWith(
      "/api/v1/books",
      {
        title: "Atomic Habits",
        authorName: "James Clear",
        isbn: "111",
        synopsis: "Habits synopsis",
        shareable: true,
      },
      expect.any(Object)
    );

    expect(mockCloseDialog).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });
});
