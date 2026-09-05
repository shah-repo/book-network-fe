import { Checkbox, FormControlLabel } from "@mui/material";
import axios from "axios";
import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as xlsx from "xlsx";
import api from "../api/api";
import { useAuth } from "../contextApi/ContextApi";
import BookCard from "./BookCard";
import { ManageBookFormProps } from "./ManageBookForm";
import { BookType, FormRefType } from "./MyBooks";

const getArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  if (typeof file.arrayBuffer === "function") {
    return file.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

const BulkBookUploadForm = forwardRef<FormRefType, ManageBookFormProps>(
  (props, ref) => {
    const [fileName, setFileName] = useState<string>("No file chosen");
    const [file, setFile] = useState<File>();
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [previewBooks, setPreviewBooks] = useState<
      (BookType & { previewBookUrl?: string; tempId: number })[]
    >([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const { token, removeToken } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
      setFile(undefined);
      setFileName("No file chosen");
      setErrorMessage("");
      setPreviewBooks([]);
      setSelectedIds(new Set());
    }, []);

    const handleFileChange = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setErrorMessage("");
      setPreviewBooks([]);
      setSelectedIds(new Set());

      if (!selectedFile.name.toLowerCase().endsWith(".xlsx")) {
        setErrorMessage("Only .xlsx Excel files are supported.");
        return;
      }

      try {
        const arrayBuffer = await getArrayBuffer(selectedFile);
        const workbook = xlsx.read(arrayBuffer, { type: "array" });
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          setErrorMessage("The uploaded Excel file contains no books to import.");
          return;
        }
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        if (!worksheet || !worksheet["!ref"]) {
          setErrorMessage("The uploaded Excel file contains no books to import.");
          return;
        }

        const rawRows = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        if (!rawRows || rawRows.length === 0) {
          setErrorMessage("The uploaded Excel file contains no books to import.");
          return;
        }

        const jsonData = xlsx.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        if (!jsonData || jsonData.length === 0) {
          setErrorMessage("The uploaded Excel file contains no books to import.");
          return;
        }

        const headers = (rawRows[0] || []).map((h: unknown) => String(h).trim());
        const requiredColumns = [
          "title",
          "authorName",
          "isbn",
          "synopsis",
          "shareable",
          "previewBookUrl",
        ];
        const hasAllRequiredColumns = requiredColumns.every((col) =>
          headers.includes(col)
        );

        if (!hasAllRequiredColumns) {
          setErrorMessage("The uploaded file is missing one or more required columns.");
          return;
        }

        const isValidRow = (row: Record<string, unknown>) => {
          if (!row || typeof row !== "object") return false;
          const title = String(row.title ?? "").trim();
          const authorName = String(row.authorName ?? "").trim();
          const isbn = String(row.isbn ?? "").trim();
          const synopsis = String(row.synopsis ?? "").trim();
          const previewBookUrl = String(row.previewBookUrl ?? "").trim();
          return (
            title !== "" &&
            authorName !== "" &&
            isbn !== "" &&
            synopsis !== "" &&
            previewBookUrl !== ""
          );
        };

        if (jsonData.some((row) => !isValidRow(row))) {
          setErrorMessage(
            "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again."
          );
          return;
        }

        const parseShareable = (val: unknown): boolean => {
          if (typeof val === "boolean") return val;
          if (typeof val === "number") return val !== 0;
          if (typeof val === "string") {
            const lower = val.trim().toLowerCase();
            return lower === "true" || lower === "yes" || lower === "1";
          }
          return false;
        };

        const parsed: (BookType & { previewBookUrl?: string; tempId: number })[] =
          jsonData.map((row: Record<string, unknown>, idx: number) => ({
            id: idx + 1,
            tempId: idx + 1,
            title: String(row.title ?? "").trim(),
            authorName: String(row.authorName ?? "").trim(),
            isbn: String(row.isbn ?? "").trim(),
            owner: "",
            synopsis: String(row.synopsis ?? "").trim(),
            cover: "",
            rate: 0,
            archived: false,
            shareable: parseShareable(row.shareable),
            previewBookUrl: String(row.previewBookUrl ?? "").trim(),
          }));

        setPreviewBooks(parsed);
        setSelectedIds(new Set(parsed.map((b) => b.tempId)));
      } catch (err) {
        console.error("Error reading excel file:", err);
        setErrorMessage(
          "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again."
        );
      }
    };

    const submitForm = async () => {
      if (!file || fileName === "No file chosen") {
        setErrorMessage("Please select an Excel (.xlsx) file to upload.");
        return;
      }
      if (errorMessage || previewBooks.length === 0) {
        return;
      }
      const booksToCreate = previewBooks.filter((book) =>
        selectedIds.has(book.tempId)
      );
      if (booksToCreate.length === 0) {
        props.closeDialog();
        return;
      }

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
            isbn: book.isbn,
            synopsis: book.synopsis,
            shareable: book.shareable,
          };
          await api.post("/api/v1/books", payload, { headers });
        }
        props.closeDialog();
        toast.success("Books Saved Successfully!");
      } catch (error: unknown) {
        toast.error("error");
        if (axios.isAxiosError(error) && error?.response?.status === 403) {
          removeToken();
          navigate("/login", { state: { from: location }, replace: true });
        }
        console.log({ error });
      }
    };

    useImperativeHandle(ref, () => ({
      submitForm: () => submitForm(),
    }));

    const isAllSelected =
      previewBooks.length > 0 &&
      previewBooks.every((b) => selectedIds.has(b.tempId));

    const handleToggleSelectAll = () => {
      if (isAllSelected) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(previewBooks.map((b) => b.tempId)));
      }
    };

    const handleToggleSelect = (id: number) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    };

    return (
      <div className="w-full bg-white">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 mb-4">
          <input
            type="file"
            id="excelUpload"
            accept=".xlsx"
            className="hidden"
            onChange={handleFileChange}
            data-testid="bulk-excel-input"
          />
          <label
            htmlFor="excelUpload"
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded cursor-pointer font-medium text-gray-800 transition"
          >
            Choose file
          </label>
          <span className="mt-2 text-gray-600 text-sm font-medium">
            {fileName}
          </span>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="my-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 font-medium rounded text-sm"
          >
            {errorMessage}
          </div>
        )}

        {!errorMessage && previewBooks.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Preview
            </h3>
            <div className="flex items-center mb-4">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    inputProps={{ "aria-label": "Select All" }}
                  />
                }
                label="Select All"
              />
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {previewBooks.map((book) => (
                  <BookCard
                    key={book.tempId}
                    book={book}
                    isPreview={true}
                    isSelected={selectedIds.has(book.tempId)}
                    onSelectToggle={() => handleToggleSelect(book.tempId)}
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

export default BulkBookUploadForm;