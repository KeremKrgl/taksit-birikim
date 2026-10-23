// KVKK aydınlatma metni. DRAFT: a lawyer must review it before real users sign up.
// Fill in the [köşeli parantez] fields with the data controller's details.
// When the text changes, bump CONSENT_VERSION in lib/consent.ts.

type Section = { title: string; body: string[] };

const tr: Section[] = [
  {
    title: "1. Veri sorumlusu",
    body: [
      "Taksit & Birikim uygulaması [Veri sorumlusunun adı / şirket unvanı], [adres] (\"biz\") tarafından sunulur. 6698 sayılı Kişisel Verilerin Korunması Kanunu (\"KVKK\") kapsamında veri sorumlusu biziz. Bize [e-posta adresi] üzerinden ulaşabilirsin.",
    ],
  },
  {
    title: "2. Hangi verileri işliyoruz?",
    body: [
      "Kimlik ve iletişim: e-posta adresin, isteğe bağlı olarak adın, Google ile giriş yaparsan Google hesabındaki ad ve e-posta.",
      "Finansal bilgiler (senin girdiğin ya da yüklediğin): banka adı, kart takma adı, kartın yalnızca son 4 hanesi, hesap kesim ve son ödeme günleri, kart limiti, alışveriş ve taksit tutarları, birikim türleri ve miktarları. Tam kart numaranı asla saklamayız.",
      "Yüklediğin ekstre PDF'leri: yalnızca okunmak için geçici olarak saklanır ve okunduktan hemen sonra silinir.",
      "Kullanım ve teknik bilgiler: verdiğin onaylar ve tarihleri, bildirim tercihlerin, cihaz bildirim kaydı. İzin verirsen anonim kullanım istatistikleri (tutar, mağaza ya da banka bilgisi içermez).",
    ],
  },
  {
    title: "3. Neden işliyoruz ve hukuki sebep",
    body: [
      "Taksitlerini ve birikimini gösterebilmek, hatırlatma gönderebilmek ve hesabını yönetebilmek için (KVKK m.5/2-c, sözleşmenin kurulması ve ifası).",
      "Güvenlik, kötüye kullanımın önlenmesi ve hizmetin çalışması için (KVKK m.5/2-f, meşru menfaat).",
      "Hukuki yükümlülüklerimizi yerine getirmek için (KVKK m.5/2-ç).",
      "Anonim kullanım istatistikleri ve kampanya e-postaları için yalnızca açık rızanla (KVKK m.5/1).",
    ],
  },
  {
    title: "4. Kimlere ve hangi ülkelere aktarıyoruz?",
    body: [
      "Hizmeti sunmak için şu hizmet sağlayıcılarla çalışıyoruz: Supabase (veritabanı ve giriş, sunucular Frankfurt, Almanya), Vercel (uygulama sunucusu, Frankfurt), OpenAI (yüklediğin ekstrenin okunması; kimlik numarası, IBAN, telefon ve kart numarası gibi bilgiler gönderilmeden önce silinir), Resend (e-posta gönderimi), PostHog (izin verirsen anonim istatistik, AB sunucuları).",
      "Bu aktarımlar KVKK m.9 kapsamında standart sözleşmelere ve açık rızana dayanır. Standart sözleşmeler imzalandıktan sonra 5 iş günü içinde Kişisel Verileri Koruma Kurumu'na bildirilir.",
      "Verilerini reklam amacıyla kimseyle paylaşmaz, satmayız.",
    ],
  },
  {
    title: "5. Verileri nasıl topluyoruz?",
    body: ["Verilerini uygulamaya kendin girdiğinde, ekstre yüklediğinde ya da Google ile giriş yaptığında elektronik ortamda topluyoruz. Bankana ya da kartına hiçbir şekilde bağlanmayız."],
  },
  {
    title: "6. Ne kadar süre saklıyoruz?",
    body: [
      "Hesabın açık olduğu sürece saklarız. Hesabını sildiğinde tüm verilerin kalıcı olarak silinir.",
      "Ekstre PDF'leri okunduktan hemen sonra, okunan ama onaylanmayan bilgiler en geç 24 saat sonra silinir.",
      "Kanunen saklamamız gereken kayıtlar (örneğin ödeme faturaları) yasal süre boyunca saklanır.",
    ],
  },
  {
    title: "7. Hakların (KVKK m.11)",
    body: [
      "Verilerinin işlenip işlenmediğini öğrenme, bilgi isteme, işlenme amacını öğrenme, aktarıldığı kişileri bilme, eksik ya da yanlış işlenmişse düzeltilmesini, silinmesini ya da yok edilmesini isteme, bu işlemlerin aktarılan kişilere bildirilmesini isteme, otomatik analiz sonucuna itiraz etme ve zarar görürsen giderilmesini talep etme hakların vardır.",
      "Verilerini Hesap ekranından istediğin an indirebilir ya da hesabını ve tüm verilerini silebilirsin. Diğer talepler için [e-posta adresi] adresine yazabilirsin; en geç 30 gün içinde ücretsiz cevap veririz.",
    ],
  },
];

