import React from 'react';
import StaffLayout from '../../layouts/StaffLayout';
import { PageHeader, EmptyState } from '../../components/ui';

export default function ApplicationsList() {
  return (
    <StaffLayout role="admin">
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Applications' }]}
        title="All applications"
      />
      <EmptyState
        message="No candidate applications submitted yet. Applications submitted by candidates will appear here for screening, review, and board scheduling."
      />
    </StaffLayout>
  );
}
