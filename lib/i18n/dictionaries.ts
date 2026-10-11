import { core } from './messages/core'
import { shared } from './messages/shared'
import { home } from './messages/home'
import { chrome } from './messages/chrome'
import { account } from './messages/account'
import { tournament } from './messages/tournament'
import { create } from './messages/create'
import { dashboard } from './messages/dashboard'
import { chat } from './messages/chat'
import { notify } from './messages/notify'
import { competition } from './messages/competition'
import { team } from './messages/team'
import { admin } from './messages/admin'
import { errors } from './messages/errors'
import { legal } from './messages/legal'

/**
 * One dictionary per locale, assembled from per-area namespaces in ./messages.
 * Only the site's own text lives here — user content (chat messages, team and
 * tournament names, descriptions) is always shown exactly as written.
 */
export const dictionaries = {
  uz: { ...core.uz, ...shared.uz, home: home.uz, chrome: chrome.uz, account: account.uz, tournament: tournament.uz, create: create.uz, dashboard: dashboard.uz, chat: chat.uz, notify: notify.uz, competition: competition.uz, team: team.uz, admin: admin.uz, errors: errors.uz, legal: legal.uz },
  ru: { ...core.ru, ...shared.ru, home: home.ru, chrome: chrome.ru, account: account.ru, tournament: tournament.ru, create: create.ru, dashboard: dashboard.ru, chat: chat.ru, notify: notify.ru, competition: competition.ru, team: team.ru, admin: admin.ru, errors: errors.ru, legal: legal.ru },
  en: { ...core.en, ...shared.en, home: home.en, chrome: chrome.en, account: account.en, tournament: tournament.en, create: create.en, dashboard: dashboard.en, chat: chat.en, notify: notify.en, competition: competition.en, team: team.en, admin: admin.en, errors: errors.en, legal: legal.en },
}

export type Dictionary = typeof dictionaries.uz
