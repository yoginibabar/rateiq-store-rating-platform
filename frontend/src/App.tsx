import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { z } from 'zod';

import {
  clearAuth,
  setAuth,
  useAppDispatch,
  useAuth,
} from './store';
import {
  del,
  errorMessage,
  get,
  patch,
  post,
  put,
} from './api';
import { Role, Store, User } from './types';

/* =========================================================
   VALIDATION
========================================================= */

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(16, 'Password must be at most 16 characters')
  .regex(
    /[A-Z]/,
    'Password must contain at least one uppercase letter',
  )
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character',
  );

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(20, 'Name must be at least 20 characters')
      .max(60, 'Name must be at most 60 characters'),

    email: z.string().email('Enter a valid email address'),

    address: z
      .string()
      .trim()
      .min(3, 'Address is required')
      .max(400, 'Address must be at most 400 characters'),

    password: passwordSchema,

    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    },
  );


const adminUserSchema = z.object({
  name: z.string().trim().min(20, 'Name must be at least 20 characters').max(60, 'Name must be at most 60 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  address: z.string().trim().min(1, 'Address is required').max(400, 'Address must be at most 400 characters'),
  role: z.enum(['ADMIN', 'USER', 'OWNER']),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  password: passwordSchema.optional(),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

const storeSchema = z.object({
  name: z.string().trim().min(1, 'Store name is required'),
  email: z.string().trim().email('Enter a valid email address'),
  address: z.string().trim().min(1, 'Address is required').max(400, 'Address must be at most 400 characters'),
});

/* =========================================================
   NAVIGATION
========================================================= */

const navs: Record<
  Role,
  { label: string; to: string; icon: string }[]
> = {
  USER: [
    { label: 'Dashboard', to: '/dashboard', icon: '⌂' },
    { label: 'Explore Stores', to: '/stores', icon: '⌕' },
    { label: 'My Ratings', to: '/my-ratings', icon: '★' },
    { label: 'Profile', to: '/profile', icon: '◉' },
  ],

  OWNER: [
    { label: 'Dashboard', to: '/owner/dashboard', icon: '⌂' },
    { label: 'My Store', to: '/owner/store', icon: '▣' },
    { label: 'Ratings', to: '/owner/ratings', icon: '★' },
    { label: 'Analytics', to: '/owner/analytics', icon: '◫' },
    { label: 'Insights', to: '/owner/insights', icon: '✦' },
  ],

  ADMIN: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: '⌂' },
    { label: 'Users', to: '/admin/users', icon: '♙' },
    { label: 'Stores', to: '/admin/stores', icon: '▣' },
    { label: 'Ratings', to: '/admin/ratings', icon: '★' },
    { label: 'Risk Center', to: '/admin/risks', icon: '!' },
    { label: 'Audit Logs', to: '/admin/audit', icon: '◷' },
    { label: 'Reports', to: '/admin/reports', icon: '⇩' },
  ],
};

/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage register />} />
      <Route path="*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

/* =========================================================
   PROTECTED ROUTES
========================================================= */

function ProtectedRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  const roleBase =
    user.role === 'ADMIN'
      ? '/admin/dashboard'
      : user.role === 'OWNER'
      ? '/owner/dashboard'
      : '/dashboard';

  return (
    <Shell>
      <Routes>
        {user.role === 'USER' && (
          <>
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/stores" element={<Explorer />} />
            <Route
              path="/stores/:id"
              element={<StoreDetails />}
            />
            <Route
              path="/my-ratings"
              element={<MyRatings />}
            />
            <Route path="/profile" element={<Profile />} />
          </>
        )}

        {user.role === 'OWNER' && (
          <>
            <Route
              path="/owner/dashboard"
              element={<OwnerDashboard />}
            />
            <Route
              path="/owner/store"
              element={<OwnerStore />}
            />
            <Route
              path="/owner/ratings"
              element={<OwnerRatings />}
            />
            <Route
              path="/owner/analytics"
              element={<OwnerAnalytics />}
            />
            <Route
              path="/owner/insights"
              element={<OwnerInsights />}
            />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/stores/:id"
              element={<StoreDetails />}
            />
          </>
        )}

        {user.role === 'ADMIN' && (
          <>
            <Route
              path="/admin/dashboard"
              element={<AdminDashboard />}
            />
            <Route
              path="/admin/users"
              element={<AdminUsers />}
            />
            <Route
              path="/admin/stores"
              element={<AdminStores />}
            />
            <Route
              path="/admin/ratings"
              element={<AdminRatings />}
            />
            <Route
              path="/admin/risks"
              element={<Risks />}
            />
            <Route
              path="/admin/audit"
              element={<Audit />}
            />
            <Route
              path="/admin/reports"
              element={<Reports />}
            />
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/stores/:id"
              element={<StoreDetails />}
            />
          </>
        )}

        <Route
          path="*"
          element={<Navigate to={roleBase} replace />}
        />
      </Routes>
    </Shell>
  );
}

/* =========================================================
   LANDING PAGE
========================================================= */

function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Brand />

        <div className="nav-actions">
          <Link to="/login">Sign in</Link>

          <Link className="btn primary" to="/register">
            Get Started
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            INTELLIGENT STORE RATING & REPUTATION PLATFORM
          </span>

          <h1>
            Your ratings tell a story.
            <br />
            <span>RateIQ helps you understand it.</span>
          </h1>

          <p>
            Discover better stores, understand reputation, and make
            smarter decisions with data-driven rating intelligence.
          </p>

          <div className="actions">
            <Link className="btn primary" to="/register">
              Explore Stores →
            </Link>

            <Link className="btn ghost" to="/login">
              Sign in
            </Link>
          </div>

          <div className="stats-row">
            <MetricText
              label="Product"
              value="RateIQ"
            />

            <MetricText
              label="Promise"
              value="Discover. Understand. Decide."
            />

            <MetricText
              label="Focus"
              value="Explainable intelligence"
            />
          </div>
        </div>

        <div className="hero-card">
          <div className="mini-label">STORE HEALTH</div>

          <div className="hero-score">
            92
            <span>/100</span>
          </div>

          <div className="positive">
            ↑ 7.4% this month
          </div>

          <div className="mini-chart">
            <i style={{ height: '44%' }} />
            <i style={{ height: '58%' }} />
            <i style={{ height: '66%' }} />
            <i style={{ height: '78%' }} />
            <i style={{ height: '92%' }} />
          </div>

          <div className="hero-card-foot">
            <span>Rating Confidence</span>
            <b>HIGH</b>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <span className="eyebrow">
            THE RATEIQ PROMISE
          </span>

          <h2>
            Discover. Understand. Decide.
          </h2>
        </div>

        <div className="feature-grid">
          <Feature
            n="01"
            title="Discover"
            text="Find stores using powerful search, filters and smart rankings."
          />

          <Feature
            n="02"
            title="Understand"
            text="Look beyond averages with confidence, trends and store health."
          />

          <Feature
            n="03"
            title="Decide"
            text="Turn real customer experiences into better-informed choices."
          />
        </div>
      </section>

      <section className="section light">
        <div className="section-heading">
          <span className="eyebrow">
            BUILT FOR EVERY ROLE
          </span>

          <h2>
            One platform. Three perspectives.
          </h2>
        </div>

        <div className="role-grid">
          <RoleCard
            title="Customer"
            text="Discover stores, compare reputation and rate your experiences."
          />

          <RoleCard
            title="Store Owner"
            text="Understand customer perception with health, trends and insights."
          />

          <RoleCard
            title="Administrator"
            text="Manage the platform, monitor ratings and investigate unusual activity."
          />
        </div>
      </section>

      <footer>
        RateIQ — Intelligent Store Rating & Reputation Platform
        <span>From Ratings to Real Insights.</span>
      </footer>
    </div>
  );
}

