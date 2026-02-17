// ===== SUPABASE INIT =====
const SUPABASE_URL = 'https://eyiniiiwjdkzxozqwwqi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5aW5paWl3amRrenhvenF3d3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMDY5MzcsImV4cCI6MjA4NjU4MjkzN30.mcl-KYDnOIVAZZWZtvIAvkphayrqFvjayQo9UVsRBI0';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function handleStoreError(action, error) {
    console.error(`Failed while ${action}:`, error);
    showToast(`Could not ${action}.`);
}

// ===== DATA LAYER (Supabase) =====
const Store = {
    async getWorkouts() {
        const { data, error } = await supabase
            .from('workouts')
            .select('*')
            .order('date', { ascending: false });
        if (error) {
            handleStoreError('loading workouts', error);
            return [];
        }
        return data || [];
    },
    async saveWorkout(w) {
        const { error } = await supabase.from('workouts').insert(w);
        if (error) {
            handleStoreError('saving workout', error);
            return false;
        }
        return true;
    },
    async deleteWorkout(id) {
        const { error } = await supabase.from('workouts').delete().eq('id', id);
        if (error) {
            handleStoreError('deleting workout', error);
            return false;
        }
        return true;
    },
    async getCombat() {
        const { data, error } = await supabase
            .from('combat_sessions')
            .select('*')
            .order('date', { ascending: false });
        if (error) {
            handleStoreError('loading combat sessions', error);
            return [];
        }
        return data || [];
    },
    async saveCombat(s) {
        const { error } = await supabase.from('combat_sessions').insert(s);
        if (error) {
            handleStoreError('saving combat session', error);
            return false;
        }
        return true;
    },
    async deleteCombat(id) {
        const { error } = await supabase.from('combat_sessions').delete().eq('id', id);
        if (error) {
            handleStoreError('deleting combat session', error);
            return false;
        }
        return true;
    },
    async getGoals() {
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            handleStoreError('loading goals', error);
            return [];
        }
        return data || [];
    },
    async saveGoal(g) {
        const { error } = await supabase.from('goals').insert(g);
        if (error) {
            handleStoreError('saving goal', error);
            return false;
        }
        return true;
    },
    async updateGoal(id, updates) {
        const { error } = await supabase.from('goals').update(updates).eq('id', id);
        if (error) {
            handleStoreError('updating goal', error);
            return false;
        }
        return true;
    },
    async deleteGoal(id) {
        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (error) {
            handleStoreError('deleting goal', error);
            return false;
        }
        return true;
    },
};

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sanitizeClassToken(value) {
    return String(value ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '');
}

function getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(diff);
    return start;
}

function getDayName(date) {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(date).getDay()];
}

