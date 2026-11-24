const lessons = [
  {
    topic: "Getting around", icon: "🚕", chinese: "请带我去这个地址。",
    pinyin: "Qǐng dài wǒ qù zhège dìzhǐ.",
    english: "Please take me to this address.",
    example: "Show this phrase to your taxi driver, or say it while pointing to your destination."
  },
  {
    topic: "At the shop", icon: "🛍️", chinese: "这个多少钱？",
    pinyin: "Zhège duōshǎo qián?",
    english: "How much is this?",
    example: "Point to an item at a market or shop when you want to ask its price."
  },
  {
    topic: "Ordering food", icon: "🥢", chinese: "我想要这个。",
    pinyin: "Wǒ xiǎng yào zhège.",
    english: "I would like this one.",
    example: "Point to a dish on the menu and use this phrase to order it."
  },
  {
    topic: "Small talk", icon: "☕", chinese: "你今天怎么样？",
    pinyin: "Nǐ jīntiān zěnmeyàng?",
    english: "How are you today?",
    example: "Try this friendly question with a colleague or neighbour."
  },
  {
    topic: "At a café", icon: "🍵", chinese: "请给我一杯水。",
    pinyin: "Qǐng gěi wǒ yì bēi shuǐ.",
    english: "Please give me a glass of water.",
    example: "Use it when ordering a drink or asking for water at a restaurant."
  },
  {
    topic: "Finding a place", icon: "📍", chinese: "洗手间在哪里？",
    pinyin: "Xǐshǒujiān zài nǎlǐ?",
    english: "Where is the restroom?",
    example: "Ask a staff member when you need to find the restroom."
  },
  {
    topic: "Meeting people", icon: "👋", chinese: "很高兴认识你。",
    pinyin: "Hěn gāoxìng rènshi nǐ.",
    english: "Nice to meet you.",
    example: "Say this when you meet someone new."
  },
  {
    topic: "Everyday help", icon: "🙏", chinese: "可以帮我吗？",
    pinyin: "Kěyǐ bāng wǒ ma?",
    english: "Could you help me?",
    example: "Use this polite question when you need a hand."
  }
];

const storageKey = "littleChinesePracticeDates";
const today = new Date();
const localDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const todayKey = localDateKey(today);
const dayIndex = Math.floor(new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() / 86400000);
let activeLesson = lessons[dayIndex % lessons.length];
let completedDates = [];
let storageAvailable = true;

const phraseTopic = document.querySelector("#phrase-topic");
const phraseChinese = document.querySelector("#phrase-chinese");
const phrasePinyin = document.querySelector("#phrase-pinyin");
const phraseEnglish = document.querySelector("#phrase-english");
const lessonStatus = document.querySelector("#lesson-status");
const quizFeedback = document.querySelector("#quiz-feedback");
const completeButton = document.querySelector("#complete-button");

function loadProgress() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === null) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every((date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date))) {
      throw new Error("Saved progress has an unexpected format.");
    }
    return [...new Set(parsed)];
  } catch (error) {
    storageAvailable = false;
    document.querySelector("#storage-note").textContent = "Progress storage is unavailable, so your practice will not be saved.";
    console.error("Could not load practice progress:", error);
    return [];
  }
}

