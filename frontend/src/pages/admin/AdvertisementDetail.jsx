import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import StaffLayout from '../../layouts/StaffLayout';
import {
  PageHeader,
  Panel,
  KeyValue,
  EmptyState,
  Button,
  StatusTag,
  Banner,
  Modal,
  Table,
  useToast,
} from '../../components/ui';
import { getPostApi, publishPostApi, closePostApi } from '../../lib/api';

export default function AdvertisementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [closing, setClosing] = useState(false);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPostApi(id);
      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handlePublishConfirm = async () => {
    setPublishing(true);
    try {
      await publishPostApi(id);
      setPublishModalOpen(false);
      addToast({
        variant: 'success',
        message: 'Advertisement published',
      });
      await fetchPost();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPublishing(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      await closePostApi(id);
      addToast({
        variant: 'success',
        message: 'Advertisement closed',
      });
      await fetchPost();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setClosing(false);
    }
  };

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
      <StaffLayout role="admin">
        <PageHeader
          breadcrumbs={[
            { label: 'Advertisements', href: '/admin/advertisements' },
            { label: 'Loading...' },
          ]}
          title="Loading advertisement..."
        />
      </StaffLayout>
    );
  }

  if (error && !post) {
    return (
      <StaffLayout role="admin">
        <PageHeader
          breadcrumbs={[
            { label: 'Advertisements', href: '/admin/advertisements' },
            { label: 'Error' },
          ]}
          title="Error loading advertisement"
        />
        <Banner variant="bad" message={error} />
      </StaffLayout>
    );
  }

  const isDraft = post?.status === 'draft';
  const isPublished = post?.status === 'published';

  const reqColumns = [
    {
      header: 'Code',
      accessor: 'code',
      width: '80px',
      render: (val) => <span className="font-mono text-xs font-semibold text-text">{val}</span>,
    },
    {
      header: 'Requirement text',
      accessor: 'text',
    },
    {
      header: 'Kind',
      accessor: 'kind',
      width: '120px',
      render: (val) => (
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${
            val === 'essential' ? 'bg-ink-bg text-ink border border-ink/20' : 'bg-desk text-muted'
          }`}
        >
          {val === 'essential' ? 'Essential' : 'Desirable'}
        </span>
      ),
    },
  ];

  return (
    <StaffLayout role="admin">
      <PageHeader
        breadcrumbs={[
          { label: 'Advertisements', href: '/admin/advertisements' },
          { label: post.advt_no },
        ]}
        title={post.title}
        reference={`Advt. No. ${post.advt_no}`}
        actions={
          <div className="flex items-center gap-3">
            <StatusTag status={post.status} />

            {isDraft && (
              <>
                <Link to={`/admin/advertisements/${post.id}/edit`}>
                  <Button variant="secondary">
                    Edit advertisement
                  </Button>
                </Link>
                <Button variant="primary" onClick={() => setPublishModalOpen(true)}>
                  Publish advertisement
                </Button>
              </>
            )}

            {isPublished && (
              <Button variant="secondary" loading={closing} onClick={handleClose}>
                Close advertisement
              </Button>
            )}
          </div>
        }
      />

      {error && <Banner variant="bad" message={error} className="mb-6" />}

      <div className="space-y-6">
        {/* Requisition Details Panel */}
        <Panel title="Requisition details">
          <KeyValue
            columns={3}
            items={[
              { label: 'Advertisement number', value: post.advt_no },
              { label: 'Post title', value: post.title },
              { label: 'Discipline', value: post.discipline },
              { label: 'Scientist grade', value: `Scientist '${post.grade}'` },
              { label: 'Interview type', value: post.interview_type === 'recruitment' ? 'Recruitment' : 'Promotion' },
              { label: 'Sanctioned vacancies', value: post.vacancies },
              { label: 'Closing date', value: formatDate(post.closing_date) },
              { label: 'Created date', value: formatDate(post.created_at) },
              { label: 'Published date', value: post.published_at ? formatDate(post.published_at) : 'Not published' },
            ]}
          />
          {post.summary && (
            <div className="mt-6 pt-4 border-t border-rule">
              <h4 className="text-xs font-semibold text-muted mb-1">Summary description</h4>
              <p className="text-sm text-text leading-relaxed">{post.summary}</p>
            </div>
          )}
        </Panel>

        {/* Requirements Panel */}
        <Panel
          title="Post requirements"
          subtitle="Screening rules used by AI to match candidate resumes"
        >
          <Table
            columns={reqColumns}
            data={post.requirements || []}
            emptyMessage="No requirements defined for this advertisement."
          />
        </Panel>

        {/* Applications Placeholder Panel */}
        <Panel
          title="Applications"
          subtitle="Candidate applications submitted for this post"
        >
          <EmptyState
            message="No applications received for this advertisement yet. Submitted applications will be listed here for AI screening and administrative review."
          />
        </Panel>
      </div>

      {/* Publish Modal */}
      <Modal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        title="Publish advertisement?"
        description="Publishing will open this vacancy to applicant submissions and lock the requirement criteria. Candidates can apply until the closing date."
        confirmLabel="Publish advertisement"
        confirmVariant="primary"
        loading={publishing}
        onConfirm={handlePublishConfirm}
      />
    </StaffLayout>
  );
}
