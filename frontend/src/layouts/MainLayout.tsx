import { Outlet } from "react-router-dom";
// import Header from '../components/common/Header';
import Footer from "../components/common/Footer";

const MainLayout = () => (
  <div className="min-h-screen flex flex-col">
    {/* <Header /> */}
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);
