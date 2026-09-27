import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ApplicantLayout from '../../layouts/ApplicantLayout';
import { PageHeader, Panel, KeyValue, Button, Table, Banner } from '../../components/ui';
import { getOpenPostApi } from '../../lib/api';

export default function ApplicantAdvertisementDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPost = async () => {
      try {
        const data = await getOpenPostApi(id);
        if (isMounted) {
          setPost(data);
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

    fetchPost();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  if (loading) {
    return (
      <ApplicantLayout>
        <PageHeader
          breadcrumbs={[
            { label: 'Open advertisements', href: '/applicant/advertisements' },
            { label: 'Loading...' },
          ]}
          title="Loading advertisement..."
        />
      </ApplicantLayout>
    );
  }

  if (error || !post) {
    return (
      <ApplicantLayout>
        <PageHeader
          breadcrumbs={[
            { label: 'Open advertisements', href: '/applicant/advertisements' },
            { label: 'Error' },
          ]}
          title="Advertisement not found"
        />
        <Banner variant="bad" message={error || 'The requested advertisement is not available.'} />
      </ApplicantLayout>
    );
  }

  const reqColumns = [
    {
      header: 'Code',
      accessor: 'code',
      width: '80px',
      render: (val) => <span className="font-mono text-xs font-semibold text-text">{val}</span>,
    },
    { header: 'Requirement', accessor: 'text' },
    {
      header: 'Type',
      accessor: 'kind',
      width: '120px',
      render: (val) => (
        <span className={`text-xs font-medium ${val === 'essential' ? 'text-ink font-semibold' : 'text-muted'}`}>
          {val === 'essential' ? 'Essential' : 'Desirable'}
        </span>
      ),
    },
  ];

  return (
    <ApplicantLayout>
      <PageHeader
        breadcrumbs={[
          { label: 'Open advertisements', href: '/applicant/advertisements' },
          { label: post.advt_no },
        ]}
        title={post.title}
        reference={`Advt. No. ${post.advt_no}`}
        actions={
          <Link to={`/applicant/advertisements/${post.id}/apply`}>
            <Button variant="primary">
              Apply for post
            </Button>
          </Link>
        }
      />

      <div className="space-y-6">
        <Panel title="Vacancy details">
          <KeyValue
            columns={3}
            items={[
              { label: 'Advertisement number', value: post.advt_no },
              { label: 'Post title', value: post.title },
              { label: 'Discipline', value: post.discipline },
              { label: 'Scientist grade', value: `Scientist '${post.grade}'` },
              { label: 'Vacancies', value: post.vacancies },
              { label: 'Closing date', value: formatDate(post.closing_date) },
            ]}
          />
          {post.summary && (
            <div className="mt-6 pt-4 border-t border-rule">
              <h4 className="text-xs font-semibold text-muted mb-1">Post summary</h4>
              <p className="text-sm text-text leading-relaxed">{post.summary}</p>
            </div>
          )}
        </Panel>

        <Panel
          title="Eligibility & criteria"
          subtitle="Essential and desirable requirements for this advertised post"
        >
          <Table
            columns={reqColumns}
            data={post.requirements || []}
            emptyMessage="No specific criteria listed."
          />
        </Panel>
      </div>
    </ApplicantLayout>
  );
}
