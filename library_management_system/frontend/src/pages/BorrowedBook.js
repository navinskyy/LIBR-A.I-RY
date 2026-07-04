// frontend/src/pages/BorrowedBook.js
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './BorrowedBook.css';

const BorrowedBook = () => {
  const [books, setBooks] = useState([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedOverdue, setSelectedOverdue] = useState(null); // {title, overdueDays, amount}

  useEffect(() => {
    api
      .get('/reservations/history/')
      .then((res) => {
        const now = new Date();
        const mapped = res.data.map((item) => {
          const due = new Date(item.due_date);
          const diffDays = Math.floor(
            (due - now) / (1000 * 60 * 60 * 24)
          ); // positive = days left, negative = overdue

          let status = item.status;
          if (status === 'borrowed') {
            if (diffDays < 0) status = 'overdue';
            else if (diffDays <= 3) status = 'due-soon'; // 1–3 days left
            else status = 'on-time';
          }

          return {
            id: item.id, // reservation id
            title: item.book_title,
            author: item.book_author,
            dueDate: item.due_date.slice(0, 10),
            daysLeft: diffDays,
            status,
            coverUrl: item.book_cover_url || '/lib.png',
          };
        });
        setBooks(mapped);
      })
      .catch(() => setBooks([]));
  }, []);

  const handleRenew = (reservationId) => {
    setBooks((prev) =>
      prev.map((book) =>
        book.id === reservationId
          ? {
              ...book,
              daysLeft: book.daysLeft + 7,
              status: 'on-time',
            }
          : book
      )
    );
  };

  const handleReturn = async (reservationId) => {
    try {
      await api.post(`/reservations/return/${reservationId}/`);
      setBooks((prev) => prev.filter((book) => book.id !== reservationId));
    } catch (err) {
      alert('Failed to return book.');
    }
  };

  const handlePayClick = (book) => {
    const overdueDays = Math.abs(book.daysLeft);
    const amount = overdueDays * 10; 
    setSelectedOverdue({
      title: book.title,
      overdueDays,
      amount,
    });
    setShowPayModal(true);
  };

  const closePayModal = () => {
    setShowPayModal(false);
    setSelectedOverdue(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue':
        return '#d06255';
      case 'due-today':
      case 'due-soon':
        return '#e67e22';
      default:
        return '#315a39';
    }
  };

  const getStatusText = (daysLeft) => {
    if (daysLeft > 3) return `${daysLeft} days left`;
    if (daysLeft > 0) return `${daysLeft} days left (due soon)`;
    if (daysLeft === 0) return 'Due today';
    return `${Math.abs(daysLeft)} days overdue`;
  };

  return (
    <div className="borrowed-book-container">
      <div className="library-header">
        <div className="header-icon">
          {/* svg same as before */}
        </div>
        <h1>My Borrowed Books</h1>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-number">{books.length}</div>
          <div className="stat-label">Total Borrowed</div>
        </div>

        {/* Due Soon (1–3 days or today) */}
        <div className="stat-card due-soon">
          <div className="stat-number">
            {books.filter(
              (b) => b.status === 'due-soon' || b.status === 'due-today'
            ).length}
          </div>
          <div className="stat-label">Due Soon</div>
        </div>

        {/* Overdue */}
        <div className="stat-card overdue">
          <div className="stat-number">
            {books.filter((b) => b.status === 'overdue').length}
          </div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="books-grid">
        {books.map((book) => (
          <div key={book.id} className="book-card">
            <div className="book-cover">
              <img src={book.coverUrl} alt={book.title} />
              <div
                className="book-status"
                style={{ backgroundColor: getStatusColor(book.status) }}
              >
                {getStatusText(book.daysLeft)}
              </div>
            </div>

            <div className="book-info">
              <h2 className="book-title">{book.title}</h2>
              <p className="book-author">by {book.author}</p>

              <div className="due-date-info">
                <div className="due-label">Due:</div>
                <div className="due-value">{book.dueDate}</div>
              </div>

              <div className="book-actions">
                {book.status === 'overdue' ? (
                  <button
                    className="action-btn pay-btn"
                    onClick={() => handlePayClick(book)}
                  >
                    Pay
                  </button>
                ) : (
                  <>
                    <button
                      className="action-btn renew-btn"
                      onClick={() => handleRenew(book.id)}
                    >
                      Renew
                    </button>
                    <button
                      className="action-btn return-btn"
                      onClick={() => handleReturn(book.id)}
                    >
                      Return
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {books.length === 0 && (
        <div className="empty-state">
          {/* same empty state as before */}
        </div>
      )}

      {/* Simple Pay modal */}
      {showPayModal && selectedOverdue && (
        <div className="pay-modal-backdrop">
          <div className="pay-modal">
            <h2>Overdue Payment</h2>
            <p>
              Book: <strong>{selectedOverdue.title}</strong>
            </p>
            <p>
              Overdue days: <strong>{selectedOverdue.overdueDays}</strong>
            </p>
            <p>
              Amount to pay: <strong>{selectedOverdue.amount} PHP</strong>
            </p>
            <div className="pay-modal-actions">
              <button
                className="action-btn close-btn"
                onClick={closePayModal}
              >
                Close
              </button>
              <button
                className="action-btn confirm-btn"
                onClick={closePayModal}
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowedBook;
