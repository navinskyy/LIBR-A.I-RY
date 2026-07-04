import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/auth';
import '../../pages/register.css';
import {
  FaFacebookF,
  FaMicrosoft,
  FaGithub,
  FaLinkedinIn,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa';

const Register = () => {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();

  const isStrongPassword = (value) => {
    if (!value) return false;
    if (value.length < 9) return false;
    const hasSpecial = /[^A-Za-z0-9]/.test(value);
    return hasSpecial;
  };

  const isValidEmail = (value) => {
    if (!value) return false;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!isValidEmail(userData.email)) {
      newErrors.email =
        'Please enter a valid email address (example@email.com).';
    }

    if (!isStrongPassword(userData.password)) {
      newErrors.password =
        'Password must be at least 9 characters and contain at least one special character.';
    }

    if (Object.keys(newErrors).length > 0) {
      setEmailError(newErrors.email || '');
      setPasswordError(newErrors.password || '');
      return;
    }

    try {
      // registerUser should POST to /auth/register/ (via services/auth.js)
      const user = await registerUser(userData);
      const isAdmin = !!user?.is_staff;

      localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');
      navigate(isAdmin ? '/admin' : '/user');
    } catch (error) {
      alert('Registration failed');
    }
  };

  return (
    <div className="register-layout">
      <div className="register-left">
        <form className="register-form" onSubmit={handleSubmit}>
          <h2 className="form-title">Register</h2>

          <input
            type="text"
            placeholder="Username"
            value={userData.username}
            onChange={(e) =>
              setUserData({ ...userData, username: e.target.value })
            }
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={userData.email}
            onChange={(e) => {
              const value = e.target.value;
              setUserData({ ...userData, email: value });
              if (!isValidEmail(value)) {
                setEmailError(
                  'Please enter a valid email address (example@email.com).'
                );
              } else {
                setEmailError('');
              }
            }}
            required
          />
          {emailError && <p className="field-error">{emailError}</p>}

          <div className="password-wrapper">
            <input
              className="password-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={userData.password}
              onChange={(e) => {
                const value = e.target.value;
                setUserData({ ...userData, password: value });
                if (!isStrongPassword(value)) {
                  setPasswordError(
                    'Password must be at least 9 characters and contain at least one special character.'
                  );
                } else {
                  setPasswordError('');
                }
              }}
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {passwordError && <p className="field-error">{passwordError}</p>}

          <button type="submit">Register</button>
        </form>

        <div className="social-section">
          <div className="social-divider">
            <span>Or Connect With</span>
          </div>
          <div className="social-icons">
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
          <div className="copyright">©2025</div>
        </div>
      </div>

      <div className="register-right">
        <img src="/geng-logo.png" alt="Geng" className="big-logo" />
        <h2 className="promo-title">Welcome!</h2>
        <p>Already have an account?</p>
        <button
          className="promo-button"
          type="button"
          onClick={() => navigate('/login')}
        >
          Login ➔
        </button>
      </div>
    </div>
  );
};

export default Register;
