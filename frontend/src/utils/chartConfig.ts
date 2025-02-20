import { Chart } from "chart.js";
import {
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register required components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Optional: Configure default settings
Chart.defaults.font.family = "Inter, sans-serif";
Chart.defaults.color = "#6b7280";
