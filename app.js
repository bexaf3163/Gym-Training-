/* ==========================================================================
   GymNote — Марк и Лера (iOS Minimalist PWA)
   ========================================================================== */

(() => {
  'use strict';

  const STORAGE_KEY = 'gymnote_mark_lera_v4';
  const DB = window.GYM_DB;
  const SYNC = window.GYM_SYNC;

  const EQUIPMENT_TYPES = ['Тренажёр', 'Блок', 'Гантели', 'Штанга', 'Свой вес', 'Кардио'];
  const MUSCLE_GROUPS = ['Грудь', 'Спина', 'Ноги', 'Ягодицы', 'Плечи', 'Руки', 'Кор', 'Кардио'];
  const STEP_PRESETS = [1, 1.25, 2, 2.5, 5];

  const ACTIVITY_LEVELS = [
    {
      id: 'low',
      label: 'Низкая',
      short: 'Низкая акт.',
      desc: 'Сидячая работа, редкая активность или только начинаю зал'
    },
    {
      id: 'medium',
      label: 'Средняя',
      short: 'Средняя акт.',
      desc: '1–3 тренировки в неделю, обычный ритм жизни'
    },
    {
      id: 'high',
      label: 'Высокая',
      short: 'Высокая акт.',
      desc: '4+ тренировок в неделю или высокая ежедневная активность'
    }
  ];

  function cardioAndTimeRule(ex, activity, isFatLoss, isLera) {
    const kind = DB ? DB.getExerciseKind(ex) : (ex?.kind || 'base');
    const metric = DB ? DB.getExerciseMetric(ex) : (ex?.metric || 'weight');

    if (metric === 'cardio' || kind === 'cardio') {
      if (isFatLoss) {
        const minM = activity === 'low' ? 15 : activity === 'high' ? 25 : 20;
        const maxM = activity === 'low' ? 25 : activity === 'high' ? 35 : 30;
        return { ruleType: 'double', metric: 'cardio', minReps: minM, maxReps: maxM, step: 1, sets: 1 };
      }
      const minM = activity === 'low' ? 10 : 12;
      const maxM = activity === 'low' ? 15 : 20;
      return { ruleType: 'double', metric: 'cardio', minReps: minM, maxReps: maxM, step: 1, sets: 1 };
    }

    if (metric === 'time') {
      const minS = activity === 'low' ? 30 : activity === 'high' ? 60 : 45;
      const maxS = activity === 'low' ? 45 : activity === 'high' ? 90 : 60;
      return { ruleType: 'double', metric: 'time', minReps: minS, maxReps: maxS, step: 10, sets: 3 };
    }

    if (kind === 'bodyweight') {
      const sets = activity === 'high' ? 4 : 3;
      const minR = activity === 'low' ? 8 : isFatLoss ? 12 : (isLera ? 12 : 10);
      const maxR = activity === 'low' ? 12 : isFatLoss ? 18 : (isLera ? 16 : 15);
      return { ruleType: 'double', metric: 'weight', minReps: minR, maxReps: maxR, step: 2.5, sets };
    }
    return null;
  }

  // Детально проработанные готовые схемы прогрессии отдельно для Марка и Леры
  const PROGRESSION_SCHEMES = {
    mark: [
      {
        id: 'mark-mass',
        title: 'Набор массы и рост весов',
        desc: 'Классическая гипертрофия: плавный рост повторений, затем уверенная прибавка веса.',
        restSeconds: 90,
        specs: ['Крупные: 8–12', 'Изоляция: 10–15', 'Кардио: 12–20 мин', 'Отдых: 90с'],
        ruleFor(ex, activity) {
          const special = cardioAndTimeRule(ex, activity, false, false);
          if (special) return special;
          const kind = DB ? DB.getExerciseKind(ex) : 'base';
          const isLower = ['Ноги', 'Ягодицы'].includes(ex?.muscle);
          if (kind === 'core') return { ruleType: 'double', metric: 'weight', minReps: 12, maxReps: 18, step: 2.5, sets: 3 };
          if (kind === 'isolation') {
            return { ruleType: 'double', metric: 'weight', minReps: 10, maxReps: 15, step: ex?.equipment === 'Гантели' ? 1 : 2.5, sets: 3 };
          }
          const sets = activity === 'low' ? 3 : 4;
          return { ruleType: 'double', metric: 'weight', minReps: 8, maxReps: 12, step: isLower ? 5 : 2.5, sets };
        }
      },
      {
        id: 'mark-recomp',
        title: 'Похудение + рельеф и мышцы',
        desc: 'Более высокий темп, кардио и диапазон повторов — сжигаем жир, сохраняя и укрепляя мышцы.',
        restSeconds: 75,
        specs: ['Крупные: 10–14', 'Изоляция: 12–16', 'Кардио: 20–30 мин', 'Отдых: 75с'],
        ruleFor(ex, activity) {
          const special = cardioAndTimeRule(ex, activity, true, false);
          if (special) return special;
          const kind = DB ? DB.getExerciseKind(ex) : 'base';
          const isLower = ['Ноги', 'Ягодицы'].includes(ex?.muscle);
          if (kind === 'core') return { ruleType: 'double', metric: 'weight', minReps: 15, maxReps: 20, step: 2.5, sets: 3 };
          if (kind === 'isolation') return { ruleType: 'double', metric: 'weight', minReps: 12, maxReps: 16, step: 1.25, sets: 3 };
          const sets = activity === 'high' ? 4 : 3;
          return { ruleType: 'double', metric: 'weight', minReps: 10, maxReps: 14, step: isLower && activity !== 'low' ? 5 : 2.5, sets };
        }
      },
      {
        id: 'mark-strength',
        title: 'Силовая база',
        desc: 'Тяжёлые рабочие веса и больше подходов с полноценным отдыхом для быстрого роста силы.',
        restSeconds: 120,
        specs: ['Крупные: 5–8', 'Изоляция: 8–12', 'Кардио: 10–15 мин', 'Отдых: 120с'],
        ruleFor(ex, activity) {
          const special = cardioAndTimeRule(ex, activity, false, false);
          if (special) return special;
          const kind = DB ? DB.getExerciseKind(ex) : 'base';
          const isLower = ['Ноги', 'Ягодицы'].includes(ex?.muscle);
          if (kind === 'core') return { ruleType: 'double', metric: 'weight', minReps: 10, maxReps: 15, step: 2.5, sets: 3 };
          if (kind === 'isolation') return { ruleType: 'double', metric: 'weight', minReps: 8, maxReps: 12, step: 2, sets: 3 };
          const sets = activity === 'low' ? 3 : 4;
          return { ruleType: 'double', metric: 'weight', minReps: 5, maxReps: 8, step: isLower ? 5 : 2.5, sets };
        }
      }
    ],
    lera: [
      {
        id: 'lera-slim-glutes',
        title: 'Похудение + тонус, ягодицы и форма',
        desc: 'Динамичный темп и кардио для сжигания калорий с акцентом на упругие ягодицы и подтянутый верх.',
        restSeconds: 60,
        specs: ['Крупные: 12–15', 'Изоляция: 14–18', 'Кардио: 20–30 мин', 'Отдых: 60с'],
        ruleFor(ex, activity) {
          const special = cardioAndTimeRule(ex, activity, true, true);
          if (special) return special;
          const kind = DB ? DB.getExerciseKind(ex) : 'base';
          const isLower = ['Ноги', 'Ягодицы'].includes(ex?.muscle);
          if (kind === 'core') return { ruleType: 'double', metric: 'weight', minReps: 15, maxReps: 20, step: 1, sets: 3 };
          if (kind === 'isolation') {
            return { ruleType: 'double', metric: 'weight', minReps: 14, maxReps: 18, step: isLower ? 2.5 : 1, sets: 3 };
          }
          const sets = isLower && activity !== 'low' ? 4 : 3;
          return { ruleType: 'double', metric: 'weight', minReps: 12, maxReps: isLower ? 15 : 16, step: isLower && activity !== 'low' ? 5 : 2.5, sets };
        }
      },
      {
        id: 'lera-glutes-growth',
        title: 'Ягодицы и рост форм',
        desc: 'Акцент на округлость ягодиц и тонус тела: умеренные веса, 4 подхода на низ, плавный шаг.',
        restSeconds: 90,
        specs: ['Крупные: 10–12', 'Изоляция: 12–15', 'Кардио: 12–15 мин', 'Отдых: 90с'],
        ruleFor(ex, activity) {
          const special = cardioAndTimeRule(ex, activity, false, true);
          if (special) return special;
          const kind = DB ? DB.getExerciseKind(ex) : 'base';
          const isLower = ['Ноги', 'Ягодицы'].includes(ex?.muscle);
          if (kind === 'core') return { ruleType: 'double', metric: 'weight', minReps: 12, maxReps: 18, step: 1.25, sets: 3 };
          if (kind === 'isolation') return { ruleType: 'double', metric: 'weight', minReps: 12, maxReps: 15, step: isLower ? 2.5 : 1.25, sets: 3 };
          const sets = isLower && activity !== 'low' ? 4 : 3;
          return { ruleType: 'double', metric: 'weight', minReps: 10, maxReps: isLower ? 12 : 14, step: isLower ? 5 : 2.5, sets };
        }
      },
      {
        id: 'lera-strength',
        title: 'Силовой тонус и рост весов',
        desc: 'Если уже есть опыт в зале и хочется уверенно увеличивать рабочие веса без лишней усталости.',
        restSeconds: 105,
        specs: ['Крупные: 8–10', 'Изоляция: 10–14', 'Кардио: 10–15 мин', 'Отдых: 105с'],
        ruleFor(ex, activity) {
          const special = cardioAndTimeRule(ex, activity, false, true);
          if (special) return special;
          const kind = DB ? DB.getExerciseKind(ex) : 'base';
          const isLower = ['Ноги', 'Ягодицы'].includes(ex?.muscle);
          if (kind === 'core') return { ruleType: 'double', metric: 'weight', minReps: 12, maxReps: 16, step: 2.5, sets: 3 };
          if (kind === 'isolation') return { ruleType: 'double', metric: 'weight', minReps: 10, maxReps: 14, step: isLower ? 2.5 : 1.25, sets: 3 };
          const sets = activity === 'low' ? 3 : 4;
          return { ruleType: 'double', metric: 'weight', minReps: 8, maxReps: isLower ? 10 : 12, step: isLower ? 5 : 2.5, sets };
        }
      }
    ]
  };

  function getSchemeById(userId, schemeId) {
    const list = PROGRESSION_SCHEMES[userId] || PROGRESSION_SCHEMES.mark;
    return list.find((s) => s.id === schemeId) || list[0];
  }

  // Персональный расчёт рекомендации по весу, росту и физической активности
  function computeRecommendation(userId, body) {
    if (!body || !body.completed || !body.weightKg || !body.heightCm || !body.activity) {
      return null;
    }
    const hM = body.heightCm / 100;
    const bmi = Math.round((body.weightKg / (hM * hM)) * 10) / 10;
    const act = body.activity;
    const actObj = ACTIVITY_LEVELS.find((a) => a.id === act) || ACTIVITY_LEVELS[1];

    let schemeId;
    let reason;

    if (userId === 'lera') {
      if (bmi >= 22.8 || (act === 'low' && bmi >= 20.8)) {
        schemeId = 'lera-slim-glutes';
        reason = act === 'low'
          ? `При параметрах ${body.weightKg} кг / ${body.heightCm} см (ИМТ ${bmi}) и низкой активности лучше начать с мягкого режима похудения и тонуса: 3 подхода, кардио 15–25 мин и акцент на ягодицы без перегруза.`
          : `При параметрах ${body.weightKg} кг / ${body.heightCm} см (ИМТ ${bmi}) оптимальна плотная тренировка с отдыхом 60с и кардио 20–30 мин — высокий расход калорий при подтяжке ягодиц.`;
      } else if (act === 'high' && bmi >= 20.2) {
        schemeId = 'lera-strength';
        reason = `Отличная база (${body.weightKg} кг / ${body.heightCm} см) и высокая активность — тело хорошо восстанавливается, можно уверенно растить рабочие веса в диапазоне 8–10 повторов.`;
      } else {
        schemeId = 'lera-glutes-growth';
        reason = `При стройных параметрах (${body.weightKg} кг / ${body.heightCm} см, ИМТ ${bmi}) лучше сделать акцент на рост формы ягодиц и подтянутый верх в диапазоне 10–12 повторов.`;
      }
    } else {
      if (bmi >= 25.8 || (act === 'low' && bmi >= 24.5)) {
        schemeId = 'mark-recomp';
        reason = act === 'low'
          ? `При параметрах ${body.weightKg} кг / ${body.heightCm} см (ИМТ ${bmi}) и низкой активности оптимален плавный старт на рекомпозицию: 3 подхода по 10–14 повторов, кардио 15–25 мин и отдых 75с.`
          : `При параметрах ${body.weightKg} кг / ${body.heightCm} см (ИМТ ${bmi}) лучше всего сработает рекомпозиция: 10–14 повторов, кардио 20–30 мин и плотный отдых 75с.`;
      } else if (act === 'high' && bmi >= 22.5) {
        schemeId = 'mark-strength';
        reason = `При хорошей форме (${body.weightKg} кг / ${body.heightCm} см) и высокой активности можно делать упор на силовую базу (4×5–8) с полноценным отдыхом 120с.`;
      } else {
        schemeId = 'mark-mass';
        reason = `При параметрах ${body.weightKg} кг / ${body.heightCm} см (ИМТ ${bmi}) оптимальна классическая схема на массу и рост весов: 8–12 повторов на крупные мышцы и 10–15 на изоляцию.`;
      }
    }

    const baseRefWeight = userId === 'lera' ? 58 : 80;
    const weightFactor = Math.max(0.75, Math.min(1.25, body.weightKg / baseRefWeight));
    const actFactor = act === 'low' ? 0.85 : act === 'high' ? 1.12 : 1.0;

    return {
      bmi,
      activityLabel: actObj.label,
      schemeId,
      scheme: getSchemeById(userId, schemeId),
      reason,
      startWeightMultiplier: weightFactor * actFactor
    };
  }

  function getSmartRuleForExercise(userId, ex) {
    const profile = state?.profiles?.[userId];
    const rec = profile ? computeRecommendation(userId, profile.body) : null;
    const schemeId = profile?.activeSchemeId || rec?.schemeId || PROGRESSION_SCHEMES[userId][0].id;
    const scheme = getSchemeById(userId, schemeId);
    const activity = profile?.body?.activity || 'medium';
    return scheme.ruleFor(ex, activity);
  }

  function suggestStartWeight(userId, libItem) {
    if (!libItem) return userId === 'lera' ? 20 : 40;
    const metric = DB ? DB.getExerciseMetric(libItem) : (libItem.metric || 'weight');
    const base = userId === 'lera' ? (libItem.leraW ?? 20) : (libItem.markW ?? 40);
    if (metric === 'cardio') {
      const act = state?.profiles?.[userId]?.body?.activity || 'medium';
      const delta = act === 'low' ? -1 : act === 'high' ? 1 : 0;
      return Math.max(1, Math.round(base + delta));
    }
    if (!base) return 0;
    const profile = state?.profiles?.[userId];
    const rec = profile ? computeRecommendation(userId, profile.body) : null;
    const mult = rec ? rec.startWeightMultiplier : 1;
    const raw = base * mult;
    const step = libItem.step || 2.5;
    return Math.max(step, Math.round(raw / step) * step);
  }

  function createDefaultData() {
    return {
      activeUser: 'mark',
      activeTab: 'workout',
      workoutCategories: ['День 1', 'День 2', 'День 3'],
      workoutDayFilter: 'День 1',
      catalogFilter: 'all',
      progressionExerciseId: 'ex-1',
      progressionMetric: 'weight',
      settings: {
        theme: 'auto',
        restTimerEnabled: true,
        restSeconds: 90
      },
      exercises: [
        { id: 'ex-1', key: 'chest-press-machine', name: 'Жим от груди в тренажёре сидя', en: 'Seated Chest Press Machine', equipment: 'Тренажёр', muscle: 'Грудь', kind: 'base', day: 'День 1', visual: 'chest_press_machine' },
        { id: 'ex-2', key: 'lat-pulldown', name: 'Тяга верхнего блока', en: 'Lat Pulldown', equipment: 'Блок', muscle: 'Спина', kind: 'base', day: 'День 1', visual: 'lat_pulldown' },
        { id: 'ex-3', key: 'leg-press-45', name: 'Жим ногами под 45°', en: '45° Leg Press Machine', equipment: 'Тренажёр', muscle: 'Ноги', kind: 'base', day: 'День 1', visual: 'leg_press' },
        { id: 'ex-4', key: 'incline-db-press', name: 'Жим гантелей на наклонной скамье', en: 'Incline Dumbbell Press', equipment: 'Гантели', muscle: 'Грудь', kind: 'base', day: 'День 2', visual: 'incline_db_press' },
        { id: 'ex-5', key: 'hip-thrust-machine', name: 'Ягодичный мост в тренажёре', en: 'Hip Thrust / Booty Builder Machine', equipment: 'Тренажёр', muscle: 'Ягодицы', kind: 'base', day: 'День 1', visual: 'hip_thrust_machine' },
        { id: 'ex-6', key: 'seated-cable-row', name: 'Тяга горизонтального блока', en: 'Seated Cable Row', equipment: 'Блок', muscle: 'Спина', kind: 'base', day: 'День 2', visual: 'cable_row' },
        { id: 'ex-7', key: 'pec-deck', name: 'Сведение рук в тренажёре (Бабочка)', en: 'Pec Deck / Butterfly Fly', equipment: 'Тренажёр', muscle: 'Грудь', kind: 'isolation', day: 'День 3', visual: 'pec_deck' },
        { id: 'ex-8', key: 'leg-extension', name: 'Разгибание ног сидя в тренажёре', en: 'Seated Leg Extension', equipment: 'Тренажёр', muscle: 'Ноги', kind: 'isolation', day: 'День 2', visual: 'leg_extension' },
        { id: 'ex-9', key: 'hip-abduction', name: 'Разведение ног в тренажёре', en: 'Seated Hip Abduction Machine', equipment: 'Тренажёр', muscle: 'Ягодицы', kind: 'isolation', day: 'День 2', visual: 'abduction' },
        { id: 'ex-10', key: 'shoulder-press-machine', name: 'Жим плечами в тренажёре сидя', en: 'Seated Shoulder Press Machine', equipment: 'Тренажёр', muscle: 'Плечи', kind: 'base', day: 'День 3', visual: 'shoulder_press' }
      ],
      profiles: {
        mark: {
          name: 'Марк',
          activeSchemeId: 'mark-mass',
          body: { weightKg: null, heightCm: null, activity: '', completed: false },
          items: {
            'ex-1': {
              inPlan: true,
              day: 'День 1',
              setupNote: '',
              weight: 65,
              step: 2.5,
              ruleType: 'double',
              minReps: 8,
              maxReps: 12,
              sets: [
                { reps: 12, done: true, weight: 62.5 },
                { reps: 12, done: true, weight: 65 },
                { reps: 11, done: false }
              ],
              history: [
                { date: '2026-10-14', weight: 57.5, reps: 10 },
                { date: '2026-10-21', weight: 60, reps: 10 },
                { date: '2026-10-28', weight: 60, reps: 12 },
                { date: '2026-11-04', weight: 62.5, reps: 11 },
                { date: '2026-11-12', weight: 65, reps: 10 }
              ]
            },
            'ex-2': {
              inPlan: true,
              day: 'День 1',
              setupNote: '',
              weight: 60,
              step: 2.5,
              ruleType: 'double',
              minReps: 8,
              maxReps: 12,
              sets: [
                { reps: 12, done: true, weight: 60 },
                { reps: 12, done: true, weight: 60 },
                { reps: 12, done: true, weight: 60 }
              ],
              history: [
                { date: '2026-10-14', weight: 52.5, reps: 10 },
                { date: '2026-10-24', weight: 55, reps: 11 },
                { date: '2026-11-05', weight: 57.5, reps: 12 },
                { date: '2026-11-14', weight: 60, reps: 10 }
              ]
            },
            'ex-3': {
              inPlan: true,
              day: 'День 1',
              setupNote: '',
              weight: 140,
              step: 5,
              ruleType: 'double',
              minReps: 8,
              maxReps: 12,
              sets: [
                { reps: 10, done: false },
                { reps: 10, done: false },
                { reps: 10, done: false }
              ],
              history: [
                { date: '2026-10-15', weight: 125, reps: 10 },
                { date: '2026-10-26', weight: 130, reps: 12 },
                { date: '2026-11-07', weight: 135, reps: 12 },
                { date: '2026-11-16', weight: 140, reps: 10 }
              ]
            },
            'ex-4': {
              inPlan: true,
              day: 'День 2',
              setupNote: '',
              weight: 24,
              step: 2,
              ruleType: 'double',
              minReps: 8,
              maxReps: 12,
              sets: [
                { reps: 9, done: false },
                { reps: 9, done: false },
                { reps: 8, done: false }
              ],
              history: [
                { date: '2026-10-18', weight: 20, reps: 10 },
                { date: '2026-11-01', weight: 22, reps: 11 },
                { date: '2026-11-12', weight: 24, reps: 9 }
              ]
            },
            'ex-6': {
              inPlan: true,
              day: 'День 2',
              setupNote: '',
              weight: 55,
              step: 2.5,
              ruleType: 'double',
              minReps: 8,
              maxReps: 12,
              sets: [
                { reps: 10, done: false },
                { reps: 10, done: false },
                { reps: 10, done: false }
              ],
              history: [{ date: '2026-11-10', weight: 55, reps: 10 }]
            },
            'ex-8': {
              inPlan: true,
              day: 'День 2',
              setupNote: '',
              weight: 60,
              step: 5,
              ruleType: 'double',
              minReps: 10,
              maxReps: 15,
              sets: [
                { reps: 12, done: false },
                { reps: 12, done: false },
                { reps: 12, done: false }
              ],
              history: [{ date: '2026-11-10', weight: 60, reps: 12 }]
            },
            'ex-7': {
              inPlan: true,
              day: 'День 3',
              setupNote: '',
              weight: 50,
              step: 2.5,
              ruleType: 'double',
              minReps: 10,
              maxReps: 15,
              sets: [
                { reps: 12, done: false },
                { reps: 12, done: false },
                { reps: 12, done: false }
              ],
              history: [{ date: '2026-11-11', weight: 50, reps: 12 }]
            },
            'ex-10': {
              inPlan: true,
              day: 'День 3',
              setupNote: '',
              weight: 45,
              step: 2.5,
              ruleType: 'double',
              minReps: 8,
              maxReps: 12,
              sets: [
                { reps: 10, done: false },
                { reps: 10, done: false },
                { reps: 10, done: false }
              ],
              history: [{ date: '2026-11-11', weight: 45, reps: 10 }]
            }
          }
        },
        lera: {
          name: 'Лера',
          activeSchemeId: 'lera-slim-glutes',
          body: { weightKg: null, heightCm: null, activity: '', completed: false },
          items: {
            'ex-5': {
              inPlan: true,
              day: 'День 1',
              setupNote: '',
              weight: 60,
              step: 5,
              ruleType: 'double',
              minReps: 12,
              maxReps: 15,
              sets: [
                { reps: 15, done: true, weight: 55 },
                { reps: 15, done: true, weight: 60 },
                { reps: 15, done: true, weight: 60 }
              ],
              history: [
                { date: '2026-10-14', weight: 45, reps: 12 },
                { date: '2026-10-23', weight: 50, reps: 14 },
                { date: '2026-11-02', weight: 55, reps: 15 },
                { date: '2026-11-14', weight: 60, reps: 13 }
              ]
            },
            'ex-3': {
              inPlan: true,
              day: 'День 1',
              setupNote: '',
              weight: 70,
              step: 5,
              ruleType: 'double',
              minReps: 12,
              maxReps: 15,
              sets: [
                { reps: 13, done: true, weight: 70 },
                { reps: 13, done: false },
                { reps: 12, done: false }
              ],
              history: [
                { date: '2026-10-16', weight: 55, reps: 12 },
                { date: '2026-10-27', weight: 60, reps: 14 },
                { date: '2026-11-06', weight: 65, reps: 15 },
                { date: '2026-11-15', weight: 70, reps: 13 }
              ]
            },
            'ex-2': {
              inPlan: true,
              day: 'День 1',
              setupNote: '',
              weight: 30,
              step: 2.5,
              ruleType: 'double',
              minReps: 12,
              maxReps: 16,
              sets: [
                { reps: 13, done: false },
                { reps: 13, done: false },
                { reps: 12, done: false }
              ],
              history: [
                { date: '2026-10-15', weight: 25, reps: 12 },
                { date: '2026-10-29', weight: 27.5, reps: 15 },
                { date: '2026-11-13', weight: 30, reps: 13 }
              ]
            },
            'ex-9': {
              inPlan: true,
              day: 'День 2',
              setupNote: '',
              weight: 45,
              step: 2.5,
              ruleType: 'double',
              minReps: 14,
              maxReps: 18,
              sets: [
                { reps: 15, done: false },
                { reps: 15, done: false },
                { reps: 15, done: false }
              ],
              history: [{ date: '2026-11-12', weight: 45, reps: 15 }]
            },
            'ex-6': {
              inPlan: true,
              day: 'День 2',
              setupNote: '',
              weight: 27.5,
              step: 2.5,
              ruleType: 'double',
              minReps: 12,
              maxReps: 16,
              sets: [
                { reps: 12, done: false },
                { reps: 12, done: false },
                { reps: 12, done: false }
              ],
              history: [
                { date: '2026-10-20', weight: 22.5, reps: 12 },
                { date: '2026-11-03', weight: 25, reps: 15 },
                { date: '2026-11-15', weight: 27.5, reps: 12 }
              ]
            },
            'ex-8': {
              inPlan: true,
              day: 'День 3',
              setupNote: '',
              weight: 35,
              step: 2.5,
              ruleType: 'double',
              minReps: 14,
              maxReps: 18,
              sets: [
                { reps: 15, done: false },
                { reps: 15, done: false },
                { reps: 15, done: false }
              ],
              history: [{ date: '2026-11-12', weight: 35, reps: 15 }]
            },
            'ex-1': {
              inPlan: true,
              day: 'День 3',
              setupNote: '',
              weight: 22.5,
              step: 2.5,
              ruleType: 'double',
              minReps: 12,
              maxReps: 16,
              sets: [
                { reps: 12, done: false },
                { reps: 12, done: false },
                { reps: 12, done: false }
              ],
              history: [{ date: '2026-11-08', weight: 22.5, reps: 12 }]
            }
          }
        }
      }
    };
  }

  let state = loadState();
  let catalogSearch = '';
  let addSheetSearch = '';
  let addSheetMuscle = 'Все';
  let timerState = { active: false, remaining: 0, intervalId: null };
  let toastTimeout = null;
  let sheetLocked = false;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
        || localStorage.getItem('gymnote_mark_lera_v3')
        || localStorage.getItem('gymnote_mark_lera_v2')
        || localStorage.getItem('gymnote_mark_lera_v1');
      if (!raw) return createDefaultData();
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.profiles || !parsed.profiles.mark || !parsed.profiles.lera) {
        return createDefaultData();
      }
      // Переход со старой единственной категории «Фулбади» на День 1 / День 2 / День 3
      if (!Array.isArray(parsed.workoutCategories) || parsed.workoutCategories.length === 0 || (parsed.workoutCategories.length === 1 && parsed.workoutCategories[0] === 'Фулбади')) {
        parsed.workoutCategories = ['День 1', 'День 2', 'День 3'];
      }
      const primaryCat = parsed.workoutCategories[0];
      if (!parsed.workoutCategories.includes(parsed.workoutDayFilter)) {
        parsed.workoutDayFilter = primaryCat;
      }
      (parsed.exercises || []).forEach((ex) => {
        const match = DB?.EXERCISES_LIBRARY.find((l) => (ex.key && l.key === ex.key) || l.name === ex.name) || DB?.findLibraryMatch(ex.name);
        if (match) {
          ex.visual = match.visual;
          if (!ex.en) ex.en = match.en;
          if (!ex.key) ex.key = match.key;
          if (!ex.kind && match.kind) ex.kind = match.kind;
          if (!ex.metric && match.metric) ex.metric = match.metric;
        }
        if (!parsed.workoutCategories.includes(ex.day)) ex.day = primaryCat;
      });
      ['mark', 'lera'].forEach((uid) => {
        const prof = parsed.profiles[uid];
        if (!prof.body) {
          prof.body = { weightKg: null, heightCm: null, activity: '', completed: false };
        }
        if (!prof.activeSchemeId) {
          prof.activeSchemeId = uid === 'lera' ? 'lera-slim-glutes' : 'mark-mass';
        }
        Object.values(prof.items || {}).forEach((it) => {
          if (!parsed.workoutCategories.includes(it.day)) it.day = primaryCat;
        });
      });
      return parsed;
    } catch {
      return createDefaultData();
    }
  }

  function saveState(options = {}) {
    const { sync = true, touchUser = state.activeUser } = options;
    if (touchUser && state.profiles?.[touchUser]) {
      state.profiles[touchUser].updatedAt = new Date().toISOString();
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota issues silently
    }
    if (sync && SYNC) {
      SYNC.schedulePush(
        () => state,
        (merged) => {
          state = merged;
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
          render();
        }
      );
    }
  }

  function todayISO() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatShortDate(iso) {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const mIdx = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
    return `${parseInt(parts[2], 10)} ${months[mIdx]}`;
  }

  function formatWeight(num) {
    const rounded = Math.round(num * 100) / 100;
    return String(rounded).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getVisualForExercise(ex) {
    if (!DB) return '';
    if (ex.visual) return DB.getVisualSvg(ex.visual);
    const match = DB.findLibraryMatch(ex.name);
    if (match) return DB.getVisualSvg(match.visual);
    const fallbackByMuscle = {
      'Грудь': 'chest_press_machine',
      'Спина': 'lat_pulldown',
      'Ноги': 'leg_press',
      'Ягодицы': 'hip_thrust',
      'Плечи': 'shoulder_press',
      'Руки': 'bicep_curl',
      'Кор': 'floor_crunch',
      'Кардио': 'treadmill'
    };
    return DB.getVisualSvg(fallbackByMuscle[ex.muscle] || 'chest_press_machine');
  }

  function getExMetric(ex) {
    if (!ex) return 'weight';
    if (ex.metric) return ex.metric;
    return DB ? DB.getExerciseMetric(ex) : (ex.equipment === 'Кардио' || ex.muscle === 'Кардио' ? 'cardio' : 'weight');
  }

  function getExKind(ex) {
    if (!ex) return 'base';
    return DB ? DB.getExerciseKind(ex) : (ex.kind || 'base');
  }

  function renderUniqueTags(tags) {
    const seen = new Set();
    return tags
      .filter((t) => {
        if (!t || !t.text) return false;
        const norm = String(t.text).trim().toLowerCase();
        if (!norm || seen.has(norm)) return false;
        seen.add(norm);
        return true;
      })
      .map((t) => `<span class="tag${t.cls ? ` ${t.cls}` : ''}">${escapeHtml(t.text)}</span>`)
      .join('');
  }

  function getActiveProfile() {
    return state.profiles[state.activeUser];
  }

  function getDefaultCategory() {
    return (state.workoutCategories && state.workoutCategories[0]) || 'День 1';
  }

  function ensureUserItem(userId, exId, defaults = {}) {
    const profile = state.profiles[userId];
    if (!profile.items[exId]) {
      const ex = state.exercises.find((e) => e.id === exId);
      const metric = getExMetric(ex);
      const kind = getExKind(ex);
      const smart = getSmartRuleForExercise(userId, ex);
      const defaultFallbackW = metric === 'cardio' ? 5 : (metric === 'time' || kind === 'bodyweight' ? 0 : (userId === 'lera' ? 20 : 40));
      const startW = defaults.weight ?? defaultFallbackW;
      const step = defaults.step ?? smart.step;
      const minReps = defaults.minReps ?? smart.minReps;
      const maxReps = defaults.maxReps ?? smart.maxReps;
      const setsCount = defaults.sets ?? smart.sets ?? 3;
      profile.items[exId] = {
        inPlan: defaults.inPlan ?? false,
        day: defaults.day ?? getDefaultCategory(),
        setupNote: defaults.setupNote ?? '',
        weight: startW,
        step,
        ruleType: defaults.ruleType ?? smart.ruleType,
        minReps,
        maxReps,
        sets: Array.from({ length: setsCount }, () => ({ reps: minReps, done: false })),
        history: [{ date: todayISO(), weight: startW, reps: minReps }]
      };
    }
    return profile.items[exId];
  }

  function applySchemeToUser(userId, schemeId, exerciseIdOnly = null) {
    const profile = state.profiles[userId];
    const scheme = getSchemeById(userId, schemeId);
    const activity = profile.body?.activity || 'medium';

    if (!exerciseIdOnly) {
      profile.activeSchemeId = scheme.id;
      state.settings.restSeconds = scheme.restSeconds;
    }

    const ids = exerciseIdOnly ? [exerciseIdOnly] : Object.keys(profile.items);
    ids.forEach((id) => {
      const ex = state.exercises.find((e) => e.id === id);
      const item = profile.items[id];
      if (!ex || !item) return;
      const rule = scheme.ruleFor(ex, activity);
      item.ruleType = rule.ruleType;
      item.minReps = rule.minReps;
      item.maxReps = rule.maxReps;
      item.step = rule.step;
      if (!exerciseIdOnly && rule.sets) {
        while (item.sets.length < rule.sets) {
          item.sets.push({ reps: rule.minReps, done: false });
        }
        while (item.sets.length > rule.sets) {
          item.sets.pop();
        }
      }
      // Аккуратно подгоняем невыполненные подходы в диапазон, если они выходят за него
      item.sets.forEach((s) => {
        if (!s.done) {
          if (s.reps < rule.minReps) s.reps = rule.minReps;
          if (s.reps > rule.maxReps) s.reps = rule.maxReps;
        }
      });
    });
  }

  function getUserPlanExercises(userId = state.activeUser) {
    const profile = state.profiles[userId];
    return state.exercises
      .filter((ex) => profile.items[ex.id] && profile.items[ex.id].inPlan)
      .map((ex) => ({ ex, item: profile.items[ex.id] }));
  }

  function explainRulePlain(item, ex = null) {
    const metric = getExMetric(ex);
    const kind = getExKind(ex);
    const w = formatWeight(item.weight);
    const nextW = formatWeight(item.weight + item.step);
    const setsCount = item.sets.length || 3;

    if (metric === 'cardio') {
      if (item.ruleType === 'double') {
        return `<strong>Как работает прогрессия (кардио):</strong> сейчас уровень <strong>${w}</strong>, цель <strong>${item.minReps}–${item.maxReps} мин</strong>. Как только выполните ${item.maxReps} мин — появится зелёная кнопка поднять сложность до <strong>ур. ${nextW}</strong> и снова начать с ${item.minReps} мин.`;
      }
      return `<strong>Как работает прогрессия (кардио):</strong> уровень и время меняются вручную кнопками +/−, а длительность автоматически сохраняется в график.`;
    }

    if (metric === 'time') {
      if (item.ruleType === 'double') {
        return `<strong>Как работает прогрессия (статика):</strong> цель <strong>${item.minReps}–${item.maxReps} сек</strong> во всех ${setsCount} подходах. Дошли до ${item.maxReps} сек — появится кнопка поднять планку до <strong>${item.maxReps + item.step} сек</strong>.`;
      }
      return `<strong>Как работает прогрессия (статика):</strong> длительность в секундах регулируется вручную, а лучший результат попадает в график.`;
    }

    if (item.weight === 0 && (kind === 'bodyweight' || kind === 'core')) {
      if (item.ruleType === 'double') {
        return `<strong>Как работает прогрессия (свой вес):</strong> цель <strong>${item.minReps}–${item.maxReps} повторов</strong> во всех ${setsCount} подходах. Как только все подходы получатся по ${item.maxReps} раз — цель автоматически вырастет до <strong>${item.minReps + 2}–${item.maxReps + 2} повт.</strong> (или можно добавить доп. вес кнопкой +).`;
      }
    }

    if (item.ruleType === 'double') {
      return `<strong>Как работает прогрессия:</strong> сейчас ${w} кг, цель ${item.minReps}–${item.maxReps} повторов. Как только все ${setsCount} подхода получатся по ${item.maxReps} раз — появится зелёная кнопка поднять вес до <strong>${nextW} кг</strong> и снова начать с ${item.minReps} повторов.`;
    }
    if (item.ruleType === 'linear') {
      return `<strong>Как работает прогрессия:</strong> выполнили все ${setsCount} подхода по ${item.minReps} раз с весом ${w} кг — на следующей тренировке сразу поднимаем вес до <strong>${nextW} кг</strong>.`;
    }
    return `<strong>Как работает прогрессия:</strong> вес меняется вручную кнопками +/−, а график и история сохраняются автоматически.`;
  }

  function isReadyToProgress(item) {
    if (!item.sets.length || !item.sets.every((s) => s.done)) return false;
    if (item.ruleType === 'double') {
      return item.sets.every((s) => s.reps >= item.maxReps);
    }
    if (item.ruleType === 'linear') {
      return item.sets.every((s) => s.reps >= item.minReps);
    }
    return false;
  }

  function calcE1RM(weight, reps) {
    const r = Math.max(1, reps || 1);
    if (r === 1) return weight;
    return Math.round(weight * (1 + r / 30) * 10) / 10;
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.remove('show'), 2400);
  }

  /* ---- Theme & Profile Sync ---- */
  function applyThemeAndUser() {
    const html = document.documentElement;
    html.setAttribute('data-user', state.activeUser);

    let resolvedTheme = state.settings.theme;
    if (resolvedTheme === 'auto') {
      resolvedTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    html.setAttribute('data-theme', resolvedTheme);

    const metaTheme = document.getElementById('meta-theme-color');
    if (metaTheme) {
      metaTheme.setAttribute('content', resolvedTheme === 'dark' ? '#000000' : '#F2F2F7');
    }

    const sw = document.getElementById('profile-switch');
    if (sw) sw.setAttribute('data-active', state.activeUser);

    document.querySelectorAll('[data-user-btn]').forEach((btn) => {
      const isActive = btn.getAttribute('data-user-btn') === state.activeUser;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === state.activeTab);
    });
  }

  /* ---- Rest Timer ---- */
  function startRestTimer(seconds = state.settings.restSeconds) {
    stopRestTimer(false);
    timerState.active = true;
    timerState.remaining = seconds;
    renderTimerStrip();
    timerState.intervalId = setInterval(() => {
      timerState.remaining -= 1;
      if (timerState.remaining <= 0) {
        timerState.remaining = 0;
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
        if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
      }
      renderTimerStrip();
    }, 1000);
  }

  function stopRestTimer(rerender = true) {
    if (timerState.intervalId) {
      clearInterval(timerState.intervalId);
      timerState.intervalId = null;
    }
    timerState.active = false;
    timerState.remaining = 0;
    if (rerender) renderTimerStrip();
  }

  function renderTimerStrip() {
    const launchBtn = document.getElementById('btn-timer-launch');
    if (launchBtn) launchBtn.classList.toggle('running', timerState.active);
    const container = document.getElementById('timer-container');
    if (!container) return;
    if (!timerState.active) {
      container.innerHTML = '';
      return;
    }
    const mins = Math.floor(timerState.remaining / 60);
    const secs = String(timerState.remaining % 60).padStart(2, '0');
    const finished = timerState.remaining === 0;
    container.innerHTML = `
      <div class="timer-strip ${finished ? 'finished' : ''}">
        <span class="tabular">${finished ? 'Отдых завершён — можно к подходу!' : `Отдых: ${mins}:${secs}`}</span>
        <div class="timer-controls">
          ${!finished ? `<button type="button" class="timer-chip" data-action="timer-add">+15с</button>` : ''}
          <button type="button" class="timer-chip" data-action="timer-stop">${finished ? 'Ок' : 'Скрыть'}</button>
        </div>
      </div>
    `;
  }

  /* ---- Screen 1: Workout ---- */
  function renderWorkoutScreen() {
    const profile = getActiveProfile();
    const cats = state.workoutCategories || ['День 1', 'День 2', 'День 3'];
    const activeDay = cats.includes(state.workoutDayFilter) ? state.workoutDayFilter : cats[0];
    state.workoutDayFilter = activeDay;

    const allPlanned = getUserPlanExercises(state.activeUser);
    const filtered = allPlanned.filter(({ item }) => item.day === activeDay);
    const doneSets = filtered.reduce((sum, { item }) => sum + item.sets.filter((s) => s.done).length, 0);

    return `
      <div class="workout-top-row">
        <div class="day-switcher" role="tablist" aria-label="Дни тренировок">
          ${cats.map((d) => `
            <button type="button" class="day-seg-btn ${activeDay === d ? 'active' : ''}" data-action="set-day-filter" data-day="${escapeHtml(d)}" role="tab" aria-selected="${activeDay === d}">
              ${escapeHtml(d)}
            </button>
          `).join('')}
        </div>

        <button type="button" class="timer-launch-pill tabular ${timerState.active ? 'running' : ''}" id="btn-timer-launch" data-action="start-timer-manual" title="Запустить таймер отдыха">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9.5 2h5"/>
          </svg>
          <span>${state.settings.restSeconds}с</span>
        </button>
      </div>

      ${filtered.length > 0 ? `
        <div class="card-stack">
          ${filtered.map(({ ex, item }) => renderExerciseWorkoutCard(ex, item)).join('')}
        </div>

        <button type="button" class="finish-workout-btn" data-action="finish-workout" ${doneSets === 0 ? 'disabled' : ''}>
          Завершить тренировку
        </button>
      ` : `
        <div class="empty-card">
          <h2 class="empty-title">${escapeHtml(activeDay)} пока пустой</h2>
          <p class="empty-sub">Добавьте упражнения и тренажёры для ${escapeHtml(profile.name)} в «${escapeHtml(activeDay)}».</p>
          <button type="button" class="btn-primary-full" data-action="open-add-sheet">+ Добавить в ${escapeHtml(activeDay)}</button>
        </div>
      `}
    `;
  }

  function renderExerciseWorkoutCard(ex, item) {
    const metric = getExMetric(ex);
    const kind = getExKind(ex);
    const isBodyweightZero = item.weight === 0 && (metric === 'time' || kind === 'bodyweight' || kind === 'core');
    const ready = isReadyToProgress(item);
    const nextWeight = formatWeight(item.weight + item.step);

    const topNum = isBodyweightZero ? 'Свой' : formatWeight(item.weight);
    const topUnit = metric === 'cardio' ? 'ур.' : (isBodyweightZero ? 'вес' : 'кг');
    const repUnit = metric === 'cardio' ? 'мин' : (metric === 'time' ? 'сек' : 'повт.');

    let ctaLabel = `Цель достигнута → Поднять до ${nextWeight} кг`;
    if (metric === 'cardio') {
      ctaLabel = `Цель достигнута → Поднять до ур. ${nextWeight}`;
    } else if (metric === 'time') {
      ctaLabel = `Цель достигнута → Новая цель ${item.maxReps + item.step} сек`;
    } else if (isBodyweightZero) {
      ctaLabel = `Цель достигнута → Поднять до ${item.minReps + 2}–${item.maxReps + 2} повт.`;
    }

    return `
      <article class="exercise-card ${ready ? 'ready-progress' : ''}">
        <div class="ex-top">
          <div class="ex-head-left">
            <button type="button" class="ex-thumb" data-action="open-visual-preview" data-ex-id="${ex.id}" title="Показать визуализацию тренажёра">
              ${getVisualForExercise(ex)}
            </button>
            <div class="ex-meta" data-action="open-edit-sheet" data-ex-id="${ex.id}" style="cursor:pointer;">
              <div class="ex-tags">
                ${renderUniqueTags([
                  { text: ex.equipment, cls: 'accent' },
                  { text: ex.muscle }
                ])}
              </div>
              <h2 class="ex-name">${escapeHtml(ex.name)}</h2>
            </div>
          </div>

          <div class="weight-stepper">
            <button type="button" class="step-btn" data-action="weight-step" data-ex-id="${ex.id}" data-delta="-1" aria-label="Уменьшить">−</button>
            <button type="button" class="weight-readout tabular" data-action="open-weight-sheet" data-ex-id="${ex.id}" title="Ввести вручную">
              <span class="weight-num">${topNum}</span>
              <span class="weight-unit">${topUnit}</span>
            </button>
            <button type="button" class="step-btn" data-action="weight-step" data-ex-id="${ex.id}" data-delta="1" aria-label="Увеличить">+</button>
          </div>
        </div>

        <div class="sets-list">
          ${item.sets.map((s, idx) => {
            const setW = typeof s.weight === 'number' ? s.weight : item.weight;
            const setLabel = metric === 'cardio'
              ? (item.sets.length === 1 ? 'Сессия' : `Интервал ${idx + 1}`)
              : `Подход ${idx + 1}`;
            const badgeText = metric === 'cardio'
              ? `ур. ${formatWeight(setW)}`
              : (setW === 0 && (metric === 'time' || kind === 'bodyweight' || kind === 'core') ? 'Свой вес' : `${formatWeight(setW)} кг`);
            return `
              <div class="set-row ${s.done ? 'done' : ''}">
                <div class="set-left tabular">
                  <span class="set-index">${setLabel}</span>
                  ${s.done ? `<span class="set-weight-badge">${badgeText}</span>` : ''}
                </div>
                <div class="reps-control">
                  <button type="button" class="mini-btn" data-action="reps-step" data-ex-id="${ex.id}" data-set="${idx}" data-delta="-1" aria-label="Уменьшить">−</button>
                  <span class="reps-value tabular">${s.reps} ${repUnit}</span>
                  <button type="button" class="mini-btn" data-action="reps-step" data-ex-id="${ex.id}" data-set="${idx}" data-delta="1" aria-label="Увеличить">+</button>
                </div>
                <button type="button" class="check-btn ${s.done ? 'done' : ''}" data-action="toggle-set" data-ex-id="${ex.id}" data-set="${idx}" aria-label="Отметить подход">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                </button>
              </div>
            `;
          }).join('')}
        </div>

        <div class="set-actions-row">
          <div style="display:flex;align-items:center;gap:6px;">
            <button type="button" class="text-action-btn" data-action="add-set" data-ex-id="${ex.id}">${metric === 'cardio' ? '+ Интервал' : '+ Подход'}</button>
            ${item.sets.length > 1 ? `<button type="button" class="text-action-btn" data-action="remove-set" data-ex-id="${ex.id}">${metric === 'cardio' ? '− Интервал' : '− Подход'}</button>` : ''}
          </div>
          <button type="button" class="text-action-btn" style="color:var(--danger);opacity:0.85;" data-action="open-remove-sheet" data-ex-id="${ex.id}">Удалить</button>
        </div>

        ${ready ? `
          <button type="button" class="progress-cta" data-action="apply-progression" data-ex-id="${ex.id}">
            <span>${ctaLabel}</span>
          </button>
        ` : ''}
      </article>
    `;
  }

  /* ---- Screen 2: Progression ---- */
  function buildProgressionChartSVG(history, plotMode) {
    const width = 320;
    const height = 148;
    const padX = 24;
    const padTop = 24;
    const padBottom = 26;

    const points = history.map((h) => ({
      date: formatShortDate(h.date),
      value: plotMode === 'e1rm'
        ? calcE1RM(h.weight, h.reps)
        : (plotMode === 'reps' ? h.reps : h.weight)
    }));

    if (points.length === 0) {
      return `<div style="padding:24px 0;text-align:center;color:var(--text-secondary);font-size:13px;">Пока нет записей в истории</div>`;
    }

    const vals = points.map((p) => p.value);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const margin = Math.max(2, (maxVal - minVal) * 0.22);
    const low = Math.max(0, minVal - margin);
    const high = maxVal + margin;
    const span = Math.max(1, high - low);

    const coords = points.map((pt, i) => {
      const x = points.length === 1
        ? width / 2
        : padX + (i / (points.length - 1)) * (width - padX * 2);
      const y = height - padBottom - ((pt.value - low) / span) * (height - padTop - padBottom);
      return { x, y, ...pt };
    });

    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
    const areaPath = coords.length > 1
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height - padBottom} L ${coords[0].x.toFixed(1)} ${height - padBottom} Z`
      : '';

    const labelStep = coords.length > 6 ? 2 : 1;

    return `
      <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;display:block;overflow:visible;">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.24"/>
            <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.01"/>
          </linearGradient>
        </defs>
        <line x1="${padX}" y1="${padTop}" x2="${width - padX}" y2="${padTop}" stroke="var(--separator)" stroke-dasharray="3 3"/>
        <line x1="${padX}" y1="${height - padBottom}" x2="${width - padX}" y2="${height - padBottom}" stroke="var(--separator)"/>
        ${areaPath ? `<path d="${areaPath}" fill="url(#chartGrad)"/>` : ''}
        ${coords.length > 1 ? `<path d="${linePath}" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
        ${coords.map((c, idx) => {
          const isLast = idx === coords.length - 1;
          const showLabel = isLast || idx === 0 || idx % labelStep === 0;
          return `
            <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${isLast ? 5 : 3.5}" fill="${isLast ? 'var(--accent)' : 'var(--card)'}" stroke="var(--accent)" stroke-width="2.2"/>
            ${showLabel ? `<text x="${c.x.toFixed(1)}" y="${(c.y - 9).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--text)">${formatWeight(c.value)}</text>` : ''}
            ${showLabel ? `<text x="${c.x.toFixed(1)}" y="${height - 7}" text-anchor="middle" font-size="9.5" fill="var(--text-secondary)">${escapeHtml(c.date)}</text>` : ''}
          `;
        }).join('')}
      </svg>
    `;
  }

  function renderProgressionScreen() {
    const profile = getActiveProfile();
    const available = state.exercises
      .filter((ex) => profile.items[ex.id])
      .sort((a, b) => Number(Boolean(profile.items[b.id]?.inPlan)) - Number(Boolean(profile.items[a.id]?.inPlan)));

    const rec = computeRecommendation(state.activeUser, profile.body);
    const actShort = ACTIVITY_LEVELS.find((a) => a.id === profile.body?.activity)?.short || '';
    const bodyBar = `
      <div class="body-profile-bar">
        <div>
          ${profile.body?.completed ? `
            <div class="body-profile-text tabular">${profile.body.weightKg} кг • ${profile.body.heightCm} см • ${escapeHtml(actShort)}</div>
            <div class="body-profile-sub">ИМТ ${rec?.bmi} • Схема подбирается по вашим данным</div>
          ` : `
            <div class="body-profile-text">Заполните вес, рост и активность</div>
            <div class="body-profile-sub">Чтобы подобрать оптимальную схему для ${escapeHtml(state.activeUser === 'mark' ? 'Марка' : 'Леры')}</div>
          `}
        </div>
        <button type="button" class="rule-bar-link" data-action="open-body-profile">
          ${profile.body?.completed ? 'Изменить ›' : 'Заполнить ›'}
        </button>
      </div>
    `;

    if (available.length === 0) {
      return `
        ${bodyBar}
        <div class="empty-card">
          <h2 class="empty-title">Нет упражнений для отслеживания</h2>
          <p class="empty-sub">Добавьте первое упражнение или тренажёр, чтобы строить график прогрессии.</p>
          <button type="button" class="btn-primary-full" data-action="open-add-sheet">+ Добавить упражнение</button>
        </div>
      `;
    }

    const selectedEx = available.find((e) => e.id === state.progressionExerciseId) || available[0];
    state.progressionExerciseId = selectedEx.id;
    const item = profile.items[selectedEx.id];
    const hist = item.history || [];
    const exMetric = getExMetric(selectedEx);
    const exKind = getExKind(selectedEx);
    const isPureBodyweight = exMetric === 'weight' && item.weight === 0 && (exKind === 'bodyweight' || exKind === 'core') && hist.every((h) => h.weight === 0);

    let plotMode = state.progressionMetric === 'e1rm' ? 'e1rm' : 'weight';
    let valueUnit = 'кг';
    if (exMetric === 'cardio') {
      plotMode = state.progressionMetric === 'e1rm' ? 'weight' : 'reps';
      valueUnit = plotMode === 'weight' ? 'ур.' : 'мин';
    } else if (exMetric === 'time') {
      plotMode = 'reps';
      valueUnit = 'сек';
    } else if (isPureBodyweight) {
      plotMode = 'reps';
      valueUnit = 'повт.';
    }

    const vals = hist.map((h) => (plotMode === 'e1rm' ? calcE1RM(h.weight, h.reps) : (plotMode === 'reps' ? h.reps : h.weight)));
    const fallbackCurrent = plotMode === 'reps' ? (item.sets[0]?.reps || item.minReps) : item.weight;
    const startVal = vals.length ? vals[0] : fallbackCurrent;
    const currentVal = vals.length ? vals[vals.length - 1] : fallbackCurrent;
    const bestVal = vals.length ? Math.max(...vals, fallbackCurrent) : fallbackCurrent;
    const delta = Math.round((currentVal - startVal) * 10) / 10;

    const schemes = PROGRESSION_SCHEMES[state.activeUser] || PROGRESSION_SCHEMES.mark;
    const userGenitive = state.activeUser === 'mark' ? 'Марка' : 'Леры';

    const stepUnit = exMetric === 'cardio' ? 'ур.' : (exMetric === 'time' ? 'сек' : 'кг');
    const stepPresets = exMetric === 'cardio' ? [0.5, 1, 2] : (exMetric === 'time' ? [5, 10, 15, 30] : STEP_PRESETS);
    const rangeWord = exMetric === 'cardio' ? 'минут' : (exMetric === 'time' ? 'секунд' : 'повторов');

    return `
      ${bodyBar}

      <div class="pill-strip">
        ${available.map((ex) => `
          <button type="button" class="filter-pill ${ex.id === selectedEx.id ? 'active' : ''}" data-action="select-prog-ex" data-ex-id="${ex.id}">
            ${escapeHtml(ex.name)}
          </button>
        `).join('')}
      </div>

      <section class="chart-card">
        <div class="chart-header">
          <div class="ex-head-left">
            <button type="button" class="ex-thumb" data-action="open-visual-preview" data-ex-id="${selectedEx.id}">
              ${getVisualForExercise(selectedEx)}
            </button>
            <div>
              <h2 class="chart-title">${escapeHtml(selectedEx.name)}</h2>
              <div class="chart-sub">${escapeHtml(selectedEx.equipment === selectedEx.muscle ? selectedEx.equipment : `${selectedEx.equipment} • ${selectedEx.muscle}`)}</div>
            </div>
          </div>
          <div class="chart-big-val tabular">
            <div class="chart-big-num">${formatWeight(currentVal)} ${valueUnit}</div>
            <div class="chart-delta" style="color:${delta >= 0 ? 'var(--success)' : 'var(--danger)'}">
              ${delta >= 0 ? '+' : ''}${formatWeight(delta)} ${valueUnit}
            </div>
          </div>
        </div>

        ${exMetric === 'cardio' ? `
          <div class="ios-segment" style="margin-bottom:10px;">
            <button type="button" class="ios-segment-btn ${state.progressionMetric !== 'e1rm' ? 'active' : ''}" data-action="set-prog-metric" data-metric="weight">Время (мин)</button>
            <button type="button" class="ios-segment-btn ${state.progressionMetric === 'e1rm' ? 'active' : ''}" data-action="set-prog-metric" data-metric="e1rm">Уровень / Скорость</button>
          </div>
        ` : (exMetric === 'weight' && !isPureBodyweight ? `
          <div class="ios-segment" style="margin-bottom:10px;">
            <button type="button" class="ios-segment-btn ${state.progressionMetric === 'weight' ? 'active' : ''}" data-action="set-prog-metric" data-metric="weight">Рабочий вес</button>
            <button type="button" class="ios-segment-btn ${state.progressionMetric === 'e1rm' ? 'active' : ''}" data-action="set-prog-metric" data-metric="e1rm">Расчётный 1ПМ</button>
          </div>
        ` : '')}

        ${buildProgressionChartSVG(hist, plotMode)}

        <div class="stats-grid tabular">
          <div class="stat-box">
            <div class="stat-label">Старт</div>
            <div class="stat-num">${formatWeight(startVal)} ${valueUnit}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Рекорд (PR)</div>
            <div class="stat-num">${formatWeight(bestVal)} ${valueUnit}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Записей</div>
            <div class="stat-num">${hist.length}</div>
          </div>
        </div>
      </section>

      <h3 class="ios-group-title">Готовые схемы для ${userGenitive}</h3>
      <section class="ios-group" style="padding:12px;">
        ${rec ? `
          <div class="rec-banner">
            <strong>Персональный подбор:</strong> ${escapeHtml(rec.reason)}
          </div>
        ` : ''}

        <div class="prog-presets">
          ${schemes.map((sc) => {
            const isRecommended = rec && rec.schemeId === sc.id;
            const isActive = profile.activeSchemeId === sc.id;
            return `
              <button type="button" class="prog-preset-btn ${isActive ? 'active' : ''}" data-action="apply-scheme-all" data-scheme-id="${sc.id}">
                <div style="flex:1;min-width:0;">
                  <div class="prog-preset-title">
                    <span>${escapeHtml(sc.title)}</span>
                    ${isRecommended ? `<span class="prog-preset-badge">★ Рекомендуем</span>` : ''}
                  </div>
                  <div class="prog-preset-desc">${escapeHtml(sc.desc)}</div>
                  <div class="scheme-specs">
                    ${sc.specs.map((sp) => `<span class="scheme-spec-pill">${escapeHtml(sp)}</span>`).join('')}
                  </div>
                </div>
                <span style="font-size:16px;color:var(--accent);font-weight:700;flex-shrink:0;">${isActive ? '✓' : '›'}</span>
              </button>
            `;
          }).join('')}
        </div>

        <div class="rule-explainer">${explainRulePlain(item, selectedEx)}</div>
      </section>

      <h3 class="ios-group-title">Тонкая настройка (${escapeHtml(selectedEx.name)})</h3>
      <section class="ios-group">
        <div class="ios-row" style="display:block;">
          <div class="ios-segment">
            <button type="button" class="ios-segment-btn ${item.ruleType === 'double' ? 'active' : ''}" data-action="set-rule-type" data-ex-id="${selectedEx.id}" data-rule="double">${exMetric === 'cardio' ? 'По минутам' : (exMetric === 'time' ? 'По секундам' : 'По повторам')}</button>
            <button type="button" class="ios-segment-btn ${item.ruleType === 'linear' ? 'active' : ''}" data-action="set-rule-type" data-ex-id="${selectedEx.id}" data-rule="linear">Каждую трен.</button>
            <button type="button" class="ios-segment-btn ${item.ruleType === 'manual' ? 'active' : ''}" data-action="set-rule-type" data-ex-id="${selectedEx.id}" data-rule="manual">Вручную</button>
          </div>
        </div>

        <div class="ios-row" style="display:block;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div>
              <div class="ios-row-title">${exMetric === 'cardio' ? 'Шаг уровня' : (exMetric === 'time' ? 'Шаг времени' : 'Шаг прибавки веса')}</div>
              <div class="ios-row-sub">${exMetric === 'cardio' ? 'На сколько повышать уровень' : (exMetric === 'time' ? 'На сколько увеличивать цель' : 'На сколько увеличивать вес')}</div>
            </div>
            <div class="reps-control tabular">
              <button type="button" class="mini-btn" data-action="rule-step-delta" data-ex-id="${selectedEx.id}" data-delta="${exMetric === 'time' ? -5 : -0.5}">−</button>
              <span style="min-width:56px;text-align:center;font-weight:700;">+${formatWeight(item.step)} ${stepUnit}</span>
              <button type="button" class="mini-btn" data-action="rule-step-delta" data-ex-id="${selectedEx.id}" data-delta="${exMetric === 'time' ? 5 : 0.5}">+</button>
            </div>
          </div>
          <div class="chip-row">
            ${stepPresets.map((st) => `
              <button type="button" class="step-chip tabular ${item.step === st ? 'active' : ''}" data-action="rule-step-set" data-ex-id="${selectedEx.id}" data-step="${st}">+${st} ${stepUnit}</button>
            `).join('')}
          </div>
        </div>

        ${item.ruleType !== 'manual' ? `
          <div class="ios-row">
            <div>
              <div class="ios-row-title">${item.ruleType === 'double' ? `Минимум ${rangeWord}` : `Цель (${rangeWord})`}</div>
              <div class="ios-row-sub">${item.ruleType === 'double' ? 'С этого значения начинаем новый цикл' : 'Выполнили во всех подходах → прогрессия'}</div>
            </div>
            <div class="reps-control tabular">
              <button type="button" class="mini-btn" data-action="rule-reps-delta" data-ex-id="${selectedEx.id}" data-field="minReps" data-delta="-1">−</button>
              <span style="min-width:34px;text-align:center;font-weight:700;">${item.minReps}</span>
              <button type="button" class="mini-btn" data-action="rule-reps-delta" data-ex-id="${selectedEx.id}" data-field="minReps" data-delta="1">+</button>
            </div>
          </div>
        ` : ''}

        ${item.ruleType === 'double' ? `
          <div class="ios-row">
            <div>
              <div class="ios-row-title">Максимум ${rangeWord}</div>
              <div class="ios-row-sub">Дошли до этого числа → повышаем нагрузку</div>
            </div>
            <div class="reps-control tabular">
              <button type="button" class="mini-btn" data-action="rule-reps-delta" data-ex-id="${selectedEx.id}" data-field="maxReps" data-delta="-1">−</button>
              <span style="min-width:34px;text-align:center;font-weight:700;">${item.maxReps}</span>
              <button type="button" class="mini-btn" data-action="rule-reps-delta" data-ex-id="${selectedEx.id}" data-field="maxReps" data-delta="1">+</button>
            </div>
          </div>
        ` : ''}
      </section>

      <div style="display:flex;align-items:center;justify-content:space-between;margin:0 4px 7px 14px;">
        <h3 class="ios-group-title" style="margin:0;">История прогрессии</h3>
        <button type="button" class="rule-bar-link" data-action="open-history-sheet" data-ex-id="${selectedEx.id}">+ Записать вручную</button>
      </div>
      <section class="ios-group">
        ${hist.length === 0 ? `
          <div class="history-row" style="color:var(--text-secondary);">Записей пока нет</div>
        ` : [...hist].reverse().map((h, revIdx) => {
          const origIdx = hist.length - 1 - revIdx;
          const histLabel = exMetric === 'cardio'
            ? `<strong>${h.reps} мин</strong><span style="color:var(--text-secondary);"> • ур. ${formatWeight(h.weight)}</span>`
            : (exMetric === 'time'
              ? `<strong>${h.reps} сек</strong>${h.weight > 0 ? `<span style="color:var(--text-secondary);"> • +${formatWeight(h.weight)} кг</span>` : `<span style="color:var(--text-secondary);"> • свой вес</span>`}`
              : (h.weight === 0 && (exKind === 'bodyweight' || exKind === 'core')
                ? `<strong>Свой вес</strong><span style="color:var(--text-secondary);"> × ${h.reps} повт.</span>`
                : `<strong>${formatWeight(h.weight)} кг</strong><span style="color:var(--text-secondary);"> × ${h.reps} повт.</span>`));
          return `
            <div class="history-row tabular">
              <div>${histLabel}</div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="color:var(--text-secondary);font-size:12.5px;">${formatShortDate(h.date)}</span>
                <button type="button" class="history-del" data-action="delete-history" data-ex-id="${selectedEx.id}" data-idx="${origIdx}">Удалить</button>
              </div>
            </div>
          `;
        }).join('')}
      </section>
    `;
  }

  /* ---- Screen 3: Catalog (Machines & Exercises) ---- */
  function renderCatalogScreen() {
    const profile = getActiveProfile();
    const filters = [
      { id: 'all', label: 'Все' },
      { id: 'in_plan', label: `План (${profile.name})` },
      { id: 'machine', label: 'Тренажёры' },
      { id: 'cable', label: 'Блоки' },
      { id: 'free', label: 'Свободные' },
      { id: 'bodyweight', label: 'Свой вес' },
      { id: 'cardio', label: 'Кардио' }
    ];

    return `
      <div class="search-wrap">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
        </svg>
        <input type="search" id="catalog-search-input" class="search-input" placeholder="Поиск: дорожка, планка, бабочка, rdl, твб..." value="${escapeHtml(catalogSearch)}" autocomplete="off" />
      </div>

      <div class="pill-strip">
        ${filters.map((f) => `
          <button type="button" class="filter-pill ${state.catalogFilter === f.id ? 'active' : ''}" data-action="set-catalog-filter" data-filter="${f.id}">
            ${f.label}
          </button>
        `).join('')}
      </div>

      <div class="card-stack" id="catalog-list">
        ${renderCatalogListItems()}
      </div>
    `;
  }

  function renderCatalogListItems() {
    const profile = getActiveProfile();
    const normQuery = DB ? DB.normalizeText(catalogSearch) : catalogSearch.trim().toLowerCase();
    const tokens = normQuery ? normQuery.split(' ') : [];

    const list = state.exercises.filter((ex) => {
      const item = profile.items[ex.id];
      if (state.catalogFilter === 'in_plan' && (!item || !item.inPlan)) return false;
      if (state.catalogFilter === 'machine' && ex.equipment !== 'Тренажёр') return false;
      if (state.catalogFilter === 'cable' && ex.equipment !== 'Блок') return false;
      if (state.catalogFilter === 'free' && !['Гантели', 'Штанга'].includes(ex.equipment)) return false;
      if (state.catalogFilter === 'bodyweight' && ex.equipment !== 'Свой вес') return false;
      if (state.catalogFilter === 'cardio' && ex.equipment !== 'Кардио' && ex.muscle !== 'Кардио') return false;
      if (tokens.length) {
        const libMatch = DB?.EXERCISES_LIBRARY.find((l) => l.key === ex.key || l.name === ex.name);
        const rawHay = [ex.name, ex.en || '', ex.equipment, ex.muscle, item?.setupNote || '', libMatch?._search || ''].join(' ');
        const hay = DB ? DB.normalizeText(rawHay) : rawHay.toLowerCase();
        if (!tokens.every((t) => hay.includes(t))) return false;
      }
      return true;
    });

    if (list.length === 0) {
      return `
        <div class="empty-card">
          <h2 class="empty-title">В вашей базе пока нет этого тренажёра</h2>
          <p class="empty-sub">Откройте справочник на ${DB ? DB.EXERCISES_LIBRARY.length : 98} упражнений (тренажёры, кардио, свой вес) — поиск работает на русском, английском и по сокращениям.</p>
          <button type="button" class="btn-primary-full" data-action="open-add-sheet">+ Найти и добавить</button>
        </div>
      `;
    }

    return list.map((ex) => {
      const item = profile.items[ex.id];
      const inPlan = Boolean(item && item.inPlan);
      const otherUser = state.activeUser === 'mark' ? 'lera' : 'mark';
      const otherInPlan = Boolean(state.profiles[otherUser].items[ex.id]?.inPlan);
      const otherName = state.profiles[otherUser].name;
      const metric = getExMetric(ex);
      const kind = getExKind(ex);

      let subText = 'Нажмите, чтобы настроить';
      if (item) {
        if (metric === 'cardio') {
          subText = `ур. ${formatWeight(item.weight)} • ${item.minReps}–${item.maxReps} мин`;
        } else if (metric === 'time') {
          subText = `${item.weight > 0 ? `+${formatWeight(item.weight)} кг` : 'Свой вес'} • ${item.minReps}–${item.maxReps} сек`;
        } else if (item.weight === 0 && (kind === 'bodyweight' || kind === 'core')) {
          subText = `Свой вес • ${item.minReps}–${item.maxReps} повт.`;
        } else {
          subText = `${formatWeight(item.weight)} кг`;
        }
        if (item.setupNote) subText += ` • ${escapeHtml(item.setupNote)}`;
      }

      const howTo = DB ? DB.getHowToTip(ex) : '';

      return `
        <div class="catalog-item">
          <div class="catalog-top">
            <button type="button" class="ex-thumb" data-action="open-visual-preview" data-ex-id="${ex.id}" title="Показать тренажёр">
              ${getVisualForExercise(ex)}
            </button>
            <div class="catalog-main" data-action="open-edit-sheet" data-ex-id="${ex.id}">
              <div class="ex-tags">
                ${renderUniqueTags([
                  { text: ex.equipment, cls: 'accent' },
                  { text: ex.muscle },
                  otherInPlan ? { text: `У ${otherName === 'Марк' ? 'Марка' : 'Леры'}` } : null
                ])}
              </div>
              <div style="font-size:15px;font-weight:700;margin-top:2px;">${escapeHtml(ex.name)}</div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                ${subText}
              </div>
            </div>
            <div class="catalog-right">
              <button type="button" class="plan-toggle ${inPlan ? 'in-plan' : ''}" data-action="toggle-in-plan" data-ex-id="${ex.id}">
                ${inPlan ? 'В плане ✓' : '+ В план'}
              </button>
            </div>
          </div>
          ${howTo ? `<div class="catalog-tip"><strong>Как делать:</strong> ${escapeHtml(howTo)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  /* ---- Bottom Sheets ---- */
  function openSheet(html, locked = false) {
    sheetLocked = locked;
    const backdrop = document.getElementById('sheet-backdrop');
    const content = document.getElementById('sheet-content');
    if (!backdrop || !content) return;
    content.innerHTML = `<div class="sheet-handle"></div>${html}`;
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
  }

  function closeSheet(force = false) {
    if (sheetLocked && !force) return;
    sheetLocked = false;
    const backdrop = document.getElementById('sheet-backdrop');
    if (!backdrop) return;
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
  }

  /* ---- Required Body Profile Onboarding & Recommendation Sheet ---- */
  function openBodyProfileSheet(required = false) {
    const profile = getActiveProfile();
    const isMark = state.activeUser === 'mark';
    const body = profile.body || { weightKg: null, heightCm: null, activity: '', completed: false };
    const defaultWeight = body.weightKg || (isMark ? 80 : 60);
    const defaultHeight = body.heightCm || (isMark ? 180 : 166);
    const defaultActivity = body.activity || 'medium';
    const otherUser = isMark ? 'lera' : 'mark';
    const otherLabel = isMark ? 'Лера' : 'Марк';

    openSheet(`
      <div class="sheet-header">
        <div>
          <h2 class="sheet-title">Параметры — ${escapeHtml(profile.name)}</h2>
          <div style="font-size:12px;color:var(--text-secondary);">Укажите данные, чтобы подобрать идеальную схему прогрессии</div>
        </div>
        ${required
          ? `<button type="button" class="rule-bar-link" data-action="switch-user-in-onboarding" data-target-user="${otherUser}">Это ${otherLabel} ›</button>`
          : `<button type="button" class="sheet-close" data-action="close-sheet" aria-label="Закрыть">✕</button>`
        }
      </div>

      <form id="form-body-profile">
        <div class="form-section">
          <div class="field-grid-2">
            <div>
              <label class="field-label" for="body-weight">Стартовый вес (кг)</label>
              <input class="field-input tabular" id="body-weight" type="number" step="0.5" min="35" max="220" required value="${defaultWeight}" />
            </div>
            <div>
              <label class="field-label" for="body-height">Рост (см)</label>
              <input class="field-input tabular" id="body-height" type="number" step="1" min="130" max="220" required value="${defaultHeight}" />
            </div>
          </div>
        </div>

        <div class="form-section">
          <span class="field-label">Физическая активность</span>
          <input type="hidden" id="body-activity" value="${defaultActivity}" />
          <div class="activity-grid" id="body-activity-grid">
            ${ACTIVITY_LEVELS.map((a) => `
              <button type="button" class="activity-option ${defaultActivity === a.id ? 'active' : ''}" data-action="pick-activity" data-act="${a.id}">
                <div class="activity-option-title">${escapeHtml(a.label)}</div>
                <div class="activity-option-sub">${escapeHtml(a.desc)}</div>
              </button>
            `).join('')}
          </div>
        </div>

        <button type="submit" class="btn-primary-full">Подобрать схему для ${escapeHtml(isMark ? 'Марка' : 'Леры')}</button>
      </form>
    `, required);
  }

  function openRecommendationResultSheet() {
    const profile = getActiveProfile();
    const rec = computeRecommendation(state.activeUser, profile.body);
    if (!rec) {
      closeSheet(true);
      return;
    }
    const schemes = PROGRESSION_SCHEMES[state.activeUser] || [];
    const altSchemes = schemes.filter((s) => s.id !== rec.schemeId);

    openSheet(`
      <div class="sheet-header">
        <div>
          <h2 class="sheet-title">Рекомендация • ${escapeHtml(profile.name)}</h2>
          <div style="font-size:12px;color:var(--text-secondary);">${profile.body.weightKg} кг • ${profile.body.heightCm} см • ИМТ ${rec.bmi} • ${escapeHtml(rec.activityLabel)}</div>
        </div>
        <button type="button" class="sheet-close" data-action="close-sheet" aria-label="Закрыть">✕</button>
      </div>

      <div class="rec-banner">
        <strong>Почему именно эта схема:</strong><br/>${escapeHtml(rec.reason)}
      </div>

      <div class="form-section" style="border:1.5px solid var(--accent);">
        <div class="prog-preset-title">
          <span>${escapeHtml(rec.scheme.title)}</span>
          <span class="prog-preset-badge">★ Рекомендуем</span>
        </div>
        <div class="prog-preset-desc" style="margin-top:4px;">${escapeHtml(rec.scheme.desc)}</div>
        <div class="scheme-specs">
          ${rec.scheme.specs.map((sp) => `<span class="scheme-spec-pill">${escapeHtml(sp)}</span>`).join('')}
        </div>
        <button type="button" class="btn-primary-full" style="margin-top:12px;" data-action="apply-scheme-close" data-scheme-id="${rec.scheme.id}">
          Применить эту схему
        </button>
      </div>

      <div class="form-section">
        <span class="field-label">Или выберите другую схему</span>
        <div class="prog-presets">
          ${altSchemes.map((sc) => `
            <button type="button" class="prog-preset-btn" data-action="apply-scheme-close" data-scheme-id="${sc.id}">
              <div>
                <div class="prog-preset-title">${escapeHtml(sc.title)}</div>
                <div class="prog-preset-desc">${escapeHtml(sc.desc)}</div>
              </div>
              <span style="font-size:16px;color:var(--accent);font-weight:700;">›</span>
            </button>
          `).join('')}
        </div>
      </div>
    `, false);
  }

  /* ---- Smart 2-Step Add Sheet ---- */
  function openAddExerciseSheet(initialQuery = '') {
    addSheetSearch = initialQuery || catalogSearch || '';
    addSheetMuscle = 'Все';

    openSheet(`
      <div class="sheet-header">
        <div>
          <h2 class="sheet-title">Добавить упражнение</h2>
          <div style="font-size:12px;color:var(--text-secondary);">Ищет по RU, EN, сленгу и сокращениям — добавит на русском</div>
        </div>
        <button type="button" class="sheet-close" data-action="close-sheet" aria-label="Закрыть">✕</button>
      </div>

      <div class="search-wrap" style="margin-bottom:10px;">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
        </svg>
        <input type="search" id="add-lib-search" class="search-input" placeholder="Например: дорожка, планка, stairmaster, rdl, бабочка..." value="${escapeHtml(addSheetSearch)}" autocomplete="off" />
      </div>

      <div class="pill-strip" id="add-lib-muscles" style="margin-bottom:10px;">
        ${['Все', ...MUSCLE_GROUPS].map((m) => `
          <button type="button" class="filter-pill ${addSheetMuscle === m ? 'active' : ''}" data-action="set-add-muscle" data-muscle="${m}">${m}</button>
        `).join('')}
      </div>

      <div class="lib-search-list" id="add-lib-results">
        ${renderAddLibraryResults()}
      </div>

      <div style="margin-top:10px;">
        <button type="button" class="btn-secondary-full" data-action="open-custom-add-form">+ Создать своё упражнение вручную</button>
      </div>
    `);

    const inp = document.getElementById('add-lib-search');
    if (inp) {
      inp.addEventListener('input', (e) => {
        addSheetSearch = e.target.value;
        const res = document.getElementById('add-lib-results');
        if (res) res.innerHTML = renderAddLibraryResults();
      });
      setTimeout(() => inp.focus(), 100);
    }
  }

  function renderAddLibraryResults() {
    if (!DB) return '';
    const results = DB.searchLibrary(addSheetSearch, addSheetMuscle);

    if (results.length === 0) {
      return `
        <div class="empty-card" style="padding:18px 14px;">
          <div class="empty-title" style="font-size:15px;">Точных совпадений нет</div>
          <p class="empty-sub" style="margin-bottom:10px;">Вы можете добавить «${escapeHtml(addSheetSearch.trim())}» вручную с любым названием.</p>
          <button type="button" class="btn-primary-full" data-action="open-custom-add-form">Создать вручную</button>
        </div>
      `;
    }

    const existingKeys = new Set(state.exercises.map((e) => e.key).filter(Boolean));
    const existingNames = new Set(state.exercises.map((e) => DB.normalizeText(e.name)));

    return results.map((lib) => {
      const alreadyExists = existingKeys.has(lib.key) || existingNames.has(DB.normalizeText(lib.name));
      const kind = DB.getExerciseKind(lib);
      const metric = DB.getExerciseMetric(lib);
      const kindLabel = DB.getKindLabel(kind);
      const smart = getSmartRuleForExercise(state.activeUser, lib);
      const smartBadge = metric === 'cardio'
        ? `${smart.minReps}–${smart.maxReps} мин`
        : (metric === 'time' ? `${smart.sets}×${smart.minReps}–${smart.maxReps}с` : `${smart.sets}×${smart.minReps}–${smart.maxReps}`);
      return `
        <button type="button" class="lib-row" data-action="pick-lib-exercise" data-lib-key="${escapeHtml(lib.key)}">
          <span class="ex-thumb">${DB.getVisualSvg(lib.visual)}</span>
          <div class="lib-row-info">
            <div class="lib-row-title">${escapeHtml(lib.name)}</div>
            <div class="lib-row-en">${escapeHtml(lib.en)}</div>
            <div class="lib-row-tags" style="flex-wrap:wrap;">
              ${renderUniqueTags([
                { text: kindLabel, cls: 'accent' },
                { text: lib.muscle },
                { text: lib.equipment },
                { text: smartBadge, cls: 'tabular' },
                alreadyExists ? { text: 'В базе', cls: 'success' } : null
              ])}
            </div>
          </div>
          <span class="lib-row-chevron">›</span>
        </button>
      `;
    }).join('');
  }

  function renderAddSchemeRecommendation(target, exMeta) {
    const kind = DB ? DB.getExerciseKind(exMeta) : (exMeta.kind || 'base');
    const metric = exMeta.metric || (DB ? DB.getExerciseMetric(exMeta) : 'weight');
    const kindFull = DB ? DB.getKindFullLabel(kind) : 'Базовое (крупная мышца)';

    const formatForUser = (uid) => {
      const prof = state.profiles[uid];
      const rec = computeRecommendation(uid, prof.body);
      const schemeId = prof.activeSchemeId || rec?.schemeId || PROGRESSION_SCHEMES[uid][0].id;
      const scheme = getSchemeById(uid, schemeId);
      const rule = scheme.ruleFor({ ...exMeta, kind, metric }, prof.body?.activity || 'medium');
      if (metric === 'cardio') {
        return `<strong>${escapeHtml(prof.name)}</strong> (${escapeHtml(scheme.title)}): <strong>${rule.minReps}–${rule.maxReps} мин</strong>, шаг +${formatWeight(rule.step)} ур.`;
      }
      if (metric === 'time') {
        return `<strong>${escapeHtml(prof.name)}</strong> (${escapeHtml(scheme.title)}): <strong>${rule.sets} подх. × ${rule.minReps}–${rule.maxReps} сек</strong>, шаг +${formatWeight(rule.step)} сек, отдых ${scheme.restSeconds}с`;
      }
      if (kind === 'bodyweight') {
        return `<strong>${escapeHtml(prof.name)}</strong> (${escapeHtml(scheme.title)}): <strong>${rule.sets} подх. × ${rule.minReps}–${rule.maxReps} повт.</strong> (свой вес), отдых ${scheme.restSeconds}с`;
      }
      return `<strong>${escapeHtml(prof.name)}</strong> (${escapeHtml(scheme.title)}): <strong>${rule.sets} подх. × ${rule.minReps}–${rule.maxReps} повт.</strong>, шаг +${formatWeight(rule.step)} кг, отдых ${scheme.restSeconds}с`;
    };

    const lines = target === 'both'
      ? `${formatForUser('mark')}<br/>${formatForUser('lera')}`
      : formatForUser(target);

    return `
      <div class="rec-banner" style="margin-bottom:0;">
        <div style="margin-bottom:4px;"><strong>Тип нагрузки:</strong> ${escapeHtml(kindFull)}</div>
        <div>${lines}</div>
      </div>
    `;
  }

  function openConfirmAddForm(libItem = null) {
    const defaultTarget = state.activeUser;
    const cats = state.workoutCategories || ['День 1', 'День 2', 'День 3'];
    const initialName = libItem ? libItem.name : (addSheetSearch.trim() || '');
    const initialEq = libItem ? libItem.equipment : (addSheetMuscle === 'Кардио' ? 'Кардио' : 'Тренажёр');
    const initialMuscle = libItem ? libItem.muscle : (addSheetMuscle !== 'Все' ? addSheetMuscle : 'Грудь');
    const initialKind = libItem
      ? DB.getExerciseKind(libItem)
      : (initialMuscle === 'Кардио' || initialEq === 'Кардио'
        ? 'cardio'
        : (initialEq === 'Свой вес' ? 'bodyweight' : (initialMuscle === 'Кор' ? 'core' : initialMuscle === 'Руки' ? 'isolation' : 'base')));
    const initialMetric = libItem
      ? DB.getExerciseMetric(libItem)
      : (initialKind === 'cardio' ? 'cardio' : 'weight');
    const exMeta = { key: libItem?.key || '', name: initialName, muscle: initialMuscle, equipment: initialEq, kind: initialKind, metric: initialMetric };
    const smart = getSmartRuleForExercise(defaultTarget, exMeta);
    const initialStep = smart.step;
    const markW = libItem ? suggestStartWeight('mark', libItem) : (initialMetric === 'cardio' ? 6 : (initialKind === 'bodyweight' || initialMetric === 'time' ? 0 : 40));
    const leraW = libItem ? suggestStartWeight('lera', libItem) : (initialMetric === 'cardio' ? 5 : (initialKind === 'bodyweight' || initialMetric === 'time' ? 0 : 20));
    const visualKey = libItem ? libItem.visual : (initialKind === 'cardio' ? 'treadmill' : (initialKind === 'bodyweight' ? 'pushup_floor' : 'chest_press_machine'));
    const stepLabel = initialMetric === 'cardio' ? 'Шаг уровня' : (initialMetric === 'time' ? 'Шаг времени (сек)' : 'Шаг веса (кг)');

    openSheet(`
      <div class="sheet-header" style="margin-bottom:10px;">
        <button type="button" class="back-link-btn" data-action="back-to-lib-search">‹ Назад к поиску</button>
        <button type="button" class="sheet-close" data-action="close-sheet" aria-label="Закрыть">✕</button>
      </div>

      ${libItem ? `
        <div class="visual-preview-card">
          <div class="ex-thumb lg">${DB.getVisualSvg(visualKey)}</div>
          <div style="margin-top:10px;">
            <div class="ex-tags">
              ${renderUniqueTags([
                { text: DB.getKindLabel(initialKind), cls: 'accent' },
                { text: libItem.muscle },
                { text: libItem.equipment }
              ])}
            </div>
            <div style="font-size:16px;font-weight:700;margin-top:3px;">${escapeHtml(libItem.name)}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">На тренажёре может быть написано: ${escapeHtml(libItem.en)}</div>
            ${DB?.getHowToTip(libItem) ? `<div class="how-to-box"><strong>Как делать:</strong> ${escapeHtml(DB.getHowToTip(libItem))}</div>` : ''}
          </div>
        </div>
      ` : ''}

      <form id="form-add-exercise">
        <input type="hidden" id="add-lib-key" value="${escapeHtml(libItem ? libItem.key : '')}" />
        <input type="hidden" id="add-lib-en" value="${escapeHtml(libItem ? libItem.en : '')}" />
        <input type="hidden" id="add-lib-visual" value="${escapeHtml(visualKey)}" />
        <input type="hidden" id="add-lib-metric" value="${escapeHtml(initialMetric)}" />

        <div id="add-scheme-rec" style="margin-bottom:12px;">
          ${renderAddSchemeRecommendation(defaultTarget, exMeta)}
        </div>

        <div class="form-section" style="display:flex;flex-direction:column;gap:10px;">
          <div>
            <label class="field-label" for="add-name">Название на русском (сохранится в приложении)</label>
            <input class="field-input" id="add-name" type="text" required placeholder="Например: Жим в Хаммере или Планка" value="${escapeHtml(initialName)}" />
          </div>

          <div class="field-grid-2">
            <div>
              <label class="field-label" for="add-equipment">Оборудование</label>
              <select class="field-select" id="add-equipment">
                ${EQUIPMENT_TYPES.map((t) => `<option value="${t}" ${initialEq === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="field-label" for="add-muscle">Группа мышц</label>
              <select class="field-select" id="add-muscle">
                ${MUSCLE_GROUPS.map((m) => `<option value="${m}" ${initialMuscle === m ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="field-grid-2">
            <div>
              <label class="field-label" for="add-kind">Тип нагрузки</label>
              <select class="field-select" id="add-kind">
                <option value="base" ${initialKind === 'base' ? 'selected' : ''}>Крупная мышца (база)</option>
                <option value="isolation" ${initialKind === 'isolation' ? 'selected' : ''}>Изоляция</option>
                <option value="bodyweight" ${initialKind === 'bodyweight' ? 'selected' : ''}>Свой вес</option>
                <option value="core" ${initialKind === 'core' ? 'selected' : ''}>Кор / Пресс</option>
                <option value="cardio" ${initialKind === 'cardio' ? 'selected' : ''}>Кардио</option>
              </select>
            </div>
            <div>
              <label class="field-label" id="add-step-label" for="add-step">${stepLabel}</label>
              <input class="field-input tabular" id="add-step" type="number" step="0.5" min="0.5" value="${initialStep}" />
            </div>
          </div>

          ${cats.length > 1 ? `
            <div>
              <label class="field-label" for="add-day">День тренировки</label>
              <select class="field-select" id="add-day">
                ${cats.map((d) => `<option value="${escapeHtml(d)}" ${state.workoutDayFilter === d ? 'selected' : ''}>${escapeHtml(d)}</option>`).join('')}
              </select>
            </div>
          ` : `<input type="hidden" id="add-day" value="${escapeHtml(cats[0])}" />`}
        </div>

        <div class="form-section" style="display:flex;flex-direction:column;gap:10px;">
          <span class="field-label" style="margin-bottom:0;">Кому добавить в план тренировок?</span>
          <input type="hidden" id="add-target" value="${defaultTarget}" />
          <input type="hidden" id="add-default-markw" value="${markW}" />
          <input type="hidden" id="add-default-leraw" value="${leraW}" />
          <div class="ios-segment" id="add-target-segment">
            <button type="button" class="ios-segment-btn ${defaultTarget === 'mark' ? 'active' : ''}" data-action="set-add-target" data-target="mark">Марку</button>
            <button type="button" class="ios-segment-btn ${defaultTarget === 'lera' ? 'active' : ''}" data-action="set-add-target" data-target="lera">Лере</button>
            <button type="button" class="ios-segment-btn" data-action="set-add-target" data-target="both">Обоим</button>
          </div>

          <div id="add-weights-area">
            ${renderAddWeightsInputs(defaultTarget, markW, leraW, initialMetric, initialKind)}
          </div>

          <div>
            <label class="field-label" for="add-setup">Заметка (необязательно)</label>
            <input class="field-input" id="add-setup" type="text" placeholder="${initialMetric === 'cardio' ? 'Например: Наклон 5%, темп 6 км/ч' : 'Например: Сиденье: 3'}" />
          </div>
        </div>

        <button type="submit" class="btn-primary-full">Добавить в тренировку</button>
      </form>
    `);
  }

  function refreshAddRecommendationUI() {
    const recBox = document.getElementById('add-scheme-rec');
    if (!recBox) return;
    const target = document.getElementById('add-target')?.value || state.activeUser;
    const muscle = document.getElementById('add-muscle')?.value || 'Грудь';
    const equipment = document.getElementById('add-equipment')?.value || 'Тренажёр';
    const kind = document.getElementById('add-kind')?.value || 'base';
    const key = document.getElementById('add-lib-key')?.value || '';
    const name = document.getElementById('add-name')?.value || '';
    const metricEl = document.getElementById('add-lib-metric');
    let metric = metricEl?.value || 'weight';
    if (kind === 'cardio' || equipment === 'Кардио' || muscle === 'Кардио') {
      metric = 'cardio';
    } else if (metric === 'cardio') {
      metric = 'weight';
    }
    if (metricEl) metricEl.value = metric;

    const exMeta = { key, name, muscle, equipment, kind, metric };
    recBox.innerHTML = renderAddSchemeRecommendation(target, exMeta);

    const stepLabel = document.getElementById('add-step-label');
    if (stepLabel) {
      stepLabel.textContent = metric === 'cardio' ? 'Шаг уровня' : (metric === 'time' ? 'Шаг времени (сек)' : 'Шаг веса (кг)');
    }
    const stepInput = document.getElementById('add-step');
    if (stepInput && target !== 'both') {
      const smart = getSmartRuleForExercise(target, exMeta);
      stepInput.value = smart.step;
    }
  }

  function openRemoveFromWorkoutSheet(exId) {
    const ex = state.exercises.find((e) => e.id === exId);
    if (!ex) return;
    const userGenitive = state.activeUser === 'mark' ? 'Марка' : 'Леры';

    openSheet(`
      <div class="sheet-header">
        <h2 class="sheet-title">${escapeHtml(ex.name)}</h2>
        <button type="button" class="sheet-close" data-action="close-sheet" aria-label="Закрыть">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:9px;">
        <button type="button" class="btn-secondary-full" data-action="remove-from-plan" data-ex-id="${ex.id}">
          Убрать из тренировки ${userGenitive}
        </button>
        <button type="button" class="btn-danger-full" data-action="delete-exercise" data-ex-id="${ex.id}">
          Удалить из общей базы совсем
        </button>
        <button type="button" class="btn-secondary-full" style="background:transparent;color:var(--text-secondary);" data-action="close-sheet">
          Отмена
        </button>
      </div>
    `);
  }

  function renderAddWeightsInputs(target, markW = 40, leraW = 20, metric = 'weight', kind = 'base') {
    const isCardio = metric === 'cardio';
    const isBw = !isCardio && (metric === 'time' || kind === 'bodyweight');
    const stepAttr = isCardio ? '0.5' : '0.5';
    const minAttr = isCardio ? '1' : '0';
    const markLbl = isCardio ? 'Уровень Марка' : (isBw ? 'Доп. вес Марка (0 = свой)' : 'Вес Марка (кг)');
    const leraLbl = isCardio ? 'Уровень Леры' : (isBw ? 'Доп. вес Леры (0 = свой)' : 'Вес Леры (кг)');
    const singleLbl = target === 'mark'
      ? (isCardio ? 'Начальный уровень / скорость Марка' : (isBw ? 'Доп. вес Марка (кг, 0 = свой вес)' : 'Начальный вес Марка (кг)'))
      : (isCardio ? 'Начальный уровень / скорость Леры' : (isBw ? 'Доп. вес Леры (кг, 0 = свой вес)' : 'Начальный вес Леры (кг)'));

    if (target === 'both') {
      return `
        <div class="field-grid-2">
          <div>
            <label class="field-label" for="add-weight-mark">${markLbl}</label>
            <input class="field-input tabular" id="add-weight-mark" type="number" step="${stepAttr}" min="${minAttr}" value="${markW}" />
          </div>
          <div>
            <label class="field-label" for="add-weight-lera">${leraLbl}</label>
            <input class="field-input tabular" id="add-weight-lera" type="number" step="${stepAttr}" min="${minAttr}" value="${leraW}" />
          </div>
        </div>
      `;
    }
    const val = target === 'mark' ? markW : leraW;
    return `
      <div>
        <label class="field-label" for="add-weight-single">${singleLbl}</label>
        <input class="field-input tabular" id="add-weight-single" type="number" step="${stepAttr}" min="${minAttr}" value="${val}" />
      </div>
    `;
  }

  function openVisualPreviewSheet(exId) {
    const ex = state.exercises.find((e) => e.id === exId);
    if (!ex) return;

    openSheet(`
      <div class="sheet-header">
        <h2 class="sheet-title">Визуализация</h2>
        <button type="button" class="sheet-close" data-action="close-sheet" aria-label="Закрыть">✕</button>
      </div>

      <div class="visual-preview-card">
        <div class="ex-thumb lg">${getVisualForExercise(ex)}</div>
        <div style="margin-top:12px;">
          <div class="ex-tags">
            ${renderUniqueTags([
              { text: ex.equipment, cls: 'accent' },
              { text: ex.muscle }
            ])}
          </div>
          <div style="font-size:18px;font-weight:700;margin-top:4px;">${escapeHtml(ex.name)}</div>
          ${ex.en ? `<div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">Английская маркировка: ${escapeHtml(ex.en)}</div>` : ''}
          ${DB?.getHowToTip(ex) ? `<div class="how-to-box"><strong>Как делать:</strong> ${escapeHtml(DB.getHowToTip(ex))}</div>` : ''}
        </div>
      </div>

      <button type="button" class="btn-secondary-full" data-action="open-edit-sheet" data-ex-id="${ex.id}">Редактировать параметры</button>
    `);
  }

  function openEditExerciseSheet(exId) {
    const ex = state.exercises.find((e) => e.id === exId);
    if (!ex) return;
    const item = ensureUserItem(state.activeUser, exId);
    const profile = getActiveProfile();
    const cats = state.workoutCategories || ['День 1', 'День 2', 'День 3'];
    const metric = getExMetric(ex);
    const weightLabel = metric === 'cardio' ? 'Уровень / скорость' : 'Рабочий вес (кг)';

    openSheet(`
      <div class="sheet-header">
        <h2 class="sheet-title">Настройка • ${escapeHtml(profile.name)}</h2>
        <button type="button" class="sheet-close" data-action="close-sheet" aria-label="Закрыть">✕</button>
      </div>

      <form id="form-edit-exercise" data-ex-id="${ex.id}">
        <div class="form-section" style="display:flex;flex-direction:column;gap:10px;">
          <div>
            <label class="field-label" for="edit-name">Название (общее в базе)</label>
            <input class="field-input" id="edit-name" type="text" required value="${escapeHtml(ex.name)}" />
          </div>
          <div class="field-grid-2">
            <div>
              <label class="field-label" for="edit-equipment">Оборудование</label>
              <select class="field-select" id="edit-equipment">
                ${EQUIPMENT_TYPES.map((t) => `<option value="${t}" ${ex.equipment === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="field-label" for="edit-muscle">Мышцы</label>
              <select class="field-select" id="edit-muscle">
                ${MUSCLE_GROUPS.map((m) => `<option value="${m}" ${ex.muscle === m ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <div class="form-section" style="display:flex;flex-direction:column;gap:10px;">
          <div style="font-size:13px;font-weight:700;color:var(--accent);">Личные параметры (${escapeHtml(profile.name)})</div>
          ${cats.length > 1 ? `
            <div class="field-grid-2">
              <div>
                <label class="field-label" for="edit-weight">${weightLabel}</label>
                <input class="field-input tabular" id="edit-weight" type="number" step="0.5" min="0" value="${item.weight}" />
              </div>
              <div>
                <label class="field-label" for="edit-day">День</label>
                <select class="field-select" id="edit-day">
                  ${cats.map((d) => `<option value="${escapeHtml(d)}" ${item.day === d ? 'selected' : ''}>${escapeHtml(d)}</option>`).join('')}
                </select>
              </div>
            </div>
          ` : `
            <input type="hidden" id="edit-day" value="${escapeHtml(cats[0])}" />
            <div>
              <label class="field-label" for="edit-weight">${weightLabel}</label>
              <input class="field-input tabular" id="edit-weight" type="number" step="0.5" min="0" value="${item.weight}" />
            </div>
          `}
          <div>
            <label class="field-label" for="edit-setup">Заметка (необязательно)</label>
            <input class="field-input" id="edit-setup" type="text" placeholder="Сиденье, валик, наклон..." value="${escapeHtml(item.setupNote)}" />
          </div>
          <label style="display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;padding-top:4px;">
            <input type="checkbox" id="edit-in-plan" ${item.inPlan ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--accent);" />
            <span>Показывать в тренировке (${escapeHtml(profile.name)})</span>
          </label>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;">
          <button type="submit" class="btn-primary-full">Сохранить изменения</button>
          <button type="button" class="btn-danger-full" data-action="delete-exercise" data-ex-id="${ex.id}">Удалить из общей базы</button>
        </div>
      </form>
    `);
  }

  function openWeightInputSheet(exId) {
    const ex = state.exercises.find((e) => e.id === exId);
    if (!ex) return;
    const item = ensureUserItem(state.activeUser, exId);
    const metric = getExMetric(ex);
    const label = metric === 'cardio' ? 'Уровень сложности / скорость' : 'Точный рабочий вес (кг, 0 = свой вес)';
    const btnText = metric === 'cardio' ? 'Применить уровень' : 'Применить вес';

    openSheet(`
      <div class="sheet-header">
        <h2 class="sheet-title">${escapeHtml(ex.name)}</h2>
        <button type="button" class="sheet-close" data-action="close-sheet">✕</button>
      </div>
      <form id="form-direct-weight" data-ex-id="${ex.id}">
        <div class="form-section">
          <label class="field-label" for="direct-weight-input">${label}</label>
          <input class="field-input tabular" id="direct-weight-input" type="number" step="0.25" min="0" value="${item.weight}" style="font-size:22px;font-weight:700;text-align:center;" />
        </div>
        <button type="submit" class="btn-primary-full">${btnText}</button>
      </form>
    `);
    setTimeout(() => {
      const inp = document.getElementById('direct-weight-input');
      if (inp) {
        inp.focus();
        inp.select();
      }
    }, 60);
  }

  function openManualHistorySheet(exId) {
    const ex = state.exercises.find((e) => e.id === exId);
    if (!ex) return;
    const item = ensureUserItem(state.activeUser, exId);
    const metric = getExMetric(ex);
    const wLabel = metric === 'cardio' ? 'Уровень' : 'Вес (кг)';
    const rLabel = metric === 'cardio' ? 'Минуты' : (metric === 'time' ? 'Секунды' : 'Повторения');

    openSheet(`
      <div class="sheet-header">
        <h2 class="sheet-title">Запись в историю</h2>
        <button type="button" class="sheet-close" data-action="close-sheet">✕</button>
      </div>
      <form id="form-manual-history" data-ex-id="${ex.id}">
        <div class="form-section" style="display:flex;flex-direction:column;gap:10px;">
          <div style="font-size:14px;font-weight:700;">${escapeHtml(ex.name)}</div>
          <div>
            <label class="field-label" for="hist-date">Дата</label>
            <input class="field-input" id="hist-date" type="date" required value="${todayISO()}" />
          </div>
          <div class="field-grid-2">
            <div>
              <label class="field-label" for="hist-weight">${wLabel}</label>
              <input class="field-input tabular" id="hist-weight" type="number" step="0.5" min="0" required value="${item.weight}" />
            </div>
            <div>
              <label class="field-label" for="hist-reps">${rLabel}</label>
              <input class="field-input tabular" id="hist-reps" type="number" step="1" min="1" required value="${item.sets[0]?.reps || item.minReps}" />
            </div>
          </div>
        </div>
        <button type="submit" class="btn-primary-full">Добавить запись</button>
      </form>
    `);
  }

  function openCloudSyncSheet() {
    if (!SYNC) return;
    const cfg = SYNC.getConfig();
    const st = SYNC.getStatus();
    const hasToken = Boolean(cfg.token);
    const lastSyncText = st.lastSyncAt
      ? new Date(st.lastSyncAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      : 'ещё не было';

    openSheet(`
      <div class="sheet-header">
        <div>
          <h2 class="sheet-title">Облако GitHub</h2>
          <div style="font-size:12px;color:var(--text-secondary);">Профили Марка и Леры хранятся прямо в репозитории</div>
        </div>
        <button type="button" class="sheet-close" data-action="close-sheet" aria-label="Закрыть">✕</button>
      </div>

      <div class="form-section" style="display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <div>
            <div class="ios-row-title" id="gh-sync-status-label">${escapeHtml(st.message)}</div>
            <div class="ios-row-sub tabular">Последняя синхронизация: ${escapeHtml(lastSyncText)}</div>
          </div>
          <span class="tag ${st.state === 'ok' ? 'success' : (st.state === 'error' ? '' : 'accent')}">${hasToken ? 'Подключено' : 'Только чтение'}</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button type="button" class="btn-secondary-full" data-action="gh-pull">↓ Загрузить</button>
          <button type="button" class="btn-secondary-full" data-action="gh-push" ${hasToken ? '' : 'disabled style="opacity:0.45;"'}>↑ Сохранить</button>
        </div>
        ${hasToken ? `<button type="button" class="btn-primary-full" data-action="gh-sync-now">Синхронизировать сейчас</button>` : ''}
      </div>

      <form id="form-gh-sync">
        <div class="form-section" style="display:flex;flex-direction:column;gap:10px;">
          <span class="field-label" style="margin-bottom:0;">Подключение репозитория</span>
          <div>
            <label class="field-label" for="gh-token">GitHub Personal Access Token</label>
            <input class="field-input" id="gh-token" type="password" autocomplete="off" placeholder="github_pat_..." value="${escapeHtml(cfg.token)}" />
            <div style="font-size:11.5px;color:var(--text-secondary);margin-top:4px;">
              Токен хранится только в Safari на вашем телефоне и никогда не отправляется в код репозитория.
            </div>
          </div>
          <div class="field-grid-2">
            <div>
              <label class="field-label" for="gh-repo">Репозиторий</label>
              <input class="field-input" id="gh-repo" type="text" required value="${escapeHtml(cfg.repo)}" />
            </div>
            <div>
              <label class="field-label" for="gh-branch">Ветка</label>
              <input class="field-input" id="gh-branch" type="text" required value="${escapeHtml(cfg.branch)}" />
            </div>
          </div>
          <div>
            <label class="field-label" for="gh-path">Файл данных в репозитории</label>
            <input class="field-input" id="gh-path" type="text" required value="${escapeHtml(cfg.path)}" />
          </div>
          <label style="display:flex;align-items:center;justify-content:space-between;font-size:14px;font-weight:600;padding-top:2px;">
            <span>Авто-сохранение после изменений</span>
            <input type="checkbox" id="gh-autosync" ${cfg.autoSync ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--accent);" />
          </label>
        </div>

        <div class="rec-banner" style="font-size:12px;">
          <strong>Как подключить за 1 минуту (на 2 телефона):</strong><br/>
          1. Откройте <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener" style="color:var(--accent);font-weight:700;">создание токена GitHub ›</a><br/>
          2. Выберите <strong>Only select repositories → Gym-Training-</strong>, а в <strong>Permissions → Contents</strong> поставьте <strong>Read and write</strong>.<br/>
          3. Скопируйте токен и вставьте сюда на iPhone Марка и Леры — профили сливаются раздельно и не затирают друг друга.
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;">
          <button type="submit" class="btn-primary-full">Сохранить и синхронизировать</button>
          ${hasToken ? `<button type="button" class="btn-danger-full" data-action="gh-disconnect">Отключить токен на этом телефоне</button>` : ''}
        </div>
      </form>
    `);
  }

  function openSettingsSheet() {
    const cats = state.workoutCategories || ['День 1', 'День 2', 'День 3'];
    const profile = getActiveProfile();
    const actShort = ACTIVITY_LEVELS.find((a) => a.id === profile.body?.activity)?.short || 'не указана';
    const syncCfg = SYNC ? SYNC.getConfig() : null;
    const syncSt = SYNC ? SYNC.getStatus() : null;

    openSheet(`
      <div class="sheet-header">
        <h2 class="sheet-title">Настройки</h2>
        <button type="button" class="sheet-close" data-action="close-sheet">✕</button>
      </div>

      <div class="form-section" style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <div>
          <div class="ios-row-title">Облако GitHub (Марк ↔ Лера)</div>
          <div class="ios-row-sub">${syncCfg?.token ? `Подключено • ${escapeHtml(syncSt?.message || 'Готово')}` : 'Подключите токен для авто-синхронизации'}</div>
        </div>
        <button type="button" class="rule-bar-link" data-action="open-cloud-sync">Открыть ›</button>
      </div>

      <div class="form-section" style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <div>
          <div class="ios-row-title">Мои параметры (${escapeHtml(profile.name)})</div>
          <div class="ios-row-sub tabular">${profile.body?.completed ? `${profile.body.weightKg} кг • ${profile.body.heightCm} см • ${escapeHtml(actShort)}` : 'Не заполнены'}</div>
        </div>
        <button type="button" class="rule-bar-link" data-action="open-body-profile">Изменить ›</button>
      </div>

      <div class="form-section" style="display:flex;flex-direction:column;gap:10px;">
        <span class="field-label" style="margin-bottom:0;">Оформление</span>
        <div class="ios-segment">
          <button type="button" class="ios-segment-btn ${state.settings.theme === 'auto' ? 'active' : ''}" data-action="set-theme" data-theme-val="auto">Авто iOS</button>
          <button type="button" class="ios-segment-btn ${state.settings.theme === 'light' ? 'active' : ''}" data-action="set-theme" data-theme-val="light">Светлая</button>
          <button type="button" class="ios-segment-btn ${state.settings.theme === 'dark' ? 'active' : ''}" data-action="set-theme" data-theme-val="dark">Тёмная</button>
        </div>
      </div>

      <div class="form-section" style="display:flex;flex-direction:column;gap:10px;">
        <span class="field-label" style="margin-bottom:0;">Дни тренировок</span>
        <p style="margin:0;font-size:12px;color:var(--text-secondary);">
          Можно добавить День 4, 5 или назвать дни по-своему (например: «Ноги», «Верх», «Кардио»).
        </p>
        <div class="cat-chip-list">
          ${cats.map((c) => `
            <span class="cat-chip">
              <span>${escapeHtml(c)}</span>
              ${cats.length > 1 ? `<button type="button" class="cat-chip-del" data-action="delete-category" data-cat="${escapeHtml(c)}" aria-label="Удалить день">✕</button>` : ''}
            </span>
          `).join('')}
        </div>
        <form id="form-add-category" class="cat-add-row">
          <input type="text" id="input-new-category" class="field-input" placeholder="Например: День 4..." />
          <button type="submit" class="cat-add-btn">+ Добавить</button>
        </form>
      </div>

      <div class="form-section" style="display:flex;flex-direction:column;gap:10px;">
        <label style="display:flex;align-items:center;justify-content:space-between;font-size:14px;font-weight:600;">
          <span>Авто-таймер отдыха после подхода</span>
          <input type="checkbox" id="setting-timer-toggle" ${state.settings.restTimerEnabled ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--accent);" />
        </label>
        <div>
          <span class="field-label">Время отдыха</span>
          <div class="chip-row">
            ${[60, 75, 90, 120].map((sec) => `
              <button type="button" class="step-chip tabular ${state.settings.restSeconds === sec ? 'active' : ''}" data-action="set-rest-sec" data-sec="${sec}">${sec} сек</button>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="form-section" style="display:flex;flex-direction:column;gap:8px;">
        <span class="field-label" style="margin-bottom:0;">Локальный бэкап (JSON)</span>
        <p style="margin:0;font-size:12.5px;color:var(--text-secondary);">
          Резервная копия на случай отсутствия интернета.
        </p>
        <button type="button" class="btn-secondary-full" data-action="export-copy">Скопировать данные (JSON)</button>
        <button type="button" class="btn-secondary-full" data-action="export-file">Скачать файл бэкапа</button>
        <label class="btn-secondary-full" style="display:block;text-align:center;cursor:pointer;">
          Загрузить из файла бэкапа
          <input type="file" id="import-file-input" accept="application/json,.json" style="display:none;" />
        </label>
      </div>

      <div class="form-section">
        <button type="button" class="btn-danger-full" data-action="reset-demo">Сбросить к стартовым данным</button>
      </div>
    `);
  }

  function checkOnboardingRequired() {
    const profile = getActiveProfile();
    if (!profile.body || !profile.body.completed) {
      openBodyProfileSheet(true);
    }
  }

  /* ---- Master Render ---- */
  function render() {
    applyThemeAndUser();
    renderTimerStrip();

    const main = document.getElementById('main-content');
    if (!main) return;

    if (state.activeTab === 'workout') {
      main.innerHTML = renderWorkoutScreen();
    } else if (state.activeTab === 'progression') {
      main.innerHTML = renderProgressionScreen();
    } else {
      main.innerHTML = renderCatalogScreen();
      const searchInput = document.getElementById('catalog-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          catalogSearch = e.target.value;
          const listEl = document.getElementById('catalog-list');
          if (listEl) listEl.innerHTML = renderCatalogListItems();
        });
      }
    }
  }

  /* ---- Event Delegation ---- */
  document.addEventListener('click', (e) => {
    const userBtn = e.target.closest('[data-user-btn]');
    if (userBtn) {
      const nextUser = userBtn.getAttribute('data-user-btn');
      if (nextUser && nextUser !== state.activeUser) {
        state.activeUser = nextUser;
        const prof = state.profiles[nextUser];
        if (prof.activeSchemeId) {
          const sc = getSchemeById(nextUser, prof.activeSchemeId);
          if (sc) state.settings.restSeconds = sc.restSeconds;
        }
        saveState();
        closeSheet(true);
        render();
        showToast(`Профиль: ${prof.name}`);
        checkOnboardingRequired();
      }
      return;
    }

    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
      state.activeTab = tabBtn.getAttribute('data-tab');
      saveState();
      render();
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    if (e.target.closest('#btn-quick-add')) {
      openAddExerciseSheet();
      return;
    }

    if (e.target.closest('#btn-sync-cloud')) {
      openCloudSyncSheet();
      return;
    }

    if (e.target.closest('#btn-open-settings')) {
      openSettingsSheet();
      return;
    }

    if (e.target.id === 'sheet-backdrop') {
      closeSheet(false);
      return;
    }

    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.getAttribute('data-action');
    const exId = actionEl.getAttribute('data-ex-id');

    switch (action) {
      case 'close-sheet':
        closeSheet(false);
        break;

      case 'open-cloud-sync':
        openCloudSyncSheet();
        break;

      case 'gh-pull': {
        if (!SYNC) break;
        SYNC.pull(state).then((res) => {
          if (res.exists && res.merged) {
            state = res.merged;
            saveState({ sync: false, touchUser: null });
            render();
            openCloudSyncSheet();
            showToast('Данные загружены с GitHub');
          } else {
            openCloudSyncSheet();
            showToast('Файл на GitHub ещё не создан');
          }
        }).catch((err) => {
          openCloudSyncSheet();
          showToast(`Ошибка загрузки: ${err.message}`);
        });
        break;
      }

      case 'gh-push': {
        if (!SYNC) break;
        SYNC.push(state, 'Sync GymNote profiles (Mark & Lera)').then((res) => {
          if (res.merged) {
            state = res.merged;
            saveState({ sync: false, touchUser: null });
            render();
          }
          openCloudSyncSheet();
          showToast(res.pushed ? 'Сохранено на GitHub!' : 'Сначала добавьте токен GitHub');
        }).catch((err) => {
          openCloudSyncSheet();
          showToast(`Ошибка сохранения: ${err.message}`);
        });
        break;
      }

      case 'gh-sync-now': {
        if (!SYNC) break;
        SYNC.syncNow(state).then((res) => {
          if (res.merged) {
            state = res.merged;
            saveState({ sync: false, touchUser: null });
            render();
          }
          openCloudSyncSheet();
          showToast('Синхронизация с GitHub завершена!');
        }).catch((err) => {
          openCloudSyncSheet();
          showToast(`Ошибка: ${err.message}`);
        });
        break;
      }

      case 'gh-disconnect': {
        if (!SYNC) break;
        SYNC.clearToken();
        openCloudSyncSheet();
        showToast('Токен GitHub удалён с этого устройства');
        break;
      }

      case 'open-body-profile':
        openBodyProfileSheet(false);
        break;

      case 'switch-user-in-onboarding': {
        const nextUser = actionEl.getAttribute('data-target-user');
        if (nextUser && state.profiles[nextUser]) {
          state.activeUser = nextUser;
          saveState();
          closeSheet(true);
          render();
          checkOnboardingRequired();
        }
        break;
      }

      case 'pick-activity': {
        const act = actionEl.getAttribute('data-act');
        const hidden = document.getElementById('body-activity');
        if (hidden) hidden.value = act;
        document.querySelectorAll('#body-activity-grid .activity-option').forEach((b) => {
          b.classList.toggle('active', b.getAttribute('data-act') === act);
        });
        break;
      }

      case 'apply-scheme-close': {
        const schemeId = actionEl.getAttribute('data-scheme-id');
        applySchemeToUser(state.activeUser, schemeId);
        saveState();
        closeSheet(true);
        render();
        const sc = getSchemeById(state.activeUser, schemeId);
        showToast(`Схема «${sc.title}» применена!`);
        break;
      }

      case 'apply-scheme-all': {
        const schemeId = actionEl.getAttribute('data-scheme-id');
        applySchemeToUser(state.activeUser, schemeId);
        saveState();
        render();
        const sc = getSchemeById(state.activeUser, schemeId);
        showToast(`Применено ко всем упражнениям: ${sc.title}`);
        break;
      }

      case 'open-add-sheet':
        openAddExerciseSheet();
        break;

      case 'back-to-lib-search':
        openAddExerciseSheet(addSheetSearch);
        break;

      case 'set-add-muscle': {
        addSheetMuscle = actionEl.getAttribute('data-muscle');
        document.querySelectorAll('#add-lib-muscles .filter-pill').forEach((b) => {
          b.classList.toggle('active', b.getAttribute('data-muscle') === addSheetMuscle);
        });
        const res = document.getElementById('add-lib-results');
        if (res) res.innerHTML = renderAddLibraryResults();
        break;
      }

      case 'pick-lib-exercise': {
        const key = actionEl.getAttribute('data-lib-key');
        const libItem = DB?.EXERCISES_LIBRARY.find((l) => l.key === key);
        if (libItem) openConfirmAddForm(libItem);
        break;
      }

      case 'open-custom-add-form':
        openConfirmAddForm(null);
        break;

      case 'open-visual-preview':
        openVisualPreviewSheet(exId);
        break;

      case 'open-edit-sheet':
        openEditExerciseSheet(exId);
        break;

      case 'open-remove-sheet':
        openRemoveFromWorkoutSheet(exId);
        break;

      case 'remove-from-plan': {
        const item = ensureUserItem(state.activeUser, exId);
        item.inPlan = false;
        saveState();
        closeSheet(true);
        render();
        showToast(`Убрано из тренировки (${getActiveProfile().name})`);
        break;
      }

      case 'open-weight-sheet':
        openWeightInputSheet(exId);
        break;

      case 'open-history-sheet':
        openManualHistorySheet(exId);
        break;

      case 'set-day-filter':
        state.workoutDayFilter = actionEl.getAttribute('data-day');
        saveState();
        render();
        break;

      case 'delete-category': {
        const cat = actionEl.getAttribute('data-cat');
        if (state.workoutCategories.length <= 1) break;
        state.workoutCategories = state.workoutCategories.filter((c) => c !== cat);
        const fallback = state.workoutCategories[0];
        if (state.workoutDayFilter === cat) state.workoutDayFilter = fallback;
        state.exercises.forEach((ex) => { if (ex.day === cat) ex.day = fallback; });
        ['mark', 'lera'].forEach((uid) => {
          Object.values(state.profiles[uid].items).forEach((it) => { if (it.day === cat) it.day = fallback; });
        });
        saveState();
        openSettingsSheet();
        render();
        showToast(`День «${cat}» удалён`);
        break;
      }

      case 'set-catalog-filter':
        state.catalogFilter = actionEl.getAttribute('data-filter');
        saveState();
        render();
        break;

      case 'weight-step': {
        const delta = parseFloat(actionEl.getAttribute('data-delta'));
        const ex = state.exercises.find((x) => x.id === exId);
        const metric = getExMetric(ex);
        const item = ensureUserItem(state.activeUser, exId);
        const minVal = metric === 'cardio' ? 1 : 0;
        const stepSize = metric === 'time' ? 2.5 : item.step;
        item.weight = Math.max(minVal, Math.round((item.weight + delta * stepSize) * 100) / 100);
        saveState();
        render();
        break;
      }

      case 'reps-step': {
        const setIdx = parseInt(actionEl.getAttribute('data-set'), 10);
        const delta = parseInt(actionEl.getAttribute('data-delta'), 10);
        const ex = state.exercises.find((x) => x.id === exId);
        const metric = getExMetric(ex);
        const item = ensureUserItem(state.activeUser, exId);
        if (item.sets[setIdx]) {
          const stepInc = metric === 'time' ? delta * 5 : delta;
          const minR = metric === 'time' ? 5 : 1;
          item.sets[setIdx].reps = Math.max(minR, item.sets[setIdx].reps + stepInc);
          saveState();
          render();
        }
        break;
      }

      case 'toggle-set': {
        const setIdx = parseInt(actionEl.getAttribute('data-set'), 10);
        const item = ensureUserItem(state.activeUser, exId);
        if (item.sets[setIdx]) {
          const nextDone = !item.sets[setIdx].done;
          item.sets[setIdx].done = nextDone;
          if (nextDone) {
            item.sets[setIdx].weight = item.weight;
            if (state.settings.restTimerEnabled) {
              startRestTimer(state.settings.restSeconds);
            }
          } else {
            delete item.sets[setIdx].weight;
          }
          saveState();
          render();
        }
        break;
      }

      case 'add-set': {
        const item = ensureUserItem(state.activeUser, exId);
        const lastReps = item.sets.length ? item.sets[item.sets.length - 1].reps : item.minReps;
        item.sets.push({ reps: lastReps, done: false });
        saveState();
        render();
        break;
      }

      case 'remove-set': {
        const item = ensureUserItem(state.activeUser, exId);
        if (item.sets.length > 1) {
          item.sets.pop();
          saveState();
          render();
        }
        break;
      }

      case 'apply-progression': {
        const ex = state.exercises.find((x) => x.id === exId);
        const metric = getExMetric(ex);
        const kind = getExKind(ex);
        const item = ensureUserItem(state.activeUser, exId);
        const topWeight = Math.max(...item.sets.map((s) => (typeof s.weight === 'number' ? s.weight : item.weight)), item.weight);
        const topSets = item.sets.filter((s) => (typeof s.weight === 'number' ? s.weight : item.weight) === topWeight);
        const bestReps = Math.max(...(topSets.length ? topSets : item.sets).map((s) => s.reps));
        item.history.push({ date: todayISO(), weight: topWeight, reps: bestReps });

        if (metric === 'time') {
          item.minReps = item.maxReps;
          item.maxReps = item.maxReps + item.step;
          item.sets = item.sets.map(() => ({ reps: item.minReps, done: false }));
          saveState();
          render();
          showToast(`Новая цель: ${item.minReps}–${item.maxReps} сек!`);
        } else if (metric === 'cardio') {
          item.weight = Math.round((topWeight + item.step) * 100) / 100;
          item.sets = item.sets.map(() => ({ reps: item.minReps, done: false }));
          saveState();
          render();
          showToast(`Новый уровень кардио: ур. ${formatWeight(item.weight)}!`);
        } else if (topWeight === 0 && (kind === 'bodyweight' || kind === 'core')) {
          item.minReps += 2;
          item.maxReps += 2;
          item.sets = item.sets.map(() => ({ reps: item.minReps, done: false }));
          saveState();
          render();
          showToast(`Новая цель: ${item.minReps}–${item.maxReps} повт.!`);
        } else {
          item.weight = Math.round((topWeight + item.step) * 100) / 100;
          item.sets = item.sets.map(() => ({ reps: item.minReps, done: false }));
          saveState();
          render();
          showToast(`Новый рабочий вес: ${formatWeight(item.weight)} кг!`);
        }
        break;
      }

      case 'finish-workout': {
        const activeDay = state.workoutDayFilter;
        const planned = getUserPlanExercises(state.activeUser).filter(({ item }) => item.day === activeDay);
        const today = todayISO();
        let savedCount = 0;

        planned.forEach(({ item }) => {
          const doneSets = item.sets.filter((s) => s.done);
          if (doneSets.length === 0) return;
          // Берём максимальный рабочий вес/уровень среди выполненных подходов и лучший результат на нём
          const topWeight = Math.max(...doneSets.map((s) => (typeof s.weight === 'number' ? s.weight : item.weight)));
          const topSets = doneSets.filter((s) => (typeof s.weight === 'number' ? s.weight : item.weight) === topWeight);
          const bestReps = Math.max(...topSets.map((s) => s.reps));
          item.weight = topWeight;

          const last = item.history[item.history.length - 1];
          if (last && last.date === today) {
            last.weight = topWeight;
            last.reps = bestReps;
          } else {
            item.history.push({ date: today, weight: topWeight, reps: bestReps });
          }
          item.sets.forEach((s) => {
            s.done = false;
            delete s.weight;
          });
          savedCount += 1;
        });

        stopRestTimer(false);
        saveState();
        render();
        showToast(`${activeDay} завершён (${savedCount} упр.)!`);
        break;
      }

      case 'select-prog-ex':
        state.progressionExerciseId = exId;
        saveState();
        render();
        break;

      case 'set-prog-metric':
        state.progressionMetric = actionEl.getAttribute('data-metric');
        saveState();
        render();
        break;

      case 'set-rule-type': {
        const item = ensureUserItem(state.activeUser, exId);
        item.ruleType = actionEl.getAttribute('data-rule');
        saveState();
        render();
        break;
      }

      case 'rule-step-delta': {
        const item = ensureUserItem(state.activeUser, exId);
        const delta = parseFloat(actionEl.getAttribute('data-delta'));
        item.step = Math.max(0.5, Math.round((item.step + delta) * 100) / 100);
        saveState();
        render();
        break;
      }

      case 'rule-step-set': {
        const item = ensureUserItem(state.activeUser, exId);
        item.step = parseFloat(actionEl.getAttribute('data-step'));
        saveState();
        render();
        break;
      }

      case 'rule-reps-delta': {
        const ex = state.exercises.find((x) => x.id === exId);
        const metric = getExMetric(ex);
        const item = ensureUserItem(state.activeUser, exId);
        const field = actionEl.getAttribute('data-field');
        const rawDelta = parseInt(actionEl.getAttribute('data-delta'), 10);
        const delta = metric === 'time' ? rawDelta * 5 : rawDelta;
        const minBound = metric === 'time' ? 5 : 1;
        const maxBound = metric === 'time' ? 300 : (metric === 'cardio' ? 180 : 60);
        if (field === 'minReps') {
          item.minReps = Math.max(minBound, Math.min(maxBound, item.minReps + delta));
          if (item.maxReps < item.minReps) item.maxReps = item.minReps;
        } else {
          item.maxReps = Math.max(item.minReps, Math.min(maxBound, item.maxReps + delta));
        }
        saveState();
        render();
        break;
      }

      case 'delete-history': {
        const item = ensureUserItem(state.activeUser, exId);
        const idx = parseInt(actionEl.getAttribute('data-idx'), 10);
        if (!Number.isNaN(idx) && item.history[idx]) {
          item.history.splice(idx, 1);
          saveState();
          render();
          showToast('Запись удалена');
        }
        break;
      }

      case 'toggle-in-plan': {
        const item = ensureUserItem(state.activeUser, exId);
        item.inPlan = !item.inPlan;
        saveState();
        render();
        showToast(item.inPlan ? `Добавлено в план (${getActiveProfile().name})` : 'Убрано из плана');
        break;
      }

      case 'set-add-target': {
        const target = actionEl.getAttribute('data-target');
        const hidden = document.getElementById('add-target');
        const area = document.getElementById('add-weights-area');
        const mwRaw = parseFloat(document.getElementById('add-default-markw')?.value);
        const lwRaw = parseFloat(document.getElementById('add-default-leraw')?.value);
        const mw = Number.isNaN(mwRaw) ? 40 : mwRaw;
        const lw = Number.isNaN(lwRaw) ? 20 : lwRaw;
        const metric = document.getElementById('add-lib-metric')?.value || 'weight';
        const kind = document.getElementById('add-kind')?.value || 'base';
        if (hidden) hidden.value = target;
        document.querySelectorAll('#add-target-segment .ios-segment-btn').forEach((b) => {
          b.classList.toggle('active', b.getAttribute('data-target') === target);
        });
        if (area) area.innerHTML = renderAddWeightsInputs(target, mw, lw, metric, kind);
        refreshAddRecommendationUI();
        break;
      }

      case 'delete-exercise': {
        const idx = state.exercises.findIndex((x) => x.id === exId);
        if (idx !== -1) {
          state.exercises.splice(idx, 1);
          delete state.profiles.mark.items[exId];
          delete state.profiles.lera.items[exId];
          saveState();
          closeSheet(true);
          render();
          showToast('Удалено из базы');
        }
        break;
      }

      case 'start-timer-manual':
        startRestTimer(state.settings.restSeconds);
        break;

      case 'timer-add':
        timerState.remaining += 15;
        renderTimerStrip();
        break;

      case 'timer-stop':
        stopRestTimer(true);
        break;

      case 'set-theme':
        state.settings.theme = actionEl.getAttribute('data-theme-val');
        saveState();
        applyThemeAndUser();
        openSettingsSheet();
        break;

      case 'set-rest-sec':
        state.settings.restSeconds = parseInt(actionEl.getAttribute('data-sec'), 10);
        saveState();
        openSettingsSheet();
        render();
        break;

      case 'export-copy': {
        const json = JSON.stringify(state, null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(json)
            .then(() => showToast('Данные скопированы в буфер!'))
            .catch(() => showToast('Не удалось скопировать — скачайте файл'));
        } else {
          showToast('Используйте «Скачать файл бэкапа»');
        }
        break;
      }

      case 'export-file': {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gymnote-backup-${todayISO()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('Файл бэкапа сохранён');
        break;
      }

      case 'reset-demo':
        state = createDefaultData();
        saveState();
        closeSheet(true);
        render();
        showToast('Стартовые данные восстановлены');
        checkOnboardingRequired();
        break;
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'add-kind' || e.target.id === 'add-muscle' || e.target.id === 'add-equipment') {
      refreshAddRecommendationUI();
      const target = document.getElementById('add-target')?.value || state.activeUser;
      const area = document.getElementById('add-weights-area');
      const metric = document.getElementById('add-lib-metric')?.value || 'weight';
      const kind = document.getElementById('add-kind')?.value || 'base';
      const mwRaw = parseFloat(document.getElementById('add-default-markw')?.value);
      const lwRaw = parseFloat(document.getElementById('add-default-leraw')?.value);
      if (area) area.innerHTML = renderAddWeightsInputs(target, Number.isNaN(mwRaw) ? 0 : mwRaw, Number.isNaN(lwRaw) ? 0 : lwRaw, metric, kind);
      return;
    }

    if (e.target.id === 'setting-timer-toggle') {
      state.settings.restTimerEnabled = e.target.checked;
      saveState();
      return;
    }

    if (e.target.id === 'import-file-input') {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result);
          if (!imported.profiles || !imported.exercises) {
            showToast('Неверный формат файла');
            return;
          }
          state = imported;
          if (!Array.isArray(state.workoutCategories) || !state.workoutCategories.length) {
            state.workoutCategories = ['День 1', 'День 2', 'День 3'];
          }
          saveState();
          closeSheet(true);
          render();
          showToast('Данные успешно загружены!');
        } catch {
          showToast('Ошибка чтения JSON');
        }
      };
      reader.readAsText(file);
    }
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'form-gh-sync') {
      e.preventDefault();
      if (!SYNC) return;
      const token = (document.getElementById('gh-token')?.value || '').trim();
      const repo = (document.getElementById('gh-repo')?.value || 'bexaf3163/Gym-Training-').trim();
      const branch = (document.getElementById('gh-branch')?.value || 'main').trim();
      const path = (document.getElementById('gh-path')?.value || 'data/gymnote-data.json').trim();
      const autoSync = Boolean(document.getElementById('gh-autosync')?.checked);
      SYNC.saveConfig({ token, repo, branch, path, autoSync });

      const op = token ? SYNC.syncNow(state) : SYNC.pull(state);
      op.then((res) => {
        if (res.merged) {
          state = res.merged;
          saveState({ sync: false, touchUser: null });
          render();
        }
        openCloudSyncSheet();
        showToast(token ? 'GitHub подключён и синхронизирован!' : 'Настройки сохранены (режим чтения)');
      }).catch((err) => {
        openCloudSyncSheet();
        showToast(`Ошибка GitHub: ${err.message}`);
      });
      return;
    }

    if (e.target.id === 'form-body-profile') {
      e.preventDefault();
      const weightKg = parseFloat(document.getElementById('body-weight').value);
      const heightCm = parseInt(document.getElementById('body-height').value, 10);
      const activity = document.getElementById('body-activity').value || 'medium';
      if (!weightKg || !heightCm) return;

      const profile = getActiveProfile();
      profile.body = { weightKg, heightCm, activity, completed: true };
      saveState();
      render();
      openRecommendationResultSheet();
      return;
    }

    if (e.target.id === 'form-add-category') {
      e.preventDefault();
      const inp = document.getElementById('input-new-category');
      const val = (inp?.value || '').trim();
      if (!val) return;
      if (!state.workoutCategories.includes(val)) {
        state.workoutCategories.push(val);
        saveState();
        openSettingsSheet();
        render();
        showToast(`День «${val}» добавлен`);
      } else {
        showToast('Такой день уже есть');
      }
      return;
    }

    if (e.target.id === 'form-add-exercise') {
      e.preventDefault();
      const name = document.getElementById('add-name').value.trim();
      if (!name) return;

      const key = document.getElementById('add-lib-key')?.value || '';
      const en = document.getElementById('add-lib-en')?.value || '';
      const visual = document.getElementById('add-lib-visual')?.value || 'chest_press_machine';
      const equipment = document.getElementById('add-equipment').value;
      const muscle = document.getElementById('add-muscle').value;
      const kind = document.getElementById('add-kind')?.value || 'base';
      const metric = document.getElementById('add-lib-metric')?.value || (kind === 'cardio' ? 'cardio' : 'weight');
      const day = document.getElementById('add-day')?.value || getDefaultCategory();
      const step = Math.max(0.5, parseFloat(document.getElementById('add-step').value) || 2.5);
      const target = document.getElementById('add-target').value;
      const setupNote = document.getElementById('add-setup').value.trim();

      const existing = state.exercises.find((ex) =>
        (key && ex.key === key) || (DB && DB.normalizeText(ex.name) === DB.normalizeText(name))
      );

      let id;
      if (existing) {
        id = existing.id;
        existing.kind = kind;
        existing.metric = metric;
      } else {
        id = 'ex-' + Date.now();
        state.exercises.unshift({ id, key, name, en, equipment, muscle, kind, metric, day, visual });
      }

      const exMeta = { key, name, muscle, equipment, kind, metric };
      const safeNum = (raw, fallback) => {
        const n = parseFloat(raw);
        return Number.isNaN(n) ? fallback : Math.max(0, n);
      };
      const applyToUser = (uid, w, customStep) => {
        const smart = getSmartRuleForExercise(uid, exMeta);
        const item = ensureUserItem(uid, id, { inPlan: true, day, weight: w, step: customStep ?? smart.step, setupNote, ...smart });
        item.inPlan = true;
        item.day = day;
        item.weight = w;
        item.step = customStep ?? smart.step;
        item.minReps = smart.minReps;
        item.maxReps = smart.maxReps;
        if (setupNote) item.setupNote = setupNote;
        // Обновляем невыполненные подходы под новую рекомендацию
        if (smart.sets && item.sets.every((s) => !s.done)) {
          item.sets = Array.from({ length: smart.sets }, () => ({ reps: smart.minReps, done: false }));
        }
      };

      if (target === 'both') {
        const markW = safeNum(document.getElementById('add-weight-mark')?.value, 0);
        const leraW = safeNum(document.getElementById('add-weight-lera')?.value, 0);
        applyToUser('mark', markW, step);
        applyToUser('lera', leraW, null);
      } else {
        const w = safeNum(document.getElementById('add-weight-single')?.value, 0);
        applyToUser(target, w, step);
      }

      state.progressionExerciseId = id;
      catalogSearch = '';
      addSheetSearch = '';
      saveState();
      closeSheet(true);
      render();
      showToast(target === 'both' ? 'Добавлено Марку и Лере!' : `Добавлено: ${name}`);
      return;
    }

    if (e.target.id === 'form-edit-exercise') {
      e.preventDefault();
      const exId = e.target.getAttribute('data-ex-id');
      const ex = state.exercises.find((x) => x.id === exId);
      if (!ex) return;

      ex.name = document.getElementById('edit-name').value.trim() || ex.name;
      ex.equipment = document.getElementById('edit-equipment').value;
      ex.muscle = document.getElementById('edit-muscle').value;

      const item = ensureUserItem(state.activeUser, exId);
      const wVal = parseFloat(document.getElementById('edit-weight').value);
      item.weight = Number.isNaN(wVal) ? 0 : Math.max(0, wVal);
      item.day = document.getElementById('edit-day')?.value || getDefaultCategory();
      item.setupNote = document.getElementById('edit-setup').value.trim();
      item.inPlan = document.getElementById('edit-in-plan').checked;

      saveState();
      closeSheet(true);
      render();
      showToast('Изменения сохранены');
      return;
    }

    if (e.target.id === 'form-direct-weight') {
      e.preventDefault();
      const exId = e.target.getAttribute('data-ex-id');
      const val = parseFloat(document.getElementById('direct-weight-input').value);
      if (!Number.isNaN(val) && val >= 0) {
        const item = ensureUserItem(state.activeUser, exId);
        item.weight = Math.round(val * 100) / 100;
        saveState();
        closeSheet(true);
        render();
      }
      return;
    }

    if (e.target.id === 'form-manual-history') {
      e.preventDefault();
      const exId = e.target.getAttribute('data-ex-id');
      const date = document.getElementById('hist-date').value || todayISO();
      const wVal = parseFloat(document.getElementById('hist-weight').value);
      const weight = Number.isNaN(wVal) ? 0 : Math.max(0, wVal);
      const reps = Math.max(1, parseInt(document.getElementById('hist-reps').value, 10) || 10);

      const item = ensureUserItem(state.activeUser, exId);
      item.history.push({ date, weight, reps });
      item.history.sort((a, b) => a.date.localeCompare(b.date));
      item.weight = item.history[item.history.length - 1].weight;
      saveState();
      closeSheet(true);
      render();
      showToast('Запись добавлена в график');
    }
  });

  // Update GitHub Cloud Sync dot indicator in top bar
  if (SYNC) {
    SYNC.onStatusChange((st) => {
      const dot = document.getElementById('sync-dot');
      if (dot) {
        dot.className = 'sync-dot' + (st.state === 'ok' ? ' ok' : st.state === 'syncing' ? ' syncing' : st.state === 'error' ? ' error' : '');
      }
      const lbl = document.getElementById('gh-sync-status-label');
      if (lbl) lbl.textContent = st.message;
    });
  }

  // React to system theme changes in Auto mode
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (state.settings.theme === 'auto') applyThemeAndUser();
    });
  }

  // Register offline service worker (silently skip if served over file://)
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  render();
  setTimeout(checkOnboardingRequired, 180);

  // Silent initial sync from GitHub on startup (when online)
  if (SYNC && window.location.protocol.startsWith('http')) {
    const cfg = SYNC.getConfig();
    if (cfg.repo && cfg.path) {
      SYNC.pull(state).then((res) => {
        if (res.exists && res.merged) {
          state = res.merged;
          saveState({ sync: false, touchUser: null });
          render();
        }
      }).catch(() => {});
    }
  }
})();
