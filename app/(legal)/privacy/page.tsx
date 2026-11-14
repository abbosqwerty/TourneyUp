import type { Metadata } from 'next'
import { formatDateLong } from '@/lib/time'
import { getI18n } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n()
  return {
    title: dict.legal.privacy.meta_title,
    description: dict.legal.privacy.meta_description,
  }
}

const UPDATED = '2026-11-14'
const TEAM = ['Abbos Azizmurod Qurbonov', 'Asadbek To‘lqinjonov', 'Sardorbek Jumayev', 'Abdulloh Kozimov']

const extra = {
  uz: {
    operatorTitle: 'Operator va TourneyUp jamoasi',
    operator: 'TourneyUp hozircha mustaqil jamoaviy startup loyihasi. Shaxsga doir ma’lumotlarni boshqarish, platforma xavfsizligi va foydalanuvchilar murojaatlariga javob berish TourneyUp jamoasining umumiy mas’uliyati hisoblanadi.',
    providersTitle: 'Xizmat ko‘rsatuvchi uchinchi tomonlar',
    providers: 'Platforma Google OAuth (Google orqali kirish), Resend (xizmat xatlari), Vercel (sayt infratuzilmasi) va TiDB Cloud (ma’lumotlar bazasi) xizmatlaridan foydalanadi. Ushbu provayderlar xizmatni ko‘rsatish uchun zarur texnik ma’lumotlarni qayta ishlashi mumkin; ayrim ma’lumotlar O‘zbekistondan tashqarida texnik qayta ishlanishi mumkin.',
    minorsTitle: 'Voyaga yetmaganlar',
    minors: 'TourneyUp’da umumiy yosh cheklovi mavjud emas. Voyaga yetmagan foydalanuvchilar ham platformadan foydalanishi va yosh cheklovi belgilanmagan turnirlarda qatnashishi mumkin. Ayrim turnirlarda tashkilotchi minimal yoki maksimal yosh talabini belgilashi mumkin; bunday talab turnir sahifasida ko‘rsatilishi va unga rioya qilinishi kerak. Qonuniy vakil privacy@tourneyup.uz orqali voyaga yetmagan foydalanuvchining ma’lumotlari bo‘yicha murojaat qilishi mumkin.',
  },
  ru: {
    operatorTitle: 'Оператор и команда TourneyUp',
    operator: 'TourneyUp пока является независимым командным стартапом. Команда TourneyUp совместно отвечает за обработку персональных данных, безопасность платформы и обращения пользователей.',
    providersTitle: 'Сторонние поставщики услуг',
    providers: 'Платформа использует Google OAuth, Resend, Vercel и TiDB Cloud. Эти поставщики могут обрабатывать технические данные, необходимые для оказания услуг; часть данных может технически обрабатываться за пределами Узбекистана.',
    minorsTitle: 'Несовершеннолетние',
    minors: 'На TourneyUp нет общего возрастного ограничения. Несовершеннолетние также могут пользоваться платформой и участвовать в турнирах без возрастных ограничений. Организатор может установить минимальный или максимальный возраст для отдельного турнира; такое требование указывается на странице турнира и должно соблюдаться. Законный представитель может обратиться по вопросам данных несовершеннолетнего по адресу privacy@tourneyup.uz.',
  },
  en: {
    operatorTitle: 'Operator and the TourneyUp team',
    operator: 'TourneyUp currently operates as an independent team startup. The TourneyUp team is jointly responsible for personal-data handling, platform security and user requests.',
    providersTitle: 'Third-party service providers',
    providers: 'The platform uses Google OAuth, Resend, Vercel and TiDB Cloud. These providers may process technical data necessary to provide their services; some data may be technically processed outside Uzbekistan.',
    minorsTitle: 'Minors',
    minors: 'TourneyUp has no platform-wide age restriction. Minors may use the platform and enter tournaments that have no age restriction. An organizer may set a minimum or maximum age for a specific tournament; that requirement must be shown on the tournament page and followed. A legal guardian may contact privacy@tourneyup.uz about a minor’s data.',
  },
} as const

/** `backticked` fragments of a translation render as <code>. */
function withCode(text: string) {
  return text.split('`').map((part, index) => (index % 2 ? <code key={index}>{part}</code> : part))
}

function Item({ label, text }: { label: string; text: string }) {
  return (
    <li>
      <strong>{label}</strong> {text}
    </li>
  )
}

export default async function PrivacyPage() {
  const { dict, locale } = await getI18n()
  const t = dict.legal.privacy
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

      <h2>{x.operatorTitle}</h2>
      <p>{x.operator}</p>
      <ul>{TEAM.map((name) => <li key={name}>{name}</li>)}</ul>

      <h2>{t.collect_title}</h2>
      <ul>
        <Item {...t.collect.account} />
        <Item {...t.collect.activity} />
        <Item {...t.collect.session} />
        <Item {...t.collect.uploads} />
      </ul>

      <h2>{t.use_title}</h2>
      <ul>
        <li>{t.use.account}</li>
        <li>{t.use.registration}</li>
        <li>{t.use.notifications}</li>
        <li>{t.use.abuse}</li>
      </ul>
      <p>{t.no_ads}</p>

      <h2>{x.providersTitle}</h2>
      <p>{x.providers}</p>

      <h2>{t.visibility_title}</h2>
      <ul>
        <Item {...t.visibility.public} />
        <Item {...t.visibility.organizer} />
        <Item {...t.visibility.nobody} />
      </ul>

      <h2>{t.cookie_title}</h2>
      <p>{withCode(t.cookie)}</p>

      <h2>{t.retention_title}</h2>
      <ul>
        <li>{t.retention.account}</li>
        <li>{t.retention.session}</li>
        <li>{t.retention.history}</li>
      </ul>

      <h2>{t.rights_title}</h2>
      <ul>
        <Item {...t.rights.edit} />
        <Item {...t.rights.delete} />
        <Item {...t.rights.export} />
      </ul>

      <h2>{t.security_title}</h2>
      <p>{withCode(t.security)}</p>

      <h2>{x.minorsTitle}</h2>
      <p>{x.minors}</p>

      <h2>{t.contact_title}</h2>
      <p>
        {t.contact} <a className="underline" href="mailto:privacy@tourneyup.uz">privacy@tourneyup.uz</a>
      </p>

    </>
  )
}
