import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import random from "random";

// ========== CONFIGURATION ==========
const CONFIG = {
  // Number of commits to generate
  numberOfCommits: 500,
  
  // Commit generation period
  startDate: {
    years: 2,    // How many years ago to start
    months: 0,   // Additional months
    days: 1      // Additional days (recommended: 1 to avoid timezone issues)
  },
  
  // Limit into the future (to avoid future-dated commits)
  maxFutureDate: {
    days: 0      // 0 = today, 1 = tomorrow, etc. (recommended: 0)
  },
  
  // Weekend settings (for more realistic rendering)
  weekends: {
    exclude: true,           // Exclude weekends generally
    rareCommitChance: 5      // % chance to commit on weekends (0-100)
  },
  
  // Commit intensity per day (to vary the green)
  dailyIntensity: {
    min: 1,                  // Minimum commits per selected day
    max: 8,                  // Maximum commits per selected day
    lightDays: 60,           // % of days with few commits (1-3)
    mediumDays: 30,          // % of days with medium commits (4-6)
    heavyDays: 10            // % of days with many commits (7-8+)
  },
  
  // JSON data file to be used for modifications
  dataFile: "./data.json"
};
// ===================================

const path = CONFIG.dataFile;

// Function to check if it's a weekend
const isWeekend = (date) => {
  const dayOfWeek = moment(date).day();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
};

// Function to determine the commit intensity for a day
const getDailyCommitCount = () => {
  const rand = random.int(1, 100);
  
  if (rand <= CONFIG.dailyIntensity.lightDays) {
    // Light day: 1-3 commits
    return random.int(CONFIG.dailyIntensity.min, Math.min(3, CONFIG.dailyIntensity.max));
  } else if (rand <= CONFIG.dailyIntensity.lightDays + CONFIG.dailyIntensity.mediumDays) {
    // Medium day: 4-6 commits
    return random.int(4, Math.min(6, CONFIG.dailyIntensity.max));
  } else {
    // Heavy day: 7+ commits
    return random.int(7, CONFIG.dailyIntensity.max);
  }
};

// Function to generate a valid date (excluding weekends if configured)
const generateValidDate = (startDate, maxDate) => {
  let attempts = 0;
  const maxAttempts = 100; // Avoid infinite loop
  
  while (attempts < maxAttempts) {
    const totalDays = maxDate.diff(startDate, 'days');
    const randomDays = random.int(0, totalDays);
    const date = moment(startDate).add(randomDays, 'days');
    
    // If weekends are not excluded, return the
    if (!CONFIG.weekends.exclude) {
      return date;
    }
    
    // If it's a weekend, check for rare commit chance
    if (isWeekend(date)) {
      const chanceRoll = random.int(1, 100);
      if (chanceRoll <= CONFIG.weekends.rareCommitChance) {
      return date; // Rare commit on weekend
      }
    } else {
      return date; // Weekday, OK
    }
    attempts++;
  }
  
  // Fallback: return a random weekday date
  const totalDays = maxDate.diff(startDate, 'days');
  const randomDays = random.int(0, totalDays);
  return moment(startDate).add(randomDays, 'days');
};


const makeCommits = (n) => {
  if(n===0) return simpleGit().push();
  
  const startDate = moment()
    .subtract(CONFIG.startDate.years, "y")
    .subtract(CONFIG.startDate.months, "M")
    .add(CONFIG.startDate.days, "d");
  
  const maxDate = moment().add(CONFIG.maxFutureDate.days, "d");
  
  // Générer une date valide (respectant les weekends) valid date (respecting weekends)
  const selectedDate = generateValidDate(moment(startDate), moment(maxDate));
  
  // Determine the intensity for this day
  const commitsForDay = getDailyCommitCount();
  
  // Generate multiple commits for this day (with different times)
  let commitsCompleted = 0;
  const makeMultipleCommits = () => {
    if (commitsCompleted >= commitsForDay || n <= 0) {
      // Move to the next day
      return makeCommits(n);
    }
    
    // Add a random hour variation in the day
    const hourVariation = random.int(0, 23);
    const minuteVariation = random.int(0, 59);
    const dateWithTime = moment(selectedDate)
      .hour(hourVariation)
      .minute(minuteVariation)
      .format();

    const data = {
      date: dateWithTime,
    };
    
    console.log(`Commit ${commitsCompleted + 1}/${commitsForDay} for ${selectedDate.format('YYYY-MM-DD')} - ${dateWithTime}`);
    
    jsonfile.writeFile(path, data, () => {
      simpleGit().add([path]).commit(dateWithTime, { "--date": dateWithTime }, () => {
        commitsCompleted++;
        n--;
        makeMultipleCommits();
      });
    });
  };
  
  makeMultipleCommits();
};

makeCommits(CONFIG.numberOfCommits);
