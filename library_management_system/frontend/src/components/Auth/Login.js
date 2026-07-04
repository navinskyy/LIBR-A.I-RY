import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/auth';
import '../../pages/Login.css';
import {
  FaFacebookF,
  FaMicrosoft,
  FaGithub,
  FaLinkedinIn,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa';

function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setLoginError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // loginUser should POST to /auth/login/ (via services/auth.js)
      const user = await loginUser(credentials);
      console.log('LOGIN USER:', user);

      const isAdmin = !!user?.is_staff;
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');

      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch (error) {
      setLoginError('Username or Password is invalid.');
    }
  };

  return (
    <div className="login-layout">
      <div className="login-left">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="form-title">Login</h2>

          <input
            name="username"
            type="text"
            value={credentials.username}
            onChange={handleChange}
            placeholder="Email"
            autoFocus
          />

          <div className="password-wrapper">
            <input
              name="password"
              className="password-input"
              type={showPassword ? 'text' : 'password'}
              value={credentials.password}
              onChange={handleChange}
              placeholder="Password"
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {loginError && <p className="field-error">{loginError}</p>}

          <button type="submit">Login</button>
        </form>

        <div className="socialLogin-section">
          <div className="socialLogin-divider">
            <span>Or Connect With</span>
          </div>
          <div className="socialLogin-icons">
            <a href="https://www.facebook.com/r.php?entry_point=login" aria-label="Facebook">
              <FaFacebookF />
            </a>
            <a href="https://account.microsoft.com/account" aria-label="Microsoft">
              <FaMicrosoft />
            </a>
            <a href="https://github.com/login" aria-label="GitHub">
              <FaGithub />
            </a>
            <a href="https://www.linkedin.com/login" aria-label="LinkedIn">
              <FaLinkedinIn />
            </a>
          </div>
          <div className="copyrightLogin">©2025</div>
        </div>
      </div>

      <div className="login-right">
        <img src="/geng-logo.png" alt="Geng" className="big-logo" />
        <h2 className="login-title">Welcome!</h2>
        <p>Don’t have an account yet?</p>
        <button
          className="login-button"
          type="button"
          onClick={() => navigate('/register')}
        >
          Register ➔
        </button>
      </div>
    </div>
  );
}

export default Login;
