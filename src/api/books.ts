import api from "./api";

export interface CreateBookPayload {
  id?: number;
  title: string;
  authorName: string;
  isbn: string;
  synopsis: string;
  shareable: boolean;
}

export const createBook = async (
  data: CreateBookPayload,
  token: string
): Promise<number> => {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  const { data: bookId } = await api.post("/api/v1/books", data, {
    headers,
  });

  return bookId;
};
