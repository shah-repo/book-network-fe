import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import BookCard from "../BookCard";
import { BookType } from "../MyBooks";

const mockNavigate = jest.fn();
const mockLocation = { pathname: "/my-books", search: "", hash: "", state: null, key: "default" };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

jest.mock("../../contextApi/ContextApi", () => ({
  useAuth: () => ({ token: "fake-token", removeToken: jest.fn() }),
}));

jest.mock("../../hooks/useAxiosPrivate", () => ({
  useAxiosPrivate: () => ({
    post: jest.fn(),
    patch: jest.fn(),
  }),
}));

describe("BookCard component", () => {
  const sampleBook: BookType = {
    id: 1,
    title: "Clean Code",
    authorName: "Robert C. Martin",
    isbn: "9780132350884",
    owner: "John Doe",
    synopsis: "A handbook of agile software craftsmanship.",
    cover: "base64-encoded-cover-data",
    rate: 4.5,
    archived: false,
    shareable: true,
  };

  it("renders in normal mode with base64 cover and no checkbox", () => {
    render(<BookCard book={sampleBook} isOwner />);

    const img = screen.getByRole("img", { name: /book cover/i });
    expect(img).toHaveAttribute(
      "src",
      "data:image/png;base64,base64-encoded-cover-data"
    );

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByText("Clean Code")).toBeInTheDocument();
    expect(screen.getByText("Robert C. Martin")).toBeInTheDocument();
    expect(screen.getByText("9780132350884")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(
      screen.getByText("A handbook of agile software craftsmanship.")
    ).toBeInTheDocument();
  });

  it("renders in preview mode with previewBookUrl and right-aligned checkbox", () => {
    const onToggleSelect = jest.fn();
    const previewBook = {
      ...sampleBook,
      previewBookUrl: "https://example.com/cover.jpg",
    };

    render(
      <BookCard
        book={previewBook}
        mode="preview"
        isPreview
        selected={true}
        onToggleSelect={onToggleSelect}
      />
    );

    const img = screen.getByRole("img", { name: /book cover/i });
    expect(img).toHaveAttribute("src", "https://example.com/cover.jpg");

    const checkbox = screen.getByRole("checkbox", {
      name: /select clean code/i,
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(onToggleSelect).toHaveBeenCalledWith(false);
  });

  it("does not show tooltip for short text that is not truncated", async () => {
    render(<BookCard book={sampleBook} />);

    const titleEl = screen.getByText("Clean Code");
    fireEvent.mouseEnter(titleEl);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("displays tooltip on hover when text is truncated by overflow", async () => {
    const longTitleBook = {
      ...sampleBook,
      title: "This is an extremely long title that will overflow and truncate with ellipsis",
    };

    render(<BookCard book={longTitleBook} />);

    const titleEl = screen.getByText(longTitleBook.title);
    Object.defineProperty(titleEl, "scrollWidth", {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(titleEl, "clientWidth", {
      configurable: true,
      value: 100,
    });

    fireEvent.mouseEnter(titleEl);

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent(longTitleBook.title);

    fireEvent.mouseLeave(titleEl);
    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("displays tooltip for truncated authorName", async () => {
    const longAuthorBook = {
      ...sampleBook,
      authorName: "A very very long author name that exceeds available card space",
    };

    render(<BookCard book={longAuthorBook} />);

    const authorEl = screen.getByText(longAuthorBook.authorName);
    Object.defineProperty(authorEl, "scrollWidth", {
      configurable: true,
      value: 250,
    });
    Object.defineProperty(authorEl, "clientWidth", {
      configurable: true,
      value: 80,
    });

    fireEvent.mouseEnter(authorEl);

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent(longAuthorBook.authorName);
  });

  it("displays tooltip for truncated synopsis with multi-line overflow", async () => {
    const longSynopsisBook = {
      ...sampleBook,
      synopsis:
        "This synopsis is very long and spans across more than three lines of text in the book card component so it gets clamped with line clamp three and truncated with ellipsis.",
    };

    render(<BookCard book={longSynopsisBook} />);

    const synopsisEl = screen.getByText(longSynopsisBook.synopsis);
    Object.defineProperty(synopsisEl, "scrollHeight", {
      configurable: true,
      value: 150,
    });
    Object.defineProperty(synopsisEl, "clientHeight", {
      configurable: true,
      value: 60,
    });

    fireEvent.mouseEnter(synopsisEl);

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent(longSynopsisBook.synopsis);
  });
});