
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, ShieldCheck, Library } from "lucide-react";

function LandingPage() {
  return (
    <div className="landing-page">

      <nav className="navbar">
        <div className="brand">
          <Sparkles size={23} />
          <span>AI Capsule</span>
        </div>

        <Link to="/login" className="nav-login">
          Sign in <ArrowRight size={16} />
        </Link>
      </nav>

      <main className="hero">
        <div className="hero-content">

          <div className="eyebrow">
            YOUR PERSONAL AI PROMPT LIBRARY
          </div>

          <h1>
            Never lose a
            <span> great prompt again.</span>
          </h1>

          <p>
            Save, organise and improve your favourite AI prompts
            in one private workspace. Keep every useful idea
            ready for your next project.
          </p>

          <Link to="/login" className="primary-button">
            Get Started <ArrowRight size={18} />
          </Link>

          <div className="hero-features">
            <div>
              <Library size={20} />
              <span>Organised prompts</span>
            </div>

            <div>
              <ShieldCheck size={20} />
              <span>Private workspace</span>
            </div>
          </div>

        </div>

        <div className="hero-visual">
          <div className="preview-card">
            <div className="preview-header">
              <Sparkles size={20} />
              <span>My Prompt Library</span>
            </div>

            <div className="preview-item">
              <span className="tag">CODING</span>
              <h3>Debug my React application</h3>
              <p>Version 2 · Improved</p>
            </div>

            <div className="preview-item">
              <span className="tag research">RESEARCH</span>
              <h3>Summarise academic papers</h3>
              <p>Version 1 · Reviewed</p>
            </div>

            <div className="preview-item">
              <span className="tag writing">WRITING</span>
              <h3>Improve professional emails</h3>
              <p>Version 3 · Improved</p>
            </div>
          </div>
        </div>

      </main>

      <footer>
        AI Capsule © 2026. Your ideas, safely stored.
      </footer>

    </div>
  );
}

export default LandingPage;
