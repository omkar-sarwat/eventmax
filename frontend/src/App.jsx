import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from './layouts/MainLayout';
import LoadingScreen from './components/atoms/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailsPage = lazy(() => import('./pages/EventDetailsPage'));
const SeatSelectionPage = lazy(() => import('./pages/SeatSelectionPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ConfirmationPage = lazy(() => import('./pages/ConfirmationPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Main Layout Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailsPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
        </Route>
        
        {/* Booking Flow (outside main layout for full-screen experience) */}
        <Route path="/events/:id/seats" element={<SeatSelectionPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        
        {/* Protected Routes (require authentication) */}
        <Route element={<MainLayout />}>
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/my-bookings" element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          } />
          <Route path="/profile/bookings" element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Auth Routes (full screen, no header/footer) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
