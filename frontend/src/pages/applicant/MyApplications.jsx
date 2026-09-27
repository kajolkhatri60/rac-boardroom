import React from 'react';
import ApplicantLayout from '../../layouts/ApplicantLayout';
import { PageHeader, EmptyState } from '../../components/ui';

export default function MyApplications() {
  return (
    <ApplicantLayout>
      <PageHeader
        breadcrumbs={[{ label: 'Recruitment portal' }, { label: 'My applications' }]}
        title="My applications"
      />
      <EmptyState
        message="You have not submitted any applications yet. Browse open advertisements to apply for scientific and technical vacancies."
        actionLabel="View open advertisements"
        actionHref="/applicant/advertisements"
      />
    </ApplicantLayout>
  );
}
