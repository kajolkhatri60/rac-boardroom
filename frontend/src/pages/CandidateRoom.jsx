import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useRoomStore } from '../realtime/roomStore';
import { connectRoomSocket } from '../realtime/socket';
import { useCandidateMedia } from '../lib/media/useCandidateMedia';
import { useMicLevel } from '../lib/media/useMicLevel';
import { useFaceDetection } from '../proctoring/useFaceDetection';
import { speak, cancel as cancelSpeech } from '../lib/speech/speak';
import { useSpeechToText } from '../lib/speech/useSpeechToText';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Video,
} from 'lucide-react';

// Rule 1 (docs/06_RULES.md): Candidate screen never receives, renders, or calculates scores, marks, or queued questions.
// Rule 8 (S4a): Candidate sees only: "Camera monitoring is on." No warnings/counters/alerts.

const CONSENT_TEXT =
  'My camera and microphone will be shared live with the interview board. Camera monitoring will note if my face is not visible or if I switch tabs. Nothing is recorded.';

export default function CandidateRoom() {
  const { code, sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const roomCode = (code || sessionId || '').toUpperCase();
  const participantId = Number(searchParams.get('pid'));

  const socketRef = useRef(null);
  const videoRef = useRef(null);

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

  // Lobby device checks & consent state
  const [consentGiven, setConsentGiven] = useState(false);

  // Speech options
  const [readAloud, setReadAloud] = useState(true);

  // Media hook (shared camera + mic stream)
  const { stream, error: mediaError, hasVideo, hasAudio } = useCandidateMedia();
  const { volume, isMicWorking } = useMicLevel(stream);

  const currentPhase = session?.phase || 'lobby';
  const isLobby = currentPhase === 'lobby';

  // Attach stream to videoRef whenever stream or videoRef becomes available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isLobby]);

  // Face detection & silent proctoring
  const { faceCount, isDetectorReady } = useFaceDetection({
    videoRef,
    stream,
    isActive: !isLobby,
    onSendEvent: (evt) => {
      if (socketRef.current) {
        socketRef.current.send('proctor_event', evt);
      }
    },
  });

  // Speech-to-text hook
  const {
    isSupported: sttSupported,
    isListening,
    start: startStt,
    stop: stopStt,
    reset: resetStt,
  } = useSpeechToText({
    onTranscriptChange: (text) => {
      setAnswerText(text);
    },
  });

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
      navigate(`/room/${roomCode}/board?pid=${participantId}`, { replace: true });
    }
  }, [me, roomCode, participantId, navigate]);

  // Candidate ready status
  const isReady = Boolean(me?.ready);

  // Current live question
  const liveQuestion = questions.find((q) => q.status === 'live');
  const answeredQuestions = questions
    .filter((q) => q.status === 'answered' || q.status === 'passed')
    .sort((a, b) => (b.seq || 0) - (a.seq || 0));

  // Auto read questions aloud when live question changes
  useEffect(() => {
    if (liveQuestion && liveQuestion.id !== submittedForQId) {
      setSubmittedForQId(null);
      setAnswerText('');
      stopStt({ updateText: false });
      resetStt();

      if (readAloud && liveQuestion.text) {
        speak(liveQuestion.text);
      }
    }
    return () => {
      cancelSpeech();
    };
  }, [liveQuestion, submittedForQId, readAloud, stopStt, resetStt]);

  // 4 lobby checklist conditions
  const cameraOk = hasVideo;
  const micOk = isMicWorking;
  const faceOk = faceCount === 1;
  const allChecksPassed = cameraOk && micOk && faceOk && consentGiven;

  const handleLobbyReady = () => {
    if (socketRef.current && allChecksPassed) {
      socketRef.current.send('lobby_ready', {});
    }
  };

  const handleToggleSpeakAnswer = () => {
    if (isListening) {
      stopStt();
    } else {
      cancelSpeech();
      startStt(answerText);
    }
  };

  const handleAnswerChange = (e) => {
    if (isListening) {
      stopStt({ updateText: false });
    }
    setAnswerText(e.target.value);
  };

  const handleSubmitAnswer = (e) => {
    e.preventDefault();
    if (!liveQuestion || !socketRef.current) return;
    const text = answerText.trim();
    if (!text) return;

    stopStt({ updateText: false });
    resetStt();
    cancelSpeech();

    socketRef.current.send('submit_answer', {
      question_id: liveQuestion.id,
      text,
    });
    setSubmittedForQId(liveQuestion.id);
  };

  const handlePassQuestion = () => {
    if (!liveQuestion || !socketRef.current) return;

    stopStt({ updateText: false });
    resetStt();
    cancelSpeech();

    socketRef.current.send('pass_question', {
      question_id: liveQuestion.id,
    });
    setSubmittedForQId(liveQuestion.id);
  };

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
            to="/dev/join"
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
            to="/dev/join"
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

      {/* Media Device Error Banner */}
      {mediaError && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg">
          <strong>Device access issue: </strong> {mediaError}
        </div>
      )}

      {/* Lobby State: Device Check & Confirmation */}
      {isLobby ? (
        <div className="bg-white border border-gov-gray-300 rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-gov-navy-50 border border-gov-navy-200 flex items-center justify-center text-gov-navy-900 text-xl font-bold">
              RAC
            </div>
            <h2 className="text-xl font-bold text-gov-navy-950">
              Welcome, {me?.display_name || 'Candidate'}
            </h2>
            <p className="text-sm text-gov-gray-600 max-w-xl mx-auto">
              Please complete your device check and confirm consent before beginning the interview.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-3xl mx-auto">
            {/* Left: Camera Preview & Mic Level */}
            <div className="space-y-3">
              <div className="relative aspect-4/3 w-full bg-gov-gray-900 rounded-lg overflow-hidden border border-gov-gray-300 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {!hasVideo && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-gov-gray-400 p-4 text-center">
                    <Video className="w-8 h-8 mb-2 opacity-50" />
                    <span>Camera is loading or permission required</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-white">
                  Preview (Mirrored)
                </div>
              </div>

              {/* Mic Level Meter */}
              <div className="bg-gov-gray-50 border border-gov-gray-200 rounded p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gov-navy-950">Microphone Level:</span>
                  <span className="text-gov-gray-500 font-mono text-[11px]">
                    {micOk ? 'Active' : 'Speak to verify'}
                  </span>
                </div>
                <div className="h-2 w-full bg-gov-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-75"
                    style={{ width: `${volume}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Device Check Status & Consent */}
            <div className="space-y-4">
              <div className="border border-gov-gray-200 rounded-lg p-4 bg-gov-gray-50/50 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gov-navy-950 border-b border-gov-gray-200 pb-1.5">
                  Device &amp; Environment Readiness
                </h3>

                <ul className="space-y-2.5 text-xs">
                  {/* 1. Camera check */}
                  <li className="flex items-start gap-2">
                    {cameraOk ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold text-gov-navy-950">Camera working</span>
                      {!cameraOk && (
                        <p className="text-gov-gray-500 text-[11px]">Allow camera access in your browser.</p>
                      )}
                    </div>
                  </li>

                  {/* 2. Microphone check */}
                  <li className="flex items-start gap-2">
                    {micOk ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold text-gov-navy-950">Microphone working</span>
                      {!micOk && (
                        <p className="text-gov-gray-500 text-[11px]">Speak into your microphone to verify.</p>
                      )}
                    </div>
                  </li>

                  {/* 3. One face visible check */}
                  <li className="flex items-start gap-2">
                    {faceOk ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold text-gov-navy-950">One face visible</span>
                      {faceCount === null && (
                        <p className="text-gov-gray-500 text-[11px]">Detecting face…</p>
                      )}
                      {faceCount === 0 && (
                        <p className="text-amber-800 text-[11px]">Position your face in front of the camera.</p>
                      )}
                      {faceCount > 1 && (
                        <p className="text-amber-800 text-[11px]">Only one person should be in front of the camera.</p>
                      )}
                    </div>
                  </li>

                  {/* 4. Consent given */}
                  <li className="flex items-start gap-2">
                    {consentGiven ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold text-gov-navy-950">Consent given</span>
                      {!consentGiven && (
                        <p className="text-gov-gray-500 text-[11px]">Check the consent box below.</p>
                      )}
                    </div>
                  </li>
                </ul>
              </div>

              {/* Consent Box */}
              <div className="p-3 bg-white border border-gov-gray-300 rounded-lg">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gov-gray-800 select-none">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 rounded border-gov-gray-300 text-gov-navy-900 focus:ring-gov-navy-700"
                  />
                  <span className="leading-relaxed">{CONSENT_TEXT}</span>
                </label>
              </div>

              {/* Ready Button */}
              <div className="pt-1">
                {!isReady ? (
                  <button
                    type="button"
                    onClick={handleLobbyReady}
                    disabled={!allChecksPassed}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 px-4 rounded text-sm transition-colors cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ✓ I am Ready to Begin
                  </button>
                ) : (
                  <div className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-md text-sm font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                    Waiting for the board to admit you…
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Interview View (Post-Admit) */
        <div className="space-y-4">
          {/* Silent Proctoring Status & Self-View Header */}
          <div className="bg-white border border-gov-gray-300 rounded-lg p-3 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gov-navy-950">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Camera monitoring is on.</span>
            </div>

            {/* Self-view preview keeps stream alive for proctoring and upcoming WebRTC */}
            <div className="relative w-28 sm:w-36 aspect-video bg-gov-gray-950 rounded border border-gov-gray-300 overflow-hidden shrink-0 shadow-xs">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <span className="absolute bottom-0.5 left-1 text-[9px] font-medium bg-black/60 text-white px-1 rounded">
                Self-View
              </span>
            </div>
          </div>

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
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-gov-navy-950 uppercase tracking-wider">
                  Current Question
                </h2>
                {liveQuestion && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                    #{liveQuestion.seq} · {liveQuestion.tag}
                  </span>
                )}
              </div>

              {/* Read Aloud Toggle */}
              {liveQuestion && (
                <button
                  type="button"
                  onClick={() => {
                    if (readAloud) {
                      cancelSpeech();
                    } else if (liveQuestion.text) {
                      speak(liveQuestion.text);
                    }
                    setReadAloud(!readAloud);
                  }}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                    readAloud
                      ? 'bg-gov-navy-50 text-gov-navy-900 border-gov-navy-300 font-semibold'
                      : 'bg-white text-gov-gray-600 border-gov-gray-300'
                  }`}
                  title="Toggle question reading aloud"
                >
                  {readAloud ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-gov-navy-900" />
                      <span>Read aloud: On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-gov-gray-500" />
                      <span>Read aloud: Off</span>
                    </>
                  )}
                </button>
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
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-gov-gray-700 uppercase tracking-wider">
                        Your Response
                      </label>

                      {/* Voice Answer Dictate Button */}
                      {sttSupported && (
                        <button
                          type="button"
                          onClick={handleToggleSpeakAnswer}
                          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded font-semibold transition-colors cursor-pointer border ${
                            isListening
                              ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                              : 'bg-gov-gray-100 hover:bg-gov-gray-200 text-gov-navy-900 border-gov-gray-300'
                          }`}
                        >
                          {isListening ? (
                            <>
                              <MicOff className="w-3.5 h-3.5 text-rose-700" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-3.5 h-3.5 text-gov-navy-900" />
                              <span>Speak answer</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <textarea
                      value={answerText}
                      onChange={handleAnswerChange}
                      placeholder="Type or speak your scientific, technical, or managerial answer here…"
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
