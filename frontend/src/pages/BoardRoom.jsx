import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useRoomStore } from '../realtime/roomStore';
import { connectRoomSocket } from '../realtime/socket';

export default function BoardRoom() {
  const { code, sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const roomCode = (code || sessionId || '').toUpperCase();
  const participantId = Number(searchParams.get('pid'));

  const socketRef = useRef(null);

  // Store state
  const session = useRoomStore((state) => state.session);
  const me = useRoomStore((state) => state.me);
  const participants = useRoomStore((state) => state.participants);
  const questions = useRoomStore((state) => state.questions);
  const connectionStatus = useRoomStore((state) => state.connectionStatus);
  const lastError = useRoomStore((state) => state.lastError);

  const setConnectionStatus = useRoomStore((state) => state.setConnectionStatus);
  const handleServerMessage = useRoomStore((state) => state.handleServerMessage);
  const clearError = useRoomStore((state) => state.clearError);
  const resetStore = useRoomStore((state) => state.reset);

  // Local question composer state
  const [questionText, setQuestionText] = useState('');
  const [questionTag, setQuestionTag] = useState('');
  const [followUpOf, setFollowUpOf] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Connect socket with React StrictMode safety
  useEffect(() => {
    if (!roomCode || !participantId) return;

    resetStore();

    const socketInstance = connectRoomSocket({
      roomCode,
      participantId,
      onMessage: (msg) => {
        handleServerMessage(msg);
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
      },
    });

    socketRef.current = socketInstance;

    return () => {
      // Deliberate close on unmount / cleanup
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [roomCode, participantId, resetStore, handleServerMessage, setConnectionStatus]);

  // Role check: if me is candidate, redirect to candidate room
  useEffect(() => {
    if (me && me.seat_role === 'candidate') {
      navigate(`/candidate/${roomCode}?pid=${participantId}`, { replace: true });
    }
  }, [me, roomCode, participantId, navigate]);

  // Sync default tag with current session phase
  const currentPhase = session?.phase || 'lobby';
  const effectiveTag = questionTag || (currentPhase === 'managerial' ? 'managerial' : 'technical');

  const isChairman = me?.seat_role === 'chairman';
  const isLobby = currentPhase === 'lobby';

  // Candidate online & ready status for chairman admit button
  const candidateParticipant = participants.find((p) => p.seat_role === 'candidate');
  const canAdmitCandidate = Boolean(
    isChairman &&
    isLobby &&
    candidateParticipant?.online &&
    candidateParticipant?.ready
  );

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleAdmit = () => {
    if (socketRef.current) {
      socketRef.current.send('admit_candidate', {});
    }
  };

  const handleSetPhase = (phase) => {
    if (socketRef.current) {
      socketRef.current.send('set_phase', { phase });
    }
  };

  const handleAskQuestion = (e) => {
    e.preventDefault();
    const text = questionText.trim();
    if (!text || !socketRef.current) return;

    const payload = {
      text,
      tag: effectiveTag,
    };
    if (followUpOf) {
      payload.follow_up_of = Number(followUpOf);
    }

    socketRef.current.send('ask_question', payload);
    setQuestionText('');
    setFollowUpOf('');
  };

  const queuedQuestions = questions.filter((q) => q.status === 'queued');
  // Sort questions by seq ascending for transcript
  const sortedQuestions = [...questions].sort((a, b) => (a.seq || 0) - (b.seq || 0));

  if (!roomCode || !participantId) {
    return (
      <div className="max-w-md mx-auto py-12 px-6 text-center">
        <div className="bg-white border border-gov-gray-300 rounded p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gov-navy-950">Invalid Room URL</h2>
          <p className="text-xs text-gov-gray-600 mt-2">
            Missing room code or participant ID parameter.
          </p>
          <Link
            to="/join"
            className="inline-block mt-4 text-xs font-semibold text-gov-navy-700 underline"
          >
            ← Return to Join Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-4">
      {/* Top Telemetry & Control Bar */}
      <div className="bg-white border border-gov-gray-300 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gov-gray-500 uppercase tracking-wider">Room:</span>
            <span className="font-mono text-base font-bold text-gov-navy-950 tracking-wider">
              {roomCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-xs bg-gov-gray-100 hover:bg-gov-gray-200 text-gov-navy-900 border border-gov-gray-300 px-2 py-0.5 rounded cursor-pointer transition-colors"
            >
              {copiedCode ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="h-4 w-px bg-gov-gray-300 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gov-gray-500 uppercase tracking-wider">Phase:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-gov-navy-100 text-gov-navy-900 border border-gov-navy-200">
              {currentPhase}
            </span>
          </div>

          <div className="h-4 w-px bg-gov-gray-300 hidden sm:block" />

          {/* Connection status indicator */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-500'
                  : connectionStatus === 'reconnecting'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-xs font-medium text-gov-gray-700 capitalize">
              {connectionStatus === 'reconnecting' ? 'Reconnecting…' : connectionStatus}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gov-gray-500">You are</p>
            <p className="text-sm font-bold text-gov-navy-950">
              {me ? `${me.display_name} (${me.seat_role})` : 'Connecting…'}
            </p>
          </div>
          <Link
            to="/join"
            className="text-xs text-gov-gray-500 hover:text-gov-navy-900 underline"
          >
            Leave
          </Link>
        </div>
      </div>

      {/* Dismissible Error Banner */}
      {lastError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center justify-between">
          <div>
            <strong>Notice: </strong> {lastError}
          </div>
          <button
            type="button"
            onClick={clearError}
            className="font-bold text-rose-800 hover:text-rose-950 text-sm px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Left Panel (Participants & Controls) + Right Panel (Composer, Queue & Transcript) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Participants and Board Control */}
        <div className="lg:col-span-4 space-y-4">
          {/* Participants Card */}
          <div className="bg-white border border-gov-gray-300 rounded-lg p-4 shadow-xs">
            <h2 className="text-xs font-bold text-gov-navy-950 uppercase tracking-wider border-b border-gov-gray-200 pb-2 mb-3">
              Boardroom Attendance
            </h2>
            <div className="space-y-2.5">
              {participants.map((p) => {
                const isCand = p.seat_role === 'candidate';
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded bg-gov-gray-50 border border-gov-gray-200 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          p.online ? 'bg-emerald-500' : 'bg-gov-gray-400'
                        }`}
                        title={p.online ? 'Online' : 'Offline'}
                      />
                      <div>
                        <span className="font-semibold text-gov-navy-950">
                          {p.display_name}
                        </span>
                        {p.specialisation && (
                          <span className="text-gov-gray-500 block text-[11px]">
                            {p.specialisation}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-gov-gray-300 text-gov-gray-700">
                        {p.seat_role}
                      </span>
                      {isCand && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            p.ready
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {p.ready ? 'Ready' : 'Not ready'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {participants.length === 0 && (
                <p className="text-xs text-gov-gray-500 italic">No attendees loaded yet.</p>
              )}
            </div>
          </div>

          {/* Chairman Administrative Controls */}
          {isChairman && (
            <div className="bg-white border border-gov-gray-300 rounded-lg p-4 shadow-xs space-y-4">
              <h2 className="text-xs font-bold text-gov-navy-950 uppercase tracking-wider border-b border-gov-gray-200 pb-2">
                Chairman Actions
              </h2>

              {/* Admit Candidate */}
              <div>
                <p className="text-xs text-gov-gray-600 mb-1.5">
                  Lobby Admission (Candidate must be online and ready):
                </p>
                <button
                  type="button"
                  onClick={handleAdmit}
                  disabled={!canAdmitCandidate}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2 px-3 rounded text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                >
                  {isLobby
                    ? canAdmitCandidate
                      ? '✓ Admit Candidate to Boardroom'
                      : 'Candidate Not Ready'
                    : 'Candidate Admitted'}
                </button>
              </div>

              {/* Phase Switcher */}
              <div>
                <p className="text-xs text-gov-gray-600 mb-1.5">Change Interview Phase:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {['icebreaker', 'technical', 'managerial', 'closing'].map((phaseKey) => {
                    const isActive = currentPhase === phaseKey;
                    return (
                      <button
                        key={phaseKey}
                        type="button"
                        onClick={() => handleSetPhase(phaseKey)}
                        disabled={isLobby}
                        className={`text-xs py-1.5 px-2 rounded font-medium capitalize border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          isActive
                            ? 'bg-gov-navy-900 text-white border-gov-navy-950 font-bold'
                            : 'bg-white hover:bg-gov-gray-100 text-gov-navy-900 border-gov-gray-300'
                        }`}
                      >
                        {phaseKey}
                      </button>
                    );
                  })}
                </div>
                {isLobby && (
                  <p className="text-[11px] text-gov-gray-500 mt-1 italic">
                    Phases unlock after candidate admission.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Question Composer, Queued Box & Live Transcript */}
        <div className="lg:col-span-8 space-y-4">
          {/* Question Composer Box */}
          <div className="bg-white border border-gov-gray-300 rounded-lg p-5 shadow-xs">
            <h2 className="text-xs font-bold text-gov-navy-950 uppercase tracking-wider mb-2">
              Pose / Queue Question
            </h2>
            <form onSubmit={handleAskQuestion} className="space-y-3">
              <div>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder={
                    isLobby
                      ? 'Questions cannot be posed while the session is in the lobby.'
                      : 'Enter technical, scientific, or managerial query for the candidate…'
                  }
                  rows={3}
                  maxLength={2000}
                  disabled={isLobby}
                  className="w-full px-3 py-2 border border-gov-gray-300 rounded text-sm focus:outline-none focus:border-gov-navy-700 bg-white disabled:bg-gov-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-gov-gray-600 font-medium">Tag:</label>
                    <select
                      value={effectiveTag}
                      onChange={(e) => setQuestionTag(e.target.value)}
                      disabled={isLobby}
                      className="text-xs border border-gov-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-gov-navy-700 disabled:bg-gov-gray-100"
                    >
                      <option value="technical">Technical</option>
                      <option value="managerial">Managerial</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-gov-gray-600 font-medium">Follow-up to:</label>
                    <select
                      value={followUpOf}
                      onChange={(e) => setFollowUpOf(e.target.value)}
                      disabled={isLobby || sortedQuestions.length === 0}
                      className="text-xs border border-gov-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-gov-navy-700 disabled:bg-gov-gray-100"
                    >
                      <option value="">None (Independent Question)</option>
                      {sortedQuestions.map((q) => (
                        <option key={q.id} value={q.id}>
                          #{q.seq}: {q.text.slice(0, 30)}…
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLobby || !questionText.trim()}
                  className="bg-gov-navy-900 hover:bg-gov-navy-800 text-white font-semibold py-1.5 px-4 rounded text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Ask / Queue Question
                </button>
              </div>
            </form>
          </div>

          {/* Waiting Queue List (Board Only) */}
          {queuedQuestions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-xs">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Waiting Queue ({queuedQuestions.length}) — Visible only to Board
              </h3>
              <div className="space-y-2">
                {queuedQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-2.5 bg-white border border-amber-200 rounded text-xs flex justify-between items-start gap-3"
                  >
                    <div>
                      <span className="font-bold text-gov-navy-950 mr-2">#{q.seq}</span>
                      <span className="text-gov-gray-800">{q.text}</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 uppercase shrink-0">
                      Queued
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Transcript */}
          <div className="bg-white border border-gov-gray-300 rounded-lg p-5 shadow-xs">
            <h2 className="text-xs font-bold text-gov-navy-950 uppercase tracking-wider border-b border-gov-gray-200 pb-2 mb-4">
              Interview Questions &amp; Responses Transcript
            </h2>

            <div className="space-y-4">
              {sortedQuestions.map((q) => {
                const isLive = q.status === 'live';
                const isAnswered = q.status === 'answered';
                const isPassed = q.status === 'passed';

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-lg border text-sm transition-all ${
                      isLive
                        ? 'bg-blue-50/50 border-blue-300 shadow-xs'
                        : 'bg-white border-gov-gray-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gov-navy-950 text-xs">
                          #{q.seq}
                        </span>
                        <span className="text-xs font-semibold text-gov-navy-900">
                          {q.asked_by?.display_name ? `Asked by ${q.asked_by.display_name}` : 'Board Question'}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-gov-gray-100 text-gov-gray-700 border border-gov-gray-300">
                          {q.tag}
                        </span>
                        {q.follow_up_of && (
                          <span className="text-[10px] text-gov-gray-500 italic">
                            (Follow-up to #{q.follow_up_of})
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isLive
                            ? 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse'
                            : isAnswered
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isPassed
                            ? 'bg-gov-gray-100 text-gov-gray-700 border-gov-gray-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {q.status}
                      </span>
                    </div>

                    <p className="text-gov-gray-900 font-medium text-sm mb-3">
                      {q.text}
                    </p>

                    {/* Answer Section */}
                    {q.answer && (
                      <div className="mt-2 pt-2 border-t border-gov-gray-200 text-xs">
                        <div className="flex items-center justify-between text-gov-gray-500 mb-1">
                          <span className="font-semibold text-gov-navy-900">
                            Candidate Response:
                          </span>
                          {q.answer.duration_s !== null && (
                            <span className="font-mono text-[11px]">
                              Time taken: {Number(q.answer.duration_s).toFixed(1)}s
                            </span>
                          )}
                        </div>
                        {q.answer.passed ? (
                          <p className="text-gov-gray-500 italic">
                            [Candidate passed on this question]
                          </p>
                        ) : (
                          <p className="text-gov-gray-800 bg-gov-gray-50 p-2.5 rounded border border-gov-gray-200 whitespace-pre-wrap">
                            {q.answer.text}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {sortedQuestions.length === 0 && (
                <div className="text-center py-8 text-gov-gray-500 text-xs italic">
                  No questions asked yet. The live transcript will record all queries and candidate responses here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
