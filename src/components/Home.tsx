import React, { useEffect, useState } from "react";
import { Hero } from "./Hero";
import BookCard from "./BookCard";
import SectionHeading from "./SectionHeading";
import { useAuth } from "../contextApi/ContextApi";
import { BookType } from "./MyBooks";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";
// import SectionHeading from "./SectionHeading";

// TO DO Remove
export const products = [
  {
    id: 1,
    name: "Earthen Bottle",
    href: "#",
    price: "$48",
    color: "Black",
    imageSrc:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Ym9va3xlbnwwfHwwfHx8MA%3D%3D",
    imageAlt:
      "Tall slender porcelain bottle with natural clay textured body and cork stopper.",
  },
  {
    id: 2,
    name: "Nomad Tumbler",
    href: "#",
    price: "$35",
    color: "Black",
    imageSrc:
      "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Ym9va3xlbnwwfHwwfHx8MA%3D%3D",
    imageAlt:
      "Olive drab green insulated bottle with flared screw lid and flat top.",
  },
  {
    id: 3,
    name: "Focus Paper Refill",
    href: "#",
    price: "$89",
    color: "Black",
    imageSrc:
      "https://plus.unsplash.com/premium_photo-1664006988924-16f386bcd40e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8Ym9va3xlbnwwfHwwfHx8MA%3D%3D",
    imageAlt:
      "Person using a pen to cross a task off a productivity paper card.",
  },
  {
    id: 4,
    name: "Machined Mechanical Pencil",
    href: "#",
    price: "$35",
    color: "Black",
    imageSrc:
      "https://images.unsplash.com/photo-1577627444534-b38e16c9d796?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDd8fGJvb2t8ZW58MHx8MHx8fDA%3D",
    imageAlt:
      "Hand holding black machined steel mechanical pencil with brass tip and top.",
  },
  {
    id: 5,
    name: "Basic Tee",
    href: "#",
    imageSrc:
      "https://images.unsplash.com/photo-1515666991427-9b0f67becfa1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjgwfHxib29rfGVufDB8fDB8fHww",
    imageAlt: "Front of men's Basic Tee in black.",
    price: "$35",
    color: "Black",
  },
  // More products...
];

const Home: React.FC = () => {
  const [products, setProducts] = useState<BookType[]>([]);
  const { token, removeToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchAllBooks = async () => {
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      const { data } = await api.get("/api/v1/books", {
        headers,
      });
      console.log({ data });
      setProducts(data.content);
    } catch (error) {
      toast.error("error");
      if (error.status === 403) {
        removeToken();
        navigate("/login", { state: { from: location }, replace: true });
      }
      console.log({ error });
    }
  };

  useEffect(() => {
    fetchAllBooks();
  }, []);

  return (
    <div>
      <Hero />
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
          {/* <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            All Books
          </h2> */}

          <SectionHeading title="Books list" />

          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-4">
            {products.map((product) => (
              <BookCard
                key={product.id}
                book={product}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
