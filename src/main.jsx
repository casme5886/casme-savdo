import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Kutilmagan xatolik bo'lganda butun sayt oq ekranga aylanib qolmasligi
// uchun — mijozga "Qayta yuklash" tugmasi ko'rsatiladi.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("Kutilmagan xatolik:", error, info);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, textAlign: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
        <p style={{ fontSize: 15, color: "#334155" }}>Kutilmagan xatolik yuz berdi / Произошла непредвиденная ошибка</p>
        <button
          onClick={() => window.location.reload()}
          style={{ background: "#e11d48", color: "#fff", border: 0, borderRadius: 12, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          Qayta yuklash / Обновить
        </button>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
