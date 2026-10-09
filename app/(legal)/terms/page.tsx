import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Foydalanish shartlari',
  description: 'TourneyUp platformasidan foydalanish qoidalari va mas‘uliyat chegaralari.',
}

const UPDATED = '2026-10-09'

export default function TermsPage() {
  return (
    <>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Foydalanish shartlari</h1>
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
        TourneyUp‘dan foydalanish orqali quyidagi shartlarga rozilik bildirasiz. Rozi bo‘lmasangiz,
        platformadan foydalanmang.
      </p>

      <h2>Akkaunt</h2>
      <ul>
        <li>Bitta shaxs uchun bitta akkaunt. Ma‘lumotlar haqiqiy bo‘lishi kerak.</li>
        <li>Parolingiz xavfsizligi sizning javobgarligingizda.</li>
        <li>
          Tashkilot akkaunti o‘z-o‘zidan ochilmaydi: ariza yuboriladi va administrator tasdiqlaydi.
        </li>
      </ul>

      <h2>Turnirlar</h2>
      <ul>
        <li>
          Turnirni e‘lon qilgan tashkilot uning mazmuni, qoidalari, mukofot jamg‘armasi va
          o‘tkazilishi uchun javobgar. TourneyUp turnirni o‘tkazuvchi tomon emas.
        </li>
        <li>
          Ro‘yxatdan o‘tish arizasi tashkilotchi tomonidan tasdiqlanadi yoki rad etiladi. Rad etish
          sababini tashkilotchi belgilaydi.
        </li>
        <li>
          To‘lov, mukofot va ishtirok shartlari bo‘yicha kelishmovchilik tashkilotchi va ishtirokchi
          o‘rtasida hal qilinadi.
        </li>
      </ul>

      <h2>Taqiqlangan xatti-harakatlar</h2>
      <ul>
        <li>Boshqa shaxs nomidan ro‘yxatdan o‘tish yoki uning nomidan xabar yozish.</li>
        <li>Haqoratli, kamsituvchi, zo‘ravonlikka undovchi yoki qonunga xilof kontent joylash.</li>
        <li>Platformani avtomatlashtirilgan vositalar bilan ortiqcha yuklash yoki himoyani chetlab o‘tish.</li>
        <li>Mualliflik huquqi buzilgan rasm yoki matn yuklash.</li>
      </ul>
      <p>
        Qoidabuzarlik aniqlanganda akkaunt to‘xtatilishi yoki o‘chirilishi mumkin.
      </p>

      <h2>Kontent huquqlari</h2>
      <p>
        Yuklagan kontentingiz sizga tegishli. Uni platformada ko‘rsatish, o‘lchamini o‘zgartirish va
        tarqatish uchun TourneyUp‘ga cheklangan, bepul litsenziya berasiz. Akkauntni o‘chirganda
        kontentingiz ham o‘chadi.
      </p>

      <h2>Mas‘uliyat chegarasi</h2>
      <p>
        Platforma «borligi holatida» taqdim etiladi. Uzluksiz ishlash, xatosiz bo‘lish yoki
        turnirlarning haqiqiyligi kafolatlanmaydi. Platformadan foydalanish natijasida kelib
        chiqqan bilvosita zararlar uchun javobgarlik qabul qilinmaydi.
      </p>

      <h2>Shartlarning o‘zgarishi</h2>
      <p>
        Shartlar o‘zgarsa, yangilanish sanasi yuqorida yangilanadi. Muhim o‘zgarishlar haqida
        platformada bildirishnoma beriladi.
      </p>

      <h2>Bog‘lanish</h2>
      <p>
        <a className="underline" href="mailto:support@tourneyup.uz">support@tourneyup.uz</a>
      </p>

      <p className="rounded-md border border-warning/40 bg-warning/5 p-3 text-xs">
        Eslatma: bu matn ishchi varianti. Yuridik kuchga ega hujjat sifatida ishlatishdan oldin
        huquqshunos bilan tekshirib chiqing.
      </p>
    </>
  )
}
