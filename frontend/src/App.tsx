import { BrowserRouter as Router } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppRoutes from "./Routes/AppRoutes";

type ThemeMode = "light" | "dark";

function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const storedTheme = localStorage.getItem("visualnest-theme");
    return storedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("visualnest-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <Router>  
      <Navbar />
      <AppRoutes />

      <Footer theme={theme} onToggleTheme={toggleTheme} />
    </Router>
  );
}

export default App;
