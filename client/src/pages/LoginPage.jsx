
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

function LoginPage() {
  const handleGitHubLogin = () => {
    window.location.href = "/auth/github";
  };

  return (
    <div className="landing-page">
      <nav className="navbar">
        <Link to="/" className="brand">
          <Sparkles size={23} />
          <span>AI Capsule</span>
        </Link>
      </nav>

      <main className="login-container">
        <div className="login-card">
          <Link to="/" className="back-link">
            <ArrowLeft size={16} /> Back to home
          </Link>

          <Sparkles size={35} className="login-icon" />

          <h1>Welcome to AI Capsule</h1>
          <p>
            Sign in with your GitHub account to access
            your personal AI prompt library.
          </p>

          <button
            className="github-button"
            onClick={handleGitHubLogin}
          >
<span style={{ fontSize: "20px", fontWeight: "bold" }}>GH</span>            Continue with GitHub
          </button>

          <small>Your prompts are private and secure.</small>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
