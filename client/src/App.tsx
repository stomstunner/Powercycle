import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, Camera, Check, ChevronRight, CircleAlert, CircleHelp, ClipboardList, Eye, Globe2, Heart, Hand, Headphones, Laptop, Leaf, Lightbulb, LockKeyhole, LogOut, Mail, MapPin, MessageSquare, Moon, PackageCheck, Palette, QrCode, Recycle, RefreshCw, Ruler, Search, Scissors, ShieldCheck, ShoppingBag, Smartphone, Sparkles, Sun, Tablet, TestTube, Truck, Upload, UserRound, Wrench, X, Zap } from 'lucide-react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from './auth';
import { useAuth } from './useAuth';

type Product = { slug: string; name: string; description: string; priceInr: number; category: string; sourceMaterial: string; conditionNote: string; isDemo?: boolean; isCommunityListing?: boolean; imageUrl?: string; stockQuantity?: number; condition?: string; publicCity?: string; publicState?: string; sellerPhone?: string; createdAt?: string };
type IdeaStep = { id?: string; title: string; description: string; position?: number; image?: { url: string } };
type Idea = { slug: string; title: string; description: string; difficulty: string; safetyNotes: string; coverImage?: { url: string }; steps?: IdeaStep[]; deviceCategory?: string; purposeCategory?: string; tags?: string[]; isOwner?: boolean };
type Recommendation = { id?: string; recommendation: string; reason: string; nextSteps: string[]; safetyFlags: string[] };
type AiResult = { requestId: string; assessmentId?: string; status: 'unavailable' | 'analysed'; errorCode?: string; message?: string; deviceCategory?: string; visibleObservations?: string[]; possibleVisibleDamage?: string[]; uncertainties?: string[]; safetyFlags?: string[] };
type RepairPlan = { steps: Array<{ title: string; description: string }>; safetyNote: string };
type ActivityData = { assessments: Array<{ _id: string; deviceType: string; brand?: string; modelName?: string; recommendation: string; reason: string; nextSteps: string[]; safetyFlags: string[]; condition: string; createdAt: string; imageUrl?: string; aiAnalysis?: AiResult; repairPlan?: RepairPlan }>; collectionRequests: Array<{ _id: string; deviceCategory: string; city: string; itemCount: number; status: string; createdAt: string; preferredDate: string }>; ideas: Array<{ _id: string; title: string; shortDescription: string; status: string; createdAt: string; updatedAt: string }>; purchases: Array<never>; marketplaceRequests?: Array<{ id: string; listingId: string; listingTitle: string; quantity: number; unitPriceInr: number; message: string; status: string; createdAt: string; role: 'buyer' | 'seller'; buyerEmail?: string; buyerPhone?: string }> };
type ImpactSummary = { devicesAssessed: number; secondLifeItems: number; publishedIdeas: number; verifiedEwasteKg: number | null; collectionRequests: { submitted: number; underReview: number; accepted: number; completed: number; rejected: number }; recentActivity: Array<{ id: string; type: string; title: string; createdAt: string; status: string; href: string }>; dataQuality: { secondLifeItems: string; verifiedEwasteKg: string } };
type IdeaStepDraft = { id: string; title: string; description: string; imageUrl: string; imageName: string; file?: File };

const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const navigation = [{ label: 'Assess', path: '/assess' }, { label: 'Ideas', path: '/ideas' }, { label: 'Marketplace', path: '/marketplace' }, { label: 'My Listings', path: '/my-listings' }, { label: 'Collection', path: '/collection' }, { label: 'Impact', path: '/impact' }, { label: 'My Activity', path: '/my-activity' }, { label: 'About', path: '/about' }];
const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const productImages: Record<string, string> = {
  'refurbished-bluetooth-speaker': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80',
  'upcycled-keyboard-wall-art': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80',
  'electronic-parts-desk-organizer': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
  'cable-organizer': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80',
  'upcycled-cd-decoration': 'https://images.unsplash.com/photo-1528459105426-b9548367069b?auto=format&fit=crop&w=900&q=80',
  'diy-stem-electronics-learning-kit': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=900&q=80',
  'refurbished-computer-mouse': 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80',
  'refurbished-led-desk-lamp': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80',
  'tech-themed-photo-frame': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80',
  'mini-storage-box': 'https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=900&q=80',
};
const categoryImages = [
  ['Repair', 'Give a working life a little longer.', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80'],
  ['Reuse', 'Pass useful technology forward.', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80'],
  ['Upcycle', 'Make something useful from old parts.', 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80'],
  ['Recycle', 'Handle unsafe electronics responsibly.', 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=80'],
];

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const headers = new Headers(options?.headers);
  if (!(options?.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  const body = await response.json() as { data: T; error: { code?: string; message: string } | null };
  if (!response.ok) {
    if (response.status === 401) throw new Error('Your session has expired. Please sign in again.');
    throw new Error(body.error?.message ?? 'Request failed.');
  }
  return body.data;
}

function AuthLoading() {
  return <main className="auth-loading"><span className="brand-icon"><Zap size={19} /></span><p>Checking your PowerCycle session…</p></main>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const location = useLocation();
  if (loading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  if (loading) return <AuthLoading />;
  return user ? <Navigate to="/" replace /> : <>{children}</>;
}

function AuthShell({ children, title, eyebrow, showBack = true }: { children: React.ReactNode; title: string; eyebrow: string; showBack?: boolean }) {
  return <main className="auth-page"><section className="auth-branding"><Link className="auth-brand" to="/login"><span className="brand-icon"><Recycle size={20} /></span>Power<span>Cycle</span></Link><p className="eyebrow">Recycle · reuse · resell · make an impact</p><h1>Welcome to <em>PowerCycle</em></h1><p>Give your old devices a second life while helping build a cleaner and greener planet.</p><div className="auth-benefits"><span><Leaf size={18} /><strong>Reduce</strong><small>Minimize e-waste</small></span><span><Recycle size={18} /><strong>Reuse</strong><small>Extend device life</small></span><span><ShieldCheck size={18} /><strong>Recycle</strong><small>Dispose responsibly</small></span><span><Globe2 size={18} /><strong>Make an impact</strong><small>For a sustainable tomorrow</small></span></div></section><section className="auth-card">{showBack && <Link className="auth-back" to="/login"><ArrowRight size={15} /> Back to sign in</Link>}<p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{children}</section></main>;
}

function AuthError({ message }: { message: string }) {
  return <p className="auth-error" role="alert"><CircleAlert size={16} /> {message}</p>;
}

function describeAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) return 'Supabase has temporarily limited confirmation emails. Wait a few minutes, then try again once, or use an already-created account.';
  if (normalized.includes('user already registered') || normalized.includes('already been registered')) return 'This email already has an account. Use Sign in instead.';
  if (normalized.includes('email not confirmed')) return 'Your email is not confirmed yet.';
  if (normalized.includes('invalid login credentials')) return 'Email or password is incorrect.';
  return message;
}

function LoginPage() {
  const { configurationError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setConfirmationSent(false);
    if (!supabase) { setError(configurationError ?? 'Authentication is not configured.'); return; }
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (signInError) { setError(describeAuthError(signInError.message)); return; }
    const state = location.state as { from?: string } | null;
    const destination = state?.from && state.from.startsWith('/') && !state.from.startsWith('//') ? state.from : '/';
    navigate(destination, { replace: true });
  }
  async function resendConfirmation() {
    if (!supabase || !email.trim()) return;
    setError(''); setConfirmationSent(false);
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    if (resendError) { setError(describeAuthError(resendError.message)); return; }
    setConfirmationSent(true);
  }
  return <AuthShell eyebrow="Sign in" title="Welcome back" showBack={false}><p className="auth-subtitle">Sign in to continue your journey with PowerCycle.</p>{error && <AuthError message={error} />}{confirmationSent && <p className="auth-success" role="status">Confirmation email sent. Check your inbox and spam folder, then return here to sign in.</p>}<form className="auth-form" onSubmit={submit}><label>Email or username<Mail size={16} /><input required type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setConfirmationSent(false); }} placeholder="Enter your email" /></label><label>Password<LockKeyhole size={16} /><div className="password-field"><input required minLength={6} type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></label><div className="auth-row"><Link to="/forgot-password">Forgot password?</Link></div><button className="button auth-submit" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'} <ArrowRight size={16} /></button></form>{error === 'Your email is not confirmed yet.' && <button className="resend-confirmation" type="button" onClick={() => void resendConfirmation()}>Resend confirmation email</button>}<p className="auth-switch">Don't have an account? <Link to="/signup">Sign up <ArrowRight size={14} /></Link></p></AuthShell>;
}

function SignupPage() {
  const navigate = useNavigate();
  const { configurationError } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('');
    if (!supabase) { setError(configurationError ?? 'Authentication is not configured.'); return; }
    setSubmitting(true);
    const { error: signUpError, data } = await supabase.auth.signUp({ email: email.trim(), password });
    setSubmitting(false);
    if (signUpError) { setError(describeAuthError(signUpError.message)); return; }
    if (data.session) navigate('/', { replace: true }); else setMessage('Account created. Check your email to confirm your address before signing in.');
  }
  return <AuthShell eyebrow="Create your account" title="Start your PowerCycle journey"><p className="auth-subtitle">Keep your assessments and responsible next steps connected to your account.</p>{error && <AuthError message={error} />}{message && <p className="auth-success" role="status">{message}</p>}<form className="auth-form" onSubmit={submit}><label>Email<Mail size={16} /><input required type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} placeholder="you@example.com" /></label><label>Password<LockKeyhole size={16} /><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label><button className="button auth-submit" type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'} <ArrowRight size={16} /></button></form>{error.includes('temporarily limited') && <p className="auth-help">For local testing, create one user in Supabase Dashboard → Authentication → Users and mark it confirmed, then <Link to="/login">sign in</Link>.</p>}{error.includes('already has an account') && <p className="auth-help"><Link to="/login">Go to sign in</Link></p>}<p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p></AuthShell>;
}

