const PDFDocument = require('pdfkit');

class PDFService {
  constructor() {
    this.colors = {
      primary: '#57a1ce',
      secondary: '#afadb3',
      success: '#22c55e',
      warning: '#f59e0b',
      danger: '#ef4444',
      dark: '#1e293b',
      gray: '#64748b',
      lightGray: '#f1f5f9',
      white: '#ffffff'
    };
  }

  // ✅ Générer un rapport de performance complet
  async generatePerformanceReport(user, profile, stats, measurements, sessions, badges) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
          info: {
            Title: 'Rapport de Performance I-Motion',
            Author: 'I-Motion',
            Subject: 'Suivi des performances sportives'
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // PAGE 1
        this.addHeader(doc);
        this.addUserInfo(doc, user, profile);
        this.addStatsOverview(doc, stats, measurements);
        this.addProgressChart(doc, measurements);
        this.addFooter(doc);

        // PAGE 2
        doc.addPage();
        this.addMeasurementsTable(doc, measurements);
        this.addBadgesSection(doc, badges);
        this.addGoalsSection(doc, profile);
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  addHeader(doc) {
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .fillColor(this.colors.primary)
       .text('I-Motion', { align: 'center' });
    
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor(this.colors.dark)
       .text('Rapport de Performance', { align: 'center' });
    
    doc.moveDown(0.5);
    
    doc.strokeColor(this.colors.primary)
       .lineWidth(2)
       .moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .stroke();
    
    doc.moveDown(0.5);
  }

  addUserInfo(doc, user, profile) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(this.colors.dark)
       .text('Informations personnelles');
    
    doc.moveDown(0.5);
    
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(this.colors.gray);
    
    const infoY = doc.y;
    const leftCol = 50;
    const rightCol = 280;
    
    doc.text(`Adherent: ${user.first_name} ${user.last_name}`, leftCol, infoY);
    doc.text(`Email: ${user.email}`, leftCol, infoY + 20);
    doc.text(`Membre depuis: ${new Date(user.created_at).toLocaleDateString('fr-FR')}`, leftCol, infoY + 40);
    doc.text(`Genere le: ${new Date().toLocaleDateString('fr-FR')}`, leftCol, infoY + 60);
    
    doc.text(`Age: ${profile?.age || 'Non renseigne'} ans`, rightCol, infoY);
    doc.text(`Poids: ${profile?.weight || 'Non renseigne'} kg`, rightCol, infoY + 20);
    doc.text(`Taille: ${profile?.height || 'Non renseigne'} cm`, rightCol, infoY + 40);
    doc.text(`Objectif: ${this.getGoalLabel(profile?.goal)}`, rightCol, infoY + 60);
    
    doc.moveDown(3);
  }

  addStatsOverview(doc, stats, measurements) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(this.colors.dark)
       .text('Statistiques generales');
    
    doc.moveDown(0.5);
    
    const currentWeight = stats?.current_weight || 'N/A';
    const initialWeight = stats?.initial_weight || 'N/A';
    const weightLoss = initialWeight !== 'N/A' && currentWeight !== 'N/A' 
      ? (initialWeight - currentWeight).toFixed(2) 
      : 'N/A';
    
    const statsData = [
      { label: 'Poids initial', value: `${initialWeight} kg` },
      { label: 'Poids actuel', value: `${currentWeight} kg` },
      { label: 'Evolution', value: `${weightLoss} kg` },
      { label: 'Mesures', value: measurements?.length || 0 },
      { label: 'Seances', value: stats?.total_sessions || 0 },
      { label: 'Assiduite', value: `${stats?.attendance_rate || 0}%` }
    ];
    
    const tableTop = doc.y;
    const rowHeight = 30;
    
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor(this.colors.dark);
    
    const headers = ['Indicateur', 'Valeur', 'Progression'];
    const headerX = [50, 180, 330];
    
    headers.forEach((header, i) => {
      doc.text(header, headerX[i], tableTop);
    });
    
    doc.moveDown(0.5);
    
    doc.strokeColor(this.colors.lightGray)
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .stroke();
    
    doc.moveDown(0.5);
    
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor(this.colors.gray);
    
