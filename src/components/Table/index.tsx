import {
  Chip,
  Rating,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { BorrowedBookStatus, BorrowedBookType } from "../BorrowedBooks/types";
import {
  getBorrowedBookStatus,
  getBorrowedBookStatusColor,
} from "../BorrowedBooks/utils";
import { getLendedBookStatus, getLendedBookStatusColor } from "../LendedBooks/utils";

export default function BasicTable({
  data,
  returnBook,
  approveReturnedBook,
  schema,
  isBorrowedTable = false,
}: {
  data: BorrowedBookType[];
  returnBook: (book: BorrowedBookType) => void;
  approveReturnedBook: (bookId: number) => void;
  schema: { title: string; field?: string; type?: string }[];
  isBorrowedTable: boolean;
}) {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            {schema.map((item) => (
              <TableCell>{item.title}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((book, index) => {
            const bookStatus = isBorrowedTable
              ? getBorrowedBookStatus(book)
              : getLendedBookStatus(book);

            return (
              <TableRow
                key={book.id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {index}
                </TableCell>
                {schema.map((item) => {
                  const field = item.field ?? "";
                  const type = item.type;
                  if (field && !type) {
                    return <TableCell>{book[field]}</TableCell>;
                  }

                  if (type && type === "status") {
                    const color = isBorrowedTable? getBorrowedBookStatusColor(book): getLendedBookStatusColor(book) ;

                    return (
                      <TableCell>
                        <Chip className="pt-0.5" label={bookStatus} color={color} />
                      </TableCell>
                    );
                  }

                  if (type && type === "rating") {
                    return (
                      <TableCell align="center">
                        <Rating
                          value={book[field] as number}
                          readOnly
                          precision={0.5}
                        />
                      </TableCell>
                    );
                  }

                  if (item?.type && item?.type === "action") {
                    return (
                      <TableCell align="center">
                        {isBorrowedTable ? (
                          <Tooltip
                            title={`${
                              bookStatus === BorrowedBookStatus.Borrowed
                                ? "Return back"
                                : "Already Returned"
                            }`}
                            placement="top"
                            arrow
                          >
                            <FontAwesomeIcon
                              icon={faPaperPlane}
                              onClick={() => {
                                if (
                                  bookStatus !== BorrowedBookStatus.Borrowed
                                ) {
                                  return;
                                }
                                returnBook?.(book);
                              }}
                              className={`${
                                bookStatus === BorrowedBookStatus.Borrowed
                                  ? "text-blue-500"
                                  : "text-gray-500"
                              } cursor-pointer`}
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip
                            title={`${
                              bookStatus === BorrowedBookStatus.Returned
                                ? "Approved the return!"
                                : bookStatus ===
                                  BorrowedBookStatus.ApprovedReturned
                                ? "Already Approved!"
                                : "Not returned yet!"
                            }`}
                            placement="top"
                            arrow
                          >
                            <FontAwesomeIcon
                              icon={faCircleCheck}
                              size="lg"
                              className={`${
                                bookStatus === BorrowedBookStatus.Returned
                                  ? "text-green-600"
                                  : "text-gray-500"
                              } cursor-pointer`}
                              onClick={() => {
                                if (
                                  bookStatus !== BorrowedBookStatus.Returned
                                ) {
                                  return;
                                }
                                approveReturnedBook?.(book.id);
                              }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                    );
                  }
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
