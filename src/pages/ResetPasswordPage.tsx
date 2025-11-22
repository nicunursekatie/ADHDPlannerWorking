import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatabaseService } from '../services/database';
import Button from '../components/common/Button';
import { supabase } from '../lib/supabase';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Handle password reset token from URL hash
    const handlePasswordReset = async () => {
      try {
        // Parse the hash - it might be in format: #access_token=...&type=recovery#/reset-password
        // or: #/reset-password#access_token=...&type=recovery
        const fullHash = window.location.hash;
        
        // Extract the part with tokens (before any route hash)
        let tokenHash = fullHash;
        const routeIndex = fullHash.indexOf('#/');
        if (routeIndex > 0) {
          tokenHash = fullHash.substring(0, routeIndex);
        } else if (routeIndex === 0 && fullHash.includes('access_token')) {
          // Hash might be: #/reset-password#access_token=...
          const tokenStart = fullHash.indexOf('#access_token');
          if (tokenStart > 0) {
            tokenHash = fullHash.substring(tokenStart);
          }
        }
        
        // Parse hash parameters
        const hashParams = new URLSearchParams(tokenHash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // If we have recovery tokens in the URL, exchange them for a session
        if (type === 'recovery' && accessToken && refreshToken) {
          try {
            // Set the session using the tokens from the URL
            const { data: { session }, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (session && session.user) {
              setIsValidToken(true);
              setIsChecking(false);
              // Clean up the URL hash to remove tokens
              window.history.replaceState(null, '', '#/reset-password');
              return;
            } else {
              console.error('Session error:', sessionError);
              setError('Invalid or expired reset link. Please request a new password reset.');
              setIsChecking(false);
              return;
            }
          } catch (tokenError: any) {
            console.error('Token exchange error:', tokenError);
            setError('Invalid or expired reset link. Please request a new password reset.');
            setIsChecking(false);
            return;
          }
        }
        
        // If no tokens in URL, check for existing session (user might have refreshed)
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          setIsValidToken(true);
          setIsChecking(false);
        } else {
          setError('Invalid or expired reset link. Please request a new password reset.');
          setIsChecking(false);
        }
      } catch (err: any) {
        console.error('Password reset error:', err);
        setError('Failed to process reset link. Please request a new password reset.');
        setIsChecking(false);
      }
    };

    handlePasswordReset();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await DatabaseService.updatePassword(newPassword);
      setSuccess('Password updated successfully! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <p className="text-center text-gray-600 dark:text-gray-400">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your new password below
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <p className="text-sm text-green-800 dark:text-green-400">{success}</p>
          </div>
        )}

        {isValidToken && !success && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <input
                  id="new-password"
                  name="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500"
              >
                Back to sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;