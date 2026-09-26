import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useRoomStore } from '../realtime/roomStore';
import { connectRoomSocket } from '../realtime/socket';

// Rule 1 (docs/06_RULES.md): Candidate screen never receives, renders, or calculates scores, marks, or queued questions.

export default function CandidateRoom() {
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
  const lastAckQuestionId = useRoomStore((state) => state.lastAckQuestionId);

  const setConnectionStatus = useRoomStore((state) => state.setConnectionStatus);
  const handleServerMessage = useRoomStore((state) => state.handleServerMessage);
  const clearError = useRoomStore((state) => state.clearError);
  const resetStore = useRoomStore((state) => state.reset);

  // Local answer composer state
  const [answerText, setAnswerText] = useState('');
  const [submittedForQId, setSubmittedForQId] = useState(null);

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
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [roomCode, participantId, resetStore, handleServerMessage, setConnectionStatus]);

  // Role check: if me is chairman or expert, redirect to board room
  useEffect(() => {
    if (me && me.seat_role !== 'candidate') {
      navigate(`/board/${roomCode}?pid=${participantId}`, { replace: true });
    }
  }, [me, roomCode, participantId, navigate]);

  const currentPhase = session?.phase || 'lobby';
  const isLobby = currentPhase === 'lobby';

  // Candidate ready status
  const isReady = Boolean(me?.ready);

  // Current live question (Rule 1: backend never sends queued to candidate; candidate questions are live/answered/passed)
  const liveQuestion = questions.find((q) => q.status === 'live');
  // Past answered / passed questions
  const answeredQuestions = questions
    .filter((q) => q.status === 'answered' || q.status === 'passed')
    .sort((a, b) => (b.seq || 0) - (a.seq || 0));

  // Reset submitted indicator when new live question arrives
  useEffect(() => {
    if (liveQuestion && liveQuestion.id !== submittedForQId) {
      setSubmittedForQId(null);
      setAnswerText('');
    }
  }, [liveQuestion, submittedForQId]);

  const handleLobbyReady = () => {
    if (socketRef.current) {
      socketRef.current.send('lobby_ready', {});
    }
  };

  const handleSubmitAnswer = (e) => {
    e.preventDefault();
    if (!liveQuestion || !socketRef.current) return;
    const text = answerText.trim();
    if (!text) return;

    socketRef.current.send('submit_answer', {
      question_id: liveQuestion.id,
      text,
    });
    setSubmittedForQId(liveQuestion.id);
  };

  const handlePassQuestion = () => {
    if (!liveQuestion || !socketRef.current) return;

    socketRef.current.send('pass_question', {
      question_id: liveQuestion.id,
    });
    setSubmittedForQId(liveQuestion.id);
  };

  // Find board members to show attendance row
  const boardMembers = participants.filter(
    (p) => p.seat_role === 'chairman' || p.seat_role === 'expert'
  );

  if (!roomCode || !participantId) {
    return (
      <div className="max-w-md mx-auto py-12 px-6 text-center">
        <div className="bg-white border border-gov-gray-300 rounded p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gov-navy-950">Invalid Candidate URL</h2>
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
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-4">
      {/* Top Telemetry Bar */}
      <div className="bg-white border border-gov-gray-300 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gov-gray-500 uppercase tracking-wider">Room:</span>
            <span className="font-mono text-base font-bold text-gov-navy-950 tracking-wider">
              {roomCode}
            </span>
          </div>

          <div className="h-4 w-px bg-gov-gray-300 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gov-gray-500 uppercase tracking-wider">Phase:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-gov-navy-100 text-gov-navy-900 border border-gov-navy-200">
              {currentPhase}
            </span>
          </div>

          <div className="h-4 w-px bg-gov-gray-300 hidden sm:block" />

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
            <p className="text-xs text-gov-gray-500">Candidate</p>
            <p className="text-sm font-bold text-gov-navy-950">
              {me ? me.display_name : 'Connecting…'}
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

      {/* Lobby State */}
      {isLobby ? (
        <div className="bg-white border border-gov-gray-300 rounded-lg p-8 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-gov-navy-50 border border-gov-navy-200 flex items-center justify-center text-gov-navy-900 text-xl font-bold">
            RAC
          </div>
          <h2 className="text-xl font-bold text-gov-navy-950">
            Welcome, {me?.display_name || 'Candidate'}
          </h2>
          <p className="text-sm text-gov-gray-600 max-w-lg mx-auto">
            You are connected to the Boardroom Lobby. Please confirm your readiness. Once you indicate readiness, the Interview Board Chairman will admit you to begin the session.
          </p>

          <div className="pt-2">
            {!isReady ? (
              <button
                type="button"
                onClick={handleLobbyReady}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 px-6 rounded text-sm transition-colors cursor-pointer shadow-xs"
              >
                ✓ I am Ready to Begin
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-md text-sm font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                Waiting for the board to admit you…
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Interview View (Post-Admit) */
        <div className="space-y-4">
          {/* Board Seats Attendance Bar */}
          <div className="bg-white border border-gov-gray-300 rounded-lg p-4 shadow-xs">
            <h3 className="text-xs font-bold text-gov-navy-950 uppercase tracking-wider mb-2">
              Interview Board Members
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {boardMembers.map((bm) => {
                const isAsker = liveQuestion?.asked_by === bm.id;
                return (
                  <div
                    key={bm.id}
                    className={`p-2.5 rounded border text-xs transition-colors ${
                      isAsker
                        ? 'bg-blue-50 border-blue-400 shadow-xs'
                        : 'bg-gov-gray-50 border-gov-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          bm.online ? 'bg-emerald-500' : 'bg-gov-gray-400'
                        }`}
                      />
                      <span className="font-bold text-gov-navy-950 truncate">
                        {bm.display_name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gov-gray-500">
                      <span className="capitalize">{bm.seat_role}</span>
                      {isAsker && (
                        <span className="font-bold text-blue-700 uppercase text-[10px]">
                          Posed Query
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Question Display & Answer Box */}
          <div className="bg-white border border-gov-gray-300 rounded-lg p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gov-gray-200 pb-2">
              <h2 className="text-xs font-bold text-gov-navy-950 uppercase tracking-wider">
                Current Question
              </h2>
              {liveQuestion && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                  #{liveQuestion.seq} · {liveQuestion.tag}
                </span>
              )}
            </div>

            {liveQuestion ? (
              <div className="space-y-4">
                <div className="p-4 bg-gov-navy-50/50 border border-gov-navy-200 rounded-lg">
                  <p className="text-base sm:text-lg font-semibold text-gov-navy-950 leading-relaxed">
                    {liveQuestion.text}
                  </p>
                </div>

                {submittedForQId === liveQuestion.id || lastAckQuestionId === liveQuestion.id ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-center text-emerald-900 text-sm font-semibold">
                    ✓ Answer received. Waiting for the next question…
                  </div>
                ) : (
                  <form onSubmit={handleSubmitAnswer} className="space-y-3">
                    <label className="block text-xs font-semibold text-gov-gray-700 uppercase tracking-wider">
                      Your Response
                    </label>
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Type your scientific, technical, or managerial answer here…"
                      rows={5}
                      maxLength={5000}
                      className="w-full px-3 py-2 border border-gov-gray-300 rounded text-sm focus:outline-none focus:border-gov-navy-700 bg-white"
                      required
                    />

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handlePassQuestion}
                        className="text-xs font-semibold text-gov-gray-600 hover:text-gov-navy-900 border border-gov-gray-300 hover:bg-gov-gray-100 py-2 px-3 rounded cursor-pointer transition-colors"
                      >
                        Pass this Question
                      </button>

                      <button
                        type="submit"
                        disabled={!answerText.trim()}
                        className="bg-gov-navy-900 hover:bg-gov-navy-800 text-white font-semibold py-2 px-5 rounded text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Submit Answer
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-gov-gray-500 bg-gov-gray-50 border border-gov-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gov-navy-950">
                  No active question at this moment.
                </p>
                <p className="text-xs text-gov-gray-500 mt-1">
                  The board is reviewing proceedings. The next query will appear here automatically.
                </p>
              </div>
            )}
          </div>

          {/* Past Answered History */}
          {answeredQuestions.length > 0 && (
            <div className="bg-white border border-gov-gray-300 rounded-lg p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gov-navy-950 uppercase tracking-wider border-b border-gov-gray-200 pb-2">
                Your Answered Questions ({answeredQuestions.length})
              </h3>
              <div className="space-y-3">
                {answeredQuestions.map((q) => (
                  <div key={q.id} className="p-3 bg-gov-gray-50 border border-gov-gray-200 rounded text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gov-navy-950">
                        Question #{q.seq} ({q.tag})
                      </span>
                      <span className="text-[10px] uppercase font-bold text-gov-gray-600">
                        {q.status}
                      </span>
                    </div>
                    <p className="text-gov-gray-900 font-medium">{q.text}</p>
                    {q.answer && (
                      <p className="text-gov-gray-700 italic border-t border-gov-gray-200 pt-1">
                        {q.answer.passed ? '[Passed]' : q.answer.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
