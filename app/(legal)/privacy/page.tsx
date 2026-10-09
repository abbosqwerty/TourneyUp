import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Maxfiylik siyosati',
  description: 'TourneyUp qanday ma‘lumot yig‘adi, nima uchun ishlatadi va qancha saqlaydi.',
}

const UPDATED = '2026-10-09'

export default function PrivacyPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Maxfiylik siyosati</h1>
        <p className="text-sm">
          Oxirgi yangilanish:{' '}
          <time dateTime={UPDATED}>
            {new Date(UPDATED).toLocaleDateString('uz-UZ', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </time>
        </p>
      </header>

      <p>
        TourneyUp — universitet va shahar turnirlarini e‘lon qilish, ularga ro‘yxatdan o‘tish va
        natijalarni kuzatish uchun platforma. Quyida platforma qanday ma‘lumot yig‘ishi va u bilan
        nima qilishi yozilgan.
      </p>

      <h2>Qanday ma‘lumot yig‘amiz</h2>
      <ul>
        <li>
          <strong>Akkaunt ma‘lumotlari:</strong> ism, username, email, parol (faqat kriptografik
          hash shaklida — ochiq parol hech qachon saqlanmaydi), ixtiyoriy ravishda universitet,
          shahar, bio va avatar.
        </li>
        <li>
          <strong>Faoliyat:</strong> qaysi turnirlarga yozilganingiz, saqlagan turnirlaringiz,
          kanal obunalari, kanalga yozgan xabarlaringiz, stories va o‘yin natijalaringiz.
        </li>
        <li>
          <strong>Seans ma‘lumotlari:</strong> seans tokeni (cookie), oxirgi kirish vaqti va
          brauzer qatori (user agent) — ruxsatsiz kirishni aniqlash uchun.
        </li>
        <li>
          <strong>Yuklangan fayllar:</strong> turnir posteri, avatar va kanal rasmlari.
        </li>
      </ul>

      <h2>Nima uchun ishlatamiz</h2>
      <ul>
        <li>Akkauntingizni yuritish va tizimga kirishingizni ta‘minlash.</li>
        <li>Turnirga yozilish, tasdiqlash va rad etish oqimini ishlatish.</li>
        <li>Sizga tegishli bildirishnomalarni yuborish (ariza holati, turnir statusi).</li>
        <li>Platformani suiiste‘moldan himoya qilish — urinishlar sonini cheklash.</li>
      </ul>
      <p>
        Ma‘lumotlaringizni reklama maqsadida ishlatmaymiz va uchinchi tomonlarga sotmaymiz.
      </p>

      <h2>Kim ko‘radi</h2>
      <ul>
        <li>
          <strong>Ommaviy:</strong> ism, username, avatar, bio, universitet, shahar, reyting va
          turnir natijalari — profil sahifasida ko‘rinadi.
        </li>
        <li>
          <strong>Tashkilotchi:</strong> siz yozilgan turnir tashkilotchisi ismingiz, emailingiz va
          jamoa nomingizni ko‘radi — arizani ko‘rib chiqish uchun.
        </li>
        <li>
          <strong>Hech kim:</strong> parolingiz (faqat hash saqlanadi) va seans tokeningiz.
        </li>
      </ul>

      <h2>Cookie</h2>
      <p>
        Platforma faqat bitta zarur cookie ishlatadi: <code>tu_session</code> — seans tokeni. U{' '}
        <code>httpOnly</code>, <code>sameSite=lax</code> va productionda <code>secure</code>{' '}
        bo‘ladi, ya‘ni JavaScript orqali o‘qilmaydi. Tahlil yoki reklama cookie‘lari yo‘q.
      </p>

      <h2>Qancha saqlanadi</h2>
      <ul>
        <li>Akkaunt ma‘lumotlari — siz o‘chirmaguningizcha.</li>
        <li>Seans — chiqib ketganingizda yoki parol almashtirilganda bekor qilinadi.</li>
        <li>Turnir tarixiga oid yozuvlar — turnir yakunlangandan keyin ham arxiv sifatida qoladi.</li>
      </ul>

      <h2>Sizning huquqlaringiz</h2>
      <ul>
        <li>
          <strong>Tahrirlash:</strong> Sozlamalar → Profilni tahrirlash orqali ism, username, bio,
          universitet, shahar va avatarni o‘zgartirasiz.
        </li>
        <li>
          <strong>O‘chirish:</strong> Sozlamalar → Akkauntni o‘chirish. Akkaunt o‘chganda
          ro‘yxatlaringiz, saqlanganlar, kanal obunalari, stories va bildirishnomalar ham o‘chadi.
        </li>
        <li>
          <strong>Nusxa olish:</strong> ma‘lumotlaringiz nusxasini olish uchun quyidagi manzilga
          yozing.
        </li>
      </ul>

      <h2>Xavfsizlik</h2>
      <p>
        Parollar <code>scrypt</code> bilan hashlanadi, seanslar bazada saqlanadi va bekor qilinishi
        mumkin, barcha sahifalar Content-Security-Policy, HSTS va <code>X-Frame-Options</code>{' '}
        header‘lari bilan beriladi.
      </p>

      <h2>Bog‘lanish</h2>
      <p>
        Savol yoki so‘rov bo‘lsa: <a className="underline" href="mailto:privacy@tourneyup.uz">privacy@tourneyup.uz</a>
      </p>

      <p className="rounded-md border border-warning/40 bg-warning/5 p-3 text-xs">
        Eslatma: bu matn platforma amaldagi ishlashini tavsiflaydi. Yuridik kuchga ega hujjat
        sifatida ishlatishdan oldin huquqshunos bilan tekshirib chiqing.
      </p>
    </>
  )
}
