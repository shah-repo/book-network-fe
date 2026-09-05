import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import * as XLSX from "xlsx";
import api from "../../api/api";
import { useAuth } from "../../contextApi/ContextApi";
import BulkUploadForm from "../BulkUploadForm";
import { FormRefType } from "../MyBooks";

const mockNavigate = jest.fn();
const mockRemoveToken = jest.fn();

const mockLocation = {
    pathname: "/my-books",
    search: "",
    hash: "",
    state: null,
    key: "default",
};

jest.mock("../../api/api", () => ({
    __esModule: true,
    default: {
        post: jest.fn(),
    },
    axiosPrivate: {
        post: jest.fn(),
        patch: jest.fn(),
        interceptors: {
            request: { use: jest.fn(() => 1), eject: jest.fn() },
            response: { use: jest.fn(() => 1), eject: jest.fn() },
        },
    },
}));

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

import { toast } from "react-toastify";

const REQUIRED_HEADERS = [
    "title",
    "authorName",
    "isbn",
    "synopsis",
    "shareable",
    "previewBookUrl",
];

const buildXlsxFile = (
    rows: unknown[][],
    fileName = "books.xlsx",
    headers: string[] = REQUIRED_HEADERS
): File => {
    const wb = XLSX.utils.book_new();
    const aoa = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer: ArrayBuffer = XLSX.write(wb, {
        type: "array",
        bookType: "xlsx",
    });
    return new File([buffer], fileName, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
};

const renderForm = () => {
    const ref = React.createRef<FormRefType>();
    const closeDialog = jest.fn();
    render(<BulkUploadForm ref={ref} data={undefined as any} closeDialog={closeDialog} />);
    return { ref, closeDialog };
};

const getFileInput = (): HTMLInputElement =>
    document.getElementById("bulkBookFile") as HTMLInputElement;

describe("BulkUploadForm", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useAuth as jest.Mock).mockReturnValue({
            token: "fake-token",
            removeToken: mockRemoveToken,
        });
    });

    it("shows an error when no file is selected", async () => {
        renderForm();
        const input = getFileInput();

        fireEvent.change(input, { target: { files: [] } });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                "Please select an Excel (.xlsx) file to upload."
            );
        });
    });

    it("shows an error for a non .xlsx file", async () => {
        renderForm();
        const input = getFileInput();

        const badFile = new File(["dummy"], "books.txt", { type: "text/plain" });
        fireEvent.change(input, { target: { files: [badFile] } });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                "Only .xlsx Excel files are supported."
            );
        });
    });

    it("shows an error when required columns are missing", async () => {
        renderForm();
        const input = getFileInput();

        const file = buildXlsxFile(
            [["Book A", "Author A", "111", "Synopsis A", "true"]],
            "books.xlsx",
            ["title", "authorName", "isbn", "synopsis", "shareable"] // missing previewBookUrl
        );

        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                "The uploaded file is missing one or more required columns."
            );
        });
    });

    it("shows an error when the excel file has no books", async () => {
        renderForm();
        const input = getFileInput();

        const file = buildXlsxFile([]);

        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                "The uploaded Excel file contains no books to import."
            );
        });
    });

    it("shows an error when a row has invalid or incomplete data", async () => {
        renderForm();
        const input = getFileInput();

        const file = buildXlsxFile([
            ["Book A", "", "111", "Synopsis A", "true", "http://example.com/a.png"],
        ]);

        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again."
            );
        });
    });

    it("renders a live preview with select-all checked by default and all books selected", async () => {
        renderForm();
        const input = getFileInput();

        const file = buildXlsxFile([
            ["Book A", "Author A", "111", "Synopsis A", "true", "http://example.com/a.png"],
            ["Book B", "Author B", "222", "Synopsis B", "false", "http://example.com/b.png"],
        ]);

        fireEvent.change(input, { target: { files: [file] } });

        expect(await screen.findByText("Preview")).toBeInTheDocument();
        expect(await screen.findByText("Book A")).toBeInTheDocument();
        expect(await screen.findByText("Book B")).toBeInTheDocument();

        const selectAllCheckbox = screen.getByRole("checkbox", {
            name: /select all books/i,
        }) as HTMLInputElement;
        expect(selectAllCheckbox.checked).toBe(true);

        const bookACheckbox = screen.getByRole("checkbox", {
            name: /select book book a/i,
        }) as HTMLInputElement;
        const bookBCheckbox = screen.getByRole("checkbox", {
            name: /select book book b/i,
        }) as HTMLInputElement;
        expect(bookACheckbox.checked).toBe(true);
        expect(bookBCheckbox.checked).toBe(true);
    });

    it("unchecks select-all when an individual book is deselected, and re-checks it when reselected", async () => {
        renderForm();
        const input = getFileInput();

        const file = buildXlsxFile([
            ["Book A", "Author A", "111", "Synopsis A", "true", "http://example.com/a.png"],
            ["Book B", "Author B", "222", "Synopsis B", "false", "http://example.com/b.png"],
        ]);

        fireEvent.change(input, { target: { files: [file] } });
        await screen.findByText("Preview");

        const selectAllCheckbox = screen.getByRole("checkbox", {
            name: /select all books/i,
        }) as HTMLInputElement;
        const bookACheckbox = screen.getByRole("checkbox", {
            name: /select book book a/i,
        }) as HTMLInputElement;

        fireEvent.click(bookACheckbox);
        expect(selectAllCheckbox.checked).toBe(false);

        fireEvent.click(bookACheckbox);
        expect(selectAllCheckbox.checked).toBe(true);
    });

    it("selects/deselects all books when select-all is toggled", async () => {
        renderForm();
        const input = getFileInput();

        const file = buildXlsxFile([
            ["Book A", "Author A", "111", "Synopsis A", "true", "http://example.com/a.png"],
            ["Book B", "Author B", "222", "Synopsis B", "false", "http://example.com/b.png"],
        ]);

        fireEvent.change(input, { target: { files: [file] } });
        await screen.findByText("Preview");

        const selectAllCheckbox = screen.getByRole("checkbox", {
            name: /select all books/i,
        }) as HTMLInputElement;
        const bookACheckbox = screen.getByRole("checkbox", {
            name: /select book book a/i,
        }) as HTMLInputElement;
        const bookBCheckbox = screen.getByRole("checkbox", {
            name: /select book book b/i,
        }) as HTMLInputElement;

        fireEvent.click(selectAllCheckbox);
        expect(bookACheckbox.checked).toBe(false);
        expect(bookBCheckbox.checked).toBe(false);

        fireEvent.click(selectAllCheckbox);
        expect(bookACheckbox.checked).toBe(true);
        expect(bookBCheckbox.checked).toBe(true);
    });

    it("only creates the selected books using the existing create API for each book, excluding previewBookUrl", async () => {
        (api.post as jest.Mock).mockResolvedValue({ data: 1 });
        const { ref, closeDialog } = renderForm();
        const input = getFileInput();

        const file = buildXlsxFile([
            ["Book A", "Author A", "111", "Synopsis A", "true", "http://example.com/a.png"],
            ["Book B", "Author B", "222", "Synopsis B", "false", "http://example.com/b.png"],
        ]);

        fireEvent.change(input, { target: { files: [file] } });
        await screen.findByText("Preview");

        const bookBCheckbox = screen.getByRole("checkbox", {
            name: /select book book b/i,
        }) as HTMLInputElement;
        fireEvent.click(bookBCheckbox);

        ref.current?.submitForm();

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledTimes(1);
        });

        expect(api.post).toHaveBeenCalledWith(
            "/api/v1/books",
            {
                title: "Book A",
                authorName: "Author A",
                isbn: "111",
                synopsis: "Synopsis A",
                shareable: true,
            },
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer fake-token",
                }),
            })
        );

        await waitFor(() => {
            expect(closeDialog).toHaveBeenCalled();
        });

        expect(toast.success).toHaveBeenCalledWith("Books Uploaded Successfully!");
    });

    it("does not create any books and shows an error when no book is selected on submit", async () => {
        const { ref } = renderForm();
        const input = getFileInput();

        const file = buildXlsxFile([
            ["Book A", "Author A", "111", "Synopsis A", "true", "http://example.com/a.png"],
        ]);

        fireEvent.change(input, { target: { files: [file] } });
        await screen.findByText("Preview");

        const bookACheckbox = screen.getByRole("checkbox", {
            name: /select book book a/i,
        }) as HTMLInputElement;
        fireEvent.click(bookACheckbox);

        ref.current?.submitForm();

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(
                "Please select at least one book to import."
            );
        });

        expect(api.post).not.toHaveBeenCalled();
    });
});