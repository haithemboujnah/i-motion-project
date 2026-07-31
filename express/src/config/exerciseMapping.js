// Mapping entre les noms génériques du programme et les vrais exercices EMS de la base
const exerciseMapping = {
  // ================================================================
  // 🏋️ EXERCICES EMS - PERLE DE POIDS
  // ================================================================
  'Squat EMS': 'Squat avec électrostimulation',
  'Squat EMS - 20 min': 'Squat avec électrostimulation',
  'Squat EMS - 25 min': 'Squat avec électrostimulation',
  'Squat': 'Squat avec électrostimulation',
  'Demi-squat EMS': 'Demi-squat avec électrostimulation',
  'Demi-squat EMS - 20 min': 'Demi-squat avec électrostimulation',
  'Demi-squat': 'Demi-squat avec électrostimulation',
  'Jump Squat EMS': 'Jump squat avec électrostimulation',
  'Jump Squat EMS - 25 min': 'Jump squat avec électrostimulation',
  'Jump Squat': 'Jump squat avec électrostimulation',
  'Fente EMS': 'Fente avec électrostimulation',
  'Fente EMS - 25 min': 'Fente avec électrostimulation',
  'Fente': 'Fente avec électrostimulation',
  'Gainage EMS': 'Gainage avec électrostimulation',
  'Gainage EMS - 15 min': 'Gainage avec électrostimulation',
  'Gainage EMS - 20 min': 'Gainage avec électrostimulation',
  'Gainage': 'Gainage avec électrostimulation',
  'Bird Dog EMS': 'Bird dog avec électrostimulation',
  'Bird Dog EMS - 15 min': 'Bird dog avec électrostimulation',
  'Bird Dog': 'Bird dog avec électrostimulation',
  'Mountain Climber EMS': 'Mountain climber avec électrostimulation',
  'Mountain Climber EMS - 15 min': 'Mountain climber avec électrostimulation',
  'Mountain Climber': 'Mountain climber avec électrostimulation',
  'Crunch EMS': 'Crunch avec électrostimulation',
  'Crunch EMS - 20 min': 'Crunch avec électrostimulation',
  'Crunch': 'Crunch avec électrostimulation',
  'Russian Twist EMS': 'Russian twist avec électrostimulation',
  'Russian Twist EMS - 15 min': 'Russian twist avec électrostimulation',
  'Russian Twist EMS - 20 min': 'Russian twist avec électrostimulation',
  'Russian Twist': 'Russian twist avec électrostimulation',
  'Planche latérale EMS': 'Planche latérale avec électrostimulation',
  'Planche latérale EMS - 15 min': 'Planche latérale avec électrostimulation',
  'Planche latérale EMS - 20 min': 'Planche latérale avec électrostimulation',
  'Planche latérale': 'Planche latérale avec électrostimulation',
  'Superman EMS': 'Superman avec électrostimulation',
  'Superman EMS - 15 min': 'Superman avec électrostimulation',
  'Superman': 'Superman avec électrostimulation',
  'Pont fessier EMS': 'Pont fessier avec électrostimulation',
  'Pont fessier EMS - 15 min': 'Pont fessier avec électrostimulation',
  'Pont fessier EMS - 20 min': 'Pont fessier avec électrostimulation',
  'Pont fessier': 'Pont fessier avec électrostimulation',

  // ================================================================
  // 💪 EXERCICES GENERIQUES - PRISE DE MASSE
  // ================================================================
  'Musculation': 'Squat avec électrostimulation',
  'Musculation (poitrine, dos)': 'Développé couché',
  'Musculation (poitrine)': 'Développé couché',
  'Musculation (dos)': 'Tractions',
  'Musculation (haut du corps)': 'Développé couché',
  'Musculation (bas du corps)': 'Squat avec électrostimulation',
  'Musculation (corps entier)': 'Squat avec électrostimulation',
  'Musculation (jambes, abdos)': 'Squat avec électrostimulation',
  'Musculation (épaules, trapèzes)': 'Développé militaire',
  'Musculation (épaules)': 'Développé militaire',
  'Musculation (trapèzes)': 'Élévations latérales',
  'Musculation (épaules, bras)': 'Développé militaire',
  'Musculation (pecs, triceps)': 'Développé couché',
  'Musculation (dos, biceps)': 'Tractions',
  'Musculation avancée': 'Squat avec électrostimulation',
  'Musculation légère': 'Pompes',
  'Renforcement musculaire léger': 'Pompes',
  'Renforcement': 'Pompes',
  'Renforcement abdominal': 'Renforcement abdominal EMS',
  'Renforcement abdominal - 25 min': 'Renforcement abdominal EMS',
  'Renforcement abdominal - 30 min': 'Renforcement abdominal EMS',
  'Renforcement abdominal - 35 min': 'Renforcement abdominal EMS',
  'Renforcement lombaire': 'Renforcement lombaire EMS',
  'Renforcement lombaire - 20 min': 'Renforcement lombaire EMS',
  'Renforcement lombaire - 25 min': 'Renforcement lombaire EMS',
  'Renforcement lombaire - 30 min': 'Renforcement lombaire EMS',
  'Renforcement fessiers': 'Renforcement fessiers EMS',
  'Renforcement fessiers - 20 min': 'Renforcement fessiers EMS',
  'Renforcement fessiers - 25 min': 'Renforcement fessiers EMS',
  'Renforcement fessiers - 30 min': 'Renforcement fessiers EMS',
  'Renforcement quadriceps': 'Renforcement quadriceps EMS',
  'Renforcement quadriceps - 25 min': 'Renforcement quadriceps EMS',
  'Renforcement quadriceps - 30 min': 'Renforcement quadriceps EMS',

  // ================================================================
  // ❤️ CARDIO
  // ================================================================
  'Cardio': 'Course à pied',
  'Cardio léger': 'Course à pied',
  'Cardio modéré': 'Vélo',
  'Cardio 15 min': 'Course à pied',
  'Cardio 20 min': 'Course à pied',
  'Cardio 25 min': 'Vélo',
  'Cardio 30 min': 'Course à pied',
  'Cardio 35 min': 'Vélo',
  'Cardio 40 min': 'Course à pied',
  'Cardio 45 min': 'Course à pied',
  'Cardio 50 min': 'Vélo',
  'Cardio 60 min': 'Course à pied',
  'Course à pied': 'Course à pied',
  'Vélo': 'Vélo',

  // ================================================================
  // 🔥 HIIT
  // ================================================================
  'HIIT': 'Burpees',
  'HIIT 15 min': 'Burpees',
  'HIIT 20 min': 'Burpees',
  'HIIT 25 min': 'Burpees',
  'HIIT 30 min': 'Burpees',
  'Circuit training': 'Burpees',
  'Circuit training léger': 'Pompes',
  'Circuit training intensif': 'Burpees',
  'Burpees': 'Burpees',

  // ================================================================
  // 🧘 ÉTIREMENTS
  // ================================================================
  'Étirements': 'Étirement des ischios',
  'Étirements 15 min': 'Étirement des ischios',
  'Étirement des ischios': 'Étirement des ischios',

  // ================================================================
  // ⭐ MODELAGE & RAFFERMISSEMENT
  // ================================================================
  'Drainage lymphatique': 'Drainage lymphatique EMS',
  'Drainage lymphatique - 25 min': 'Drainage lymphatique EMS',
  'Drainage lymphatique - 30 min': 'Drainage lymphatique EMS',
  'Drainage lymphatique - 35 min': 'Drainage lymphatique EMS',
  'Raffermissement des cuisses': 'Raffermissement des cuisses EMS',
  'Raffermissement des cuisses - 20 min': 'Raffermissement des cuisses EMS',
  'Raffermissement des cuisses - 25 min': 'Raffermissement des cuisses EMS',
  'Raffermissement des cuisses - 30 min': 'Raffermissement des cuisses EMS',
  'Raffermissement des fessiers': 'Raffermissement des fessiers EMS',
  'Raffermissement des fessiers - 25 min': 'Raffermissement des fessiers EMS',
  'Raffermissement des fessiers - 30 min': 'Raffermissement des fessiers EMS',
  'Raffermissement des fessiers - 35 min': 'Raffermissement des fessiers EMS',
  'Réduction de la cellulite': 'Réduction de la cellulite EMS',
  'Réduction de la cellulite - 20 min': 'Réduction de la cellulite EMS',
  'Réduction de la cellulite - 25 min': 'Réduction de la cellulite EMS',
  'Raffermissement des bras': 'Raffermissement des bras EMS',
  'Raffermissement des bras - 25 min': 'Raffermissement des bras EMS',
  'Raffermissement des bras - 30 min': 'Raffermissement des bras EMS',

  // ================================================================
  // ✨ LIFTING NATUREL & ANTI-ÂGE
  // ================================================================
  'Raffermissement du front': 'Raffermissement du front EMS',
  'Raffermissement du front - 25 min': 'Raffermissement du front EMS',
  'Raffermissement du front - 30 min': 'Raffermissement du front EMS',
  'Raffermissement du front - 35 min': 'Raffermissement du front EMS',
  'Tonification des joues': 'Tonification des joues EMS',
  'Tonification des joues - 20 min': 'Tonification des joues EMS',
  'Tonification des joues - 25 min': 'Tonification des joues EMS',
  'Raffermissement du cou': 'Raffermissement du cou EMS',
  'Raffermissement du cou - 25 min': 'Raffermissement du cou EMS',
  'Raffermissement du cou - 30 min': 'Raffermissement du cou EMS',
  'Raffermissement du cou - 35 min': 'Raffermissement du cou EMS',
  'Stimulation du collagène': 'Stimulation du collagène EMS',
  'Stimulation du collagène - 20 min': 'Stimulation du collagène EMS',
  'Stimulation du collagène - 25 min': 'Stimulation du collagène EMS',
  'Stimulation du collagène - 30 min': 'Stimulation du collagène EMS',
  'Stimulation du collagène - 35 min': 'Stimulation du collagène EMS',

  // ================================================================
  // 📋 FALLBACK - Si aucun mapping trouvé
  // ================================================================
  'default': 'Squat avec électrostimulation'
};

