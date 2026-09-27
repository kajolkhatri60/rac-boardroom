import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ApplicantLayout from '../../layouts/ApplicantLayout';
import { PageHeader, Table, Button, Banner } from '../../components/ui';
import { getOpenPostsApi } from '../../lib/api';

export default function OpenAdvertisements() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOpenPosts = async () => {
      try {
        const data = await getOpenPostsApi();
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

    fetchOpenPosts();
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
      header: 'Post title',
      accessor: 'title',
      render: (val, row) => (
        <div>
          <Link
            to={`/applicant/advertisements/${row.id}`}
            className="font-medium text-ink hover:underline"
          >
            {val}
          </Link>
          <div className="text-xs text-muted font-mono mt-0.5">{row.advt_no}</div>
        </div>
      ),
    },
    { header: 'Grade', accessor: 'grade', width: '80px', align: 'center' },
    { header: 'Discipline', accessor: 'discipline' },
    { header: 'Vacancies', accessor: 'vacancies', align: 'right', width: '90px' },
    {
      header: 'Closing date',
      accessor: 'closing_date',
      align: 'right',
      render: (val) => formatDate(val),
    },
    {
      header: 'Action',
      align: 'right',
      width: '160px',
      render: (_, row) => (
        <Link to={`/applicant/advertisements/${row.id}`}>
          <Button variant="secondary" size="sm">
            View advertisement
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <ApplicantLayout>
      <PageHeader
        breadcrumbs={[{ label: 'Recruitment portal' }, { label: 'Open advertisements' }]}
        title="Open advertisements"
      />

      {error && <Banner variant="bad" message={error} className="mb-6" />}

      <Table
        columns={columns}
        data={posts}
        loading={loading}
        emptyMessage="No advertisements currently open for applications."
      />
    </ApplicantLayout>
  );
}