/* =========================================================
   AUTH
========================================================= */

function AuthPage({
  register = false,
}: {
  register?: boolean;
}) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return (
      <Navigate
        to={
          user.role === 'ADMIN'
            ? '/admin/dashboard'
            : user.role === 'OWNER'
            ? '/owner/dashboard'
            : '/dashboard'
        }
        replace
      />
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');

    const parsed = register
      ? registerSchema.safeParse(form)
      : loginSchema.safeParse(form);

    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ||
          'Please check the form.',
      );
      return;
    }

    setLoading(true);

    try {
      const response = register
        ? await post<any>('/auth/register', form)
        : await post<any>('/auth/login', form);

      dispatch(
        setAuth({
          user: response.user,
          token: response.token,
        }),
      );

      navigate(
        response.user.role === 'ADMIN'
          ? '/admin/dashboard'
          : response.user.role === 'OWNER'
          ? '/owner/dashboard'
          : '/dashboard',
      );
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <Brand />

        <div>
          <span className="eyebrow">
            FROM RATINGS TO REAL INSIGHTS
          </span>

          <h1>
            {register
              ? 'Join RateIQ'
              : 'Welcome back to RateIQ'}
          </h1>

          <p>
            {register
              ? 'Start exploring stores and turning your experiences into meaningful ratings.'
              : 'Sign in to continue discovering smarter store insights.'}
          </p>
        </div>
      </div>

      <form
        className="auth-card"
        onSubmit={submit}
      >
        <Brand />

        <h2>
          {register
            ? 'Create your account'
            : 'Sign in'}
        </h2>

        <p className="muted">
          {register
            ? 'Your store discovery workspace starts here.'
            : 'Use your RateIQ account to continue.'}
        </p>

        {register && (
          <>
            <Field
              label="Full name"
              value={form.name || ''}
              onChange={(value) =>
                setForm({
                  ...form,
                  name: value,
                })
              }
            />

            <Field
              label="Address"
              value={form.address || ''}
              onChange={(value) =>
                setForm({
                  ...form,
                  address: value,
                })
              }
            />
          </>
        )}

        <Field
          label="Email"
          type="email"
          value={form.email || ''}
          onChange={(value) =>
            setForm({
              ...form,
              email: value,
            })
          }
        />

        <Field
          label="Password"
          type="password"
          value={form.password || ''}
          onChange={(value) =>
            setForm({
              ...form,
              password: value,
            })
          }
        />

        {register && (
          <Field
            label="Confirm password"
            type="password"
            value={form.confirmPassword || ''}
            onChange={(value) =>
              setForm({
                ...form,
                confirmPassword: value,
              })
            }
          />
        )}

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        <button
          className="btn primary full"
          disabled={loading}
        >
          {loading
            ? 'Please wait...'
            : register
            ? 'Create account'
            : 'Sign in'}
        </button>

        <p className="switch">
          {register
            ? 'Already have an account?'
            : 'Need an account?'}{' '}
          <Link
            to={
              register
                ? '/login'
                : '/register'
            }
          >
            {register
              ? 'Sign in'
              : 'Register'}
          </Link>
        </p>

        {!register && (
          <div className="demo-box">
            <b>Local demo accounts</b>

            <span>
              Admin · admin@rateiq.com · Admin@12345
            </span>

            <span>
              Owner · owner1@rateiq.com · Owner@12345
            </span>

            <span>
              Customer · user1@rateiq.com · User@12345
            </span>
          </div>
        )}
      </form>
    </div>
  );
}

function Field({
  label,
  type = 'text',
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        required
      />
    </label>
  );
}

/* =========================================================
   APP SHELL
========================================================= */

function Shell({
  children,
}: {
  children: ReactNode;
}) {
  const { user: authUser } = useAuth();

  if (!authUser) {
    return null;
  }

  const user = authUser;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [commandOpen, setCommandOpen] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [dark, setDark] =
    useState(
      () =>
        localStorage.getItem(
          'rateiq_theme',
        ) === 'dark',
    );

  const [notifications, setNotifications] =
    useState<any[]>([]);

  useEffect(() => {
    document.documentElement.dataset.theme =
      dark ? 'dark' : 'light';

    localStorage.setItem(
      'rateiq_theme',
      dark ? 'dark' : 'light',
    );
  }, [dark]);

  useEffect(() => {
    const handler = (
      event: KeyboardEvent,
    ) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'k'
      ) {
        event.preventDefault();
        setCommandOpen(true);
      }
    };

    window.addEventListener(
      'keydown',
      handler,
    );

    return () =>
      window.removeEventListener(
        'keydown',
        handler,
      );
  }, []);

  useEffect(() => {
    get<any>('/notifications')
      .then((result) =>
        setNotifications(
          result.notifications || [],
        ),
      )
      .catch(() => {});
  }, []);

  const unread =
    notifications.filter(
      (item) => !item.isRead,
    ).length;

  function logout() {
    dispatch(clearAuth());
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside
        className={
          mobileOpen ? 'open' : ''
        }
      >
        <Brand />

        <div className="workspace">
          {user.role} WORKSPACE
        </div>

        <nav>
          {navs[user.role].map(
            (item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() =>
                  setMobileOpen(false)
                }
                className={({ isActive }) =>
                  isActive
                    ? 'active'
                    : ''
                }
              >
                <i>{item.icon}</i>
                {item.label}
              </NavLink>
            ),
          )}
        </nav>

        <div className="sidebar-bottom">
          <button
            onClick={() =>
              setCommandOpen(true)
            }
          >
            ⌘ Command palette
          </button>

          <button
            onClick={() =>
              setDark((value) => !value)
            }
          >
            {dark
              ? '☼ Light mode'
              : '◐ Dark mode'}
          </button>

          <button onClick={logout}>
            ↪ Sign out
          </button>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() =>
              setMobileOpen(
                (value) => !value,
              )
            }
          >
            ☰
          </button>

          <div>
            <b>
              {titleFor(
                location.pathname,
              )}
            </b>
            <span> / RateIQ</span>
          </div>

          <div className="top-actions">
            <button
              className="notification"
              onClick={() =>
                navigate('/profile')
              }
            >
              ◔
              {unread > 0 && (
                <em>{unread}</em>
              )}
            </button>

            <button
              className="shortcut"
              onClick={() =>
                setCommandOpen(true)
              }
            >
              Ctrl K
            </button>

            <Link
              className="user-chip"
              to="/profile"
            >
              <b>
                {initials(user.name)}
              </b>
              <span>
                {user.name}
              </span>
            </Link>
          </div>
        </header>

        <div className="page">
          {children}
        </div>
      </main>

      {commandOpen && (
        <CommandPalette
          onClose={() =>
            setCommandOpen(false)
          }
          items={navs[user.role]}
        />
      )}
    </div>
  );
}

