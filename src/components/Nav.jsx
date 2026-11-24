export default function Nav({ onLab, onGrid, onAbout, onTalk, onProfile }) {
  return (
    <>
      <div className="nav sm lnk" id="n-lab" onClick={onLab}>Home</div>
      <div className="nav sm lnk" id="n-list" onClick={onGrid}>LIST/GRID</div>
      <div className="nav sm lnk" id="n-about" onClick={onAbout}>commic</div>
      <div className="nav sm lnk" id="n-talk" onClick={onTalk}>LET'S TALK</div>
      <button className="nav sm lnk" id="n-profile" type="button" onClick={onProfile}>PROFILE</button>
    </>
  );
}