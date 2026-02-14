import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../../services/api';
import { calculatePasswordStrength, PASSWORD_MIN_LENGTH, PASSWORD_PATTERNS } from '../../utils/passwordValidation';
import { validateSteuerID } from '../../utils/taxValidation';
import { isNotDisposableEmail, getDisposableEmailError } from '../../utils/emailValidation';

// Zod validation schema
const registrationSchema = z.object({
  // Section 1: Account Credentials
  email: z
    .string()
    .min(1, 'E-Mail ist erforderlich')
    .email('Ungültige E-Mail-Adresse')
    .refine(isNotDisposableEmail, getDisposableEmailError())
    .refine(
      (email) => !email.toLowerCase().endsWith('@example.com'),
      'Diese E-Mail-Adresse ist ungültig. Bitte verwenden Sie eine echte E-Mail-Adresse.'
    ),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Passwort muss mindestens ${PASSWORD_MIN_LENGTH} Zeichen lang sein`)
    .regex(PASSWORD_PATTERNS.lowercase, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
    .regex(PASSWORD_PATTERNS.uppercase, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(PASSWORD_PATTERNS.number, 'Passwort muss mindestens eine Ziffer enthalten')
    .regex(PASSWORD_PATTERNS.specialChar, 'Passwort muss mindestens ein Sonderzeichen enthalten'),
  confirmPassword: z.string().min(1, 'Passwort-Bestätigung ist erforderlich'),
  
  // Section 2: Client Master Data
  clientType: z.enum(['Privatperson', 'Einzelunternehmen', 'GmbH', 'UG', 'GbR'], {
    message: 'Mandantenart ist erforderlich',
  }),
  companyName: z.string().optional(),
  salutation: z.enum(['Herr', 'Frau', 'Divers'], {
    message: 'Anrede ist erforderlich',
  }),
  firstName: z
    .string()
    .min(2, 'Vorname muss mindestens 2 Zeichen lang sein')
    .regex(/^[^0-9]+$/, 'Vorname darf keine Zahlen enthalten'),
  lastName: z
    .string()
    .min(2, 'Nachname muss mindestens 2 Zeichen lang sein')
    .regex(/^[^0-9]+$/, 'Nachname darf keine Zahlen enthalten'),
  street: z
    .string()
    .min(3, 'Straße und Hausnummer müssen mindestens 3 Zeichen lang sein'),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, 'PLZ muss genau 5 Ziffern enthalten'),
  city: z
    .string()
    .min(2, 'Stadt muss mindestens 2 Zeichen lang sein'),
  
  // Section 3: Tax Data
  taxId: z
    .string()
    .regex(/^\d{11}$/, 'Steuer-ID muss genau 11 Ziffern enthalten')
    .refine(validateSteuerID, 'Ungültige Steuer-ID (Prüfsumme fehlgeschlagen)'),
  taxNumber: z
    .string()
    .optional(), // Steuernummer is optional
  vatId: z
    .union([
      z.string().regex(/^DE\d{9}$/, 'USt-IdNr. muss mit "DE" beginnen, gefolgt von 9 Ziffern'),
      z.literal('')
    ])
    .optional(),
  commercialRegister: z.string().optional(),
  
  // Section 4: Legal & Compliance
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: 'Sie müssen der Datenschutzerklärung zustimmen',
  }),
  termsConsent: z.boolean().refine((val) => val === true, {
    message: 'Sie müssen die AGB akzeptieren',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
}).refine((data) => {
  // Company name is required if NOT Privatperson
  if (data.clientType !== 'Privatperson') {
    return data.companyName && data.companyName.length >= 2;
  }
  return true;
}, {
  message: 'Firmenname ist erforderlich und muss mindestens 2 Zeichen lang sein',
  path: ['companyName'],
}).refine((data) => {
  // Commercial register is required for companies
  if (data.clientType !== 'Privatperson') {
    return data.commercialRegister && /^HR[AB]\s*\d+$/.test(data.commercialRegister);
  }
  return true;
}, {
  message: 'Handelsregister ist erforderlich (Format: HRA/HRB + Nummer)',
  path: ['commercialRegister'],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  
  const { strength, label, color } = calculatePasswordStrength(password);
  const widthPercentage = (strength / 4) * 100;
  
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 dark:text-gray-400">Passwortstärke:</span>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${widthPercentage}%` }}
        />
      </div>
    </div>
  );
}

