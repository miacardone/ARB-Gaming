import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Wordmark from '@/brand/Wordmark';
import { useBrand } from '@/brand/BrandProvider';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Surface';
import { TextField } from '@/components/ui/Form';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/data/navigation';

const pointsFor = (brand) => [
  { icon: 'layers', title: 'One queue, two intake paths', body: `Card chargebacks and ${brand.terms.claim}s in a single book.` },
  { icon: 'link', title: 'Consolidation built in', body: `Linked disputes surface before the same ${brand.terms.order} is refunded twice.` },
  { icon: 'clock', title: 'Deadlines that mean something', body: 'Internal due dates sit ahead of the scheme deadline.' },
];

export function Login() {
  const brand = useBrand();
  const { signIn, isAuthenticated, error, busy } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated) return <Navigate to={location.state?.from ?? ROUTES.dashboard} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const ok = await signIn(username, password);
    if (ok) navigate(location.state?.from ?? ROUTES.dashboard, { replace: true });
  };

  return (
    <div className="login">
      <aside className="login__side">
        <Wordmark inverse size={28} />

        <div className="stack stack--loose" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="login__headline">{brand.tagline}</h1>
          <div className="stack">
            {pointsFor(brand).map((p) => (
              <div key={p.title} className="row row--tight row--top row--nowrap">
                <Icon name={p.icon} size={17} style={{ color: 'var(--c-nav-active)', marginTop: 2 }} />
                <span>
                  <strong style={{ color: '#fff', display: 'block' }}>{p.title}</strong>
                  <span style={{ color: 'var(--c-nav-ink-muted)' }} className="small">{p.body}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="micro" style={{ color: 'var(--c-nav-ink-muted)', position: 'relative', zIndex: 1 }}>
          {brand.legalName} · {brand.productName}
        </p>
      </aside>

      <main className="login__form">
        <div className="stack stack--tight">
          <h1>Sign in</h1>
          <p className="small muted">Use your {brand.name} operator account to continue.</p>
        </div>

        <form className="stack" onSubmit={submit}>
          <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            error={error ?? undefined}
          />
          <Button type="submit" variant="primary" size="lg" block disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="login__demo">
          <span className="t-section-label">Demo credentials</span>
          <div className="row row--xtight" style={{ marginTop: 5 }}>
            <Icon name="user" size={13} className="subtle" />
            <span className="mono">{brand.demoCredentials.username}</span>
            <span className="subtle">/</span>
            <span className="mono">{brand.demoCredentials.password}</span>
          </div>
        </div>

        <p className="micro subtle">
          Trouble signing in? Contact <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>.
        </p>
      </main>
    </div>
  );
}

export default Login;
