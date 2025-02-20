import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AlbumCarousel from "./components/AlbumCarousel";
import SongList from "./components/SongStats";
import "./styling/Styles.css";
import Home from "./pages/Home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
