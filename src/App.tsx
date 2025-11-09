import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/LoginPage/Login";

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<div>Home Page</div>} />
        <Route path="/Login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
