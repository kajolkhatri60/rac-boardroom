import React from 'react';
import { useParams } from 'react-router-dom';
import StaffLayout from '../../layouts/StaffLayout';
import { PageHeader, EmptyState } from '../../components/ui';

export default function PreInterview() {
  const { id } = useParams();

  return (
    <StaffLayout role="board">
      <PageHeader
        breadcrumbs={[
          { label: 'My interviews', href: '/board' },
          { label: `Session ${id || ''}` },
        ]}
        title={`Pre-interview dossier — Session ${id || ''}`}
      />
      <EmptyState
        message="No interview dossier available for this session. Candidate dossiers and expertise profile confirmation will be unlocked here prior to session start."
      />
    </StaffLayout>
  );
}
