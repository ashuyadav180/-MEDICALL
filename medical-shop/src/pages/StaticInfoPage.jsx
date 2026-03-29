import React from 'react';

function StaticInfoPage({ title, body }) {
  return (
    <div className="main-content">
      <div className="form-card" style={{ maxWidth: '780px', margin: '0 auto' }}>
        <h1 style={{ marginTop: 0, marginBottom: '14px', color: 'var(--green-dark)' }}>{title}</h1>
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.8 }}>{body}</p>
      </div>
    </div>
  );
}

export default StaticInfoPage;
