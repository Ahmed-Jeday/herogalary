import { useEffect, useState } from "react";
import { dashboardApi } from "../../api/dashboardApi";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi.getCurrentUser().then((u) => {
      setUser(u);
      setForm({ name: u.name, bio: u.bio });
    });
  }, []);

  const set = (k) => (e) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await dashboardApi.updateProfile(form);
      setUser(updated);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!user) return <p className="hv-loading">Loading profile…</p>;

  return (
    <div className="hv-profile">
      <div className="hv-profile-head">
        <span className="hv-avatar">{user.name.charAt(0).toUpperCase()}</span>
        <div>
          <h2>{user.name}</h2>
          <p>{user.handle} · Member since {user.memberSince}</p>
        </div>
      </div>

      <form className="hv-form" onSubmit={submit}>
        <label htmlFor="hv-name">Display name</label>
        <input id="hv-name" value={form.name} onChange={set("name")} maxLength={30} />

        <label htmlFor="hv-bio">Bio</label>
        <textarea id="hv-bio" value={form.bio} onChange={set("bio")} maxLength={220} />

        {error && <p className="hv-error">{error}</p>}

        <div className="hv-form-actions">
          <button className="hv-btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="hv-saved">Saved!</span>}
        </div>
      </form>
    </div>
  );
}
