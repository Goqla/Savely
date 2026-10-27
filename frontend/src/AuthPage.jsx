
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { supabase } from './supabase';

export default function AuthPage({ mode }) {
  const register = mode === 'register';
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      if (register) {
        const name = nickname.trim();

        if (name.length < 2 || name.length > 30) {
          throw new Error('El apodo debe tener entre 2 y 30 caracteres.');
        }

        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { nickname: name },
          },
        });

        if (authError) throw authError;

        if (!data.session) {
          throw new Error(
            'Cuenta creada. Revisá la configuración de confirmación de correo.'
          );
        }
      } else {
        const { error: authError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (authError) throw authError;
      }

      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo completar la operación.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-back">
          <ArrowLeft size={17} />
          Volver a Savely
        </Link>

        <div className="auth-logo">
          <span className="auth-logo-icon">
            <ShoppingBag size={27} />
          </span>
          <strong>savely<span>.</span></strong>
        </div>

        <h1>{register ? 'Crear cuenta' : 'Bienvenido de nuevo'}</h1>

        <p className="auth-description">
          {register
            ? 'Registrate gratis para formar parte de Savely.'
            : 'Ingresá con tu cuenta para continuar.'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {register && (
            <label>
              Nombre o apodo
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Ej. Gonzalo"
                minLength={2}
                maxLength={30}
                autoComplete="nickname"
                required
              />
            </label>
          )}

          <label>
            Correo electrónico
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              autoComplete={
                register ? 'new-password' : 'current-password'
              }
              required
            />
          </label>

          {error && (
            <p className="auth-error" role="alert">{error}</p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? 'Procesando...'
              : register ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="auth-switch">
          {register ? '¿Ya tenés una cuenta?' : '¿No tenés cuenta?'}
          {' '}
          <Link to={register ? '/login' : '/registro'}>
            {register ? 'Iniciar sesión' : 'Registrarse'}
          </Link>
        </p>

        <p className="auth-footer">
          También podés comparar precios sin registrarte.
        </p>
      </div>
    </div>
  );
}
