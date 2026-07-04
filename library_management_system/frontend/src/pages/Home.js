import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => (
  <div className="home-root">
    {/* Centered Welcome text */}
    <div className="welcome-text">
     {/* <h1>Welcome to AI-Powered Library Management System</h1>
      <p>
        Register or login to manage books, reservations, and get AI recommendations.
      </p>*/}
    </div> 

    {/* Book Wrapper – Centers the book */}
    <div className="book-wrapper">
      <div className="cover">
        <div className="book">
          {/* Page 1 */}
          <label htmlFor="page-1" className="book__page book__page--1">
            <img src="/reading.jpg" alt="" />
          </label>

          {/* Page 4: Content */}
          <label htmlFor="page-2" className="book__page book__page--4">
            <div className="page__content">
              <h1 className="page__content-title">GENG A.I</h1>

              <div className="page__content-blockquote">
                <p className="page__content-blockquote-text">
                  At GENG.AI, we believe in making knowledge more accessible by helping students, researchers, and readers find the right books faster and easier.
                </p>
                <p className="page__content-blockquote-text">
                 With LIBR-AI-RY, we reduce the hassle and frustration of searching, save valuable time, and deliver personalized book recommendations.
                </p>
                <p className="page__content-blockquote-text">
                 Our goal is to empower users to focus on learning and discovery, While ensuring even lesser-known books get the recognition they deserve.
                </p>

                <span className="page__content-blockquote-reference">
                  
                </span>
              </div>

              <div className="page__content-text">
                <p>This study develops an AI tool that streamlines book searching, suggestions, and reservations through a library’s database.</p>
                <p>Powered by Machine Learning and Large Language Models, it aims to improve efficiency over OPAC and support users in quickly finding relevant materials.</p>
                <p>The project will be developed and tested at Lyceum of the Philippines University-Manila, with potential expansion to other libraries.</p>
              </div>

              <div className="page__number">3</div>
            </div>
          </label>

          {/* Radio Inputs */}
          <input type="radio" name="page" id="page-1" />
          <input type="radio" name="page" id="page-2" />

          {/* Page 2: Book Info */}
          <label className="book__page book__page--2">
            <div className="book__page-front">
              <div className="page__content">
                <h1 className="page__content-book-title">Welcome to LIBR-A.I-RY</h1>
                <h2 className="page__content-author">Library Management System</h2>

                <p className="page__content-credits">
                  Research by <span>Casimsiman</span>
                  <span>Llanes</span>
                  <span>Macapagal</span>
                </p>
                <p className="page__content-credits">
                  Section <span>C331_CS</span>
                </p>

                <div className="page__content-copyright">
                  <p>A.I Library System Management</p>
                  <p>GENG A.I</p>
                </div>
              </div>
            </div>

            {/* Back Side */}
            <div className="book__page-back">
              <div className="page__content">
                <h1 className="page__content-title">ABOUT US!</h1>

                <table className="page__content-table">
                  <tbody>
                    <tr>
                      <td>Project Manager/Backend Developer</td>
                      <td>Macapagal, George </td>
                      <td align="right"></td>
                    </tr>
                    <tr>
                      <td>Frontend Developer</td>
                      <td>Llanes, Navin</td>
                      <td align="right"></td>
                    </tr>
                    <tr>
                      <td>Frontend Developer</td>
                      <td>Casimsiman, Emman</td>
                      <td align="right"></td>
                    </tr>
                  </tbody>
                </table>

                <div className="page__number">2</div>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
);

export default Home;
