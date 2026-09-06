import * as XLSX from "xlsx";

export interface ParsedBookRow {
  title: string;
  authorName: string;
  isbn: string;
  synopsis: string;
  shareable: boolean;
  previewBookUrl: string;
}

export const BULK_UPLOAD_ERRORS = {
  NO_FILE: "Please select an Excel (.xlsx) file to upload.",
  INVALID_TYPE: "Only .xlsx Excel files are supported.",
  MISSING_COLUMNS:
    "The uploaded file is missing one or more required columns.",
  EMPTY_FILE: "The uploaded Excel file contains no books to import.",
  INVALID_ROWS:
    "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again.",
} as const;

export const REQUIRED_BULK_UPLOAD_COLUMNS = [
  "title",
  "authorName",
  "isbn",
  "synopsis",
  "shareable",
  "previewBookUrl",
] as const;

export class BulkUploadValidationError extends Error {}

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  if (typeof file.arrayBuffer === "function") {
    return file.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

export const validateBulkUploadFile = (
  file: File | null | undefined
): void => {
  if (!file) {
    throw new BulkUploadValidationError(BULK_UPLOAD_ERRORS.NO_FILE);
  }

  const fileName = file.name?.toLowerCase() ?? "";
  if (!fileName.endsWith(".xlsx")) {
    throw new BulkUploadValidationError(BULK_UPLOAD_ERRORS.INVALID_TYPE);
  }
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const parseBooleanCell = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return undefined;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "1"].includes(normalized)) return true;
    if (["false", "no", "0"].includes(normalized)) return false;
  }

  return undefined;
};

export const parseBulkBookExcel = async (
  file: File
): Promise<ParsedBookRow[]> => {
  validateBulkUploadFile(file);

  const buffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;

  if (!sheet) {
    throw new BulkUploadValidationError(BULK_UPLOAD_ERRORS.EMPTY_FILE);
  }

  const rowsAsArray = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
  });

  if (!rowsAsArray || rowsAsArray.length === 0) {
    throw new BulkUploadValidationError(BULK_UPLOAD_ERRORS.EMPTY_FILE);
  }

  const headerRow = (rowsAsArray[0] ?? []).map((column) => String(column));
  const hasAllColumns = REQUIRED_BULK_UPLOAD_COLUMNS.every((column) =>
    headerRow.includes(column)
  );

  if (!hasAllColumns) {
    throw new BulkUploadValidationError(BULK_UPLOAD_ERRORS.MISSING_COLUMNS);
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (rows.length === 0) {
    throw new BulkUploadValidationError(BULK_UPLOAD_ERRORS.EMPTY_FILE);
  }

  const parsedRows: ParsedBookRow[] = rows.map((row) => {
    const title = row.title;
    const authorName = row.authorName;
    const isbn = row.isbn;
    const synopsis = row.synopsis;
    const shareable = parseBooleanCell(row.shareable);
    const previewBookUrl = row.previewBookUrl;

    if (
      !isNonEmptyString(title) ||
      !isNonEmptyString(authorName) ||
      !isNonEmptyString(isbn) ||
      !isNonEmptyString(synopsis) ||
      shareable === undefined
    ) {
      throw new BulkUploadValidationError(BULK_UPLOAD_ERRORS.INVALID_ROWS);
    }

    return {
      title: title.trim(),
      authorName: authorName.trim(),
      isbn: isbn.trim(),
      synopsis: synopsis.trim(),
      shareable,
      previewBookUrl: isNonEmptyString(previewBookUrl)
        ? previewBookUrl.trim()
        : "",
    };
  });

  return parsedRows;
};