import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { Panel, Field, TextInput, Button, Banner } from '../components/ui';
import { loginApi } from '../lib/api';
import { setAuth, getRoleDefaultRoute } from '../lib/auth';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await loginApi(email.trim(), password);
      setAuth(data.access_token, data.user);
      const targetRoute = getRoleDefaultRoute(data.user.role);
      navigate(targetRoute, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Panel title="Sign in" subtitle="Enter your credentials to access RAC services.">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Banner variant="bad" message={error} />}

          <Field label="Email address" id="email">
            <TextInput
              id="email"
              type="email"
              placeholder="name@domain.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </Field>

          <Field label="Password" id="password">
            <TextInput
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </Field>

          <div className="pt-2">
            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Sign in
            </Button>
          </div>

          <div className="pt-4 border-t border-rule text-center">
            <p className="text-xs text-muted">
              Applying for an advertised post?{' '}
              <Link to="/register" className="text-ink font-medium hover:underline">
                Create applicant account
              </Link>
            </p>
          </div>
        </form>
      </Panel>
    </AuthLayout>
  );
}
