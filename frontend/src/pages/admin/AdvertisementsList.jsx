import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StaffLayout from '../../layouts/StaffLayout';
import { PageHeader, Table, StatusTag, Button, Banner } from '../../components/ui';
import { getPostsApi } from '../../lib/api';

export default function AdvertisementsList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPosts = async () => {
      try {
        const data = await getPostsApi();
        if (isMounted) {
          setPosts(data);
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

    fetchPosts();
    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  const columns = [
    {
      header: 'Advt. No.',
      accessor: 'advt_no',
      width: '130px',
      render: (val, row) => (
        <Link
          to={`/admin/advertisements/${row.id}`}
          className="font-mono text-xs font-semibold text-ink hover:underline"
        >
          {val}
        </Link>
      ),
    },
    {
      header: 'Post title',
      accessor: 'title',
      render: (val, row) => (
        <Link
          to={`/admin/advertisements/${row.id}`}
          className="font-medium text-text hover:text-ink transition-colors"
        >
          {val}
        </Link>
      ),
    },
    { header: 'Discipline', accessor: 'discipline' },
    { header: 'Grade', accessor: 'grade', width: '80px', align: 'center' },
    { header: 'Vacancies', accessor: 'vacancies', align: 'right', width: '90px' },
    {
      header: 'Closing date',
      accessor: 'closing_date',
      align: 'right',
      render: (val) => formatDate(val),
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      width: '120px',
      render: (val) => <StatusTag status={val} />,
    },
    {
      header: 'Action',
      align: 'right',
      width: '110px',
      render: (_, row) => (
        <Link to={`/admin/advertisements/${row.id}`}>
          <Button variant="secondary" size="sm">
            View
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <StaffLayout role="admin">
      <PageHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Advertisements' }]}
        title="Advertisements"
        actions={
          <Link to="/admin/advertisements/new">
            <Button variant="primary">
              Create advertisement
            </Button>
          </Link>
        }
      />

      {error && <Banner variant="bad" message={error} className="mb-6" />}

      <Table
        columns={columns}
        data={posts}
        loading={loading}
        emptyMessage="No advertisements created yet. Draft or publish a recruitment notification to begin receiving applications."
        emptyAction={
          <Link to="/admin/advertisements/new">
            <Button variant="primary">
              Create advertisement
            </Button>
          </Link>
        }
      />
    </StaffLayout>
  );
}
