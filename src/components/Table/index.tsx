import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import Paper from "@mui/material/Paper";
import { BookType } from "../MyBooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faPaperPlane,
  faStar,
} from "@fortawesome/free-solid-svg-icons";

export default function BasicTable({
  data,
  returnBook,
}: {
  data: BookType[];
  returnBook: (book: BookType) => void;
}) {
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Author</TableCell>
            <TableCell>ISBN</TableCell>
            <TableCell>Rate</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={item.id}
              sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {index}
              </TableCell>
              <TableCell>{item.title}</TableCell>
              <TableCell>{item.authorName}</TableCell>
              <TableCell>{item.isbn}</TableCell>
              <TableCell align="right">
                <FontAwesomeIcon
                  icon={faStar}
                  className="text-yellow-500 cursor-pointer"
                />
                &nbsp;{item.rate}
              </TableCell>
              <TableCell className="justify-items-center">
                <Box display={"flex"} gap={2.5}>
                  <Tooltip title="Return back" placement="top" arrow>
                    <FontAwesomeIcon
                      icon={faPaperPlane}
                      onClick={() => {
                        returnBook?.(item);
                      }}
                      className="text-blue-500 cursor-pointer"
                    />
                  </Tooltip>
                  <Tooltip
                    title="Yet not approved by the owner!"
                    placement="top"
                    arrow
                  >
                    <FontAwesomeIcon
                      icon={faCircleCheck}
                      className="text-orange-300 cursor-pointer"
                    />
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
