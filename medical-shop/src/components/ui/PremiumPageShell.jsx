import React from 'react';

function PremiumPageShell({
  eyebrow,
  title,
  description,
  stats = [],
  actions = null,
  sideContent = null,
  heroBadges = [],
  heroPanels = [],
  className = '',
  children,
}) {
  const derivedBadges = heroBadges.length
    ? heroBadges
    : stats.slice(0, 3).map((stat) => `${stat.value} ${stat.label}`);

  const derivedPanels = heroPanels.length
    ? heroPanels
    : stats.length
      ? stats.slice(0, 3).map((stat) => ({
          label: stat.label,
          value: stat.value,
        }))
      : [
          { label: 'Care flow', value: eyebrow || 'Premium journey' },
          { label: 'Interface', value: '3D motion depth' },
          { label: 'Response', value: 'Fast and clear' },
        ];

  const sceneTitle = String(title || 'Premium healthcare journey')
    .replace(/[.!?]+$/, '')
    .split(' ')
    .slice(0, 6)
    .join(' ');

  return (
    <div className={`main-content premium-page-shell ${className}`.trim()}>
      <div className="premium-page-backdrop premium-page-backdrop-one" aria-hidden="true" />
      <div className="premium-page-backdrop premium-page-backdrop-two" aria-hidden="true" />
      <div className="premium-page-backdrop premium-page-backdrop-three" aria-hidden="true" />

      <section className="premium-page-hero premium-page-animate">
        <div className="premium-page-hero-copy">
          {eyebrow && <p className="premium-page-eyebrow">{eyebrow}</p>}
          <h1 className="premium-page-title">{title}</h1>
          {description && <p className="premium-page-description">{description}</p>}

          {derivedBadges.length > 0 ? (
            <div className="premium-page-badge-row">
              {derivedBadges.map((badge) => (
                <span key={badge} className="premium-hero-chip">
                  {badge}
                </span>
              ))}
            </div>
          ) : null}

          {(actions || stats.length > 0) && (
            <div className="premium-page-hero-footer">
              {actions ? <div className="premium-page-action-row">{actions}</div> : null}
              {stats.length > 0 ? (
                <div className="premium-page-stat-row">
                  {stats.map((stat) => (
                    <article key={stat.label} className="premium-page-stat-card">
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <aside className="premium-page-hero-side">
          <div className="premium-scene-card">
            <div className="premium-scene-glow premium-scene-glow-one" aria-hidden="true" />
            <div className="premium-scene-glow premium-scene-glow-two" aria-hidden="true" />
            <div className="premium-scene-orbit premium-scene-orbit-one" aria-hidden="true" />
            <div className="premium-scene-orbit premium-scene-orbit-two" aria-hidden="true" />
            <div className="premium-scene-float premium-scene-float-top" aria-hidden="true">
              Active UI
            </div>
            <div className="premium-scene-float premium-scene-float-bottom" aria-hidden="true">
              3D depth
            </div>

            <div className="premium-scene-device">
              <div className="premium-scene-device-top">
                <div>
                  <span>{eyebrow || 'Premium care'}</span>
                  <strong>{sceneTitle}</strong>
                </div>
                <div className="premium-scene-live">
                  <i />
                  Live
                </div>
              </div>

              <div className="premium-scene-panel-grid">
                {derivedPanels.slice(0, 3).map((panel) => (
                  <article key={`${panel.label}-${panel.value}`} className="premium-scene-mini-panel">
                    <span>{panel.label}</span>
                    <strong>{panel.value}</strong>
                  </article>
                ))}
              </div>

              <div className="premium-scene-bars" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>

          {sideContent}
        </aside>
      </section>

      <div className="premium-page-body">{children}</div>
    </div>
  );
}

export default PremiumPageShell;
