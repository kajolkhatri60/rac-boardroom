import React from 'react';
import ApplicantLayout from '../../layouts/ApplicantLayout';
import { PageHeader, EmptyState } from '../../components/ui';

export default function ApplicantMyInterviews() {
  return (
    <ApplicantLayout>
      <PageHeader
        breadcrumbs={[{ label: 'Recruitment portal' }, { label: 'My interviews' }]}
        title="My interviews"
      />
      <EmptyState
        message="No interviews scheduled for your applications yet. Shortlisted candidates will receive interview slot details and instructions here."
      />
    </ApplicantLayout>
  );
}
