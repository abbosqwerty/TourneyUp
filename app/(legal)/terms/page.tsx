import type { Metadata } from 'next'
import { formatDateLong } from '@/lib/time'
import { getI18n } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n()
  return {
    title: dict.legal.terms.meta_title,
    description: dict.legal.terms.meta_description,
  }
}

const UPDATED = '2026-11-14'
const TEAM = ['Abbos Azizmurod Qurbonov', 'Asadbek To‘lqinjonov', 'Sardorbek Jumayev', 'Abdulloh Kozimov']

const extra = {
  uz: {
    teamTitle: 'TourneyUp jamoasi',
    team: 'TourneyUp hozircha mustaqil jamoaviy startup loyihasi sifatida quyidagi jamoa tomonidan ishlab chiqiladi va boshqariladi:',
    consentTitle: 'Shartlarga rozilik',
    consent: 'Oddiy yoki Google registratsiyasini yakunlashdan oldin foydalanuvchi Foydalanish shartlari va Maxfiylik siyosatini alohida tasdiqlaydi. Majburiy rozilik berilmasa, akkaunt yaratilmaydi. Qabul qilingan sana va hujjat versiyasi xavfsizlik va rozilik dalili sifatida saqlanadi.',
    lawTitle: 'Qo‘llaniladigan qonunchilik',
    law: 'Ushbu shartlar O‘zbekiston Respublikasi qonunchiligiga muvofiq talqin qilinadi. Nizolar avval muzokara va qo‘llab-quvvatlash xizmati orqali hal qilinadi; kelishuvga erishilmasa, qonunchilikda belgilangan tartib qo‘llaniladi.',
  },
  ru: {
    teamTitle: 'Команда TourneyUp', team: 'TourneyUp пока является независимым командным стартапом, который разрабатывают и поддерживают:',
    consentTitle: 'Согласие с условиями', consent: 'Перед завершением обычной регистрации или регистрации через Google пользователь отдельно принимает Условия использования и Политику конфиденциальности. Без обязательного согласия аккаунт не создаётся. Дата и версия документов сохраняются как подтверждение согласия.',
    lawTitle: 'Применимое право', law: 'Условия толкуются согласно законодательству Республики Узбекистан. Споры сначала разрешаются путём переговоров и через службу поддержки, а затем — в установленном законом порядке.',
  },
  en: {
    teamTitle: 'The TourneyUp team', team: 'TourneyUp currently operates as an independent team startup developed and managed by:',
    consentTitle: 'Acceptance', consent: 'Before completing password or Google registration, the user separately accepts the Terms of Service and Privacy Policy. No account is created without mandatory consent. The acceptance date and document versions are retained as evidence of consent.',
    lawTitle: 'Governing law', law: 'These terms are interpreted under the laws of the Republic of Uzbekistan. Disputes are first addressed through negotiation and support, then under the procedure established by law.',
  },
} as const

export default async function TermsPage() {
  const { dict, locale } = await getI18n()
  const t = dict.legal.terms
  const x = extra[locale]

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="text-sm">
          {dict.legal.updated}{' '}
          <time dateTime={UPDATED}>
            {formatDateLong(UPDATED, locale)}
          </time>
        </p>
      </header>

      <p>{t.intro}</p>

      <h2>{x.teamTitle}</h2>
      <p>{x.team}</p>
      <ul>{TEAM.map((name) => <li key={name}>{name}</li>)}</ul>

      <h2>{x.consentTitle}</h2>
      <p>{x.consent}</p>

      <h2>{t.account_title}</h2>
      <ul>
        <li>{t.account.one}</li>
        <li>{t.account.password}</li>
        <li>{t.account.organization}</li>
      </ul>

      <h2>{t.tournaments_title}</h2>
      <ul>
        <li>{t.tournaments.responsibility}</li>
        <li>{t.tournaments.approval}</li>
        <li>{t.tournaments.disputes}</li>
      </ul>

      <h2>{t.prohibited_title}</h2>
      <ul>
        <li>{t.prohibited.impersonation}</li>
        <li>{t.prohibited.abusive}</li>
        <li>{t.prohibited.automation}</li>
        <li>{t.prohibited.copyright}</li>
      </ul>
      <p>{t.enforcement}</p>

      <h2>{t.content_title}</h2>
      <p>{t.content}</p>

      <h2>{t.liability_title}</h2>
      <p>{t.liability}</p>

      <h2>{t.changes_title}</h2>
      <p>{t.changes}</p>

      <h2>{x.lawTitle}</h2>
      <p>{x.law}</p>

      <h2>{t.contact_title}</h2>
      <p>
        <a className="underline" href="mailto:support@tourneyup.uz">support@tourneyup.uz</a>
      </p>

    </>
  )
}
