/** Purpose: Route composition for the Feijoa Fruit Quality ML frontend. */
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import History from "./pages/History";
import Home from "./pages/Home";
import Results from "./pages/Results";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/results" element={<Results />} />
        <Route path="/history" element={<History />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
