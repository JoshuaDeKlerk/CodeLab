import { BrowserRouter, Routes, Route } from "react-router-dom";
// Components
import TopNav from "./components/TopNav";
import Protected from "./components/Protected";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Tracks from "./pages/Tracks";
import Exercise from "./pages/Exercise";
import Dashboard from "./pages/Dashboard";
import StyleGuide from "./pages/StyleGuide";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg text-text">
        <TopNav />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/style" element={<StyleGuide />} />

            <Route element={<Protected />}>
              <Route path="/app/tracks" element={<Tracks />} />
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
