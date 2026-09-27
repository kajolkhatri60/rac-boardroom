import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui';
import RouteGuard, { PublicOnlyGuard } from './components/RouteGuard';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdvertisementsList from './pages/admin/AdvertisementsList';
import AdvertisementForm from './pages/admin/AdvertisementForm';
import AdvertisementDetail from './pages/admin/AdvertisementDetail';
import ApplicationsList from './pages/admin/ApplicationsList';
import ApplicationReview from './pages/admin/ApplicationReview';
import InterviewsList from './pages/admin/InterviewsList';
import BoardMembers from './pages/admin/BoardMembers';

// Board Pages
import BoardMyInterviews from './pages/board/MyInterviews';
import PreInterview from './pages/board/PreInterview';

// Applicant Pages
import OpenAdvertisements from './pages/applicant/OpenAdvertisements';
import ApplicantAdvertisementDetail from './pages/applicant/AdvertisementDetail';
import ApplyForm from './pages/applicant/ApplyForm';
import MyApplications from './pages/applicant/MyApplications';
import ApplicantMyInterviews from './pages/applicant/MyInterviews';

// Live Interview Rooms & Dev Pages
import BoardRoom from './pages/BoardRoom';
import CandidateRoom from './pages/CandidateRoom';
import Join from './pages/Join';
import ComponentSheet from './pages/dev/ComponentSheet';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Redirect / to /login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public Auth Routes (Redirect logged in users to their role home) */}
          <Route
            path="/login"
            element={
              <PublicOnlyGuard>
                <Login />
              </PublicOnlyGuard>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyGuard>
                <Register />
              </PublicOnlyGuard>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <RouteGuard allowedRoles={['admin']}>
                <AdminDashboard />
              </RouteGuard>
            }
          />
          <Route
            path="/admin/advertisements"
            element={
              <RouteGuard allowedRoles={['admin']}>
                <AdvertisementsList />
              </RouteGuard>
            }
          />
          <Route
            path="/admin/advertisements/new"
            element={
              <RouteGuard allowedRoles={['admin']}>
                <AdvertisementForm />
              </RouteGuard>
            }
          />
          <Route
            path="/admin/advertisements/:id/edit"
            element={
              <RouteGuard allowedRoles={['admin']}>
                <AdvertisementForm />
              </RouteGuard>
            }
          />
          <Route
            path="/admin/advertisements/:id"
            element={
              <RouteGuard allowedRoles={['admin']}>
                <AdvertisementDetail />
              </RouteGuard>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <RouteGuard allowedRoles={['admin']}>
                <ApplicationsList />
              </RouteGuard>
            }
          />
          <Route
            path="/admin/applications/:id"
            element={
              <RouteGuard allowedRoles={['admin']}>
                <ApplicationReview />
              </RouteGuard>
            }
          />
          <Route
            path="/admin/interviews"
            element={
              <RouteGuard allowedRoles={['admin']}>
                <InterviewsList />
              </RouteGuard>
            }
          />
          <Route
            path="/admin/board-members"
            element={
              <RouteGuard allowedRoles={['admin']}>
                <BoardMembers />
              </RouteGuard>
            }
          />

          {/* Board Routes */}
          <Route
            path="/board"
            element={
              <RouteGuard allowedRoles={['board']}>
                <BoardMyInterviews />
              </RouteGuard>
            }
          />
          <Route
            path="/board/interviews/:id"
            element={
              <RouteGuard allowedRoles={['board']}>
                <PreInterview />
              </RouteGuard>
            }
          />

          {/* Applicant Routes */}
          <Route
            path="/applicant/advertisements"
            element={
              <RouteGuard allowedRoles={['applicant']}>
                <OpenAdvertisements />
              </RouteGuard>
            }
          />
          <Route
            path="/applicant/advertisements/:id"
            element={
              <RouteGuard allowedRoles={['applicant']}>
                <ApplicantAdvertisementDetail />
              </RouteGuard>
            }
          />
          <Route
            path="/applicant/advertisements/:id/apply"
            element={
              <RouteGuard allowedRoles={['applicant']}>
                <ApplyForm />
              </RouteGuard>
            }
          />
          <Route
            path="/applicant/applications"
            element={
              <RouteGuard allowedRoles={['applicant']}>
                <MyApplications />
              </RouteGuard>
            }
          />
          <Route
            path="/applicant/interviews"
            element={
              <RouteGuard allowedRoles={['applicant']}>
                <ApplicantMyInterviews />
              </RouteGuard>
            }
          />

          {/* Live Interview Rooms (Unprotected until P7 token auth) */}
          <Route path="/room/:code/board" element={<BoardRoom />} />
          <Route path="/room/:code/candidate" element={<CandidateRoom />} />

          {/* Dev Routes */}
          <Route path="/dev/ui" element={<ComponentSheet />} />
          <Route path="/dev/join" element={<Join />} />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