function showToast(msg) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// ===== NAVIGATION =====
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${page}`).classList.add('active');

        if (page === 'goals') refreshStats();
    });
});

// ===== WEEKLY COUNT =====
async function updateWeeklyCount() {
    const weekStart = getWeekStart();
    const workouts = await Store.getWorkouts();
    const combat = await Store.getCombat();
    const thisWeekWorkouts = workouts.filter(w => new Date(w.date) >= weekStart);
    const thisWeekCombat = combat.filter(s => new Date(s.date) >= weekStart);
    document.getElementById('weekly-count').textContent = thisWeekWorkouts.length + thisWeekCombat.length;
}

// ===== WORKOUT LOG =====
const workoutForm = document.getElementById('workout-form');
const exercisesContainer = document.getElementById('exercises-container');

document.getElementById('add-exercise-btn').addEventListener('click', () => {
    const entry = document.createElement('div');
    entry.className = 'exercise-entry';
    entry.innerHTML = `
        <input type="text" placeholder="Exercise name" class="ex-name" required>
        <div class="ex-details">
            <input type="number" placeholder="Sets" class="ex-sets" min="0" inputmode="numeric">
            <input type="number" placeholder="Reps" class="ex-reps" min="0" inputmode="numeric">
            <input type="number" placeholder="Wt (lbs)" class="ex-weight" min="0" inputmode="numeric">
            <input type="number" placeholder="Min" class="ex-duration" min="0" inputmode="numeric">
        </div>
    `;
    exercisesContainer.appendChild(entry);
});

workoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const entries = exercisesContainer.querySelectorAll('.exercise-entry');
    const exercises = [];
    entries.forEach(entry => {
        const name = entry.querySelector('.ex-name').value.trim();
        if (!name) return;
        exercises.push({
            name,
            sets: parseInt(entry.querySelector('.ex-sets').value) || 0,
            reps: parseInt(entry.querySelector('.ex-reps').value) || 0,
            weight: parseInt(entry.querySelector('.ex-weight').value) || 0,
            duration: parseInt(entry.querySelector('.ex-duration').value) || 0,
        });
    });

    if (exercises.length === 0) return;

    const workout = {
        id: uid(),
        type: document.getElementById('workout-type').value,
        exercises,
        notes: document.getElementById('workout-notes').value.trim(),
        date: new Date().toISOString(),
    };

    const saved = await Store.saveWorkout(workout);
    if (!saved) return;
    workoutForm.reset();

    exercisesContainer.innerHTML = `
        <div class="exercise-entry">
            <input type="text" placeholder="Exercise name" class="ex-name" required>
            <div class="ex-details">
                <input type="number" placeholder="Sets" class="ex-sets" min="0">
                <input type="number" placeholder="Reps" class="ex-reps" min="0">
                <input type="number" placeholder="Weight (lbs)" class="ex-weight" min="0">
                <input type="number" placeholder="Duration (min)" class="ex-duration" min="0">
            </div>
        </div>
    `;

    await renderWorkoutHistory();
    updateWeeklyCount();
    showToast('Workout logged!');
});

async function renderWorkoutHistory() {
    const container = document.getElementById('workout-history');
    const workouts = await Store.getWorkouts();

    if (workouts.length === 0) {
        container.innerHTML = '<div class="empty-state">No workouts logged yet. Get after it!</div>';
        return;
    }

    container.innerHTML = workouts.slice(0, 20).map(w => {
        const exList = (w.exercises || []).map(ex => {
            let detail = escapeHtml(ex.name);
            const sets = Number(ex.sets) || 0;
            const reps = Number(ex.reps) || 0;
            const weight = Number(ex.weight) || 0;
            const duration = Number(ex.duration) || 0;
            if (sets && reps) detail += ` - ${sets}x${reps}`;
            if (weight) detail += ` @ ${weight}lbs`;
            if (duration) detail += ` (${duration}min)`;
            return detail;
        }).join(', ');

        const workoutId = escapeHtml(w.id);
        const workoutType = escapeHtml(String(w.type || '').replace('-', ' '));
        const workoutNotes = escapeHtml(w.notes);

        return `
            <div class="history-item">
                <button class="delete-btn" data-id="${workoutId}" data-kind="workout">&times;</button>
                <div class="item-header">
                    <span class="item-type">${workoutType}</span>
                    <span class="item-date">${formatDate(w.date)}</span>
                </div>
                <div class="item-exercises">${exList}</div>
                ${w.notes ? `<div class="item-notes">"${workoutNotes}"</div>` : ''}
            </div>
        `;
    }).join('');

    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const deleted = await Store.deleteWorkout(btn.dataset.id);
            if (!deleted) return;
            await renderWorkoutHistory();
            updateWeeklyCount();
        });
    });
}

// ===== COMBAT SPORTS =====
const combatForm = document.getElementById('combat-form');

document.querySelectorAll('.combat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.combat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('combat-discipline').value = tab.dataset.discipline;
    });
});

const initialCombatTab = document.querySelector('.combat-tab.active');
if (initialCombatTab) {
    document.getElementById('combat-discipline').value = initialCombatTab.dataset.discipline;
}

document.querySelectorAll('.intensity-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.intensity-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('combat-intensity').value = btn.dataset.val;
    });
});

combatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const session = {
        id: uid(),
        discipline: document.getElementById('combat-discipline').value,
        session_type: document.getElementById('combat-session-type').value,
        duration: parseInt(document.getElementById('combat-duration').value) || 0,
        intensity: parseInt(document.getElementById('combat-intensity').value),
        notes: document.getElementById('combat-notes').value.trim(),
        date: new Date().toISOString(),
    };

    const saved = await Store.saveCombat(session);
    if (!saved) return;
    const activeDiscipline = document.querySelector('.combat-tab.active')?.dataset.discipline || 'mma';
    combatForm.reset();
    document.getElementById('combat-discipline').value = activeDiscipline;
    document.getElementById('combat-intensity').value = '3';
    document.querySelectorAll('.intensity-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.intensity-btn[data-val="3"]').classList.add('active');

    await renderCombatHistory();
    updateWeeklyCount();
    showToast('Session logged!');
});

async function renderCombatHistory() {
    const container = document.getElementById('combat-history');
    const sessions = await Store.getCombat();

    if (sessions.length === 0) {
        container.innerHTML = '<div class="empty-state">No combat sessions yet. Time to train!</div>';
        return;
    }

    container.innerHTML = sessions.slice(0, 20).map(s => {
        const sessionId = escapeHtml(s.id);
        const sessionType = escapeHtml(String(s.session_type || '').replace('-', ' '));
        const disciplineText = escapeHtml(String(s.discipline || '').replace('-', ' '));
        const disciplineClass = sanitizeClassToken(s.discipline);
        const sessionNotes = escapeHtml(s.notes);
        const duration = Number(s.duration) || 0;
        const intensity = Number(s.intensity) || 0;

        return `
            <div class="history-item">
                <button class="delete-btn" data-id="${sessionId}" data-kind="combat">&times;</button>
                <div class="item-header">
                    <span class="item-type">
                        ${sessionType}
                        <span class="discipline-tag ${disciplineClass}">${disciplineText}</span>
                    </span>
                    <span class="item-date">${formatDate(s.date)}</span>
                </div>
                <div class="item-exercises">${duration}min &bull; Intensity: ${intensity}/5</div>
                ${s.notes ? `<div class="item-notes">"${sessionNotes}"</div>` : ''}
            </div>
        `;
    }).join('');

    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const deleted = await Store.deleteCombat(btn.dataset.id);
            if (!deleted) return;
            await renderCombatHistory();
            updateWeeklyCount();
        });
    });
}

// ===== SPAR TIMER =====
let timerState = {
    roundLength: 180,
    restLength: 60,
    numRounds: 3,
    currentRound: 0,
    timeLeft: 180,
    phase: 'ready',
    running: false,
    interval: null,
};

function formatTimer(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    document.getElementById('timer-clock').textContent = formatTimer(timerState.timeLeft);
    document.getElementById('round-length-display').textContent = formatTimer(timerState.roundLength);
    document.getElementById('rest-length-display').textContent = formatTimer(timerState.restLength);
    document.getElementById('num-rounds-display').textContent = timerState.numRounds;

    const phaseEl = document.getElementById('timer-phase');
    phaseEl.textContent = timerState.phase.toUpperCase();
    phaseEl.className = '';
    if (timerState.phase === 'fight') phaseEl.classList.add('fight');
    if (timerState.phase === 'rest') phaseEl.classList.add('rest');

    document.getElementById('timer-round-info').textContent =
        `Round ${timerState.currentRound} / ${timerState.numRounds}`;
}

document.querySelectorAll('.adj-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (timerState.running) return;
        const target = btn.dataset.target;
        const dir = parseInt(btn.dataset.dir);

        if (target === 'round-length') {
            timerState.roundLength = Math.max(30, timerState.roundLength + dir * 30);
            if (timerState.phase === 'ready') timerState.timeLeft = timerState.roundLength;
        } else if (target === 'rest-length') {
            timerState.restLength = Math.max(10, timerState.restLength + dir * 10);
        } else if (target === 'num-rounds') {
            timerState.numRounds = Math.max(1, timerState.numRounds + dir);
        }
        updateTimerDisplay();
    });
});

function timerTick() {
    timerState.timeLeft--;

    if (timerState.timeLeft <= 0) {
        if (timerState.phase === 'fight') {
            if (timerState.currentRound >= timerState.numRounds) {
                timerState.phase = 'done';
                timerState.running = false;
                clearInterval(timerState.interval);
                timerState.interval = null;
                timerState.timeLeft = 0;
                playBell(3);
                document.getElementById('timer-start').disabled = true;
                document.getElementById('timer-pause').disabled = true;
            } else {
                timerState.phase = 'rest';
                timerState.timeLeft = timerState.restLength;
                playBell(2);
            }
        } else if (timerState.phase === 'rest') {
            timerState.currentRound++;
            timerState.phase = 'fight';
            timerState.timeLeft = timerState.roundLength;
            playBell(1);
        }
    }

    if (timerState.timeLeft === 10 && timerState.phase === 'fight') {
        playBeep();
    }

    updateTimerDisplay();
}

document.getElementById('timer-start').addEventListener('click', () => {
    if (timerState.running) return;
    if (timerState.phase === 'ready' || timerState.phase === 'done') {
        timerState.currentRound = 1;
        timerState.phase = 'fight';
        timerState.timeLeft = timerState.roundLength;
        playBell(1);
    }
    timerState.running = true;
    if (timerState.interval) clearInterval(timerState.interval);
    timerState.interval = setInterval(timerTick, 1000);
    document.getElementById('timer-start').disabled = true;
    document.getElementById('timer-pause').disabled = false;
    updateTimerDisplay();
});

document.getElementById('timer-pause').addEventListener('click', () => {
    timerState.running = false;
    clearInterval(timerState.interval);
    timerState.interval = null;
    document.getElementById('timer-start').disabled = false;
    document.getElementById('timer-pause').disabled = true;
});

document.getElementById('timer-reset').addEventListener('click', () => {
    timerState.running = false;
    clearInterval(timerState.interval);
    timerState.interval = null;
    timerState.phase = 'ready';
    timerState.currentRound = 0;
    timerState.timeLeft = timerState.roundLength;
    document.getElementById('timer-start').disabled = false;
    document.getElementById('timer-pause').disabled = true;
    updateTimerDisplay();
});

// Audio feedback
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, duration, count = 1) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
            osc.start(audioCtx.currentTime);
            osc.stop(audioCtx.currentTime + duration);
        }, i * 300);
    }
}

function playBell(count) { playTone(800, 0.4, count); }
function playBeep() { playTone(440, 0.15, 3); }

// ===== GOALS & PROGRESS =====
const goalForm = document.getElementById('goal-form');

goalForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const goal = {
        id: uid(),
        title: document.getElementById('goal-title').value.trim(),
        target: parseFloat(document.getElementById('goal-target').value) || 0,
        unit: document.getElementById('goal-unit').value.trim(),
        current: 0,
        deadline: document.getElementById('goal-deadline').value || null,
        completed: false,
    };

    if (!goal.title) return;

    const saved = await Store.saveGoal(goal);
    if (!saved) return;
    goalForm.reset();
    await renderGoals();
    showToast('Goal added!');
});

async function renderGoals() {
    const container = document.getElementById('goals-list');
    const goals = await Store.getGoals();

    if (goals.length === 0) {
        container.innerHTML = '<div class="empty-state">No goals set. Set some targets!</div>';
        return;
    }

    container.innerHTML = goals.map(g => {
        const current = Number(g.current) || 0;
        const target = Number(g.target) || 0;
        const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        const deadlineText = g.deadline
            ? `Target: ${new Date(g.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            : '';
        const goalId = escapeHtml(g.id);
        const goalTitle = escapeHtml(g.title);
        const goalUnit = escapeHtml(g.unit);

        return `
            <div class="goal-item ${g.completed ? 'completed' : ''}">
                <div class="goal-header">
                    <span class="goal-title">${g.completed ? '&#10003; ' : ''}${goalTitle}</span>
                    <span class="goal-deadline">${deadlineText}</span>
                </div>
                ${target > 0 ? `
                    <div class="progress-bar"><div class="progress-fill" style="width: ${pct}%"></div></div>
                    <div class="goal-progress-text">
                        <span>${current} ${goalUnit}</span>
                        <span>${pct}% of ${target} ${goalUnit}</span>
                    </div>
                ` : ''}
                ${!g.completed ? `
                    <div class="goal-actions">
                        <input type="number" placeholder="Update" class="goal-update-input" min="0" step="any">
                        <button class="btn-secondary goal-update-btn" data-id="${goalId}">Update</button>
                        <button class="btn-secondary goal-complete-btn" data-id="${goalId}">&#10003; Done</button>
                        <button class="btn-danger goal-delete-btn" data-id="${goalId}">Delete</button>
                    </div>
                ` : `
                    <div class="goal-actions">
                        <button class="btn-danger goal-delete-btn" data-id="${goalId}">Delete</button>
                    </div>
                `}
            </div>
        `;
    }).join('');

    container.querySelectorAll('.goal-update-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const input = btn.closest('.goal-actions')?.querySelector('.goal-update-input');
            await window.updateGoalProgress(btn.dataset.id, input?.value);
        });
    });

    container.querySelectorAll('.goal-complete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            await window.completeGoal(btn.dataset.id);
        });
    });

    container.querySelectorAll('.goal-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            await window.deleteGoal(btn.dataset.id);
        });
    });
}

