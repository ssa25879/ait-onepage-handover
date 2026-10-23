interface PinButtonProps {
  pinned: boolean;
  disabled: boolean;
  onClick: () => void;
}

export default function PinButton({ pinned, disabled, onClick }: PinButtonProps) {
  return (
    <button className="pin-button" type="button" aria-pressed={pinned}
      aria-label={pinned ? '고정 해제' : '고정'} disabled={disabled} onClick={onClick}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill={pinned ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 3h8l-1 7 4 4H5l4-4-1-7Z" /><path d="M12 14v7" />
      </svg>
    </button>
  );
}
