import * as XLSX from "xlsx";
import {
    BULK_UPLOAD_ERRORS,
    BulkUploadValidationError,
    parseBulkBookExcel,
    validateBulkUploadFile,
} from "../../utils/excelBookParser";

const createXlsxFile = (
  rows: Record<string, unknown>[],
  fileName = "books.xlsx"
): File => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Books");
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new File([buffer], fileName, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

const validRow = {
  title: "Atomic Habits",
  authorName: "James Clear",
  isbn: "111",
  synopsis: "Good habits",
  shareable: true,
  previewBookUrl: "https://example.com/cover.png",
};

describe("validateBulkUploadFile", () => {
  it("throws NO_FILE when no file is provided", () => {
    expect(() => validateBulkUploadFile(undefined)).toThrow(
      BULK_UPLOAD_ERRORS.NO_FILE
    );
    expect(() => validateBulkUploadFile(null)).toThrow(
      BULK_UPLOAD_ERRORS.NO_FILE
    );
  });

  it("throws INVALID_TYPE for non .xlsx files", () => {
    const file = new File(["dummy"], "books.csv", { type: "text/csv" });
    expect(() => validateBulkUploadFile(file)).toThrow(
      BULK_UPLOAD_ERRORS.INVALID_TYPE
    );
  });

  it("does not throw for a .xlsx file", () => {
    const file = new File(["dummy"], "books.xlsx");
    expect(() => validateBulkUploadFile(file)).not.toThrow();
  });
});

describe("parseBulkBookExcel", () => {
  it("parses a valid excel file into book rows", async () => {
    const file = createXlsxFile([
      validRow,
      { ...validRow, title: "Deep Work", isbn: "222" },
    ]);

    const result = await parseBulkBookExcel(file);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      title: "Atomic Habits",
      authorName: "James Clear",
      isbn: "111",
      synopsis: "Good habits",
      shareable: true,
      previewBookUrl: "https://example.com/cover.png",
    });
    expect(result[1].title).toBe("Deep Work");
  });

  it("rejects with INVALID_TYPE for a non .xlsx file", async () => {
    const file = new File(["dummy"], "books.txt");

    await expect(parseBulkBookExcel(file)).rejects.toThrow(
      BULK_UPLOAD_ERRORS.INVALID_TYPE
    );
  });

  it("rejects with MISSING_COLUMNS when a required column is absent", async () => {
    const rowWithoutPreview: Record<string, unknown> = { ...validRow };
    delete rowWithoutPreview.previewBookUrl;
    const file = createXlsxFile([rowWithoutPreview]);

    await expect(parseBulkBookExcel(file)).rejects.toThrow(
      BULK_UPLOAD_ERRORS.MISSING_COLUMNS
    );
  });

  it("rejects with EMPTY_FILE when there are no data rows", async () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["title", "authorName", "isbn", "synopsis", "shareable", "previewBookUrl"],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Books");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const file = new File([buffer], "books.xlsx");

    await expect(parseBulkBookExcel(file)).rejects.toThrow(
      BULK_UPLOAD_ERRORS.EMPTY_FILE
    );
  });

  it("rejects with INVALID_ROWS when a row has incomplete data", async () => {
    const file = createXlsxFile([{ ...validRow, title: "" }]);

    await expect(parseBulkBookExcel(file)).rejects.toThrow(
      BULK_UPLOAD_ERRORS.INVALID_ROWS
    );
  });

  it("rejects with INVALID_ROWS when shareable is not a valid boolean", async () => {
    const file = createXlsxFile([{ ...validRow, shareable: "maybe" }]);

    await expect(parseBulkBookExcel(file)).rejects.toThrow(
      BULK_UPLOAD_ERRORS.INVALID_ROWS
    );
  });

  it("throws a BulkUploadValidationError instance", async () => {
    const file = new File(["dummy"], "books.txt");

    try {
      await parseBulkBookExcel(file);
      throw new Error("Expected parseBulkBookExcel to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BulkUploadValidationError);
    }
  });
});