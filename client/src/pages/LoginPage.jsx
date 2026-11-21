import { useState } from "react";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Brand, BrandMark } from "../components/Brand";

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get("error");

  const handleGitHubLogin = () => {
    setLoading(true);
    window.location.assign("/auth/github");
  };

  return (
    <div className="login-page">
      <header className="site-header">
        <nav className="site-nav page-width" aria-label="Main navigation">
          <Brand to="/" />
          <Link to="/" className="nav-login">
            <ArrowLeft size={16} /> Back home
          </Link>
        </nav>
      </header>

      <main className="login-main page-width">
        <div className="login-glow login-glow-a" aria-hidden="true" />
        <div className="login-glow login-glow-b" aria-hidden="true" />
        <section className="login-card" aria-labelledby="login-title">
          <BrandMark large className="login-brand-mark" />
          <p className="section-kicker">Your ideas, all in one place</p>
          <h1 id="login-title">Welcome back.</h1>
          <p className="login-description">Your prompts are waiting for you.</p>

          {oauthError && (
            <p className="login-error" role="alert">
              GitHub sign-in didn’t finish. Please try again.
            </p>
          )}

          <button
            className="button button-primary github-button"
            onClick={handleGitHubLogin}
            disabled={loading}
          >
            <span className="github-mark" aria-hidden="true">GH</span>
            {loading ? "Connecting to GitHub…" : "Continue with GitHub"}
            {!loading && <ArrowRight size={17} />}
          </button>

          <div className="login-assurance">
            <ShieldCheck size={16} />
            <span>Your library is private to your account.</span>
          </div>
        </section>
      </main>

      <footer className="login-footer page-width">
        <Brand to="/" compact />
        <span>Secure sign-in powered by GitHub</span>
      </footer>
    </div>
  );
}

export default LoginPage;
