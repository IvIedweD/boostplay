import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useAuth } from '../auth/BoostplayAuthProvider';
import { getPasswordRules, isStrongPassword } from '../auth/passwordPolicy';
import { isAllowedRegistrationEmail, normalizeReferralCode } from '../auth/registrationPolicy';
import { BoostplayDialog } from './BoostplayDialog';

export type AuthDialogMode = 'login' | 'register';

function AuthIcon({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}

export function BoostplayAuthDialog({
  initialMode = 'register',
  referralCode,
  onClose,
  dismissible = true,
}: {
  initialMode?: AuthDialogMode;
  referralCode?: string | null;
  onClose: () => void;
  dismissible?: boolean;
}) {
  const { register, signIn } = useAuth();
  const [mode, setMode] = useState<AuthDialogMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [verification, setVerification] = useState<{ email: string; simulated: boolean } | null>(null);
  const passwordRules = useMemo(() => getPasswordRules(password), [password]);
  const normalizedReferralCode = normalizeReferralCode(referralCode);

  const switchMode = (nextMode: AuthDialogMode) => {
    setMode(nextMode);
    setError('');
    setPassword('');
    setPasswordConfirmation('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!isAllowedRegistrationEmail(email)) {
      setError('Используйте корпоративную почту вида login@yandex-team.ru.');
      return;
    }
    if (mode === 'register' && !isStrongPassword(password)) {
      setError('Пароль пока не соответствует всем требованиям.');
      return;
    }
    if (mode === 'register' && password !== passwordConfirmation) {
      setError('Пароли не совпадают.');
      return;
    }

    setPending(true);
    try {
      if (mode === 'register') {
        const result = await register({ email, password, referralCode: normalizedReferralCode });
        setVerification({ email: result.email, simulated: result.simulated });
      } else {
        await signIn({ email, password });
        onClose();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось выполнить запрос. Попробуйте ещё раз.');
    } finally {
      setPending(false);
    }
  };

  if (verification) {
    return <BoostplayDialog
      title="Подтвердите почту"
      eyebrow="Остался один шаг"
      className="bp-auth-dialog is-verification"
      bodyClassName="bp-auth-dialog__body"
      titleAlign="center"
      onClose={onClose}
      dismissible={dismissible}
    >
      <div className="bp-auth-verification">
        <div className="bp-auth-verification__signal" aria-hidden="true"><i /><i /><span><AuthIcon><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></AuthIcon></span></div>
        <p>Мы отправили письмо на</p>
        <strong>{verification.email}</strong>
        <p className="bp-auth-verification__note">Перейдите по ссылке из письма. После подтверждения профиль получит случайные аватар и рамку.</p>
        <div className="bp-auth-preview-note" role="status"><AuthIcon><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></AuthIcon><span>{verification.simulated ? <><b>Локальный режим</b> Отправка появится после подключения сервера.</> : <><b>Проверьте входящие</b> Если письма нет, загляните в папку «Спам».</>}</span></div>
        <button type="button" className="bp-auth-primary" onClick={() => { setVerification(null); switchMode('login'); }}>Перейти ко входу</button>
        <button type="button" className="bp-auth-text-button" onClick={() => setVerification(null)}>Изменить адрес</button>
      </div>
    </BoostplayDialog>;
  }

  return <BoostplayDialog
    title={mode === 'register' ? 'Создать аккаунт' : 'С возвращением'}
    eyebrow={mode === 'register' ? 'Вступить в BOOSTPLAY' : 'Вход в BOOSTPLAY'}
    className="bp-auth-dialog"
    bodyClassName="bp-auth-dialog__body"
    titleAlign="center"
    onClose={onClose}
    dismissible={dismissible}
  >
    <div className="bp-auth-layout">
      <aside className="bp-auth-aside" aria-label="Преимущества аккаунта BOOSTPLAY">
        <div className="bp-auth-aside__brand"><span>BOOST</span><strong>PLAY</strong></div>
        <p>Один профиль для сезона, рейтинга и игровых результатов.</p>
        <ul>
          <li><i><AuthIcon><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4" /></AuthIcon></i><span><b>Место в сезоне</b><small>Результаты попадают в общую таблицу</small></span></li>
          <li><i><AuthIcon><path d="m13 2-9 12h8l-1 8 9-12h-8l1-8Z" /></AuthIcon></i><span><b>Очки активности</b><small>Используйте их для усилений</small></span></li>
          <li><i><AuthIcon><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></AuthIcon></i><span><b>Корпоративный доступ</b><small>Только подтверждённая команда</small></span></li>
        </ul>
        <div className="bp-auth-aside__orbit" aria-hidden="true"><i /><i /><i /></div>
      </aside>

      <form className="bp-auth-form" onSubmit={submit} noValidate>
        <div className="bp-auth-tabs" role="tablist" aria-label="Способ авторизации">
          <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'is-active' : ''} onClick={() => switchMode('register')}>Регистрация</button>
          <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'is-active' : ''} onClick={() => switchMode('login')}>Вход</button>
        </div>

        <label className={`bp-auth-field${email ? ' is-filled' : ''}${isAllowedRegistrationEmail(email) ? ' is-valid' : ''}`}>
          <span>Корпоративная почта</span>
          <div><AuthIcon><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></AuthIcon><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); if (error) setError(''); }} placeholder="login@yandex-team.ru" autoComplete="email" inputMode="email" required /></div>
          <small>Разрешён только домен @yandex-team.ru</small>
        </label>

        <label className={`bp-auth-field${password ? ' is-filled' : ''}${mode === 'register' && isStrongPassword(password) ? ' is-valid' : ''}`}>
          <span>Пароль</span>
          <div><AuthIcon><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></AuthIcon><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); if (error) setError(''); }} placeholder={mode === 'register' ? 'Придумайте надёжный пароль' : 'Введите пароль'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required /><button type="button" aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'} onClick={() => setShowPassword((visible) => !visible)}><AuthIcon>{showPassword ? <><path d="M3 3l18 18" /><path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" /><path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a15.4 15.4 0 0 1-2.1 3.2M6.6 6.6C3.5 8.5 2 12 2 12s3.5 8 10 8a10.6 10.6 0 0 0 4.1-.8" /></> : <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>}</AuthIcon></button></div>
        </label>

        {mode === 'register' && <>
          <label className={`bp-auth-field${passwordConfirmation ? ' is-filled' : ''}${passwordConfirmation && passwordConfirmation === password ? ' is-valid' : ''}`}>
            <span>Повторите пароль</span>
            <div><AuthIcon><path d="m8 12 2.5 2.5L16 9" /><circle cx="12" cy="12" r="9" /></AuthIcon><input type={showPassword ? 'text' : 'password'} value={passwordConfirmation} onChange={(event) => { setPasswordConfirmation(event.target.value); if (error) setError(''); }} placeholder="Введите пароль ещё раз" autoComplete="new-password" required /></div>
          </label>
          <div className="bp-auth-rules" aria-label="Требования к паролю">{passwordRules.map((rule) => <span key={rule.id} className={rule.satisfied ? 'is-valid' : ''}><i>{rule.satisfied ? '✓' : '·'}</i>{rule.label}</span>)}</div>
        </>}

        {normalizedReferralCode && <div className="bp-auth-referral"><AuthIcon><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1" /><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1" /></AuthIcon><span>Реферальная метка применена</span><b>{normalizedReferralCode}</b></div>}
        <div className="bp-auth-feedback" aria-live="polite">{error && <p className="bp-auth-error" role="alert">{error}</p>}</div>
        <button type="submit" className="bp-auth-primary" disabled={pending}>{pending ? <><i />Подождите…</> : mode === 'register' ? 'Создать аккаунт' : 'Войти'}</button>
        <p className="bp-auth-legal">Продолжая, вы соглашаетесь с правилами BOOSTPLAY и обработкой данных профиля.</p>
      </form>
    </div>
  </BoostplayDialog>;
}
