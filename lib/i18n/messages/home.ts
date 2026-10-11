import { defineMessages } from '../define'

/** Russian plural: 1 турнир / 2 турнира / 5 турниров. */
function ru(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

/** Landing page. */
export const home = defineMessages({
  uz: {
    hero: {
      eyebrow: 'O‘yna · bellash · g‘alaba qozon',
      title_top: 'Turnirlarda',
      title_bottom: 'o‘zingizni sinang.',
      subtitle: 'Shahringizdagi turnirlarni topish, har bir o‘yinni kuzatish va jamoangizni birlashtirish uchun oddiy joy.',
      explore: 'Turnirlarni ko‘rish',
      create: 'Turnir yaratish',
    },
    panel: {
      label: 'Hammasi bir joyda',
      step1_title: 'Bir necha daqiqada yarating',
      step1_detail: 'O‘yin, jadval, ishtirokchilar soni va qoidalarni belgilang.',
      step2_title: 'O‘yinchilarni xabardor qiling',
      step2_detail: 'Ro‘yxatdan o‘tish va yangiliklarni chalkashliksiz ulashing.',
      step3_title: 'Har bir bosqichni kuzating',
      step3_detail: 'Turnir to‘rini har bir o‘yinchi va muxlis uchun tushunarli qiling.',
      link: 'Turnirlarni ko‘rish',
    },
    stats: {
      players: (_n: number) => 'reytingdagi o‘yinchilar',
      tournaments: (_n: number) => 'turnirlar',
      entries: (_n: number) => 'ishtirok arizalari',
    },
    featured: {
      eyebrow: 'Turnirlar lentasida',
      title: 'Tanlangan turnirlar',
      view_all: 'Barcha turnirlar',
      prize_pool: 'Mukofot jamg‘armasi',
      players: (count: number, max: number) => `${count} / ${max} o‘yinchi`,
      view_details: 'Batafsil',
    },
    toolkit: {
      eyebrow: 'Raqobatni sevuvchilar uchun',
      title: 'Turnir uchun kerakli hamma narsa.',
      discover_title: 'Kashf qiling',
      discover_desc: 'Shahringizda o‘yiningiz, vaqtingiz va darajangizga mos turnirlarni toping.',
      join_title: 'Qo‘shiling',
      join_desc: 'Tezda ro‘yxatdan o‘ting va turnirning barcha tafsilotlarini bir joyda saqlang.',
      follow_title: 'Kuzating',
      follow_desc: 'Turnir to‘ri qanday o‘zgarayotganini ko‘ring va keyin nima bo‘lishini aniq biling.',
    },
    cta: {
      title: 'Keyingi o‘yiningiz sizni kutmoqda.',
      button: 'Boshlash',
    },
  },
  ru: {
    hero: {
      eyebrow: 'Играй · соревнуйся · побеждай',
      title_top: 'Новый турнир',
      title_bottom: 'уже ждёт.',
      subtitle: 'Простое место, чтобы находить турниры в своём городе, следить за каждым матчем и объединять своё сообщество.',
      explore: 'Смотреть турниры',
      create: 'Создать турнир',
    },
    panel: {
      label: 'Всё в одном месте',
      step1_title: 'Создайте за пару минут',
      step1_detail: 'Укажите игру, расписание, число участников и правила.',
      step2_title: 'Держите игроков в курсе',
      step2_detail: 'Регистрация и новости — без лишней путаницы.',
      step3_title: 'Следите за каждым раундом',
      step3_detail: 'Сделайте сетку понятной для каждого игрока и болельщика.',
      link: 'Смотреть турниры',
    },
    stats: {
      players: (n: number) => ru(n, 'игрок в рейтинге', 'игрока в рейтинге', 'игроков в рейтинге'),
      tournaments: (n: number) => ru(n, 'турнир', 'турнира', 'турниров'),
      entries: (n: number) => ru(n, 'заявка на участие', 'заявки на участие', 'заявок на участие'),
    },
    featured: {
      eyebrow: 'В ленте турниров',
      title: 'Избранные турниры',
      view_all: 'Все турниры',
      prize_pool: 'Призовой фонд',
      players: (count: number, max: number) => `Участники: ${count} / ${max}`,
      view_details: 'Подробнее',
    },
    toolkit: {
      eyebrow: 'Для тех, кто любит соревноваться',
      title: 'Всё необходимое для турнира.',
      discover_title: 'Находите',
      discover_desc: 'Ищите турниры в своём городе под свою игру, расписание и уровень.',
      join_title: 'Участвуйте',
      join_desc: 'Быстро регистрируйтесь и держите все детали турнира в одном месте.',
      follow_title: 'Следите',
      follow_desc: 'Смотрите, как меняется сетка, и всегда знайте, что будет дальше.',
    },
    cta: {
      title: 'Ваша следующая игра уже ждёт.',
      button: 'Начать',
    },
  },
  en: {
    hero: {
      eyebrow: 'Play · compete · win',
      title_top: 'Play in your',
      title_bottom: 'next bracket.',
      subtitle: 'A simple place to discover local tournaments, follow every match, and bring your community together.',
      explore: 'Explore events',
      create: 'Create a tourney',
    },
    panel: {
      label: 'One place to run it all',
      step1_title: 'Create in minutes',
      step1_detail: 'Set the game, schedule, capacity and rules.',
      step2_title: 'Keep players moving',
      step2_detail: 'Share registrations and updates without the mess.',
      step3_title: 'Follow every round',
      step3_detail: 'Make the bracket clear for every player and fan.',
      link: 'Explore tournaments',
    },
    stats: {
      players: (n: number) => (n === 1 ? 'ranked player' : 'ranked players'),
      tournaments: (n: number) => (n === 1 ? 'live tournament' : 'live tournaments'),
      entries: (n: number) => (n === 1 ? 'match entry' : 'match entries'),
    },
    featured: {
      eyebrow: 'Live in tournament feed',
      title: 'Featured Events',
      view_all: 'View all tournaments',
      prize_pool: 'Prize pool',
      players: (count: number, max: number) => `${count} / ${max} players`,
      view_details: 'View Details',
    },
    toolkit: {
      eyebrow: 'Made for the competitive',
      title: 'The essential tournament toolkit.',
      discover_title: 'Discover',
      discover_desc: 'Find events that match your game, schedule and skill in your city.',
      join_title: 'Join',
      join_desc: 'Register quickly, then keep every tournament detail in one place.',
      follow_title: 'Follow',
      follow_desc: 'Watch the bracket move and know exactly what happens next.',
    },
    cta: {
      title: 'Your next game is waiting.',
      button: 'Get started',
    },
  },
})
