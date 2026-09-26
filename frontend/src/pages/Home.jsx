import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="bg-white border border-gov-gray-300 rounded p-8 shadow-sm">
        <div className="border-b border-gov-gray-200 pb-6 mb-8 text-center">
          <h1 className="text-3xl font-bold text-gov-navy-950 tracking-tight">
            RAC Boardroom Simulator
          </h1>
          <p className="text-lg text-gov-gray-600 mt-2 font-medium">
            PSWB01 – Selector-Applicant Simulation Software
          </p>
          <p className="text-sm text-gov-gray-500 mt-1">
            Recruitment and Assessment Centre (RAC) · Defence Research &amp; Development Organisation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/admin"
            className="flex flex-col p-5 border border-gov-gray-300 rounded bg-gov-gray-50 hover:bg-gov-gray-100 hover:border-gov-navy-700 transition-colors"
          >
            <span className="font-semibold text-gov-navy-900 text-lg">Admin Portal</span>
            <span className="text-sm text-gov-gray-600 mt-1">
              Publish vacancies, shortlist applicants, schedule boards, and manage sessions.
            </span>
          </Link>

          <Link
            to="/board/K7P2QX"
            className="flex flex-col p-5 border border-gov-gray-300 rounded bg-gov-gray-50 hover:bg-gov-gray-100 hover:border-gov-navy-700 transition-colors"
          >
            <span className="font-semibold text-gov-navy-900 text-lg">Board Room</span>
            <span className="text-sm text-gov-gray-600 mt-1">
              Selector console for chairman and experts (Sample session: K7P2QX).
            </span>
          </Link>

          <Link
            to="/candidate/K7P2QX"
            className="flex flex-col p-5 border border-gov-gray-300 rounded bg-gov-gray-50 hover:bg-gov-gray-100 hover:border-gov-navy-700 transition-colors"
          >
            <span className="font-semibold text-gov-navy-900 text-lg">Candidate Room</span>
            <span className="text-sm text-gov-gray-600 mt-1">
              Applicant interview interface with live audio transcript and response panel.
            </span>
          </Link>

          <Link
            to="/join"
            className="flex flex-col p-5 border border-gov-gray-300 rounded bg-gov-gray-50 hover:bg-gov-gray-100 hover:border-gov-navy-700 transition-colors"
          >
            <span className="font-semibold text-gov-navy-900 text-lg">Join Interview</span>
            <span className="text-sm text-gov-gray-600 mt-1">
              Enter a 6-character room code to access the scheduled interview lobby.
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
