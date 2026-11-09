const SEEK_TIMEOUT_MS = 10_000;
const CURRENT_TIME_EPSILON = 0.001;

export async function seekVideoToTime(video: HTMLVideoElement, time: number): Promise<void> {
  const isAtTime = () => Math.abs(video.currentTime - time) < CURRENT_TIME_EPSILON;
  const isReadyAtTime = () => !video.seeking && video.readyState >= 2 && isAtTime();
  if (isReadyAtTime()) return;

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };
    const onSeeked = () => {
      if (!isReadyAtTime()) return;
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`the background video failed while seeking to ${time.toFixed(2)} s`));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`the background video did not reach ${time.toFixed(2)} s`));
    }, SEEK_TIMEOUT_MS);

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    try {
      video.currentTime = time;
      onSeeked();
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}
