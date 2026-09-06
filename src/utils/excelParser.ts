import * as XLSX from "xlsx";

export interface ParsedBook {
  title: string;
  authorName: string;
  isbn: string;
  synopsis: string;
  shareable: boolean;
  previewBookUrl: string;
}

const REQUIRED_COLUMNS = [
  "title",
  "authorName",
  "isbn",
  "synopsis",
  "shareable",
  "previewBookUrl",
];

const PROHIBITED_COLUMNS = [
  "id",
  "owner",
  "cover",
  "rate",
  "archived",
  "borrowed",
];

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  if (typeof file.arrayBuffer === "function") {
    return file.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = () => {
      reject(reader.error);
    };
    reader.readAsArrayBuffer(file);
  });
};

export const parseAndValidateExcel = async (
  file: File
): Promise<{ books?: ParsedBook[]; error?: string }> => {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return { error: "Only .xlsx Excel files are supported." };
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await readFileAsArrayBuffer(file);
  } catch {
    return {
      error:
        "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again.",
    };
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    return { error: "The uploaded Excel file contains no books to import." };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { error: "The uploaded Excel file contains no books to import." };
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    return { error: "The uploaded Excel file contains no books to import." };
  }

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
  if (!rawRows || rawRows.length === 0) {
    return { error: "The uploaded Excel file contains no books to import." };
  }

  const headerRow = rawRows[0] || [];
  const headers = headerRow.map((h) => String(h || "").trim());

  for (const col of REQUIRED_COLUMNS) {
    if (!headers.includes(col)) {
      return {
        error: "The uploaded file is missing one or more required columns.",
      };
    }
  }

  for (const col of PROHIBITED_COLUMNS) {
    if (headers.includes(col)) {
      return {
        error:
          "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again.",
      };
    }
  }

  const dataRows = rawRows.slice(1);
  const nonEmptyRows = dataRows.filter(
    (row) =>
      row &&
      row.some(
        (cell) =>
          cell !== null && cell !== undefined && String(cell).trim() !== ""
      )
  );

  if (nonEmptyRows.length === 0) {
    return { error: "The uploaded Excel file contains no books to import." };
  }

  const books: ParsedBook[] = [];

  for (const row of nonEmptyRows) {
    const rowObj: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = row[idx];
    });

    for (const col of PROHIBITED_COLUMNS) {
      if (
        rowObj[col] !== undefined &&
        rowObj[col] !== null &&
        String(rowObj[col]).trim() !== ""
      ) {
        return {
          error:
            "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again.",
        };
      }
    }

    for (const col of REQUIRED_COLUMNS) {
      const val = rowObj[col];
      if (val === null || val === undefined || String(val).trim() === "") {
        return {
          error:
            "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again.",
        };
      }
    }

    const sVal = rowObj["shareable"];
    let shareableBool: boolean;
    if (typeof sVal === "boolean") {
      shareableBool = sVal;
    } else if (typeof sVal === "string") {
      const s = sVal.trim().toLowerCase();
      if (s === "true" || s === "1" || s === "yes") shareableBool = true;
      else if (s === "false" || s === "0" || s === "no") shareableBool = false;
      else {
        return {
          error:
            "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again.",
        };
      }
    } else if (typeof sVal === "number") {
      if (sVal === 1) shareableBool = true;
      else if (sVal === 0) shareableBool = false;
      else {
        return {
          error:
            "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again.",
        };
      }
    } else {
      return {
        error:
          "One or more rows contain invalid or incomplete data. Please correct the Excel file and try again.",
      };
    }

    books.push({
      title: String(rowObj.title).trim(),
      authorName: String(rowObj.authorName).trim(),
      isbn: String(rowObj.isbn).trim(),
      synopsis: String(rowObj.synopsis).trim(),
      shareable: shareableBool,
      previewBookUrl: String(rowObj.previewBookUrl).trim(),
    });
  }

  return { books };
};