function renderProgress() {
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - index));
    return { date, key: localDateKey(date) };
  });
  const practicedThisWeek = week.filter(({ key }) => completedDates.includes(key)).length;
  document.querySelector("#week-count").textContent = `${practicedThisWeek}/7`;
  document.querySelector("#progress-fill").style.width = `${(practicedThisWeek / 7) * 100}%`;
  document.querySelector("#progress-bar").setAttribute("aria-valuenow", String(practicedThisWeek));
  document.querySelector("#week-days").innerHTML = week.map(({ date, key }) => {
    const isDone = completedDates.includes(key);
    const label = date.toLocaleDateString(undefined, { weekday: "short" });
    return `<span class="day${isDone ? " done" : ""}" aria-label="${label}${isDone ? ", practiced" : ""}"><span class="day-dot">${isDone ? "✓" : ""}</span><span>${label}</span></span>`;
  }).join("");

  let streak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!completedDates.includes(todayKey)) cursor.setDate(cursor.getDate() - 1);
  while (completedDates.includes(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  document.querySelector("#streak-count").textContent = streak > 0
    ? `${streak} day${streak === 1 ? "" : "s"} in a row`
    : "Start your streak";
}

function renderLesson() {
  phraseTopic.textContent = activeLesson.topic;
  phraseChinese.textContent = activeLesson.chinese;
  phrasePinyin.textContent = activeLesson.pinyin;
  phraseEnglish.textContent = activeLesson.english;
  document.querySelector(".example").innerHTML = `<span class="example-icon" aria-hidden="true">✦</span><span><strong>Try it in real life:</strong> ${activeLesson.example}</span>`;
  lessonStatus.textContent = "";
  renderQuiz();
  renderTopics();
}

function renderQuiz() {
  quizFeedback.textContent = "";
  const choices = [activeLesson.english];
  const otherOptions = lessons
    .filter((lesson) => lesson.english !== activeLesson.english)
    .map((lesson) => lesson.english);
  while (choices.length < 4 && otherOptions.length) {
    const index = Math.floor(Math.random() * otherOptions.length);
    choices.push(otherOptions.splice(index, 1)[0]);
  }
  choices.sort(() => Math.random() - 0.5);
  const answerList = document.querySelector("#answer-list");
  answerList.replaceChildren();
  for (const choice of choices) {
    const button = document.createElement("button");
    button.className = "answer";
    button.type = "button";
    button.textContent = choice;
    button.addEventListener("click", () => {
      const isCorrect = choice === activeLesson.english;
      for (const answer of answerList.querySelectorAll("button")) {
        answer.disabled = true;
        if (answer.textContent === activeLesson.english) answer.classList.add("correct");
      }
      if (!isCorrect) button.classList.add("incorrect");
      quizFeedback.textContent = isCorrect
        ? "That’s right! Nice work."
        : `Not quite. It means “${activeLesson.english}”`;
    });
    answerList.append(button);
  }
}

function renderTopics() {
  const counts = new Map();
  for (const lesson of lessons) counts.set(lesson.topic, (counts.get(lesson.topic) || 0) + 1);
  const grid = document.querySelector("#topic-grid");
  grid.replaceChildren();
  for (const lesson of lessons) {
    const button = document.createElement("button");
    button.className = "topic-button";
    button.type = "button";
    button.setAttribute("aria-pressed", String(lesson === activeLesson));
    button.innerHTML = `<span class="topic-emoji" aria-hidden="true">${lesson.icon}</span><span><span class="topic-name">${lesson.topic}</span><span class="topic-count">${counts.get(lesson.topic)} useful phrase</span></span>`;
    button.addEventListener("click", () => {
      activeLesson = lesson;
      renderLesson();
      document.querySelector("#lesson").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    grid.append(button);
  }
}

document.querySelector("#speak-button").addEventListener("click", () => {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    lessonStatus.textContent = "Audio playback is not available in this browser. You can still read the pinyin aloud.";
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(activeLesson.chinese);
  utterance.lang = "zh-CN";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
  lessonStatus.textContent = "Playing the phrase in Mandarin.";
});

completeButton.addEventListener("click", () => {
  if (completedDates.includes(todayKey)) return;
  const updatedDates = [...completedDates, todayKey];
  if (storageAvailable) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedDates));
    } catch (error) {
      storageAvailable = false;
      document.querySelector("#storage-note").textContent = "Your browser could not save progress. It will be kept only until you close this page.";
      console.error("Could not save practice progress:", error);
    }
  }
  completedDates = updatedDates;
  completeButton.disabled = true;
  completeButton.textContent = "Today’s practice complete ✓";
  lessonStatus.textContent = "Lovely work. You made time for Chinese today.";
  renderProgress();
});

completedDates = loadProgress();
if (completedDates.includes(todayKey)) {
  completeButton.disabled = true;
  completeButton.textContent = "Today’s practice complete ✓";
  lessonStatus.textContent = "You’ve already practised today. Come back tomorrow for another phrase.";
}
renderProgress();
renderLesson();
