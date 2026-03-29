document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // 1. Global: Mobile Navbar & LocalStorage Helpers
  // ==========================================================================
  const hamburger = document.getElementById('hamburger');
  const navRight = document.getElementById('nav-right');

  if (hamburger && navRight) {
    hamburger.addEventListener('click', () => {
      navRight.classList.toggle('active');
      hamburger.innerHTML = navRight.classList.contains('active') ? '✖' : '☰';
    });
  }

  const Store = {
    get: (key, defaultVal) => {
      const val = localStorage.getItem(key);
      try { return val ? JSON.parse(val) : defaultVal; } catch(e) { return val || defaultVal; }
    },
    set: (key, val) => localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val))
  };

  // --- Toast Notification System ---
  window.showToast = (msg) => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `✅ <span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      toast.addEventListener('animationend', () => toast.remove());
    }, 2500);
  };

  // --- Retention Features & Trust Signals ---
  const todayDateStr = new Date().toDateString();

  // Streak Tracker
  let streakData = Store.get('hub_streak', { count: 0, lastVisit: null });
  if (streakData.lastVisit !== todayDateStr) {
    if (streakData.lastVisit) {
      const lastVisitDate = new Date(streakData.lastVisit);
      const diffTime = Math.abs(new Date() - lastVisitDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) streakData.count += 1; // Consecutive day
      else if (diffDays > 1) streakData.count = 1; // Streak broken
    } else {
      streakData.count = 1; // First visit
    }
    streakData.lastVisit = todayDateStr;
    Store.set('hub_streak', streakData);
  }
  const streakEl = document.getElementById('streak-indicator');
  if (streakEl) streakEl.innerHTML = `🔥 Current streak: <strong>${streakData.count} ${streakData.count === 1 ? 'day' : 'days'}</strong>`;

  // Daily Quote
  const quotes = [
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
    { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
    { text: "Lost time is never found again.", author: "Benjamin Franklin" },
    { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
    { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" }
  ];
  
  const quoteEl = document.getElementById('daily-quote');
  if (quoteEl) {
    const start = new Date(new Date().getFullYear(), 0, 0);
    const diff = (new Date() - start) + ((start.getTimezoneOffset() - new Date().getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const dailyQuote = quotes[dayOfYear % quotes.length];
    quoteEl.innerHTML = `<em style="font-size:1.1rem; color:var(--primary);">"${dailyQuote.text}"</em> <br><span style="font-weight: 600; font-size: 0.95rem; color: var(--text-muted);">&mdash; ${dailyQuote.author}</span>`;
  }

  // Welcome Message
  const welcomeEl = document.getElementById('welcome-message');
  if (welcomeEl) {
    const hour = new Date().getHours();
    let greeting = 'Good evening';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';
    welcomeEl.textContent = greeting + ", ready to finish your tasks?";
  }

  // Progress Dashboard Summary
  const dashTasks = document.getElementById('dash-tasks');
  const dashHabits = document.getElementById('dash-habits');
  if (dashTasks && dashHabits) {
    const todosCount = Store.get('hub_todos', []).length;
    dashTasks.textContent = todosCount;
    const habitsArr = Store.get('hub_habits', []);
    const completedHabits = habitsArr.filter(h => h.completedToday).length;
    dashHabits.textContent = `${completedHabits} / ${habitsArr.length}`;
  }

  const themeToggle = document.getElementById('theme-toggle');
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
  
  const currentTheme = Store.get('theme', prefersDarkScheme.matches ? 'dark' : 'light');
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeToggle) themeToggle.textContent = '☀️';
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      let theme = 'light';
      if (document.body.classList.contains('dark-mode')) {
        theme = 'dark';
        themeToggle.textContent = '☀️';
      } else {
        themeToggle.textContent = '🌙';
      }
      Store.set('theme', theme);
    });
  }

  // ==========================================================================
  // 2. Productivity Hub Logic
  // ==========================================================================

  // --- Tabs Logic ---
  const tabs = document.querySelectorAll('.prod-tab');
  const sections = document.querySelectorAll('.prod-section');

  if (tabs.length > 0) {
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active from all
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        // Add to clicked
        tab.classList.add('active');
        document.getElementById(tab.dataset.target).classList.add('active');
      });
    });
  }

  // --- To-Do List ---
  const todoInput = document.getElementById('todo-input');
  const todoAddBtn = document.getElementById('todo-add-btn');
  const todoList = document.getElementById('todo-list');

  if (todoList) {
    let todos = Store.get('hub_todos', []);

    const renderTodos = () => {
      todoList.innerHTML = '';
      todos.forEach((todo, index) => {
        const div = document.createElement('div');
        div.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        div.innerHTML = `
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-index="${index}">
        <span class="todo-text">${todo.text}</span>
        <button class="todo-delete" data-index="${index}">🗑️</button>
      `;
        todoList.appendChild(div);
      });

      // Bind events
      document.querySelectorAll('.todo-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
          todos[e.target.dataset.index].completed = e.target.checked;
          Store.set('hub_todos', todos);
          renderTodos();
          if (e.target.checked && window.showToast) window.showToast("Task marked complete");
        });
      });
      document.querySelectorAll('.todo-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          todos.splice(e.target.dataset.index, 1);
          Store.set('hub_todos', todos);
          renderTodos();
        });
      });
    };

    todoAddBtn.addEventListener('click', () => {
      const text = todoInput.value.trim();
      if (text) {
        todos.push({ text, completed: false });
        Store.set('hub_todos', todos);
        todoInput.value = '';
        renderTodos();
      }
    });

    renderTodos();
  }

  // --- Habit Tracker ---
  const habitForm = document.getElementById('habit-form');
  const habitInput = document.getElementById('habit-input');
  const habitList = document.getElementById('habit-list');

  if (habitList) {
    let habits = Store.get('hub_habits', []);
    const today = new Date().toDateString();

    const renderHabits = () => {
      habitList.innerHTML = '';
      habits.forEach((habit, index) => {
        // reset daily toggle if a new day
        if (habit.lastUpdated !== today && habit.lastUpdated !== null) {
          if (!habit.completedToday) habit.streak = 0; // broke streak
          habit.completedToday = false;
          habit.lastUpdated = today;
          Store.set('hub_habits', habits);
        }

        const div = document.createElement('div');
        div.className = 'habit-item';
        div.innerHTML = `
        <div>
           <strong>${habit.name}</strong>
           <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 5px;">
              <input type="checkbox" class="habit-check" ${habit.completedToday ? 'checked' : ''} data-index="${index}"> Done Today?
           </div>
        </div>
        <div class="habit-streak">🔥 ${habit.streak} days</div>
      `;
        habitList.appendChild(div);
      });

      document.querySelectorAll('.habit-check').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const idx = e.target.dataset.index;
          habits[idx].completedToday = e.target.checked;
          if (e.target.checked) {
            habits[idx].streak++;
          } else {
            habits[idx].streak = Math.max(0, habits[idx].streak - 1);
          }
          habits[idx].lastUpdated = today;
          Store.set('hub_habits', habits);
          renderHabits();
        });
      });
    };

    if (document.getElementById('habit-add-btn')) {
      document.getElementById('habit-add-btn').addEventListener('click', () => {
        const name = habitInput.value.trim();
        if (name) {
          habits.push({ name, streak: 0, completedToday: false, lastUpdated: null });
          Store.set('hub_habits', habits);
          habitInput.value = '';
          renderHabits();
        }
      });
    }
    renderHabits();
  }

  // --- Pomodoro Timer ---
  const timeDisplay = document.getElementById('time-display');
  if (timeDisplay) {
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    const resetBtn = document.getElementById('timer-reset');
    const durationInput = document.getElementById('timer-duration');

    let timeRemaining = parseInt(Store.get('hub_timer_last_duration', 25)) * 60;
    let timerInterval = null;
    let isRunning = false;

    // Set input to last used duration
    if (durationInput) durationInput.value = Store.get('hub_timer_last_duration', 25);

    const formatTime = (secs) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const updateDisplay = () => {
      timeDisplay.textContent = formatTime(timeRemaining);
      document.title = isRunning ? `${timeDisplay.textContent} - Focus - Donezo` : 'Donezo';
    };

    const playAlarm = () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 1);
      } catch (e) { console.error("Web Audio API not supported", e); }
    };

    startBtn.addEventListener('click', () => {
      if (isRunning) return;
      if (timeRemaining <= 0) timeRemaining = (parseInt(durationInput.value) || 25) * 60;
      Store.set('hub_timer_last_duration', durationInput.value);
      isRunning = true;
      timerInterval = setInterval(() => {
        if (timeRemaining > 0) {
          timeRemaining--;
          updateDisplay();
        } else {
          clearInterval(timerInterval);
          isRunning = false;
          playAlarm();
          alert("Session Complete!");
          updateDisplay();
        }
      }, 1000);
    });

    pauseBtn.addEventListener('click', () => {
      clearInterval(timerInterval);
      isRunning = false;
      updateDisplay();
    });

    resetBtn.addEventListener('click', () => {
      clearInterval(timerInterval);
      isRunning = false;
      timeRemaining = (parseInt(durationInput.value) || 25) * 60;
      Store.set('hub_timer_last_duration', durationInput.value);
      updateDisplay();
    });

    if (durationInput) {
      durationInput.addEventListener('change', () => {
        if (!isRunning) {
          timeRemaining = (parseInt(durationInput.value) || 25) * 60;
          Store.set('hub_timer_last_duration', durationInput.value);
          updateDisplay();
        }
      });
    }
    updateDisplay();
  }

  // --- Daily Planner ---
  const plannerList = document.getElementById('planner-list');
  if (plannerList) {
    let plans = Store.get('hub_planner', []);
    const planTime = document.getElementById('plan-time');
    const planDesc = document.getElementById('plan-desc');
    const planAddBtn = document.getElementById('plan-add-btn');

    const renderPlans = () => {
      plannerList.innerHTML = '';
      // Sort by time
      plans.sort((a, b) => a.time.localeCompare(b.time));
      plans.forEach((plan, index) => {
        const div = document.createElement('div');
        div.className = 'planner-item';
        div.innerHTML = `
        <div class="planner-time">${plan.time}</div>
        <div class="planner-desc">${plan.desc}</div>
        <button class="btn btn-sm btn-secondary plan-delete" data-index="${index}">🗑️</button>
      `;
        plannerList.appendChild(div);
      });

      document.querySelectorAll('.plan-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          plans.splice(e.target.dataset.index, 1);
          Store.set('hub_planner', plans);
          renderPlans();
        });
      });
    };

    planAddBtn.addEventListener('click', () => {
      if (planTime.value && planDesc.value.trim()) {
        plans.push({ time: planTime.value, desc: planDesc.value.trim() });
        Store.set('hub_planner', plans);
        planTime.value = ''; planDesc.value = '';
        renderPlans();
      } else {
        alert("Please enter both time and description.");
      }
    });

    renderPlans();
  }

  // --- Notes Section ---
  const notesArea = document.getElementById('notes-area');
  if (notesArea) {
    notesArea.value = Store.get('hub_notes', '');
    // Auto-save
    notesArea.addEventListener('input', () => {
      Store.set('hub_notes', notesArea.value);
    });
    notesArea.addEventListener('blur', () => {
      if (window.showToast) window.showToast("Notes saved automatically");
    });
  }

  // ==========================================================================
  // 3. Independent Tools
  // ==========================================================================

  // --- Grade Calculator ---
  const gradeInputsContainer = document.getElementById('grade-inputs');
  if (gradeInputsContainer) {
    document.getElementById('add-grade-btn').addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'grade-row';
      row.innerHTML = `
      <div class="form-group"><input type="number" class="form-control grade-val" placeholder="Grade (0-100)" min="0" max="100"></div>
      <button type="button" class="btn btn-danger btn-sm remove-grade-btn">✖</button>
    `;
      gradeInputsContainer.appendChild(row);
      row.querySelector('.remove-grade-btn').addEventListener('click', () => row.remove());
    });

    document.getElementById('calc-grade-btn').addEventListener('click', () => {
      const inputs = document.querySelectorAll('.grade-val');
      let sum = 0, count = 0;
      inputs.forEach(inp => {
        const val = parseFloat(inp.value);
        if (!isNaN(val)) { sum += val; count++; }
      });

      const resultBox = document.getElementById('grade-result');
      if (count === 0) { resultBox.innerHTML = "Enter valid grades to calculate."; return; }

      const avg = sum / count;
      resultBox.innerHTML = `<div>Your Average: <strong style="color: var(--primary); font-size: 2rem;">${avg.toFixed(2)}</strong></div>
                           <div>${avg >= 75 ? '🎉 Passed!' : '😢 Failed.'}</div>`;
    });
  }

  // --- Random Picker ---
  const pickerBtn = document.getElementById('pick-btn');
  if (pickerBtn) {
    let lastPickerWinner = '';
    pickerBtn.addEventListener('click', () => {
      const input = document.getElementById('names-input');
      const resultBox = document.getElementById('picker-result');
      let names = input.value.split(/[\n,]+/).map(n => n.trim()).filter(n => n);

      if (names.length === 0) { resultBox.innerHTML = "Enter names first."; return; }

      lastPickerWinner = names[Math.floor(Math.random() * names.length)];
      resultBox.innerHTML = `<div style="font-size: 2rem; color: var(--primary); margin-bottom: 10px;">🏆 ${lastPickerWinner}</div>
                           <button id="remove-winner-btn" class="btn btn-secondary btn-sm">Remove & Pick Again</button>`;

      document.getElementById('remove-winner-btn').addEventListener('click', () => {
        input.value = names.filter(n => n !== lastPickerWinner).join('\n');
        pickerBtn.click();
      });
    });
  }

  // --- Password Generator ---
  const generateBtn = document.getElementById('generate-btn');
  if (generateBtn) {
    const chars = {
      upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lower: 'abcdefghijklmnopqrstuvwxyz',
      num: '0123456789',
      sym: '!@#$%^&*()_+~`|}{[]:;?><,./-='
    };

    const lenInput = document.getElementById('pass-length');
    const lenVal = document.getElementById('length-val');
    lenInput.addEventListener('input', () => lenVal.textContent = lenInput.value);

    generateBtn.addEventListener('click', () => {
      let pool = '';
      if (document.getElementById('inc-upper').checked) pool += chars.upper;
      if (document.getElementById('inc-lower').checked) pool += chars.lower;
      if (document.getElementById('inc-num').checked) pool += chars.num;
      if (document.getElementById('inc-sym').checked) pool += chars.sym;

      const out = document.getElementById('pass-output');
      if (!pool) { out.value = ''; alert("Select character types!"); return; }

      let pass = '';
      for (let i = 0; i < lenInput.value; i++) pass += pool[Math.floor(Math.random() * pool.length)];
      out.value = pass;
    });

    document.getElementById('copy-btn').addEventListener('click', () => {
      const out = document.getElementById('pass-output');
      if (!out.value) return;
      navigator.clipboard.writeText(out.value).then(() => {
        const btn = document.getElementById('copy-btn');
        btn.textContent = "Copied!";
        setTimeout(() => btn.textContent = "Copy", 1500);
      });
    });

    // Initial generate
    generateBtn.click();
  }

});
