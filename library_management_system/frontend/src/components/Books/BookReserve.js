import React, { useEffect, useState } from 'react';
import { returnBook } from '../../services/api';

const BookReserve = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReservedBooks = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/reservations/history/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await res.json();
      setBooks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservedBooks();
  }, []);

  const handleReturn = async (bookId) => {
    try {
      await returnBook(bookId);
      // Update state immediately so button disappears
      setBooks(books.map(b => b.id === bookId ? { ...b, status: 'returned' } : b));
    } catch (error) {
      console.error('Return failed:', error.response?.data || error.message);
      alert('Could not return book. Try again.');
    }
  };

  if (loading) return <p>Loading reserved books...</p>;

  return (
    <div>
      <h2>My Reserved Books</h2>
      <ul>
        {books.length === 0 ? <p>No reserved books</p> :
          books.map(book => (
            <li key={book.id} style={{ marginBottom: '10px' }}>
              <strong>{book.title}</strong> by {book.author} 
              {book.status === 'borrowed' ? (
                <button onClick={() => handleReturn(book.id)}>Return</button>
              ) : (
                <span style={{ marginLeft: '10px', color: 'green' }}>
                  {book.status === 'returned' ? 'Returned' : 'Overdue'}
                </span>
              )}
            </li>
          ))
        }
      </ul>
    </div>
  );
};

export default BookReserve;
