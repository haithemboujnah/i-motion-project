// Template de réinitialisation de mot de passe
const getPasswordResetTemplate = (userName, resetLink) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #57a1ce 0%, #afadb3 100%);
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 30px;
    }
    .content h2 {
      color: #333;
      margin-top: 0;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #57a1ce 0%, #afadb3 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 20px 0;
    }
    .button:hover {
      opacity: 0.9;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #999;
      font-size: 12px;
      border-top: 1px solid #eee;
    }
    .info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏋️ I-Motion</h1>
    </div>
    <div class="content">
      <h2>Bonjour ${userName},</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
      </div>
      <div class="info">
        <p>🔒 Ce lien est valable pendant 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      </div>
      <p style="color: #666; font-size: 14px;">
        Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
        <a href="${resetLink}" style="color: #57a1ce; word-break: break-all;">${resetLink}</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} I-Motion - Tous droits réservés</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
`;

// Template de confirmation d'inscription
const getWelcomeTemplate = (userName) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #57a1ce 0%, #afadb3 100%);
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 30px;
    }
    .features {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 20px 0;
    }
    .feature {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      text-align: center;
    }
    .feature span {
      font-size: 24px;
      display: block;
      margin-bottom: 5px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #999;
      font-size: 12px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏋️ I-Motion</h1>
    </div>
    <div class="content">
      <h2>Bienvenue ${userName} ! 🎉</h2>
      <p>Votre compte a été créé avec succès sur I-Motion.</p>
      <p>Vous pouvez dès maintenant :</p>
      <div class="features">
        <div class="feature">
          <span>📅</span>
          <strong>Réserver des séances</strong>
          <p style="margin: 5px 0 0; font-size: 12px; color: #666;">Planifiez vos entraînements</p>
        </div>
        <div class="feature">
          <span>📊</span>
          <strong>Suivre vos performances</strong>
          <p style="margin: 5px 0 0; font-size: 12px; color: #666;">Visualisez votre progression</p>
        </div>
        <div class="feature">
          <span>💪</span>
          <strong>Programmes personnalisés</strong>
          <p style="margin: 5px 0 0; font-size: 12px; color: #666;">Générés par IA</p>
        </div>
        <div class="feature">
          <span>🏆</span>
          <strong>Gamification</strong>
          <p style="margin: 5px 0 0; font-size: 12px; color: #666;">Gagnez des points et badges</p>
        </div>
      </div>
      <p style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="color: #57a1ce; font-weight: bold;">
          Accéder à mon espace →
        </a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} I-Motion - Tous droits réservés</p>
    </div>
  </div>
</body>
</html>
`;

// Template de notification de séance
const getSessionReminderTemplate = (userName, session) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #57a1ce 0%, #afadb3 100%);
      padding: 20px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px;
    }
    .session-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
    }
    .session-info p {
      margin: 5px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #999;
      font-size: 12px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏋️ I-Motion</h1>
    </div>
    <div class="content">
      <h2>Bonjour ${userName},</h2>
      <p>⏰ Rappel : Vous avez une séance prévue !</p>
      <div class="session-info">
        <p><strong>📅 Date :</strong> ${session.date}</p>
        <p><strong>⏰ Heure :</strong> ${session.time}</p>
        <p><strong>🏋️ Type :</strong> ${session.type || 'Séance'}</p>
        ${session.coach_name ? `<p><strong>👨‍🏫 Coach :</strong> ${session.coach_name}</p>` : ''}
      </div>
      <p style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/sessions" style="color: #57a1ce; font-weight: bold;">
          Voir mes séances →
        </a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} I-Motion - Tous droits réservés</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = {
  getPasswordResetTemplate,
  getWelcomeTemplate,
  getSessionReminderTemplate
};