function ForgotPasswordPage() {
  const { configurationError } = useAuth(); const [email, setEmail] = useState(''); const [error, setError] = useState(''); const [sent, setSent] = useState(false); const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); if (!supabase) { setError(configurationError ?? 'Authentication is not configured.'); return; } setSubmitting(true); const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/login` }); setSubmitting(false); if (resetError) { setError(resetError.message); return; } setSent(true); }
  return <AuthShell eyebrow="Account recovery" title="Reset your password"><p className="auth-subtitle">Enter your email and, if an account exists, Supabase will send recovery instructions.</p>{error && <AuthError message={error} />}{sent ? <p className="auth-success" role="status">If that email is registered, a recovery link is on its way. Check your inbox.</p> : <form className="auth-form" onSubmit={submit}><label>Email<Mail size={16} /><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><button className="button auth-submit" type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send recovery link'} <ArrowRight size={16} /></button></form>}<p className="auth-switch"><Link to="/login">Back to sign in</Link></p></AuthShell>;
}

function Header({ cartCount, dark, toggleDark }: { cartCount: number; dark: boolean; toggleDark: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [menuOpen]);
  async function logout() { await signOut(); navigate('/login', { replace: true }); }
  return <header className="site-header"><Link className="brand" to="/" aria-label="PowerCycle home"><span className="brand-icon"><Zap size={17} /></span>PowerCycle</Link><button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen((open) => !open)}><span className="sr-only">{menuOpen ? 'Close' : 'Open'} menu</span>{menuOpen ? <X /> : <span>☰</span>}</button><nav id="primary-navigation" className={menuOpen ? 'is-open' : ''} aria-label="Primary navigation">{navigation.map((item) => <Link className={location.pathname.startsWith(item.path) ? 'active' : ''} key={item.path} to={item.path}>{item.label}</Link>)}<Link className="cart-link" to="/cart"><ShoppingBag size={16} /> Cart <span>{cartCount}</span></Link><Link className="user-chip" title={user?.email} to="/profile">{user?.email?.split('@')[0]}</Link><button className="signout-button" type="button" onClick={() => void logout()} aria-label="Sign out"><LogOut size={16} /></button><button className="theme-toggle" type="button" onClick={toggleDark} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button></nav></header>;
}

function Layout({ children, cartCount, dark, toggleDark }: { children: React.ReactNode; cartCount: number; dark: boolean; toggleDark: () => void }) {
  return <div className="app"><Header cartCount={cartCount} dark={dark} toggleDark={toggleDark} />{children}<footer><div><strong><span className="brand-icon"><Zap size={15} /></span> PowerCycle</strong><span>Give Old Electronics a New Purpose</span></div><small>Prototype platform. Listings, collection, and impact claims are not real-world fulfilment.</small></footer></div>;
}

function HomePage() {
  const features = [
    ['AI Device Assessment', 'Get preliminary visual guidance and a safer manual recommendation.', '/assess', <Sparkles />],
    ['Reuse Marketplace', 'Browse prototype products made from refurbished and recovered materials.', '/shop', <ShoppingBag />],
    ['Responsible Recycling', 'Learn how to prepare unsafe or end-of-life electronics responsibly.', '/guide/recycle', <Recycle />],
    ['Environmental Impact', 'See how evidence-led activity could become measurable over time.', '/impact', <Leaf />],
  ] as const;
  const devices = [
    ['Smartphones', 'iPhone, Samsung, OnePlus and more', '/assess', <Smartphone />, categoryImages[1][2]],
    ['Laptops', 'Dell, HP, Lenovo, MacBook and more', '/assess', <Laptop />, categoryImages[0][2]],
    ['Tablets', 'iPad, Samsung, Lenovo and more', '/assess', <Tablet />, categoryImages[2][2]],
    ['Accessories', 'Headphones, chargers and keyboards', '/shop', <Headphones />, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80'],
  ] as const;
  const steps = [
    ['01', 'Select your device', 'Choose a category to begin.', '/assess', <Smartphone />],
    ['02', 'Provide details', 'Share its condition and history.', '/assess', <ClipboardIcon />],
    ['03', 'Get an assessment', 'Receive explainable next steps.', '/assess', <Sparkles />],
    ['04', 'Choose what is next', 'Repair, reuse, upcycle or recycle.', '/ideas', <Recycle />],
  ] as const;
  return <main className="home-page">
    <section className="hero-section"><div className="hero-copy"><p className="eyebrow">Recycle <span>•</span> Reuse <span>•</span> Resell <span>•</span> Make an impact</p><h1>Give your devices <em>a second life.</em></h1><p>PowerCycle helps you assess, recycle, resell or donate old electronics while making a more responsible next-step choice.</p><div className="actions"><Link className="button" to="/assess"><Sparkles size={17} /> Get started <ArrowRight size={15} /></Link><Link className="button secondary" to="/shop">Explore marketplace <ChevronRight size={16} /></Link></div><div className="trust-row"><span><Check size={15} /> Preliminary guidance only</span><span><Check size={15} /> Manual fallback available</span></div></div><div className="hero-art"><img src="https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1200&q=85" alt="Laptop and electronics ready for a second life" /><div className="hero-glow" /><div className="floating-stat"><Sparkles size={17} /><div><strong>AI-assisted</strong><small>Preliminary visual guidance</small></div></div></div></section>
    <section className="section-shell home-section"><div className="feature-grid">{features.map(([title, text, path, icon]) => <Link className="feature-card" to={path} key={title}><span className="feature-icon">{icon}</span><span><strong>{title}</strong><small>{text}</small></span><ChevronRight size={17} /></Link>)}</div></section>
    <section className="section-shell home-section"><div className="section-heading"><div><p className="eyebrow">Start with a category</p><h2>Popular device categories</h2><p>Choose a category to begin an assessment or explore the right next step.</p></div><Link to="/assess">View all devices <ChevronRight size={16} /></Link></div><div className="device-grid">{devices.map(([title, text, path, icon, image]) => <Link className="device-card" to={path} key={title}><img src={image} alt="" /><div><span className="device-icon">{icon}</span><strong>{title}</strong><small>{text}</small></div><ArrowRight size={16} /></Link>)}</div></section>
    <section className="section-shell home-section"><div className="section-heading"><div><p className="eyebrow">A simple, honest process</p><h2>How it works</h2><p>Move from uncertainty to a practical next step in four clear stages.</p></div></div><div className="process-grid">{steps.map(([number, title, text, path, icon], index) => <Link className="process-step" to={path} key={number}><span className="step-number">{number}</span><span className="step-icon">{icon}</span><span className="process-copy"><strong>{title}</strong><small>{text}</small></span>{index < steps.length - 1 && <ChevronRight className="process-arrow" size={21} />}</Link>)}</div></section>
    <section className="home-cta section-shell"><div><p className="eyebrow">Small choices add up</p><h2>Together for a <em>greener tomorrow.</em></h2><p>Every device you reuse or recycle is a chance to keep useful materials in circulation.</p></div><Link className="button" to="/assess">Start assessment <ArrowRight size={16} /></Link></section>
  </main>;
}

function ClipboardIcon() { return <Check size={18} />; }

function AssessPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<Recommendation | null>(null);
  const [ai, setAi] = useState<AiResult | null>(null);
  const [repairPlan, setRepairPlan] = useState<RepairPlan | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [aiConsent, setAiConsent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deviceType, setDeviceType] = useState('phone');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [ageRange, setAgeRange] = useState('unknown');
  const [condition, setCondition] = useState('working');
  const [problem, setProblem] = useState('none');
  const [currentStep, setCurrentStep] = useState(0);
  const [publishingIdea, setPublishingIdea] = useState(false);
  const [publishedIdeaId, setPublishedIdeaId] = useState('');
  const typeOptions = [['phone', 'Mobile', Smartphone], ['laptop', 'Laptop', Laptop], ['tablet', 'Tablet', Tablet], ['other', 'Other', PackageCheck]] as const;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (currentStep < 3) {
      if (currentStep === 0 && (!brand.trim() || !model.trim())) { setError('Please add the device brand and model before continuing.'); return; }
      setCurrentStep((step) => step + 1);
      return;
    }
    try { setResult(await api<Recommendation>('/assessments', { method: 'POST', body: JSON.stringify({ assessmentId: ai?.assessmentId, brand, modelName: model, deviceType, ageRange, condition, problems: [problem] }) })); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not assess this device.'); }
  }
  function goToStep(step: number) {
    if (step <= currentStep) setCurrentStep(step);
  }
  function selectImage(file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setError('Please upload a JPG, PNG, or WebP image under 5 MB.'); return; }
    setPreview(URL.createObjectURL(file)); setSelectedImage(file); setAi(null); setRepairPlan(null); setAiConsent(false); setError('');
  }
  async function analyseSelectedImage() {
    if (!user) { setError('Please sign in before using Gemini photo analysis.'); return; }
    if (!selectedImage) { setError('Choose a device photo before sending it to Gemini.'); return; }
    if (!aiConsent) { setError('Please consent before sending your photo to Gemini for visual analysis.'); return; }
    setUploading(true); setError('');
    const body = new FormData(); body.append('image', selectedImage); body.append('deviceType', deviceType); body.append('brand', brand); body.append('modelName', model); body.append('ageRange', ageRange); body.append('condition', condition); body.append('problem', problem); body.append('aiConsent', 'true');
    try { setAi(await api<AiResult>('/ai/analyse-device', { method: 'POST', body, headers: {} })); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Image analysis failed.'); } finally { setUploading(false); }
  }
  async function createRepairPlan() {
    const assessmentId = result?.id ?? ai?.assessmentId;
    if (!assessmentId) { setError('Save your assessment first, then create its repair plan.'); return; }
    setGeneratingPlan(true); setError('');
    try { setRepairPlan(await api<RepairPlan>(`/assessments/${assessmentId}/repair-plan`, { method: 'POST' })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Repair plan could not be generated.'); }
    finally { setGeneratingPlan(false); }
  }
  async function publishAsIdea() {
    if (!ai || ai.status !== 'analysed' || !selectedImage) { setError('Complete a Gemini photo analysis before publishing an idea.'); return; }
    setPublishingIdea(true);
    setError('');
    const title = `${brand || 'Device'} reuse solution`;
    const observations = ai.visibleObservations?.join(' ') || ai.message || 'Gemini provided preliminary visual guidance for this device.';
    const description = `A community reuse idea based on a ${brand || ''} ${model || deviceType} assessment. ${observations}`.trim().slice(0, 500);
    const stepDescription = `Review the device safely and follow the Gemini guidance: ${observations}`.slice(0, 300);
    const body = new FormData();
    body.append('title', title.slice(0, 100));
    body.append('shortDescription', description.length >= 20 ? description : `${description} See the assessment details before handling.`);
    body.append('deviceCategory', ['mobile', 'laptop', 'tablet'].includes(deviceType) ? deviceType : 'other');
    body.append('purposeCategory', 'useful_gadget');
    body.append('tags', 'gemini, device-assessment, reuse');
    body.append('status', 'published');
    body.append('steps', JSON.stringify([{ stepId: 'assessment-solution', title: 'Assessment-based solution', description: stepDescription }]));
    body.append('cover', selectedImage, selectedImage.name);
    body.append('step-assessment-solution', selectedImage, selectedImage.name);
    try {
      const saved = await api<{ id: string; status: string }>('/ideas', { method: 'POST', body, headers: {} });
      setPublishedIdeaId(saved.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The idea could not be published. Your assessment is still available.');
    } finally {
      setPublishingIdea(false);
    }
  }
  function clearUpload() {
    setPreview('');
    setSelectedImage(null);
    setAi(null);
    setRepairPlan(null);
    setAiConsent(false);
    setError('');
  }
  return <main className="assessment-page">
    <section className="assessment-hero"><div><p className="eyebrow">AI-powered device assessment</p><h1>Assess your <em>device.</em></h1><p>Get preliminary guidance about your electronics and choose a safer next step: repair, reuse, upcycle or recycle.</p></div><img src="https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=85" alt="Laptop and mobile devices ready for assessment" /></section>
    <div className="assessment-shell">
      <aside className="assessment-stepper"><p className="eyebrow">Your journey</p>{[['01', 'Device info', 'Select a device and add basic details.'], ['02', 'Condition', 'Tell us how it currently works.'], ['03', 'Additional details', 'Add a photo or known issues.'], ['04', 'Review', 'Check your details before continuing.']].map(([number, title, text], index) => <button className={`assessment-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'complete' : ''}`} type="button" key={number} onClick={() => goToStep(index)}><span>{index < currentStep ? '✓' : number}</span><div><strong>{title}</strong><small>{text}</small></div></button>)}<div className="assessment-help"><CircleHelp size={19} /><strong>Need help?</strong><small>Use our guide if you are unsure about a device.</small><Link className="button secondary" to="/guide/repair">View guide <ArrowRight size={14} /></Link></div></aside>
      <section className="assessment-form-panel"><div className="panel-kicker">Step {currentStep + 1} of 4</div><h2>{['Device information', 'Device condition', 'Additional details', 'Review assessment'][currentStep]}</h2><p className="panel-intro">{['Tell us a little about the device to get started.', 'Tell us how the device currently works.', 'Add known issues and optionally send a photo to Gemini.', 'Check your details before saving the assessment.'][currentStep]}</p><form onSubmit={submit}>
        {currentStep === 0 && <><fieldset className="device-type-grid"><legend>Device type</legend>{typeOptions.map(([value, label, Icon]) => <button className={deviceType === value ? 'device-type selected' : 'device-type'} type="button" key={value} onClick={() => setDeviceType(value)}><Icon size={22} /><span>{label}</span></button>)}</fieldset><div className="assessment-fields"><label>Brand<input value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="e.g. Apple, Dell, Samsung" required /></label><label>Model<input value={model} onChange={(event) => setModel(event.target.value)} placeholder="e.g. iPhone 12" required /></label></div></>}
        {currentStep === 1 && <div className="assessment-fields"><label>Approximate age<select value={ageRange} onChange={(event) => setAgeRange(event.target.value)}><option value="under-1">Under 1 year</option><option value="1-3">1–3 years</option><option value="3-5">3–5 years</option><option value="over-5">Over 5 years</option><option value="unknown">Unknown</option></select></label><label>Condition<select value={condition} onChange={(event) => setCondition(event.target.value)}><option value="working">Working well</option><option value="minor-issue">Minor issue</option><option value="major-issue">Major issue</option><option value="damaged">Physically damaged</option><option value="not-working">Not working</option><option value="unknown">Unknown</option></select></label></div>}
        {currentStep === 2 && <><div className="assessment-fields"><label>Storage (optional)<select><option>Not applicable</option><option>64 GB</option><option>128 GB</option><option>256 GB</option><option>512 GB</option><option>1 TB</option></select></label><label>RAM (optional)<select><option>Not applicable</option><option>4 GB</option><option>8 GB</option><option>16 GB</option><option>32 GB</option></select></label><label>Main problem<select value={problem} onChange={(event) => setProblem(event.target.value)}><option value="none">No issue</option><option value="battery">Battery</option><option value="screen">Screen</option><option value="charging">Charging</option><option value="sound">Sound</option><option value="performance">Performance</option><option value="missing-parts">Missing parts</option><option value="other">Other</option></select></label></div><div className="inline-ai-upload"><div><strong><Sparkles size={16} /> Gemini photo guidance</strong><small>{selectedImage ? 'Photo selected. Review the consent below before sending it.' : 'Upload a clear device photo for preliminary visual observations.'}</small></div><div className="inline-ai-actions"><label className="upload-trigger" htmlFor="device-image-upload"><Camera size={14} /> {preview ? 'Change photo' : 'Choose photo'}</label><button className="button ai-send-button" type="button" onClick={() => void analyseSelectedImage()} disabled={!selectedImage || !aiConsent || uploading}>{uploading ? 'Sending…' : 'Send to Gemini'} <ArrowRight size={14} /></button></div></div><label className="consent-row"><input type="checkbox" checked={aiConsent} onChange={(event) => setAiConsent(event.target.checked)} /> I agree to send this photo and the device details shown above to Google Gemini for preliminary visual analysis and save the photo plus result privately in my account activity.</label></>}
        {currentStep === 3 && <div className="assessment-review"><div><span>Device</span><strong>{brand} {model}</strong></div><div><span>Type and condition</span><strong>{deviceType} · {condition}</strong></div><div><span>Photo guidance</span><strong>{ai?.status === 'analysed' ? 'Gemini result ready' : 'No Gemini result submitted'}</strong></div></div>}
        <div className="assessment-actions"><button className="button secondary" type="button" onClick={() => currentStep === 0 ? window.history.back() : setCurrentStep((step) => step - 1)}><ArrowRight className="back-arrow" size={15} /> Back</button><button className="button" type="submit">{currentStep === 3 ? 'Save assessment' : 'Next step'} <ArrowRight size={15} /></button></div>
      </form></section>
      <aside className="assessment-side"><section className="selected-device"><div className="side-heading"><h2>Selected device</h2><Camera size={17} /></div><div className="selected-device-body">{preview ? <img src={preview} alt="Selected device preview" /> : <span className="device-placeholder"><Camera size={24} /></span>}<div><strong>{brand || 'Your brand'}</strong><b>{model || 'Your model'}</b><small>{deviceType === 'phone' ? 'Mobile phone' : deviceType === 'laptop' ? 'Laptop / computer' : deviceType === 'tablet' ? 'Tablet' : 'Other electronics'}</small></div></div></section><section className="benefits-panel"><h2>Why assess your device?</h2>{[['Get fair value', 'Understand what your device may be suitable for.', Recycle], ['AI-assisted analysis', 'Use a photo for preliminary visual guidance.', Sparkles], ['Eco-friendly decision', 'Choose a responsible next step for your electronics.', Leaf], ['Make an impact', 'Keep useful materials in circulation where possible.', Heart]].map(([title, text, Icon]) => <div className="benefit-item" key={title as string}><span><Icon size={17} /></span><div><strong>{title as string}</strong><small>{text as string}</small></div></div>)}</section><section className="upload-card assessment-upload"><div className="upload-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) selectImage(file); }}>{preview ? <img src={preview} alt="Selected device preview" /> : <><Upload size={28} /><strong>Upload a device photo</strong><span>Drag and drop or use the button below</span></>}<input id="device-image-upload" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) selectImage(file); }} aria-label="Upload device image" />{uploading && <span className="loading">Analysing securely…</span>}</div><div className="upload-actions"><label className="upload-trigger" htmlFor="device-image-upload"><Upload size={14} /> {preview ? 'Choose another photo' : 'Choose photo'}</label>{preview && <button className="text-button" type="button" onClick={clearUpload}>Remove</button>}</div><p className="privacy-note"><CircleHelp size={15} /> Photo and analysis are saved privately when you send it to Gemini.</p></section></aside>
    </div>
    {error && <p className="error assessment-error" role="alert">{error}</p>}{(ai || result) && <section className="assessment-result" aria-live="polite"><div className="result-heading"><div><p className="eyebrow">Assessment result</p><h2>What to do next</h2><p>Based only on the information and image you provided. This is not a certified diagnosis or guaranteed valuation.</p></div><Link className="button secondary" to="/assess">New assessment</Link></div><div className="result-columns">{result && <article className="result-card"><p className="eyebrow">Manual recommendation</p><h3>{result.recommendation}</h3><p>{result.reason}</p><h4>Next steps</h4><ul>{result.nextSteps.map((step) => <li key={step}>{step}</li>)}</ul>{result.safetyFlags.map((flag) => <p className="warning" key={flag}>{flag}</p>)}</article>}{ai && <article className="result-card ai-result"><p className="eyebrow">Gemini visual guidance</p><h3>{ai.status === 'analysed' ? `Looks like ${ai.deviceCategory ?? 'an electronic device'}` : 'AI unavailable'}</h3><p>{ai.message ?? 'Preliminary visual guidance only. A qualified inspection is required for diagnosis.'}</p>{ai.visibleObservations?.length ? <><h4>Visible observations</h4>{ai.visibleObservations.map((item) => <p key={item}><Check size={15} /> {item}</p>)}</> : null}{ai.possibleVisibleDamage?.length ? <><h4>Possible visible damage</h4>{ai.possibleVisibleDamage.map((item) => <p key={item}><CircleAlert size={15} /> {item}</p>)}</> : null}</article>}<article className="result-card result-actions"><p className="eyebrow">Available next actions</p><h3>Choose a safe path</h3>{(result?.id || ai?.assessmentId) && <button className="button full" type="button" onClick={() => void createRepairPlan()} disabled={generatingPlan}>{generatingPlan ? 'Creating 10 safe steps…' : 'Generate 10 repair / reuse steps'} <Wrench size={15} /></button>}{repairPlan && <><p>{repairPlan.safetyNote}</p><ol>{repairPlan.steps.map((step, index) => <li key={`${index}-${step.title}`}><strong>{step.title}</strong> — {step.description}</li>)}</ol><Link className="button secondary full" to="/ideas/create" state={{ assessmentPlan: { deviceType, brand, modelName: model, steps: repairPlan.steps } }}>Turn these steps into an Idea <Lightbulb size={15} /></Link></>}{ai?.status === 'analysed' && selectedImage && <>{publishedIdeaId ? <Link className="button full" to={`/ideas/${publishedIdeaId}`}>View published idea <ArrowRight size={15} /></Link> : <button className="button full" type="button" onClick={() => void publishAsIdea()} disabled={publishingIdea}>{publishingIdea ? 'Publishing idea…' : 'Publish this solution to Ideas'} <ArrowRight size={15} /></button>}<small className="publish-note">Share the uploaded photo and preliminary Gemini guidance publicly with other users.</small></>}<Link className="button secondary full" to="/ideas">Explore reuse ideas <ArrowRight size={15} /></Link><Link className="button secondary full" to="/collection">Ask about collection <Truck size={15} /></Link><Link className="button secondary full" to="/guide/recycle">View recycling guide <Recycle size={15} /></Link><p className="notice">Value estimate: unavailable. No live valuation service is connected.</p></article></div>{ai?.uncertainties?.length ? <div className="result-footnote"><strong>Uncertainties</strong>{ai.uncertainties.map((item) => <span key={item}>{item}</span>)}</div> : null}{ai?.safetyFlags?.length ? <div className="result-footnote result-safety"><strong>Safety flags</strong>{ai.safetyFlags.map((item) => <span key={item}>{item}</span>)}</div> : null}</section>}
    <section className="assessment-impact"><div><Leaf size={28} /><div><h2>Keep useful devices in circulation</h2><p>Understand the condition and choose a responsible next step.</p></div></div><span><Recycle size={18} /> Give devices a second life</span><span><Globe2 size={18} /> Build a greener tomorrow</span></section>
  </main>;
}

function IdeasPage() { const [ideas, setIdeas] = useState<Idea[]>([]); const [query, setQuery] = useState(''); const [error, setError] = useState(''); useEffect(() => { void api<Idea[]>('/ideas').then(setIdeas).catch((cause) => setError(cause instanceof Error ? cause.message : 'Ideas could not be loaded.')); }, []); const filtered = ideas.filter((idea) => `${idea.title} ${idea.description} ${idea.tags?.join(' ') ?? ''}`.toLowerCase().includes(query.toLowerCase())); return <main className="page-shell wide"><div className="page-title"><div><p className="eyebrow">Safe reuse library</p><h1>Ideas for a second life.</h1><p>Open any card for materials, safety checks and an illustrated step-by-step plan.</p></div><div className="ideas-heading-actions"><Search size={25} /><Link className="button" to="/ideas/create"><Sparkles size={15} /> Create an upcycle idea</Link></div></div><label className="search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ideas" /></label>{error && <p className="auth-error" role="alert">{error}</p>}<section className="card-grid idea-grid">{filtered.map((idea, index) => <Link className="card idea-card" to={`/ideas/${idea.slug}`} key={idea.slug}><div className="idea-image"><img src={idea.coverImage?.url ?? `https://images.unsplash.com/photo-${['1516321318423-f06f85e504b3','1581092921461-eab62e97a780','1545239351-1141bd82e8a6','1518005020951-eccb494ad742'][index % 4]}?auto=format&fit=crop&w=700&q=75`} alt="" /><span className="idea-difficulty">{idea.difficulty}</span></div><div className="idea-content"><h2>{idea.title}</h2><p>{idea.description}</p><span className="guide-link">Open guide <ArrowRight size={14} /></span></div></Link>)}</section></main>; }

