// EmptyState component
import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={32} />
      </div>
      <p className="empty-state-title">{title || 'Nothing here yet'}</p>
      <p className="empty-state-text">{text || 'Get started by adding your first item.'}</p>
      {action && (
        <div style={{ marginTop: 8 }}>
          {action}
        </div>
      )}
    </div>
  );
}
