import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StaffLayout from '../../layouts/StaffLayout';
import { PageHeader, Panel, Button, Banner } from '../../components/ui';
import { getAdminSummaryApi } from '../../lib/api';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      try {
        const data = await getAdminSummaryApi();
        if (isMounted) {
          setSummary(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <StaffLayout role="admin">
      <PageHeader
        breadcrumbs={[{ label: 'Administration' }, { label: 'Dashboard' }]}
        title="Dashboard"
        actions={
          <Link to="/admin/advertisements/new">
            <Button variant="primary">
              Create advertisement
            </Button>
          </Link>
        }
      />

      {error && <Banner variant="bad" message={error} className="mb-6" />}

      {/* Summary Counts Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Panel title="Draft advertisements">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-text tabular-nums">
              {loading ? '—' : summary?.drafts ?? 0}
            </span>
            <span className="text-xs text-muted">Pending publication</span>
          </div>
        </Panel>

        <Panel title="Published advertisements">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-ink tabular-nums">
              {loading ? '—' : summary?.published ?? 0}
            </span>
            <span className="text-xs text-muted">Active for applicants</span>
          </div>
        </Panel>

        <Panel title="Closed advertisements">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-muted tabular-nums">
              {loading ? '—' : summary?.closed ?? 0}
            </span>
            <span className="text-xs text-muted">Past closing date</span>
          </div>
        </Panel>
      </div>
    </StaffLayout>
  );
}
