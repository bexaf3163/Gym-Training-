/* ==========================================================================
   GymNote — Comprehensive Gym Machines & Exercises Database + Animated SVGs
   Multilingual Search (RU / EN / Abbreviations / Gym Slang) -> Always Adds in RU
   ========================================================================== */

(() => {
  'use strict';

  const EXERCISES_LIBRARY = [
    // ==================== ГРУДЬ (CHEST) ====================
    {
      key: 'chest-press-machine',
      name: 'Жим от груди в тренажёре сидя',
      en: 'Seated Chest Press Machine',
      equipment: 'Тренажёр',
      muscle: 'Грудь',
      day: 'Верх',
      visual: 'chest_press_machine',
      markW: 60, leraW: 22.5, step: 2.5,
      aliases: ['chest press', 'seated chest press', 'cp', 'жим сидя', 'жим в тренажере', 'жим грудь', 'жим от груди', 'тренажер грудь', 'грудной жим']
    },
    {
      key: 'hammer-chest-press',
      name: 'Жим в Хаммере (рычажный)',
      en: 'Hammer Strength Chest Press',
      equipment: 'Тренажёр',
      muscle: 'Грудь',
      day: 'Верх',
      visual: 'chest_press_machine',
      markW: 60, leraW: 20, step: 2.5,
      aliases: ['hammer', 'hammer strength', 'hammer press', 'hs chest', 'хаммер', 'хамер', 'рычажный жим', 'жим в хамере', 'жим хаммер', 'изолатеральный жим']
    },
    {
      key: 'hammer-incline-press',
      name: 'Наклонный жим в Хаммере',
      en: 'Hammer Strength Incline Press',
      equipment: 'Тренажёр',
      muscle: 'Грудь',
      day: 'Верх',
      visual: 'chest_press_machine',
      markW: 50, leraW: 15, step: 2.5,
      aliases: ['incline hammer', 'upper chest hammer', 'наклонный хаммер', 'верх груди хаммер', 'рычажный вверх']
    },
    {
      key: 'pec-deck',
      name: 'Сведение рук в тренажёре (Бабочка)',
      en: 'Pec Deck / Butterfly Fly',
      equipment: 'Тренажёр',
      muscle: 'Грудь',
      day: 'Верх',
      visual: 'pec_deck',
      markW: 50, leraW: 25, step: 2.5,
      aliases: ['pec deck', 'peck deck', 'pecdec', 'butterfly', 'machine fly', 'chest fly', 'бабочка', 'пек дек', 'пекдек', 'баттерфляй', 'сведения', 'сведение грудь', 'сводка']
    },
    {
      key: 'cable-crossover',
      name: 'Сведения в кроссовере',
      en: 'Cable Crossover / Cable Fly',
      equipment: 'Блок',
      muscle: 'Грудь',
      day: 'Верх',
      visual: 'cable_crossover',
      markW: 20, leraW: 10, step: 2.5,
      aliases: ['cable crossover', 'crossover', 'cable fly', 'кроссовер', 'кросовер', 'сведения блоки', 'сведение на блоках', 'верхние блоки грудь']
    },
    {
      key: 'cable-crossover-low',
      name: 'Сведения снизу вверх в кроссовере',
      en: 'Low-to-High Cable Fly',
      equipment: 'Блок',
      muscle: 'Грудь',
      day: 'Верх',
      visual: 'cable_crossover',
      markW: 15, leraW: 7.5, step: 2.5,
      aliases: ['low cable fly', 'low to high', 'нижний кроссовер', 'кроссовер снизу', 'верх груди блок']
    },
    {
      key: 'barbell-bench-press',
      name: 'Жим штанги лёжа',
      en: 'Barbell Bench Press',
      equipment: 'Штанга',
      muscle: 'Грудь',
      day: 'Верх',
      visual: 'bench_press',
      markW: 70, leraW: 25, step: 2.5,
      aliases: ['bench press', 'bp', 'bb bench', 'flat bench', 'жим лежа', 'жл', 'жим штанги', 'базовый жим', 'горизонтальный жим']
    },
    {
      key: 'incline-barbell-bench',
      name: 'Жим штанги на наклонной скамье',
      en: 'Incline Barbell Bench Press',
      equipment: 'Штанга',
      muscle: 'Грудь',
      day: 'Верх',
      visual: 'bench_press',
      markW: 60, leraW: 20, step: 2.5,
      aliases: ['incline bench', 'ibp', 'incline bb', 'наклонный жим штанги', 'жим вверх', 'верх груди штанга', 'жим 30']
    },
    {
      key: 'smith-bench-press',
      name: 'Жим в тренажёре Смита',
      en: 'Smith Machine Bench Press',
      equipment: 'Тренажёр',
      muscle: 'Грудь',
      day: 'Верх',
      visual: 'squat_smith',
      markW: 60, leraW: 25, step: 2.5,
      aliases: ['smith', 'smith machine', 'smith bench', 'smith incline', 'смит', 'машина смита', 'жим в смите', 'наклонный смит']
    },
    {
      key: 'db-bench-press',
      name: 'Жим гантелей лёжа',
      en: 'Dumbbell Bench Press',
      equipment: 'Гантели',
      muscle: 'Грудь',
      day: 'Верх',
      visual: 'bench_press',
      markW: 26, leraW: 10, step: 2,
      aliases: ['db bench', 'dumbbell bench', 'db press', 'жим гантелей', 'жг', 'гантели грудь']
    },
    {
      key: 'incline-db-press',
      name: 'Жим гантелей на наклонной скамье',
      en: 'Incline Dumbbell Press',
      equipment: 'Гантели',
      muscle: 'Грудь',
      day: 'Верх',
      visual: 'bench_press',
      markW: 24, leraW: 10, step: 2,
      aliases: ['incline db', 'incline dumbbell', 'idbp', 'наклонный жим гантелей', 'жим на наклонной', 'гантели 30']
    },
    {
      key: 'db-fly',
      name: 'Разведение гантелей лёжа',
      en: 'Dumbbell Chest Fly',
      equipment: 'Гантели',
      muscle: 'Грудь',
      day: 'Верх',
      visual: 'pec_deck',
      markW: 14, leraW: 6, step: 2,
      aliases: ['db fly', 'dumbbell fly', 'разводка гантелей', 'разведения лежа', 'грудь разводка']
    },
    {
      key: 'dips-chest',
      name: 'Отжимания на брусьях',
      en: 'Chest / Parallel Bar Dips',
      equipment: 'Свой вес',
      muscle: 'Грудь',
      day: 'Верх',
      visual: 'pullup_gravitron',
      markW: 0, leraW: 0, step: 2.5,
      aliases: ['dips', 'parallel dips', 'брусья', 'отжимания брусья']
    },
    {
      key: 'gravitron-dips',
      name: 'Брусья в гравитроне',
      en: 'Assisted Dip Machine (Gravitron)',
      equipment: 'Тренажёр',
      muscle: 'Грудь',
      day: 'Верх',
      visual: 'pullup_gravitron',
      markW: 20, leraW: 35, step: 2.5,
      aliases: ['gravitron dips', 'assisted dip', 'гравитрон брусья', 'брусья с противовесом', 'противовес брусья']
    },
    {
      key: 'pushups',
      name: 'Отжимания от пола',
      en: 'Push-Ups',
      equipment: 'Свой вес',
      muscle: 'Грудь',
      kind: 'bodyweight',
      day: 'Верх',
      visual: 'pushup_floor',
      markW: 0, leraW: 0, step: 2.5,
      aliases: ['push ups', 'pushups', 'отжимания', 'отжимания от пола', 'свой вес']
    },

    // ==================== СПИНА (BACK) ====================
    {
      key: 'lat-pulldown',
      name: 'Тяга верхнего блока',
      en: 'Lat Pulldown',
      equipment: 'Блок',
      muscle: 'Спина',
      day: 'Верх',
      visual: 'lat_pulldown',
      markW: 60, leraW: 30, step: 2.5,
      aliases: ['lat pulldown', 'pulldown', 'lpd', 'твб', 'верхний блок', 'вертикальная тяга', 'тяга сверху', 'широчайшие', 'широкий хват']
    },
    {
      key: 'lat-pulldown-close',
      name: 'Тяга верхнего блока узким хватом',
      en: 'Close-Grip Lat Pulldown',
      equipment: 'Блок',
      muscle: 'Спина',
      day: 'Верх',
      visual: 'lat_pulldown',
      markW: 55, leraW: 27.5, step: 2.5,
      aliases: ['close grip pulldown', 'v-bar pulldown', 'neutral pulldown', 'узкий хват блок', 'параллельный хват', 'твб узкий']
    },
    {
      key: 'seated-cable-row',
      name: 'Тяга горизонтального блока',
      en: 'Seated Cable Row',
      equipment: 'Блок',
      muscle: 'Спина',
      day: 'Верх',
      visual: 'cable_row',
      markW: 55, leraW: 27.5, step: 2.5,
      aliases: ['cable row', 'seated row', 'low row', 'тгб', 'горизонтальный блок', 'нижний блок', 'тяга к поясу', 'тяга к животу']
    },
    {
      key: 'hammer-row',
      name: 'Тяга в Хаммере (рычажная)',
      en: 'Hammer Strength Iso-Lateral Row',
      equipment: 'Тренажёр',
      muscle: 'Спина',
      day: 'Верх',
      visual: 'row_machine',
      markW: 60, leraW: 25, step: 2.5,
      aliases: ['hammer row', 'iso row', 'machine row', 'хаммер спина', 'рычажная тяга', 'тяга в тренажере', 'тяга сидя в тренажере']
    },
    {
      key: 'hammer-high-row',
      name: 'Верхняя тяга в Хаммере',
      en: 'Hammer Strength High Row / DY Row',
      equipment: 'Тренажёр',
      muscle: 'Спина',
      day: 'Верх',
      visual: 'lat_pulldown',
      markW: 60, leraW: 25, step: 2.5,
      aliases: ['high row', 'dy row', 'hammer pulldown', 'верхний хаммер', 'тяга сверху хаммер', 'рычажная сверху']
    },
    {
      key: 't-bar-row',
      name: 'Тяга Т-грифа в тренажёре',
      en: 'Chest-Supported T-Bar Row',
      equipment: 'Тренажёр',
      muscle: 'Спина',
      day: 'Верх',
      visual: 'row_machine',
      markW: 45, leraW: 20, step: 2.5,
      aliases: ['t-bar', 'tbar', 't bar row', 'т-гриф', 'т гриф', 'тяга с упором в грудь', 'тбар']
    },
    {
      key: 'gravitron-pullups',
      name: 'Подтягивания в гравитроне',
      en: 'Assisted Pull-Ups (Gravitron)',
      equipment: 'Тренажёр',
      muscle: 'Спина',
      day: 'Верх',
      visual: 'pullup_gravitron',
      markW: 20, leraW: 35, step: 2.5,
      aliases: ['gravitron', 'assisted pull up', 'assisted pullups', 'гравитрон', 'подтягивания с противовесом', 'противовес спина']
    },
    {
      key: 'pullups',
      name: 'Подтягивания на турнике',
      en: 'Pull-Ups / Chin-Ups',
      equipment: 'Свой вес',
      muscle: 'Спина',
      day: 'Верх',
      visual: 'pullup_gravitron',
      markW: 0, leraW: 0, step: 2.5,
      aliases: ['pull ups', 'pullups', 'chinups', 'турник', 'подтягивания']
    },
    {
      key: 'straight-arm-pulldown',
      name: 'Пуловер в верхнем блоке (прямые руки)',
      en: 'Straight-Arm Cable Pulldown',
      equipment: 'Блок',
      muscle: 'Спина',
      day: 'Верх',
      visual: 'lat_pulldown',
      markW: 25, leraW: 15, step: 2.5,
      aliases: ['straight arm pulldown', 'cable pullover', 'пуловер блок', 'пулловер', 'прямые руки блок', 'добивка спины']
    },
    {
      key: 'db-row',
      name: 'Тяга гантели в наклоне одной рукой',
      en: 'Single-Arm Dumbbell Row',
      equipment: 'Гантели',
      muscle: 'Спина',
      day: 'Верх',
      visual: 'row_machine',
      markW: 26, leraW: 12, step: 2,
      aliases: ['db row', 'one arm row', 'dumbbell row', 'тяга гантели', 'тяга одной рукой', 'тяга к поясу гантель']
    },
    {
      key: 'barbell-row',
      name: 'Тяга штанги в наклоне',
      en: 'Bent-Over Barbell Row',
      equipment: 'Штанга',
      muscle: 'Спина',
      day: 'Верх',
      visual: 'deadlift_rdl',
      markW: 60, leraW: 25, step: 2.5,
      aliases: ['barbell row', 'bb row', 'bent over row', 'pendlay', 'тяга в наклоне', 'тяга штанги']
    },
    {
      key: 'deadlift',
      name: 'Становая тяга классическая',
      en: 'Conventional Deadlift',
      equipment: 'Штанга',
      muscle: 'Спина',
      day: 'Низ',
      visual: 'deadlift_rdl',
      markW: 100, leraW: 45, step: 5,
      aliases: ['deadlift', 'dl', 'становая', 'ст', 'тяга штанги с пола', 'классика']
    },
    {
      key: 'hyperextension',
      name: 'Гиперэкстензия',
      en: 'Back Extension (Roman Chair)',
      equipment: 'Свой вес',
      muscle: 'Спина',
      day: 'Низ',
      visual: 'hyperextension',
      markW: 10, leraW: 5, step: 2.5,
      aliases: ['hyperextension', 'back extension', 'roman chair', 'гиперэкстензия', 'гипера', 'разгибания спины', 'поясница']
    },
    {
      key: 'back-extension-machine',
      name: 'Разгибание спины в тренажёре',
      en: 'Seated Back Extension Machine',
      equipment: 'Тренажёр',
      muscle: 'Спина',
      day: 'Верх',
      visual: 'hyperextension',
      markW: 45, leraW: 25, step: 5,
      aliases: ['lower back machine', 'back extension machine', 'поясница тренажер', 'разгибатель спины']
    },
    {
      key: 'shrugs',
      name: 'Шраги с гантелями / в тренажёре',
      en: 'Dumbbell / Machine Shrugs',
      equipment: 'Гантели',
      muscle: 'Спина',
      day: 'Верх',
      visual: 'deadlift_rdl',
      markW: 26, leraW: 10, step: 2,
      aliases: ['shrugs', 'traps', 'шраги', 'трапеция', 'трапеции']
    },

    // ==================== НОГИ (LEGS) ====================
    {
      key: 'leg-press-45',
      name: 'Жим ногами под 45°',
      en: '45° Leg Press Machine',
      equipment: 'Тренажёр',
      muscle: 'Ноги',
      day: 'Низ',
      visual: 'leg_press',
      markW: 140, leraW: 70, step: 5,
      aliases: ['leg press', '45 leg press', 'lp', 'жн', 'жим ногами', 'платформа', 'жим платформы', 'ноги тренажер']
    },
    {
      key: 'leg-press-horizontal',
      name: 'Горизонтальный жим ногами в тренажёре',
      en: 'Seated Horizontal Leg Press',
      equipment: 'Тренажёр',
      muscle: 'Ноги',
      day: 'Низ',
      visual: 'leg_press',
      markW: 90, leraW: 50, step: 5,
      aliases: ['seated leg press', 'horizontal leg press', 'горизонтальный жим ногами', 'блочный жим ногами', 'жим сидя ноги']
    },
    {
      key: 'hack-squat',
      name: 'Гакк-приседания в тренажёре',
      en: 'Hack Squat Machine',
      equipment: 'Тренажёр',
      muscle: 'Ноги',
      day: 'Низ',
      visual: 'hack_squat',
      markW: 80, leraW: 35, step: 5,
      aliases: ['hack squat', 'hack', 'гакк', 'гак', 'гакк присед', 'гакк машина', 'присед в гакке']
    },
    {
      key: 'pendulum-squat',
      name: 'Маятниковый присед (Пендулум)',
      en: 'Pendulum Squat Machine',
      equipment: 'Тренажёр',
      muscle: 'Ноги',
      day: 'Низ',
      visual: 'hack_squat',
      markW: 50, leraW: 20, step: 5,
      aliases: ['pendulum', 'pendulum squat', 'маятник', 'маятниковый присед', 'пендулум']
    },
    {
      key: 'leg-extension',
      name: 'Разгибание ног сидя в тренажёре',
      en: 'Seated Leg Extension',
      equipment: 'Тренажёр',
      muscle: 'Ноги',
      day: 'Низ',
      visual: 'leg_extension',
      markW: 60, leraW: 35, step: 5,
      aliases: ['leg extension', 'leg ext', 'quad extension', 'разгибания ног', 'разгибание ног', 'квадрицепс', 'квадра', 'передняя поверхность бедра']
    },
    {
      key: 'leg-curl-lying',
      name: 'Сгибание ног лёжа в тренажёре',
      en: 'Lying Leg Curl',
      equipment: 'Тренажёр',
      muscle: 'Ноги',
      day: 'Низ',
      visual: 'leg_curl',
      markW: 45, leraW: 25, step: 2.5,
      aliases: ['lying leg curl', 'hamstring curl', 'leg curl', 'сгибания ног лежа', 'сгибание ног лежа', 'бицепс бедра лежа', 'задняя поверхность']
    },
    {
      key: 'leg-curl-seated',
      name: 'Сгибание ног сидя в тренажёре',
      en: 'Seated Leg Curl',
      equipment: 'Тренажёр',
      muscle: 'Ноги',
      day: 'Низ',
      visual: 'leg_curl',
      markW: 50, leraW: 30, step: 2.5,
      aliases: ['seated leg curl', 'сгибания ног сидя', 'сгибание сидя', 'бицепс бедра сидя']
    },
    {
      key: 'barbell-squat',
      name: 'Приседания со штангой',
      en: 'Barbell Back Squat',
      equipment: 'Штанга',
      muscle: 'Ноги',
      day: 'Низ',
      visual: 'squat_smith',
      markW: 80, leraW: 40, step: 2.5,
      aliases: ['squat', 'back squat', 'bb squat', 'sq', 'присед', 'приседания', 'присед со штангой']
    },
    {
      key: 'smith-squat',
      name: 'Приседания в тренажёре Смита',
      en: 'Smith Machine Squat',
      equipment: 'Тренажёр',
      muscle: 'Ноги',
      day: 'Низ',
      visual: 'squat_smith',
      markW: 65, leraW: 35, step: 2.5,
      aliases: ['smith squat', 'присед в смите', 'смит ноги', 'приседания смит']
    },
    {
      key: 'goblet-squat',
      name: 'Гоблет-приседания с гантелью',
      en: 'Goblet Squat',
      equipment: 'Гантели',
      muscle: 'Ноги',
      day: 'Низ',
      visual: 'squat_smith',
      markW: 24, leraW: 14, step: 2,
      aliases: ['goblet', 'goblet squat', 'гоблет', 'присед с гантелью', 'кубковые приседания']
    },
    {
      key: 'rdl-barbell',
      name: 'Румынская тяга со штангой',
      en: 'Romanian Deadlift (RDL)',
      equipment: 'Штанга',
      muscle: 'Ноги',
      day: 'Низ',
      visual: 'deadlift_rdl',
      markW: 75, leraW: 40, step: 2.5,
      aliases: ['rdl', 'romanian deadlift', 'stiff leg', 'рдл', 'рмт', 'румынка', 'румынская тяга', 'тяга на прямых']
    },
    {
      key: 'rdl-db',
      name: 'Румынская тяга с гантелями',
      en: 'Dumbbell Romanian Deadlift (DB RDL)',
      equipment: 'Гантели',
      muscle: 'Ноги',
      day: 'Низ',
      visual: 'deadlift_rdl',
      markW: 24, leraW: 14, step: 2,
      aliases: ['db rdl', 'dumbbell rdl', 'румынка с гантелями', 'румынская гантели', 'рдл гантели']
    },
    {
      key: 'bulgarian-split-squat',
      name: 'Болгарские выпады',
      en: 'Bulgarian Split Squat',
      equipment: 'Гантели',
      muscle: 'Ноги',
      day: 'Низ',
      visual: 'lunges',
      markW: 16, leraW: 10, step: 2,
      aliases: ['bulgarian', 'bss', 'split squat', 'бсс', 'болгарские', 'болгарский присед', 'выпады на лавке']
    },
    {
      key: 'lunges',
      name: 'Выпады с гантелями / в Смите',
      en: 'Walking / Reverse Lunges',
      equipment: 'Гантели',
      muscle: 'Ноги',
      day: 'Низ',
      visual: 'lunges',
      markW: 16, leraW: 10, step: 2,
      aliases: ['lunges', 'reverse lunge', 'выпады', 'выпады назад', 'шагающие выпады']
    },
    {
      key: 'hip-adduction',
      name: 'Сведение ног в тренажёре',
      en: 'Seated Hip Adduction Machine',
      equipment: 'Тренажёр',
      muscle: 'Ноги',
      day: 'Низ',
      visual: 'abduction',
      markW: 50, leraW: 35, step: 5,
      aliases: ['adduction', 'adductor', 'inner thigh', 'аддуктор', 'сведение ног', 'сведение бедер', 'внутренняя поверхность бедра']
    },
    {
      key: 'calf-raise-standing',
      name: 'Подъём на носки стоя в тренажёре',
      en: 'Standing Calf Raise Machine',
      equipment: 'Тренажёр',
      muscle: 'Ноги',
      day: 'Низ',
      visual: 'calf_raise',
      markW: 60, leraW: 35, step: 5,
      aliases: ['calf raise', 'standing calf', 'икры', 'икры стоя', 'голень', 'подъем на носки']
    },
    {
      key: 'calf-raise-seated',
      name: 'Подъём на носки сидя в тренажёре',
      en: 'Seated Calf Raise Machine',
      equipment: 'Тренажёр',
      muscle: 'Ноги',
      day: 'Низ',
      visual: 'calf_raise',
      markW: 40, leraW: 20, step: 2.5,
      aliases: ['seated calf', 'soleus', 'икры сидя', 'камбаловидная']
    },

    // ==================== ЯГОДИЦЫ (GLUTES) ====================
    {
      key: 'hip-thrust-machine',
      name: 'Ягодичный мост в тренажёре',
      en: 'Hip Thrust / Booty Builder Machine',
      equipment: 'Тренажёр',
      muscle: 'Ягодицы',
      day: 'Низ',
      visual: 'hip_thrust',
      markW: 90, leraW: 60, step: 5,
      aliases: ['hip thrust', 'booty builder', 'glute drive', 'glute bridge', 'хип траст', 'хиптраст', 'ягодичный мост', 'мостик', 'бути билдер', 'ягодицы тренажер']
    },
    {
      key: 'hip-thrust-barbell',
      name: 'Ягодичный мост со штангой',
      en: 'Barbell Hip Thrust',
      equipment: 'Штанга',
      muscle: 'Ягодицы',
      day: 'Низ',
      visual: 'hip_thrust',
      markW: 90, leraW: 55, step: 5,
      aliases: ['bb hip thrust', 'barbell hip thrust', 'мост со штангой', 'хип траст штанга', 'ягодичный штанга']
    },
    {
      key: 'hip-abduction',
      name: 'Разведение ног в тренажёре',
      en: 'Seated Hip Abduction Machine',
      equipment: 'Тренажёр',
      muscle: 'Ягодицы',
      day: 'Низ',
      visual: 'abduction',
      markW: 55, leraW: 45, step: 5,
      aliases: ['abduction', 'abductor', 'hip abductor', 'абдуктор', 'разведение ног', 'разведение бедер', 'разведения ягодицы', 'средняя ягодичная']
    },
    {
      key: 'glute-kickback-machine',
      name: 'Отведение ноги назад в тренажёре',
      en: 'Glute Kickback Machine',
      equipment: 'Тренажёр',
      muscle: 'Ягодицы',
      day: 'Низ',
      visual: 'leg_extension',
      markW: 45, leraW: 35, step: 5,
      aliases: ['kickback', 'glute kickback', 'glute machine', 'кикбэк', 'махи назад тренажер', 'отведение ноги назад', 'ягодицы тренажер']
    },
    {
      key: 'cable-kickback',
      name: 'Отведение ноги назад в кроссовере',
      en: 'Cable Glute Kickback',
      equipment: 'Блок',
      muscle: 'Ягодицы',
      day: 'Низ',
      visual: 'leg_extension',
      markW: 15, leraW: 10, step: 2.5,
      aliases: ['cable kickback', 'ankle strap', 'махи в кроссовере', 'отведение с манжетой', 'манжета блок']
    },
    {
      key: 'sumo-squat',
      name: 'Приседания сумо с гантелью / гирей',
      en: 'Sumo Squat',
      equipment: 'Гантели',
      muscle: 'Ягодицы',
      day: 'Низ',
      visual: 'squat_smith',
      markW: 32, leraW: 20, step: 2,
      aliases: ['sumo', 'sumo squat', 'plie', 'сумо', 'плие', 'широкий присед']
    },
    {
      key: 'step-ups',
      name: 'Зашагивания на тумбу',
      en: 'Dumbbell Step-Ups',
      equipment: 'Гантели',
      muscle: 'Ягодицы',
      day: 'Низ',
      visual: 'lunges',
      markW: 14, leraW: 8, step: 2,
      aliases: ['step ups', 'stepup', 'зашагивания', 'тумба', 'степ ап']
    },

    // ==================== ПЛЕЧИ (SHOULDERS) ====================
    {
      key: 'shoulder-press-machine',
      name: 'Жим плечами в тренажёре сидя',
      en: 'Seated Shoulder Press Machine',
      equipment: 'Тренажёр',
      muscle: 'Плечи',
      day: 'Верх',
      visual: 'shoulder_press',
      markW: 45, leraW: 20, step: 2.5,
      aliases: ['shoulder press', 'overhead press machine', 'ohp machine', 'жим вверх тренажер', 'плечи тренажер', 'дельты тренажер', 'жим в тренажере вверх']
    },
    {
      key: 'lateral-raise-machine',
      name: 'Отведение рук в стороны в тренажёре',
      en: 'Lateral Raise Machine',
      equipment: 'Тренажёр',
      muscle: 'Плечи',
      day: 'Верх',
      visual: 'lateral_raise',
      markW: 30, leraW: 15, step: 2.5,
      aliases: ['lateral raise machine', 'side delt machine', 'махи тренажер', 'средняя дельта тренажер', 'отведения в стороны']
    },
    {
      key: 'reverse-pec-deck',
      name: 'Обратная бабочка (задняя дельта)',
      en: 'Reverse Pec Deck / Rear Delt Fly',
      equipment: 'Тренажёр',
      muscle: 'Плечи',
      day: 'Верх',
      visual: 'pec_deck',
      markW: 40, leraW: 20, step: 2.5,
      aliases: ['reverse pec deck', 'rear delt', 'reverse fly', 'обратная бабочка', 'задняя дельта', 'задние дельты', 'разведения назад']
    },
    {
      key: 'face-pull',
      name: 'Тяга каната к лицу (Фейс-пул)',
      en: 'Cable Face Pull',
      equipment: 'Блок',
      muscle: 'Плечи',
      day: 'Верх',
      visual: 'cable_row',
      markW: 22.5, leraW: 12.5, step: 2.5,
      aliases: ['face pull', 'facepull', 'fp', 'фейспул', 'фейс пул', 'тяга к лицу', 'задняя дельта блок']
    },
    {
      key: 'db-shoulder-press',
      name: 'Жим гантелей сидя вверх',
      en: 'Seated Dumbbell Shoulder Press',
      equipment: 'Гантели',
      muscle: 'Плечи',
      day: 'Верх',
      visual: 'shoulder_press',
      markW: 18, leraW: 8, step: 2,
      aliases: ['db ohp', 'db shoulder press', 'arnold press', 'жим гантелей вверх', 'жим сидя плечи', 'жим арнольда']
    },
    {
      key: 'barbell-ohp',
      name: 'Армейский жим штанги стоя',
      en: 'Overhead Barbell Press (OHP)',
      equipment: 'Штанга',
      muscle: 'Плечи',
      day: 'Верх',
      visual: 'shoulder_press',
      markW: 45, leraW: 20, step: 2.5,
      aliases: ['ohp', 'overhead press', 'military press', 'армейский жим', 'жим стоя', 'ошп']
    },
    {
      key: 'db-lateral-raise',
      name: 'Махи гантелями в стороны',
      en: 'Dumbbell Lateral Raises',
      equipment: 'Гантели',
      muscle: 'Плечи',
      day: 'Верх',
      visual: 'lateral_raise',
      markW: 10, leraW: 5, step: 1,
      aliases: ['lateral raise', 'side raise', 'lat raise', 'махи в стороны', 'махи гантелями', 'средняя дельта', 'разведения стоя']
    },
    {
      key: 'cable-lateral-raise',
      name: 'Отведение руки в сторону в блоке',
      en: 'Single-Arm Cable Lateral Raise',
      equipment: 'Блок',
      muscle: 'Плечи',
      day: 'Верх',
      visual: 'lateral_raise',
      markW: 7.5, leraW: 5, step: 1.25,
      aliases: ['cable lateral', 'махи в кроссовере', 'махи в блоке', 'средняя дельта блок']
    },

    // ==================== РУКИ (ARMS) ====================
    {
      key: 'bicep-curl-machine',
      name: 'Сгибание на бицепс в тренажёре',
      en: 'Bicep Curl Machine (Preacher)',
      equipment: 'Тренажёр',
      muscle: 'Руки',
      day: 'Верх',
      visual: 'bicep_curl',
      markW: 35, leraW: 15, step: 2.5,
      aliases: ['bicep machine', 'preacher machine', 'curl machine', 'бицепс тренажер', 'бицепс машина', 'скотт тренажер']
    },
    {
      key: 'db-bicep-curl',
      name: 'Подъём гантелей на бицепс',
      en: 'Dumbbell Bicep Curls',
      equipment: 'Гантели',
      muscle: 'Руки',
      day: 'Верх',
      visual: 'bicep_curl',
      markW: 14, leraW: 6, step: 1,
      aliases: ['bicep curl', 'db curl', 'dumbbell curl', 'бицепс гантели', 'сгибания рук', 'бицепс стоя']
    },
    {
      key: 'hammer-curls',
      name: 'Молотки с гантелями',
      en: 'Dumbbell Hammer Curls',
      equipment: 'Гантели',
      muscle: 'Руки',
      day: 'Верх',
      visual: 'bicep_curl',
      markW: 14, leraW: 6, step: 1,
      aliases: ['hammer curl', 'hammer curls', 'молотки', 'молотковые сгибания', 'брахиалис']
    },
    {
      key: 'ez-bar-curl',
      name: 'Подъём EZ-штанги на бицепс',
      en: 'EZ-Bar Bicep Curl / Preacher Curl',
      equipment: 'Штанга',
      muscle: 'Руки',
      day: 'Верх',
      visual: 'bicep_curl',
      markW: 30, leraW: 12.5, step: 2.5,
      aliases: ['ez curl', 'barbell curl', 'preacher curl', 'scott curl', 'кривой гриф', 'скамья скотта', 'скотт', 'бицепс штанга']
    },
    {
      key: 'cable-bicep-curl',
      name: 'Сгибания на бицепс в нижнем блоке',
      en: 'Cable Bicep Curl',
      equipment: 'Блок',
      muscle: 'Руки',
      day: 'Верх',
      visual: 'bicep_curl',
      markW: 25, leraW: 12.5, step: 2.5,
      aliases: ['cable curl', 'бицепс в кроссовере', 'бицепс блок']
    },
    {
      key: 'tricep-pushdown-rope',
      name: 'Разгибание на трицепс в блоке (канат)',
      en: 'Cable Rope Tricep Pushdown',
      equipment: 'Блок',
      muscle: 'Руки',
      day: 'Верх',
      visual: 'tricep_pushdown',
      markW: 25, leraW: 12.5, step: 2.5,
      aliases: ['tricep pushdown', 'rope pushdown', 'pushdown', 'трицепс блок', 'косичка', 'канат трицепс', 'пушдаун', 'разгибание рук']
    },
    {
      key: 'tricep-overhead-cable',
      name: 'Разгибание на трицепс из-за головы в блоке',
      en: 'Overhead Cable Tricep Extension',
      equipment: 'Блок',
      muscle: 'Руки',
      day: 'Верх',
      visual: 'tricep_pushdown',
      markW: 22.5, leraW: 10, step: 2.5,
      aliases: ['overhead tricep', 'канат из-за головы', 'трицепс из за головы', 'длинная головка трицепса']
    },
    {
      key: 'tricep-dip-machine',
      name: 'Жим вниз на трицепс в тренажёре',
      en: 'Seated Tricep Dip Machine',
      equipment: 'Тренажёр',
      muscle: 'Руки',
      day: 'Верх',
      visual: 'tricep_pushdown',
      markW: 50, leraW: 25, step: 2.5,
      aliases: ['tricep dip machine', 'tricep press', 'трицепс тренажер', 'брусья сидя тренажер']
    },
    {
      key: 'skullcrusher',
      name: 'Французский жим',
      en: 'Skullcrusher / French Press',
      equipment: 'Штанга',
      muscle: 'Руки',
      day: 'Верх',
      visual: 'bench_press',
      markW: 25, leraW: 10, step: 2.5,
      aliases: ['skullcrusher', 'skull crusher', 'french press', 'французский', 'французский жим', 'трицепс лежа']
    },

    // ==================== КОР / ПРЕСС (CORE) ====================
    {
      key: 'ab-crunch-machine',
      name: 'Скручивания на пресс в тренажёре',
      en: 'Seated Ab Crunch Machine',
      equipment: 'Тренажёр',
      muscle: 'Кор',
      day: 'Фулбади',
      visual: 'abs_crunch',
      markW: 40, leraW: 25, step: 2.5,
      aliases: ['ab crunch', 'abs machine', 'crunch machine', 'пресс тренажер', 'скручивания тренажер', 'живот тренажер']
    },
    {
      key: 'cable-crunch',
      name: 'Молитва (скручивания в верхнем блоке)',
      en: 'Kneeling Cable Crunch',
      equipment: 'Блок',
      muscle: 'Кор',
      day: 'Фулбади',
      visual: 'abs_crunch',
      markW: 35, leraW: 20, step: 2.5,
      aliases: ['cable crunch', 'prayer', 'молитва', 'скручивания в блоке', 'пресс блок']
    },
    {
      key: 'hanging-leg-raise',
      name: 'Подъём ног в висе / в упоре',
      en: 'Hanging / Captain Chair Leg Raise',
      equipment: 'Свой вес',
      muscle: 'Кор',
      day: 'Фулбади',
      visual: 'abs_crunch',
      markW: 0, leraW: 0, step: 1,
      aliases: ['leg raise', 'hanging leg raise', 'captain chair', 'подъем ног', 'пресс в упоре', 'пресс турник', 'нижний пресс']
    },
    {
      key: 'torso-rotation',
      name: 'Повороты корпуса в тренажёре (косые)',
      en: 'Torso Rotation Machine',
      equipment: 'Тренажёр',
      muscle: 'Кор',
      day: 'Фулбади',
      visual: 'abs_crunch',
      markW: 30, leraW: 20, step: 2.5,
      aliases: ['torso rotation', 'oblique machine', 'ротор торса', 'косые тренажер', 'повороты корпуса']
    },
    {
      key: 'plank',
      name: 'Планка на локтях',
      en: 'Forearm Plank',
      equipment: 'Свой вес',
      muscle: 'Кор',
      kind: 'core',
      metric: 'time',
      day: 'День 1',
      visual: 'plank_hold',
      markW: 0, leraW: 0, step: 10,
      aliases: ['plank', 'forearm plank', 'core', 'планка', 'планка на локтях', 'кор', 'статика']
    },
    {
      key: 'side-plank',
      name: 'Боковая планка',
      en: 'Side Plank',
      equipment: 'Свой вес',
      muscle: 'Кор',
      kind: 'core',
      metric: 'time',
      day: 'День 1',
      visual: 'plank_hold',
      markW: 0, leraW: 0, step: 10,
      aliases: ['side plank', 'obliques', 'боковая планка', 'косые планка']
    },
    {
      key: 'floor-crunch',
      name: 'Скручивания на пресс на полу',
      en: 'Floor Ab Crunches',
      equipment: 'Свой вес',
      muscle: 'Кор',
      kind: 'core',
      day: 'День 1',
      visual: 'floor_crunch',
      markW: 0, leraW: 0, step: 2.5,
      aliases: ['crunches', 'ab crunch', 'sit ups', 'пресс', 'скручивания', 'пресс на полу', 'качать пресс']
    },
    {
      key: 'bicycle-crunch',
      name: 'Велосипед на пресс',
      en: 'Bicycle Crunches',
      equipment: 'Свой вес',
      muscle: 'Кор',
      kind: 'core',
      day: 'День 1',
      visual: 'floor_crunch',
      markW: 0, leraW: 0, step: 2.5,
      aliases: ['bicycle crunch', 'bicycle abs', 'велосипед пресс', 'велосипед лежа', 'косые пресс']
    },
    {
      key: 'lying-leg-raise',
      name: 'Подъём ног лёжа на полу',
      en: 'Lying Leg Raises',
      equipment: 'Свой вес',
      muscle: 'Кор',
      kind: 'core',
      day: 'День 1',
      visual: 'floor_crunch',
      markW: 0, leraW: 0, step: 2.5,
      aliases: ['lying leg raise', 'leg raises', 'подъем ног лежа', 'нижний пресс пол']
    },
    {
      key: 'russian-twist',
      name: 'Русские скручивания (косые)',
      en: 'Russian Twists',
      equipment: 'Свой вес',
      muscle: 'Кор',
      kind: 'core',
      day: 'День 1',
      visual: 'floor_crunch',
      markW: 5, leraW: 3, step: 2.5,
      aliases: ['russian twist', 'русские скручивания', 'твист пресс', 'косые на полу']
    },
    {
      key: 'superman-hold',
      name: 'Лодочка (Супермен) на поясницу',
      en: 'Superman Hold / Back Extension Floor',
      equipment: 'Свой вес',
      muscle: 'Кор',
      kind: 'core',
      metric: 'time',
      day: 'День 1',
      visual: 'plank_hold',
      markW: 0, leraW: 0, step: 10,
      aliases: ['superman', 'лодочка', 'супермен', 'поясница на полу']
    },
    {
      key: 'mountain-climber',
      name: 'Альпинист (скалолаз)',
      en: 'Mountain Climbers',
      equipment: 'Свой вес',
      muscle: 'Кор',
      kind: 'bodyweight',
      metric: 'time',
      day: 'День 1',
      visual: 'burpee_climber',
      markW: 0, leraW: 0, step: 10,
      aliases: ['mountain climber', 'climbers', 'альпинист', 'скалолаз', 'пресс кардио']
    },
    {
      key: 'burpees',
      name: 'Бёрпи',
      en: 'Burpees',
      equipment: 'Свой вес',
      muscle: 'Кардио',
      kind: 'bodyweight',
      day: 'День 1',
      visual: 'burpee_climber',
      markW: 0, leraW: 0, step: 2.5,
      aliases: ['burpee', 'burpees', 'берпи', 'бёрпи', 'бурпи', 'жиросжигание']
    },
    {
      key: 'knee-pushups',
      name: 'Отжимания с колен',
      en: 'Knee Push-Ups',
      equipment: 'Свой вес',
      muscle: 'Грудь',
      kind: 'bodyweight',
      day: 'День 1',
      visual: 'pushup_floor',
      markW: 0, leraW: 0, step: 2.5,
      aliases: ['knee push ups', 'отжимания с колен', 'легкие отжимания']
    },
    {
      key: 'bench-dips',
      name: 'Обратные отжимания от скамьи',
      en: 'Bench Tricep Dips',
      equipment: 'Свой вес',
      muscle: 'Руки',
      kind: 'bodyweight',
      day: 'День 1',
      visual: 'pushup_floor',
      markW: 0, leraW: 0, step: 2.5,
      aliases: ['bench dips', 'tricep dips', 'обратные отжимания', 'отжимания от скамьи', 'трицепс свой вес']
    },
    {
      key: 'bw-squat',
      name: 'Приседания со своим весом',
      en: 'Bodyweight Air Squats',
      equipment: 'Свой вес',
      muscle: 'Ноги',
      kind: 'bodyweight',
      day: 'День 1',
      visual: 'squat_smith',
      markW: 0, leraW: 0, step: 2.5,
      aliases: ['air squat', 'bodyweight squat', 'приседания без веса', 'приседания свой вес']
    },
    {
      key: 'bw-lunges',
      name: 'Выпады без веса',
      en: 'Bodyweight Lunges',
      equipment: 'Свой вес',
      muscle: 'Ноги',
      kind: 'bodyweight',
      day: 'День 1',
      visual: 'lunges',
      markW: 0, leraW: 0, step: 2.5,
      aliases: ['bodyweight lunges', 'выпады без веса', 'выпады свой вес']
    },
    {
      key: 'glute-bridge-floor',
      name: 'Ягодичный мостик на полу',
      en: 'Floor Glute Bridge',
      equipment: 'Свой вес',
      muscle: 'Ягодицы',
      kind: 'bodyweight',
      day: 'День 1',
      visual: 'hip_thrust',
      markW: 0, leraW: 0, step: 2.5,
      aliases: ['glute bridge', 'floor bridge', 'мостик на полу', 'ягодичный мостик пол', 'ягодицы без веса']
    },
    {
      key: 'wall-sit',
      name: 'Стульчик у стены (статика)',
      en: 'Wall Sit Hold',
      equipment: 'Свой вес',
      muscle: 'Ноги',
      kind: 'bodyweight',
      metric: 'time',
      day: 'День 1',
      visual: 'squat_smith',
      markW: 0, leraW: 0, step: 10,
      aliases: ['wall sit', 'стульчик', 'стульчик у стены', 'статика ноги']
    },

    // ==================== КАРДИО (CARDIO) ====================
    {
      key: 'treadmill',
      name: 'Беговая дорожка (ходьба в горку / бег)',
      en: 'Treadmill Incline Walk / Run',
      equipment: 'Кардио',
      muscle: 'Кардио',
      kind: 'cardio',
      metric: 'cardio',
      day: 'День 1',
      visual: 'treadmill',
      markW: 6, leraW: 5, step: 1,
      aliases: ['treadmill', 'walk', 'incline walk', 'running', 'cardio', 'дорожка', 'беговая дорожка', 'бег', 'ходьба', 'ходьба в горку', 'кардио']
    },
    {
      key: 'stairmaster',
      name: 'Лестница (Степпер / StairMaster)',
      en: 'StairMaster / Stair Climber',
      equipment: 'Кардио',
      muscle: 'Кардио',
      kind: 'cardio',
      metric: 'cardio',
      day: 'День 1',
      visual: 'stairmaster',
      markW: 7, leraW: 6, step: 1,
      aliases: ['stairmaster', 'stair climber', 'stepper', 'stairs', 'лестница', 'ступеньки', 'степпер', 'степер', 'стаирмастер', 'кардио ягодицы']
    },
    {
      key: 'stationary-bike',
      name: 'Велотренажёр',
      en: 'Stationary Bike / Spin Bike',
      equipment: 'Кардио',
      muscle: 'Кардио',
      kind: 'cardio',
      metric: 'cardio',
      day: 'День 1',
      visual: 'stationary_bike',
      markW: 7, leraW: 5, step: 1,
      aliases: ['bike', 'spin bike', 'cycling', 'stationary bike', 'велик', 'велосипед', 'велотренажер', 'вело', 'сайкл', 'кардио']
    },
    {
      key: 'elliptical',
      name: 'Эллипсоид (Орбитрек)',
      en: 'Elliptical Cross-Trainer',
      equipment: 'Кардио',
      muscle: 'Кардио',
      kind: 'cardio',
      metric: 'cardio',
      day: 'День 1',
      visual: 'elliptical',
      markW: 7, leraW: 5, step: 1,
      aliases: ['elliptical', 'cross trainer', 'orbitrek', 'эллипс', 'элипс', 'эллипсоид', 'орбитрек', 'лыжи тренажер', 'кардио']
    },
    {
      key: 'rowing-machine',
      name: 'Гребной тренажёр (Концепт)',
      en: 'Rowing Machine (Concept2)',
      equipment: 'Кардио',
      muscle: 'Кардио',
      kind: 'cardio',
      metric: 'cardio',
      day: 'День 1',
      visual: 'rowing_machine',
      markW: 6, leraW: 4, step: 1,
      aliases: ['rowing', 'rower', 'concept2', 'erg', 'гребля', 'гребной тренажер', 'концепт', 'кардио спина']
    },
    {
      key: 'airbike',
      name: 'Аэробайк (Assault AirBike)',
      en: 'Assault AirBike',
      equipment: 'Кардио',
      muscle: 'Кардио',
      kind: 'cardio',
      metric: 'cardio',
      day: 'День 1',
      visual: 'stationary_bike',
      markW: 6, leraW: 4, step: 1,
      aliases: ['airbike', 'assault bike', 'fan bike', 'аэробайк', 'аирбайк', 'эирбайк', 'велик с руками']
    },
    {
      key: 'jump-rope',
      name: 'Скакалка',
      en: 'Jump Rope',
      equipment: 'Кардио',
      muscle: 'Кардио',
      kind: 'cardio',
      metric: 'cardio',
      day: 'День 1',
      visual: 'jump_rope',
      markW: 1, leraW: 1, step: 1,
      aliases: ['jump rope', 'skipping', 'скакалка', 'прыжки на скакалке', 'кардио']
    }
  ];

  // Detailed Animated Gym Machine & Athlete Illustrations (120x88, iOS HIG Style)
  const VISUAL_SVGS = {
    // 1. Seated Chest Press / Hammer Strength Press
    chest_press_machine: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <!-- Floor & Frame -->
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <path d="M18 78V16h20v62M38 54h34M52 54v24" class="m-frame"/>
        <!-- Weight Stack (synced) -->
        <g class="anim-stack-up">
          <rect x="21" y="42" width="14" height="5" rx="1.2" class="m-plate"/>
          <rect x="21" y="48.5" width="14" height="5" rx="1.2" class="m-plate"/>
          <rect x="21" y="55" width="14" height="5" rx="1.2" class="m-plate"/>
          <rect x="21" y="61.5" width="14" height="5" rx="1.2" class="m-plate-accent"/>
        </g>
        <!-- Seat & Backrest Pads -->
        <rect x="44" y="24" width="6" height="27" rx="3" class="m-pad"/>
        <rect x="46" y="51" width="22" height="6" rx="3" class="m-pad"/>
        <!-- Seated Athlete -->
        <circle cx="56" cy="23" r="5.5" class="m-body"/>
        <path d="M54 30c-2 0-3 2-3 5v15h14l7 12v14" class="m-body-stroke"/>
        <path d="M72 76h6" class="m-shoe"/>
        <!-- Static upper arm guide + Moving Lever & Forearm -->
        <path d="M54 36h18" class="m-limb-accent" opacity="0.5"/>
        <g class="anim-row-pull">
          <path d="M62 20v24" class="m-lever"/>
          <path d="M62 36h18" class="m-limb-accent"/>
          <path d="M80 30v12" class="m-handle"/>
        </g>
        <path d="M92 33l5 3-5 3" class="m-arrow anim-arrow-r"/>
      </svg>`,

    // 2. Pec Deck / Butterfly (Front View)
    pec_deck: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="12" y1="78" x2="108" y2="78" class="m-floor"/>
        <!-- Central Machine Frame & Top Arm Beam -->
        <path d="M30 14h60M60 14v64M46 78h28" class="m-frame"/>
        <rect x="52" y="26" width="16" height="26" rx="4" class="m-pad"/>
        <rect x="47" y="54" width="26" height="6" rx="3" class="m-pad"/>
        <!-- Athlete (Front View) -->
        <circle cx="60" cy="24" r="5.5" class="m-body"/>
        <rect x="52" y="31" width="16" height="21" rx="6" class="m-body" fill-opacity="0.82"/>
        <path d="M54 56l-3 20M66 56l3 20" class="m-body-stroke"/>
        <!-- Left Butterfly Arm & Forearm -->
        <g class="anim-pec-l" style="transform-origin:34px 16px">
          <path d="M34 16v24l12 4" class="m-lever"/>
          <rect x="29" y="33" width="6" height="16" rx="3" class="m-pad-accent"/>
          <path d="M52 35l-16 6" class="m-limb-accent"/>
        </g>
        <!-- Right Butterfly Arm & Forearm -->
        <g class="anim-pec-r" style="transform-origin:86px 16px">
          <path d="M86 16v24l-12 4" class="m-lever"/>
          <rect x="85" y="33" width="6" height="16" rx="3" class="m-pad-accent"/>
          <path d="M68 35l16 6" class="m-limb-accent"/>
        </g>
        <circle cx="34" cy="16" r="3" class="m-pivot"/>
        <circle cx="86" cy="16" r="3" class="m-pivot"/>
      </svg>`,

    // 3. Cable Crossover (Dual Towers)
    cable_crossover: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="8" y1="78" x2="112" y2="78" class="m-floor"/>
        <!-- Dual Crossover Frame -->
        <path d="M16 78V12h88v66M26 78V12M94 78V12" class="m-frame"/>
        <!-- Left & Right Weight Stacks -->
        <g class="anim-stack-up">
          <rect x="18" y="48" width="6" height="16" rx="1.5" class="m-plate-accent"/>
          <rect x="96" y="48" width="6" height="16" rx="1.5" class="m-plate-accent"/>
        </g>
        <circle cx="26" cy="18" r="3" class="m-pivot"/>
        <circle cx="94" cy="18" r="3" class="m-pivot"/>
        <!-- Standing Athlete -->
        <circle cx="60" cy="28" r="5" class="m-body"/>
        <path d="M60 34v20M60 54l-7 22M60 54l7 22" class="m-body-stroke"/>
        <!-- Sweeping Cables & Arms -->
        <g class="anim-cross-l" style="transform-origin:26px 18px">
          <line x1="26" y1="18" x2="48" y2="48" class="m-cable"/>
          <circle cx="48" cy="48" r="3" fill="var(--accent)"/>
        </g>
        <g class="anim-cross-r" style="transform-origin:94px 18px">
          <line x1="94" y1="18" x2="72" y2="48" class="m-cable"/>
          <circle cx="72" cy="48" r="3" fill="var(--accent)"/>
        </g>
      </svg>`,

    // 4. Barbell / Dumbbell Bench Press
    bench_press: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <!-- Bench & Rack Uprights -->
        <path d="M26 78V32M34 78V54M84 78V54" class="m-frame"/>
        <rect x="26" y="50" width="62" height="6" rx="3" class="m-pad"/>
        <!-- Supine Athlete -->
        <circle cx="36" cy="44" r="5" class="m-body"/>
        <path d="M42 46h30l14 6v24" class="m-body-stroke"/>
        <path d="M86 76h7" class="m-shoe"/>
        <!-- Moving Barbell + Arms -->
        <g class="anim-bench-press">
          <path d="M52 46L50 28" class="m-limb-accent"/>
          <path d="M34 26h34" class="m-lever"/>
          <circle cx="51" cy="26" r="10" class="m-disc-accent"/>
          <circle cx="51" cy="26" r="3" fill="var(--card)"/>
        </g>
        <path d="M72 22l3-4 3 4" class="m-arrow anim-arrow-u"/>
      </svg>`,

    // 5. Lat Pulldown Machine
    lat_pulldown: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <!-- Tower + Overhead Boom -->
        <path d="M18 78V12h56v5M34 78V12M68 58v20M56 58h24" class="m-frame"/>
        <!-- Weight Stack (rises when bar pulls down) -->
        <g class="anim-stack-up">
          <rect x="20" y="42" width="12" height="4.5" rx="1" class="m-plate"/>
          <rect x="20" y="48" width="12" height="4.5" rx="1" class="m-plate"/>
          <rect x="20" y="54" width="12" height="4.5" rx="1" class="m-plate"/>
          <rect x="20" y="60" width="12" height="4.5" rx="1" class="m-plate-accent"/>
        </g>
        <!-- Seat & Thigh Roller -->
        <rect x="58" y="54" width="24" height="6" rx="3" class="m-pad"/>
        <circle cx="56" cy="49" r="3.5" class="m-pad"/>
        <!-- Seated Athlete -->
        <circle cx="72" cy="30" r="5" class="m-body"/>
        <path d="M72 36v18h-16l-3 22" class="m-body-stroke"/>
        <path d="M48 76h6" class="m-shoe"/>
        <!-- Overhead Pulley -->
        <circle cx="72" cy="15" r="3.2" class="m-pivot"/>
        <!-- Moving Cable + Lat Bar + Arms -->
        <g class="anim-pulldown-bar">
          <line x1="72" y1="15" x2="72" y2="27" class="m-cable"/>
          <path d="M56 30l16-4 16 4" class="m-handle"/>
          <path d="M68 41l-8-11M76 41l8-11" class="m-limb-accent"/>
        </g>
      </svg>`,

    // 6. Seated Cable Row
    cable_row: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="8" y1="78" x2="112" y2="78" class="m-floor"/>
        <!-- Cable Tower & Long Bench -->
        <path d="M16 78V14h18v64M34 62h68M94 62v16M46 62l8-14" class="m-frame"/>
        <!-- Moving Weight Stack -->
        <g class="anim-stack-up">
          <rect x="18" y="44" width="14" height="4.5" rx="1" class="m-plate"/>
          <rect x="18" y="50" width="14" height="4.5" rx="1" class="m-plate"/>
          <rect x="18" y="56" width="14" height="4.5" rx="1" class="m-plate-accent"/>
        </g>
        <!-- Bench Pad & Footplate -->
        <rect x="64" y="57" width="34" height="6" rx="3" class="m-pad"/>
        <circle cx="36" cy="48" r="3" class="m-pivot"/>
        <!-- Seated Athlete Rowing -->
        <circle cx="84" cy="29" r="5" class="m-body"/>
        <path d="M84 35l-2 21-16-4-16 2" class="m-body-stroke"/>
        <!-- Moving Cable Handle & Rowing Arm -->
        <g class="anim-row-pull">
          <line x1="36" y1="48" x2="64" y2="48" class="m-cable"/>
          <path d="M64 43v10" class="m-handle"/>
          <path d="M82 40L64 48" class="m-limb-accent"/>
        </g>
        <path d="M56 36l5 3-5 3" class="m-arrow anim-arrow-r"/>
      </svg>`,

    // 7. Hammer / Lever Row Machine (Chest-Supported)
    row_machine: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <!-- Machine Base & Chest Support Frame -->
        <path d="M22 78L46 22M38 78l16-24h24v24" class="m-frame"/>
        <rect x="46" y="26" width="7" height="22" rx="3" transform="rotate(14 49 37)" class="m-pad"/>
        <rect x="58" y="52" width="22" height="6" rx="3" class="m-pad"/>
        <!-- Athlete Leaning on Chest Pad -->
        <circle cx="58" cy="22" r="5" class="m-body"/>
        <path d="M58 28l8 24-12 24" class="m-body-stroke"/>
        <path d="M50 76h6" class="m-shoe"/>
        <!-- Plate-Loaded Lever Arm Pulling Back -->
        <g class="anim-lever-row" style="transform-origin:32px 54px">
          <path d="M32 54l12-22 24 12" class="m-lever"/>
          <circle cx="28" cy="36" r="8" class="m-disc-accent"/>
          <circle cx="28" cy="36" r="2.5" fill="var(--card)"/>
          <path d="M68 40v9" class="m-handle"/>
          <path d="M60 34l8 10" class="m-limb-accent"/>
        </g>
        <circle cx="32" cy="54" r="3" class="m-pivot"/>
      </svg>`,

    // 8. Pull-Up / Assisted Gravitron Machine
    pullup_gravitron: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <!-- Gravitron Tower & Top Pull-Up Bar -->
        <path d="M22 78V12h16v66M38 12h52v66" class="m-frame"/>
        <path d="M48 12h32" class="m-handle"/>
        <!-- Weight Stack -->
        <g class="anim-stack-down">
          <rect x="24" y="42" width="12" height="4.5" rx="1" class="m-plate"/>
          <rect x="24" y="48" width="12" height="4.5" rx="1" class="m-plate"/>
          <rect x="24" y="54" width="12" height="4.5" rx="1" class="m-plate-accent"/>
        </g>
        <!-- Rising Athlete + Knee Pad -->
        <g class="anim-pullup-body">
          <rect x="52" y="56" width="24" height="5" rx="2.5" class="m-pad-accent"/>
          <circle cx="64" cy="26" r="5" class="m-body"/>
          <path d="M64 32v22" class="m-body-stroke"/>
          <path d="M64 35l-12-16M64 35l12-16" class="m-limb-accent"/>
        </g>
      </svg>`,

    // 9. 45° Leg Press Machine
    leg_press: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="8" y1="78" x2="112" y2="78" class="m-floor"/>
        <!-- Iconic 45° Frame & Rails -->
        <path d="M18 78h84M38 76L98 16M50 76L104 22" class="m-frame"/>
        <!-- Angled Backrest & Seat -->
        <path d="M18 46l18 22h14" class="m-pad-stroke"/>
        <!-- Reclined Athlete -->
        <circle cx="24" cy="40" r="5" class="m-body"/>
        <path d="M28 45l14 17" class="m-body-stroke"/>
        <!-- Moving Footplate Sled + Weight Plates + Pushing Legs -->
        <g class="anim-legpress-sled">
          <path d="M42 62l16-14 14-8" class="m-limb-accent"/>
          <path d="M68 28l18 18" class="m-handle"/>
          <circle cx="84" cy="30" r="9.5" class="m-disc-accent"/>
          <circle cx="84" cy="30" r="3" fill="var(--card)"/>
        </g>
        <path d="M94 14l5-2-2 5" class="m-arrow anim-arrow-diag"/>
      </svg>`,

    // 10. Hack Squat Machine
    hack_squat: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <!-- Heavy 45° Hack Frame & Angled Footplate -->
        <path d="M26 78L76 12M36 78L84 15M26 78h60" class="m-frame"/>
        <path d="M22 76l20-12" class="m-pad-stroke"/>
        <!-- Sliding Back Sled + Shoulder Pads + Athlete -->
        <g class="anim-hack-sled">
          <rect x="52" y="24" width="9" height="24" rx="3.5" transform="rotate(37 56 36)" class="m-pad-accent"/>
          <circle cx="67" cy="24" r="5" class="m-body"/>
          <path d="M62 30l-12 16-8 18" class="m-limb-accent"/>
          <circle cx="48" cy="34" r="8" class="m-disc-accent"/>
          <circle cx="48" cy="34" r="2.5" fill="var(--card)"/>
        </g>
      </svg>`,

    // 11. Seated Leg Extension Machine
    leg_extension: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <!-- Rear Weight Tower + Seat Frame -->
        <path d="M18 78V20h16v58M34 56h38M64 56v22" class="m-frame"/>
        <g class="anim-stack-up">
          <rect x="20" y="46" width="12" height="4.5" rx="1" class="m-plate"/>
          <rect x="20" y="52" width="12" height="4.5" rx="1" class="m-plate"/>
          <rect x="20" y="58" width="12" height="4.5" rx="1" class="m-plate-accent"/>
        </g>
        <!-- Seat & Backrest -->
        <rect x="40" y="27" width="6" height="26" rx="3" class="m-pad"/>
        <rect x="44" y="52" width="26" height="6" rx="3" class="m-pad"/>
        <!-- Seated Athlete -->
        <circle cx="52" cy="24" r="5" class="m-body"/>
        <path d="M50 30v21h22" class="m-body-stroke"/>
        <!-- Pivoting Shin + Roller Pad Extending Straight -->
        <circle cx="72" cy="52" r="3.2" class="m-pivot"/>
        <g class="anim-leg-ext" style="transform-origin:72px 52px">
          <path d="M72 52v22" class="m-limb-accent"/>
          <circle cx="76" cy="70" r="4.5" class="m-pad-accent"/>
          <path d="M72 74h7" class="m-shoe"/>
        </g>
      </svg>`,

    // 12. Lying Leg Curl Machine
    leg_curl: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <!-- Angled Leg Curl Bench Frame -->
        <path d="M22 78V54l44-8 10 32" class="m-frame"/>
        <path d="M22 52l44-7" class="m-pad-stroke"/>
        <!-- Prone Athlete (Face Down) -->
        <circle cx="26" cy="42" r="5" class="m-body"/>
        <path d="M32 45l42-6" class="m-body-stroke"/>
        <!-- Pivoting Lower Leg + Ankle Roller Curling Up -->
        <circle cx="74" cy="39" r="3.2" class="m-pivot"/>
        <g class="anim-leg-curl" style="transform-origin:74px 39px">
          <path d="M74 39l24 2" class="m-limb-accent"/>
          <circle cx="94" cy="36" r="4.5" class="m-pad-accent"/>
        </g>
      </svg>`,

    // 13. Hip Thrust / Glute Bridge Machine
    hip_thrust: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="8" y1="78" x2="112" y2="78" class="m-floor"/>
        <!-- Back Bench Support -->
        <rect x="18" y="42" width="18" height="36" rx="4" class="m-pad"/>
        <path d="M18 78V44h18v34" class="m-frame"/>
        <!-- Grounded Shin & Foot -->
        <path d="M84 46v30" class="m-body-stroke"/>
        <path d="M84 76h10" class="m-shoe"/>
        <!-- Thrusting Athlete Torso + Hips + Barbell/Belt -->
        <g class="anim-hip-thrust" style="transform-origin:34px 44px">
          <circle cx="30" cy="35" r="5" class="m-body"/>
          <path d="M35 44l28 8 21-6" class="m-limb-accent"/>
          <circle cx="63" cy="50" r="9.5" class="m-disc-accent"/>
          <circle cx="63" cy="50" r="3" fill="var(--card)"/>
        </g>
        <path d="M60 28l3-4 3 4" class="m-arrow anim-arrow-u"/>
      </svg>`,

    // 14. Seated Hip Abduction / Adduction Machine (Top-Front View)
    abduction: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="12" y1="78" x2="108" y2="78" class="m-floor"/>
        <!-- Machine Seat & Rear Stack -->
        <rect x="48" y="10" width="24" height="14" rx="3" class="m-plate"/>
        <rect x="46" y="28" width="28" height="16" rx="5" class="m-pad"/>
        <!-- Athlete Hips Seated -->
        <circle cx="60" cy="24" r="5" class="m-body"/>
        <rect x="51" y="31" width="18" height="12" rx="5" class="m-body" fill-opacity="0.8"/>
        <!-- Left Opening Thigh & Pad -->
        <g class="anim-abd-open-l" style="transform-origin:54px 41px">
          <path d="M54 41L36 68" class="m-limb-accent"/>
          <rect x="30" y="54" width="7" height="16" rx="3" transform="rotate(32 33 62)" class="m-pad-accent"/>
        </g>
        <!-- Right Opening Thigh & Pad -->
        <g class="anim-abd-open-r" style="transform-origin:66px 41px">
          <path d="M66 41L84 68" class="m-limb-accent"/>
          <rect x="83" y="54" width="7" height="16" rx="3" transform="rotate(-32 86 62)" class="m-pad-accent"/>
        </g>
        <path d="M22 60l-4 3 4 3M98 60l4 3-4 3" class="m-arrow"/>
      </svg>`,

    // 15. Smith Machine / Barbell Squat
    squat_smith: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="8" y1="78" x2="112" y2="78" class="m-floor"/>
        <!-- Smith Machine Twin Rails -->
        <path d="M26 78V10h68v68M32 78V10M88 78V10" class="m-frame"/>
        <!-- Squatting Athlete + Guided Barbell -->
        <g class="anim-squat-drop">
          <path d="M18 30h84" class="m-lever"/>
          <rect x="19" y="21" width="6" height="18" rx="2" class="m-plate-accent"/>
          <rect x="95" y="21" width="6" height="18" rx="2" class="m-plate-accent"/>
          <circle cx="60" cy="22" r="5" class="m-body"/>
          <path d="M60 28v18" class="m-body-stroke"/>
          <path d="M50 30h20" class="m-limb-accent"/>
          <path d="M60 46l-10 14 2 16M60 46l10 14-2 16" class="m-body-stroke"/>
        </g>
      </svg>`,

    // 16. Deadlift / Romanian Deadlift (RDL)
    deadlift_rdl: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <!-- Standing Lower Legs -->
        <path d="M50 76l4-24" class="m-body-stroke"/>
        <path d="M46 76h10" class="m-shoe"/>
        <!-- Hinging Torso + Arms + Barbell -->
        <g class="anim-rdl-hinge" style="transform-origin:54px 52px">
          <path d="M54 52l14-24" class="m-body-stroke"/>
          <circle cx="72" cy="22" r="5" class="m-body"/>
          <path d="M66 32l4 26" class="m-limb-accent"/>
          <circle cx="70" cy="60" r="10.5" class="m-disc-accent"/>
          <circle cx="70" cy="60" r="3" fill="var(--card)"/>
        </g>
        <circle cx="54" cy="52" r="2.8" class="m-pivot"/>
      </svg>`,

    // 17. Bulgarian Split Squat / Lunges
    lunges: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="8" y1="78" x2="112" y2="78" class="m-floor"/>
        <!-- Rear Bench -->
        <rect x="16" y="54" width="22" height="6" rx="3" class="m-pad"/>
        <path d="M20 60v18M34 60v18" class="m-frame"/>
        <!-- Lunge Athlete with Dumbbells -->
        <g class="anim-squat-drop">
          <circle cx="62" cy="20" r="5" class="m-body"/>
          <path d="M62 26v22" class="m-body-stroke"/>
          <path d="M62 48l16 8v20" class="m-limb-accent"/>
          <path d="M62 48l-16 14-14-6" class="m-body-stroke"/>
          <!-- Dumbbell in hand -->
          <path d="M62 32v18" class="m-body-stroke"/>
          <rect x="57" y="49" width="10" height="5" rx="2" class="m-plate-accent"/>
        </g>
        <path d="M76 76h8" class="m-shoe"/>
      </svg>`,

    // 18. Standing / Seated Calf Raise Machine
    calf_raise: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <!-- Machine Upright & Calf Block -->
        <path d="M24 78V16h26M24 58h14" class="m-frame"/>
        <rect x="52" y="68" width="22" height="10" rx="2.5" class="m-pad"/>
        <!-- Rising Athlete + Shoulder Pads -->
        <g class="anim-calf-rise">
          <rect x="50" y="24" width="16" height="6" rx="3" class="m-pad-accent"/>
          <path d="M36 27h14" class="m-lever"/>
          <circle cx="60" cy="18" r="5" class="m-body"/>
          <path d="M60 28v38" class="m-body-stroke"/>
          <path d="M56 67l10 4" class="m-limb-accent"/>
        </g>
        <path d="M84 30l3-5 3 5" class="m-arrow anim-arrow-u"/>
      </svg>`,

    // 19. Seated Shoulder Press Machine
    shoulder_press: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <!-- Frame & Weight Stack -->
        <path d="M18 78V18h16v60M34 58h40M64 58v20" class="m-frame"/>
        <g class="anim-stack-up">
          <rect x="20" y="46" width="12" height="4.5" rx="1" class="m-plate"/>
          <rect x="20" y="52" width="12" height="4.5" rx="1" class="m-plate"/>
          <rect x="20" y="58" width="12" height="4.5" rx="1" class="m-plate-accent"/>
        </g>
        <rect x="44" y="30" width="6" height="26" rx="3" class="m-pad"/>
        <rect x="48" y="54" width="22" height="6" rx="3" class="m-pad"/>
        <!-- Seated Athlete -->
        <circle cx="58" cy="28" r="5" class="m-body"/>
        <path d="M56 34v20h14l4 22" class="m-body-stroke"/>
        <!-- Pressing Handles Overhead -->
        <g class="anim-ohp-press">
          <path d="M34 28h32" class="m-lever"/>
          <path d="M58 38l8-10" class="m-limb-accent"/>
          <rect x="61" y="23" width="10" height="5" rx="2.5" class="m-plate-accent"/>
        </g>
        <path d="M80 22l3-4 3 4" class="m-arrow anim-arrow-u"/>
      </svg>`,

    // 20. Lateral Raise (Dumbbells / Machine)
    lateral_raise: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="12" y1="78" x2="108" y2="78" class="m-floor"/>
        <!-- Standing Athlete Front View -->
        <circle cx="60" cy="20" r="5.5" class="m-body"/>
        <rect x="52" y="28" width="16" height="23" rx="6" class="m-body" fill-opacity="0.82"/>
        <path d="M56 52l-3 24M64 52l3 24" class="m-body-stroke"/>
        <!-- Left Arm Raising -->
        <g class="anim-lat-l" style="transform-origin:52px 32px">
          <path d="M52 32l-18 18" class="m-limb-accent"/>
          <rect x="28" y="47" width="8" height="5" rx="2" transform="rotate(-45 32 49)" class="m-plate-accent"/>
        </g>
        <!-- Right Arm Raising -->
        <g class="anim-lat-r" style="transform-origin:68px 32px">
          <path d="M68 32l18 18" class="m-limb-accent"/>
          <rect x="84" y="47" width="8" height="5" rx="2" transform="rotate(45 88 49)" class="m-plate-accent"/>
        </g>
      </svg>`,

    // 21. Preacher / Bicep Curl Machine
    bicep_curl: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <!-- Preacher Curl Bench Frame -->
        <path d="M26 78h66M42 78V54M72 78V44" class="m-frame"/>
        <rect x="30" y="52" width="22" height="6" rx="3" class="m-pad"/>
        <path d="M62 34l18 16" class="m-pad-stroke"/>
        <!-- Seated Athlete with Upper Arm Locked on Pad -->
        <circle cx="48" cy="24" r="5" class="m-body"/>
        <path d="M48 30l-4 22 14 10v14" class="m-body-stroke"/>
        <path d="M52 34l18 14" class="m-body-stroke"/>
        <!-- Pivoting Forearm + Weight Handle Curling Up -->
        <circle cx="70" cy="48" r="3" class="m-pivot"/>
        <g class="anim-bicep-curl" style="transform-origin:70px 48px">
          <path d="M70 48l22 4" class="m-limb-accent"/>
          <circle cx="92" cy="52" r="6.5" class="m-disc-accent"/>
          <circle cx="92" cy="52" r="2" fill="var(--card)"/>
        </g>
      </svg>`,

    // 22. Cable Tricep Pushdown
    tricep_pushdown: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <!-- High Pulley Cable Tower -->
        <path d="M20 78V12h34M36 78V12" class="m-frame"/>
        <g class="anim-stack-up">
          <rect x="22" y="44" width="12" height="4.5" rx="1" class="m-plate"/>
          <rect x="22" y="50" width="12" height="4.5" rx="1" class="m-plate"/>
          <rect x="22" y="56" width="12" height="4.5" rx="1" class="m-plate-accent"/>
        </g>
        <circle cx="52" cy="14" r="3" class="m-pivot"/>
        <!-- Standing Athlete Facing Tower -->
        <circle cx="76" cy="24" r="5" class="m-body"/>
        <path d="M76 30v24l-4 22M76 54l6 22" class="m-body-stroke"/>
        <path d="M76 34l-4 12" class="m-body-stroke"/>
        <!-- Pivoting Forearm Pressing Cable Down -->
        <circle cx="72" cy="46" r="2.8" class="m-pivot"/>
        <g class="anim-tricep-push" style="transform-origin:72px 46px">
          <path d="M72 46l-20-6" class="m-limb-accent"/>
          <circle cx="52" cy="40" r="3.5" fill="var(--accent)"/>
        </g>
        <line x1="52" y1="14" x2="52" y2="60" class="m-cable"/>
        <path d="M44 50l3 5 3-5" class="m-arrow anim-arrow-d"/>
      </svg>`,

    // 23. 45° Hyperextension (Roman Chair)
    hyperextension: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <!-- Iconic 45° Roman Chair -->
        <path d="M22 78h68M30 78l32-34M56 50v28" class="m-frame"/>
        <circle cx="32" cy="68" r="4" class="m-pad"/>
        <rect x="54" y="38" width="14" height="6" rx="3" transform="rotate(-40 61 41)" class="m-pad"/>
        <!-- Locked Legs -->
        <path d="M34 69l28-26" class="m-body-stroke"/>
        <!-- Hinging Torso Extending Straight -->
        <circle cx="62" cy="43" r="3" class="m-pivot"/>
        <g class="anim-hyper-ext" style="transform-origin:62px 43px">
          <path d="M62 43l24-18" class="m-limb-accent"/>
          <circle cx="90" cy="22" r="5" class="m-body"/>
        </g>
      </svg>`,

    // 24. Seated Ab Crunch Machine
    abs_crunch: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <!-- Crunch Machine Frame & Weight Stack -->
        <path d="M18 78V18h16v60M34 58h44M62 58v20" class="m-frame"/>
        <g class="anim-stack-up">
          <rect x="20" y="46" width="12" height="4.5" rx="1" class="m-plate"/>
          <rect x="20" y="52" width="12" height="4.5" rx="1" class="m-plate"/>
          <rect x="20" y="58" width="12" height="4.5" rx="1" class="m-plate-accent"/>
        </g>
        <rect x="46" y="54" width="24" height="6" rx="3" class="m-pad"/>
        <!-- Seated Lower Body -->
        <path d="M56 54h16l4 22" class="m-body-stroke"/>
        <path d="M74 76h7" class="m-shoe"/>
        <!-- Curling Upper Body + Crunch Pad -->
        <circle cx="56" cy="54" r="3" class="m-pivot"/>
        <g class="anim-ab-crunch" style="transform-origin:56px 54px">
          <path d="M56 54V28" class="m-limb-accent"/>
          <circle cx="56" cy="21" r="5" class="m-body"/>
          <path d="M56 32h12" class="m-handle"/>
          <rect x="47" y="29" width="6" height="12" rx="3" class="m-pad-accent"/>
        </g>
      </svg>`,

    // 25. Treadmill (Incline Walk / Run)
    treadmill: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="8" y1="78" x2="112" y2="78" class="m-floor"/>
        <!-- Treadmill Incline Deck & Console -->
        <path d="M22 72l68-10M86 62l10-34M86 28h14" class="m-frame"/>
        <path d="M20 74l72-10" class="m-pad-stroke"/>
        <line x1="26" y1="73" x2="88" y2="64" class="m-cable anim-belt-move"/>
        <!-- Running / Walking Athlete -->
        <g class="anim-cardio-bob">
          <circle cx="58" cy="22" r="5" class="m-body"/>
          <path d="M57 28l-3 18" class="m-body-stroke"/>
          <path d="M56 32l12 8M56 32l-10 8" class="m-body-stroke"/>
          <g class="anim-stride-a" style="transform-origin:54px 46px">
            <path d="M54 46l12 10-2 10" class="m-limb-accent"/>
          </g>
          <g class="anim-stride-b" style="transform-origin:54px 46px">
            <path d="M54 46l-12 10-4 8" class="m-body-stroke"/>
          </g>
        </g>
      </svg>`,

    // 26. StairMaster / Revolving Stairs
    stairmaster: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <!-- StairMaster Body & Side Rails -->
        <path d="M26 78V54l44-34h20v58M78 20V12h14" class="m-frame"/>
        <!-- Moving Revolving Steps -->
        <g class="anim-steps-down">
          <path d="M32 66h12v-8h12v-8h12v-8h12" class="m-handle"/>
        </g>
        <!-- Climbing Athlete -->
        <g class="anim-cardio-bob">
          <circle cx="54" cy="18" r="5" class="m-body"/>
          <path d="M54 24l-2 18" class="m-body-stroke"/>
          <path d="M54 28l18-2" class="m-body-stroke"/>
          <g class="anim-stride-a" style="transform-origin:52px 42px">
            <path d="M52 42l12 4-2 10" class="m-limb-accent"/>
          </g>
          <g class="anim-stride-b" style="transform-origin:52px 42px">
            <path d="M52 42l-10 12-2 10" class="m-body-stroke"/>
          </g>
        </g>
      </svg>`,

    // 27. Stationary Bike / Spin Bike / AirBike
    stationary_bike: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <!-- Bike Frame, Saddle & Handlebar -->
        <path d="M26 78h66M42 78l14-24 22 24M44 50l-6-10M78 56l6-28h-10" class="m-frame"/>
        <rect x="31" y="38" width="14" height="5" rx="2.5" class="m-pad"/>
        <!-- Front Spinning Flywheel -->
        <circle cx="80" cy="62" r="13" class="m-disc-accent"/>
        <g class="anim-wheel-spin" style="transform-origin:80px 62px">
          <line x1="80" y1="51" x2="80" y2="73" class="m-handle"/>
          <line x1="69" y1="62" x2="91" y2="62" class="m-handle"/>
        </g>
        <!-- Cyclist Athlete -->
        <circle cx="56" cy="20" r="5" class="m-body"/>
        <path d="M53 26l-10 14M53 28l22 2" class="m-body-stroke"/>
        <g class="anim-pedal-crank" style="transform-origin:56px 56px">
          <path d="M43 40l14 14-4 12" class="m-limb-accent"/>
          <circle cx="56" cy="56" r="3" class="m-pivot"/>
        </g>
      </svg>`,

    // 28. Elliptical Cross-Trainer
    elliptical: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="10" y1="78" x2="110" y2="78" class="m-floor"/>
        <!-- Elliptical Base & Flywheel -->
        <path d="M22 76h74M78 76V24h10" class="m-frame"/>
        <circle cx="34" cy="64" r="10" class="m-disc-accent"/>
        <!-- Moving Arm Poles -->
        <g class="anim-ellip-pole" style="transform-origin:78px 34px">
          <path d="M78 24l-8 44" class="m-handle"/>
        </g>
        <!-- Striding Athlete -->
        <g class="anim-cardio-bob">
          <circle cx="56" cy="18" r="5" class="m-body"/>
          <path d="M56 24v22" class="m-body-stroke"/>
          <path d="M56 30l18 4" class="m-limb-accent"/>
          <g class="anim-stride-a" style="transform-origin:56px 46px">
            <path d="M56 46l12 16" class="m-limb-accent"/>
          </g>
          <g class="anim-stride-b" style="transform-origin:56px 46px">
            <path d="M56 46l-14 16" class="m-body-stroke"/>
          </g>
        </g>
      </svg>`,

    // 29. Rowing Machine (Concept2)
    rowing_machine: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="8" y1="78" x2="112" y2="78" class="m-floor"/>
        <!-- Rower Rail & Fan Flywheel -->
        <path d="M28 64h74M98 64v14M32 64l-8 14" class="m-frame"/>
        <circle cx="26" cy="50" r="12" class="m-disc-accent"/>
        <circle cx="26" cy="50" r="3" fill="var(--card)"/>
        <line x1="36" y1="48" x2="72" y2="48" class="m-cable"/>
        <!-- Sliding Seat + Rowing Athlete -->
        <g class="anim-row-pull">
          <rect x="64" y="58" width="16" height="5" rx="2.5" class="m-pad"/>
          <circle cx="76" cy="28" r="5" class="m-body"/>
          <path d="M75 34l-3 22-18-8-12 12" class="m-body-stroke"/>
          <path d="M73 39L54 48" class="m-limb-accent"/>
          <path d="M54 44v8" class="m-handle"/>
        </g>
      </svg>`,

    // 30. Jump Rope
    jump_rope: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="12" y1="78" x2="108" y2="78" class="m-floor"/>
        <!-- Swinging Rope Arc -->
        <g class="anim-rope-swing" style="transform-origin:60px 44px">
          <path d="M36 46C36 8 84 8 84 46" class="m-cable"/>
          <path d="M36 46C36 82 84 82 84 46" class="m-cable" opacity="0.45"/>
        </g>
        <!-- Jumping Athlete -->
        <g class="anim-jump-hop">
          <circle cx="60" cy="24" r="5" class="m-body"/>
          <path d="M60 30v22M60 52l-6 18M60 52l6 18" class="m-body-stroke"/>
          <path d="M60 34l-16 10M60 34l16 10" class="m-limb-accent"/>
        </g>
      </svg>`,

    // 31. Forearm Plank / Static Hold
    plank_hold: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="8" y1="78" x2="112" y2="78" class="m-floor"/>
        <rect x="14" y="72" width="92" height="5" rx="2.5" class="m-pad"/>
        <!-- Forearm Plank Athlete -->
        <g class="anim-plank-breathe">
          <circle cx="28" cy="48" r="5" class="m-body"/>
          <path d="M34 52l56 12" class="m-limb-accent"/>
          <path d="M36 53l-4 17h12" class="m-body-stroke"/>
          <path d="M90 64l6 8" class="m-shoe"/>
        </g>
        <!-- Core activation pulse -->
        <circle cx="58" cy="57" r="6" class="m-disc-accent anim-core-pulse"/>
      </svg>`,

    // 32. Floor Ab Crunches / Leg Raises
    floor_crunch: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="8" y1="78" x2="112" y2="78" class="m-floor"/>
        <rect x="14" y="72" width="92" height="5" rx="2.5" class="m-pad"/>
        <!-- Bent Legs on Mat -->
        <path d="M58 68l18-18 14 20" class="m-body-stroke"/>
        <path d="M88 70h8" class="m-shoe"/>
        <!-- Curling Torso on Mat -->
        <circle cx="58" cy="68" r="2.8" class="m-pivot"/>
        <g class="anim-floor-crunch" style="transform-origin:58px 68px">
          <path d="M58 68L30 60" class="m-limb-accent"/>
          <circle cx="24" cy="56" r="5" class="m-body"/>
        </g>
      </svg>`,

    // 33. Floor Push-Ups / Dips
    pushup_floor: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="8" y1="78" x2="112" y2="78" class="m-floor"/>
        <rect x="14" y="72" width="92" height="5" rx="2.5" class="m-pad"/>
        <!-- Planted Hands & Feet -->
        <circle cx="34" cy="70" r="2.5" fill="var(--accent)"/>
        <path d="M92 70h6" class="m-shoe"/>
        <!-- Pressing Torso Pivot at Toes -->
        <g class="anim-pushup-press" style="transform-origin:94px 70px">
          <path d="M94 70L34 46" class="m-limb-accent"/>
          <circle cx="26" cy="42" r="5" class="m-body"/>
          <path d="M36 48l-2 22" class="m-body-stroke"/>
        </g>
      </svg>`,

    // 34. Mountain Climbers / Burpees
    burpee_climber: `
      <svg viewBox="0 0 120 88" fill="none" class="ex-svg">
        <line x1="8" y1="78" x2="112" y2="78" class="m-floor"/>
        <rect x="14" y="72" width="92" height="5" rx="2.5" class="m-pad"/>
        <!-- Upper Plank Base -->
        <circle cx="28" cy="38" r="5" class="m-body"/>
        <path d="M34 43l34 10M36 45l-4 25" class="m-body-stroke"/>
        <!-- Alternating Driving Knees -->
        <g class="anim-climber-a" style="transform-origin:68px 53px">
          <path d="M68 53l-16 6 4 11" class="m-limb-accent"/>
        </g>
        <g class="anim-climber-b" style="transform-origin:68px 53px">
          <path d="M68 53l24 17" class="m-body-stroke"/>
        </g>
      </svg>`
  };

  const ISOLATION_KEYS = new Set([
    'pec-deck', 'cable-crossover', 'cable-crossover-low', 'db-fly',
    'straight-arm-pulldown', 'shrugs',
    'leg-extension', 'leg-curl-lying', 'leg-curl-seated', 'hip-adduction',
    'calf-raise-standing', 'calf-raise-seated',
    'hip-abduction', 'glute-kickback-machine', 'cable-kickback',
    'lateral-raise-machine', 'reverse-pec-deck', 'face-pull', 'db-lateral-raise', 'cable-lateral-raise',
    'bicep-curl-machine', 'db-bicep-curl', 'hammer-curls', 'ez-bar-curl', 'cable-bicep-curl',
    'tricep-pushdown-rope', 'tricep-overhead-cable', 'tricep-dip-machine', 'skullcrusher'
  ]);

  const CORE_KEYS = new Set([
    'hyperextension', 'back-extension-machine',
    'ab-crunch-machine', 'cable-crunch', 'hanging-leg-raise', 'torso-rotation',
    'plank', 'side-plank', 'floor-crunch', 'bicycle-crunch', 'lying-leg-raise', 'russian-twist', 'superman-hold'
  ]);

  const CARDIO_KEYS = new Set([
    'treadmill', 'stairmaster', 'stationary-bike', 'elliptical', 'rowing-machine', 'airbike', 'jump-rope'
  ]);

  const BODYWEIGHT_KEYS = new Set([
    'pushups', 'knee-pushups', 'dips-chest', 'pullups', 'bench-dips',
    'bw-squat', 'bw-lunges', 'glute-bridge-floor', 'wall-sit', 'burpees', 'mountain-climber'
  ]);

  const TIME_METRIC_KEYS = new Set([
    'plank', 'side-plank', 'superman-hold', 'mountain-climber', 'wall-sit'
  ]);

  function getExerciseKind(ex) {
    if (!ex) return 'base';
    if (['base', 'isolation', 'core', 'bodyweight', 'cardio'].includes(ex.kind)) return ex.kind;
    if (ex.key && CARDIO_KEYS.has(ex.key)) return 'cardio';
    if (ex.equipment === 'Кардио' || ex.muscle === 'Кардио') return 'cardio';
    if (ex.key && CORE_KEYS.has(ex.key)) return 'core';
    if (ex.key && BODYWEIGHT_KEYS.has(ex.key)) return 'bodyweight';
    if (ex.key && ISOLATION_KEYS.has(ex.key)) return 'isolation';
    if (ex.muscle === 'Кор') return 'core';
    if (ex.equipment === 'Свой вес') return 'bodyweight';
    if (ex.muscle === 'Руки') return 'isolation';
    const n = normalizeText(ex.name);
    if (/дорожк|лестниц|степпер|велик|вело|эллипс|гребн|скакалк|кардио/.test(n)) return 'cardio';
    if (/планк|скручиван|пресс|лодочк|альпинист/.test(n)) return 'core';
    if (/сведен|разведен|мах|сгибан|разгибан|икр|отведен|кикбэк|пуловер|шраг|бабочк|кроссовер|фейс/.test(n)) {
      return 'isolation';
    }
    return 'base';
  }

  function getExerciseMetric(ex) {
    if (!ex) return 'weight';
    if (ex.metric === 'cardio' || ex.metric === 'time' || ex.metric === 'weight') return ex.metric;
    if (getExerciseKind(ex) === 'cardio') return 'cardio';
    if (ex.key && TIME_METRIC_KEYS.has(ex.key)) return 'time';
    const n = normalizeText(ex.name);
    if (/планк|стульчик|лодочк|статика|\(сек\)/.test(n)) return 'time';
    return 'weight';
  }

  function getKindLabel(kind) {
    if (kind === 'cardio') return 'Кардио';
    if (kind === 'bodyweight') return 'Свой вес';
    if (kind === 'isolation') return 'Изоляция';
    if (kind === 'core') return 'Кор';
    return 'Крупная мышца';
  }

  function getKindFullLabel(kind) {
    if (kind === 'cardio') return 'Кардио (выносливость и расход калорий)';
    if (kind === 'bodyweight') return 'Собственный вес (функциональное)';
    if (kind === 'isolation') return 'Изоляция (точечная проработка)';
    if (kind === 'core') return 'Кор и пресс';
    return 'Базовое (крупная мышца)';
  }

  function normalizeText(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Precompute normalized search haystack & tokens for instant ranked search
  const INDEXED_LIBRARY = EXERCISES_LIBRARY.map((ex) => {
    const kind = getExerciseKind(ex);
    const metric = getExerciseMetric(ex);
    const kindLabel = getKindLabel(kind);
    const normName = normalizeText(ex.name);
    const normEn = normalizeText(ex.en);
    const normAliases = (ex.aliases || []).map(normalizeText);
    const searchBlob = normalizeText([
      ex.name,
      ex.en,
      ex.equipment,
      ex.muscle,
      kindLabel,
      kind === 'base' ? 'база базовое' : '',
      ex.day,
      ...(ex.aliases || [])
    ].join(' '));
    const searchWords = searchBlob.split(' ');
    return { ...ex, kind, metric, _normName: normName, _normEn: normEn, _normAliases: normAliases, _search: searchBlob, _words: searchWords };
  });

  function scoreMatch(ex, normQuery, tokens) {
    let score = 0;
    if (ex._normName === normQuery || ex._normEn === normQuery) score += 200;
    if (ex._normAliases.includes(normQuery)) score += 150;
    if (ex._normName.startsWith(normQuery) || ex._normEn.startsWith(normQuery)) score += 60;

    for (const tok of tokens) {
      if (ex._normAliases.includes(tok)) score += 80;
      if (ex._words.includes(tok)) score += 45;
      else if (ex._words.some((w) => w.startsWith(tok))) score += 25;
      else score += 5;
    }
    return score;
  }

  function searchLibrary(query, muscleFilter = 'Все') {
    const normQuery = normalizeText(query);
    const tokens = normQuery ? normQuery.split(' ') : [];

    const matched = INDEXED_LIBRARY.filter((ex) => {
      if (muscleFilter && muscleFilter !== 'Все' && ex.muscle !== muscleFilter) {
        return false;
      }
      if (!tokens.length) return true;
      return tokens.every((tok) => ex._search.includes(tok));
    });

    if (!tokens.length) return matched;
    return matched
      .map((ex) => ({ ex, score: scoreMatch(ex, normQuery, tokens) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.ex);
  }

  function getVisualSvg(visualKey) {
    return VISUAL_SVGS[visualKey] || VISUAL_SVGS.chest_press_machine;
  }

  function findLibraryMatch(name) {
    const norm = normalizeText(name);
    if (!norm) return null;
    return INDEXED_LIBRARY.find((ex) => normalizeText(ex.name) === norm)
      || INDEXED_LIBRARY.find((ex) => ex._search.includes(norm))
      || null;
  }

  window.GYM_DB = {
    EXERCISES_LIBRARY: INDEXED_LIBRARY,
    VISUAL_SVGS,
    searchLibrary,
    getVisualSvg,
    findLibraryMatch,
    getExerciseKind,
    getExerciseMetric,
    getKindLabel,
    getKindFullLabel,
    normalizeText
  };
})();

