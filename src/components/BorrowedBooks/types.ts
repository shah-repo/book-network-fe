export interface BorrowedBookType {
  id: number;
  title: string;
  authorName: string;
  isbn?: string;
  rate: number;
  returned: boolean;
  returnApproved: boolean;
  [key: string]: number | string | boolean | undefined;
}

export interface FeedBackRequestType {
  note: number;
  comment: string;
  bookId: number;
}

export interface ReturnBookFormData {
  note: number;
  comment: string;
}

export enum BorrowedBookStatus {
  Borrowed = "Borrowed",
  Returned = "Returned",
  ApprovedReturned = "Returned Approved",
}

export enum BorrowedBookStatusColor {
  Borrowed = "success",
  Returned = "warning",
  ApprovedReturned = "error",
}
