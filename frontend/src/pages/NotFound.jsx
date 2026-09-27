import React from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { PageHeader, EmptyState, Button } from '../components/ui';

export default function NotFound() {
  return (
    <AuthLayout>
      <PageHeader
        breadcrumbs={[{ label: 'Home', href: '/login' }, { label: 'Not found' }]}
        title="404 — Page not found"
      />
      <EmptyState
        message="The requested page could not be found. Check the URL or return to sign in."
        actionComponent={
          <Link to="/login">
            <Button variant="primary">
              Return to sign in
            </Button>
          </Link>
        }
      />
    </AuthLayout>
  );
}
