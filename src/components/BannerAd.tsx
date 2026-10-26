import { useEffect, useRef, useState } from 'react';
import { attachBannerAd, bannerAdGroupId } from '../lib/bannerAds.ts';

function BannerAd({ className = '' }: { className?: string }) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'visible' | 'hidden'>('loading');

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !bannerAdGroupId) return;

    return attachBannerAd(target, {
      onVisible: () => setStatus('visible'),
      onUnavailable: () => setStatus('hidden'),
    });
  }, []);

  if (!bannerAdGroupId || status === 'hidden') return null;

  return (
    <div
      ref={targetRef}
      className={`banner-slot${status === 'visible' ? ' banner-slot-visible' : ''} ${className}`}
      aria-label={status === 'visible' ? '광고' : undefined}
      aria-hidden={status !== 'visible'}
      role={status === 'visible' ? 'region' : undefined}
    />
  );
}

export default BannerAd;
