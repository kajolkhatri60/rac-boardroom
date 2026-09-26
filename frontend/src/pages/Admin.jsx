import { Link } from 'react-router-dom';

export default function Admin() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="bg-white border border-gov-gray-300 rounded p-6 shadow-sm">
        <div className="border-b border-gov-gray-200 pb-4 mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gov-navy-950">RAC Admin Portal</h1>
            <p className="text-sm text-gov-gray-600 mt-0.5">Post management, applicant review, and board scheduling</p>
          </div>
          <Link
            to="/"
            className="text-sm text-gov-navy-700 hover:text-gov-navy-900 font-medium underline"
          >
            ← Back to Home
          </Link>
        </div>
        <div className="p-8 text-center text-gov-gray-600 bg-gov-gray-50 border border-gov-gray-200 rounded">
          <p className="font-medium">Admin functionality placeholder.</p>
          <p className="text-xs text-gov-gray-500 mt-1">
            This module will manage posts, candidate applications, AI-assisted shortlisting, and board assignments.
          </p>
        </div>
      </div>
    </div>
  );
}
