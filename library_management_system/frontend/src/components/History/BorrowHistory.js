import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './BorrowHistory.css';

const BorrowHistory = () => {
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/reservations/history/');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to load borrow history', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleReturn = async (reservationId) => {
    try {
      await api.post(`/reservations/return/${reservationId}/`);
      await fetchHistory(); // refresh list
    } catch (err) {
      console.error('Failed to return book', err);
    }
  };

  return (
    <div className="borrow-history-container">
      <h2 className="borrow-history-title">Borrow History</h2>

      <div className="borrow-history-grid">
        {history.map((res) => (
          <div key={res.id} className="borrow-card">
            {/* Cover image */}
            {res.book_cover_url && (
              <div className="borrow-cover-wrapper">
                <img
                  src={res.book_cover_url}
                  alt={res.book_title}
                  className="borrow-cover"
                />
              </div>
            )}

            <div className="borrow-card-body">
              <h3 className="borrow-book-title">{res.book_title}</h3>
              <p className="borrow-book-author">by {res.book_author}</p>

              <div className="borrow-dates">
                <p>
                  <strong>Borrowed:</strong> {res.borrow_date}
                </p>
                <p>
                  <strong>Due:</strong> {res.due_date}
                </p>
              </div>

              <p className={`borrow-status borrow-status-${res.status}`}>
                Status: {res.status}
              </p>

              {res.status === 'borrowed' && (
                <button
                  onClick={() => handleReturn(res.id)}
                  className="borrow-return-btn"
                >
                  Return
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BorrowHistory;
