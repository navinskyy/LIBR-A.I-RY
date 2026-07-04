import React from 'react';
import './BookAnimation.css'; // Make sure this path matches your structure

const BookAnimation = () => (
  <div className="foundation-book">
    <input type="radio" name="page" id="page-1" defaultChecked style={{ display: 'none' }} />
    <input type="radio" name="page" id="page-2" style={{ display: 'none' }} />
    <div className="book">
      <label htmlFor="page-2">
        <div className="book_page book_cover">
          <img src="/image.jpg" alt="Foundation Cover" className="cover-img" />
        </div>
      </label>
      <label htmlFor="page-1">
        <div className="book_page book_title">
          <h2>FOUNDATION</h2>
          <h4>ISAAC ASIMOV</h4>
          <span>Introduction by Paul Krugman</span>
          <br/>
          <span>Illustrations by Alex Wells</span>
        </div>
      </label>
    </div>
  </div>
);

export default BookAnimation;
