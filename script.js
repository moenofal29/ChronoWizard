/* ==========================================
   CHRONOWIZARD — SHARED SITE SCRIPT
   ========================================== */

// WEBSITE SETTINGS
const websiteLink = "https://chronowizard.com/calculator/";

const weekdays = [
  "Monday", "Tuesday", "Wednesday", "Thursday",
  "Friday", "Saturday", "Sunday"
];

const millisecondsPerDay = 86400000;

// ==========================================
// SHARED DATE UTILITIES
// ==========================================

function parseLocalDate(value) {
  if (!value) return null;

  const parts = value.split("-").map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return null;
  }

  const [year, month, day] = parts;

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function daysBetweenDates(firstDate, secondDate) {
  const firstUTC = Date.UTC(
    firstDate.getFullYear(),
    firstDate.getMonth(),
    firstDate.getDate()
  );

  const secondUTC = Date.UTC(
    secondDate.getFullYear(),
    secondDate.getMonth(),
    secondDate.getDate()
  );

  return Math.round(
    (secondUTC - firstUTC) / millisecondsPerDay
  );
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

// ==========================================
// JULIAN AND GREGORIAN CALENDAR
// ==========================================

function getJulianDayNumber(year, month, day, julian) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  let jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4);

  if (julian) {
    jdn -= 32083;
  } else {
    jdn -= Math.floor(y / 100) -
      Math.floor(y / 400) + 32045;
  }

  return jdn;
}

function getWeekday(jdn) {
  return weekdays[((jdn % 7) + 7) % 7];
}

function usesJulianCalendar(year, month, day) {
  return (
    year < 1582 ||
    (year === 1582 &&
      (month < 10 || (month === 10 && day <= 4)))
  );
}

function isSkippedHistoricalDate(year, month, day) {
  return (
    year === 1582 &&
    month === 10 &&
    day >= 5 &&
    day <= 14
  );
}

function jdnToGregorian(jdnValue) {
  let l = jdnValue + 68569;
  const n = Math.floor((4 * l) / 146097);

  l -= Math.floor((146097 * n + 3) / 4);

  const i = Math.floor((4000 * (l + 1)) / 1461001);

  l = l - Math.floor((1461 * i) / 4) + 31;

  const j = Math.floor((80 * l) / 2447);
  const day = l - Math.floor((2447 * j) / 80);

  l = Math.floor(j / 11);

  const month = j + 2 - 12 * l;
  const year = 100 * (n - 49) + i + l;

  return { year, month, day };
}

function jdnToJulian(jdnValue) {
  const c = jdnValue + 32082;
  const d0 = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d0) / 4);
  const m0 = Math.floor((5 * e + 2) / 153);

  const day = e - Math.floor((153 * m0 + 2) / 5) + 1;
  const month = m0 + 3 - 12 * Math.floor(m0 / 10);
  const year = d0 - 4800 + Math.floor(m0 / 10);

  return { year, month, day };
}

function formatHistoricalDate(jdnValue) {
  const gregorianStart =
    getJulianDayNumber(1582, 10, 15, false);

  const parts = jdnValue < gregorianStart
    ? jdnToJulian(jdnValue)
    : jdnToGregorian(jdnValue);

  const monthName = new Date(
    Date.UTC(2000, parts.month - 1, 1)
  ).toLocaleString("en-US", {
    month: "short",
    timeZone: "UTC"
  });

  return `${monthName} ${parts.day}, ${parts.year}`;
}

// ==========================================
// DAY CALCULATOR
// ==========================================

const dateInput = document.getElementById("date");
const calculateButton = document.getElementById("calculate");
const result = document.getElementById("result");
const shareButton = document.getElementById("share-result");

let shareText = "";