export default function Register() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [disabledFields, setDisabledFields] = useState<{[key: string]: boolean}>({});
  const [oauthSource, setOauthSource] = useState<string | null>(null);
  const [oauthProviderId, setOauthProviderId] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onChange',
    defaultValues: {
      clientType: 'Privatperson',
      salutation: 'Herr' as const,
      privacyConsent: false,
      termsConsent: false,
    },
  });

  // Handle SSO pre-filled data
  useEffect(() => {
    const source = searchParams.get('source');
    const providerId = searchParams.get('providerId');
    
    setOauthSource(source);
    setOauthProviderId(providerId);
    
    if (source === 'datev') {
      // DATEV pre-fills first and last name
      const firstName = searchParams.get('firstName');
      const lastName = searchParams.get('lastName');
      
      if (firstName) {
        setValue('firstName', firstName);
        setDisabledFields(prev => ({ ...prev, firstName: true }));
      }
      if (lastName) {
        setValue('lastName', lastName);
        setDisabledFields(prev => ({ ...prev, lastName: true }));
      }
    } else if (source === 'google') {
      // Google pre-fills email
      const email = searchParams.get('email');
      
      if (!email || !providerId) {
        // Missing OAuth data - show error
        setApiError(t('auth.errors.googleOAuthDataMissing'));
        return;
      }
      
      // Validate that email is not a placeholder
      if (email.toLowerCase().endsWith('@example.com')) {
        setApiError(t('auth.errors.googleInvalidEmail'));
        return;
      }
      
      setValue('email', email);
      setDisabledFields(prev => ({ ...prev, email: true }));
    }
  }, [searchParams, setValue, t]);
  
  const clientType = watch('clientType');
  const password = watch('password');

  const onSubmit = async (data: RegistrationFormData) => {
    setApiError('');
    setLoading(true);
    
    try {
      // Backend API integration point: POST /api/v1/auth/register
      // Expected payload: all form fields as JSON
      // Response: success message (user will receive email verification)
      const genderMap: { [key: string]: string } = {
        'Herr': 'male',
        'Frau': 'female',
        'Divers': 'diverse'
      };
      
      const payload = {
        email: data.email,
        password: data.password,
        clientType: data.clientType,
        companyName: data.clientType !== 'Privatperson' ? data.companyName : undefined,
        salutation: data.salutation,
        gender: genderMap[data.salutation] || 'diverse',
        firstName: data.firstName,
        lastName: data.lastName,
        street: data.street,
        postalCode: data.postalCode,
        city: data.city,
        taxId: data.taxId,
        taxNumber: data.taxNumber || undefined,
        vatId: data.vatId || undefined,
        commercialRegister: data.clientType !== 'Privatperson' ? data.commercialRegister : undefined,
        privacyConsent: data.privacyConsent,
        termsConsent: data.termsConsent,
        // Add OAuth provider info if available
        googleId: oauthSource === 'google' && oauthProviderId ? oauthProviderId : undefined,
        datevId: oauthSource === 'datev' && oauthProviderId ? oauthProviderId : undefined,
      };
      
      await authAPI.register(payload);
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } catch (err: unknown) {
      console.error('Registration failed:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setApiError(
        error.response?.data?.message || 
        'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Success state
  if (success) {
    // Show different messages for SSO vs regular registration
    const isSSORegistration = oauthSource === 'google' || oauthSource === 'datev';
    const providerName = oauthSource === 'google' ? 'Google' : 'DATEV';
    
    return (
      <div className="min-h-screen bg-secondary dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-primary dark:text-blue-400 mb-4">
            Erfolgreich registriert!
          </h1>
          {isSSORegistration ? (
            <>
              <p className="text-textSecondary dark:text-gray-300 mb-4">
                Ihr Konto wurde erfolgreich mit {providerName} verknüpft.
              </p>
              <p className="text-sm text-textSecondary dark:text-gray-400 mb-6">
                Sie können sich jetzt mit Ihrem {providerName}-Konto anmelden.
                Ihre E-Mail-Adresse <strong>{watch('email')}</strong> wurde automatisch verifiziert.
              </p>
            </>
          ) : (
            <>
              <p className="text-textSecondary dark:text-gray-300 mb-4">
                Bitte überprüfen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren.
              </p>
              <p className="text-sm text-textSecondary dark:text-gray-400 mb-6">
                Wir haben Ihnen eine Bestätigungs-E-Mail an <strong>{watch('email')}</strong> gesendet.
                Klicken Sie auf den Link in der E-Mail, um Ihre Registrierung abzuschließen.
              </p>
            </>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Sie werden in Kürze zur Anmeldeseite weitergeleitet...
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-secondary dark:bg-gray-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary dark:text-blue-400 mb-2">
              Registrierung
            </h1>
            <p className="text-textSecondary dark:text-gray-300">
              Erstellen Sie Ihr Konto für das NFK Steuerberatungsportal
            </p>
          </div>
          
          {/* API Error */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-300">{apiError}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Section 1: Account Credentials */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                1. Zugangsdaten
              </h2>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  E-Mail <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  aria-label="E-Mail-Adresse"
                  className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    disabledFields.email ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-75' : ''
                  }`}
                  disabled={loading || disabledFields.email}
                />
                {disabledFields.email && oauthSource === 'google' && (
                  <p className="mt-1 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    E-Mail-Adresse von Ihrem Google-Konto übernommen
                  </p>
                )}
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Passwort <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('password', {
                      onChange: (e) => setPasswordValue(e.target.value),
                    })}
                    type="password"
                    id="password"
                    aria-label="Passwort"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={loading}
                  />
                  <PasswordStrengthMeter password={password || passwordValue} />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Passwort bestätigen <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    id="confirmPassword"
                    aria-label="Passwort bestätigen"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={loading}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Section 2: Client Master Data */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                2. Stammdaten
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="clientType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mandantenart <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('clientType')}
                    id="clientType"
                    aria-label="Mandantenart"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={loading}
                  >
                    <option value="Privatperson">Privatperson</option>
                    <option value="Einzelunternehmen">Einzelunternehmen</option>
                    <option value="GmbH">GmbH</option>
                    <option value="UG">UG (haftungsbeschränkt)</option>
                    <option value="GbR">GbR</option>
                  </select>
                  {errors.clientType && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.clientType.message}</p>
                  )}
                </div>
                
                {clientType !== 'Privatperson' && (
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Firmenname <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('companyName')}
                      type="text"
                      id="companyName"
                      aria-label="Firmenname"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={loading}
                    />
                    {errors.companyName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.companyName.message}</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="salutation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Anrede <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('salutation')}
                    id="salutation"
                    aria-label="Anrede"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={loading}
                  >
                    <option value="">Bitte wählen</option>
                    <option value="Herr">Herr</option>
                    <option value="Frau">Frau</option>
                    <option value="Divers">Divers</option>
                  </select>
                  {errors.salutation && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.salutation.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vorname <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    id="firstName"
                    aria-label="Vorname"
                    className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      disabledFields.firstName ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-75' : ''
                    }`}
                    disabled={loading || disabledFields.firstName}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nachname <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    id="lastName"
                    aria-label="Nachname"
                    className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      disabledFields.lastName ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-75' : ''
                    }`}
                    disabled={loading || disabledFields.lastName}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="street" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Straße und Hausnummer <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('street')}
                  type="text"
                  id="street"
                  aria-label="Straße und Hausnummer"
                  placeholder="z.B. Hauptstraße 123"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={loading}
                />
                {errors.street && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.street.message}</p>
                )}
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PLZ <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('postalCode')}
                    type="text"
                    id="postalCode"
                    aria-label="Postleitzahl"
                    placeholder="z.B. 12345"
                    maxLength={5}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={loading}
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.postalCode.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stadt <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('city')}
                    type="text"
                    id="city"
                    aria-label="Stadt"
                    placeholder="z.B. Berlin"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={loading}
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.city.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Section 3: Tax Data */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                3. Steuerdaten
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Steuer-ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('taxId')}
                    type="text"
                    id="taxId"
                    aria-label="Steueridentifikationsnummer"
                    placeholder="z.B. 12345678901"
                    maxLength={11}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">11-stellige persönliche Steuer-ID</p>
                  {errors.taxId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.taxId.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="taxNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Steuernummer
                  </label>
                  <input
                    {...register('taxNumber')}
                    type="text"
                    id="taxNumber"
                    aria-label="Steuernummer"
                    placeholder="z.B. 12/345/67890"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Betriebliche Steuernummer (optional)</p>
                  {errors.taxNumber && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.taxNumber.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="vatId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  USt-IdNr.
                </label>
                <input
                  {...register('vatId')}
                  type="text"
                  id="vatId"
                  aria-label="Umsatzsteuer-Identifikationsnummer"
                  placeholder="z.B. DE123456789"
                  maxLength={11}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={loading}
                />
                {errors.vatId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.vatId.message}</p>
                )}
              </div>
              
              {clientType !== 'Privatperson' && (
                <div>
                  <label htmlFor="commercialRegister" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Handelsregister <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('commercialRegister')}
                    type="text"
                    id="commercialRegister"
                    aria-label="Handelsregisternummer"
                    placeholder="z.B. HRB 12345"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary dark:focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={loading}
                  />
                  {errors.commercialRegister && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.commercialRegister.message}</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Section 4: Legal & Compliance */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                4. Rechtliches
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      {...register('privacyConsent')}
                      type="checkbox"
                      aria-label="Datenschutzerklärung Zustimmung"
                      className="mt-1 w-4 h-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600 rounded"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Ich habe die Datenschutzerklärung gelesen und stimme zu <span className="text-red-500">*</span>
                    </span>
                  </label>
                  {errors.privacyConsent && (
                    <p className="mt-1 ml-7 text-sm text-red-600 dark:text-red-400">{errors.privacyConsent.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      {...register('termsConsent')}
                      type="checkbox"
                      aria-label="AGB Zustimmung"
                      className="mt-1 w-4 h-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600 rounded"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Ich akzeptiere die Allgemeinen Geschäftsbedingungen <span className="text-red-500">*</span>
                    </span>
                  </label>
                  {errors.termsConsent && (
                    <p className="mt-1 ml-7 text-sm text-red-600 dark:text-red-400">{errors.termsConsent.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                className="w-full btn-primary flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    <span>Wird registriert...</span>
                  </>
                ) : (
                  'Registrierung abschließen'
                )}
              </button>
            </div>
          </form>
          
          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-textSecondary dark:text-gray-400">
            Haben Sie bereits ein Konto?{' '}
            <Link to="/auth/login" className="text-primary dark:text-blue-400 hover:underline font-medium">
              Hier anmelden
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
