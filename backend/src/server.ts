import express from "express";
import cors from "cors";
import albumsRouter from "./routes/albums.js";
import songsRouter from "./routes/songs.js";
import reviewRoutes from "./routes/reviews.js";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler.js";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const imagesPath = path.join(__dirname, "./images");
app.use("/images", express.static(imagesPath));

app.use(cors());
app.use(express.json());

app.use("/api/albums", albumsRouter);
app.use("/api/songs", songsRouter);
app.use("/api/reviews", reviewRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
