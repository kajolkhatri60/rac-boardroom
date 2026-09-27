import React from 'react';
import StaffLayout from '../../layouts/StaffLayout';
import { PageHeader, EmptyState } from '../../components/ui';

export default function BoardMyInterviews() {
  return (
    <StaffLayout role="board" userName="Dr. K. S. Rao" userRole="Board Chairman">
      <PageHeader
        breadcrumbs={[{ label: 'Board' }, { label: 'My interviews' }]}
        title="My interviews"
      />
      <EmptyState
        message="No interviews scheduled for your board yet. Scheduled sessions, candidate dossiers, and room access links will appear here."
      />
    </StaffLayout>
  );
}
