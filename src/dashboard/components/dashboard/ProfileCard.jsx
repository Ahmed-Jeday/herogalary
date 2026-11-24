export default function ProfileCard({ user, onClick }) {
  if (!user) return null;
  return (
    <button className="hv-profile-mini" onClick={onClick}>
      <span className="hv-avatar">{user.name.charAt(0).toUpperCase()}</span>
      <span>
        <span className="hv-profile-mini-name">{user.name}</span>
        <br />
        <span className="hv-profile-mini-handle">{user.handle}</span>
      </span>
    </button>
  );
}
