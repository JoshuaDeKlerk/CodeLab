import { BrowserRouter, Routes, Route } from "react-router-dom";
// Components
import TopNav from "./components/TopNav";
import Protected from "./components/Protected";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Exercise from "./pages/Exercise";
import Dashboard from "./pages/Dashboard";
import StyleGuide from "./pages/StyleGuide";
import NotFound from "./pages/NotFound";
import WorldMap from "./pages/WorldMap";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg text-text">
        <TopNav />
        <main className="mx-auto max-w-8xl px-20 py-8">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/style" element={<StyleGuide />} />

            <Route element={<Protected />}>
              <Route path="/app/map" element={<WorldMap />} />
              <Route path="/app/exercise/:id" element={<Exercise />} />
              <Route path="/app/dashboard" element={<Dashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
