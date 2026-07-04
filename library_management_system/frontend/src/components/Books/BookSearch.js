import React, { useState } from 'react';
import api from '../../services/api';
import './BookSearch.css';

const PAGE_SIZE = 6;

const BookSearch = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [modalMessage, setModalMessage] = useState('');

  // derive admin flag from localStorage
  const storedUser = localStorage.getItem('user');
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin =
    localStorage.getItem('isAdmin') === 'true' || parsedUser?.is_staff || false;

  // edit modal state
  const [editingBook, setEditingBook] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    cover_url: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const res = await api.get(`/books/search/?q=${query}`);
      setSearchResults(res.data);
      setPage(1);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReserve = async (bookId) => {
    try {
      await api.post('/reservations/reserve/', { book_id: bookId });
      setModalMessage('Book reserved successfully!');
    } catch (error) {
      console.error('Reservation failed:', error);
      const serverMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        'This book is already reserved';
      setModalMessage(serverMessage);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSearchResults([]);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(searchResults.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const visibleResults = searchResults.slice(start, end);

  const CenterModal = ({ message, onClose }) => {
    if (!message) return null;
    return (
      <div className="modal-backdrop">
        <div className="modal-box">
          <p>{message}</p>
          <button className="reserve-btn" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    );
  };

  // open edit popup
  const handleEdit = (book) => {
    setEditingBook(book);
    setEditForm({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      genre: book.genre || '',
      cover_url: book.cover_url || '',
    });
  };

  const closeEditModal = () => {
    setEditingBook(null);
    setSavingEdit(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingBook) return;
    setSavingEdit(true);
    try {
      const res = await api.put(`/books/${editingBook.id}/`, editForm);
      const updated = res.data;

      // update list in-place
      setSearchResults((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b))
      );

      setModalMessage('Book updated successfully.');
      closeEditModal();
    } catch (error) {
      console.error('Update failed:', error);
      setModalMessage('Failed to update book. Please try again.');
      setSavingEdit(false);
    }
  };

  return (
    <div className="book-search-container">
      <div className="book-search-header">
        <h1>Book Discovery</h1>
        <p>Find your next favorite book from our collection</p>
      </div>

      <div className="search-section">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, or ISBN..."
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <div className="input-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div className="search-buttons">
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="search-btn"
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
          <button onClick={handleClear} className="clear-btn">
            Clear
          </button>
        </div>
      </div>

      <div className="results-section">
        <h2 className="results-title">
          {searchResults.length > 0
            ? `Found ${searchResults.length} book${
                searchResults.length !== 1 ? 's' : ''
              }`
            : 'Search Results'}
        </h2>

        {searchResults.length > 0 ? (
          <>
            <div className="books-grid">
              {visibleResults.map((book) => (
                <div key={book.id} className="book-card">
                  <div className="book-cover">
                    <img
                      src={book.cover_url || '/lib.png'}
                      alt={book.title}
                    />
                  </div>

                  <div className="book-info">
                    <h3>{book.title}</h3>
                    <p className="author">{book.author}</p>
                    <div className="book-meta">
                      {book.isbn && (
                        <span className="isbn">ISBN: {book.isbn}</span>
                      )}
                      {book.published_date && (
                        <span className="published">
                          Published:{' '}
                          {new Date(book.published_date).getFullYear()}
                        </span>
                      )}
                    </div>
                  </div>

                  {isAdmin ? (
                    <button
                      onClick={() => handleEdit(book)}
                      className="reserve-btn edit-btn"
                    >
                      Edit
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReserve(book.id)}
                      className="reserve-btn"
                    >
                      Reserve
                    </button>
                  )}
                </div>
              ))}
            </div>

            {searchResults.length > PAGE_SIZE && (
              <div className="ourbooks-pagination">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3>No books found</h3>
            <p>Try adjusting your search query to find what you're looking for.</p>
          </div>
        )}
      </div>

      <CenterModal
        message={modalMessage}
        onClose={() => setModalMessage('')}
      />

      {/* Admin edit modal */}
      {isAdmin && editingBook && (
        <div className="edit-modal-backdrop">
          <div className="edit-modal">
            <h2>Edit Book</h2>
            <div className="edit-form">
              <label>
                Title
                <input
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                />
              </label>
              <label>
                Author
                <input
                  name="author"
                  value={editForm.author}
                  onChange={handleEditChange}
                />
              </label>
              <label>
                ISBN
                <input
                  name="isbn"
                  value={editForm.isbn}
                  onChange={handleEditChange}
                />
              </label>
              <label>
                Genre
                <input
                  name="genre"
                  value={editForm.genre}
                  onChange={handleEditChange}
                />
              </label>
              <label>
                Cover URL
                <input
                  name="cover_url"
                  value={editForm.cover_url}
                  onChange={handleEditChange}
                />
              </label>
            </div>

            <div className="edit-modal-actions">
              <button
                className="clear-btn"
                onClick={closeEditModal}
                disabled={savingEdit}
              >
                Cancel
              </button>
              <button
                className="search-btn"
                onClick={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookSearch;
