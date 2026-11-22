import { useEffect, useRef } from 'react';
import { createLabEngine } from '../three/lab';
import { CROSS_VIDEO } from '../data/experiments';

export default function Scene({ engineRef, onOpenExperiment }) {
  const canvasRef = useRef(null);
  const labelsRef = useRef(null);
  const titleRef = useRef(null);
  const tickRef = useRef(null);
  const ruleRef = useRef(null);
  const crossRef = useRef(null);
  const videoRef = useRef(null);

  // évite de réinitialiser le moteur si la callback change d'identité
  const cbRef = useRef(onOpenExperiment);
  cbRef.current = onOpenExperiment;

  useEffect(() => {
    const engine = createLabEngine({
      canvas: canvasRef.current,
      labelsEl: labelsRef.current,
      titleEl: titleRef.current,
      tickEl: tickRef.current,
      ruleEl: ruleRef.current,
      crossEl: crossRef.current,
      crossVid: videoRef.current,
      onOpenExperiment: (idx) => cbRef.current?.(idx)
    });

    engineRef.current = engine;
    engine.start();

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <canvas id="gl" ref={canvasRef} />

      <div id="labels" ref={labelsRef} />

      <div id="title" ref={titleRef} />
      <div id="rule" ref={ruleRef}>
        <div id="tick" ref={tickRef} />
      </div>

      <div id="cross" ref={crossRef}>
        <video
          id="crossVid"
          ref={videoRef}
          src={CROSS_VIDEO}
          muted
          loop
          playsInline
          crossOrigin="anonymous"
          autoPlay
        />
      </div>
    </>
  );
}