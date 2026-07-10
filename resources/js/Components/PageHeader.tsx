interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-accent" />
      <div>
        <p className="h-display" style={{ fontSize: 19 }}>{title}</p>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
    </div>
  );
}
