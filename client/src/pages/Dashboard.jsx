
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  LogOut,
  Sparkles,
  X,
  Save,
  BookOpen,
} from "lucide-react";
import { apiRequest } from "../services/api";

const emptyForm = {
  project_name: "",
  prompt_title: "",
  prompt_version: "v1",
  prompt_text: "",
  response_summary: "",
  category: "Coding",
  usefulness: "Good",
  reviewed: false,
  improved: false,
  screenshot_url: "",
  notes: "",
};

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    async function initialize() {
      try {
        const session = await apiRequest("/auth/me");
        setUser(session.user);

        const records = await apiRequest("/api/capsules");
        setCapsules(records);
      } catch (err) {
        if (err.message.includes("Unauthorized")) {
          navigate("/login", { replace: true });
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [navigate]);

  const filteredCapsules = capsules.filter((capsule) => {
    const query = search.toLowerCase();

    const matchesSearch = [
      capsule.prompt_title,
      capsule.project_name,
      capsule.prompt_text,
    ].some((value) =>
      (value || "").toLowerCase().includes(query)
    );

    const matchesCategory =
      filter === "All" || capsule.category === filter;

    return matchesSearch && matchesCategory;
  });

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
  }

  function openEdit(capsule) {
    setEditingId(capsule.id);

    setForm({
      project_name: capsule.project_name || "",
      prompt_title: capsule.prompt_title || "",
      prompt_version: capsule.prompt_version || "",
      prompt_text: capsule.prompt_text || "",
      response_summary: capsule.response_summary || "",
      category: capsule.category || "Coding",
      usefulness: capsule.usefulness || "Good",
      reviewed: Boolean(capsule.reviewed),
      improved: Boolean(capsule.improved),
      screenshot_url: capsule.screenshot_url || "",
      notes: capsule.notes || "",
    });

    setError("");
    setShowForm(true);
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const endpoint = editingId
        ? `/api/capsules/${editingId}`
        : "/api/capsules";

      const result = await apiRequest(endpoint, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      });

      if (editingId) {
        setCapsules((previous) =>
          previous.map((capsule) =>
            capsule.id === editingId ? result.capsule : capsule
          )
        );
      } else {
        setCapsules((previous) => [
          result.capsule,
          ...previous,
        ]);
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this prompt permanently?")) {
      return;
    }

    try {
      await apiRequest(`/api/capsules/${id}`, {
        method: "DELETE",
      });

      setCapsules((previous) =>
        previous.filter((capsule) => capsule.id !== id)
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLogout() {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
      });

      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <div className="dashboard-loading">Loading your library...</div>;
  }

  if (!user) {
    return <div className="dashboard-loading">{error || "Session unavailable."}</div>;
  }

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">
          <Sparkles size={24} />
          <span>AI Capsule</span>
        </div>

        <div className="sidebar-menu">
          <div className="sidebar-link active">
            <BookOpen size={19} />
            My Prompt Library
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="user-profile">
            <div className="user-avatar">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{user.username}</strong>
              <p>GitHub account</p>
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-top">
          <div>
            <p className="dashboard-eyebrow">YOUR WORKSPACE</p>
            <h1>My Prompt Library</h1>
            <p className="dashboard-subtitle">
              Organise, review and improve your AI prompts.
            </p>
          </div>

          <button className="add-button" onClick={openCreate}>
            <Plus size={19} />
            Add Prompt
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <p>Total Prompts</p>
            <h2>{capsules.length}</h2>
          </div>

          <div className="stat-card">
            <p>Reviewed</p>
            <h2>{capsules.filter((c) => c.reviewed).length}</h2>
          </div>

          <div className="stat-card">
            <p>Improved</p>
            <h2>{capsules.filter((c) => c.improved).length}</h2>
          </div>
        </div>

        <div className="library-toolbar">
          <div className="search-box">
            <Search size={19} />
            <input
              placeholder="Search your prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>All</option>
            <option>Coding</option>
            <option>Writing</option>
            <option>Research</option>
            <option>Study</option>
            <option>Other</option>
          </select>
        </div>

        {error && <p className="dashboard-error">{error}</p>}

        {filteredCapsules.length === 0 ? (
          <div className="empty-state">
            <Sparkles size={40} />
            <h2>No prompts found</h2>
            <p>
              {capsules.length === 0
                ? "Start building your prompt library."
                : "Try changing your search or category."}
            </p>
            {capsules.length === 0 && (
              <button className="add-button" onClick={openCreate}>
                <Plus size={18} /> Create Your First Prompt
              </button>
            )}
          </div>
        ) : (
          <div className="capsule-grid">
            {filteredCapsules.map((capsule) => (
              <div className="capsule-card" key={capsule.id}>
                <div className="capsule-card-top">
                  <span className="category-badge">
                    {capsule.category || "Other"}
                  </span>
                  <span className="capsule-version">
                    {capsule.prompt_version}
                  </span>
                </div>

                <h3>{capsule.prompt_title}</h3>
                <p className="capsule-project">
                  {capsule.project_name}
                </p>

                <p className="capsule-preview">
                  {capsule.prompt_text}
                </p>

                <div className="capsule-status">
                  {capsule.reviewed ? "Reviewed" : "Not reviewed"}
                  {" · "}
                  {capsule.improved ? "Improved" : "Not improved"}
                </div>

                <div className="capsule-actions">
                  <button onClick={() => openEdit(capsule)}>
                    <Pencil size={16} /> Edit
                  </button>
                  <button
                    className="delete-action"
                    onClick={() => handleDelete(capsule.id)}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <div className="modal-overlay">
          <div className="prompt-modal">
            <div className="modal-header">
              <div>
                <h2>{editingId ? "Edit Prompt" : "Add New Prompt"}</h2>
                <p>Save the details of your AI prompt.</p>
              </div>
              <button
                className="icon-button"
                onClick={() => setShowForm(false)}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="prompt-form">
              <div className="form-row">
                <label>
                  Project Name *
                  <input
                    name="project_name"
                    value={form.project_name}
                    onChange={updateField}
                    required
                  />
                </label>

                <label>
                  Prompt Version
                  <input
                    name="prompt_version"
                    value={form.prompt_version}
                    onChange={updateField}
                    placeholder="v1"
                  />
                </label>
              </div>

              <label>
                Prompt Title *
                <input
                  name="prompt_title"
                  value={form.prompt_title}
                  onChange={updateField}
                  required
                />
              </label>

              <label>
                Prompt Text *
                <textarea
                  name="prompt_text"
                  value={form.prompt_text}
                  onChange={updateField}
                  rows={4}
                  required
                />
              </label>

              <label>
                Response Summary
                <textarea
                  name="response_summary"
                  value={form.response_summary}
                  onChange={updateField}
                  rows={3}
                />
              </label>

              <div className="form-row">
                <label>
                  Category
                  <select
                    name="category"
                    value={form.category}
                    onChange={updateField}
                  >
                    <option>Coding</option>
                    <option>Writing</option>
                    <option>Research</option>
                    <option>Study</option>
                    <option>Other</option>
                  </select>
                </label>

                <label>
                  Usefulness
                  <select
                    name="usefulness"
                    value={form.usefulness}
                    onChange={updateField}
                  >
                    <option>Good</option>
                    <option>Needs Improvement</option>
                  </select>
                </label>
              </div>

              <div className="form-checkboxes">
                <label>
                  <input
                    type="checkbox"
                    name="reviewed"
                    checked={form.reviewed}
                    onChange={updateField}
                  />
                  Response Reviewed
                </label>

                <label>
                  <input
                    type="checkbox"
                    name="improved"
                    checked={form.improved}
                    onChange={updateField}
                  />
                  Output Improved
                </label>
              </div>

              <label>
                Screenshot Evidence URL
                <input
                  type="url"
                  name="screenshot_url"
                  value={form.screenshot_url}
                  onChange={updateField}
                  placeholder="https://..."
                />
              </label>

              <label>
                Notes
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={updateField}
                  rows={3}
                />
              </label>

              {error && <p className="dashboard-error">{error}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="add-button"
                  disabled={saving}
                >
                  <Save size={17} />
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Prompt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
