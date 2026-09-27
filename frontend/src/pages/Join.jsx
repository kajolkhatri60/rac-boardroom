import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createSession, joinSession } from '../lib/api';

// TEMPORARY: pid in the URL until login exists (Stage 3).

export default function Join() {
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [seatRole, setSeatRole] = useState('candidate');
  const [specialisation, setSpecialisation] = useState('');

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdNotice, setCreatedNotice] = useState(null);
  const [error, setError] = useState(null);

  const handleCreateRoom = async () => {
    setError(null);
    setCreating(true);
    setCreatedNotice(null);
    try {
      const session = await createSession('live');
      setRoomCode(session.room_code);
      setCreatedNotice(`New room created: ${session.room_code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanCode = roomCode.trim().toUpperCase();
    const cleanName = displayName.trim();

    if (!cleanCode) {
      setError('Please enter a 6-character room code.');
      return;
    }
    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }
    if (seatRole === 'expert' && !specialisation.trim()) {
      setError('Please specify your technical domain or specialisation.');
      return;
    }

    setLoading(true);
    try {
      const participant = await joinSession(cleanCode, {
        display_name: cleanName,
        seat_role: seatRole,
        specialisation: seatRole === 'expert' ? specialisation.trim() : null,
      });

      // TEMPORARY: pid in the URL until login exists (Stage 3).
      if (seatRole === 'candidate') {
        navigate(`/room/${cleanCode}/candidate?pid=${participant.id}`);
      } else {
        navigate(`/room/${cleanCode}/board?pid=${participant.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <div className="bg-white border border-gov-gray-300 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gov-navy-950 text-center tracking-tight">
          Join interview session
        </h1>
        <p className="text-xs text-gov-gray-600 text-center mt-1">
          DRDO Recruitment &amp; Assessment Centre · Boardroom Simulation
        </p>

        {/* Create new room shortcut */}
        <div className="mt-5 p-3.5 bg-gov-gray-50 border border-gov-gray-200 rounded text-center">
          <p className="text-xs text-gov-gray-600 mb-2">Need a new interview room for simulation?</p>
          <button
            type="button"
            onClick={handleCreateRoom}
            disabled={creating}
            className="w-full bg-white hover:bg-gov-gray-100 text-gov-navy-900 border border-gov-gray-300 text-xs font-semibold py-2 px-3 rounded shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {creating ? 'Creating room…' : 'Create new room'}
          </button>
          {createdNotice && (
            <p className="text-xs font-mono font-bold text-emerald-700 mt-2">
              {createdNotice}
            </p>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">
            <strong>Error: </strong> {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gov-gray-700 mb-1">
              Room code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7X9K2P"
              maxLength={6}
              className="w-full px-3 py-2 border border-gov-gray-300 rounded text-center font-mono uppercase text-lg focus:outline-none focus:border-gov-navy-700 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gov-gray-700 mb-1">
              Your name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Dr. A. Sharma or Priya Verma"
              className="w-full px-3 py-2 border border-gov-gray-300 rounded text-sm focus:outline-none focus:border-gov-navy-700 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gov-gray-700 mb-1">
              Seat role
            </label>
            <select
              value={seatRole}
              onChange={(e) => setSeatRole(e.target.value)}
              className="w-full px-3 py-2 border border-gov-gray-300 rounded text-sm focus:outline-none focus:border-gov-navy-700 bg-white"
            >
              <option value="candidate">Candidate</option>
              <option value="chairman">Board Chairman (Max 1)</option>
              <option value="expert">Subject Matter Expert (Max 4)</option>
            </select>
          </div>

          {seatRole === 'expert' && (
            <div>
              <label className="block text-xs font-semibold text-gov-gray-700 mb-1">
                Domain or specialisation
              </label>
              <input
                type="text"
                value={specialisation}
                onChange={(e) => setSpecialisation(e.target.value)}
                placeholder="e.g. Radar Systems, Aerodynamics, Propellants"
                className="w-full px-3 py-2 border border-gov-gray-300 rounded text-sm focus:outline-none focus:border-gov-navy-700 bg-white"
                required={seatRole === 'expert'}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gov-navy-900 hover:bg-gov-navy-800 text-white font-medium py-2.5 rounded text-sm transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Joining room…' : 'Enter interview room'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gov-gray-200 pt-4">
          <Link
            to="/login"
            className="text-xs text-gov-navy-700 hover:text-gov-navy-900 font-medium underline"
          >
            Return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
