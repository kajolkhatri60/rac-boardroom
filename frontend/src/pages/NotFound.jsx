import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto py-16 px-6 text-center">
      <div className="bg-white border border-gov-gray-300 rounded p-8 shadow-sm">
        <h1 className="text-4xl font-bold text-gov-navy-950">404</h1>
        <p className="text-lg font-semibold text-gov-gray-800 mt-2">Page Not Found</p>
        <p className="text-sm text-gov-gray-600 mt-1">
          The requested page or interview session route does not exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-block bg-gov-navy-800 hover:bg-gov-navy-900 text-white font-medium text-sm px-4 py-2 rounded transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
