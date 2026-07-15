// ✅ Formater une date pour l'affichage
export const formatDate = (dateString) => {
  if (!dateString) return 'Date inconnue';
  
  const date = new Date(dateString);
  
  // Vérifier si la date est valide
  if (isNaN(date.getTime())) return 'Date invalide';
  
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// ✅ Formater une date avec l'heure
export const formatDateTime = (dateString) => {
  if (!dateString) return 'Date inconnue';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'Date invalide';
  
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ✅ Formater une heure (pour l'affichage des séances)
export const formatTime = (timeString) => {
  if (!timeString) return 'Heure inconnue';
  
  // Si c'est déjà une heure formatée (HH:MM:SS)
  if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return timeString.substring(0, 5);
  }
  
  try {
    const date = new Date(`2000-01-01T${timeString}`);
    if (isNaN(date.getTime())) return timeString.substring(0, 5);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return timeString.substring(0, 5);
  }
};

// ✅ Formater une date pour l'affichage des séances
export const formatSessionDate = (dateString) => {
  if (!dateString) return 'Date inconnue';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Date invalide';
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Si c'est aujourd'hui
  if (date.toDateString() === today.toDateString()) {
    return "Aujourd'hui";
  }
  
  // Si c'est demain
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Demain';
  }
  
  // Sinon afficher la date complète
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// ✅ Formater une date avec le jour de la semaine
export const formatDateWithDay = (dateString) => {
  if (!dateString) return 'Date inconnue';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Date invalide';
  
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  
  return `${days[date.getDay()]} ${date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })}`;
};

// ✅ Formater une durée en minutes en format lisible
export const formatDuration = (minutes) => {
  if (!minutes) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0 && mins > 0) {
    return `${hours}h${mins}`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins} min`;
  }
};