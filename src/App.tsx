import { ToastContainer } from "react-toastify";
import "./App.css";
import RegistrationForm from "./ui/users/forms/RegisterationForm";
import Message from "./ui/Message";
import AccountActivation from "./ui/AccountActivation";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginForm from "./ui/users/forms/LoginForm";
import ContextProvider from "./contextApi/ContextApi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from "./components/NavBar";
import { Hero } from "./components/Hero";
import Home from "./components/Home";
import { MyBooks } from "./components/MyBooks";
import { MyBorrowedBooks } from "./components/MyBorrowedBooks";

function App() {
  const queryClient = new QueryClient();
  return (
    <>
      <ToastContainer />
      <QueryClientProvider client={queryClient}>
        <ContextProvider>
          <Router>
            <Navbar />
            <Routes>
              <Route path="/activate-account" element={<AccountActivation />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegistrationForm />} />
              <Route path="/message" element={<Message />} />
              <Route path="/my-books" element={<MyBooks />} />
              <Route path="/borrowed-books" element={<MyBorrowedBooks  />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Router>
        </ContextProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;
