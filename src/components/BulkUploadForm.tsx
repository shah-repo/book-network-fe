import { Checkbox, FormControlLabel } from "@mui/material";
import axios from "axios";
import React, {
    forwardRef,
    useImperativeHandle,
    useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import api from "../api/api";
import { useAuth } from "../contextApi/ContextApi";
import BookCard from "./BookCard";
import { BookType } from "./MyBooks";

export interface BulkUploadFormProps {
    closeDialog: () => void;
}

const REQUIRED_COLUMNS = [
    "title",
    "authorName",
    "isbn",
    "synopsis",
    "shareable",
    "previewBookUrl",
];

const BulkUploadForm = forwardRef<{ submitForm: () => void }, BulkUploadFormProps>(
    (props, ref) => {
        const [fileName, setFileName] = useState<string>("No file chosen");
        const [file, setFile] = useState<File | null>(null);
        const [error, setError] = useState<string | null>(null);
        const [previewBooks, setPreviewBooks] = useState<BookType[]>([]);
        const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
        const [isSubmitting, setIsSubmitting] = useState(false);
        const { token, removeToken } = useAuth();
        const navigate = useNavigate();
        const location = useLocation();

        const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            setError(null);
            setPreviewBooks([]);
            setSelectedIndices(new Set());
            if (!event.target.files || event.target.files.length === 0) {
                setFile(null);
                setFileName("No file chosen");
                return;
            }
            const selectedFile = event.target.files[0];
            setFileName(selectedFile.name);
            if (!selectedFile.name.toLowerCase().endsWith(".xlsx")) {
                const msg = "Only .xlsx Excel files are supported.";
                setError(msg);
                toast.error(msg);
                setFile(null);
                return;
            }
            setFile(selectedFile);
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const buffer = e.target?.result as ArrayBuffer;
                    const workbook = XLSX.read(buffer, { type: "array" });
                    const firstSheetName = workbook.SheetNames[0];
                    if (!firstSheetName) {
                        const msg = "The uploaded Excel file contains no books to import.";
                        setError(msg);
                        toast.error(msg);
                        return;
                    }
                    const worksheet = workbook.Sheets[firstSheetName];
                    const headerMatrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
                        header: 1,
                    });

                    if (!headerMatrix || headerMatrix.length === 0) {
                        const msg = "The uploaded Excel file contains no books to import.";
                        setError(msg);
                        toast.error(msg);
                        return;
                    }

                    const headerRow = headerMatrix[0] || [];
                    const headerStrings = headerRow.map((h) => String(h || "").trim());
                    const missingCols = REQUIRED_COLUMNS.filter(
                        (col) => !headerStrings.includes(col)
                    );

                    if (missingCols.length > 0) {
                        const msg = "The uploaded file is missing one or more required columns.";
                        setError(msg);
                        toast.error(msg);
                        return;
                    }

                    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
                    if (!rawRows || rawRows.length === 0) {
                        const msg = "The uploaded Excel file contains no books to import.";
                        setError(msg);
                        toast.error(msg);
                        return;
                    }

                    const parsedBooks: BookType[] = [];
                    let isValidData = true;

                    for (const row of rawRows) {
                        const title =
                            row.title !== undefined && row.title !== null
                                ? String(row.title).trim()
                                : "";
                        const authorName =
                            row.authorName !== undefined && row.authorName !== null
                                ? String(row.authorName).trim()
                                : "";
                        const isbn =
                            row.isbn !== undefined && row.isbn !== null
                                ? String(row.isbn).trim()
                                : "";
                        const synopsis =
                            row.synopsis !== undefined && row.synopsis !== null
                                ? String(row.synopsis).trim()
                                : "";
                        const previewBookUrl =
                            row.previewBookUrl !== undefined && row.previewBookUrl !== null
                                ? String(row.previewBookUrl).trim()
                                : "";
                        if (
                            row.shareable === undefined ||
                            row.shareable === null ||
                            row.shareable === ""
                        ) {
                            isValidData = false;
                            break;
                        }
                        if (!title || !authorName || !isbn || !synopsis || !previewBookUrl) {
                            isValidData = false;
                            break;
                        }
                        let shareableBool = false;
                        if (typeof row.shareable === "boolean") {
                            shareableBool = row.shareable;
                        } else if (typeof row.shareable === "string") {
                            const lower = row.shareable.trim().toLowerCase();
                            if (lower === "true" || lower === "1" || lower === "yes") {
                                shareableBool = true;
                            } else if (lower === "false" || lower === "0" || lower === "no") {
                                shareableBool = false;
                            } else {
                                isValidData = false;
                                break;
                            }
                        } else if (typeof row.shareable === "number") {
                            if (row.shareable === 1) shareableBool = true;
                            else if (row.shareable === 0) shareableBool = false;
                            else {
                                isValidData = false;
                                break;
                            }
                        } else {
                            isValidData = false;
                            break;
                        }
                        parsedBooks.push({
                            title,
                            authorName,
                            isbn,
                            synopsis,
                            shareable: shareableBool,
                            previewBookUrl,
                        });
                    }
                    if (!isValidData) {
                        const msg =
                            "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again.";
                        setError(msg);
                        toast.error(msg);
                        return;
                    }
                    setPreviewBooks(parsedBooks);
                    setSelectedIndices(new Set(parsedBooks.map((_, i) => i)));
                } catch {
                    const msg =
                        "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again.";
                    setError(msg);
                    toast.error(msg);
                }
            };
            reader.readAsArrayBuffer(selectedFile);
        };

        const isAllSelected =
            previewBooks.length > 0 && selectedIndices.size === previewBooks.length;
        const isIndeterminate =
            selectedIndices.size > 0 && selectedIndices.size < previewBooks.length;
        const handleSelectAllToggle = (
            e: React.ChangeEvent<HTMLInputElement>
        ) => {
            const checked = e.target.checked;
            if (checked) {
                setSelectedIndices(new Set(previewBooks.map((_, i) => i)));
            } else {
                setSelectedIndices(new Set());
            }
        };
        const handleSingleToggle = (index: number, checked: boolean) => {
            const next = new Set(selectedIndices);
            if (checked) {
                next.add(index);
            } else {
                next.delete(index);
            }
            setSelectedIndices(next);
        };
        const saveBulkBooks = async () => {
            if (!file || previewBooks.length === 0) {
                const msg = "Please select an Excel (.xlsx) file to upload.";
                setError(msg);
                toast.error(msg);
                return;
            }

            const booksToCreate = previewBooks.filter((_, idx) =>
                selectedIndices.has(idx)
            );

            if (booksToCreate.length === 0) {
                props.closeDialog();
                return;
            }

            setIsSubmitting(true);
            const headers = {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            };

            try {
                for (const book of booksToCreate) {
                    const payload = {
                        title: book.title,
                        authorName: book.authorName,
                        isbn: String(book.isbn),
                        synopsis: book.synopsis,
                        shareable: book.shareable,
                    };
                    await api.post("/api/v1/books", payload, { headers });
                }
                props.closeDialog();
                toast.success("Books uploaded successfully!");
            } catch (err: unknown) {
                toast.error("error");
                if (axios.isAxiosError(err) && err?.response?.status === 403) {
                    removeToken();
                    navigate("/login", { state: { from: location }, replace: true });
                }
            } finally {
                setIsSubmitting(false);
            }
        };
        useImperativeHandle(ref, () => ({
            submitForm: () => saveBulkBooks(),
        }));

        return (
            <div className="w-full bg-white space-y-4">
                {/* Upload Input */}
                <div>
                    <label htmlFor="bulkExcelFile" className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Excel File (.xlsx)
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="file"
                            id="bulkExcelFile"
                            accept=".xlsx"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isSubmitting}
                        />
                        <label
                            htmlFor="bulkExcelFile"
                            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded cursor-pointer text-sm font-medium transition-colors"
                        >
                            Choose file
                        </label>
                        <span className="text-gray-600 text-sm">{fileName}</span>
                    </div>
                    {error && (
                        <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>
                    )}
                </div>
                {/* Preview Section */}
                {previewBooks.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                            Preview
                        </h4>
                        <div className="mb-2">
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={isAllSelected}
                                        indeterminate={isIndeterminate}
                                        onChange={handleSelectAllToggle}
                                    />
                                }
                                label="Select All"
                            />
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-2 border rounded-md">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                {previewBooks.map((book, idx) => (
                                    <BookCard
                                        key={idx}
                                        book={book}
                                        isPreview
                                        isSelected={selectedIndices.has(idx)}
                                        onSelectToggle={(checked) => handleSingleToggle(idx, checked)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

BulkUploadForm.displayName = "BulkUploadForm";
export default BulkUploadForm;