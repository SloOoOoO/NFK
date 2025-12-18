import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement login
    console.log('Login:', { email, password });
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Anmelden</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              E-Mail
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Passwort
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <button type="submit" className="w-full btn-primary">
            Anmelden
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-textSecondary">Oder anmelden mit</span>
            </div>
          </div>

          <button className="w-full btn-secondary flex items-center justify-center gap-2">
            <span>🔍</span> Google
          </button>
          <button className="w-full btn-secondary flex items-center justify-center gap-2">
            <span>🍎</span> Apple
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link to="/auth/register" className="text-primary hover:underline">
            Noch kein Konto? Registrieren
          </Link>
        </div>
      </div>
    </div>
  );
}