const en: Section[] = [
  {
    title: "1. Data controller",
    body: [
      "Taksit & Birikim is provided by [data controller's name / company], [address] (\"we\"). We are the data controller under Turkish Personal Data Protection Law No. 6698 (\"KVKK\"). You can reach us at [email address].",
    ],
  },
  {
    title: "2. What we process",
    body: [
      "Identity and contact: your email address, optionally your name, and your Google name and email if you sign in with Google.",
      "Financial details you enter or upload: bank name, card nickname, only the last 4 digits of your card, statement and due days, card limit, purchase and installment amounts, savings types and quantities. We never store your full card number.",
      "Statement PDFs you upload: kept only while they are read, and deleted right after.",
      "Usage and technical data: the consents you gave and when, notification preferences, device push registration. With your permission, anonymous usage statistics (never amounts, merchants or bank details).",
    ],
  },
  {
    title: "3. Why we process it, and the legal basis",
    body: [
      "To show your installments and savings, send reminders and run your account (KVKK art. 5/2-c, performance of a contract).",
      "For security, abuse prevention and keeping the service running (KVKK art. 5/2-f, legitimate interest).",
      "To meet our legal obligations (KVKK art. 5/2-ç).",
      "Anonymous usage statistics and marketing emails only with your explicit consent (KVKK art. 5/1).",
    ],
  },
  {
    title: "4. Who receives it, and in which countries",
    body: [
      "We use these service providers: Supabase (database and sign-in, servers in Frankfurt, Germany), Vercel (app server, Frankfurt), OpenAI (reading statements you upload; ID numbers, IBANs, phone and card numbers are removed before sending), Resend (sending email), PostHog (anonymous statistics if you allow it, EU servers).",
      "These transfers rely on standard contracts and your explicit consent under KVKK art. 9. Standard contracts are notified to the Personal Data Protection Authority within 5 business days of signing.",
      "We never sell your data or share it for advertising.",
    ],
  },
  {
    title: "5. How we collect it",
    body: ["Electronically, when you enter data, upload a statement or sign in with Google. We never connect to your bank or card."],
  },
  {
    title: "6. How long we keep it",
    body: [
      "For as long as your account is open. When you delete your account, all your data is permanently deleted.",
      "Statement PDFs are deleted right after reading; read but unconfirmed details within 24 hours.",
      "Records we must keep by law (such as payment invoices) are kept for the legal period.",
    ],
  },
  {
    title: "7. Your rights (KVKK art. 11)",
    body: [
      "You may learn whether your data is processed, request information, learn the purpose, know who it is transferred to, ask for correction, deletion or destruction, ask that these be notified to recipients, object to results of automated analysis, and claim compensation for damage.",
      "You can download your data or delete your account and all data from the Account screen at any time. For other requests, write to [email address]; we reply free of charge within 30 days.",
    ],
  },
];

export function NoticeContent({ locale }: { locale: string }) {
  const sections = locale === "en" ? en : tr;
  return (
    <div className="space-y-6">
      {sections.map((s) => (
        <section key={s.title} className="space-y-2">
          <h2 className="text-lg font-semibold">{s.title}</h2>
          {s.body.map((p) => (
            <p key={p.slice(0, 40)} className="leading-relaxed text-foreground/90">
              {p}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