function CreateIdeaPage() {
  const routerLocation = useLocation();
  const assessmentPlan = (routerLocation.state as { assessmentPlan?: { deviceType: string; brand: string; modelName: string; steps: Array<{ title: string; description: string }> } } | null)?.assessmentPlan;
  const [title, setTitle] = useState(assessmentPlan ? `${assessmentPlan.brand || 'Device'} safe repair plan` : '');
  const [device, setDevice] = useState(assessmentPlan?.deviceType === 'phone' ? 'mobile' : assessmentPlan?.deviceType ?? 'laptop');
  const [description, setDescription] = useState(assessmentPlan ? `A cautious repair or reuse plan for a ${assessmentPlan.brand} ${assessmentPlan.modelName}. These steps are preliminary guidance; stop and get qualified help if a safety risk appears.` : '');
  const [purpose, setPurpose] = useState('useful_gadget');
  const [tags, setTags] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState<File | undefined>();
  const [steps, setSteps] = useState<IdeaStepDraft[]>(assessmentPlan?.steps.map((step) => ({ id: crypto.randomUUID(), title: step.title, description: step.description, imageUrl: '', imageName: '' })) ?? [{ id: crypto.randomUUID(), title: '', description: '', imageUrl: '', imageName: '' }]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [readiness, setReadiness] = useState<{ ready: boolean; database: boolean; storage: boolean } | null>(null);
  useEffect(() => { void api<{ ready: boolean; database: boolean; storage: boolean }>('/ideas/readiness').then(setReadiness).catch(() => setReadiness(null)); }, []);

  function acceptImage(file: File, onAccepted: (url: string, name: string) => void) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setError('Use a JPG, PNG, or WebP image under 8 MB.');
      return;
    }
    setError('');
    onAccepted(URL.createObjectURL(file), file.name);
  }
  function updateStep(id: string, field: 'title' | 'description', value: string) {
    setSteps((items) => items.map((step) => step.id === id ? { ...step, [field]: value } : step));
  }
  function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= steps.length) return;
    setSteps((items) => { const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  }
  function validate() {
    if (title.trim().length < 4) return 'Add a project title with at least 4 characters.';
    if (description.trim().length < 20) return 'Add a short description with at least 20 characters.';
    if (!coverUrl) return 'Add a final-result image before previewing the project.';
    if (!steps.length || steps.some((step) => !step.title.trim() || step.description.trim().length < 10 || !step.imageUrl)) return 'Complete every step with a title, explanation, and image.';
    return '';
  }
  function preview() { const validationError = validate(); if (validationError) { setError(validationError); return; } setError(''); setPreviewOpen(true); }
  async function publish() {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setSubmitting(true); setError('');
    setSuccess('');
    try {
      const body = new FormData();
      body.append('title', title); body.append('shortDescription', description); body.append('deviceCategory', device); body.append('purposeCategory', purpose); body.append('tags', tags); body.append('status', 'published');
      body.append('steps', JSON.stringify(steps.map(({ id, title: stepTitle, description: stepDescription }) => ({ stepId: id, title: stepTitle, description: stepDescription }))));
      if (coverFile) body.append('cover', coverFile);
      steps.forEach((step) => { if (step.file) body.append(`step-${step.id}`, step.file); });
      const result = await api<{ id: string; status: string }>('/ideas', { method: 'POST', body });
      setSuccess(`Project published successfully. Reference: ${result.id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Project could not be published. Your form is preserved.'); }
    finally { setSubmitting(false); }
  }
  return <main className="create-idea-page page-shell wide"><div className="create-idea-heading"><div><p className="eyebrow">Share your creativity</p><h1>Create an <em>Upcycle Idea</em></h1><p>Show the world how you reuse old devices. Share your process, add images, and inspire others.</p></div><Link className="button secondary" to="/ideas">Cancel</Link></div><div className="idea-builder-grid"><section className="idea-builder-column"><div className="builder-card"><div className="builder-card-heading"><span>1</span><div><h2>Basic information</h2><p>Give your project a clear story.</p></div></div><label>Project title *<input maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Old laptop to smart home server" /><small>{title.length}/100</small></label><fieldset className="idea-device-options"><legend>Select device *</legend>{[['mobile', Smartphone, 'Mobile phone'], ['laptop', Laptop, 'Laptop'], ['tablet', Tablet, 'Tablet'], ['desktop', MonitorIcon, 'Desktop'], ['accessory', Headphones, 'Accessories'], ['other', PackageCheck, 'Other']].map(([value, Icon, label]) => <button type="button" className={device === value ? 'idea-device selected' : 'idea-device'} key={value as string} onClick={() => setDevice(value as string)}><Icon size={17} /><span>{label as string}</span></button>)}</fieldset><label>Short description *<textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Tell us what you are making and why…" /><small>{description.length}/500</small></label><label>Category / purpose *<select value={purpose} onChange={(event) => setPurpose(event.target.value)}><option value="home_decor">Home decor</option><option value="useful_gadget">Useful gadget</option><option value="learning">Learning project</option><option value="art_creative">Art & creative</option><option value="environmental_impact">Environmental impact</option><option value="other">Other</option></select></label><label>Tags <input maxLength={120} value={tags} onChange={(event) => setTags(event.target.value)} placeholder="e.g. laptop, reuse, beginner" /><small>Separate tags with commas.</small></label></div><div className="builder-card"><div className="builder-card-heading"><span>2</span><div><h2>Final result</h2><p>Add a clear image of your completed project.</p></div></div><label className="idea-upload">{coverUrl ? <img src={coverUrl} alt="Final result preview" /> : <><Upload size={28} /><strong>Click to upload final result image</strong><small>PNG, JPG, WebP · Max 8 MB</small></>}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) acceptImage(file, (url) => { setCoverUrl(url); setCoverFile(file); }); }} />{coverUrl && <button className="image-remove" type="button" onClick={(event) => { event.preventDefault(); setCoverUrl(''); setCoverFile(undefined); }}>Remove</button>}</label></div></section><section className="idea-builder-column"><div className="builder-card steps-builder"><div className="builder-card-heading"><span>3</span><div><h2>Step by step process</h2><p>Add an image and description for each step.</p></div></div>{steps.map((step, index) => <article className="idea-step-editor" key={step.id}><div className="step-editor-number">{index + 1}</div><div className="step-editor-fields"><div className="step-editor-actions"><button type="button" onClick={() => moveStep(index, -1)} disabled={index === 0} aria-label="Move step up">↑</button><button type="button" onClick={() => moveStep(index, 1)} disabled={index === steps.length - 1} aria-label="Move step down">↓</button><button type="button" onClick={() => setSteps((items) => items.length > 1 ? items.filter((item) => item.id !== step.id) : items)} aria-label="Remove step">×</button></div><label>Step title *<input maxLength={100} value={step.title} onChange={(event) => updateStep(step.id, 'title', event.target.value)} placeholder="e.g. Clean and prepare" /></label><label>What was done *<textarea maxLength={300} value={step.description} onChange={(event) => updateStep(step.id, 'description', event.target.value)} placeholder="Describe this step safely…" /><small>{step.description.length}/300</small></label><label className="step-image-upload">{step.imageUrl ? <img src={step.imageUrl} alt={`${step.title || 'Step'} preview`} /> : <><Upload size={19} /><span>Upload step image</span></>}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) acceptImage(file, (url, name) => setSteps((items) => items.map((item) => item.id === step.id ? { ...item, imageUrl: url, imageName: name, file } : item))); }} /></label></div></article>)}<button className="add-step-card" type="button" onClick={() => steps.length < 20 && setSteps((items) => [...items, { id: crypto.randomUUID(), title: '', description: '', imageUrl: '', imageName: '' }])} disabled={steps.length >= 20}><Sparkles size={18} /> Add another step <small>{steps.length}/20</small></button><p className="safety-note"><ShieldCheck size={16} /> Disconnect power first. Never open swollen batteries, mains-powered supplies, or damaged electronics; seek qualified help.</p></div></section><aside className="idea-preview-panel"><div className="preview-heading"><Eye size={18} /><div><h2>Live preview</h2><p>This is how your idea will look to readers.</p></div></div><div className="idea-preview-card">{coverUrl ? <img className="preview-cover" src={coverUrl} alt="Project final result" /> : <div className="preview-placeholder"><Upload size={24} /><span>Add a cover image</span></div>}<span className="preview-badge">{device}</span><h2>{title || 'Your project title'}</h2><p>{description || 'Your project description will appear here.'}</p><h3>Steps ({steps.length})</h3><div className="preview-step-list">{steps.map((step, index) => <div key={step.id}><span>{index + 1}</span>{step.imageUrl ? <img src={step.imageUrl} alt="" /> : <div className="preview-step-empty" />}<strong>{step.title || `Step ${index + 1}`}</strong></div>)}</div></div><button className="button preview-button" type="button" onClick={preview}><Eye size={15} /> Validate & preview</button><button className="button publish-button" type="button" onClick={() => void publish()} disabled={submitting}>{submitting ? 'Publishing…' : 'Publish project'} <ArrowRight size={15} /></button><p className="notice">{readiness?.ready ? 'Storage and database are ready.' : 'Publish will report any missing server configuration and keep your form data.'}</p></aside></div>{error && <p className="auth-error create-idea-error" role="alert"><CircleAlert size={16} /> {error}</p>}{success && <p className="success-message" role="status"><Check size={16} /> {success}</p>}{previewOpen && <div className="preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title"><div className="preview-modal-card"><button className="preview-close" type="button" onClick={() => setPreviewOpen(false)} aria-label="Close preview">×</button><p className="eyebrow">Reader preview</p><h2 id="preview-title">{title}</h2><p>{description}</p><div className="preview-modal-steps">{steps.map((step, index) => <article key={step.id}><span>{index + 1}</span>{step.imageUrl && <img src={step.imageUrl} alt="" />}<div><h3>{step.title}</h3><p>{step.description}</p></div></article>)}</div></div></div>}</main>;
}

function MonitorIcon() { return <Laptop size={17} />; }

function CreateListingPage() {
  const routerLocation = useLocation();
  const sourceIdea = (routerLocation.state as { sourceIdea?: Idea } | null)?.sourceIdea;
  const [form, setForm] = useState({ title: sourceIdea?.title ?? '', description: sourceIdea?.description ?? '', category: sourceIdea?.purposeCategory?.replaceAll('_', ' ') ?? 'home-decor', condition: 'upcycled', price: '', stock: '1', publicCity: '', publicState: '', contactPhone: '', showContactPhone: false, pickupAvailable: true, shippingAvailable: false });
  const [images, setImages] = useState<File[]>([]);
  const [preview, setPreview] = useState<string[]>([]);
  const [physicalItemConfirmed, setPhysicalItemConfirmed] = useState(false);
  const [createdListingId, setCreatedListingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  function update(field: string, value: string | boolean) { setForm((current) => ({ ...current, [field]: value })); }
  function selectImages(files: FileList | null) {
    const selected = Array.from(files ?? []);
    if (!selected.length || selected.length > 6 || selected.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024)) {
      setError('Choose 1–6 JPG, PNG, or WebP images under 8 MB each.'); return;
    }
    setImages(selected); setPreview(selected.map((file) => URL.createObjectURL(file))); setError('');
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('');
    if (!images.length) { setError('Add at least one product image.'); return; }
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!Number.isInteger(price) || price < 0 || !Number.isInteger(stock) || stock < 1) { setError('Enter a whole INR price and a stock quantity of at least 1.'); return; }
    setSaving(true);
    const body = new FormData();
    if (!physicalItemConfirmed) { setError('Confirm that the physical item is made or owned by you and available in the quantity entered.'); return; }
    body.append('title', form.title); body.append('description', form.description); body.append('category', form.category); body.append('condition', form.condition); body.append('pricePaise', String(price * 100)); body.append('stockQuantity', String(stock)); body.append('pickupAvailable', String(form.pickupAvailable)); body.append('shippingAvailable', String(form.shippingAvailable)); body.append('publicCity', form.publicCity); body.append('publicState', form.publicState); body.append('contactPhone', form.contactPhone); body.append('showContactPhone', String(form.showContactPhone)); if (sourceIdea?.slug) body.append('sourceIdeaId', sourceIdea.slug); images.forEach((image) => body.append('images', image, image.name));
    try { const result = await api<{ id: string }>('/marketplace/listings', { method: 'POST', body }); setCreatedListingId(result.id); setSuccess('Your physical product listing was published. Buyers can send a request to buy.'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Listing could not be saved. Your form is preserved.'); } finally { setSaving(false); }
  }
  return <main className="page-shell wide listing-create-page"><div className="page-title"><div><p className="eyebrow">Sell responsibly</p><h1>List a product.</h1><p>Only list a physical product you actually made or own. Payments and delivery are not handled by PowerCycle; buyers can send a request and arrange fulfilment independently.</p></div><Link className="button secondary" to="/marketplace">Cancel</Link></div>{sourceIdea && <p className="notice">Prefilled from your idea "{sourceIdea.title}". Add real product photos and confirm you made the physical item.</p>}{createdListingId && <p className="auth-success" role="status"><Check size={16} /> {success} <Link to={`/shop/${createdListingId}`}>View listing</Link> · <Link to="/my-listings">Manage listings</Link></p>}<form className="listing-form-card" onSubmit={submit}><div className="listing-form-grid"><div><label>Product title *<input required maxLength={120} value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="e.g. Upcycled keyboard wall art" /></label><label>Description *<textarea required minLength={20} maxLength={2000} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Explain what the buyer receives and how it was made." /></label><div className="form-row two"><label>Category *<input required value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="Home decor" /></label><label>Condition *<select value={form.condition} onChange={(event) => update('condition', event.target.value)}><option value="upcycled">New upcycled</option><option value="refurbished">Refurbished</option><option value="used_reusable">Used / reusable</option></select></label></div><div className="form-row two"><label>Price (INR) *<input required type="number" min="0" step="1" value={form.price} onChange={(event) => update('price', event.target.value)} /></label><label>Stock quantity *<input required type="number" min="1" step="1" value={form.stock} onChange={(event) => update('stock', event.target.value)} /></label></div></div><div><label>Product photos *<span className="listing-image-picker">{preview.length ? <div className="listing-image-previews">{preview.map((url) => <img src={url} alt="" key={url} />)}</div> : <><Upload size={24} /><span>Choose 1–6 images</span></>}<input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => selectImages(event.target.files)} /></span></label><div className="form-row two"><label>Public city<input maxLength={80} value={form.publicCity} onChange={(event) => update('publicCity', event.target.value)} placeholder="City only" /></label><label>Public state<input maxLength={80} value={form.publicState} onChange={(event) => update('publicState', event.target.value)} placeholder="State only" /></label></div><label>Contact phone (India)<input type="tel" maxLength={20} value={form.contactPhone} onChange={(event) => update("contactPhone", event.target.value)} placeholder="+91 98765 43210" /></label><label className="consent-row"><input type="checkbox" checked={form.showContactPhone} onChange={(event) => update("showContactPhone", event.target.checked)} /> Show this phone number publicly on the listing so buyers can contact me directly.</label><label className="consent-row"><input type="checkbox" checked={form.pickupAvailable} onChange={(event) => update('pickupAvailable', event.target.checked)} /> Local pickup available</label><label className="consent-row"><input type="checkbox" checked={form.shippingAvailable} onChange={(event) => update('shippingAvailable', event.target.checked)} /> Delivery can be discussed manually</label><label className="consent-row"><input required type="checkbox" checked={physicalItemConfirmed} onChange={(event) => setPhysicalItemConfirmed(event.target.checked)} /> I made or own this physical product and have the available quantity entered above.</label><p className="notice">Do not enter a home address here. PowerCycle does not take payment, arrange shipping, or provide buyer protection.</p></div></div>{error && <p className="auth-error" role="alert"><CircleAlert size={16} /> {error}</p>}{success && !createdListingId && <p className="auth-success" role="status"><Check size={16} /> {success}</p>}<button className="button" type="submit" disabled={saving}>{saving ? 'Saving listing…' : 'Publish listing'} <ArrowRight size={15} /></button></form></main>;
}

function MyListingsPage() {
  type SellerListing = { id: string; title: string; description: string; category: string; condition: string; priceInr: number; stockQuantity: number; status: 'active' | 'paused' | 'sold_out'; createdAt: string; images: Array<{ url: string }> };
  type SellerRequest = { id: string; listingTitle: string; quantity: number; unitPriceInr: number; message: string; status: string; createdAt: string; role: string; buyerEmail?: string; buyerPhone?: string };
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  async function load() {
    setLoading(true); setError('');
    try {
      const [sellerListings, marketplaceRequests] = await Promise.all([api<SellerListing[]>('/marketplace/listings/me'), api<SellerRequest[]>('/marketplace/requests/me')]);
      setListings(sellerListings); setRequests(marketplaceRequests.filter((request) => request.role === 'seller'));
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Your listings could not be loaded.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function changeStatus(listing: SellerListing, status: SellerListing['status'] | 'removed') {
    setBusyId(listing.id); setError('');
    try {
      if (status === 'removed') await api(`/marketplace/listings/${listing.id}`, { method: 'DELETE' });
      else await api(`/marketplace/listings/${listing.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The listing could not be updated.'); }
    finally { setBusyId(''); }
  }
  async function handleRequest(requestId: string, status: 'accepted' | 'declined') {
    setBusyId(requestId); setError('');
    try { await api(`/marketplace/requests/${requestId}`, { method: 'PATCH', body: JSON.stringify({ status }) }); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The request could not be updated.'); }
    finally { setBusyId(''); }
  }
  return <main className="page-shell wide"><div className="page-title"><div><p className="eyebrow">Seller workspace</p><h1>My listings.</h1><p>Manage item availability and buyer requests. Accepting reserves the requested quantity; payment and delivery remain independent.</p></div><Link className="button" to="/marketplace/create"><Sparkles size={15} /> List a product</Link></div>{error && <p className="auth-error" role="alert"><CircleAlert size={16} /> {error} <button className="button secondary" type="button" onClick={() => void load()}>Try again</button></p>}{loading ? <section className="marketplace-state"><RefreshCw className="spin" size={24} /><h2>Loading your listings…</h2></section> : listings.length === 0 ? <section className="marketplace-state"><ShoppingBag size={28} /><h2>No listings yet</h2><p>Publish a physical item you own or made from recovered material.</p><Link className="button" to="/marketplace/create">Create your first listing</Link></section> : <section className="card-grid product-grid">{listings.map((listing) => <article className="card product-card" key={listing.id}><Link className="product-detail-link" to={`/shop/${listing.id}`}><div className="product-image"><img src={listing.images[0]?.url ?? productImages['electronic-parts-desk-organizer']} alt={listing.title} /><span className="badge">{listing.status.replace('_', ' ')}</span></div><div className="product-content"><h2>{listing.title}</h2><p>{listing.description}</p><small>{listing.stockQuantity} listed · {listing.condition.replaceAll('_', ' ')}</small></div></Link><div className="product-footer"><strong>{money.format(listing.priceInr)}</strong><div className="actions"><button className="button secondary" type="button" disabled={busyId === listing.id || listing.status === 'sold_out'} onClick={() => void changeStatus(listing, listing.status === 'active' ? 'paused' : 'active')}>{busyId === listing.id ? 'Saving…' : listing.status === 'active' ? 'Pause' : 'Resume'}</button><button className="button secondary" type="button" disabled={busyId === listing.id || listing.status === 'sold_out'} onClick={() => void changeStatus(listing, 'sold_out')}>Mark sold</button><button className="button danger" type="button" disabled={busyId === listing.id} onClick={() => { if (window.confirm(`Remove "${listing.title}" from your listings?`)) void changeStatus(listing, 'removed'); }}>Remove</button></div></div></article>)}</section>}<section className="activity-dashboard-panel seller-requests"><div className="panel-heading"><div><p className="eyebrow">Marketplace requests</p><h2>Requests on your listings</h2></div></div>{requests.filter((request) => request.status === 'requested' || request.status === 'accepted').length ? requests.filter((request) => request.status === 'requested' || request.status === 'accepted').map((request) => <article className="activity-record" key={request.id}><div><span className="badge">{request.status}</span><h3>{request.listingTitle} · {request.quantity} requested</h3><p>{request.message || 'No message included.'}</p>{request.buyerEmail && <p>Buyer account email: <a href={`mailto:${request.buyerEmail}`}>{request.buyerEmail}</a></p>}{request.buyerPhone && <p>Buyer phone (shared after acceptance): <a href={`tel:${request.buyerPhone}`}>{request.buyerPhone}</a></p>}{request.status === 'accepted' && <small>Payment and fulfilment are not handled by PowerCycle.</small>}</div>{request.status === 'requested' ? <div className="actions"><button className="button" type="button" disabled={busyId === request.id} onClick={() => void handleRequest(request.id, 'accepted')}>Accept</button><button className="button secondary" type="button" disabled={busyId === request.id} onClick={() => void handleRequest(request.id, 'declined')}>Decline</button></div> : null}</article>) : <div className="activity-empty"><p>No pending marketplace requests.</p></div>}</section></main>;
}

function ShopPage({ addToCart }: { addToCart: (product: Product) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('featured');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const categories = useMemo(() => ['all', ...Array.from(new Set(products.map((product) => product.category)))], [products]);
  async function loadProducts() {
    setLoading(true); setError('');
    try {
      const [catalog, listings] = await Promise.all([api<Product[]>('/products'), api<Array<{ id: string; title: string; description: string; category: string; condition: string; priceInr: number; images: Array<{ url: string }>; stockQuantity: number; publicCity?: string; publicState?: string; createdAt: string }>>('/marketplace/listings')]);
      setProducts([...listings.map((listing) => ({ slug: listing.id, name: listing.title, description: listing.description, priceInr: listing.priceInr, category: listing.category, sourceMaterial: 'Seller-provided listing', conditionNote: 'Seller-provided condition; inspect details and confirm fulfilment with the seller.', isDemo: false, isCommunityListing: true, condition: listing.condition, publicCity: listing.publicCity, publicState: listing.publicState, createdAt: listing.createdAt, imageUrl: listing.images[0]?.url, stockQuantity: listing.stockQuantity })), ...catalog]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Marketplace listings could not be loaded.'); } finally { setLoading(false); }
  }
  useEffect(() => { void loadProducts(); }, []);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const min = minPrice === '' ? 0 : Number(minPrice);
    const max = maxPrice === '' ? Number.POSITIVE_INFINITY : Number(maxPrice);
    const next = products.filter((product) => {
      const matchesText = `${product.name} ${product.description} ${product.category} ${product.sourceMaterial}`.toLowerCase().includes(term);
      return matchesText && (category === 'all' || product.category === category) && product.priceInr >= min && product.priceInr <= max;
    });
    return sort === 'featured' ? next : [...next].sort((a, b) => sort === 'price-low' ? a.priceInr - b.priceInr : sort === 'price-high' ? b.priceInr - a.priceInr : a.name.localeCompare(b.name));
  }, [category, maxPrice, minPrice, products, query, sort]);
  function clearFilters() { setQuery(''); setCategory('all'); setSort('featured'); setMinPrice(''); setMaxPrice(''); }
  return <main className="marketplace-page page-shell wide">
    <section className="marketplace-hero"><div><p className="eyebrow">PowerCycle marketplace · community listings</p><h1>Give devices a <em>second life.</em></h1><p>Discover reusable and refurbished electronics, explore their material story, and choose what fits your next project.</p><Link className="button" to="/marketplace/create"><Sparkles size={16} /> List your product</Link></div><div className="marketplace-hero-art"><img src={productImages['refurbished-bluetooth-speaker']} alt="Refurbished speaker in the PowerCycle marketplace" /><span><Recycle size={16} /> Demo catalog and community listings</span></div></section>
    <section className="marketplace-controls"><label className="marketplace-search"><Search size={17} /><span className="sr-only">Search marketplace</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, materials or categories" /></label><label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option value={item} key={item}>{item === 'all' ? 'All categories' : item}</option>)}</select></label><label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name</option></select></label><label><span>Min price</span><input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="₹0" /></label><label><span>Max price</span><input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="No limit" /></label><button className="clear-filters" type="button" onClick={clearFilters}>Clear filters</button></section>
    {loading && <section className="marketplace-state"><RefreshCw className="spin" size={24} /><h2>Loading marketplace listings…</h2><p>Fetching the current catalog from the PowerCycle API.</p></section>}
    {!loading && error && <section className="marketplace-state"><CircleAlert size={26} /><h2>Marketplace unavailable</h2><p>{error}</p><button className="button" type="button" onClick={() => void loadProducts()}>Try again <RefreshCw size={15} /></button></section>}
    {!loading && !error && <><div className="marketplace-summary"><strong>{filtered.length} {filtered.length === 1 ? 'listing' : 'listings'}</strong><span>Community sellers set their own availability; PowerCycle does not process payment or arrange delivery.</span></div>{filtered.length ? <section className="card-grid product-grid marketplace-grid">{filtered.map((product) => <article className="card product-card" key={product.slug}><Link className="product-detail-link" to={`/shop/${product.slug}`}><div className="product-image"><img src={product.imageUrl ?? productImages[product.slug]} alt={product.name} /><span className="badge">{product.isCommunityListing ? 'Community listing' : 'Prototype catalog'}</span></div><div className="product-content"><span className="marketplace-category">{product.category}</span><h2>{product.name}</h2><p>{product.description}</p><small>{product.sourceMaterial}</small></div></Link><div className="product-footer"><strong>{money.format(product.priceInr)} <small>{product.isCommunityListing ? 'Seller asking price' : 'Prototype Price'}</small></strong>{product.isCommunityListing ? <Link className="button full" to={`/shop/${product.slug}`}><Eye size={15} /> View listing</Link> : <button className="button full" type="button" onClick={() => addToCart(product)}><ShoppingBag size={15} /> Add to demo cart</button>}</div></article>)}</section> : <section className="marketplace-state"><Search size={26} /><h2>No listings match those filters</h2><p>Try a broader search or clear the filters.</p><button className="button secondary" type="button" onClick={clearFilters}>Clear filters</button></section>}</>}
  </main>;
}

function CartPage({ cart, changeQuantity }: { cart: Product[]; changeQuantity: (slug: string, amount: number) => void }) { const counts = useMemo(() => cart.reduce<Record<string, number>>((all, item) => ({ ...all, [item.slug]: (all[item.slug] ?? 0) + 1 }), {}), [cart]); const subtotal = cart.reduce((sum, item) => sum + item.priceInr, 0); return <main className="page-shell"><p className="eyebrow">Demo checkout</p><h1>Your cart</h1>{cart.length === 0 ? <div className="empty-state"><ShoppingBag size={30} /><p>Your demo cart is empty.</p><Link className="button" to="/shop">Explore shop</Link></div> : <><section className="cart-list">{Object.entries(counts).map(([slug, count]) => { const item = cart.find((product) => product.slug === slug)!; return <article key={slug}><div><h2>{item.name}</h2><p>{money.format(item.priceInr)} each</p></div><div><button type="button" onClick={() => changeQuantity(slug, -1)} aria-label={`Remove one ${item.name}`}>−</button><span>{count}</span><button type="button" onClick={() => changeQuantity(slug, 1)} aria-label={`Add one ${item.name}`}>+</button></div></article>; })}</section><h2>Subtotal: {money.format(subtotal)}</h2><p className="notice">Demo order only. No payment will be collected and no product will be shipped.</p></>}</main>; }

const guideSteps: Array<[string, string, React.ElementType, string]> = [
  ['Check the item', 'Only use clean, unplugged, non-powered parts. Stop if you see swelling, heat, corrosion or exposed mains wiring.', Eye, 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=500&q=75'],
  ['Choose a safe space', 'Work on a bright, dry table with ventilation. Keep children, pets and drinks away from the work area.', ShieldCheck, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=75'],
  ['Gather your tools', 'Prepare gloves, a soft cloth, labels, craft adhesive and a stable work surface. Do not open batteries or power supplies.', Wrench, 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=500&q=75'],
  ['Disconnect power', 'Remove cables, chargers and removable batteries. Never cut a cable or work on a plugged-in device.', Zap, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=500&q=75'],
  ['Sort the parts', 'Separate plastic, metal, cables and non-powered components. Keep hazardous or unknown parts aside for professional recycling.', Recycle, 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=500&q=75'],
  ['Clean gently', 'Wipe surfaces with a dry or lightly damp cloth. Do not pour liquid into ports, vents or circuit boards.', Hand, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=75'],
  ['Measure and plan', 'Place the pieces without adhesive first. Check proportions, balance and access to any moving or removable part.', Ruler, 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=500&q=75'],
  ['Assemble carefully', 'Join only safe, non-powered pieces. Use small amounts of adhesive and protect sharp edges before continuing.', Scissors, 'https://images.unsplash.com/photo-1528459105426-b9548367069b?auto=format&fit=crop&w=500&q=75'],
  ['Add your design', 'Label the object, choose a finish and add colour or decoration without blocking ventilation or creating a heat risk.', Palette, 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=500&q=75'],
  ['Test and share', 'Check stability by hand, keep the finished object away from heat and moisture, then share its material story.', TestTube, 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=500&q=75'],
];

function GuidePage({ title, image, description, category, action, steps = guideSteps.map(([step, text, Icon, stepImage]) => ({ title: step as string, description: text as string, image: { url: stepImage as string }, icon: Icon })) }: { title: string; image: string; description: string; category: string; action?: React.ReactNode; steps?: Array<IdeaStep & { icon?: React.ElementType }> }) {
  const [completed, setCompleted] = useState<number[]>([]);
  return <main className="page-shell wide"><Link className="back-link" to={category === 'idea' ? '/ideas' : '/'}>← Back to {category === 'idea' ? 'ideas' : 'ways to help'}</Link><section className="guide-hero"><div><p className="eyebrow">{category === 'idea' ? 'Build guide' : 'Decision guide'}</p><h1>{title}</h1><p>{description}</p><div className="guide-meta"><span><ShieldCheck size={16} /> Safety-led</span><span><BarChart3 size={16} /> {steps.length} step{steps.length === 1 ? '' : 's'}</span></div></div><img src={image} alt="" /></section>{action && <div className="guide-page-action">{action}</div>}<section className="guide-layout"><div><div className="guide-section-heading"><div><p className="eyebrow">Follow along</p><h2>How to do it</h2></div><span className="guide-progress">{completed.length} / {steps.length} complete</span></div><div className="step-list">{steps.map((step, index) => { const Icon = step.icon ?? Check; const isComplete = completed.includes(index); return <article className={`step-card ${isComplete ? 'is-complete' : ''}`} key={step.id ?? `${step.title}-${index}`}><div className="step-number">{String(index + 1).padStart(2, '0')}</div><div className="step-visual"><img src={step.image?.url ?? image} alt="" /><span className="step-icon"><Icon size={18} /></span></div><div className="step-copy"><h3>{step.title}</h3><p>{step.description}</p><button className="step-tip step-complete-toggle" type="button" aria-pressed={isComplete} onClick={() => setCompleted((current) => isComplete ? current.filter((item) => item !== index) : [...current, index])}><Check size={14} /> {isComplete ? 'Marked complete · undo' : 'Mark this step complete'}</button></div></article>; })}</div></div><aside className="guide-aside"><CircleAlert size={24} /><h2>Safety checkpoint</h2><p>Never dismantle batteries, CRT displays, chargers, power supplies or mains-powered devices. Choose professional recycling if the device is damaged.</p><Link className="button secondary" to="/assess">Assess your device</Link></aside></section></main>;
}

function IdeaDetailPage() { const { slug = '' } = useParams(); const [idea, setIdea] = useState<Idea | null>(null); const [error, setError] = useState(''); useEffect(() => { void api<Idea>(`/ideas/${slug}`).then(setIdea).catch((cause) => setError(cause instanceof Error ? cause.message : 'Idea could not be loaded.')); }, [slug]); if (error) return <main className="page-shell"><p className="auth-error" role="alert">{error}</p><Link className="button" to="/ideas">Back to ideas</Link></main>; if (!idea) return <main className="page-shell"><p>Loading idea...</p></main>; const image = idea.coverImage?.url ?? `https://images.unsplash.com/photo-${slug.includes('cd') ? '1528459105426-b9548367069b' : slug.includes('cable') ? '1558618666-fcd25c85cd64' : '1516321318423-f06f85e504b3'}?auto=format&fit=crop&w=1200&q=80`; const action = idea.isOwner ? <div className="notice"><p>Made the physical item from this idea? Review its details, add your own product photos, and confirm quantity before listing it.</p><Link className="button" to="/marketplace/create" state={{ sourceIdea: idea }}>List this physical item <ArrowRight size={15} /></Link></div> : undefined; return <GuidePage title={idea.title} image={image} description={idea.description} category="idea" action={action} steps={idea.steps} />; }

function ProductDetailPage({ addToCart }: { addToCart: (product: Product) => void }) {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestMessage, setRequestMessage] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [shareBuyerPhone, setShareBuyerPhone] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      if (!slug) return;
      setProduct(null); setError('');
      try {
        const listing = await api<{ id: string; title: string; description: string; category: string; condition: string; priceInr: number; stockQuantity: number; images: Array<{ url: string }>; publicCity?: string; publicState?: string; sellerPhone?: string; createdAt: string }>(`/marketplace/listings/${slug}`);
        if (active) setProduct({ slug: listing.id, name: listing.title, description: listing.description, category: listing.category, condition: listing.condition, priceInr: listing.priceInr, stockQuantity: listing.stockQuantity, imageUrl: listing.images[0]?.url, publicCity: listing.publicCity, publicState: listing.publicState, sellerPhone: listing.sellerPhone, createdAt: listing.createdAt, sourceMaterial: 'Seller-provided listing', conditionNote: 'Condition is seller-provided. Ask questions and inspect the item before arranging an exchange.', isCommunityListing: true, isDemo: false });
      } catch {
        try { const catalogItem = await api<Product>(`/products/${slug}`); if (active) setProduct(catalogItem); }
        catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'This listing could not be loaded.'); }
      }
    }
    void load();
    return () => { active = false; };
  }, [slug]);
  if (error) return <main className="page-shell"><p className="auth-error" role="alert">{error}</p><Link className="button" to="/marketplace">Back to marketplace</Link></main>;
  if (!product) return <main className="page-shell"><p className="eyebrow">Marketplace</p><h1>Loading listing…</h1></main>;
  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setRequesting(true); setError(''); setRequestSent(false);
    try { await api('/marketplace/requests', { method: 'POST', body: JSON.stringify({ listingId: slug, quantity: requestQuantity, message: requestMessage, buyerPhone, sharePhoneWithSeller: shareBuyerPhone }) }); setRequestSent(true); setRequestMessage(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Your request could not be sent.'); }
    finally { setRequesting(false); }
  }
  return <main className="page-shell wide"><Link className="back-link" to="/marketplace">← Back to marketplace</Link><section className="product-detail amazon-detail"><div className="product-gallery"><img src={product.imageUrl ?? productImages[product.slug] ?? productImages['electronic-parts-desk-organizer']} alt={product.name} /><span className="badge">{product.isCommunityListing ? 'Community seller' : 'Prototype catalog'}</span></div><div className="product-summary"><p className="eyebrow">{product.category}</p><h1>{product.name}</h1><p>{product.description}</p><div className="detail-specs"><span><ShieldCheck size={16} /> {product.conditionNote}</span><span><Heart size={16} /> {product.isCommunityListing ? `Condition: ${product.condition?.replaceAll('_', ' ') ?? 'Seller listed'}` : product.sourceMaterial}</span>{product.isCommunityListing && <span><MapPin size={16} /> {[product.publicCity, product.publicState].filter(Boolean).join(', ') || 'Location not provided'}</span>}</div>{product.isCommunityListing && product.sellerPhone && <p className="seller-contact">Seller chose to show this number: <a href={`tel:${product.sellerPhone}`}>{product.sellerPhone}</a></p>}<strong className="detail-price">{money.format(product.priceInr)} <small>{product.isCommunityListing ? 'Seller asking price' : 'Prototype Price'}</small></strong>{product.isCommunityListing ? <><p>Available quantity listed: {product.stockQuantity}. Send a request to the seller; the seller must accept before quantity is reserved. Payment and fulfilment are arranged independently.</p><form className="request-to-buy" onSubmit={(event) => void submitRequest(event)}><label>Your phone number<input required type="tel" maxLength={20} value={buyerPhone} onChange={(event) => setBuyerPhone(event.target.value)} placeholder="+91 98765 43210" /></label><label className="consent-row"><input required type="checkbox" checked={shareBuyerPhone} onChange={(event) => setShareBuyerPhone(event.target.checked)} /> Share my phone number with this seller if they accept my request.</label><label>Quantity<input type="number" min="1" max={product.stockQuantity ?? 1} value={requestQuantity} onChange={(event) => setRequestQuantity(Math.max(1, Math.min(Number(product.stockQuantity ?? 1), Number(event.target.value))))} /></label><label>Message to seller (optional)<textarea maxLength={1000} value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} placeholder="Ask a question or suggest how to coordinate." /></label>{error && <p className="auth-error" role="alert">{error}</p>}{requestSent && <p className="auth-success" role="status">Request sent. Track the response in My Activity.</p>}<button className="button" type="submit" disabled={requesting || requestSent}>{requesting ? 'Sending request…' : requestSent ? 'Request sent' : 'Request to buy'} <ArrowRight size={15} /></button></form><p className="notice">PowerCycle does not hold the item, verify the seller, take payment, arrange delivery, or provide buyer protection.</p></> : <><div className="detail-actions"><button className="button" type="button" onClick={() => addToCart(product)}><ShoppingBag size={16} /> Add to demo cart</button><Link className="button secondary" to="/assess">Assess your device</Link></div><p className="notice">Prototype catalog item only. No payment, shipping, warranty or real inventory is provided.</p></>}</div></section><section className="product-info-grid"><div className="spec-card"><div className="panel-heading"><ShieldCheck size={19} /><h2>Listing details</h2></div><dl><div><dt>Category</dt><dd>{product.category}</dd></div><div><dt>Condition</dt><dd>{product.condition?.replaceAll('_', ' ') ?? product.conditionNote}</dd></div><div><dt>Fulfilment</dt><dd>{product.isCommunityListing ? 'Discuss independently with the seller' : 'Not available in prototype'}</dd></div><div><dt>Payment & warranty</dt><dd>Not handled by PowerCycle</dd></div></dl></div></section></main>;
}

function StaticPage({ title, children }: { title: string; children: React.ReactNode }) { return <main className="page-shell"><p className="eyebrow">PowerCycle</p><h1>{title}</h1>{children}</main>; }

function AboutPage() { const values = [['01', 'Keep it useful', 'Repair and reuse come before disposal wherever it is safe.'], ['02', 'Make it clear', 'Every recommendation explains what we know and what to do next.'], ['03', 'Handle it safely', 'Damaged batteries and unknown electronics need careful handling.']]; return <main><section className="story-hero page-shell wide"><div><p className="eyebrow">Our mission</p><h1>Technology should not become waste by default.</h1><p>PowerCycle helps people make a confident next-step choice for old electronics: repair it, pass it on, turn it into something useful, or recycle it responsibly.</p><Link className="button" to="/assess">Start with an assessment <ArrowRight size={16} /></Link></div><img src={categoryImages[2][2]} alt="Hands working with electronics" /></section><section className="section-shell"><div className="value-grid">{values.map(([number, title, text]) => <article className="value-card" key={number}><strong>{number}</strong><h2>{title}</h2><p>{text}</p></article>)}</div><section className="about-impact-card"><div className="about-impact-heading"><div><p className="eyebrow">What PowerCycle can measure</p><h2>Big ambition. Honest measurement.</h2><p>Your account shows only saved activity. Environmental outcomes stay unmeasured until there is evidence to support them.</p></div><BarChart3 size={28} /></div><div className="about-stat-grid"><article><strong>Recorded</strong><span>Assessments, ideas and requests saved to your account.</span><small>Counted from database records</small></article><article><strong>Pending</strong><span>Collection requests awaiting a real service review.</span><small>Not a confirmed pickup</small></article><article><strong>Not measured</strong><span>Carbon, weight and diversion outcomes.</span><small>No verified source data yet</small></article><article><strong>Prototype</strong><span>Catalog prices are examples; no goods are fulfilled.</span><small>No payment or shipment</small></article></div><div className="about-quote"><Heart size={22} /><blockquote>"The most sustainable device is often the one we choose to understand before we replace."</blockquote><cite>— PowerCycle design principle</cite></div></section><div className="notice"><ShieldCheck size={18} /><span>PowerCycle provides guidance and records user activity. It does not certify devices, promise pickup, or represent a recycler partner.</span></div></section></main>; }

function CollectionPage() {
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', deviceCategory: 'phone', itemCount: 1, address: '', city: '', state: '', pinCode: '', preferredDate: '', timeSlot: 'morning', notes: '', consent: false });
  const [submitted, setSubmitted] = useState<{ requestId: string; message: string } | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const update = (field: string, value: string | number | boolean) => setForm((current) => ({ ...current, [field]: value }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSubmitted(null); setSubmitting(true);
    try { setSubmitted(await api<{ requestId: string; message: string }>('/collection-requests', { method: 'POST', body: JSON.stringify(form) })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The collection request could not be submitted.'); }
    finally { setSubmitting(false); }
  }
  return <main className="collection-page page-shell wide"><section className="collection-hero"><div><p className="eyebrow">Responsible disposal, made easy</p><h1>Schedule an <em>e-waste pickup.</em></h1><p>Tell us what you need collected and choose a preferred pickup option.</p></div><div className="collection-steps"><span className="is-current"><b>1</b>Device details</span><i /><span><b>2</b>Pickup details</span><i /><span><b>3</b>Review</span></div></section><div className="collection-layout"><section className="collection-card"><div className="collection-card-title"><span className="collection-icon"><PackageCheck size={22} /></span><div><h2>Collection request form</h2><p>Provide the details below to request a review.</p></div></div>{error && <p className="auth-error" role="alert"><CircleAlert size={16} /> {error}</p>}{submitted && <p className="auth-success" role="status"><Check size={16} /> {submitted.message} Request ID: {submitted.requestId}</p>}<form className="collection-form" onSubmit={submit}><div className="form-row three"><label>Full name *<input required value={form.fullName} onChange={(event) => update('fullName', event.target.value)} placeholder="Enter your full name" /></label><label>Phone number *<input required value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="Enter your phone number" /></label><label>Email address *<input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="Enter your email address" /></label></div><div className="form-row device-row"><label>Device category *<select required value={form.deviceCategory} onChange={(event) => update('deviceCategory', event.target.value)}><option value="phone">Mobile phone</option><option value="tablet">Tablet</option><option value="laptop">Laptop / computer</option><option value="monitor">Monitor</option><option value="speaker">Speaker</option><option value="charger">Charger / power bank</option><option value="keyboard">Keyboard</option><option value="appliance">Appliance</option><option value="other">Other electronics</option></select></label><label>Number of items *<span className="stepper"><button type="button" onClick={() => update('itemCount', Math.max(1, form.itemCount - 1))}>−</button><output>{form.itemCount}</output><button type="button" onClick={() => update('itemCount', Math.min(50, form.itemCount + 1))}>+</button></span></label></div><label>Pickup address *<input required value={form.address} onChange={(event) => update('address', event.target.value)} placeholder="House/Flat No., Street, Area" /></label><div className="form-row three"><label>City *<input required value={form.city} onChange={(event) => update('city', event.target.value)} placeholder="Enter city" /></label><label>State *<input required value={form.state} onChange={(event) => update('state', event.target.value)} placeholder="Enter state" /></label><label>PIN code *<input required value={form.pinCode} onChange={(event) => update('pinCode', event.target.value)} placeholder="Enter PIN code" /></label></div><div className="form-row two"><label>Preferred pickup date *<input required type="date" min={new Date().toISOString().slice(0, 10)} value={form.preferredDate} onChange={(event) => update('preferredDate', event.target.value)} /></label><label>Preferred time slot *<select required value={form.timeSlot} onChange={(event) => update('timeSlot', event.target.value)}><option value="morning">Morning · 9 AM – 12 PM</option><option value="afternoon">Afternoon · 12 PM – 4 PM</option><option value="evening">Evening · 4 PM – 7 PM</option></select></label></div><label>Notes / special instructions (optional)<textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Condition of devices, access instructions, or any other details…" /></label><label className="consent-row"><input required type="checkbox" checked={form.consent} onChange={(event) => update('consent', event.target.checked)} /> I confirm the devices are ready for collection and do not contain personal data. *</label><button className="button collection-submit" type="submit" disabled={submitting}><Truck size={16} /> {submitting ? 'Submitting request…' : 'Request pickup'} <ArrowRight size={16} /></button></form><p className="notice">Submitting sends your request for review. It does not confirm a pickup, partner, date, or delivery.</p></section><aside className="collection-aside"><div className="collection-aside-hero"><h2>A cleaner<br /><em>tomorrow starts here.</em></h2><p>We help you prepare devices for a responsible next step.</p></div><div className="collection-info"><div className="panel-heading"><Truck size={19} /><h2>Your pickup at a glance</h2></div><p>Here's how the collection process works.</p><ol><li><b>Submit request</b><span>Fill in device and pickup details.</span></li><li><b>Review</b><span>Your request remains pending until a service is configured.</span></li><li><b>Pickup & tracking</b><span>Only an authorized provider can confirm collection.</span></li></ol></div><div className="collection-safety"><ShieldCheck size={20} /><div><b>Before pickup</b><span>Back up data, sign out, and remove SIM or memory cards.</span></div></div><div className="collection-disclaimer"><CircleAlert size={16} /> No real pickup partner or live availability is connected.</div></aside></div></main>;
}

function ImpactPage() {
  const [summary, setSummary] = useState<ImpactSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function loadImpact() {
    setLoading(true); setError('');
    try { setSummary(await api<ImpactSummary>('/impact/summary')); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Impact data could not be loaded.'); } finally { setLoading(false); }
  }
  useEffect(() => { void loadImpact(); }, []);
  if (loading) return <main className="impact-page page-shell wide"><div className="impact-loading"><BarChart3 size={28} /><h1>Loading your impact…</h1><p>Reading your saved PowerCycle activity.</p></div></main>;
  if (error || !summary) return <main className="impact-page page-shell wide"><div className="impact-error"><CircleAlert size={28} /><h1>Impact data unavailable</h1><p>{error || 'No impact data is available yet.'}</p><button className="button" type="button" onClick={() => void loadImpact()}>Try again <RefreshCw size={15} /></button></div></main>;
  const requests = summary.collectionRequests.submitted;
  const journey = [
    ['Assess', 'Review a device with the saved assessment flow.', '/assess', summary.devicesAssessed > 0, Smartphone],
    ['Repair & Reuse', 'Use a real assessment recommendation to plan a next step.', '/my-activity', summary.devicesAssessed > 0, Wrench],
    ['Upcycle', 'Share a project only when an idea is actually published.', '/ideas/create', summary.publishedIdeas > 0, Lightbulb],
    ['Recycle', 'Request collection; completion remains pending until confirmed.', '/collection', summary.collectionRequests.completed > 0, Recycle],
  ] as const;
  const metrics = [
    [String(summary.devicesAssessed), 'Devices assessed', 'Recorded from saved assessments', ClipboardList, '/my-activity'],
    [String(summary.secondLifeItems), 'Items given a second life', summary.secondLifeItems ? 'Recorded completed actions' : 'Not measured yet', Recycle, '/my-activity'],
    [String(requests), 'Collection requests', 'Recorded requests from your account', Truck, '/my-activity'],
    [summary.verifiedEwasteKg === null ? 'Awaiting verified data' : `${summary.verifiedEwasteKg} kg`, 'Verified e-waste diverted', 'Shown only with confirmed weight', Leaf, '/my-activity'],
  ] as const;
  return <main className="impact-page page-shell wide">
    <section className="impact-hero"><div><p className="eyebrow">A cleaner tomorrow, together</p><h1>Your impact, made <em>tangible.</em></h1><p>Every action saved on PowerCycle helps you understand your next responsible step. Activity is not automatically proof of environmental impact.</p><div className="actions"><Link className="button" to="/assess">Assess a device <ArrowRight size={15} /></Link><Link className="button secondary" to="/ideas/create">Share an upcycling idea <Sparkles size={15} /></Link></div></div><div className="impact-hero-art" aria-hidden="true"><Globe2 size={110} /><Leaf size={38} /></div></section>
    <section className="impact-metric-grid">{metrics.map(([value, label, note, Icon, href]) => <Link className="impact-metric" to={href} key={label}><span><Icon size={20} /></span><strong>{value}</strong><b>{label}</b><small>{note}</small></Link>)}</section>
    <section className="impact-journey"><div className="impact-section-heading"><div><p className="eyebrow">Circularity journey</p><h2>Turn activity into a next step.</h2></div><span>Progress reflects saved records only.</span></div><div className="journey-track">{journey.map(([title, text, href, complete, Icon], index) => <div className={`journey-stage ${complete ? 'complete' : ''}`} key={title}><Link to={href} className="journey-icon" aria-label={`${title}: ${complete ? 'complete' : 'start'}`}><Icon size={22} /></Link><strong>{index + 1}. {title}</strong><p>{text}</p><Link className="journey-link" to={href}>{complete ? 'View activity' : 'Start here'} <ArrowRight size={13} /></Link>{index < journey.length - 1 && <i />}</div>)}</div></section>
    <section className="impact-lower-grid"><article className="impact-passport"><div className="impact-passport-icon"><Leaf size={46} /></div><div><p className="eyebrow">Your eco impact passport</p><h2>Evidence before estimates.</h2><p>Assessments: <strong>{summary.devicesAssessed}</strong> · Published ideas: <strong>{summary.publishedIdeas}</strong> · Completed collection: <strong>{summary.collectionRequests.completed}</strong></p><span className="impact-pending">Impact score: Pending — complete recorded actions first.</span></div></article><article className="impact-feed"><div className="impact-section-heading"><div><p className="eyebrow">Impact activity feed</p><h2>Your recent records</h2></div><Link to="/my-activity">View all <ArrowRight size={14} /></Link></div>{summary.recentActivity.length ? summary.recentActivity.map((item) => <Link className="impact-feed-item" to={item.href} key={`${item.type}-${item.id}`}><span>{item.type === 'assessment' ? <ClipboardList size={17} /> : item.type === 'idea' ? <Lightbulb size={17} /> : <Truck size={17} />}</span><div><strong>{item.title}</strong><small>{new Date(item.createdAt).toLocaleString()} · {item.status}</small></div><ArrowRight size={14} /></Link>) : <div className="impact-empty"><p>Your journey starts with your first device assessment.</p><Link className="button" to="/assess">Assess a device</Link></div>}</article></section>
    <section className="impact-actions"><div className="impact-section-heading"><div><p className="eyebrow">Make your next impact</p><h2>Choose an action.</h2></div></div><div className="impact-action-grid"><Link to="/assess"><Smartphone size={24} /><div><strong>Assess a device</strong><span>Record its condition and next step.</span></div><ArrowRight size={15} /></Link><Link to="/ideas/create"><Lightbulb size={24} /><div><strong>Share an upcycling idea</strong><span>Publish a real project for the community.</span></div><ArrowRight size={15} /></Link><Link to="/collection"><Truck size={24} /><div><strong>Request e-waste pickup</strong><span>Submit a request; pickup is not confirmed until reviewed.</span></div><ArrowRight size={15} /></Link></div></section>
    <section className="impact-methodology"><ShieldCheck size={22} /><div><strong>How we measure impact</strong><span><b>Recorded</b> counts come from saved records.</span><span><b>Not measured</b> means source data is insufficient.</span><span><b>Verified</b> requires confirmation, not an estimate.</span></div></section>
  </main>;
}

function PassportPage() { return <main className="page-shell wide"><div className="page-title"><div><p className="eyebrow">Digital device passport</p><h1>Give a device a story.</h1><p>A private record of condition, repairs and next steps that can travel with a device.</p></div><div className="title-icon"><QrCode size={26} /></div></div><div className="passport-card"><div className="passport-qr"><QrCode size={110} /></div><div><span className="badge">Preview only</span><h2>Your passport starts here.</h2><p>Sign in and connect the database to create a privacy-safe passport. Public links will never expose contact details.</p><div className="actions"><Link className="button" to="/assess">Assess a device</Link><Link className="button secondary" to="/profile">View profile</Link></div></div></div></main>; }

function MyActivityPage() {
  const { loading: authLoading, user } = useAuth();
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [tab, setTab] = useState<'assessments' | 'ideas' | 'collections' | 'marketplace'>('assessments');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function loadActivity() {
    setLoading(true); setError('');
    try { setActivity(await api<ActivityData>('/activity/me')); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Activity could not be loaded.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (!authLoading && user) void loadActivity(); }, [authLoading, user?.id]);
  if (authLoading) return <AuthLoading />;
  const term = query.trim().toLowerCase();
  const assessments = (activity?.assessments ?? []).filter((item) => `${item.deviceType} ${item.recommendation} ${item.condition}`.toLowerCase().includes(term));
  const ideas = (activity?.ideas ?? []).filter((item) => `${item.title} ${item.shortDescription} ${item.status}`.toLowerCase().includes(term));
  const collections = (activity?.collectionRequests ?? []).filter((item) => `${item.deviceCategory} ${item.city} ${item.status}`.toLowerCase().includes(term));
  const marketplaceRequests = (activity?.marketplaceRequests ?? []).filter((request) => `${request.listingTitle} ${request.status} ${request.role}`.toLowerCase().includes(term));
  const tabs = [['assessments', 'Assessments'], ['ideas', 'My Ideas'], ['collections', 'Collection Requests'], ['marketplace', 'Marketplace']] as const;
  return <main className="page-shell wide activity-dashboard"><section className="activity-dashboard-hero"><div><p className="eyebrow">Your private dashboard</p><h1>My <em>Activity</em></h1><p>Review saved assessments, projects and collection requests from your account.</p></div><div className="activity-profile"><span className="profile-avatar">{(user?.email?.[0] ?? 'U').toUpperCase()}</span><div><strong>{user?.email?.split('@')[0]}</strong><small>{user?.email}</small></div></div></section>{error && <div className="activity-empty"><AuthError message={error} /><button className="button secondary" type="button" onClick={() => void loadActivity()}>Try again</button></div>}{loading ? <p className="activity-empty">Loading your activity…</p> : activity && <><section className="activity-summary-grid"><article><strong>{activity.assessments.length}</strong><span>Assessments</span></article><article><strong>{activity.ideas.filter((idea) => idea.status === 'published').length}</strong><span>Published ideas</span></article><article><strong>{activity.collectionRequests.length}</strong><span>Collection requests</span></article><Link to="/my-listings"><strong>Manage</strong><span>My marketplace listings</span></Link></section><div className="activity-tabs">{tabs.map(([value, label]) => <button type="button" className={tab === value ? 'active' : ''} key={value} onClick={() => setTab(value)}>{label}</button>)}</div><label className="search activity-search"><Search size={17} /><span className="sr-only">Search activity</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your activity" /></label><section className="activity-dashboard-panel">{tab === 'assessments' && <>{assessments.length ? assessments.map((item) => <article className="activity-record" key={item._id}><div><span className="badge">{item.recommendation}</span><h2>{item.deviceType}</h2><p>{item.brand} {item.modelName} · Condition: {item.condition} · {item.reason}</p>{item.imageUrl && <img className="activity-assessment-image" src={item.imageUrl} alt="Your uploaded device" />}{item.aiAnalysis?.visibleObservations?.length ? <div><h3>Gemini photo result</h3><ul>{item.aiAnalysis.visibleObservations.map((note) => <li key={note}>{note}</li>)}</ul>{item.aiAnalysis.possibleVisibleDamage?.map((note) => <p className="warning" key={note}>{note}</p>)}</div> : <p>Photo analysis: {item.aiAnalysis?.message ?? "No Gemini photo analysis saved for this assessment."}</p>}<h3>Assessment solution</h3><ol>{item.nextSteps?.map((step) => <li key={step}>{step}</li>)}</ol>{item.repairPlan?.steps?.length ? <><h3>Generated safe repair / reuse plan</h3><ol>{item.repairPlan.steps.map((step, index) => <li key={`${index}-${step.title}`}><strong>{step.title}</strong> — {step.description}</li>)}</ol></> : null}{item.safetyFlags?.map((flag) => <p className="warning" key={flag}>{flag}</p>)}</div><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('en-IN')}</time></article>) : <div className="activity-empty"><h2>No matching assessments</h2><Link className="button" to="/assess">Start an assessment</Link></div>}</>}{tab === 'ideas' && <>{ideas.length ? ideas.map((item) => <Link className="activity-record" to={`/ideas/${item._id}`} key={item._id}><div><span className="badge">{item.status}</span><h2>{item.title}</h2><p>{item.shortDescription}</p></div><time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleString('en-IN')}</time></Link>) : <div className="activity-empty"><h2>No matching ideas</h2><Link className="button" to="/ideas/create">Create an idea</Link></div>}</>}{tab === 'collections' && <>{collections.length ? collections.map((item) => <article className="activity-record" key={item._id}><div><span className="badge">{item.status}</span><h2>{item.deviceCategory} collection</h2><p>{item.itemCount} item(s) · {item.city} · Preferred {item.preferredDate}</p></div><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('en-IN')}</time></article>) : <div className="activity-empty"><h2>No matching collection requests</h2><Link className="button" to="/collection">Request collection</Link></div>}</>}{tab === 'marketplace' && <>{marketplaceRequests.length ? marketplaceRequests.map((request) => <Link className="activity-record" to={`/shop/${request.listingId}`} key={request.id}><div><span className="badge">{request.role} · {request.status}</span><h2>{request.listingTitle}</h2><p>{request.quantity} × {money.format(request.unitPriceInr)}{request.buyerEmail ? ` · Buyer ${request.buyerEmail}` : ''}</p></div><time dateTime={request.createdAt}>{new Date(request.createdAt).toLocaleString('en-IN')}</time></Link>) : <div className="activity-empty"><h2>No marketplace requests yet</h2><Link className="button" to="/marketplace">Browse community listings</Link></div>}</>}</section><p className="notice">Purchases are not shown because PowerCycle does not process orders or payments. Collection requests remain unconfirmed until a real service accepts them.</p></>}</main>;
}

function ProfilePage() {
  const { user } = useAuth();
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function loadActivity() {
    setLoading(true); setError('');
    try { setActivity(await api<ActivityData>('/activity/me')); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Activity could not be loaded.'); } finally { setLoading(false); }
  }

  function NestedMyActivityPage() {
    const { user } = useAuth();
    const [activity, setActivity] = useState<ActivityData | null>(null);
    const [tab, setTab] = useState<'assessments' | 'ideas' | 'collections' | 'purchases'>('assessments');
    const [query, setQuery] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    async function load() {
      setLoading(true); setError('');
      try { setActivity(await api<ActivityData>('/activity/me')); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Activity could not be loaded.'); } finally { setLoading(false); }
    }
    useEffect(() => { void load(); }, []);
    const filterText = query.toLowerCase();
    const assessments = activity?.assessments.filter((item) => `${item.deviceType} ${item.recommendation} ${item.condition}`.toLowerCase().includes(filterText)) ?? [];
    const ideas = activity?.ideas.filter((item) => `${item.title} ${item.shortDescription} ${item.status}`.toLowerCase().includes(filterText)) ?? [];
    const collections = activity?.collectionRequests.filter((item) => `${item.deviceCategory} ${item.city} ${item.status}`.toLowerCase().includes(filterText)) ?? [];
    const tabs = [['assessments', 'AI Assessments'], ['purchases', 'My Purchases'], ['ideas', 'My Ideas'], ['collections', 'Collection Requests']] as const;
    return <main className="page-shell wide activity-dashboard"><section className="activity-dashboard-hero"><div><p className="eyebrow">Your private dashboard</p><h1>My <em>Activity</em></h1><p>Everything saved for your verified PowerCycle account, in one place.</p></div><div className="activity-profile"><span className="profile-avatar">{(user?.email?.[0] ?? 'U').toUpperCase()}</span><div><strong>{user?.email?.split('@')[0]}</strong><small>{user?.email}</small></div></div></section>{error && <div className="activity-empty"><AuthError message={error} /><button className="button secondary" type="button" onClick={() => void load()}>Try again</button></div>}{loading ? <p className="activity-empty">Loading your activity…</p> : activity && <><section className="activity-summary-grid"><article><strong>{activity.assessments.length}</strong><span>AI Assessments</span></article><article><strong>{activity.purchases.length}</strong><span>Products Purchased</span></article><article><strong>{activity.ideas.length}</strong><span>Ideas Shared</span></article><article><strong>{activity.collectionRequests.length}</strong><span>Collection Requests</span></article></section><div className="activity-tabs">{tabs.map(([value, label]) => <button type="button" className={tab === value ? 'active' : ''} key={value} onClick={() => setTab(value)}>{label}</button>)}</div><label className="search activity-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your activity" /></label><section className="activity-dashboard-panel">{tab === 'assessments' && <>{assessments.length ? assessments.map((item) => <article className="activity-record" key={item._id}><div><span className="badge">Assessment</span><h2>{item.deviceType}</h2><p>{item.condition} · Recommendation: {item.recommendation}</p></div><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time></article>) : <div className="activity-empty"><h2>No assessments yet</h2><Link className="button" to="/assess">Start an assessment</Link></div>}</>}{tab === 'ideas' && <>{ideas.length ? ideas.map((item) => <Link className="activity-record" to={`/ideas/${item._id}`} key={item._id}><div><span className="badge">{item.status}</span><h2>{item.title}</h2><p>{item.shortDescription}</p></div><time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleString()}</time></Link>) : <div className="activity-empty"><h2>No ideas yet</h2><Link className="button" to="/ideas/create">Create an idea</Link></div>}</>}{tab === 'collections' && <>{collections.length ? collections.map((item) => <article className="activity-record" key={item._id}><div><span className="badge">{item.status}</span><h2>{item.deviceCategory} collection</h2><p>{item.itemCount} item(s) · {item.city} · Preferred {item.preferredDate}</p></div><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time></article>) : <div className="activity-empty"><h2>No collection requests yet</h2><Link className="button" to="/collection">Request collection</Link></div>}</>}{tab === 'purchases' && <div className="activity-empty"><ShoppingBag size={30} /><h2>No purchases recorded</h2><p>Checkout and order history are not implemented, so no demo purchases are shown.</p><Link className="button" to="/marketplace">Browse marketplace</Link></div>}</section></>}</main>;
  }
  void NestedMyActivityPage;
  useEffect(() => { void loadActivity(); }, []);
  const timeline = activity ? [
    ...activity.assessments.map((item) => ({ id: item._id, date: item.createdAt, title: `${item.deviceType} assessed`, detail: `Recommendation: ${item.recommendation}`, type: 'Assessment' })),
    ...activity.collectionRequests.map((item) => ({ id: item._id, date: item.createdAt, title: `Collection request · ${item.deviceCategory}`, detail: `${item.itemCount} item(s) · ${item.city} · ${item.status}`, type: 'Collection' })),
  ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)) : [];
  return <main className="profile-page page-shell wide"><section className="profile-hero"><div className="profile-avatar">{(user?.email?.[0] ?? 'U').toUpperCase()}</div><div><p className="eyebrow">Your PowerCycle space</p><h1>{user?.email?.split('@')[0] ?? 'Your profile'}</h1><p>{user?.email}</p></div><Link className="button secondary" to="/assess"><Sparkles size={16} /> New assessment</Link></section><section className="profile-stats"><article><strong>{activity?.assessments.length ?? 0}</strong><span>Assessments</span></article><article><strong>{activity?.collectionRequests.length ?? 0}</strong><span>Collection requests</span></article><article><strong>{activity ? 'Active' : '—'}</strong><span>Account status</span></article></section><div className="profile-activity-layout"><section className="activity-card"><div className="panel-heading"><ClipboardList size={20} /><div><h2>Activity history</h2><p>Your private account activity, scoped to this signed-in user.</p></div></div>{loading && <p className="activity-empty">Loading your activity…</p>}{!loading && error && <div className="activity-empty"><AuthError message={error} /><button className="button secondary" type="button" onClick={() => void loadActivity()}>Try again <RefreshCw size={15} /></button></div>}{!loading && !error && !timeline.length && <div className="activity-empty"><ClipboardList size={28} /><h3>No activity yet</h3><p>Complete an assessment or submit a collection request and it will appear here after database persistence is configured.</p><Link className="button" to="/assess">Start an assessment</Link></div>}{!loading && !error && timeline.length > 0 && <div className="activity-timeline">{timeline.map((item) => <article key={`${item.type}-${item.id}`}><span className="activity-dot"><Check size={13} /></span><div><span className="activity-type">{item.type}</span><h3>{item.title}</h3><p>{item.detail}</p><time dateTime={item.date}>{new Date(item.date).toLocaleString()}</time></div></article>)}</div>}</section><aside className="profile-side"><div className="profile-side-card"><UserRound size={21} /><h2>Account details</h2><dl><div><dt>Email</dt><dd>{user?.email}</dd></div><div><dt>User ID</dt><dd>{user?.id.slice(0, 12)}…</dd></div><div><dt>Privacy</dt><dd>Private to your account</dd></div></dl></div><div className="profile-side-card"><ShieldCheck size={21} /><h2>Data note</h2><p>Activity is loaded only from records owned by your verified Supabase user ID. Prototype cart activity stays in this browser and is not presented as server history.</p></div></aside></div></main>;
}

function FeedbackPage() {
  const [rating, setRating] = useState('5');
  const [topic, setTopic] = useState('other');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSent(false); setSaving(true);
    try { await api<{ id: string }>('/feedback', { method: 'POST', body: JSON.stringify({ rating: Number(rating), topic, message }) }); setSent(true); setMessage(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Feedback could not be saved.'); }
    finally { setSaving(false); }
  }
  return <main className="page-shell"><div className="page-title"><div><p className="eyebrow">Help us improve</p><h1>Tell us what you think.</h1><p>Your feedback helps make responsible electronics decisions easier.</p></div><div className="title-icon"><MessageSquare size={26} /></div></div><section className="form-card"><form onSubmit={(event) => void submit(event)}><label>How was your experience?<select value={rating} onChange={(event) => setRating(event.target.value)}><option value="5">Very helpful</option><option value="4">Helpful</option><option value="3">Okay</option><option value="2">Needs improvement</option><option value="1">Not helpful</option></select></label><label>What is this about?<select value={topic} onChange={(event) => setTopic(event.target.value)}><option value="assessment">Device assessment</option><option value="ideas">Upcycling ideas</option><option value="marketplace">Marketplace</option><option value="collection">Collection request</option><option value="accessibility">Accessibility</option><option value="other">Other</option></select></label><label>Your feedback<textarea required minLength={10} maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell us what worked or what was confusing" /><small>{message.length}/2000</small></label>{error && <p className="auth-error" role="alert"><CircleAlert size={16} /> {error}</p>}{sent && <p className="auth-success" role="status"><Check size={16} /> Thank you. Your feedback was saved to your account.</p>}<button className="button" type="submit" disabled={saving}>{saving ? 'Saving feedback…' : 'Send feedback'} <ArrowRight size={15} /></button></form><p className="notice">Your feedback is associated with your signed-in account so the team can understand the app experience.</p></section></main>;
}

function CategoryGuideRoute() { const { category = 'repair' } = useParams(); const item = categoryImages.find(([title]) => title.toLowerCase() === category) ?? categoryImages[0]; const descriptions: Record<string, string> = { Repair: 'Extend a device life when it is safe, practical and cheaper than replacing it.', Reuse: 'Pass a working device to someone who can use it, after removing your personal data.', Upcycle: 'Turn safe, disconnected parts into useful objects without opening hazardous components.', Recycle: 'Separate electronics responsibly when repair or reuse is no longer safe or realistic.' }; return <GuidePage title={`How to ${item[0].toLowerCase()} electronics`} image={item[2]} description={descriptions[item[0]]} category="category" />; }

export function App() {
 const [cart, setCart] = useState<Product[]>(() => { try { return JSON.parse(localStorage.getItem('powercycle-cart') ?? '[]') as Product[]; } catch { return []; } });
 const [dark, setDark] = useState(() => localStorage.getItem('powercycle-theme') === 'dark');
 useEffect(() => { localStorage.setItem('powercycle-cart', JSON.stringify(cart)); }, [cart]);
 useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; localStorage.setItem('powercycle-theme', dark ? 'dark' : 'light'); }, [dark]);
 const addToCart = (product: Product) => setCart((items) => [...items, product]);
 const changeQuantity = (slug: string, amount: number) => setCart((items) => { const index = items.findIndex((item) => item.slug === slug); if (index < 0 || amount > 0) return amount > 0 ? [...items, items.find((item) => item.slug === slug)!] : items; const next = [...items]; next.splice(index, 1); return next; });
 const protectedRoutes = <ProtectedRoute><Layout cartCount={cart.length} dark={dark} toggleDark={() => setDark((value) => !value)}><Routes><Route path="/" element={<HomePage />} /><Route path="/assess" element={<AssessPage />} /><Route path="/ideas" element={<IdeasPage />} /><Route path="/ideas/create" element={<CreateIdeaPage />} /><Route path="/ideas/:slug" element={<IdeaDetailPage />} /><Route path="/shop" element={<ShopPage addToCart={addToCart} />} /><Route path="/marketplace" element={<ShopPage addToCart={addToCart} />} /><Route path="/marketplace/create" element={<CreateListingPage />} /><Route path="/my-listings" element={<MyListingsPage />} /><Route path="/shop/:slug" element={<ProductDetailPage addToCart={addToCart} />} /><Route path="/guide/:category" element={<CategoryGuideRoute />} /><Route path="/cart" element={<CartPage cart={cart} changeQuantity={changeQuantity} />} /><Route path="/about" element={<AboutPage />} /><Route path="/collection" element={<CollectionPage />} /><Route path="/feedback" element={<FeedbackPage />} /><Route path="/impact" element={<ImpactPage />} /><Route path="/passport" element={<PassportPage />} /><Route path="/profile" element={<ProfilePage />} /><Route path="/my-activity" element={<MyActivityPage />} /><Route path="*" element={<StaticPage title="Page not found"><Link className="button" to="/">Return home</Link></StaticPage>} /></Routes></Layout></ProtectedRoute>;
 return <Routes><Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} /><Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} /><Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} /><Route path="*" element={protectedRoutes} /></Routes>;
}
