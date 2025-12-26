import {
  LendedBookStatus,
  LendedBookStatusColor,
  LendedBookType,
} from "./types";

export const getLendedBookStatus = (book: LendedBookType): LendedBookStatus => {
  if (book.returnApproved) {
    return LendedBookStatus.ApprovedReceived;
  }

  if (book.returned) {
    return LendedBookStatus.Received;
  }

  return LendedBookStatus.Lended;
};

export const getLendedBookStatusColor = (
  book: LendedBookType
): LendedBookStatusColor => {
  if (book.returnApproved) {
    return LendedBookStatusColor.ApprovedReceived;
  }

  if (book.returned) {
    return LendedBookStatusColor.Received;
  }

  return LendedBookStatusColor.Lended;
};
