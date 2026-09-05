import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import BookCard from "../BookCard";
import { BookType } from "../MyBooks";
const mockNavigate = jest.fn();
const mockRemoveToken = jest.fn();
jest.mock("../../api/api", () => ({
  __esModule: true,
  default: { get: jest.fn() },
  axiosPrivate: {
    post: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn(() => 1), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
}));

jest.mock("../../contextApi/ContextApi", () => ({
  useAuth: () => ({
    token: "fake-token",
    removeToken: mockRemoveToken,
  }),
}));

jest.mock("../../hooks/useAxiosPrivate", () => ({
  useAxiosPrivate: () => ({
    post: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn(() => 1), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  }),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/my-books" }),
}));

jest.mock("react-toastify", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const mockBook: BookType & { previewBookUrl?: string } = {
  id: 1,
  title: "A Very Long Book Title That Would Wrap Or Overflow On Small Cards",
  authorName: "James Clear",
  isbn: "111-222-333",
  owner: "John Doe",
  synopsis: "This is a detailed synopsis of the book Atomic Habits.",
  cover: "base64encodedimage",
  rate: 4,
  archived: false,
  shareable: true,
  previewBookUrl: "http://example.com/preview.jpg",
};
describe("BookCard component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it("renders in normal mode with byte-array cover image and no selection checkbox", () => {
    render(<BookCard book={mockBook} isOwner={true} />);
    const img = screen.getByRole("img", { name: "Book Cover" });
    expect(img).toHaveAttribute(
      "src",
      "data:image/png;base64,base64encodedimage"
    );
    const checkbox = screen.queryByRole("checkbox");
    expect(checkbox).not.toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
  
  it("renders in preview mode with previewBookUrl and displays selection checkbox", () => {
    const onSelectToggle = jest.fn();
    render(
      <BookCard
        book={mockBook}
        isPreview={true}
        isSelected={true}
        onSelectToggle={onSelectToggle}
      />
    );
    const img = screen.getByRole("img", { name: "Book Cover" });
    expect(img).toHaveAttribute("src", "http://example.com/preview.jpg");
    const checkbox = screen.getByRole("checkbox", {
      name: /select a very long book title/i,
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(onSelectToggle).toHaveBeenCalledWith(1);
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });
  
  it("displays tooltip on hover only when text is truncated", async () => {
    render(<BookCard book={mockBook} isPreview={false} />);
    const titleElement = screen.getByText(
      "A Very Long Book Title That Would Wrap Or Overflow On Small Cards"
    );
    // Initially when scrollWidth <= clientWidth, hover should not trigger tooltip
    fireEvent.mouseEnter(titleElement);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    // Simulate truncation where scrollWidth > clientWidth
    Object.defineProperty(titleElement, "scrollWidth", {
      configurable: true,
      get: () => 200,
    });
    Object.defineProperty(titleElement, "clientWidth", {
      configurable: true,
      get: () => 100,
    });
    fireEvent.mouseEnter(titleElement);
    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "A Very Long Book Title That Would Wrap Or Overflow On Small Cards"
    );
  });
});