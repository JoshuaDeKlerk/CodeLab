import { BrowserRouter, Routes, Route } from "react-router-dom";

import TopNav from "./components/TopNav";
import Protected from "./components/Protected";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StyleGuide from "./pages/StyleGuide";
import WorldMap from "./pages/WorldMap";
import NotFound from "./pages/NotFound";
import LessonShell from "./pages/LessonShell";
import ModuleReader from "./components/ModuleReader"; 

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

            {/* Authenticated */}
            <Route element={<Protected />}>
              <Route path="/app/map" element={<WorldMap />} />
              <Route path="/app/lesson/:lessonId" element={<LessonShell />} />
              <Route
                path="/app/lesson/:lessonId/module/:moduleId"
                element={<ModuleReader />}
              />
              <Route path="/app" element={<WorldMap />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
