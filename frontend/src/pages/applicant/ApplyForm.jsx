import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ApplicantLayout from '../../layouts/ApplicantLayout';
import { PageHeader, Panel, Banner, Button } from '../../components/ui';
import { getOpenPostApi } from '../../lib/api';

export default function ApplyForm() {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (id) {
      getOpenPostApi(id)
        .then((data) => {
          if (isMounted) setPost(data);
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  const advtTitle = post ? post.title : "Scientist 'C' – Radar Signal Processing";
  const advtNo = post ? post.advt_no : (id || 'RAC/2026/07');

  return (
    <ApplicantLayout>
      <PageHeader
        breadcrumbs={[
          { label: 'Open advertisements', href: '/applicant/advertisements' },
          { label: advtNo, href: `/applicant/advertisements/${id || ''}` },
          { label: 'Apply' },
        ]}
        title={`Application for ${advtTitle}`}
        reference={`Advt. No. ${advtNo}`}
      />

      <div className="max-w-[640px] space-y-6">
        <Panel title="Application submission">
          <div className="space-y-6">
            <Banner
              variant="info"
              message="Online applications for this post open soon."
            />
            <div>
              <Link to={`/applicant/advertisements/${id || ''}`}>
                <Button variant="secondary">
                  Back to advertisement
                </Button>
              </Link>
            </div>
          </div>
        </Panel>
      </div>
    </ApplicantLayout>
  );
}
