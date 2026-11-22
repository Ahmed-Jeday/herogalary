import { useEffect, useRef, useState } from 'react';
import { IMGS, proxy } from '../data/experiments';

export default function Overlay({ index, onClose }) {
  const isOpen = index !== null;
  const [shown, setShown] = useState(0);
  const blocksRef = useRef(null);

  // garde le dernier contenu affiché pendant l'anim de fermeture
  useEffect(() => {
    if (index !== null) setShown(index);
  }, [index]);

  // animation de révélation des blocs (5 x 7 = 35)
  useEffect(() => {
    if (!isOpen || !blocksRef.current) return;

    const blocks = Array.from(blocksRef.current.children);
    blocks.forEach((b) => {
      b.style.transition = 'none';
      b.style.opacity = '1';
    });

    let r1 = 0;
    let r2 = 0;
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        blocks.forEach((b) => {
          const delay = 300 + Math.random() * 700;
          b.style.transition = `opacity .45s ${delay.toFixed(0)}ms ease`;
          b.style.opacity = '0';
        });
      });
    });

    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [isOpen, shown]);

  // Échap pour fermer
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const d = IMGS[shown];

  return (
    <>
      <div
        id="overlay"
        className={isOpen ? 'on' : ''}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="ov-left">
          <img id="ov-img" src={proxy(d.id, 1100)} alt="" />
          <div className="ov-blocks" ref={blocksRef}>
            {Array.from({ length: 35 }).map((_, i) => (
              <i key={i} />
            ))}
          </div>
        </div>

        <div className="ov-right">
          <div className="ov-num">
            EXPERIMENT {String(shown + 1).padStart(2, '0')}
          </div>
          <div className="ov-name">{d.label}</div>
          <div className="ov-desc">{d.desc}</div>
        </div>
      </div>

      <div id="ov-close" className={isOpen ? 'on' : ''} onClick={onClose}>
        CLOSE
      </div>
    </>
  );
}