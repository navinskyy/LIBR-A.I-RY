// frontend/src/pages/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);          // 15 per page
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadReservations = async () => {
      try {
        setLoading(true);
        const res = await api.get('/reservations/all/', {
          params: { page, page_size: pageSize },
        });
        setReservations(res.data.results);
        setTotalPages(res.data.total_pages);
        setError(null);
      } catch (err) {
        setError('Failed to load reservations. Please try again later.');
        console.error('Error loading reservations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
  }, [page, pageSize]);

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      borrowed: {
        className: 'status-badge status-badge-borrowed',
        label: 'Borrowed',
      },
      returned: {
        className: 'status-badge status-badge-returned',
        label: 'Returned',
      },
      overdue: {
        className: 'status-badge status-badge-overdue',
        label: 'OVERDUE',
      },
      pending: {
        className: 'status-badge status-badge-pending',
        label: 'Pending',
      },
    };

    const config =
      statusConfig[status] || {
        className: 'status-badge status-badge-default',
        label: status,
      };

    return <span className={config.className}>{config.label}</span>;
  };

  // simple client-side filter by user or book text
  const filteredReservations = reservations.filter((r) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const userText = (r.user_username || '').toLowerCase();
    const bookText = (r.book_title || '').toLowerCase();
    return userText.includes(term) || bookText.includes(term);
  });

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Admin Dashboard</h1>
          <p className="header-subtitle">Manage book reservations</p>
        </div>
      </header>

      <main className="dashboard-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="stat-text">
              <h3 className="stat-value">{reservations.length}</h3>
              <p className="stat-label">Total Reservations</p>
            </div>
            <div className="stat-spacer" />
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-text">
              <h3 className="stat-value">
                {reservations.filter((r) => r.status === 'borrowed').length}
              </h3>
              <p className="stat-label">Currently Borrowed</p>
            </div>
            <div className="stat-spacer" />
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-text">
              <h3 className="stat-value">
                {reservations.filter(
                  (r) =>
                    (!r.return_date && r.overdue_unreturned) ||
                    r.status === 'overdue'
                ).length}
              </h3>
              <p className="stat-label">Overdue Books</p>
            </div>
            <div className="stat-spacer" />
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-text">
              <h3 className="stat-value">
                {reservations.filter((r) => r.status === 'returned').length}
              </h3>
              <p className="stat-label">Returned Books</p>
            </div>
            <div className="stat-spacer" />
          </div>
        </div>

        <section className="card reservations-section">
          <div className="card-header">
            <div className="header-left">
              <h2 className="card-title">Borrowed Books Overview</h2>
              <p className="card-subtitle">All reservations across the system</p>
            </div>

            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by student or book..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="button"
                className="search-button"
                onClick={() => setPage(1)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="icon-16" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading reservations...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon-48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="btn-primary">
                  Retry
                </button>
              </div>
            ) : (
              <>
                <table className="reservations-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Book</th>
                      <th>Borrowed On</th>
                      <th>Due Date</th>
                      <th>Returned On</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.map((r) => (
                      <tr key={r.id}>
                        <td className="user-cell">
                          <div className="user-info">
                            <div className="user-avatar">
                              {r.user_username?.charAt(0) || '?'}
                            </div>
                            <div className="user-details">
                              <div className="user-name">{r.user_username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="book-cell">
                          <div className="book-info">
                            <div className="book-title">{r.book_title}</div>
                          </div>
                        </td>
                        <td className="date-cell">
                          <div className="date-display">
                            {r.borrow_date?.slice(0, 10) || '-'}
                          </div>
                        </td>
                        <td className="date-cell">
                          <div className="date-display">
                            {r.due_date?.slice(0, 10) || '-'}
                          </div>
                        </td>
                        <td className="date-cell">
                          <div
                            className={
                              'date-display' +
                              (r.overdue_unreturned && !r.return_date ? ' overdue' : '')
                            }
                          >
                            {r.return_date
                              ? r.return_date.slice(0, 10)
                              : r.overdue_unreturned
                              ? 'OVERDUE'
                              : '-'}
                          </div>
                        </td>
                        <td className="status-cell">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}

                    {filteredReservations.length === 0 && (
                      <tr>
                        <td colSpan="6" className="empty-state">
                          <svg xmlns="http://www.w3.org/2000/svg" className="icon-64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <p>No reservations found.</p>
                          <p className="empty-subtitle">Start by adding a new reservation</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {totalPages > 1 && (
  <div className="pagination">
    <button
      onClick={() => setPage((p) => Math.max(1, p - 1))}
      disabled={page === 1}
      className="pagination-btn"
    >
      <span className="pagination-arrow">{'<'}</span>
      <span>Previous</span>
    </button>

    <div className="pagination-info">
      Page {page} of {totalPages}
    </div>

    <button
      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
      disabled={page === totalPages}
      className="pagination-btn"
    >
      <span>Next</span>
      <span className="pagination-arrow">{'>'}</span>
    </button>
  </div>
)}

              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
