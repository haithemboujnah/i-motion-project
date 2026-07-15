export const checkEnv = () => {
  const required = [
    'REACT_APP_STRIPE_PUBLISHABLE_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    console.warn('⚠️ Please check your .env file');
    return false;
  }
  
  console.log('✅ All environment variables are set');
  return true;
};