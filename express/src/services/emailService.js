const { sendEmail } = require('../config/email');
const { 
  getPasswordResetTemplate, 
  getWelcomeTemplate, 
  getSessionReminderTemplate 
} = require('./emailTemplates');

class EmailService {
  // ✅ Envoyer un email de réinitialisation de mot de passe
  static async sendPasswordReset(user, resetToken) {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const html = getPasswordResetTemplate(user.first_name, resetLink);
    const text = `Bonjour ${user.first_name},\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nCliquez sur ce lien pour créer un nouveau mot de passe : ${resetLink}\n\nCe lien est valable pendant 1 heure.\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\nCordialement,\nL'équipe I-Motion`;
    
    return await sendEmail({
      to: user.email,
      subject: '🔑 Réinitialisation de votre mot de passe - I-Motion',
      html,
      text
    });
  }

  // ✅ Envoyer un email de bienvenue
  static async sendWelcome(user) {
    const html = getWelcomeTemplate(user.first_name);
    const text = `Bienvenue ${user.first_name} !\n\nVotre compte a été créé avec succès sur I-Motion.\n\nConnectez-vous pour découvrir toutes nos fonctionnalités : ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login\n\nCordialement,\nL'équipe I-Motion`;
    
    return await sendEmail({
      to: user.email,
      subject: '🎉 Bienvenue sur I-Motion !',
      html,
      text
    });
  }

  // ✅ Envoyer un rappel de séance
  static async sendSessionReminder(user, session) {
    const html = getSessionReminderTemplate(user.first_name, session);
    const text = `Bonjour ${user.first_name},\n\nRappel : Vous avez une séance prévue le ${session.date} à ${session.time}.\n\nType : ${session.type || 'Séance'}${session.coach_name ? `\nCoach : ${session.coach_name}` : ''}\n\nCordialement,\nL'équipe I-Motion`;
    
    return await sendEmail({
      to: user.email,
      subject: `⏰ Rappel de séance - ${session.date}`,
      html,
      text
    });
  }

  // ✅ Envoyer un email de notification de badge
  static async sendBadgeNotification(user, badge) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #57a1ce 0%, #afadb3 100%); padding: 20px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { padding: 30px; text-align: center; }
          .badge { font-size: 80px; display: block; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏋️ I-Motion</h1>
          </div>
          <div class="content">
            <h2>Félicitations ${user.first_name} ! 🎉</h2>
            <div class="badge">${badge.icon || '🏆'}</div>
            <h3>Vous avez débloqué le badge : ${badge.name}</h3>
            <p style="color: #666;">${badge.description}</p>
            <p style="text-align: center; margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/gamification" style="color: #57a1ce; font-weight: bold;">
                Voir mes badges →
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
    
    const text = `Félicitations ${user.first_name} !\n\nVous avez débloqué le badge : ${badge.name}\n${badge.description}\n\nCordialement,\nL'équipe I-Motion`;
    
    return await sendEmail({
      to: user.email,
      subject: `🏆 Nouveau badge débloqué : ${badge.name}`,
      html,
      text
    });
  }
}

module.exports = EmailService;