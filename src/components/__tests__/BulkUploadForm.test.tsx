import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useRef } from "react";
import { createBook } from "../../api/books";
import { useAuth } from "../../contextApi/ContextApi";
import * as excelBookParser from "../../utils/excelBookParser";
import BulkUploadForm, { BulkUploadFormProps } from "../BulkUploadForm";
import { FormRefType } from "../MyBooks";

const BulkUploadFormWithRef = BulkUploadForm as React.ComponentType<
  BulkUploadFormProps & React.RefAttributes<FormRefType>
>;

const mockNavigate = jest.fn();
const mockRemoveToken = jest.fn();

jest.mock("../../api/books", () => ({
  createBook: jest.fn(),
}));

jest.mock("../../contextApi/ContextApi", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../hooks/useAxiosPrivate", () => ({
  useAxiosPrivate: () => ({
    post: jest.fn(),
    patch: jest.fn(),
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

jest.mock("../../utils/excelBookParser", () => {
  const actual = jest.requireActual("../../utils/excelBookParser");
  return {
    ...actual,
    parseBulkBookExcel: jest.fn(),
  };
});

const { toast } = jest.requireMock("react-toastify") as {
  toast: { error: jest.Mock; success: jest.Mock };
};

const parsedRows = [
  {
    title: "Atomic Habits",
    authorName: "James Clear",
    isbn: "111",
    synopsis: "Good habits",
    shareable: true,
    previewBookUrl: "https://example.com/1.png",
  },
  {
    title: "Deep Work",
    authorName: "Cal Newport",
    isbn: "222",
    synopsis: "Focus",
    shareable: false,
    previewBookUrl: "https://example.com/2.png",
  },
];

const TestHarness: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const ref = useRef<FormRefType>({} as FormRefType);
  return (
    <div>
      <BulkUploadFormWithRef ref={ref} closeDialog={onClose ?? jest.fn()} />
      <button onClick={() => ref.current?.submitForm()}>Submit</button>
    </div>
  );
};

const uploadFile = async () => {
  const user = userEvent.setup();
  const file = new File(["dummy"], "books.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const input = document.getElementById("bulkBookFile") as HTMLInputElement;
  await user.upload(input, file);
  return user;
};

describe("BulkUploadForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      token: "fake-token",
      removeToken: mockRemoveToken,
    });
    (excelBookParser.parseBulkBookExcel as jest.Mock).mockResolvedValue(
      parsedRows
    );
    (createBook as jest.Mock).mockResolvedValue(1);
  });

  it("shows a preview of every parsed book with Select All checked by default", async () => {
    render(<TestHarness />);

    await uploadFile();

    expect(await screen.findByText("Preview")).toBeInTheDocument();
    expect(screen.getByText("Atomic Habits")).toBeInTheDocument();
    expect(screen.getByText("Deep Work")).toBeInTheDocument();

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3); // Select All + 2 books
    checkboxes.forEach((checkbox) => expect(checkbox).toBeChecked());
  });

  it("unchecks Select All when an individual book is deselected", async () => {
    render(<TestHarness />);
    const user = await uploadFile();

    await screen.findByText("Preview");

    const [selectAll, firstBook] = screen.getAllByRole("checkbox");
    await user.click(firstBook);

    expect(selectAll).not.toBeChecked();
    expect(firstBook).not.toBeChecked();
  });

  it("re-checks Select All automatically when all books become selected again", async () => {
    render(<TestHarness />);
    const user = await uploadFile();

    await screen.findByText("Preview");

    const [selectAll, firstBook] = screen.getAllByRole("checkbox");
    await user.click(firstBook);
    expect(selectAll).not.toBeChecked();

    await user.click(firstBook);
    expect(selectAll).toBeChecked();
  });

  it("selects and deselects every book when Select All is toggled", async () => {
    render(<TestHarness />);
    const user = await uploadFile();

    await screen.findByText("Preview");

    const [selectAll, ...bookCheckboxes] = screen.getAllByRole("checkbox");

    await user.click(selectAll);
    bookCheckboxes.forEach((checkbox) => expect(checkbox).not.toBeChecked());

    await user.click(selectAll);
    bookCheckboxes.forEach((checkbox) => expect(checkbox).toBeChecked());
  });

  it("only creates the selected books and strips previewBookUrl/id from the payload", async () => {
    const onClose = jest.fn();
    render(<TestHarness onClose={onClose} />);

    const user = userEvent.setup();
    const file = new File(["dummy"], "books.xlsx");
    const input = document.getElementById("bulkBookFile") as HTMLInputElement;
    await user.upload(input, file);

    await screen.findByText("Preview");

    const [, , secondBookCheckbox] = screen.getAllByRole("checkbox");
    await user.click(secondBookCheckbox);

    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(createBook).toHaveBeenCalledTimes(1);
    });

    expect(createBook).toHaveBeenCalledWith(
      {
        title: "Atomic Habits",
        authorName: "James Clear",
        isbn: "111",
        synopsis: "Good habits",
        shareable: true,
      },
      "fake-token"
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("shows a validation error toast and creates no books when the file is invalid", async () => {
    (excelBookParser.parseBulkBookExcel as jest.Mock).mockRejectedValue(
      new excelBookParser.BulkUploadValidationError(
        excelBookParser.BULK_UPLOAD_ERRORS.MISSING_COLUMNS
      )
    );

    render(<TestHarness />);
    await uploadFile();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        excelBookParser.BULK_UPLOAD_ERRORS.MISSING_COLUMNS
      );
    });

    expect(screen.queryByText("Preview")).not.toBeInTheDocument();
    expect(createBook).not.toHaveBeenCalled();
  });
});