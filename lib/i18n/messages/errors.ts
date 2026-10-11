import { defineMessages } from '../define'

/** Russian plural: 1 символ / 2 символа / 5 символов. */
function ru(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

/**
 * Validation (zod) and generic server errors. Schema messages in lib/schemas.ts
 * are keys of this namespace; parametrized ones are written 'key:param'
 * (e.g. 'too_long:200') and resolved by translateError.
 */
export const errors = defineMessages({
  uz: {
    // --- generic, also used for zod's built-in checks ---
    required: 'Majburiy maydon',
    invalid_value: 'Noto‘g‘ri qiymat',
    invalid_option: 'Ro‘yxatdagi variantlardan birini tanlang',
    invalid_format: 'Format noto‘g‘ri',
    number_required: 'Son kiriting',
    integer_required: 'Butun son kiriting',
    too_short: (n: number) => `Kamida ${n} belgi`,
    too_long: (n: number) => `Ko‘pi bilan ${n} belgi`,
    min_value: (n: number) => `Kamida ${n}`,
    max_value: (n: number) => `Ko‘pi bilan ${n}`,
    too_few_items: (n: number) => `Kamida ${n} ta tanlang`,
    too_many_items: (n: number) => `Ko‘pi bilan ${n} ta`,
    value_too_large: 'Juda katta qiymat',

    // --- account ---
    username_min: 'Username kamida 3 belgi bo‘lishi kerak',
    username_format: 'Username faqat kichik harf, raqam va _ dan iborat bo‘lsin',
    password_min: 'Parol kamida 8 belgi bo‘lishi kerak',
    password_too_long: 'Parol juda uzun',
    name_min: 'Ism kamida 2 belgi',
    email_invalid: 'Email formati noto‘g‘ri',
    identifier_required: 'Email yoki username kiriting',
    password_required: 'Parolni kiriting',
    delete_confirm: (word: string) => `Tasdiqlash uchun ${word} deb yozing`,
    current_password_required: 'Hozirgi parolni kiriting',
    passwords_mismatch: 'Parollar mos kelmadi',

    // --- organizations ---
    org_name_min: 'Tashkilot nomi kamida 3 belgi',
    contact_name_required: 'Mas’ul shaxs ismini kiriting',
    org_description_min: 'Tashkilot haqida kamida 30 belgi yozing',
    reject_reason_required: 'Rad etish sababini yozing',

    // --- tournaments ---
    title_min: 'Sarlavha kamida 5 belgi',
    sport_required: 'Sport turini tanlang',
    date_format: 'Sana YYYY-MM-DD formatida bo‘lsin',
    time_required: 'Vaqtni kiriting',
    location_required: 'Manzilni kiriting',
    participants_min: 'Kamida 2 ishtirokchi',
    description_min: 'Tavsif kamida 20 belgi',
    team_size_required: 'Jamoa tarkibi sonini kiriting',
    team_size_max_below_min: 'Minimaldan kichik bo‘lmasin',
    tournament_required: 'Turnirni tanlang',

    // --- teams, staff ---
    team_name_min: 'Jamoa nomi kamida 2 belgi',
    game_required: 'O‘yin turini tanlang',
    user_query_required: 'Username yoki email kiriting',

    // --- matches ---
    score_required: 'Hisobni kiriting',
    datetime_required: 'Sana va vaqtni kiriting',

    // --- messages, support, stories ---
    message_empty: 'Xabar bo‘sh bo‘lmasin',
    subject_min: 'Mavzu kamida 4 belgi',
    ticket_content_min: 'Muammoni batafsilroq yozing (kamida 10 belgi)',
    media_required: 'Rasm yoki video yuklang',

    // --- generic server / API ---
    form_has_errors: 'Formada xatolar bor',
    login_required: 'Avval tizimga kiring',
    super_admin_only: 'Faqat super admin uchun',
    server_error: 'Serverda xatolik. Keyinroq qayta urinib ko‘ring.',
    rate_limited: (minutes: number) =>
      `Juda ko‘p urinish. ${minutes > 1 ? `${minutes} daqiqa` : 'bir daqiqa'}dan keyin qayta urinib ko‘ring.`,
    recalculate_failed: 'Qayta hisoblashda xatolik',
    upload_rate_limited: 'Juda ko‘p fayl yuklandi, keyinroq urinib ko‘ring',
    upload_read_failed: 'Faylni o‘qib bo‘lmadi',
    upload_no_file: 'Fayl tanlanmagan',
    upload_bad_type: (types: string) => `Faqat ${types} formatlari qabul qilinadi`,
    upload_too_large: (size: string) => `Fayl juda katta. Maksimal hajm — ${size}`,
    upload_not_image: 'Bu fayl rasm emas yoki buzilgan',
    upload_failed: 'Yuklashda server xatosi',
    media_not_found: 'Rasm topilmadi',
    media_fetch_failed: 'Rasmni olishda xatolik',
  },
  ru: {
    required: 'Обязательное поле',
    invalid_value: 'Недопустимое значение',
    invalid_option: 'Выберите один из вариантов',
    invalid_format: 'Неверный формат',
    number_required: 'Введите число',
    integer_required: 'Введите целое число',
    too_short: (n: number) => `Минимум ${n} ${ru(n, 'символ', 'символа', 'символов')}`,
    too_long: (n: number) => `Максимум ${n} ${ru(n, 'символ', 'символа', 'символов')}`,
    min_value: (n: number) => `Не меньше ${n}`,
    max_value: (n: number) => `Не больше ${n}`,
    too_few_items: (n: number) => `Выберите хотя бы ${n}`,
    too_many_items: (n: number) => `Не больше ${n}`,
    value_too_large: 'Слишком большое значение',

    username_min: 'Имя пользователя должно содержать не менее 3 символов',
    username_format: 'Имя пользователя может содержать только строчные латинские буквы, цифры и _',
    password_min: 'Пароль должен содержать не менее 8 символов',
    password_too_long: 'Пароль слишком длинный',
    name_min: 'Имя — минимум 2 символа',
    email_invalid: 'Неверный формат email',
    identifier_required: 'Введите email или имя пользователя',
    password_required: 'Введите пароль',
    delete_confirm: (word: string) => `Для подтверждения введите ${word}`,
    current_password_required: 'Введите текущий пароль',
    passwords_mismatch: 'Пароли не совпадают',

    org_name_min: 'Название организации — минимум 3 символа',
    contact_name_required: 'Введите имя контактного лица',
    org_description_min: 'Расскажите об организации — минимум 30 символов',
    reject_reason_required: 'Укажите причину отклонения',

    title_min: 'Название — минимум 5 символов',
    sport_required: 'Выберите вид спорта',
    date_format: 'Дата должна быть в формате ГГГГ-ММ-ДД',
    time_required: 'Укажите время',
    location_required: 'Укажите место проведения',
    participants_min: 'Минимум 2 участника',
    description_min: 'Описание — минимум 20 символов',
    team_size_required: 'Укажите размер состава команды',
    team_size_max_below_min: 'Не может быть меньше минимума',
    tournament_required: 'Выберите турнир',

    team_name_min: 'Название команды — минимум 2 символа',
    game_required: 'Выберите вид игры',
    user_query_required: 'Введите имя пользователя или email',

    score_required: 'Введите счёт',
    datetime_required: 'Укажите дату и время',

    message_empty: 'Сообщение не может быть пустым',
    subject_min: 'Тема — минимум 4 символа',
    ticket_content_min: 'Опишите проблему подробнее (минимум 10 символов)',
    media_required: 'Загрузите фото или видео',

    form_has_errors: 'В форме есть ошибки',
    login_required: 'Сначала войдите в аккаунт',
    super_admin_only: 'Только для супер-администратора',
    server_error: 'Ошибка сервера. Попробуйте позже.',
    rate_limited: (minutes: number) =>
      `Слишком много попыток. Попробуйте снова через ${minutes > 1 ? `${minutes} ${ru(minutes, 'минуту', 'минуты', 'минут')}` : 'минуту'}.`,
    recalculate_failed: 'Ошибка при пересчёте',
    upload_rate_limited: 'Загружено слишком много файлов, попробуйте позже',
    upload_read_failed: 'Не удалось прочитать файл',
    upload_no_file: 'Файл не выбран',
    upload_bad_type: (types: string) => `Принимаются только форматы ${types}`,
    upload_too_large: (size: string) => `Файл слишком большой. Максимальный размер — ${size}`,
    upload_not_image: 'Этот файл не является изображением или повреждён',
    upload_failed: 'Ошибка сервера при загрузке',
    media_not_found: 'Изображение не найдено',
    media_fetch_failed: 'Не удалось получить изображение',
  },
  en: {
    required: 'This field is required',
    invalid_value: 'Invalid value',
    invalid_option: 'Choose one of the options',
    invalid_format: 'Invalid format',
    number_required: 'Enter a number',
    integer_required: 'Enter a whole number',
    too_short: (n: number) => `At least ${n} ${n === 1 ? 'character' : 'characters'}`,
    too_long: (n: number) => `At most ${n} ${n === 1 ? 'character' : 'characters'}`,
    min_value: (n: number) => `At least ${n}`,
    max_value: (n: number) => `At most ${n}`,
    too_few_items: (n: number) => `Select at least ${n}`,
    too_many_items: (n: number) => `At most ${n}`,
    value_too_large: 'Value is too large',

    username_min: 'Username must be at least 3 characters',
    username_format: 'Username may contain only lowercase letters, digits and _',
    password_min: 'Password must be at least 8 characters',
    password_too_long: 'Password is too long',
    name_min: 'Name must be at least 2 characters',
    email_invalid: 'Invalid email format',
    identifier_required: 'Enter your email or username',
    password_required: 'Enter your password',
    delete_confirm: (word: string) => `Type ${word} to confirm`,
    current_password_required: 'Enter your current password',
    passwords_mismatch: 'Passwords do not match',

    org_name_min: 'Organization name must be at least 3 characters',
    contact_name_required: 'Enter the contact person’s name',
    org_description_min: 'Write at least 30 characters about the organization',
    reject_reason_required: 'Give a reason for the rejection',

    title_min: 'Title must be at least 5 characters',
    sport_required: 'Choose a sport',
    date_format: 'Date must be in YYYY-MM-DD format',
    time_required: 'Enter the time',
    location_required: 'Enter the location',
    participants_min: 'At least 2 participants',
    description_min: 'Description must be at least 20 characters',
    team_size_required: 'Enter the team roster size',
    team_size_max_below_min: 'Must not be less than the minimum',
    tournament_required: 'Choose a tournament',

    team_name_min: 'Team name must be at least 2 characters',
    game_required: 'Choose a game',
    user_query_required: 'Enter a username or email',

    score_required: 'Enter the score',
    datetime_required: 'Enter the date and time',

    message_empty: 'Message cannot be empty',
    subject_min: 'Subject must be at least 4 characters',
    ticket_content_min: 'Describe the problem in more detail (at least 10 characters)',
    media_required: 'Upload a photo or video',

    form_has_errors: 'The form has errors',
    login_required: 'Please sign in first',
    super_admin_only: 'Super admins only',
    server_error: 'Server error. Please try again later.',
    rate_limited: (minutes: number) =>
      `Too many attempts. Try again in ${minutes > 1 ? `${minutes} minutes` : 'a minute'}.`,
    recalculate_failed: 'Recalculation failed',
    upload_rate_limited: 'Too many files uploaded, try again later',
    upload_read_failed: 'Could not read the file',
    upload_no_file: 'No file selected',
    upload_bad_type: (types: string) => `Only ${types} files are accepted`,
    upload_too_large: (size: string) => `File is too large. Maximum size is ${size}`,
    upload_not_image: 'This file is not an image or is corrupted',
    upload_failed: 'Server error during upload',
    media_not_found: 'Image not found',
    media_fetch_failed: 'Could not load the image',
  },
})