if (dateInput && calculateButton && result) {
  calculateButton.addEventListener("click", function () {
    if (!dateInput.value) {
      result.textContent = "Choose a date first! 📅";
      shareText = "";

      if (shareButton) {
        shareButton.disabled = true;
      }

      return;
    }

    const [year, month, day] = dateInput.value
      .split("-")
      .map(Number);

    if (isSkippedHistoricalDate(year, month, day)) {
      result.innerHTML = `
        <div style="font-size:24px;font-weight:800">
          📜 That date was skipped!
        </div>
        <p>
          In regions that first adopted the Gregorian
          calendar, October 4, 1582 was followed by
          October 15, 1582.
        </p>
        <p>Choose another date to continue.</p>
      `;

      shareText = "";

      if (shareButton) {
        shareButton.disabled = true;
      }

      return;
    }

    const useJulian =
      usesJulianCalendar(year, month, day);

    const jdn = getJulianDayNumber(
      year, month, day, useJulian
    );

    const weekday = getWeekday(jdn);

    // SHARE RESULT
    shareText =
      `🧙‍♂️ ChronoWizard discovered my date!\n` +
      `📅 ${month}/${day}/${year} was a ${weekday}!\n\n` +
      `✨ Find out the weekday of any date!\n` +
      `🔮 Try ChronoWizard here: ${websiteLink}`;

    if (shareButton) {
      shareButton.disabled = false;
      shareButton.textContent = "📤 Share Your Result";
    }

    // SAME WEEKDAY IN OTHER YEARS
    const originalLabel =
      document.getElementById("year-match-original");

    const previousLabel =
      document.getElementById("year-match-previous");

    const previousYearsLabel =
      document.getElementById("year-match-previous-years");

    const nextLabel =
      document.getElementById("year-match-next");

    const yearsLabel =
      document.getElementById("year-match-years");

    if (
      originalLabel &&
      previousLabel &&
      previousYearsLabel &&
      nextLabel &&
      yearsLabel
    ) {
      originalLabel.textContent =
        `${month}/${day}/${year} → ${weekday}`;

      let previousMatchFound = false;

      for (
        let pastYear = year - 1;
        pastYear >= year - 28;
        pastYear--
      ) {
        const leap =
          pastYear % 4 === 0 &&
          (pastYear % 100 !== 0 || pastYear % 400 === 0);

        if (month === 2 && day === 29 && !leap) {
          continue;
        }

        const pastJdn = getJulianDayNumber(
          pastYear,
          month,
          day,
          usesJulianCalendar(pastYear, month, day)
        );

        if (getWeekday(pastJdn) === weekday) {
          previousLabel.textContent =
            `${month}/${day}/${pastYear} → ${weekday}`;

          previousYearsLabel.textContent =
            `${year - pastYear} years earlier`;

          previousMatchFound = true;
          break;
        }
      }

      if (!previousMatchFound) {
        previousLabel.textContent = "No match found";
        previousYearsLabel.textContent = "";
      }

      let nextMatchFound = false;

      for (
        let futureYear = year + 1;
        futureYear <= year + 28;
        futureYear++
      ) {
        const leap =
          futureYear % 4 === 0 &&
          (futureYear % 100 !== 0 || futureYear % 400 === 0);

        if (month === 2 && day === 29 && !leap) {
          continue;
        }

        const futureJdn = getJulianDayNumber(
          futureYear,
          month,
          day,
          usesJulianCalendar(futureYear, month, day)
        );

        if (getWeekday(futureJdn) === weekday) {
          nextLabel.textContent =
            `${month}/${day}/${futureYear} → ${weekday}`;

          yearsLabel.textContent =
            `${futureYear - year} years later`;

          nextMatchFound = true;
          break;
        }
      }

      if (!nextMatchFound) {
        nextLabel.textContent = "No match found";
        yearsLabel.textContent = "";
      }
    }

    // PREVIOUS AND NEXT WEEKLY OCCURRENCES
    const previousDate =
      document.getElementById("previous-date");

    const nextDate =
      document.getElementById("next-date");

    const previousGap =
      document.getElementById("previous-gap");

    const nextGap =
      document.getElementById("next-gap");

    if (previousDate) {
      previousDate.textContent =
        formatHistoricalDate(jdn - 7);
    }

    if (nextDate) {
      nextDate.textContent =
        formatHistoricalDate(jdn + 7);
    }

    if (previousGap) {
      previousGap.textContent = "7 days earlier";
    }

    if (nextGap) {
      nextGap.textContent = "7 days later";
    }

    // HISTORICAL NOTE
    let historicalNote = "";

    if (useJulian) {
      historicalNote = `
        <div style="
          margin-top:16px;
          padding:12px;
          border-radius:10px;
          background:var(--historical-note-bg, #40351f);
          color:var(--historical-note-text, #ffe0a3);
          font-size:13px;
          line-height:1.6;
        ">
          📜 Historical calendar note<br><br>
          This weekday uses the Julian calendar.
          The Gregorian calendar was introduced in 1582,
          but different countries adopted it at different times.
          The historical weekday depends on the calendar
          used in that location.
        </div>
      `;
    }

    result.innerHTML = `
      <div style="font-size:14px">YOUR ANSWER IS...</div>
      <div style="font-size:32px;font-weight:800;margin:10px 0">
        ${weekday}!
      </div>
      <div>${month}/${day}/${year}</div>
      ${historicalNote}
    `;
  });
}

