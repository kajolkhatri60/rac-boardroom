import { create } from 'zustand';

/**
 * Zustand room store holding session telemetry, participants, questions,
 * and connection status.
 */
export const useRoomStore = create((set, get) => ({
  session: null,
  me: null,
  participants: [],
  questions: [],
  connectionStatus: 'disconnected', // 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  lastError: null,
  lastAckQuestionId: null,

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setLastError: (msg) => set({ lastError: msg }),
  clearError: () => set({ lastError: null }),

  reset: () =>
    set({
      session: null,
      me: null,
      participants: [],
      questions: [],
      connectionStatus: 'disconnected',
      lastError: null,
      lastAckQuestionId: null,
    }),

  handleServerMessage: (msg) => {
    if (!msg || !msg.type) return;

    const { type, payload } = msg;

    switch (type) {
      case 'snapshot': {
        set({
          session: payload.session || null,
          me: payload.me || null,
          participants: payload.participants || [],
          questions: payload.questions || [],
        });
        break;
      }

      case 'participant_joined': {
        const { participant_id, display_name, seat_role } = payload;
        set((state) => {
          const exists = state.participants.some((p) => p.id === participant_id);
          const updated = exists
            ? state.participants.map((p) =>
                p.id === participant_id ? { ...p, online: true } : p
              )
            : [
                ...state.participants,
                {
                  id: participant_id,
                  display_name,
                  seat_role,
                  specialisation: null,
                  is_ai: false,
                  online: true,
                  ready: false,
                },
              ];
          return { participants: updated };
        });
        break;
      }

      case 'participant_left': {
        const { participant_id } = payload;
        set((state) => ({
          participants: state.participants.map((p) =>
            p.id === participant_id ? { ...p, online: false } : p
          ),
        }));
        break;
      }

      case 'candidate_ready': {
        set((state) => ({
          participants: state.participants.map((p) =>
            p.seat_role === 'candidate' ? { ...p, ready: true } : p
          ),
          me: state.me?.seat_role === 'candidate' ? { ...state.me, ready: true } : state.me,
        }));
        break;
      }

      case 'phase_changed': {
        const { phase } = payload;
        set((state) => ({
          session: state.session ? { ...state.session, phase } : { phase },
        }));
        break;
      }

      case 'question_live': {
        const newQ = payload;
        set((state) => {
          const exists = state.questions.some((q) => q.id === newQ.id);
          const updated = exists
            ? state.questions.map((q) => (q.id === newQ.id ? { ...q, ...newQ, status: 'live' } : q))
            : [...state.questions, { ...newQ, status: 'live' }];
          return { questions: updated };
        });
        break;
      }

      case 'question_queued': {
        const newQ = payload;
        set((state) => {
          const exists = state.questions.some((q) => q.id === newQ.id);
          const updated = exists
            ? state.questions.map((q) => (q.id === newQ.id ? { ...q, ...newQ, status: 'queued' } : q))
            : [...state.questions, { ...newQ, status: 'queued' }];
          return { questions: updated };
        });
        break;
      }

      case 'answer_submitted': {
        const { question_id, text, passed, duration_s } = payload;
        set((state) => ({
          questions: state.questions.map((q) => {
            if (q.id === question_id) {
              return {
                ...q,
                status: passed ? 'passed' : 'answered',
                answer: {
                  question_id,
                  text,
                  passed,
                  duration_s,
                },
              };
            }
            return q;
          }),
        }));
        break;
      }

      case 'answer_ack': {
        const { question_id } = payload;
        set({ lastAckQuestionId: question_id });
        break;
      }

      case 'error': {
        set({ lastError: payload.message || 'An error occurred.' });
        break;
      }

      case 'pong':
      default:
        break;
    }
  },
}));
