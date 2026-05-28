import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<Index />} />
      </Routes>
    </HashRouter>
  );
}