// ==========================================
// DATE DIFFERENCE CALCULATOR
// ==========================================

const startDateInput =
  document.getElementById("start-date");

const endDateInput =
  document.getElementById("end-date");

const calculateDifferenceButton =
  document.getElementById("calculate-difference");

const differenceResult =
  document.getElementById("difference-result");

// Safely add months while preserving the day where possible.
function addCalendarMonths(date, monthsToAdd) {
  const targetMonth = date.getMonth() + monthsToAdd;

  const firstOfTargetMonth = new Date(
    date.getFullYear(),
    targetMonth,
    1
  );

  const lastDay = new Date(
    firstOfTargetMonth.getFullYear(),
    firstOfTargetMonth.getMonth() + 1,
    0
  ).getDate();

  return new Date(
    firstOfTargetMonth.getFullYear(),
    firstOfTargetMonth.getMonth(),
    Math.min(date.getDate(), lastDay)
  );
}

function getCalendarDifference(startDate, endDate) {
  let years =
    endDate.getFullYear() - startDate.getFullYear();

  let cursor = addCalendarMonths(startDate, years * 12);

  if (cursor > endDate) {
    years--;
    cursor = addCalendarMonths(startDate, years * 12);
  }

  let months = 0;

  while (months < 11) {
    const nextMonth = addCalendarMonths(cursor, 1);

    if (nextMonth > endDate) {
      break;
    }

    cursor = nextMonth;
    months++;
  }

  const days = daysBetweenDates(cursor, endDate);

  return { years, months, days };
}

if (
  startDateInput &&
  endDateInput &&
  calculateDifferenceButton &&
  differenceResult
) {
  calculateDifferenceButton.addEventListener("click", function () {
    const startDate =
      parseLocalDate(startDateInput.value);

    const endDate =
      parseLocalDate(endDateInput.value);

    if (!startDate || !endDate) {
      differenceResult.textContent =
        "Please choose both dates first! 📅";
      return;
    }

    if (startDate > endDate) {
      differenceResult.textContent =
        "The end date must be after the start date.";
      return;
    }

    const totalDays =
      daysBetweenDates(startDate, endDate);

    const totalWeeks =
      Math.floor(totalDays / 7);

    const remainingDays =
      totalDays % 7;

    const difference =
      getCalendarDifference(startDate, endDate);

    differenceResult.innerHTML = `
      <h3>✨ Time Between Your Dates</h3>

      <p style="font-size:26px;font-weight:800;margin:16px 0">
        ${difference.years} years,
        ${difference.months} months,
        ${difference.days} days
      </p>

      <p>📅 Total days:
        <strong>${totalDays.toLocaleString()}</strong>
      </p>

      <p>📆 Total weeks:
        <strong>${totalWeeks.toLocaleString()}</strong>
        weeks and ${remainingDays} days
      </p>

      <p>🔮 That's ${totalDays.toLocaleString()} days between
        your selected dates!
      </p>
    `;
  });
}

// ==========================================
// AGE CALCULATOR
// ==========================================

function calculateAgeDetails(birthDate, today = new Date()) {
  const birth = new Date(
    birthDate.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );

  const current = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  if (
    Number.isNaN(birth.getTime()) ||
    Number.isNaN(current.getTime())
  ) {
    return null;
  }

  if (birth > current) {
    return {
      error: "Your birthday must not be in the future!"
    };
  }

  const totalDays =
    daysBetweenDates(birth, current);

  let years =
    current.getFullYear() - birth.getFullYear();

  let months =
    current.getMonth() - birth.getMonth();

  let days =
    current.getDate() - birth.getDate();

  if (days < 0) {
    months--;

    const previousMonthDays = new Date(
      current.getFullYear(),
      current.getMonth(),
      0
    ).getDate();

    days += previousMonthDays;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  // Handle February 29 birthdays.
  function makeBirthday(year) {
    if (
      birth.getMonth() === 1 &&
      birth.getDate() === 29 &&
      new Date(year, 1, 29).getMonth() !== 1
    ) {
      return new Date(year, 1, 28);
    }

    return new Date(
      year,
      birth.getMonth(),
      birth.getDate()
    );
  }

  let nextBirthday =
    makeBirthday(current.getFullYear());

  if (nextBirthday < current) {
    nextBirthday =
      makeBirthday(current.getFullYear() + 1);
  }

  const daysUntilBirthday =
    daysBetweenDates(current, nextBirthday);

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    daysUntilBirthday
  };
}

