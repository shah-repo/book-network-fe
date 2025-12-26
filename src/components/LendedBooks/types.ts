export interface LendedBookType {
  id: number;
  title: string;
  authorName: string;
  isbn?: string;
  rate: number;
  returned: boolean;
  returnApproved: boolean;
}

export enum LendedBookStatus {
  Lended = "Lended",
  Received = "Received",
  ApprovedReceived = "Received Approved",
}

export enum LendedBookStatusColor {
  Lended = "error",
  Received = "warning",
  ApprovedReceived = "success",
}