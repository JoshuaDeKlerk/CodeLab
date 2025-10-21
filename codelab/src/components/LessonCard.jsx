import { Link } from "react-router-dom";
import "../stylesheets/LessonCard.css";
import lockIcon from "../assets/icons/lock.svg";

// Svg import
const techSvgs = import.meta.glob("../assets/cards/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

// Gets the badge URL from the techSvgs map
function getBadgeUrl(badge) {
  const lower = String(badge || "").toLowerCase();
  const exact = `../assets/tech/${lower}.svg`;
  if (techSvgs[exact]) return techSvgs[exact];

  const found = Object.keys(techSvgs).find(k =>
    k.toLowerCase().endsWith(`/${lower}.svg`)
  );
  if (found) return techSvgs[found];

  return undefined;
}

// Lesson Card Component
export default function LessonCard({ card }) {
  const stepsDone = Number(card.stepsDone ?? 0);
  const stepsTotal = Math.max(1, Number(card.stepsTotal ?? 1));
  const percent = Math.min(100, Math.round((stepsDone / stepsTotal) * 100));
  const badgeUrl = card?.badge ? getBadgeUrl(card.badge) : undefined;

  return (
    <div className="lesson-card">
      <div className="lesson-gloss" aria-hidden />

        {/* Badge in the background */}
        {badgeUrl && (
            <div
                className="lesson-watermark"
                style={{
                position: "absolute",
                right: "10px",
                top: "50%",           
                transform: "translateY(-50%)", 
                width: 150,
                height: 150,
                background: `url("${badgeUrl}") center / contain no-repeat`,
                pointerEvents: "none",
                opacity: 0.2,
                zIndex: 1
                }}
                aria-hidden
            />
        )}

      <div className="lesson-body">
        <div className="lesson-head">
          <div className="lesson-title">{card.title}</div>
          <div className="xp-tag">{card.xpTotal}XP In Total</div>
        </div>
        <div className="lesson-copy">
          <div className="lesson-subtitle">{card.subtitle}</div>
          {card.text && <p className="lesson-text">{card.text}</p>}
        </div>


        <div className="lesson-cta-row">
          <Link
            to={`/app/exercise/${card.id}`}
            className="btn-primary"
            style={{ background: card.accent || "#4DA3FF" }}
          >
            {stepsDone > 0 ? "Continue" : "Get Started"}
          </Link>

          <div className="progress-wrap">
            <div className="progress-meta">
              <span className="label">Progress</span>
              <span className="value">{stepsDone}/{stepsTotal}</span>
            </div>

            <div
              className="progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
            >
              <div
                className="progress-fill"
                data-pct={percent}
                style={{
                  width: `${percent}%`,
                  background:
                    "linear-gradient(90deg, #2CC1D0 0%, #2CC1D0 58%, #48D08E 100%)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Locked Lesson Card Component
export function LockedLessonCard({ card }) {
  const badgeUrl = card?.badge ? getBadgeUrl(card.badge) : null;
  const stepsDone = 0;
  const stepsTotal = Math.max(1, Number(card.stepsTotal ?? 10));

  return (
    <div className="lesson-card is-locked">
      <div className="lesson-gloss" aria-hidden />

      {badgeUrl && (
        <div
          className="lesson-watermark"
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            width: 150,
            height: 150,
            background: `url("${badgeUrl}") center / contain no-repeat`,
            pointerEvents: "none",
            opacity: 0.2,
            zIndex: 1
          }}
          aria-hidden
        />
      )}

      <div className="lesson-body">
        <div className="lesson-head">
          <div className="lesson-title">{card.title}</div>
          <div className="xp-tag">{card.xpTotal}XP In Total</div>
        </div>

        <div className="lesson-copy">
          <div className="lesson-subtitle">{card.subtitle}</div>
          {card.text && <p className="lesson-text">{card.text}</p>}
        </div>

        <div className="lesson-cta-row">
          <button className="btn-disabled" disabled>Get Started</button>
          <div className="progress-wrap">
            <div className="progress-meta">
              <span className="label">Progress</span>
              <span className="value">{stepsDone}/{stepsTotal}</span>
            </div>
            <div className="progress muted">
              <div className="progress-fill" style={{ width: "0%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* centered overlay */}
      <div className="lock-banner-overlay">
        <img className="lock-banner-icon" src={lockIcon} alt="" aria-hidden />
        <span className="lock-banner-text">LEVEL {card.lockedUntilLevel} REQUIRED</span>
      </div>
    </div>
  );
}