function titleFor(path: string) {
  if (path === '/dashboard') {
    return 'Dashboard';
  }

  if (path === '/stores') {
    return 'Store Explorer';
  }

  if (path.includes('/stores/')) {
    return 'Store Details';
  }

  if (path === '/my-ratings') {
    return 'My Ratings';
  }

  if (path === '/profile') {
    return 'Profile';
  }

  if (path.includes('/owner/')) {
    return path
      .split('/')
      .pop()
      ?.replace(/^./, (char) =>
        char.toUpperCase(),
      ) || 'Business';
  }

  if (path.includes('/admin/')) {
    return path
      .split('/')
      .pop()
      ?.replace(/^./, (char) =>
        char.toUpperCase(),
      ) || 'Control Center';
  }

  return 'RateIQ';
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] || '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function CommandPalette({
  onClose,
  items,
}: {
  onClose: () => void;
  items: {
    label: string;
    to: string;
    icon: string;
  }[];
}) {
  const navigate = useNavigate();
  const [query, setQuery] =
    useState('');

  const filtered = items.filter(
    (item) =>
      item.label
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  return (
    <div
      className="overlay"
      onMouseDown={onClose}
    >
      <div
        className="command"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <input
          autoFocus
          placeholder="Search RateIQ..."
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onClose();
            }

            if (
              event.key === 'Enter' &&
              filtered[0]
            ) {
              navigate(filtered[0].to);
              onClose();
            }
          }}
        />

        {filtered.map((item) => (
          <button
            key={item.to}
            onClick={() => {
              navigate(item.to);
              onClose();
            }}
          >
            <i>{item.icon}</i>
            {item.label}
            <span>↵</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   CUSTOMER DASHBOARD
========================================================= */

function UserDashboard() {
  const [stores, setStores] =
    useState<Store[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    get<any>('/stores')
      .then((result) =>
        setStores(
          result.stores || [],
        ),
      )
      .catch(() => {})
      .finally(() =>
        setLoading(false),
      );
  }, []);

  const averageRating = stores.length
    ? stores.reduce(
        (sum, store) =>
          sum + store.rating,
        0,
      ) / stores.length
    : 0;

  const averageHealth = stores.length
    ? Math.round(
        stores.reduce(
          (sum, store) =>
            sum + store.health,
          0,
        ) / stores.length,
      )
    : 0;

  return (
    <>
      <PageIntro
        eyebrow="RATEIQ EXPLORER"
        title="Discover Stores With Confidence"
        text="Explore stores, compare reputation and find businesses worth your attention."
        action={
          <Link
            className="btn primary"
            to="/stores"
          >
            Explore all stores →
          </Link>
        }
      />

      <div className="stats four">
        <Stat
          label="Stores"
          value={loading ? '—' : stores.length}
        />

        <Stat
          label="Ratings"
          value={
            loading
              ? '—'
              : stores.reduce(
                  (sum, store) =>
                    sum +
                    store.ratingCount,
                  0,
                )
          }
        />

        <Stat
          label="Average rating"
          value={
            loading
              ? '—'
              : averageRating.toFixed(1)
          }
        />

        <Stat
          label="Average health"
          value={
            loading
              ? '—'
              : averageHealth
          }
        />
      </div>

      <SectionHeader
        title="Recommended stores"
        link="/stores"
      />

      {loading ? (
        <Loading text="Loading your recommendations…" />
      ) : stores.length ? (
        <div className="card-grid three">
          {stores
            .slice(0, 6)
            .map((store) => (
              <StoreCard
                key={store.id}
                store={store}
              />
            ))}
        </div>
      ) : (
        <Empty
          title="No stores yet"
          text="There are no stores available right now."
        />
      )}
    </>
  );
}

/* =========================================================
   STORE EXPLORER
========================================================= */

function Explorer() {
  const [query, setQuery] =
    useState('');

  const [sort, setSort] =
    useState('rating');

  const [minRating, setMinRating] =
    useState(0);

  const [minHealth, setMinHealth] =
    useState(0);

  const [stores, setStores] =
    useState<Store[]>([]);

  const [error, setError] =
    useState('');

  const load = async () => {
    try {
      setError('');

      const result = await get<any>(
        '/stores',
        {
          q: query,
          sort,
          minRating,
          minHealth,
        },
      );

      setStores(
        result.stores || [],
      );
    } catch (error) {
      setError(
        errorMessage(error),
      );
    }
  };

  useEffect(() => {
    void load();
  }, [sort, minRating, minHealth]);

  return (
    <>
      <PageIntro
        eyebrow="STORE EXPLORER"
        title="Find your next trusted store"
        text="Search by store name or address. Then rank by rating, confidence, health, reviews or improvement."
      />

      <div className="filterbar">
        <input
          placeholder="Search stores or addresses…"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void load();
            }
          }}
        />

        <select
          value={sort}
          onChange={(event) =>
            setSort(event.target.value)
          }
        >
          <option value="rating">
            Highest Rated
          </option>
          <option value="confidence">
            Most Trusted
          </option>
          <option value="reviews">
            Most Reviewed
          </option>
          <option value="health">
            Highest Health
          </option>
          <option value="improved">
            Most Improved
          </option>
        </select>

        <select
          value={minRating}
          onChange={(event) =>
            setMinRating(
              Number(
                event.target.value,
              ),
            )
          }
        >
          <option value="0">
            Any rating
          </option>
          <option value="3">
            3+ rating
          </option>
          <option value="4">
            4+ rating
          </option>
          <option value="4.5">
            4.5+ rating
          </option>
        </select>

        <select
          value={minHealth}
          onChange={(event) =>
            setMinHealth(
              Number(
                event.target.value,
              ),
            )
          }
        >
          <option value="0">
            Any health
          </option>
          <option value="60">
            60+ health
          </option>
          <option value="80">
            80+ health
          </option>
          <option value="90">
            90+ health
          </option>
        </select>

        <button
          className="btn primary"
          onClick={() => void load()}
        >
          Search
        </button>
      </div>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <div className="result-row">
        <span>
          {stores.length} stores
        </span>

        <span>
          Sorted by {sort}
        </span>
      </div>

      {stores.length ? (
        <div className="card-grid three">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="No stores match your search"
          text="Try adjusting your filters or search term."
        />
      )}
    </>
  );
}

/* =========================================================
   STORE CARD
========================================================= */

