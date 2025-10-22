import { BrowserRouter, Routes, Route } from "react-router-dom";

// Components
import TopNav from "./components/TopNav";
import Protected from "./components/Protected";

// Routes
import AdminRoute from "./routes/AdminRoute"; 

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Exercise from "./pages/Exercise";
import Dashboard from "./pages/Dashboard";
import StyleGuide from "./pages/StyleGuide";
import NotFound from "./pages/NotFound";
import WorldMap from "./pages/WorldMap";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg text-text">
        <TopNav />
        <main className="mx-auto max-w-8xl px-20 py-8">
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/style" element={<StyleGuide />} />

            {/* Authenticated (non-admin) app routes */}
            <Route element={<Protected />}>
              <Route path="/app/map" element={<WorldMap />} />
              <Route path="/app/exercise/:id" element={<Exercise />} />
              <Route path="/app/dashboard" element={<Dashboard />} />
            </Route>

            {/* Admin-only routes (own guard; no need to nest under Protected) */}
            <Route path="/app/admin" element={<AdminRoute />}>
              <Route index element={<AdminDashboard />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