/**
 * Fonction pour mapper un nom d'exercice vers le nom de la base de données
 * @param {string} exerciseName - Nom de l'exercice depuis le programme
 * @returns {string} - Nom de l'exercice dans la base de données
 */
const mapExerciseName = (exerciseName) => {
  if (!exerciseName) return 'Squat avec électrostimulation';
  
  // Nettoyer le nom
  let cleanName = exerciseName.trim();
  
  // ✅ Chercher dans le mapping exact
  if (exerciseMapping[cleanName]) {
    return exerciseMapping[cleanName];
  }
  
  // ✅ Vérifier si le nom contient "EMS" ou "électrostimulation"
  if (cleanName.includes('EMS') || cleanName.includes('électrostimulation')) {
    return cleanName;
  }
  
  // ✅ Chercher par correspondance partielle (plus permissif)
  for (const [key, value] of Object.entries(exerciseMapping)) {
    if (key !== 'default' && (
      cleanName.toLowerCase().includes(key.toLowerCase()) || 
      key.toLowerCase().includes(cleanName.toLowerCase())
    )) {
      return value;
    }
  }
  
  // ✅ Si le nom contient des mots-clés spécifiques
  const emsKeywords = ['Squat', 'Fente', 'Gainage', 'Crunch', 'Superman', 'Pont fessier', 
                       'Bird Dog', 'Mountain Climber', 'Russian Twist', 'Planche latérale',
                       'Drainage', 'Raffermissement', 'Renforcement', 'Stimulation', 'Tonification',
                       'Musculation', 'Cardio', 'HIIT', 'Circuit', 'Étirement', 'Burpees',
                       'Course', 'Vélo', 'Pompes', 'Tractions', 'Développé'];
  
  for (const keyword of emsKeywords) {
    if (cleanName.toLowerCase().includes(keyword.toLowerCase())) {
      // Si c'est un exercice de musculation générique, retourner un EMS
      if (keyword === 'Musculation' || keyword === 'Cardio' || keyword === 'HIIT') {
        return 'Squat avec électrostimulation';
      }
      return `${keyword} avec électrostimulation`;
    }
  }
  
  // ✅ Retourner le nom original si non trouvé
  console.warn(`⚠️ Exercice non mappé: "${exerciseName}" → utilisation du nom original`);
  return cleanName;
};

/**
 * Récupère les détails d'un exercice à partir de son nom mappé
 * @param {string} exerciseName - Nom de l'exercice
 * @param {Object} exerciseDB - Base de données des exercices
 * @returns {Object} - Détails de l'exercice
 */
const getExerciseDetails = (exerciseName, exerciseDB = {}) => {
  const mappedName = mapExerciseName(exerciseName);
  
  // Si l'exercice existe dans la base, retourner ses détails
  if (exerciseDB[mappedName]) {
    return {
      ...exerciseDB[mappedName],
      mapped_from: exerciseName,
      original_name: mappedName
    };
  }
  
  // Sinon, retourner un exercice par défaut
  return {
    name: mappedName,
    description: 'Exercice EMS personnalisé',
    category: 'ems',
    difficulty: 'intermediaire',
    duration: 30,
    image_url: '/exercises/ems-default.jpg',
    instructions: 'Suivre les consignes du coach EMS',
    calories_per_minute: 5.5,
    mapped_from: exerciseName,
    original_name: mappedName
  };
};

module.exports = { 
  exerciseMapping, 
  mapExerciseName,
  getExerciseDetails
};