import { BorrowedBookStatus, BorrowedBookStatusColor, BorrowedBookType } from "./types";

export const getBorrowedBookStatus = (
  book: BorrowedBookType,
): BorrowedBookStatus => {
  if (book.returnApproved) {
    return BorrowedBookStatus.ApprovedReturned;
  }

  if (book.returned) {
    return BorrowedBookStatus.Returned;
  }

  return BorrowedBookStatus.Borrowed;
};

export const getBorrowedBookStatusColor = (
  book: BorrowedBookType,
): BorrowedBookStatusColor => {
  if (book.returnApproved) {
    return BorrowedBookStatusColor.ApprovedReturned;
  }

  if (book.returned) {
    return BorrowedBookStatusColor.Returned;
  }

  return BorrowedBookStatusColor.Borrowed;
};