import { defineMessages } from '../define'

/*
 * Notifications and channel system posts are written by the site, so they
 * follow the reader's language: new rows store a template key + params (see
 * `lib/stored-text.ts`) and are rendered with the templates below. Names
 * inside params (teams, tournaments, users, ticket subjects, message
 * excerpts) are user content and are inserted exactly as written.
 */

type Team = { team: string }
type UserTeam = { user: string; team: string }
type Tournament = { tournament: string }
type TournamentStatus = { tournament: string; status: string }
type Registered = { name: string; tournament: string }
type TeamTournament = { team: string; tournament: string }
type Staff = { tournament: string; role: string }
type Subject = { subject: string }
type TournamentSubject = { tournament: string; subject: string }
type Reply = { subject: string; excerpt: string }
type Announcement = { channel: string; excerpt: string }
type MatchResult = { home: string; away: string; score: string; tournament: string }
type RoundResult = { tournament: string; round: number }
type Match = { home: string; away: string }
type Forfeit = { home: string; away: string; absent: string; tournament: string }
type Points = { points: number; tournament: string }

/** "1 очко" / "2 очка" / "5 очков" */
function ruPlural(n: number, one: string, few: string, many: string) {
  const mod10 = Math.abs(n) % 10
  const mod100 = Math.abs(n) % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export const notify = defineMessages({
  uz: {
    title: 'Bildirishnomalar',
    bell_label: (n: number) => (n > 0 ? `Bildirishnomalar (${n} o‘qilmagan)` : 'Bildirishnomalar'),
    unread_count: (n: number) => `${n} ta o‘qilmagan`,
    all_read: 'Hammasi o‘qilgan',
    mark_all: 'Hammasini o‘qildi',
    read: 'O‘qilgan',
    unread: 'O‘qilmagan',
    loading: 'Yuklanmoqda...',
    empty: 'Hozircha bildirishnoma yo‘q',
    empty_page: 'Hozircha bildirishnoma yo‘q. Turnirga yozilganingizda yoki arizangiz ko‘rib chiqilganda shu yerda ko‘rinadi.',
    view_all: 'Barchasini ko‘rish',
    load_failed: 'Bildirishnomalarni yuklab bo‘lmadi.',
    errors: {
      mark_failed: 'Bildirishnomani belgilashda xatolik',
      mark_all_failed: 'Bildirishnomalarni belgilashda xatolik',
      load_failed: 'Bildirishnomalarni yuklab bo‘lmadi',
    },
    templates: {
      team_invite: {
        title: (_: UserTeam) => 'Jamoaga taklif',
        body: (p: UserTeam) => `${p.user} sizni “${p.team}” jamoasiga taklif qildi.`,
      },
      team_invite_accepted: {
        title: (_: UserTeam) => 'Taklif qabul qilindi',
        body: (p: UserTeam) => `${p.user} “${p.team}” jamoasiga qo‘shildi.`,
      },
      team_removed: {
        title: (_: Team) => 'Jamoadan chiqarildingiz',
        body: (p: Team) => `Siz “${p.team}” jamoasidan chiqarildingiz.`,
      },
      team_ownership: {
        title: (_: UserTeam) => 'Siz jamoa egasisiz',
        body: (p: UserTeam) => `${p.user} “${p.team}” jamoasi egaligini sizga o‘tkazdi.`,
      },
      tournament_status: {
        title: (p: TournamentStatus) => `${p.tournament} statusi o‘zgardi`,
        body: (p: TournamentStatus) => `Yangi status: ${p.status}.`,
      },
      tournament_started: {
        title: (p: Tournament) => `${p.tournament} statusi o‘zgardi`,
        body: (_: Tournament) => 'Turnir boshlandi — qur’a tashlandi, o‘yinlar jadvali tayyor.',
      },
      participant_registered: {
        title: (_: Registered) => 'Yangi ro‘yxatdan o‘tish',
        body: (p: Registered) => `${p.name} “${p.tournament}” turniriga yozildi.`,
      },
      team_registered: {
        title: (_: TeamTournament) => 'Jamoangiz turnirga yozildi',
        body: (p: TeamTournament) => `“${p.team}” “${p.tournament}” turniriga ro‘yxatdan o‘tdi — siz tarkibdasiz.`,
      },
      participant_approved: {
        title: (_: Tournament) => 'Arizangiz tasdiqlandi',
        body: (p: Tournament) => `“${p.tournament}” turniri uchun arizangiz tasdiqlandi.`,
      },
      participant_rejected: {
        title: (_: Tournament) => 'Arizangiz rad etildi',
        body: (p: Tournament) => `“${p.tournament}” turniri uchun arizangiz rad etildi.`,
      },
      staff_assigned: {
        title: (_: Staff) => 'Sizga turnir roli berildi',
        body: (p: Staff) => `“${p.tournament}” turnirida ${p.role} rolini oldingiz.`,
      },
      support_new_ticket: {
        title: (_: Subject) => 'Yangi murojaat',
        body: (p: Subject) => p.subject,
      },
      support_new_ticket_tournament: {
        title: (p: TournamentSubject) => `Yangi murojaat: ${p.tournament}`,
        body: (p: TournamentSubject) => p.subject,
      },
      support_staff_reply: {
        title: (_: Reply) => 'Supportdan javob',
        body: (p: Reply) => `${p.subject}: ${p.excerpt}`,
      },
      support_user_reply: {
        title: (_: Reply) => 'Murojaatga yangi xabar',
        body: (p: Reply) => `${p.subject}: ${p.excerpt}`,
      },
      channel_announcement: {
        title: (p: Announcement) => `E’lon: ${p.channel}`,
        body: (p: Announcement) => p.excerpt,
      },
      match_result: {
        title: (_: MatchResult) => 'O‘yin natijasi kiritildi',
        body: (p: MatchResult) => `${p.home} — ${p.away}: ${p.score}. “${p.tournament}”.`,
      },
      match_result_corrected: {
        title: (_: MatchResult) => 'O‘yin natijasi tuzatildi',
        body: (p: MatchResult) => `${p.home} — ${p.away}: ${p.score}. “${p.tournament}”.`,
      },
      round_result: {
        title: (_: RoundResult) => 'Natijangiz kiritildi',
        body: (p: RoundResult) => `“${p.tournament}”, ${p.round}-bosqich. Reyting jadvalida o‘rningizni ko‘ring.`,
      },
      round_result_corrected: {
        title: (_: RoundResult) => 'Natijangiz tuzatildi',
        body: (p: RoundResult) => `“${p.tournament}”, ${p.round}-bosqich. Reyting jadvalida o‘rningizni ko‘ring.`,
      },
      match_forfeit: {
        title: (_: Forfeit) => 'O‘yin natijasi kiritildi',
        body: (p: Forfeit) => `${p.home} — ${p.away}: texnik g‘alaba (${p.absent} kelmadi). “${p.tournament}”.`,
      },
      match_forfeit_corrected: {
        title: (_: Forfeit) => 'O‘yin natijasi tuzatildi',
        body: (p: Forfeit) => `${p.home} — ${p.away}: texnik g‘alaba (${p.absent} kelmadi). “${p.tournament}”.`,
      },
      match_started: {
        title: (_: Match) => 'O‘yiningiz boshlandi',
        body: (p: Match) => `${p.home} — ${p.away}`,
      },
      match_scheduled: {
        title: (_: Match) => 'O‘yin vaqti belgilandi',
        body: (p: Match) => `${p.home} — ${p.away}`,
      },
      points_awarded: {
        title: (p: Points) => `+${p.points} T`,
        body: (p: Points) => `${p.tournament ? `“${p.tournament}”` : 'Turnir'} yakunlari bo‘yicha Tourney Points.`,
      },
      points_updated: {
        title: (p: Points) => `Ballar yangilandi: ${p.points} T`,
        body: (p: Points) => `${p.tournament ? `“${p.tournament}”` : 'Turnir'} yakunlari bo‘yicha Tourney Points.`,
      },
    },
    system: {
      tournament_started: 'Turnir boshlandi — qur’a tashlandi. To‘r va o‘yinlar jadvali “Musobaqa” bo‘limida.',
      tournament_cancelled: 'Turnir bekor qilindi. Guruh arxivlandi.',
      tournament_finished: 'Turnir yakunlandi — yakuniy natijalar va Tourney Points e’lon qilindi.',
    },
  },
  ru: {
    title: 'Уведомления',
    bell_label: (n: number) => (n > 0 ? `Уведомления (непрочитанных: ${n})` : 'Уведомления'),
    unread_count: (n: number) => `${n} ${ruPlural(n, 'непрочитанное', 'непрочитанных', 'непрочитанных')}`,
    all_read: 'Всё прочитано',
    mark_all: 'Прочитать все',
    read: 'Прочитано',
    unread: 'Не прочитано',
    loading: 'Загрузка...',
    empty: 'Уведомлений пока нет',
    empty_page: 'Уведомлений пока нет. Они появятся здесь, когда вы запишетесь на турнир или вашу заявку рассмотрят.',
    view_all: 'Смотреть все',
    load_failed: 'Не удалось загрузить уведомления.',
    errors: {
      mark_failed: 'Не удалось отметить уведомление',
      mark_all_failed: 'Не удалось отметить уведомления',
      load_failed: 'Не удалось загрузить уведомления',
    },
    templates: {
      team_invite: {
        title: (_: UserTeam) => 'Приглашение в команду',
        body: (p: UserTeam) => `${p.user} приглашает вас в команду «${p.team}».`,
      },
      team_invite_accepted: {
        title: (_: UserTeam) => 'Приглашение принято',
        body: (p: UserTeam) => `${p.user} присоединился к команде «${p.team}».`,
      },
      team_removed: {
        title: (_: Team) => 'Вас исключили из команды',
        body: (p: Team) => `Вас исключили из команды «${p.team}».`,
      },
      team_ownership: {
        title: (_: UserTeam) => 'Теперь вы владелец команды',
        body: (p: UserTeam) => `${p.user} передал(а) вам владение командой «${p.team}».`,
      },
      tournament_status: {
        title: (p: TournamentStatus) => `Статус турнира «${p.tournament}» изменён`,
        body: (p: TournamentStatus) => `Новый статус: ${p.status}.`,
      },
      tournament_started: {
        title: (p: Tournament) => `Статус турнира «${p.tournament}» изменён`,
        body: (_: Tournament) => 'Турнир начался — жеребьёвка проведена, расписание матчей готово.',
      },
      participant_registered: {
        title: (_: Registered) => 'Новая регистрация',
        body: (p: Registered) => `${p.name} записался(ась) на турнир «${p.tournament}».`,
      },
      team_registered: {
        title: (_: TeamTournament) => 'Ваша команда записана на турнир',
        body: (p: TeamTournament) => `«${p.team}» зарегистрирована на турнир «${p.tournament}» — вы в составе.`,
      },
      participant_approved: {
        title: (_: Tournament) => 'Ваша заявка одобрена',
        body: (p: Tournament) => `Ваша заявка на турнир «${p.tournament}» одобрена.`,
      },
      participant_rejected: {
        title: (_: Tournament) => 'Ваша заявка отклонена',
        body: (p: Tournament) => `Ваша заявка на турнир «${p.tournament}» отклонена.`,
      },
      staff_assigned: {
        title: (_: Staff) => 'Вам назначена роль в турнире',
        body: (p: Staff) => `Вы получили роль «${p.role}» в турнире «${p.tournament}».`,
      },
      support_new_ticket: {
        title: (_: Subject) => 'Новое обращение',
        body: (p: Subject) => p.subject,
      },
      support_new_ticket_tournament: {
        title: (p: TournamentSubject) => `Новое обращение: ${p.tournament}`,
        body: (p: TournamentSubject) => p.subject,
      },
      support_staff_reply: {
        title: (_: Reply) => 'Ответ поддержки',
        body: (p: Reply) => `${p.subject}: ${p.excerpt}`,
      },
      support_user_reply: {
        title: (_: Reply) => 'Новое сообщение в обращении',
        body: (p: Reply) => `${p.subject}: ${p.excerpt}`,
      },
      channel_announcement: {
        title: (p: Announcement) => `Объявление: ${p.channel}`,
        body: (p: Announcement) => p.excerpt,
      },
      match_result: {
        title: (_: MatchResult) => 'Результат матча внесён',
        body: (p: MatchResult) => `${p.home} — ${p.away}: ${p.score}. «${p.tournament}».`,
      },
      match_result_corrected: {
        title: (_: MatchResult) => 'Результат матча исправлен',
        body: (p: MatchResult) => `${p.home} — ${p.away}: ${p.score}. «${p.tournament}».`,
      },
      round_result: {
        title: (_: RoundResult) => 'Ваш результат внесён',
        body: (p: RoundResult) => `«${p.tournament}», этап ${p.round}. Посмотрите своё место в таблице.`,
      },
      round_result_corrected: {
        title: (_: RoundResult) => 'Ваш результат исправлен',
        body: (p: RoundResult) => `«${p.tournament}», этап ${p.round}. Посмотрите своё место в таблице.`,
      },
      match_forfeit: {
        title: (_: Forfeit) => 'Результат матча внесён',
        body: (p: Forfeit) => `${p.home} — ${p.away}: техническая победа (${p.absent} не явился). «${p.tournament}».`,
      },
      match_forfeit_corrected: {
        title: (_: Forfeit) => 'Результат матча исправлен',
        body: (p: Forfeit) => `${p.home} — ${p.away}: техническая победа (${p.absent} не явился). «${p.tournament}».`,
      },
      match_started: {
        title: (_: Match) => 'Ваш матч начался',
        body: (p: Match) => `${p.home} — ${p.away}`,
      },
      match_scheduled: {
        title: (_: Match) => 'Назначено время матча',
        body: (p: Match) => `${p.home} — ${p.away}`,
      },
      points_awarded: {
        title: (p: Points) => `+${p.points} T`,
        body: (p: Points) => `Tourney Points по итогам ${p.tournament ? `турнира «${p.tournament}»` : 'турнира'}.`,
      },
      points_updated: {
        title: (p: Points) => `Очки обновлены: ${p.points} T`,
        body: (p: Points) => `Tourney Points по итогам ${p.tournament ? `турнира «${p.tournament}»` : 'турнира'}.`,
      },
    },
    system: {
      tournament_started: 'Турнир начался — жеребьёвка проведена. Сетка и расписание матчей — в разделе «Матчи».',
      tournament_cancelled: 'Турнир отменён. Группа перенесена в архив.',
      tournament_finished: 'Турнир завершён — объявлены итоговые результаты и Tourney Points.',
    },
  },
  en: {
    title: 'Notifications',
    bell_label: (n: number) => (n > 0 ? `Notifications (${n} unread)` : 'Notifications'),
    unread_count: (n: number) => `${n} unread`,
    all_read: 'All caught up',
    mark_all: 'Mark all as read',
    read: 'Read',
    unread: 'Unread',
    loading: 'Loading...',
    empty: 'No notifications yet',
    empty_page: 'No notifications yet. They’ll show up here when you sign up for a tournament or your application is reviewed.',
    view_all: 'View all',
    load_failed: 'Couldn’t load notifications.',
    errors: {
      mark_failed: 'Couldn’t mark the notification as read',
      mark_all_failed: 'Couldn’t mark notifications as read',
      load_failed: 'Couldn’t load notifications',
    },
    templates: {
      team_invite: {
        title: (_: UserTeam) => 'Team invitation',
        body: (p: UserTeam) => `${p.user} invited you to the team “${p.team}”.`,
      },
      team_invite_accepted: {
        title: (_: UserTeam) => 'Invitation accepted',
        body: (p: UserTeam) => `${p.user} joined the team “${p.team}”.`,
      },
      team_removed: {
        title: (_: Team) => 'You were removed from a team',
        body: (p: Team) => `You were removed from the team “${p.team}”.`,
      },
      team_ownership: {
        title: (_: UserTeam) => 'You now own a team',
        body: (p: UserTeam) => `${p.user} transferred ownership of “${p.team}” to you.`,
      },
      tournament_status: {
        title: (p: TournamentStatus) => `${p.tournament}: status changed`,
        body: (p: TournamentStatus) => `New status: ${p.status}.`,
      },
      tournament_started: {
        title: (p: Tournament) => `${p.tournament}: status changed`,
        body: (_: Tournament) => 'The tournament has started — the draw is done and the match schedule is ready.',
      },
      participant_registered: {
        title: (_: Registered) => 'New registration',
        body: (p: Registered) => `${p.name} signed up for “${p.tournament}”.`,
      },
      team_registered: {
        title: (_: TeamTournament) => 'Your team signed up for a tournament',
        body: (p: TeamTournament) => `“${p.team}” registered for “${p.tournament}” — you’re on the roster.`,
      },
      participant_approved: {
        title: (_: Tournament) => 'Your application was approved',
        body: (p: Tournament) => `Your application for “${p.tournament}” was approved.`,
      },
      participant_rejected: {
        title: (_: Tournament) => 'Your application was rejected',
        body: (p: Tournament) => `Your application for “${p.tournament}” was rejected.`,
      },
      staff_assigned: {
        title: (_: Staff) => 'You were given a tournament role',
        body: (p: Staff) => `You are now ${p.role} in “${p.tournament}”.`,
      },
      support_new_ticket: {
        title: (_: Subject) => 'New support request',
        body: (p: Subject) => p.subject,
      },
      support_new_ticket_tournament: {
        title: (p: TournamentSubject) => `New support request: ${p.tournament}`,
        body: (p: TournamentSubject) => p.subject,
      },
      support_staff_reply: {
        title: (_: Reply) => 'Reply from support',
        body: (p: Reply) => `${p.subject}: ${p.excerpt}`,
      },
      support_user_reply: {
        title: (_: Reply) => 'New message in a request',
        body: (p: Reply) => `${p.subject}: ${p.excerpt}`,
      },
      channel_announcement: {
        title: (p: Announcement) => `Announcement: ${p.channel}`,
        body: (p: Announcement) => p.excerpt,
      },
      match_result: {
        title: (_: MatchResult) => 'Match result entered',
        body: (p: MatchResult) => `${p.home} — ${p.away}: ${p.score}. “${p.tournament}”.`,
      },
      match_result_corrected: {
        title: (_: MatchResult) => 'Match result corrected',
        body: (p: MatchResult) => `${p.home} — ${p.away}: ${p.score}. “${p.tournament}”.`,
      },
      round_result: {
        title: (_: RoundResult) => 'Your result was entered',
        body: (p: RoundResult) => `“${p.tournament}”, round ${p.round}. Check your place in the standings.`,
      },
      round_result_corrected: {
        title: (_: RoundResult) => 'Your result was corrected',
        body: (p: RoundResult) => `“${p.tournament}”, round ${p.round}. Check your place in the standings.`,
      },
      match_forfeit: {
        title: (_: Forfeit) => 'Match result entered',
        body: (p: Forfeit) => `${p.home} — ${p.away}: win by forfeit (${p.absent} didn’t show). “${p.tournament}”.`,
      },
      match_forfeit_corrected: {
        title: (_: Forfeit) => 'Match result corrected',
        body: (p: Forfeit) => `${p.home} — ${p.away}: win by forfeit (${p.absent} didn’t show). “${p.tournament}”.`,
      },
      match_started: {
        title: (_: Match) => 'Your match has started',
        body: (p: Match) => `${p.home} — ${p.away}`,
      },
      match_scheduled: {
        title: (_: Match) => 'Match time set',
        body: (p: Match) => `${p.home} — ${p.away}`,
      },
      points_awarded: {
        title: (p: Points) => `+${p.points} T`,
        body: (p: Points) => `Tourney Points for ${p.tournament ? `“${p.tournament}”` : 'the tournament'} results.`,
      },
      points_updated: {
        title: (p: Points) => `Points updated: ${p.points} T`,
        body: (p: Points) => `Tourney Points for ${p.tournament ? `“${p.tournament}”` : 'the tournament'} results.`,
      },
    },
    system: {
      tournament_started: 'The tournament has started — the draw is done. The bracket and match schedule are in the “Matches” section.',
      tournament_cancelled: 'The tournament was cancelled. The group has been archived.',
      tournament_finished: 'The tournament is over — final results and Tourney Points have been announced.',
    },
  },
})
