interface PageHeaderProps {
  title: string;
  description?: string;
  onBack?: () => void;
}

function PageHeader({ title, description, onBack }: PageHeaderProps) {
  return (
    <header className="page-header">
      {onBack && (
        <button className="text-button page-back" type="button" onClick={onBack}>
          이전 화면
        </button>
      )}
      <p className="eyebrow">인계한장</p>
      <h1 className="page-title">{title}</h1>
      {description && <p className="page-description">{description}</p>}
    </header>
  );
}

export default PageHeader;
