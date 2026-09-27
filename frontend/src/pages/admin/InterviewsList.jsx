import React from 'react';
import StaffLayout from '../../layouts/StaffLayout';
import { PageHeader, EmptyState } from '../../components/ui';

export default function InterviewsList() {
  return (
    <StaffLayout role="admin">
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Interviews' }]}
        title="Interviews"
      />
      <EmptyState
        message="No interview boards scheduled yet. Shortlisted candidates can be assigned to interview boards from the application review screen."
      />
    </StaffLayout>
  );
}
