import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import StaffLayout from '../../layouts/StaffLayout';
import {
  PageHeader,
  Panel,
  Field,
  TextInput,
  Select,
  RadioGroup,
  TextArea,
  DateInput,
  Button,
  Banner,
  KeyValue,
} from '../../components/ui';
import { createPostApi, updatePostApi, getPostApi } from '../../lib/api';

const DISCIPLINES = [
  'Electronics & Communication',
  'Electrical',
  'Mechanical',
  'Aeronautical',
  'Computer Science',
  'Chemical',
  'Civil',
  'Metallurgy & Materials',
  'Physics',
  'Chemistry',
  'Mathematics',
  'Life Sciences',
  'Psychology',
];

const GRADE_WEIGHTS = {
  B: { knowledge: 70, managerial: 0, communication: 30 },
  C: { knowledge: 60, managerial: 20, communication: 20 },
  D: { knowledge: 60, managerial: 20, communication: 20 },
  E: { knowledge: 50, managerial: 30, communication: 20 },
  F: { knowledge: 45, managerial: 35, communication: 20 },
  G: { knowledge: 45, managerial: 35, communication: 20 },
};

export default function AdvertisementForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loadingPost, setLoadingPost] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [advtNumber, setAdvtNumber] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [grade, setGrade] = useState('C');
  const [discipline, setDiscipline] = useState('Electronics & Communication');
  const [interviewType, setInterviewType] = useState('recruitment');
  const [vacancies, setVacancies] = useState('1');
  const [closingDate, setClosingDate] = useState('');
  const [summary, setSummary] = useState('');

  const [requirements, setRequirements] = useState([
    { text: '', kind: 'essential' },
  ]);

  useEffect(() => {
    if (isEdit) {
      let isMounted = true;
      const loadPost = async () => {
        try {
          const data = await getPostApi(id);
          if (isMounted) {
            setAdvtNumber(data.advt_no);
            setPostTitle(data.title);
            setGrade(data.grade);
            setDiscipline(data.discipline);
            setInterviewType(data.interview_type || 'recruitment');
            setVacancies(String(data.vacancies));
            setClosingDate(data.closing_date ? data.closing_date.split('T')[0] : '');
            setSummary(data.summary || '');
            if (data.requirements && data.requirements.length > 0) {
              setRequirements(
                data.requirements.map((r) => ({ text: r.text, kind: r.kind }))
              );
            }
          }
        } catch (err) {
          if (isMounted) {
            setError(err instanceof Error ? err.message : String(err));
          }
        } finally {
          if (isMounted) {
            setLoadingPost(false);
          }
        }
      };
      loadPost();
      return () => {
        isMounted = false;
      };
    }
  }, [id, isEdit]);

  const handleAddRequirement = () => {
    setRequirements((prev) => [...prev, { text: '', kind: 'essential' }]);
  };

  const handleRemoveRequirement = (idx) => {
    setRequirements((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMoveRequirement = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= requirements.length) return;
    setRequirements((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleReqChange = (idx, field, value) => {
    setRequirements((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic frontend validations
    if (!advtNumber.trim() || !postTitle.trim() || !closingDate) {
      setError('Please fill in all required fields.');
      return;
    }

    const cleanReqs = requirements.filter((r) => r.text.trim() !== '');

    setSaving(true);
    try {
      const payload = {
        advt_no: advtNumber.trim(),
        title: postTitle.trim(),
        discipline,
        grade,
        interview_type: interviewType,
        vacancies: parseInt(vacancies, 10) || 1,
        closing_date: new Date(closingDate).toISOString(),
        summary: summary.trim(),
        requirements: cleanReqs,
      };

      if (isEdit) {
        const updated = await updatePostApi(id, payload);
        navigate(`/admin/advertisements/${updated.id}`);
      } else {
        const created = await createPostApi(payload);
        navigate(`/admin/advertisements/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const currentWeights = GRADE_WEIGHTS[grade] || GRADE_WEIGHTS.C;

  if (loadingPost) {
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

  return (
    <StaffLayout role="admin">
      <PageHeader
        breadcrumbs={[
          { label: 'Advertisements', href: '/admin/advertisements' },
          { label: isEdit ? 'Edit advertisement' : 'New advertisement' },
        ]}
        title={isEdit ? 'Edit advertisement' : 'Create advertisement'}
      />

      <div className="max-w-3xl space-y-6">
        {error && <Banner variant="bad" message={error} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Panel 1: Post Details */}
          <Panel
            title="1. Post details"
            subtitle="Specify the requisition reference, discipline, grade, and closing date."
          >
            <div className="space-y-4">
              <Field
                label="Advertisement number"
                id="advtNumber"
                hint="Official notification reference number (e.g. RAC/2026/07)"
              >
                <TextInput
                  id="advtNumber"
                  value={advtNumber}
                  onChange={(e) => setAdvtNumber(e.target.value)}
                  placeholder="e.g. RAC/2026/07"
                  required
                />
              </Field>

              <Field label="Post title" id="postTitle">
                <TextInput
                  id="postTitle"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Scientist 'C' – Radar Signal Processing"
                  required
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Discipline" id="discipline">
                  <Select
                    id="discipline"
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value)}
                    options={DISCIPLINES.map((d) => ({ label: d, value: d }))}
                  />
                </Field>

                <Field label="Scientist grade" id="grade">
                  <Select
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    options={[
                      { label: "Scientist 'B'", value: 'B' },
                      { label: "Scientist 'C'", value: 'C' },
                      { label: "Scientist 'D'", value: 'D' },
                      { label: "Scientist 'E'", value: 'E' },
                      { label: "Scientist 'F'", value: 'F' },
                      { label: "Scientist 'G'", value: 'G' },
                    ]}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Interview type" id="interviewType">
                  <RadioGroup
                    name="interviewType"
                    value={interviewType}
                    onChange={setInterviewType}
                    options={[
                      { label: 'Recruitment (New applicant)', value: 'recruitment' },
                      { label: 'Promotion (Existing scientist)', value: 'promotion' },
                    ]}
                  />
                </Field>

                <Field label="Sanctioned vacancies" id="vacancies">
                  <TextInput
                    id="vacancies"
                    type="number"
                    min="1"
                    value={vacancies}
                    onChange={(e) => setVacancies(e.target.value)}
                    required
                  />
                </Field>
              </div>

              <Field
                label="Closing date"
                id="closingDate"
                hint="Last date for application submission (Asia/Kolkata date)"
              >
                <DateInput
                  id="closingDate"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  required
                />
              </Field>

              <Field label="Summary description" id="summary">
                <TextArea
                  id="summary"
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Provide a concise summary of duties and research context..."
                />
              </Field>
            </div>
          </Panel>

          {/* Panel 2: Requirements Editor */}
          <Panel
            title="2. Requirements"
            subtitle="Add essential and desirable criteria for AI resume screening matching. At least 1 essential requirement is required to publish."
          >
            <div className="space-y-3">
              {requirements.map((req, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-desk rounded border border-rule"
                >
                  <span className="font-mono text-xs font-semibold text-muted w-6 text-center select-none">
                    #{idx + 1}
                  </span>
                  <div className="flex-1 w-full">
                    <TextInput
                      placeholder="e.g. First-class degree in Electronics Engineering..."
                      value={req.text}
                      onChange={(e) => handleReqChange(idx, 'text', e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-full sm:w-36">
                    <Select
                      value={req.kind}
                      onChange={(e) => handleReqChange(idx, 'kind', e.target.value)}
                      options={[
                        { label: 'Essential', value: 'essential' },
                        { label: 'Desirable', value: 'desirable' },
                      ]}
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="quiet"
                      size="sm"
                      onClick={() => handleMoveRequirement(idx, -1)}
                      disabled={idx === 0}
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="quiet"
                      size="sm"
                      onClick={() => handleMoveRequirement(idx, 1)}
                      disabled={idx === requirements.length - 1}
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="quiet"
                      size="sm"
                      onClick={() => handleRemoveRequirement(idx)}
                      disabled={requirements.length === 1}
                      title="Remove"
                      className="text-bad hover:text-bad"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddRequirement}
                className="mt-2"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add requirement row
              </Button>
            </div>
          </Panel>

          {/* Panel 3: Evaluation Weights (Read-only from grade) */}
          <Panel
            title="3. Evaluation weights"
            subtitle={`Pre-filled default weights for Grade ${grade} as per DRDO RAC scoring rules.`}
          >
            <KeyValue
              columns={3}
              items={[
                { label: 'Subject knowledge', value: `${currentWeights.knowledge}%` },
                { label: 'Managerial / Leadership', value: `${currentWeights.managerial}%` },
                { label: 'Communication & relevance', value: `${currentWeights.communication}%` },
              ]}
            />
          </Panel>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-start gap-3">
            <Button type="submit" variant="primary" loading={saving}>
              Save draft
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => navigate('/admin/advertisements')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </StaffLayout>
  );
}
