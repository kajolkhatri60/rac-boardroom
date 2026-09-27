import React from 'react';
import StaffLayout from '../../layouts/StaffLayout';
import { PageHeader, EmptyState, Button } from '../../components/ui';

export default function BoardMembers() {
  return (
    <StaffLayout role="admin">
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Board members' }]}
        title="Board members"
        actions={
          <Button variant="primary">
            Add board member
          </Button>
        }
      />
      <EmptyState
        message="No board members registered yet. Add internal scientists and external subject matter experts to constitute interview boards."
        actionLabel="Add board member"
      />
    </StaffLayout>
  );
}
