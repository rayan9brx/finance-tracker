import { useEffect, useState } from "react";

function App() {
  const [backendMessage, setBackendMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:8080/api/health")
      .then((response) => response.text())
      .then((data) => setBackendMessage(data))
      .catch(() => setBackendMessage("Could not connect to backend"));
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h1>Personal Finance Tracker</h1>
      <p>Frontend is running.</p>
      <p>Backend message: {backendMessage}</p>
    </div>
  );
}

export default App;