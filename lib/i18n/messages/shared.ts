import { defineMessages } from '../define'

/** Vocabulary used across many areas: statuses, dates, relative time. */
export const shared = defineMessages({
  uz: {
    status: {
      upcoming: 'Kutilmoqda',
      registration_open: 'Ro‘yxat ochiq',
      ongoing: 'Jonli',
      completed: 'Yakunlangan',
      cancelled: 'Bekor qilingan',
    },
    months_short: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'],
    months_long: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
    relative: {
      now: 'hozir',
      minutes: (n: number) => `${n} daq`,
      hours: (n: number) => `${n} soat`,
      days: (n: number) => `${n} kun`,
      minutes_ago: (n: number) => `${n} daqiqa oldin`,
      hours_ago: (n: number) => `${n} soat oldin`,
      days_ago: (n: number) => `${n} kun oldin`,
    },
  },
  ru: {
    status: {
      upcoming: 'Скоро',
      registration_open: 'Регистрация открыта',
      ongoing: 'Идёт',
      completed: 'Завершён',
      cancelled: 'Отменён',
    },
    months_short: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
    months_long: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
    relative: {
      now: 'сейчас',
      minutes: (n: number) => `${n} мин`,
      hours: (n: number) => `${n} ч`,
      days: (n: number) => `${n} дн`,
      minutes_ago: (n: number) => `${n} мин назад`,
      hours_ago: (n: number) => `${n} ч назад`,
      days_ago: (n: number) => `${n} дн назад`,
    },
  },
  en: {
    status: {
      upcoming: 'Upcoming',
      registration_open: 'Registration open',
      ongoing: 'Live',
      completed: 'Completed',
      cancelled: 'Cancelled',
    },
    months_short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    months_long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    relative: {
      now: 'now',
      minutes: (n: number) => `${n}m`,
      hours: (n: number) => `${n}h`,
      days: (n: number) => `${n}d`,
      minutes_ago: (n: number) => `${n} min ago`,
      hours_ago: (n: number) => `${n} h ago`,
      days_ago: (n: number) => `${n} d ago`,
    },
  },
})
