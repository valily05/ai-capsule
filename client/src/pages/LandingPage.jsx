import { Link } from "react-router-dom";
import {
  ArrowRight,
  Folder,
  Layers,
  Search,
} from "lucide-react";
import { Brand, BrandMark } from "../components/Brand";

const currentYear = new Date().getFullYear();

const benefits = [
  {
    icon: Layers,
    number: "01",
    title: "Save",
    description: "Keep your best prompts together, ready when your next idea arrives.",
    tone: "violet",
  },
  {
    icon: Folder,
    number: "02",
    title: "Organise",
    description: "Group prompts by project and category so your library stays useful.",
    tone: "blue",
  },
  {
    icon: Search,
    number: "03",
    title: "Rediscover",
    description: "Search your saved work and bring a great prompt back in seconds.",
    tone: "coral",
  },
];

function WorkflowVisual() {
  return (
    <div className="workflow-visual" aria-label="Save, organise and rediscover prompts">
      <div className="workflow-track" aria-hidden="true">
        <span className="workflow-particle" />
      </div>
      <div className="workflow-node workflow-node-left" aria-hidden="true">
        <Layers size={21} />
      </div>
      <div className="workflow-node workflow-node-center" aria-hidden="true">
        <BrandMark large />
      </div>
      <div className="workflow-node workflow-node-right" aria-hidden="true">
        <Folder size={21} />
      </div>
      <span className="workflow-label workflow-label-left">Capture</span>
      <span className="workflow-label workflow-label-center">AI Capsule</span>
      <span className="workflow-label workflow-label-right">Organise</span>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="site-header">
        <nav className="site-nav page-width" aria-label="Main navigation">
          <Brand />
          <Link to="/login" className="nav-login">
            Log in
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero-section page-width">
          <div className="hero-glow hero-glow-one" aria-hidden="true" />
          <div className="hero-glow hero-glow-two" aria-hidden="true" />
          <div className="hero-copy-block">
            <h1>
              Never lose a<br className="desktop-break" /> great prompt
              <span className="gradient-text"> again.</span>
            </h1>
            <p className="hero-description">
              Your personal space to save, organise, and rediscover the prompts
              that make your AI workflow better.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="button button-primary">
                Start building your capsule <ArrowRight size={17} />
              </Link>
            </div>
          </div>

          <WorkflowVisual />

          <div className="hero-caption">
            A quieter place for your best ideas
          </div>
        </section>

        <section className="benefits-section page-width" aria-labelledby="benefits-title">
          <div className="section-heading">
            <p className="section-kicker">A little more clarity</p>
            <h2 id="benefits-title">Good prompts deserve a home.</h2>
            <p>Save the useful ones. Find them when it matters.</p>
          </div>
          <div className="benefit-grid">
            {benefits.map(({ icon: Icon, number, title, description, tone }) => (
              <article className={`benefit-card tone-${tone}`} key={title}>
                <div className="benefit-card-top">
                  <span className="benefit-icon"><Icon size={20} /></span>
                  <span className="benefit-number">{number}</span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="closing-section page-width">
          <div className="closing-card">
            <div className="closing-orb closing-orb-blue" aria-hidden="true" />
            <div className="closing-orb closing-orb-pink" aria-hidden="true" />
            <div className="closing-content">
              <span className="closing-icon"><BrandMark small /></span>
              <p className="section-kicker">Your next great idea starts here</p>
              <h2>Your best prompts deserve a home.</h2>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer page-width">
        <Brand compact />
        <span>Keep the good ideas close.</span>
        <span>© {currentYear} AI Capsule</span>
      </footer>
    </div>
  );
}

export default LandingPage;