window.updateGoalProgress = async function(id, rawValue) {
    const val = parseFloat(rawValue);
    if (isNaN(val)) return;

    const goals = await Store.getGoals();
    const goal = goals.find(g => g.id === id);
    if (goal) {
        const updates = { current: val };
        if (goal.target > 0 && val >= goal.target) {
            updates.completed = true;
        }
        const updated = await Store.updateGoal(id, updates);
        if (!updated) return;
        await renderGoals();
        showToast('Progress updated!');
    }
};

window.completeGoal = async function(id) {
    const goals = await Store.getGoals();
    const goal = goals.find(g => g.id === id);
    if (goal) {
        const updated = await Store.updateGoal(id, { completed: true, current: goal.target || goal.current });
        if (!updated) return;
        await renderGoals();
        showToast('Goal completed!');
    }
};

window.deleteGoal = async function(id) {
    const deleted = await Store.deleteGoal(id);
    if (!deleted) return;
    await renderGoals();
};

// ===== STATS & PROGRESS =====
async function refreshStats() {
    const workouts = await Store.getWorkouts();
    const combat = await Store.getCombat();
    const weekStart = getWeekStart();

    const thisWeekWorkouts = workouts.filter(w => new Date(w.date) >= weekStart);
    const thisWeekCombat = combat.filter(s => new Date(s.date) >= weekStart);
    const thisWeekTotal = thisWeekWorkouts.length + thisWeekCombat.length;

    document.getElementById('stat-total-workouts').textContent = workouts.length + combat.length;
    document.getElementById('stat-this-week').textContent = thisWeekTotal;
    document.getElementById('stat-combat-sessions').textContent = combat.length;

    // Calculate streak
    const allDates = [...workouts, ...combat]
        .map(w => new Date(w.date).toDateString())
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
        const check = new Date(today);
        check.setDate(check.getDate() - i);
        if (allDates.includes(check.toDateString())) {
            streak++;
        } else if (i > 0) {
            break;
        }
    }
    document.getElementById('stat-streak').textContent = streak;

    // Week chart
    const dayCountMap = {};
    const allThisWeek = [...thisWeekWorkouts, ...thisWeekCombat];
    allThisWeek.forEach(w => {
        const day = getDayName(w.date);
        dayCountMap[day] = (dayCountMap[day] || 0) + 1;
    });

    const maxCount = Math.max(1, ...Object.values(dayCountMap));

    document.querySelectorAll('.day-bar').forEach(bar => {
        const day = bar.dataset.day;
        const count = dayCountMap[day] || 0;
        const fill = bar.querySelector('.bar-fill');
        const height = count > 0 ? Math.max(10, (count / maxCount) * 80) : 4;
        fill.style.height = height + 'px';
        fill.classList.toggle('active', count > 0);
    });
}

// ===== INIT =====
async function init() {
    await Promise.all([
        renderWorkoutHistory(),
        renderCombatHistory(),
        renderGoals(),
        updateWeeklyCount(),
    ]);
    updateTimerDisplay();
}

init();
