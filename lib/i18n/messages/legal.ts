import { defineMessages } from '../define'

/**
 * Privacy policy and terms of service. Text wrapped in `backticks` is
 * rendered as <code> (cookie names, header names) and is never translated.
 * List items with a bold lead-in are { label, text } pairs.
 */
export const legal = defineMessages({
  uz: {
    updated: 'Oxirgi yangilanish:',
    privacy: {
      meta_title: 'Maxfiylik siyosati',
      meta_description: 'TourneyUp qanday ma‘lumot yig‘adi, nima uchun ishlatadi va qancha saqlaydi.',
      title: 'Maxfiylik siyosati',
      intro:
        'TourneyUp — universitet va shahar turnirlarini e‘lon qilish, ularga ro‘yxatdan o‘tish va natijalarni kuzatish uchun platforma. Quyida platforma qanday ma‘lumot yig‘ishi va u bilan nima qilishi yozilgan.',
      collect_title: 'Qanday ma‘lumot yig‘amiz',
      collect: {
        account: {
          label: 'Akkaunt ma‘lumotlari:',
          text: 'ism, username, email, parol (faqat kriptografik hash shaklida — ochiq parol hech qachon saqlanmaydi), ixtiyoriy ravishda universitet, shahar, bio va avatar.',
        },
        activity: {
          label: 'Faoliyat:',
          text: 'qaysi turnirlarga yozilganingiz, saqlagan turnirlaringiz, kanal obunalari, kanalga yozgan xabarlaringiz, stories va o‘yin natijalaringiz.',
        },
        session: {
          label: 'Seans ma‘lumotlari:',
          text: 'seans tokeni (cookie), oxirgi kirish vaqti va brauzer qatori (user agent) — ruxsatsiz kirishni aniqlash uchun.',
        },
        uploads: {
          label: 'Yuklangan fayllar:',
          text: 'turnir posteri, avatar va kanal rasmlari.',
        },
      },
      use_title: 'Nima uchun ishlatamiz',
      use: {
        account: 'Akkauntingizni yuritish va tizimga kirishingizni ta‘minlash.',
        registration: 'Turnirga yozilish, tasdiqlash va rad etish oqimini ishlatish.',
        notifications: 'Sizga tegishli bildirishnomalarni yuborish (ariza holati, turnir statusi).',
        abuse: 'Platformani suiiste‘moldan himoya qilish — urinishlar sonini cheklash.',
      },
      no_ads: 'Ma‘lumotlaringizni reklama maqsadida ishlatmaymiz va uchinchi tomonlarga sotmaymiz.',
      visibility_title: 'Kim ko‘radi',
      visibility: {
        public: {
          label: 'Ommaviy:',
          text: 'ism, username, avatar, bio, universitet, shahar, reyting va turnir natijalari — profil sahifasida ko‘rinadi.',
        },
        organizer: {
          label: 'Tashkilotchi:',
          text: 'siz yozilgan turnir tashkilotchisi ismingiz, emailingiz va jamoa nomingizni ko‘radi — arizani ko‘rib chiqish uchun.',
        },
        nobody: {
          label: 'Hech kim:',
          text: 'parolingiz (faqat hash saqlanadi) va seans tokeningiz.',
        },
      },
      cookie_title: 'Cookie',
      cookie:
        'Platforma faqat bitta zarur cookie ishlatadi: `tu_session` — seans tokeni. U `httpOnly`, `sameSite=lax` va productionda `secure` bo‘ladi, ya‘ni JavaScript orqali o‘qilmaydi. Shuningdek, tanlagan tilingiz `tourneyup_lang` cookie‘sida eslab qolinadi. Tahlil yoki reklama cookie‘lari yo‘q.',
      retention_title: 'Qancha saqlanadi',
      retention: {
        account: 'Akkaunt ma‘lumotlari — siz o‘chirmaguningizcha.',
        session: 'Seans — chiqib ketganingizda yoki parol almashtirilganda bekor qilinadi.',
        history: 'Turnir tarixiga oid yozuvlar — turnir yakunlangandan keyin ham arxiv sifatida qoladi.',
      },
      rights_title: 'Sizning huquqlaringiz',
      rights: {
        edit: {
          label: 'Tahrirlash:',
          text: 'Sozlamalar → Profilni tahrirlash orqali ism, username, bio, universitet, shahar va avatarni o‘zgartirasiz.',
        },
        delete: {
          label: 'O‘chirish:',
          text: 'Sozlamalar → Akkauntni o‘chirish. Akkaunt o‘chganda ro‘yxatlaringiz, saqlanganlar, kanal obunalari, stories va bildirishnomalar ham o‘chadi.',
        },
        export: {
          label: 'Nusxa olish:',
          text: 'ma‘lumotlaringiz nusxasini olish uchun quyidagi manzilga yozing.',
        },
      },
      security_title: 'Xavfsizlik',
      security:
        'Parollar `scrypt` bilan hashlanadi, seanslar bazada saqlanadi va bekor qilinishi mumkin, barcha sahifalar Content-Security-Policy, HSTS va `X-Frame-Options` header‘lari bilan beriladi.',
      contact_title: 'Bog‘lanish',
      contact: 'Savol yoki so‘rov bo‘lsa:',
      note: 'Eslatma: bu matn platforma amaldagi ishlashini tavsiflaydi. Yuridik kuchga ega hujjat sifatida ishlatishdan oldin huquqshunos bilan tekshirib chiqing.',
    },
    terms: {
      meta_title: 'Foydalanish shartlari',
      meta_description: 'TourneyUp platformasidan foydalanish qoidalari va mas‘uliyat chegaralari.',
      title: 'Foydalanish shartlari',
      intro: 'TourneyUp‘dan foydalanish orqali quyidagi shartlarga rozilik bildirasiz. Rozi bo‘lmasangiz, platformadan foydalanmang.',
      account_title: 'Akkaunt',
      account: {
        one: 'Bitta shaxs uchun bitta akkaunt. Ma‘lumotlar haqiqiy bo‘lishi kerak.',
        password: 'Parolingiz xavfsizligi sizning javobgarligingizda.',
        organization: 'Tashkilot akkaunti o‘z-o‘zidan ochilmaydi: ariza yuboriladi va administrator tasdiqlaydi.',
      },
      tournaments_title: 'Turnirlar',
      tournaments: {
        responsibility:
          'Turnirni e‘lon qilgan tashkilot uning mazmuni, qoidalari, mukofot jamg‘armasi va o‘tkazilishi uchun javobgar. TourneyUp turnirni o‘tkazuvchi tomon emas.',
        approval:
          'Ro‘yxatdan o‘tish arizasi tashkilotchi tomonidan tasdiqlanadi yoki rad etiladi. Rad etish sababini tashkilotchi belgilaydi.',
        disputes:
          'To‘lov, mukofot va ishtirok shartlari bo‘yicha kelishmovchilik tashkilotchi va ishtirokchi o‘rtasida hal qilinadi.',
      },
      prohibited_title: 'Taqiqlangan xatti-harakatlar',
      prohibited: {
        impersonation: 'Boshqa shaxs nomidan ro‘yxatdan o‘tish yoki uning nomidan xabar yozish.',
        abusive: 'Haqoratli, kamsituvchi, zo‘ravonlikka undovchi yoki qonunga xilof kontent joylash.',
        automation: 'Platformani avtomatlashtirilgan vositalar bilan ortiqcha yuklash yoki himoyani chetlab o‘tish.',
        copyright: 'Mualliflik huquqi buzilgan rasm yoki matn yuklash.',
      },
      enforcement: 'Qoidabuzarlik aniqlanganda akkaunt to‘xtatilishi yoki o‘chirilishi mumkin.',
      content_title: 'Kontent huquqlari',
      content:
        'Yuklagan kontentingiz sizga tegishli. Uni platformada ko‘rsatish, o‘lchamini o‘zgartirish va tarqatish uchun TourneyUp‘ga cheklangan, bepul litsenziya berasiz. Akkauntni o‘chirganda kontentingiz ham o‘chadi.',
      liability_title: 'Mas‘uliyat chegarasi',
      liability:
        'Platforma «borligi holatida» taqdim etiladi. Uzluksiz ishlash, xatosiz bo‘lish yoki turnirlarning haqiqiyligi kafolatlanmaydi. Platformadan foydalanish natijasida kelib chiqqan bilvosita zararlar uchun javobgarlik qabul qilinmaydi.',
      changes_title: 'Shartlarning o‘zgarishi',
      changes:
        'Shartlar o‘zgarsa, yangilanish sanasi yuqorida yangilanadi. Muhim o‘zgarishlar haqida platformada bildirishnoma beriladi.',
      contact_title: 'Bog‘lanish',
      note: 'Eslatma: bu matn ishchi varianti. Yuridik kuchga ega hujjat sifatida ishlatishdan oldin huquqshunos bilan tekshirib chiqing.',
    },
  },
  ru: {
    updated: 'Последнее обновление:',
    privacy: {
      meta_title: 'Политика конфиденциальности',
      meta_description: 'Какие данные собирает TourneyUp, зачем их использует и как долго хранит.',
      title: 'Политика конфиденциальности',
      intro:
        'TourneyUp — платформа для публикации университетских и городских турниров, регистрации на них и отслеживания результатов. Ниже описано, какие данные собирает платформа и что она с ними делает.',
      collect_title: 'Какие данные мы собираем',
      collect: {
        account: {
          label: 'Данные аккаунта:',
          text: 'имя, username, email, пароль (только в виде криптографического хеша — пароль в открытом виде никогда не хранится), а также, по желанию, университет, город, био и аватар.',
        },
        activity: {
          label: 'Активность:',
          text: 'на какие турниры вы записались, сохранённые турниры, подписки на каналы, ваши сообщения в каналах, stories и результаты матчей.',
        },
        session: {
          label: 'Данные сеанса:',
          text: 'токен сеанса (cookie), время последнего входа и строка браузера (user agent) — чтобы выявлять несанкционированный доступ.',
        },
        uploads: {
          label: 'Загруженные файлы:',
          text: 'постеры турниров, аватары и изображения каналов.',
        },
      },
      use_title: 'Зачем мы их используем',
      use: {
        account: 'Чтобы вести ваш аккаунт и обеспечивать вход в систему.',
        registration: 'Чтобы работал процесс записи на турнир, подтверждения и отклонения заявок.',
        notifications: 'Чтобы отправлять вам уведомления, которые вас касаются (статус заявки, статус турнира).',
        abuse: 'Чтобы защищать платформу от злоупотреблений — ограничивать число попыток.',
      },
      no_ads: 'Мы не используем ваши данные в рекламных целях и не продаём их третьим лицам.',
      visibility_title: 'Кто их видит',
      visibility: {
        public: {
          label: 'Все:',
          text: 'имя, username, аватар, био, университет, город, рейтинг и результаты турниров — они видны на странице профиля.',
        },
        organizer: {
          label: 'Организатор:',
          text: 'организатор турнира, на который вы записались, видит ваше имя, email и название команды — чтобы рассмотреть заявку.',
        },
        nobody: {
          label: 'Никто:',
          text: 'ваш пароль (хранится только хеш) и токен сеанса.',
        },
      },
      cookie_title: 'Cookie',
      cookie:
        'Платформа использует только один необходимый cookie: `tu_session` — токен сеанса. Он помечен как `httpOnly`, `sameSite=lax`, а в production — `secure`, то есть его нельзя прочитать через JavaScript. Кроме того, выбранный вами язык запоминается в cookie `tourneyup_lang`. Аналитических и рекламных cookie нет.',
      retention_title: 'Как долго хранятся данные',
      retention: {
        account: 'Данные аккаунта — пока вы их не удалите.',
        session: 'Сеанс — завершается, когда вы выходите из аккаунта или меняете пароль.',
        history: 'Записи об истории турниров — остаются в архиве и после завершения турнира.',
      },
      rights_title: 'Ваши права',
      rights: {
        edit: {
          label: 'Изменение:',
          text: 'в разделе «Настройки → Редактировать профиль» можно изменить имя, username, био, университет, город и аватар.',
        },
        delete: {
          label: 'Удаление:',
          text: '«Настройки → Удалить аккаунт». При удалении аккаунта удаляются также ваши заявки, сохранённое, подписки на каналы, stories и уведомления.',
        },
        export: {
          label: 'Копия данных:',
          text: 'чтобы получить копию своих данных, напишите на адрес ниже.',
        },
      },
      security_title: 'Безопасность',
      security:
        'Пароли хешируются с помощью `scrypt`, сеансы хранятся в базе данных и могут быть отозваны, а все страницы отдаются с заголовками Content-Security-Policy, HSTS и `X-Frame-Options`.',
      contact_title: 'Связаться с нами',
      contact: 'Если у вас есть вопрос или запрос:',
      note: 'Примечание: этот текст описывает, как платформа работает на самом деле. Прежде чем использовать его как юридически значимый документ, проверьте его у юриста.',
    },
    terms: {
      meta_title: 'Условия использования',
      meta_description: 'Правила использования платформы TourneyUp и пределы ответственности.',
      title: 'Условия использования',
      intro: 'Пользуясь TourneyUp, вы соглашаетесь с приведёнными ниже условиями. Если вы не согласны, не пользуйтесь платформой.',
      account_title: 'Аккаунт',
      account: {
        one: 'Один аккаунт на одного человека. Указанные данные должны быть достоверными.',
        password: 'Вы сами отвечаете за безопасность своего пароля.',
        organization: 'Аккаунт организации не создаётся автоматически: подаётся заявка, которую одобряет администратор.',
      },
      tournaments_title: 'Турниры',
      tournaments: {
        responsibility:
          'Организация, опубликовавшая турнир, отвечает за его содержание, правила, призовой фонд и проведение. TourneyUp не является организатором турниров.',
        approval:
          'Заявку на участие одобряет или отклоняет организатор. Причину отказа определяет организатор.',
        disputes:
          'Споры об оплате, призах и условиях участия решаются между организатором и участником.',
      },
      prohibited_title: 'Запрещённые действия',
      prohibited: {
        impersonation: 'Регистрироваться от имени другого человека или писать сообщения от его имени.',
        abusive: 'Размещать оскорбительный, дискриминационный, призывающий к насилию или незаконный контент.',
        automation: 'Перегружать платформу автоматизированными средствами или обходить её защиту.',
        copyright: 'Загружать изображения или тексты с нарушением авторских прав.',
      },
      enforcement: 'При выявлении нарушений аккаунт может быть заблокирован или удалён.',
      content_title: 'Права на контент',
      content:
        'Загруженный вами контент принадлежит вам. Вы предоставляете TourneyUp ограниченную безвозмездную лицензию на его показ, изменение размера и распространение на платформе. При удалении аккаунта ваш контент также удаляется.',
      liability_title: 'Ограничение ответственности',
      liability:
        'Платформа предоставляется «как есть». Бесперебойная работа, отсутствие ошибок и достоверность турниров не гарантируются. Ответственность за косвенный ущерб, возникший в результате использования платформы, не принимается.',
      changes_title: 'Изменение условий',
      changes:
        'Если условия изменятся, дата обновления вверху страницы будет обновлена. О существенных изменениях мы сообщим уведомлением на платформе.',
      contact_title: 'Связаться с нами',
      note: 'Примечание: это рабочая версия текста. Прежде чем использовать его как юридически значимый документ, проверьте его у юриста.',
    },
  },
  en: {
    updated: 'Last updated:',
    privacy: {
      meta_title: 'Privacy Policy',
      meta_description: 'What data TourneyUp collects, why it uses it and how long it keeps it.',
      title: 'Privacy Policy',
      intro:
        'TourneyUp is a platform for announcing university and city tournaments, registering for them and following the results. Below is what data the platform collects and what it does with it.',
      collect_title: 'What we collect',
      collect: {
        account: {
          label: 'Account data:',
          text: 'name, username, email, password (only as a cryptographic hash — the plain password is never stored) and, optionally, university, city, bio and avatar.',
        },
        activity: {
          label: 'Activity:',
          text: 'which tournaments you registered for, the tournaments you saved, channel subscriptions, the messages you post in channels, stories and your match results.',
        },
        session: {
          label: 'Session data:',
          text: 'session token (cookie), last sign-in time and browser string (user agent) — to detect unauthorized access.',
        },
        uploads: {
          label: 'Uploaded files:',
          text: 'tournament posters, avatars and channel images.',
        },
      },
      use_title: 'Why we use it',
      use: {
        account: 'To run your account and let you sign in.',
        registration: 'To power the tournament registration, approval and rejection flow.',
        notifications: 'To send you notifications that concern you (application status, tournament status).',
        abuse: 'To protect the platform from abuse — by rate-limiting attempts.',
      },
      no_ads: 'We do not use your data for advertising and do not sell it to third parties.',
      visibility_title: 'Who can see it',
      visibility: {
        public: {
          label: 'Public:',
          text: 'name, username, avatar, bio, university, city, ranking and tournament results — shown on your profile page.',
        },
        organizer: {
          label: 'Organizer:',
          text: 'the organizer of a tournament you registered for sees your name, email and team name — to review your application.',
        },
        nobody: {
          label: 'Nobody:',
          text: 'your password (only a hash is stored) and your session token.',
        },
      },
      cookie_title: 'Cookies',
      cookie:
        'The platform uses only one essential cookie: `tu_session`, the session token. It is `httpOnly`, `sameSite=lax` and `secure` in production, so it cannot be read by JavaScript. Your chosen language is also remembered in the `tourneyup_lang` cookie. There are no analytics or advertising cookies.',
      retention_title: 'How long we keep it',
      retention: {
        account: 'Account data — until you delete it.',
        session: 'Sessions — revoked when you sign out or change your password.',
        history: 'Tournament history records — kept as an archive even after the tournament ends.',
      },
      rights_title: 'Your rights',
      rights: {
        edit: {
          label: 'Edit:',
          text: 'change your name, username, bio, university, city and avatar under Settings → Edit profile.',
        },
        delete: {
          label: 'Delete:',
          text: 'Settings → Delete account. Deleting your account also deletes your registrations, saved items, channel subscriptions, stories and notifications.',
        },
        export: {
          label: 'Get a copy:',
          text: 'to receive a copy of your data, write to the address below.',
        },
      },
      security_title: 'Security',
      security:
        'Passwords are hashed with `scrypt`, sessions are stored in the database and can be revoked, and every page is served with Content-Security-Policy, HSTS and `X-Frame-Options` headers.',
      contact_title: 'Contact',
      contact: 'For questions or requests:',
      note: 'Note: this text describes how the platform actually works. Have it reviewed by a lawyer before using it as a legally binding document.',
    },
    terms: {
      meta_title: 'Terms of Service',
      meta_description: 'Rules for using the TourneyUp platform and the limits of liability.',
      title: 'Terms of Service',
      intro: 'By using TourneyUp you agree to the terms below. If you do not agree, do not use the platform.',
      account_title: 'Account',
      account: {
        one: 'One account per person. Your details must be genuine.',
        password: 'You are responsible for keeping your password secure.',
        organization: 'Organization accounts are not opened automatically: you submit an application and an administrator approves it.',
      },
      tournaments_title: 'Tournaments',
      tournaments: {
        responsibility:
          'The organization that announces a tournament is responsible for its content, rules, prize pool and how it is run. TourneyUp does not run tournaments.',
        approval:
          'Registration applications are approved or rejected by the organizer. The organizer decides the reason for a rejection.',
        disputes:
          'Disputes about payments, prizes and participation terms are settled between the organizer and the participant.',
      },
      prohibited_title: 'Prohibited conduct',
      prohibited: {
        impersonation: 'Registering as another person or posting messages on their behalf.',
        abusive: 'Posting abusive, discriminatory, violence-inciting or illegal content.',
        automation: 'Overloading the platform with automated tools or bypassing its protections.',
        copyright: 'Uploading images or text that infringe copyright.',
      },
      enforcement: 'If a violation is found, the account may be suspended or deleted.',
      content_title: 'Content rights',
      content:
        'The content you upload belongs to you. You grant TourneyUp a limited, free license to display, resize and distribute it on the platform. When you delete your account, your content is deleted too.',
      liability_title: 'Limitation of liability',
      liability:
        'The platform is provided “as is”. Uninterrupted operation, freedom from errors and the authenticity of tournaments are not guaranteed. No liability is accepted for indirect damages arising from use of the platform.',
      changes_title: 'Changes to these terms',
      changes:
        'If the terms change, the update date above will be updated. Significant changes will be announced with a notification on the platform.',
      contact_title: 'Contact',
      note: 'Note: this is a working draft. Have it reviewed by a lawyer before using it as a legally binding document.',
    },
  },
})
