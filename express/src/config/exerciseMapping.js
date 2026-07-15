// Mapping entre les noms génériques du programme et les vrais exercices de la base
const exerciseMapping = {
  // Musculation - Pectoraux
  'Musculation (poitrine, dos)': 'Développé couché',
  'Musculation (poitrine)': 'Développé couché',
  'Musculation (dos)': 'Tractions',
  'Musculation (haut du corps)': 'Développé couché',
  'Musculation (bas du corps)': 'Squats',
  'Musculation (corps entier)': 'Squats',
  'Musculation (jambes, abdos)': 'Squats',
  
  // ✅ Musculation - Épaules et Trapèzes (NOUVEAU)
  'Musculation (épaules, trapèzes)': 'Développé militaire',
  'Musculation (épaules)': 'Développé militaire',
  'Musculation (trapèzes)': 'Élévations latérales',
  
  // Musculation - Bras
  'Musculation (épaules, bras)': 'Développé militaire',
  'Musculation (pecs, triceps)': 'Développé couché',
  'Musculation (dos, biceps)': 'Tractions',
  'Musculation avancée': 'Développé couché',
  'Musculation légère': 'Pompes',
  
  // Cardio
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
  
  // HIIT
  'HIIT 15 min': 'Burpees',
  'HIIT 20 min': 'Burpees',
  'HIIT 25 min': 'Burpees',
  'HIIT 30 min': 'Burpees',
  'Circuit training': 'Burpees',
  'Circuit training léger': 'Pompes',
  'Circuit training intensif': 'Burpees',
  
  // Étirements
  'Étirements': 'Étirement des ischios',
  'Étirements 15 min': 'Étirement des ischios',
  
  // Renforcement
  'Renforcement musculaire léger': 'Pompes',
  'Renforcement': 'Pompes',
  
  // Par défaut
  'default': 'Pompes'
};

// Fonction pour mapper un nom d'exercice
const mapExerciseName = (exerciseName) => {
  // Nettoyer le nom
  const cleanName = exerciseName.split(' - ')[0].trim();
  
  // Chercher dans le mapping exact
  if (exerciseMapping[cleanName]) {
    return exerciseMapping[cleanName];
  }
  
  // Chercher par correspondance partielle
  for (const [key, value] of Object.entries(exerciseMapping)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return value;
    }
  }
  
  // Retourner le nom original si non trouvé
  return cleanName;
};

module.exports = { exerciseMapping, mapExerciseName };