    statsData.forEach((stat) => {
      const y = doc.y;
      doc.text(stat.label, 50, y);
      doc.text(stat.value.toString(), 180, y);
      
      if (stat.label === 'Assiduite') {
        const rate = parseInt(stat.value);
        const barWidth = 120;
        const barHeight = 8;
        const barX = 330;
        const barY = y + 4;
        
        doc.rect(barX, barY, barWidth, barHeight)
           .fill(this.colors.lightGray);
        
        doc.rect(barX, barY, (rate / 100) * barWidth, barHeight)
           .fill(rate > 70 ? this.colors.success : 
                 rate > 40 ? this.colors.warning : 
                 this.colors.danger);
        
        doc.fillColor(this.colors.gray)
           .text(`${rate}%`, barX + barWidth + 10, y);
      } else if (stat.label === 'Evolution') {
        const value = parseFloat(stat.value);
        const color = value > 0 ? this.colors.success : 
                      value < 0 ? this.colors.danger : 
                      this.colors.gray;
        doc.fillColor(color)
           .text(`${value > 0 ? '+' : ''}${value} kg`, 330, y);
      } else {
        doc.fillColor(this.colors.gray)
           .text('—', 330, y);
      }
      
      doc.moveDown(0.8);
    });
    
    doc.moveDown(1);
  }

  addProgressChart(doc, measurements) {
    if (!measurements || measurements.length < 2) {
      doc.fontSize(11)
         .fillColor(this.colors.gray)
         .text('Pas assez de donnees pour afficher l evolution');
      doc.moveDown(1);
      return;
    }
    
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(this.colors.dark)
       .text('Evolution du poids');
    
    doc.moveDown(0.5);
    
    const sortedData = [...measurements].sort((a, b) => 
      new Date(a.measured_at) - new Date(b.measured_at)
    );
    
    const maxWeight = Math.max(...sortedData.map(m => m.weight));
    const minWeight = Math.min(...sortedData.map(m => m.weight));
    const range = maxWeight - minWeight || 1;
    
    const graphWidth = 450;
    const graphHeight = 120;
    const graphX = 50;
    const graphY = doc.y + 10;
    
    // Fond du graphique
    doc.rect(graphX, graphY, graphWidth, graphHeight)
       .fill(this.colors.lightGray);
    
    // Grille
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = graphY + (i / gridLines) * graphHeight;
      const value = maxWeight - (i / gridLines) * range;
      
      doc.strokeColor('#e5e7eb')
         .lineWidth(0.5)
         .moveTo(graphX, y)
         .lineTo(graphX + graphWidth, y)
         .stroke();
      
      doc.fontSize(8)
         .fillColor(this.colors.gray)
         .text(value.toFixed(1), graphX - 25, y - 4);
    }
    
    const points = sortedData.slice(0, 15);
    const step = graphWidth / (points.length - 1 || 1);
    
    const areaPoints = points.map((m, i) => {
      const x = graphX + i * step;
      const y = graphY + graphHeight - ((m.weight - minWeight) / range) * graphHeight;
      return { x, y };
    });
    
    doc.moveTo(areaPoints[0].x, areaPoints[0].y);
    for (let i = 1; i < areaPoints.length; i++) {
      const prev = areaPoints[i - 1];
      const curr = areaPoints[i];
      const cpX = (prev.x + curr.x) / 2;
      doc.quadraticCurveTo(cpX, prev.y, curr.x, curr.y);
    }
    doc.strokeColor(this.colors.primary)
       .lineWidth(3)
       .stroke();
    
    areaPoints.forEach((point, i) => {
      doc.circle(point.x, point.y, 3)
         .fill(this.colors.primary);
      
      const date = new Date(points[i].measured_at);
      doc.fontSize(7)
         .fillColor(this.colors.gray)
         .text(
           date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
           point.x - 15,
           graphY + graphHeight + 5
         );
    });
    
    doc.moveDown(8);
  }

  addMeasurementsTable(doc, measurements) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(this.colors.dark)
       .text('Historique des mesures');
    
    doc.moveDown(0.5);
    
    if (!measurements || measurements.length === 0) {
      doc.fontSize(11)
         .fillColor(this.colors.gray)
         .text('Aucune mesure enregistree');
      doc.moveDown(1);
      return;
    }
    
    const tableTop = doc.y;
    const rowHeight = 22;
    const headers = ['Date', 'Poids (kg)', 'Masse grasse (%)', 'Muscle (kg)'];
    const colWidths = [120, 100, 120, 100];
    
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor(this.colors.dark);
    
    let colX = 50;
    headers.forEach((header, i) => {
      doc.text(header, colX, tableTop);
      colX += colWidths[i];
    });
    
    doc.moveDown(0.5);
    doc.strokeColor(this.colors.lightGray)
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .stroke();
    doc.moveDown(0.5);
    
    doc.font('Helvetica')
       .fontSize(9)
       .fillColor(this.colors.gray);
    
    const recentMeasurements = measurements.slice(0, 15);
    let currentY = doc.y;
    
    recentMeasurements.forEach((m, index) => {
      const y = currentY + index * rowHeight;
      if (y > 700) {
        doc.addPage();
        currentY = 50;
      }
      
      colX = 50;
      const date = new Date(m.measured_at);
      doc.text(date.toLocaleDateString('fr-FR'), colX, y);
      colX += colWidths[0];
      doc.text(m.weight?.toString() || '-', colX, y);
      colX += colWidths[1];
      doc.text(m.body_fat?.toString() || '-', colX, y);
      colX += colWidths[2];
      doc.text(m.muscle_mass?.toString() || '-', colX, y);
    });
    
    doc.moveDown(recentMeasurements.length + 1);
  }

  // ✅ SECTION BADGES CORRIGÉE (SANS ICÔNES PROBLÉMATIQUES)
  addBadgesSection(doc, badges) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(this.colors.dark)
       .text('Badges debloques');
    
    doc.moveDown(0.5);
    
    if (!badges || badges.length === 0) {
      doc.fontSize(11)
         .fillColor(this.colors.gray)
         .text('Aucun badge debloque pour le moment');
      doc.moveDown(1);
      return;
    }
    
    // ✅ Format simplifié en liste
    const sortedBadges = [...badges].sort((a, b) => 
      (a.points_required || 0) - (b.points_required || 0)
    );
    
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor(this.colors.gray);
    
    sortedBadges.forEach((badge, index) => {
      const y = doc.y;
      const badgeName = badge.name || 'Badge';
      const points = badge.points_required || 0;
      
      // Numéro
      doc.fillColor(this.colors.gray)
         .text(`${index + 1}.`, 50, y);
      
      // Nom du badge
      doc.fillColor(this.colors.dark)
         .font('Helvetica-Bold')
         .text(badgeName, 70, y);
      
      // Points
      doc.fillColor(this.colors.primary)
         .font('Helvetica')
         .text(`${points} pts`, 280, y);
      
      // Description si disponible
      if (badge.description) {
        doc.fillColor(this.colors.gray)
           .fontSize(8)
           .text(badge.description, 70, y + 14);
      }
      
      doc.moveDown(1.2);
    });
    
    doc.moveDown(0.5);
  }

  addGoalsSection(doc, profile) {
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(this.colors.dark)
       .text('Objectifs et recommandations');
    
    doc.moveDown(0.5);
    
    const goals = {
      'perte_de_poids': 'Continuer a maintenir un deficit calorique et augmenter l activite cardio.',
      'prise_de_masse': 'Augmenter l apport proteique et la charge en musculation.',
      'remise_en_forme': 'Continuer les seances regulieres et varier les exercices.'
    };
    
    const goalLabels = {
      'perte_de_poids': 'Perte de poids',
      'prise_de_masse': 'Prise de masse',
      'remise_en_forme': 'Remise en forme'
    };
    
    const levelLabels = {
      'debutant': 'Debutant',
      'intermediaire': 'Intermediaire',
      'avance': 'Avance'
    };
    
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(this.colors.gray);
    
    const y = doc.y;
    doc.text(`Objectif actuel: ${goalLabels[profile?.goal] || 'Non defini'}`, 50, y);
    doc.text(`Niveau: ${levelLabels[profile?.level] || 'Non defini'}`, 280, y);
    doc.text(`Recommandation: ${goals[profile?.goal] || 'Continuer vos efforts !'}`, 50, y + 20);
    
    doc.moveDown(3);
  }

  addFooter(doc) {
    const pageHeight = doc.page.height;
    const bottom = pageHeight - 50;
    
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor(this.colors.gray);
    
    doc.text('Rapport genere automatiquement par I-Motion', 50, bottom, { align: 'center' });
    doc.text(`© ${new Date().getFullYear()} I-Motion - Tous droits reserves`, 50, bottom + 15, { align: 'center' });
  }

  getGoalLabel(goal) {
    const labels = {
      'perte_de_poids': 'Perte de poids',
      'prise_de_masse': 'Prise de masse',
      'remise_en_forme': 'Remise en forme'
    };
    return labels[goal] || 'Non defini';
  }
}

module.exports = new PDFService();