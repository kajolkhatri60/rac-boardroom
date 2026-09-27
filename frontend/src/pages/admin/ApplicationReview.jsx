import React from 'react';
import { useParams } from 'react-router-dom';
import StaffLayout from '../../layouts/StaffLayout';
import { PageHeader, EmptyState } from '../../components/ui';

export default function ApplicationReview() {
  const { id } = useParams();

  return (
    <StaffLayout role="admin">
      <PageHeader
        breadcrumbs={[
          { label: 'Applications', href: '/admin/applications' },
          { label: id || 'Review' },
        ]}
        title={`Application review ${id ? `— ${id}` : ''}`}
      />
      <EmptyState
        message="Application dossier and screening register are being prepared. Candidate qualifications and AI-assisted screening verification will appear here when an application is selected."
      />
    </StaffLayout>
  );
}
