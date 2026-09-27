import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { Panel, Field, TextInput, Button, Banner } from '../components/ui';
import { registerApi } from '../lib/api';
import { setAuth } from '../lib/auth';

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const data = await registerApi(email.trim(), password, fullName.trim());
      setAuth(data.access_token, data.user);
      navigate('/applicant/advertisements', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Panel title="Create applicant account" subtitle="Register to apply for open scientific and technical posts.">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Banner variant="bad" message={error} />}

          <Field label="Full name" id="fullName" hint="As recorded in your matriculation or official certificate">
            <TextInput
              id="fullName"
              placeholder="e.g. Priya Verma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
            />
          </Field>

          <Field label="Email address" id="email">
            <TextInput
              id="email"
              type="email"
              placeholder="e.g. priya.verma@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </Field>

          <Field label="Password" id="password" hint="Minimum 8 characters">
            <TextInput
              id="password"
              type="password"
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </Field>

          <Field label="Confirm password" id="confirmPassword">
            <TextInput
              id="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </Field>

          <div className="pt-2">
            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Create account
            </Button>
          </div>

          <div className="pt-4 border-t border-rule text-center">
            <p className="text-xs text-muted">
              Already registered?{' '}
              <Link to="/login" className="text-ink font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </Panel>
    </AuthLayout>
  );
}
