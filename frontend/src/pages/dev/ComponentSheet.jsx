import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Button,
  Field,
  TextInput,
  TextArea,
  Select,
  DateInput,
  Checkbox,
  RadioGroup,
  FileInput,
  Table,
  StatusTag,
  Panel,
  PageHeader,
  KeyValue,
  Tabs,
  Stepper,
  Drawer,
  Modal,
  Banner,
  useToast,
  EmptyState,
  Timeline,
  EvidenceMeter,
} from '../../components/ui';

export default function ComponentSheet() {
  // Only available in development mode
  if (!import.meta.env.DEV) {
    return <Navigate to="/login" replace />;
  }

  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('all');
  const [stepperStep, setStepperStep] = useState(2);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [checkedState, setCheckedState] = useState(true);
  const [radioState, setRadioState] = useState('option2');

  const evidenceRegisterData = [
    {
      code: 'E1',
      requirement: 'Radar signal processing',
      type: 'Essential',
      level: 'strong',
      quote: '"designed CA-CFAR detection for FMCW radar"',
    },
    {
      code: 'E2',
      requirement: 'Digital filter design',
      type: 'Essential',
      level: 'some',
      quote: '"implemented FIR filters in MATLAB"',
    },
    {
      code: 'E3',
      requirement: 'MATLAB/Python for signal analysis',
      type: 'Essential',
      level: 'strong',
      quote: '"Python (NumPy, SciPy) signal pipelines"',
    },
    {
      code: 'D1',
      requirement: 'FPGA implementation',
      type: 'Desirable',
      level: 'none',
      quote: '—',
    },
    {
      code: 'D2',
      requirement: 'Team handling',
      type: 'Desirable',
      level: 'some',
      quote: '"led a 3-member test-bench team"',
    },
  ];

  const evidenceColumns = [
    {
      header: 'Code',
      accessor: 'code',
      width: '70px',
      render: (val) => <span className="font-mono text-xs font-semibold text-text">{val}</span>,
    },
    { header: 'Requirement', accessor: 'requirement' },
    {
      header: 'Type',
      accessor: 'type',
      width: '120px',
      render: (val) => (
        <span className={`text-xs font-medium ${val === 'Essential' ? 'text-ink font-semibold' : 'text-muted'}`}>
          {val}
        </span>
      ),
    },
    {
      header: 'Evidence',
      accessor: 'level',
      width: '140px',
      render: (val) => <EvidenceMeter level={val} />,
    },
    {
      header: 'From the resume',
      accessor: 'quote',
      render: (val) => (
        <span className={val === '—' ? 'text-muted' : 'font-mono text-xs text-text'}>
          {val}
        </span>
      ),
    },
  ];

  const handleConfirmModal = () => {
    setModalLoading(true);
    setTimeout(() => {
      setModalLoading(false);
      setModalOpen(false);
      addToast({
        variant: 'error',
        message: 'Application rejected',
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-desk text-text">
      {/* Dev Header */}
      <header className="bg-paper border-b border-rule px-8 py-4 sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-desk text-ink border border-rule font-medium">
              DEV ONLY
            </span>
            <h1 className="text-lg font-semibold text-text mt-1">
              RAC Boardroom UI Component Sheet
            </h1>
          </div>
          <div className="text-xs text-muted">
            All states compliant with <code className="font-mono">docs/12_UI_GUIDE.md</code>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-8 py-8 space-y-12">
        {/* Section 1: PageHeader */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted font-mono">
            1. PageHeader
          </h2>
          <Panel>
            <PageHeader
              breadcrumbs={[
                { label: 'Advertisements', href: '#' },
                { label: 'RAC/2026/07' },
              ]}
              title="Scientist 'C' – Radar Signal Processing"
              reference="Advt. No. RAC/2026/07"
              actions={
                <div className="flex items-center gap-2">
                  <Button variant="secondary">Edit advertisement</Button>
                  <Button variant="primary">Publish advertisement</Button>
                </div>
              }
            />
          </Panel>
        </section>

        {/* Section 2: Buttons */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted font-mono">
            2. Button (Variants &amp; States)
          </h2>
          <Panel title="Button showcase" subtitle="Label = verb + object. No icons or arrows.">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium text-muted mb-2">Variants (Size: md - 36px)</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Publish advertisement</Button>
                  <Button variant="secondary">Save draft</Button>
                  <Button variant="quiet">Cancel action</Button>
                  <Button variant="danger">Reject application</Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted mb-2">Sizes (sm - 30px vs md - 36px)</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" size="sm">Create post</Button>
                  <Button variant="secondary" size="sm">Filter records</Button>
                  <Button variant="primary" size="md">Create post</Button>
                  <Button variant="secondary" size="md">Filter records</Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted mb-2">States (Loading &amp; Disabled)</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" loading>Submit application</Button>
                  <Button variant="secondary" loading>Export register</Button>
                  <Button variant="primary" disabled>Publish advertisement</Button>
                  <Button variant="secondary" disabled>Save draft</Button>
                  <Button variant="danger" disabled>Delete record</Button>
                </div>
              </div>
            </div>
          </Panel>
        </section>

        {/* Section 3: Form Fields & Inputs */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted font-mono">
            3. Form Inputs &amp; Field Wrappers
          </h2>
          <Panel title="Inputs and fields" subtitle="Standard 36px height, 1px rule, focus ring, error states.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field
                label="Full name"
                id="field-default"
                hint="As stated in matriculation certificate"
              >
                <TextInput id="field-default" defaultValue="Priya Verma" />
              </Field>

              <Field
                label="Specialisation"
                id="field-focus"
                hint="Click or tab to inspect visible focus ring"
              >
                <TextInput id="field-focus" placeholder="e.g. Radar Signal Processing" />
              </Field>

              <Field
                label="Aadhaar number"
                id="field-disabled"
                optional
                hint="Disabled input state"
              >
                <TextInput id="field-disabled" defaultValue="XXXX-XXXX-4910" disabled />
              </Field>

              <Field
                label="Email address"
                id="field-error"
                error="Please enter a valid official email address ending with .gov.in or .in"
              >
                <TextInput id="field-error" defaultValue="priya.verma@invalid" error />
              </Field>

              <Field label="Scientist grade" id="field-select">
                <Select
                  id="field-select"
                  options={[
                    { label: "Scientist 'B'", value: 'B' },
                    { label: "Scientist 'C'", value: 'C' },
                    { label: "Scientist 'D'", value: 'D' },
                  ]}
                />
              </Field>

              <Field label="Interview date" id="field-date">
                <DateInput id="field-date" defaultValue="2026-10-28" />
              </Field>

              <div className="md:col-span-2">
                <Field
                  label="Research publications summary"
                  id="field-textarea"
                  hint="Provide DOIs or titles of peer-reviewed journal articles"
                >
                  <TextArea
                    id="field-textarea"
                    rows={3}
                    placeholder="List peer-reviewed papers..."
                  />
                </Field>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-text">Checkboxes</p>
                <div className="space-y-2">
                  <Checkbox
                    label="I confirm all particulars are authentic"
                    checked={checkedState}
                    onChange={(e) => setCheckedState(e.target.checked)}
                  />
                  <Checkbox
                    label="Declaration verified by administrative officer"
                    hint="Read-only administrative verification"
                    disabled
                    checked
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-text">Radio group</p>
                <RadioGroup
                  name="demo-radio"
                  label="Recruitment mode"
                  value={radioState}
                  onChange={setRadioState}
                  options={[
                    { label: 'Direct recruitment (Open advertisement)', value: 'option1' },
                    { label: 'Internal scientist promotion', value: 'option2' },
                    { label: 'Deputation from armed forces', value: 'option3', disabled: true },
                  ]}
                />
              </div>

              <div className="md:col-span-2">
                <Field
                  label="Curriculum vitae"
                  id="field-file"
                  hint="PDF format only, maximum 5 MB"
                >
                  <FileInput id="field-file" />
                </Field>
              </div>
            </div>
          </Panel>
        </section>

        {/* Section 4: StatusTags */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted font-mono">
            4. StatusTag (Fixed Vocabulary)
          </h2>
          <Panel title="Status vocabulary" subtitle="8px square dot paired with text. Never colour alone.">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted mb-2 font-mono">Advertisement</p>
                <div className="flex flex-wrap gap-2">
                  <StatusTag status="Draft" />
                  <StatusTag status="Published" />
                  <StatusTag status="Closed" />
                </div>
              </div>

              <div>
                <p className="text-xs text-muted mb-2 font-mono">Application</p>
                <div className="flex flex-wrap gap-2">
                  <StatusTag status="Submitted" />
                  <StatusTag status="Under review" />
                  <StatusTag status="Shortlisted" />
                  <StatusTag status="Not shortlisted" />
                  <StatusTag status="Interview scheduled" />
                  <StatusTag status="Interview completed" />
                </div>
              </div>

              <div>
                <p className="text-xs text-muted mb-2 font-mono">Screening &amp; Interview</p>
                <div className="flex flex-wrap gap-2">
                  <StatusTag status="Queued" />
                  <StatusTag status="In progress" />
                  <StatusTag status="Completed" />
                  <StatusTag status="Failed" />
                  <StatusTag status="Scheduled" />
                  <StatusTag status="Verified" />
                  <StatusTag status="Unverified" />
                </div>
              </div>
            </div>
          </Panel>
        </section>

        {/* Section 5: KeyValue */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted font-mono">
            5. KeyValue Definition List
          </h2>
          <Panel title="Applicant record metadata">
            <KeyValue
              columns={3}
              items={[
                { label: 'Application ID', value: 'APP-2026-0819' },
                { label: 'Applicant name', value: 'Priya Verma' },
                { label: 'Advertised post', value: "Scientist 'C' – Radar Signal Processing" },
                { label: 'Sanctioned grade', value: "Scientist 'C'" },
                { label: 'Discipline', value: 'Electronics & Communication Engineering' },
                { label: 'Closing date', value: '31 Oct 2026, 17:00 IST' },
              ]}
            />
          </Panel>
        </section>

        {/* Section 6: Tabs & Stepper */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted font-mono">
            6. Tabs &amp; Stepper
          </h2>
          <Panel title="Navigation controls">
            <div className="space-y-8">
              <div>
                <p className="text-xs text-muted mb-3 font-mono">Tabs (Underline style with 3px ink active bar)</p>
                <Tabs
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  tabs={[
                    { id: 'all', label: 'All applications', count: 18 },
                    { id: 'review', label: 'Under review', count: 12 },
                    { id: 'shortlisted', label: 'Shortlisted', count: 5 },
                    { id: 'not_shortlisted', label: 'Not shortlisted', count: 1 },
                  ]}
                />
              </div>

              <div>
                <p className="text-xs text-muted mb-3 font-mono">Stepper (Application form progress)</p>
                <Stepper
                  currentStep={stepperStep}
                  steps={[
                    { id: '1', label: 'Personal details' },
                    { id: '2', label: 'Qualifications' },
                    { id: '3', label: 'Experience & resume' },
                    { id: '4', label: 'Declaration' },
                  ]}
                />
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setStepperStep((s) => Math.max(1, s - 1))}
                    disabled={stepperStep === 1}
                  >
                    Previous step
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setStepperStep((s) => Math.min(4, s + 1))}
                    disabled={stepperStep === 4}
                  >
                    Next step
                  </Button>
                </div>
              </div>
            </div>
          </Panel>
        </section>

        {/* Section 7: THE SIGNATURE — Evidence register */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted font-mono">
            7. The Signature: Evidence Register (UI Guide Section 7)
          </h2>
          <Panel
            title="Resume screening"
            subtitle="AI-assisted, for screening only"
          >
            <div className="space-y-4">
              <Table
                columns={evidenceColumns}
                data={evidenceRegisterData}
                caption="AI-assisted resume screening evidence register"
              />

              {/* Verified Code Summary */}
              <div className="p-4 bg-desk border border-rule rounded flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
                <div>
                  <span className="text-muted">Essential requirements evidenced:</span>{' '}
                  <span className="font-semibold text-text tabular-nums">3 of 3</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted">Resume–post match:</span>{' '}
                  <span className="font-semibold text-text tabular-nums">66</span>
                  <StatusTag variant="warn" label="Medium" />
                </div>
              </div>
            </div>
          </Panel>
        </section>

        {/* Section 8: Table States (Skeleton & Empty) */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted font-mono">
            8. Table Loading &amp; Empty States
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel title="Table skeleton rows" subtitle="Subtle pulse while loading data">
              <Table
                loading
                skeletonRows={3}
                columns={[
                  { header: 'Reference', width: '120px' },
                  { header: 'Applicant' },
                  { header: 'Score', align: 'right' },
                ]}
                data={[]}
              />
            </Panel>

            <Panel title="Table empty state" subtitle="Direct message with action">
              <Table
                loading={false}
                columns={[
                  { header: 'Post reference' },
                  { header: 'Closing date', align: 'right' },
                ]}
                data={[]}
                emptyMessage="No advertisements currently open for applications."
                emptyAction={
                  <Button variant="secondary" size="sm">
                    Refresh list
                  </Button>
                }
              />
            </Panel>
          </div>
        </section>

        {/* Section 9: Banners, Toasts, Drawer, Modal */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted font-mono">
            9. Overlays, Banners &amp; Toasts
          </h2>
          <Panel title="Alerts &amp; Overlays">
            <div className="space-y-6">
              <div className="space-y-3">
                <Banner
                  variant="info"
                  message="AI screening completed. Verification quotes are ready for administrative confirmation."
                />
                <Banner
                  variant="warn"
                  message="The server is not reachable. Changes can't be saved until it is back."
                />
                <Banner
                  variant="bad"
                  message="The resume could not be read. Upload a PDF that contains text, not a scanned image."
                />
              </div>

              <div className="pt-4 border-t border-rule flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
                  Open interview schedule drawer
                </Button>
                <Button variant="danger" onClick={() => setModalOpen(true)}>
                  Open reject modal
                </Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    addToast({
                      variant: 'success',
                      message: 'Advertisement published',
                    })
                  }
                >
                  Trigger success toast
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    addToast({
                      variant: 'error',
                      message: 'Interview slot clash detected',
                    })
                  }
                >
                  Trigger error toast
                </Button>
              </div>
            </div>
          </Panel>
        </section>

        {/* Section 10: Timeline & EmptyState */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted font-mono">
            10. Timeline &amp; Standalone EmptyState
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel title="Audit trail timeline">
              <Timeline
                events={[
                  {
                    title: 'Interview scheduled',
                    timestamp: '16 Oct 2026, 14:30 IST',
                    actor: 'Dr. A. Rao (Admin)',
                    description: 'Scheduled for 28 Oct 2026, 10:00 IST with Board 04.',
                  },
                  {
                    title: 'Candidate shortlisted',
                    timestamp: '15 Oct 2026, 11:15 IST',
                    actor: 'Dr. A. Rao (Admin)',
                    description: 'Approved based on verified radar signal processing credentials.',
                  },
                  {
                    title: 'Application submitted',
                    timestamp: '14 Oct 2026, 16:45 IST',
                    actor: 'Priya Verma (Applicant)',
                    description: 'Application APP-2026-0819 received with verified PDF resume.',
                  },
                ]}
              />
            </Panel>

            <Panel title="Standalone EmptyState">
              <EmptyState
                message="No candidate applications submitted yet. Browse open advertisements to begin application process."
                actionLabel="View open advertisements"
                actionHref="/applicant/advertisements"
              />
            </Panel>
          </div>
        </section>
      </main>

      {/* Drawer Showcase */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Schedule interview"
        description="Assign shortlisted candidate to an constituted interview board"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setDrawerOpen(false);
                addToast({
                  variant: 'success',
                  message: 'Interview scheduled',
                });
              }}
            >
              Confirm schedule
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <KeyValue
            columns={2}
            items={[
              { label: 'Candidate', value: 'Priya Verma' },
              { label: 'Post', value: "Scientist 'C'" },
            ]}
          />
          <Field label="Interview date" id="sched-date">
            <DateInput id="sched-date" defaultValue="2026-10-28" />
          </Field>
          <Field label="Interview board" id="sched-board">
            <Select
              id="sched-board"
              options={[
                { label: 'Board 01 — Electronics & Radar Systems', value: 'b1' },
                { label: 'Board 02 — Signal Processing & RF', value: 'b2' },
              ]}
            />
          </Field>
        </div>
      </Drawer>

      {/* Modal Showcase */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Reject this application?"
        description="The candidate will be marked as Not shortlisted and notified. This decision is permanently logged in the audit trail."
        confirmLabel="Reject application"
        confirmVariant="danger"
        cancelLabel="Cancel"
        loading={modalLoading}
        onConfirm={handleConfirmModal}
      />
    </div>
  );
}
