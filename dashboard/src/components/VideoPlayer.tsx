import { useEffect, useRef, useState } from 'react';
import { TestArtifact } from '../types';

interface Props {
  video: TestArtifact;
  poster?: string;
  /** Auto-play muted on mount (browsers allow muted autoplay). */
  autoPlay?: boolean;
  className?: string;
}

/**
 * Wraps the native <video> element with:
 *  - graceful fallback when the file doesn't exist on disk yet
 *  - speed selector (1x / 1.5x / 2x)
 *  - poster image (e.g. failure screenshot)
 */
export const VideoPlayer = ({ video, poster, autoPlay = false, className }: Props) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setAvailable(null);
    fetch(video.url, { method: 'HEAD' })
      .then((r) => {
        if (!cancelled) setAvailable(r.ok);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [video.url]);

  useEffect(() => {
    if (ref.current) ref.current.playbackRate = speed;
  }, [speed]);

  if (available === false) {
    return (
      <div className={`video-empty ${className ?? ''}`}>
        <div className="video-empty-icon">▶</div>
        <p>
          No recording at <code>{video.url}</code>
        </p>
        <p className="subtle">
          Videos appear here after running <code>npm test</code>. Make sure{' '}
          <code>video: 'on'</code> is enabled in <code>playwright.config.ts</code>.
        </p>
      </div>
    );
  }

  return (
    <div className={`video-wrap ${className ?? ''}`}>
      <video
        ref={ref}
        src={video.url}
        poster={poster}
        controls
        autoPlay={autoPlay}
        muted={autoPlay}
        playsInline
        preload="metadata"
      />
      <div className="video-toolbar">
        <span className="video-name">{video.name}</span>
        <div className="speed-picker" role="group" aria-label="Playback speed">
          {[1, 1.5, 2, 4].map((s) => (
            <button
              key={s}
              type="button"
              className={`speed-btn ${speed === s ? 'is-active' : ''}`}
              onClick={() => setSpeed(s)}
            >
              {s}×
            </button>
          ))}
        </div>
        <a className="video-download" href={video.url} download>
          Download
        </a>
      </div>
    </div>
  );
};