function StoreCard({
  store,
}: {
  store: Store;
}) {
  const navigate = useNavigate();

  return (
    <article className="store-card">
      <div className="store-card-head">
        <div className="store-avatar">
          {store.name
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="store-rating">
          ★ {store.rating.toFixed(1)}
        </div>
      </div>

      <h3>{store.name}</h3>

      <p>{store.address}</p>

      <div className="tags">
        <span>
          {store.ratingCount} ratings
        </span>

        <span>
          {store.confidence}% confidence
        </span>
      </div>

      <div className="health-line">
        <i
          style={{
            width: `${store.health}%`,
          }}
        />
      </div>

      <div className="store-meta">
        <span>
          Health <b>{store.health}</b>
        </span>

        <span
          className={
            store.trend.direction ===
            'DECLINING'
              ? 'down'
              : 'up'
          }
        >
          {store.trend.direction ===
          'IMPROVING'
            ? '↗'
            : store.trend.direction ===
              'DECLINING'
            ? '↘'
            : '→'}{' '}
          {store.trend.direction}
        </span>
      </div>

      <button
        className="btn ghost full"
        onClick={() =>
          navigate(
            `/stores/${store.id}`,
          )
        }
      >
        View store
      </button>
    </article>
  );
}

/* =========================================================
   STORE DETAILS
========================================================= */

function StoreDetails() {
  const { id } = useParams();
  const { user: authUser } = useAuth();

  if (!authUser) {
    return null;
  }

  const user = authUser;
  const [store, setStore] =
    useState<any>(null);

  const [mine, setMine] =
    useState<any>(null);

  const [rating, setRating] =
    useState(0);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const loadStore = async () => {
    if (!id) return;

    try {
      const result = await get<any>(
        `/stores/${id}`,
      );

      setStore(result.store);
    } catch (error) {
      setMessage(
        errorMessage(error),
      );
    }
  };

  useEffect(() => {
    void loadStore();

    if (
      user.role === 'USER' &&
      id
    ) {
      get<any>(
        `/stores/${id}/my-rating`,
      )
        .then((result) => {
          setMine(result.rating);
          setRating(
            result.rating?.value || 0,
          );
        })
        .catch(() => {});
    }
  }, [id, user.role]);

  if (!store) {
    return (
      <Loading
        text={
          message ||
          'Loading store intelligence…'
        }
      />
    );
  }

  const distribution =
    store.distribution || [];

  const chartData =
    distribution.map(
      (item: any) => ({
        name: `${item.rating}★`,
        value: item.count,
      }),
    );

  async function saveRating() {
    if (
      user.role !== 'USER'
    ) {
      setMessage(
        'Only customer accounts can submit ratings.',
      );
      return;
    }

    if (!rating) {
      setMessage(
        'Choose a rating first.',
      );
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const result =
        await post<any>(
          '/ratings',
          {
            storeId: Number(id),
            value: rating,
          },
        );

      setMessage(
        result.message ||
          'Your rating has been saved.',
      );

      await loadStore();

      if (id) {
        const mineResult =
          await get<any>(
            `/stores/${id}/my-rating`,
          );

        setMine(
          mineResult.rating,
        );
      }
    } catch (error) {
      setMessage(
        errorMessage(error),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Link
        className="back"
        to="/stores"
      >
        ← Back to Store Explorer
      </Link>

      <PageIntro
        eyebrow="STORE INTELLIGENCE"
        title={store.name}
        text={store.address}
      />

      <div className="detail-hero">
        <div>
          <div className="score">
            {store.rating.toFixed(2)}{' '}
            <span>★</span>
          </div>

          <p>
            {store.ratingCount} ratings ·{' '}
            {store.confidence >= 75
              ? 'HIGH'
              : store.confidence >= 40
              ? 'MODERATE'
              : 'LOW'}{' '}
            confidence
          </p>

          <div className="trend-pill">
            {store.trend
              ?.direction ===
            'IMPROVING'
              ? '↗'
              : store.trend
                  ?.direction ===
                'DECLINING'
              ? '↘'
              : '→'}{' '}
            {store.trend?.direction}{' '}
            ·{' '}
            {store.trend?.change >
            0
              ? '+'
              : ''}
            {store.trend?.change}%
          </div>
        </div>

        <div className="health-ring">
          <strong>
            {store.health}
          </strong>

          <span>
            /100
            <br />
            STORE HEALTH
          </span>
        </div>
      </div>

      <div className="insight-grid">
        <Panel title="Rating distribution">
          <div className="chart">
            <ResponsiveContainer
              width="100%"
              height={240}
            >
              <BarChart
                data={chartData}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                />
                <XAxis dataKey="name" />
                <YAxis
                  allowDecimals={false}
                />
                <Tooltip />
                <Bar
                  dataKey="value"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {distribution.map(
            (item: any) => {
              const percentage =
                store.ratingCount
                  ? Math.round(
                      (item.count /
                        store.ratingCount) *
                        100,
                    )
                  : 0;

              return (
                <div
                  className="dist-row"
                  key={item.rating}
                >
                  <span>
                    {item.rating} ★
                  </span>

                  <div>
                    <i
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <b>
                    {percentage}%
                  </b>
                </div>
              );
            },
          )}
        </Panel>

        <Panel title="Rating Trend">
          <div className="trend-big">
            {store.trend
              ?.direction ===
            'IMPROVING'
              ? '↗'
              : store.trend
                  ?.direction ===
                'DECLINING'
              ? '↘'
              : '→'}{' '}
            {store.trend?.direction}
          </div>

          <p>
            Current average:{' '}
            <b>
              {store.trend
                ?.current ??
                store.rating}
            </b>
          </p>

          <p>
            Previous period:{' '}
            <b>
              {store.trend
                ?.previous ??
                '—'}
            </b>
          </p>

          <p>
            Change:{' '}
            <b>
              {store.trend
                ?.change > 0
                ? '+'
                : ''}
              {store.trend
                ?.change ?? 0}
              %
            </b>
          </p>
        </Panel>
      </div>

      {user.role === 'USER' && (
        <Panel title="Your Rating">
          <p className="muted">
            {mine
              ? 'Update your rating whenever your experience changes.'
              : 'Be the first to record your experience from this account.'}
          </p>

          <div className="star-picker">
            {[1, 2, 3, 4, 5].map(
              (value) => (
                <button
                  key={value}
                  className={
                    value <= rating
                      ? 'selected'
                      : ''
                  }
                  onClick={() =>
                    setRating(value)
                  }
                >
                  ★
                </button>
              ),
            )}
          </div>

          <button
            className="btn primary"
            disabled={saving}
            onClick={() =>
              void saveRating()
            }
          >
            {saving
              ? 'Saving…'
              : mine
              ? 'Update Rating'
              : 'Submit Rating'}
          </button>

          {message && (
            <div className="alert success">
              {message}
            </div>
          )}
        </Panel>
      )}

      <Panel title="RateIQ Insight">
        <div className="insight-copy">
          <span>EXPLAINABLE INTELLIGENCE</span>

          <p>
            {buildStoreInsight(
              store,
            )}
          </p>
        </div>
      </Panel>
    </>
  );
}

function buildStoreInsight(
  store: any,
) {
  if (
    store.confidence < 40 &&
    store.rating >= 4
  ) {
    return `The rating is strong, but confidence is still ${store.confidence}% because the store has relatively few ratings. More customer feedback would make the signal more reliable.`;
  }

  if (
    store.trend?.direction ===
    'IMPROVING'
  ) {
    return `Rating performance is improving. The current average is ${store.rating.toFixed(
      2,
    )}, with a ${store.trend.change > 0 ? '+' : ''}${store.trend.change}% change versus the previous period.`;
  }

  if (
    store.trend?.direction ===
    'DECLINING'
  ) {
    return `The rating trend is declining. This store may benefit from reviewing recent customer feedback and service patterns.`;
  }

  return `The store is currently showing a ${store.rating.toFixed(
    2,
  )} rating with ${store.ratingCount} ratings and ${store.confidence}% confidence.`;
}

/* =========================================================
   USER RATINGS
========================================================= */

function MyRatings() {
  const { user: authUser } = useAuth();

  if (!authUser) {
    return null;
  }

  const user = authUser;

  const [rows, setRows] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    get<any>('/stores')
      .then(async (result) => {
        const stores: Store[] =
          result.stores || [];

        const rated = await Promise.all(
          stores.map(async (store) => {
            try {
              const response =
                await get<any>(
                  `/stores/${store.id}/my-rating`,
                );

              if (!response.rating) {
                return null;
              }

              return {
                store,
                rating:
                  response.rating,
              };
            } catch {
              return null;
            }
          }),
        );

        setRows(
          rated.filter(Boolean),
        );
      })
      .catch(() => {})
      .finally(() =>
        setLoading(false),
      );
  }, [user.id]);

  if (loading) {
    return (
      <Loading text="Loading your ratings…" />
    );
  }

  return (
    <>
      <PageIntro
        eyebrow="MY RATINGS"
        title="Your rating history"
        text="See the stores you have rated and update your experience from their detail pages."
      />

      {rows.length ? (
        <DataTable
          rows={rows}
          columns={[
            ['store', 'Store'],
            ['ratingValue', 'Your Rating'],
            ['createdAt', 'Updated'],
          ]}
          action={(row) => (
            <Link
              className="table-link"
              to={`/stores/${row.store.id}`}
            >
              View store
            </Link>
          )}
        />
      ) : (
        <Empty
          title="No ratings yet"
          text="Explore stores and share your first experience."
        />
      )}
    </>
  );
}

/* =========================================================
   OWNER
========================================================= */

function OwnerDashboard() {
  const [rows, setRows] =
    useState<any[]>([]);

  useEffect(() => {
    get<any>('/owner/dashboard')
      .then((result) =>
        setRows(
          result.stores || [],
        ),
      )
      .catch(() => {});
  }, []);

  const first = rows[0];

  return (
    <>
      <PageIntro
        eyebrow="RATEIQ BUSINESS"
        title="Know What Your Customers Think"
        text="Monitor your stores, reputation health and customer signals in one place."
      />

      <div className="stats four">
        <Stat
          label="Stores"
          value={rows.length}
        />

        <Stat
          label="Average rating"
          value={
            rows.length
              ? (
                  rows.reduce(
                    (sum, row) =>
                      sum +
                      Number(
                        row.rating ||
                          0,
                      ),
                    0,
                  ) /
                  rows.length
                ).toFixed(2)
              : '0.00'
          }
        />

        <Stat
          label="Average health"
          value={
            rows.length
              ? Math.round(
                  rows.reduce(
                    (sum, row) =>
                      sum +
                      Number(
                        row.health ||
                          0,
                      ),
                    0,
                  ) /
                    rows.length,
                )
              : 0
          }
        />

        <Stat
          label="Ratings"
          value={rows.reduce(
            (sum, row) =>
              sum +
              Number(
                row.ratingCount ||
                  0,
              ),
            0,
          )}
        />
      </div>

      {first && (
        <Panel title="Featured Store">
          <div className="owner-feature">
            <div>
              <span className="eyebrow">
                STORE HEALTH
              </span>
              <div className="owner-health">
                {first.health}
                <span>/100</span>
              </div>
              <p>
                {first.insight}
              </p>
            </div>

            <div className="owner-score-card">
              <strong>
                {Number(
                  first.rating || 0,
                ).toFixed(2)}{' '}
                ★
              </strong>
              <span>
                {first.confidence}%
                confidence
              </span>
            </div>
          </div>
        </Panel>
      )}

      <SectionHeader
        title="Your stores"
        link="/owner/store"
      />

      {rows.length ? (
        <div className="card-grid three">
          {rows.map((row) => (
            <Panel
              key={row.id}
              title={row.name}
            >
              <div className="store-summary">
                <strong>
                  {Number(
                    row.rating || 0,
                  ).toFixed(2)}{' '}
                  ★
                </strong>

                <span>
                  {row.ratingCount} ratings
                </span>
              </div>

              <div className="health-line">
                <i
                  style={{
                    width: `${row.health}%`,
                  }}
                />
              </div>

              <p>
                Health{' '}
                <b>
                  {row.health}/100
                </b>
              </p>

              <Link
                className="btn ghost full"
                to={`/stores/${row.id}`}
              >
                View intelligence
              </Link>
            </Panel>
          ))}
        </div>
      ) : (
        <Empty
          title="No stores assigned"
          text="Your assigned stores will appear here."
        />
      )}
    </>
  );
}

function OwnerStore() {
  return (
    <OwnerDataPage
      title="My Store"
      endpoint="/owner/dashboard"
      mode="stores"
    />
  );
}

function OwnerAnalytics() {
  return (
    <OwnerDataPage
      title="Analytics"
      endpoint="/owner/analytics"
      mode="stores"
    />
  );
}

function OwnerInsights() {
  return (
    <OwnerDataPage
      title="Insights"
      endpoint="/owner/insights"
      mode="insights"
    />
  );
}

function OwnerDataPage({
  title,
  endpoint,
  mode,
}: {
  title: string;
  endpoint: string;
  mode: 'stores' | 'insights';
}) {
  const [rows, setRows] =
    useState<any[]>([]);

  useEffect(() => {
    get<any>(endpoint)
      .then((result) =>
        setRows(
          result.stores ||
            result.insights ||
            [],
        ),
      )
      .catch(() => {});
  }, [endpoint]);

  return (
    <>
      <PageIntro
        eyebrow="RATEIQ BUSINESS"
        title={title}
        text="Explainable reputation intelligence for your business."
      />

      {rows.length ? (
        <div className="card-grid two">
          {rows.map((row) => (
            <Panel
              key={
                row.id ||
                row.storeId
              }
              title={
                row.name ||
                row.store
              }
            >
              {mode ===
              'insights' ? (
                <div className="insight-copy">
                  <span>
                    RATEIQ INSIGHT
                  </span>

                  <p>
                    {row.insight ||
                      'Reputation insights are being prepared.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="owner-score">
                    <strong>
                      {Number(
                        row.rating ||
                          0,
                      ).toFixed(2)}{' '}
                      ★
                    </strong>

                    <span>
                      {row.ratingCount ||
                        0}{' '}
                      ratings
                    </span>
                  </div>

                  <div className="health-breakdown">
                    <div>
                      <span>
                        Store Health
                      </span>
                      <b>
                        {row.health ||
                          0}
                      </b>
                    </div>

                    <div className="health-line">
                      <i
                        style={{
                          width: `${row.health || 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mini-stats">
                    <Stat
                      label="Confidence"
                      value={`${row.confidence || 0}%`}
                    />

                    <Stat
                      label="Ratings"
                      value={
                        row.ratingCount ||
                        0
                      }
                    />

                    <Stat
                      label="Health"
                      value={
                        row.health ||
                        0
                      }
                    />
                  </div>

                  <p>
                    {row.insight ||
                      'Reputation metrics are ready for review.'}
                  </p>
                </>
              )}
            </Panel>
          ))}
        </div>
      ) : (
        <Empty
          title="No store data yet"
          text="Your store information will appear here."
        />
      )}
    </>
  );
}

function OwnerRatings() {
  const [rows, setRows] =
    useState<any[]>([]);

  useEffect(() => {
    get<any>('/owner/ratings')
      .then((result) =>
        setRows(
          result.ratings || [],
        ),
      )
      .catch(() => {});
  }, []);

  return (
    <>
      <PageIntro
        eyebrow="RATEIQ BUSINESS"
        title="Customer Ratings"
        text="See which customers rated your stores and when."
      />

      <DataTable
        rows={rows}
        columns={[
          ['store', 'Store'],
          ['user', 'Customer'],
          ['value', 'Rating'],
          ['createdAt', 'Date'],
        ]}
      />
    </>
  );
}

/* =========================================================
   ADMIN
========================================================= */

function AdminDashboard() {
  const [overview, setOverview] =
    useState<any>(null);

  const [risks, setRisks] =
    useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      get<any>('/admin/overview'),
      get<any>('/admin/risks'),
    ])
      .then(([overviewResult, riskResult]) => {
        setOverview(overviewResult);
        setRisks(
          riskResult.risks || [],
        );
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <PageIntro
        eyebrow="RATEIQ CONTROL CENTER"
        title="Keep Your Platform Healthy"
        text="Manage users, stores and ratings while monitoring the reputation signals across RateIQ."
      />

      <div className="stats four">
        <Stat
          label="Total users"
          value={
            overview?.users ?? '—'
          }
        />

        <Stat
          label="Total stores"
          value={
            overview?.stores ?? '—'
          }
        />

        <Stat
          label="Total ratings"
          value={
            overview?.ratings ?? '—'
          }
        />

        <Stat
          label="Average rating"
          value={
            overview?.averageRating ??
            '—'
          }
        />
      </div>

      <div className="admin-highlight-grid">
        <Panel title="Platform Signal">
          <div className="signal-grid">
            <Stat
              label="Active users"
              value={
                overview?.activeUsers ??
                '—'
              }
            />

            <Stat
              label="Active stores"
              value={
                overview?.activeStores ??
                '—'
              }
            />
          </div>
        </Panel>

        <Panel title="Risk Center">
          {risks.length ? (
            <div className="risk-list">
              {risks
                .slice(0, 4)
                .map((risk) => (
                  <div
                    className="risk-item"
                    key={
                      risk.storeId
                    }
                  >
                    <div>
                      <b>
                        {risk.store}
                      </b>
                      <span>
                        {risk.today ??
                          0}{' '}
                        ratings today
                      </span>
                    </div>

                    <span
                      className={`risk ${risk.risk}`}
                    >
                      {risk.risk}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <Empty
              title="All clear"
              text="No unusual activity is currently detected."
            />
          )}
        </Panel>
      </div>

      <SectionHeader
        title="Administration"
      />

      <div className="feature-grid">
        <Feature
          n="01"
          title="Users"
          text="Search, inspect, edit and deactivate platform accounts."
        />

        <Feature
          n="02"
          title="Stores"
          text="Manage stores, owners, addresses and reputation signals."
        />

        <Feature
          n="03"
          title="Ratings"
          text="Monitor rating values, customers and timestamps."
        />
      </div>
    </>
  );
}

function AdminUsers() {
  const [rows, setRows] =
    useState<any[]>([]);

  const [query, setQuery] =
    useState('');

  const [role, setRole] =
    useState('');

  const [modal, setModal] =
    useState<any>(null);

  async function load() {
    try {
      const result =
        await get<any>(
          '/admin/users',
          {
            q: query,
            role,
          },
        );

      setRows(
        result.users || [],
      );
    } catch {
      setRows([]);
    }
  }

  useEffect(() => {
    void load();
  }, [role]);

  async function deactivate(
    id: number,
    name: string,
  ) {
    if (
      !window.confirm(
        `Deactivate ${name}?`,
      )
    ) {
      return;
    }

    try {
      await del(
        `/admin/users/${id}`,
      );
      await load();
    } catch (error) {
      window.alert(
        errorMessage(error),
      );
    }
  }

  return (
    <>
      <PageIntro
        eyebrow="CONTROL CENTER"
        title="User Management"
        text="Search and manage customers, owners and administrators."
        action={
          <button
            className="btn primary"
            onClick={() =>
              setModal({
                mode: 'create',
              })
            }
          >
            + Add user
          </button>
        }
      />

      <Toolbar
        query={query}
        setQuery={setQuery}
        onSearch={load}
      >
        <select
          value={role}
          onChange={(event) =>
            setRole(
              event.target.value,
            )
          }
        >
          <option value="">
            All roles
          </option>
          <option value="USER">
            User
          </option>
          <option value="OWNER">
            Owner
          </option>
          <option value="ADMIN">
            Admin
          </option>
        </select>
      </Toolbar>

      <DataTable
        rows={rows}
        columns={[
          ['name', 'Name'],
          ['email', 'Email'],
          ['role', 'Role'],
          ['ownerRating', 'Owner Rating'],
          ['status', 'Status'],
          ['createdAt', 'Created'],
        ]}
        action={(row) => (
          <div className="row-actions">
            <button
              onClick={() =>
                setModal({
                  mode: 'edit',
                  ...row,
                })
              }
            >
              Edit
            </button>

            {row.status ===
              'ACTIVE' && (
              <button
                className="danger"
                onClick={() =>
                  void deactivate(
                    row.id,
                    row.name,
                  )
                }
              >
                Deactivate
              </button>
            )}
          </div>
        )}
      />

      {modal && (
        <UserModal
          data={modal}
          close={() =>
            setModal(null)
          }
          refresh={load}
        />
      )}
    </>
  );
}

function UserModal({
  data,
  close,
  refresh,
}: {
  data: any;
  close: () => void;
  refresh: () => void;
}) {
  const [form, setForm] = useState<any>({ ...data });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setError('');

    const validation = adminUserSchema.safeParse({
      name: form.name || '',
      email: form.email || '',
      address: form.address || '',
      role: form.role || 'USER',
      status: data.mode === 'edit' ? (form.status || 'ACTIVE') : undefined,
      password: data.mode === 'create' ? (form.password || '') : undefined,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Please check the form.');
      return;
    }

    setSaving(true);
    try {
      if (data.mode === 'create') {
        await post('/admin/users', form);
      } else {
        await put(`/admin/users/${data.id}`, {
          name: form.name,
          email: form.email,
          address: form.address,
          role: form.role,
          status: form.status,
          ...(form.password ? { password: form.password } : {}),
        });
      }
      close();
      refresh();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={data.mode === 'create' ? 'Add user' : 'Edit user'}
      close={close}
    >
      <div className="form-grid">
        <Field
          label="Name"
          value={form.name || ''}
          onChange={(value) => setForm({ ...form, name: value })}
        />

        <Field
          label="Email"
          type="email"
          value={form.email || ''}
          onChange={(value) => setForm({ ...form, email: value })}
        />

        <Field
          label="Address"
          value={form.address || ''}
          onChange={(value) => setForm({ ...form, address: value })}
        />

        {data.mode === 'create' && (
          <Field
            label="Password"
            type="password"
            value={form.password || ''}
            onChange={(value) => setForm({ ...form, password: value })}
          />
        )}

        <label className="field">
          <span>Role</span>
          <select
            value={form.role || 'USER'}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
          >
            <option value="USER">USER</option>
            <option value="OWNER">OWNER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>

        {data.mode === 'edit' && (
          <label className="field">
            <span>Status</span>
            <select
              value={form.status || 'ACTIVE'}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
        )}
      </div>

      {data.mode === 'create' && (
        <p className="muted">
          Name: 20–60 characters · Address: max 400 · Password: 8–16 characters, 1 uppercase + 1 special character.
        </p>
      )}

      {data.mode === 'edit' && form.role === 'OWNER' && (
        <div className="alert success">
          Current owner rating: {form.ownerRating != null ? `${Number(form.ownerRating).toFixed(2)} ★` : 'No ratings yet'}
        </div>
      )}

      {error && <div className="alert error">{error}</div>}

      <ModalActions save={save} loading={saving} />
    </Modal>
  );
}

function AdminStores() {
  const [rows, setRows] =
    useState<any[]>([]);

  const [query, setQuery] =
    useState('');

  const [modal, setModal] =
    useState<any>(null);

  const load = async () => {
    try {
      const result =
        await get<any>(
          '/admin/stores',
          {
            q: query,
          },
        );

      setRows(
        result.stores || [],
      );
    } catch {
      setRows([]);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <PageIntro
        eyebrow="CONTROL CENTER"
        title="Store Management"
        text="Manage stores, owners and reputation health."
        action={
          <button
            className="btn primary"
            onClick={() =>
              setModal({
                mode: 'create',
              })
            }
          >
            + Add store
          </button>
        }
      />

      <Toolbar
        query={query}
        setQuery={setQuery}
        onSearch={load}
      />

      <DataTable
        rows={rows}
        columns={[
          ['name', 'Store'],
          ['address', 'Address'],
          ['owner', 'Owner'],
          ['rating', 'Rating'],
          ['ratingCount', 'Ratings'],
          ['health', 'Health'],
        ]}
        action={(row) => (
          <div className="row-actions">
            <button
              onClick={() =>
                setModal({
                  mode: 'edit',
                  ...row,
                })
              }
            >
              Edit
            </button>

            <button
              className="danger"
              onClick={async () => {
                if (
                  window.confirm(
                    `Delete ${row.name}? This removes its ratings.`,
                  )
                ) {
                  try {
                    await del(
                      `/admin/stores/${row.id}`,
                    );
                    await load();
                  } catch (error) {
                    window.alert(
                      errorMessage(
                        error,
                      ),
                    );
                  }
                }
              }}
            >
              Delete
            </button>
          </div>
        )}
      />

      {modal && (
        <StoreModal
          data={modal}
          close={() =>
            setModal(null)
          }
          refresh={load}
        />
      )}
    </>
  );
}

function StoreModal({
  data,
  close,
  refresh,
}: {
  data: any;
  close: () => void;
  refresh: () => void;
}) {
  const [form, setForm] =
    useState<any>({
      ...data,
    });

  const [owners, setOwners] =
    useState<User[]>([]);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    get<any>('/admin/users', {
      role: 'OWNER',
    })
      .then((result) =>
        setOwners(
          result.users || [],
        ),
      )
      .catch(() => {});
  }, []);

  async function save() {
    const validation = storeSchema.safeParse({
      name: form.name || '',
      email: form.email || '',
      address: form.address || '',
    });

    if (!validation.success) {
      window.alert(validation.error.issues[0]?.message || 'Please check the store form.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name,
        email: form.email,
        address: form.address,
        ownerId:
          form.ownerId
            ? Number(
                form.ownerId,
              )
            : null,
      };

      if (data.mode === 'create') {
        await post(
          '/admin/stores',
          payload,
        );
      } else {
        await put(
          `/admin/stores/${data.id}`,
          payload,
        );
      }

      close();
      refresh();
    } catch (error) {
      window.alert(
        errorMessage(error),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={
        data.mode === 'create'
          ? 'Add store'
          : 'Edit store'
      }
      close={close}
    >
      <div className="form-grid">
        <Field
          label="Store name"
          value={form.name || ''}
          onChange={(value) =>
            setForm({
              ...form,
              name: value,
            })
          }
        />

        <Field
          label="Email"
          type="email"
          value={form.email || ''}
          onChange={(value) =>
            setForm({
              ...form,
              email: value,
            })
          }
        />

        <Field
          label="Address"
          value={
            form.address || ''
          }
          onChange={(value) =>
            setForm({
              ...form,
              address: value,
            })
          }
        />

        <label className="field">
          <span>Owner</span>

          <select
            value={
              form.ownerId ||
              form.owner?.id ||
              ''
            }
            onChange={(event) =>
              setForm({
                ...form,
                ownerId:
                  event.target
                    .value,
              })
            }
          >
            <option value="">
              Unassigned
            </option>

            {owners.map(
              (owner) => (
                <option
                  key={owner.id}
                  value={owner.id}
                >
                  {owner.name}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      <ModalActions
        save={save}
        loading={saving}
      />
    </Modal>
  );
}

function AdminRatings() {
  const [rows, setRows] =
    useState<any[]>([]);

  useEffect(() => {
    get<any>('/admin/ratings')
      .then((result) =>
        setRows(
          result.ratings || [],
        ),
      )
      .catch(() => {});
  }, []);

  return (
    <>
      <PageIntro
        eyebrow="CONTROL CENTER"
        title="Rating Management"
        text="Monitor stores, customers, ratings and timestamps."
      />

      <DataTable
        rows={rows}
        columns={[
          ['store', 'Store'],
          ['user', 'Customer'],
          ['value', 'Rating'],
          ['createdAt', 'Date'],
        ]}
      />
    </>
  );
}

function Risks() {
  const [rows, setRows] =
    useState<any[]>([]);

  useEffect(() => {
    get<any>('/admin/risks')
      .then((result) =>
        setRows(
          result.risks || [],
        ),
      )
      .catch(() => {});
  }, []);

  return (
    <>
      <PageIntro
        eyebrow="RISK CENTER"
        title="Monitor unusual activity"
        text="These signals identify unusual rating patterns. They do not prove fake reviews."
      />

      {rows.length ? (
        <div className="card-grid three">
          {rows.map((risk) => (
            <Panel
              key={risk.storeId}
              title={risk.store}
            >
              <span
                className={`risk ${
                  risk.risk || 'MEDIUM'
                }`}
              >
                {risk.risk ||
                  'MEDIUM'}{' '}
                ATTENTION
              </span>

              <div className="risk-number">
                {risk.today ?? 0}
                <small>
                  {' '}
                  ratings today
                </small>
              </div>

              <p>
                Typical baseline:{' '}
                <b>
                  {risk.baseline ??
                    0}
                  /day
                </b>
                <br />
                Deviation:{' '}
                <b>
                  {risk.deviation ??
                    0}
                  σ
                </b>
              </p>

              <Link
                className="btn ghost"
                to={`/stores/${risk.storeId}`}
              >
                Investigate →
              </Link>
            </Panel>
          ))}
        </div>
      ) : (
        <Empty
          title="All clear"
          text="No unusual rating activity is currently detected."
        />
      )}
    </>
  );
}

function Audit() {
  const [rows, setRows] =
    useState<any[]>([]);

  useEffect(() => {
    get<any>('/audit-logs')
      .then((result) =>
        setRows(
          result.logs || [],
        ),
      )
      .catch(() => {});
  }, []);

  return (
    <>
      <PageIntro
        eyebrow="CONTROL CENTER"
        title="Audit Center"
        text="A traceable record of important administrative actions."
      />

      <DataTable
        rows={rows}
        columns={[
          ['actor', 'Actor'],
          ['action', 'Action'],
          ['entityType', 'Entity'],
          ['entityId', 'Entity ID'],
          ['createdAt', 'Timestamp'],
        ]}
      />
    </>
  );
}

function Reports() {
  const [type, setType] =
    useState<'users' | 'stores' | 'ratings'>(
      'stores',
    );

  const [rows, setRows] =
    useState<any[]>([]);

  useEffect(() => {
    get<any>(
      `/reports/${type}`,
    )
      .then((result) =>
        setRows(
          result.rows || [],
        ),
      )
      .catch(() =>
        setRows([]),
      );
  }, [type]);

  const columns = rows[0]
    ? Object.keys(rows[0])
        .filter(
          (key) =>
            typeof rows[0][key] !==
            'object',
        )
        .slice(0, 8)
        .map(
          (key) =>
            [
              key,
              key
                .replace(
                  /([A-Z])/g,
                  ' $1',
                )
                .replace(
                  /^./,
                  (value) =>
                    value.toUpperCase(),
                ),
            ] as [
              string,
              string,
            ],
        )
    : [];

  function exportCsv() {
    if (!rows.length) {
      return;
    }

    const keys = Object.keys(
      rows[0],
    ).filter(
      (key) =>
        typeof rows[0][key] !==
        'object',
    );

    const csv = [
      keys.join(','),
      ...rows.map((row) =>
        keys
          .map(
            (key) =>
              `"${String(
                row[key] ?? '',
              ).replaceAll(
                '"',
                '""',
              )}"`,
          )
          .join(','),
      ),
    ].join('\n');

    const url =
      URL.createObjectURL(
        new Blob([csv], {
          type: 'text/csv;charset=utf-8',
        }),
      );

    const anchor =
      document.createElement(
        'a',
      );

    anchor.href = url;
    anchor.download = `rateiq-${type}.csv`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageIntro
        eyebrow="CONTROL CENTER"
        title="Reports"
        text="Export platform data as CSV for analysis and assessment reporting."
      />

      <div className="filterbar">
        <select
          value={type}
          onChange={(event) =>
            setType(
              event.target
                .value as
                | 'users'
                | 'stores'
                | 'ratings',
            )
          }
        >
          <option value="users">
            Users
          </option>
          <option value="stores">
            Stores
          </option>
          <option value="ratings">
            Ratings
          </option>
        </select>

        <button
          className="btn primary"
          onClick={exportCsv}
        >
          ⇩ Export CSV
        </button>
      </div>

      <DataTable
        rows={rows.slice(0, 50)}
        columns={columns}
      />
    </>
  );
}

/* =========================================================
   PROFILE
========================================================= */

function Profile() {
  const { user: authUser } = useAuth();

  if (!authUser) {
    return null;
  }

  const user = authUser;

  const [form, setForm] =
    useState<any>({});

  const [message, setMessage] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  async function save() {
    setMessage('');

    const validation = passwordChangeSchema.safeParse(form);

    if (!validation.success) {
      setMessage(validation.error.issues[0]?.message || 'Please check the password fields.');
      return;
    }

    setSaving(true);

    try {
      const result =
        await put<any>(
          '/auth/password',
          form,
        );

      setMessage(
        result.message ||
          'Password changed successfully.',
      );

      setForm({});
    } catch (error) {
      setMessage(
        errorMessage(error),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageIntro
        eyebrow="ACCOUNT"
        title="Your Profile"
        text="Manage your account and security settings."
      />

      <div className="profile-grid">
        <Panel title="Account details">
          <div className="profile-head">
            <div className="avatar-large">
              {initials(user.name)}
            </div>

            <div>
              <h3>
                {user.name}
              </h3>

              <p>
                {user.email}
              </p>

              <span className="role-badge">
                {user.role}
              </span>
            </div>
          </div>

          <div className="detail-list">
            <div>
              <span>
                Address
              </span>
              <b>
                {user.address}
              </b>
            </div>

            <div>
              <span>
                Status
              </span>
              <b>
                {user.status}
              </b>
            </div>
          </div>
        </Panel>

        <Panel title="Change password">
          <div className="form-grid">
            <Field
              label="Current password"
              type="password"
              value={
                form.currentPassword ||
                ''
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  currentPassword:
                    value,
                })
              }
            />

            <Field
              label="New password"
              type="password"
              value={
                form.newPassword ||
                ''
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  newPassword:
                    value,
                })
              }
            />

            <Field
              label="Confirm password"
              type="password"
              value={
                form.confirmPassword ||
                ''
              }
              onChange={(value) =>
                setForm({
                  ...form,
                  confirmPassword:
                    value,
                })
              }
            />
          </div>

          <button
            className="btn primary"
            disabled={saving}
            onClick={() =>
              void save()
            }
          >
            {saving
              ? 'Saving…'
              : 'Change password'}
          </button>

          {message && (
            <div className="alert success">
              {message}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

/* =========================================================
   COMMON UI
========================================================= */

function PageIntro({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow: string;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <span className="eyebrow">
          {eyebrow}
        </span>

        <h1>{title}</h1>

        <p>{text}</p>
      </div>

      {action}
    </div>
  );
}

function SectionHeader({
  title,
  link,
}: {
  title: string;
  link?: string;
}) {
  return (
    <div className="section-header">
      <h2>{title}</h2>

      {link && (
        <Link to={link}>
          View all →
        </Link>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="stat-card">
      <span>{label}</span>

      <strong>
        {value}
      </strong>

      {sub && (
        <small>
          {sub}
        </small>
      )}
    </div>
  );
}

function MetricText({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Feature({
  n,
  title,
  text,
}: {
  n: string;
  title: string;
  text: string;
}) {
  return (
    <div className="feature-card">
      <span>{n}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function RoleCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="role-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Toolbar({
  query,
  setQuery,
  onSearch,
  children,
}: {
  query: string;
  setQuery: (value: string) => void;
  onSearch: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="filterbar">
      <input
        placeholder="Search…"
        value={query}
        onChange={(event) =>
          setQuery(
            event.target.value,
          )
        }
        onKeyDown={(event) => {
          if (
            event.key ===
            'Enter'
          ) {
            onSearch();
          }
        }}
      />

      {children}

      <button
        className="btn ghost"
        onClick={onSearch}
      >
        Search
      </button>
    </div>
  );
}

function DataTable({
  rows,
  columns,
  action,
  emptyTitle = 'Nothing to show yet',
  emptyText = 'There is no data to display.',
}: {
  rows: any[];
  columns: [string, string][];
  action?: (row: any) => ReactNode;
  emptyTitle?: string;
  emptyText?: string;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  function rawValueFor(row: any, key: string): any {
    let value = row[key];
    if (key === 'store' && typeof value === 'object') value = row.store?.name;
    if (key === 'user' && typeof value === 'object') value = row.user?.name;
    if (key === 'owner' && typeof value === 'object') value = row.owner?.name;
    if (key === 'actor' && typeof value === 'object') value = row.actor?.name;
    if (key === 'ratingValue') value = row.rating?.value ?? value;
    return value;
  }

  function valueFor(row: any, key: string): string {
    const raw = rawValueFor(row, key);
    if (raw == null) return '—';
    if (key === 'createdAt' || key === 'updatedAt') {
      return new Date(raw).toLocaleString();
    }
    if (key === 'value' || key === 'rating' || key === 'ownerRating') {
      return typeof raw === 'number' ? `${raw} ★` : String(raw);
    }
    return String(raw);
  }

  function compare(a: any, b: any, key: string): number {
    const av = rawValueFor(a, key);
    const bv = rawValueFor(b, key);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (key === 'createdAt' || key === 'updatedAt') {
      const at = new Date(av).getTime();
      const bt = new Date(bv).getTime();
      if (!Number.isNaN(at) && !Number.isNaN(bt)) return at - bt;
    }
    if (typeof av === 'number' && typeof bv === 'number') return av - bv;
    return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
  }

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const result = compare(a, b, sortKey);
      return sortDirection === 'asc' ? result : -result;
    });
  }, [rows, sortKey, sortDirection]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }

  return (
    <div className="table-card">
      {rows.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {columns.map(([key, label]) => {
                  const active = sortKey === key;
                  const indicator = active ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : '';
                  return (
                    <th key={key} aria-sort={active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        title={`Sort by ${label}`}
                        style={{ border: 0, background: 'transparent', padding: 0, font: 'inherit', fontWeight: 700, cursor: 'pointer', color: 'inherit' }}
                      >
                        {label}{indicator}
                      </button>
                    </th>
                  );
                })}
                {action && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, index) => (
                <tr key={row.id || row.storeId || index}>
                  {columns.map(([key]) => (
                    <td key={key}>{valueFor(row, key)}</td>
                  ))}
                  {action && <td>{action(row)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title={emptyTitle} text={emptyText} />
      )}
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-title">
        <h3>{title}</h3>
      </div>

      {children}
    </section>
  );
}

function Empty({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="empty">
      <div>○</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Loading({
  text,
}: {
  text: string;
}) {
  return (
    <div className="loading">
      <span className="spinner" />
      {text}
    </div>
  );
}

function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={close}
    >
      <div
        className="modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-head">
          <h2>{title}</h2>

          <button
            onClick={close}
            type="button"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function ModalActions({
  save,
  loading = false,
}: {
  save: () => void;
  loading?: boolean;
}) {
  return (
    <div className="modal-actions">
      <button
        className="btn primary"
        type="button"
        disabled={loading}
        onClick={save}
      >
        {loading
          ? 'Saving…'
          : 'Save changes'}
      </button>
    </div>
  );
}

function Brand() {
  return (
    <Link
      className="brand"
      to="/"
    >
      <b>R</b>

      <span>
        RateIQ
        <small>
          From Ratings to Real Insights.
        </small>
      </span>
    </Link>
  );
}

export default App;