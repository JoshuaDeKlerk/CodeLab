import cssIcon from "../assets/tech/css.svg";
import htmlIcon from "../assets/tech/html.svg";
import jsIcon from "../assets/tech/js.svg";
import "../stylesheets/TechBadges.css";

const MAP = { css: cssIcon, html: htmlIcon, js: jsIcon };

export default function TechIcon({ kind = "js", size = 28 }) {
  const key = String(kind).toLowerCase();
  const src = MAP[key] || jsIcon;

  return (
    <img
      className="tech-svg"
      src={src}
      alt={key.toUpperCase()}
      style={{ "--tech-size": `${size}px` }}
    />
  );
}
