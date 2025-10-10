import { Link } from "react-router-dom";
export default function NotFound(){
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-extrabold mb-3">404</h1>
      <p className="text-subtext">Page not found.</p>
      <Link to="/" className="mt-4 inline-block text-accent">Go home →</Link>
    </div>
  );
}
