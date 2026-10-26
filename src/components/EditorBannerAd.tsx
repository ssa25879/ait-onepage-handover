import { useEffect, useState, type RefObject } from 'react';
import BannerAd from './BannerAd.tsx';

function EditorBannerAd({ contentRef }: { contentRef: RefObject<HTMLDivElement | null> }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const viewport = window.visualViewport;
    let frame = 0;
    function measure() {
      const screen = content!.parentElement;
      if (!screen) return;
      const style = getComputedStyle(screen);
      const viewportHeight = document.documentElement.clientHeight;
      const focusedInput = content!.contains(document.activeElement)
        && document.activeElement?.matches('input, textarea');
      const keyboardOpen = viewport && viewportHeight - viewport.height > 100;
      const contentHeight = content!.scrollHeight
        + Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
      setVisible(!focusedInput && !keyboardOpen && contentHeight > viewportHeight);
    }
    function scheduleMeasure() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(content);
    window.addEventListener('resize', scheduleMeasure);
    viewport?.addEventListener('resize', scheduleMeasure);
    content.addEventListener('focusin', scheduleMeasure);
    content.addEventListener('focusout', scheduleMeasure);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      viewport?.removeEventListener('resize', scheduleMeasure);
      content.removeEventListener('focusin', scheduleMeasure);
      content.removeEventListener('focusout', scheduleMeasure);
    };
  }, [contentRef]);

  return visible ? <BannerAd className="editor-ad-placement" /> : null;
}

export default EditorBannerAd;