const birthdayInput =
  document.getElementById("birthday");

const calculateAgeButton =
  document.getElementById("calculate-age");

const ageResult =
  document.getElementById("age-result");

if (
  birthdayInput &&
  calculateAgeButton &&
  ageResult
) {
  calculateAgeButton.addEventListener("click", function () {
    const birthDate =
      parseLocalDate(birthdayInput.value);

    if (!birthDate) {
      ageResult.textContent =
        "Please enter a valid birthday! 🎂";
      return;
    }

    const age =
      calculateAgeDetails(birthDate);

    if (!age) {
      ageResult.textContent =
        "Sorry, we couldn't calculate that date.";
      return;
    }

    if (age.error) {
      ageResult.textContent = age.error;
      return;
    }

    ageResult.innerHTML = `
      <h3>🎉 Your Age</h3>

      <p>
        <strong>${age.years}</strong> years,
        <strong>${age.months}</strong> months, and
        <strong>${age.days}</strong> days old!
      </p>

      <p>📅 Total days alive:
        <strong>${age.totalDays.toLocaleString()}</strong>
      </p>

      <p>📆 Total complete weeks:
        <strong>${age.totalWeeks.toLocaleString()}</strong>
      </p>

      <p>🎂 Days until your next birthday:
        <strong>${age.daysUntilBirthday}</strong>
      </p>
    `;
  });
}

// ==========================================
// THEME PICKER — ALL PAGES
// ==========================================

const themeToggle =
  document.getElementById("theme-toggle");

const themeMenu =
  document.getElementById("theme-menu");

const themeOptions =
  document.querySelectorAll(".theme-option");

const validThemes = [
  "purple",
  "ocean",
  "forest",
  "sunset",
  "rose",
  "red",
  "gold",
  "ice",
  "midnight",
  "white",
  "lavender"
];

let savedTheme = "purple";

try {
  const storedTheme =
    localStorage.getItem("calendar-wizard-theme");

  if (validThemes.includes(storedTheme)) {
    savedTheme = storedTheme;
  }
} catch (error) {
  // Storage may be unavailable.
}

function applyTheme(theme) {
  if (!validThemes.includes(theme)) {
    theme = "purple";
  }

  document.body.dataset.theme = theme;

  themeOptions.forEach(option => {
    const isActive =
      option.dataset.theme === theme;

    option.classList.toggle("active", isActive);

    option.setAttribute(
      "aria-pressed",
      String(isActive)
    );
  });

  try {
    localStorage.setItem(
      "calendar-wizard-theme",
      theme
    );
  } catch (error) {
    // Theme still applies to the current page.
  }
}

applyTheme(savedTheme);

if (themeToggle && themeMenu) {
  themeToggle.addEventListener("click", function () {
    const isOpening = themeMenu.hidden;

    themeMenu.hidden = !isOpening;

    themeToggle.setAttribute(
      "aria-expanded",
      String(isOpening)
    );
  });

  themeOptions.forEach(option => {
    option.addEventListener("click", function () {
      applyTheme(option.dataset.theme);

      themeMenu.hidden = true;

      themeToggle.setAttribute(
        "aria-expanded",
        "false"
      );
    });
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".theme-picker")) {
      themeMenu.hidden = true;

      themeToggle.setAttribute(
        "aria-expanded",
        "false"
      );
    }
  });
}

// ==========================================
// SHARE BUTTON
// ==========================================

async function copyShareText() {
  if (!shareText || !shareButton) {
    return;
  }

  try {
    await navigator.clipboard.writeText(shareText);

    shareButton.textContent =
      "✅ Copied! Ready to share";
  } catch (error) {
    window.prompt(
      "Copy your result:",
      shareText
    );
  }
}

if (shareButton) {
  shareButton.addEventListener("click", async function () {
    if (!shareText) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My ChronoWizard Result",
          text: shareText
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          await copyShareText();
        }
      }
    } else {
      await copyShareText();
    }
  });
}

// ==========================================
// END OF CHRONOWIZARD SCRIPT
// ==========================================

