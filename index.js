import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import random from "random";

// ========== CONFIGURATION ==========
const CONFIG = {
  // Number of commits to generate
  numberOfCommits: 300,
  
  // Commit generation period
  startDate: {
    years: 1,    // How many years ago to start
    months: 0,   // Additional months
    days: 1      // Additional days (recommended: 1 to avoid timezone issues)
  },
  
  // Limit into the future (to avoid future-dated commits)
  maxFutureDate: {
    days: 0      // 0 = today, 1 = tomorrow, etc. (recommended: 0)
  },
  
  // Weekend settings (pour un rendu plus réaliste)
  weekends: {
    exclude: true,           // Exclure les weekends généralement
    rareCommitChance: 5      // % de chance de commit le weekend (0-100)
  },
  
  // Intensité des commits par jour (pour varier le vert)
  dailyIntensity: {
    min: 1,                  // Minimum de commits par jour sélectionné
    max: 8,                  // Maximum de commits par jour sélectionné
    lightDays: 60,           // % de jours avec peu de commits (1-3)
    mediumDays: 30,          // % de jours avec commits moyens (4-6)
    heavyDays: 10            // % de jours avec beaucoup de commits (7-8+)
  },
  
  // JSON data file to be used for modifications
  dataFile: "./data.json"
};
// ===================================

const path = CONFIG.dataFile;

// Fonction pour vérifier si c'est un weekend
const isWeekend = (date) => {
  const dayOfWeek = moment(date).day();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = dimanche, 6 = samedi
};

// Fonction pour déterminer l'intensité des commits pour un jour
const getDailyCommitCount = () => {
  const rand = random.int(1, 100);
  
  if (rand <= CONFIG.dailyIntensity.lightDays) {
    // Jour léger : 1-3 commits
    return random.int(CONFIG.dailyIntensity.min, Math.min(3, CONFIG.dailyIntensity.max));
  } else if (rand <= CONFIG.dailyIntensity.lightDays + CONFIG.dailyIntensity.mediumDays) {
    // Jour moyen : 4-6 commits
    return random.int(4, Math.min(6, CONFIG.dailyIntensity.max));
  } else {
    // Jour intense : 7+ commits
    return random.int(7, CONFIG.dailyIntensity.max);
  }
};

// Fonction pour générer une date valide (excluant weekends si configuré)
const generateValidDate = (startDate, maxDate) => {
  let attempts = 0;
  const maxAttempts = 100; // Éviter boucle infinie
  
  while (attempts < maxAttempts) {
    const totalDays = maxDate.diff(startDate, 'days');
    const randomDays = random.int(0, totalDays);
    const date = moment(startDate).add(randomDays, 'days');
    
    // Si les weekends ne sont pas exclus, retourner la date
    if (!CONFIG.weekends.exclude) {
      return date;
    }
    
    // Si c'est un weekend, vérifier la chance rare
    if (isWeekend(date)) {
      const chanceRoll = random.int(1, 100);
      if (chanceRoll <= CONFIG.weekends.rareCommitChance) {
        return date; // Commit rare le weekend
      }
    } else {
      return date; // Jour de semaine, OK
    }
    
    attempts++;
  }
  
  // Fallback : retourner une date de semaine aléatoire
  const totalDays = maxDate.diff(startDate, 'days');
  const randomDays = random.int(0, totalDays);
  return moment(startDate).add(randomDays, 'days');
};

const markCommit = (x, y) => {
  const date = moment()
    .subtract(1, "y")
    .add(1, "d")
    .add(x, "w")
    .add(y, "d")
    .format();

  const data = {
    date: date,
  };

  jsonfile.writeFile(path, data, () => {
    simpleGit().add([path]).commit(date, { "--date": date }).push();
  });
};

const makeCommits = (n) => {
  if(n===0) return simpleGit().push();
  
  const startDate = moment()
    .subtract(CONFIG.startDate.years, "y")
    .subtract(CONFIG.startDate.months, "M")
    .add(CONFIG.startDate.days, "d");
  
  const maxDate = moment().add(CONFIG.maxFutureDate.days, "d");
  
  const totalDays = maxDate.diff(startDate, 'days');
  
  const randomDays = random.int(0, totalDays);
  
  const date = startDate.add(randomDays, 'days').format();

  const data = {
    date: date,
  };
  console.log(date);
  jsonfile.writeFile(path, data, () => {
    simpleGit().add([path]).commit(date, { "--date": date },makeCommits.bind(this,--n));
  });
};

makeCommits(CONFIG.numberOfCommits);
