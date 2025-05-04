import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import CadastroFanPage from "./pages/CadastroFanPage";
import FanInsightPage from "./pages/FanInsightPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroFanPage />} />
        <Route path="/FanInsight" element={<FanInsightPage />} />
      </Routes>
    </Router>
  );
}

export default App;