import type { Locale } from "../constants";

/**
 * Every UI string in every language, keyed once. Grouping translations by key
 * keeps the four languages in lockstep by construction: a key missing any
 * locale is a type error, and each string has exactly one place to edit.
 */
export const TRANSLATIONS = {
  tagline: {
    en: "A GenAI companion for World Cup 2026 match days",
    es: "Un asistente de IA generativa para los días de partido del Mundial 2026",
    fr: "Un compagnon d'IA générative pour les jours de match de la Coupe du monde 2026",
    ar: "رفيق ذكاء اصطناعي توليدي لأيام مباريات كأس العالم 2026",
  },
  navHome: {
    en: "Home",
    es: "Inicio",
    fr: "Accueil",
    ar: "الرئيسية",
  },
  navFan: {
    en: "Fan Copilot",
    es: "Asistente para aficionados",
    fr: "Assistant supporters",
    ar: "مساعد المشجعين",
  },
  navOps: {
    en: "Ops Center",
    es: "Centro de operaciones",
    fr: "Centre des opérations",
    ar: "مركز العمليات",
  },
  navAbout: {
    en: "About",
    es: "Acerca de",
    fr: "À propos",
    ar: "حول",
  },
  langLabel: {
    en: "Language",
    es: "Idioma",
    fr: "Langue",
    ar: "اللغة",
  },
  fanTitle: {
    en: "Fan Copilot",
    es: "Asistente para aficionados",
    fr: "Assistant supporters",
    ar: "مساعد المشجعين",
  },
  fanSubtitle: {
    en: "Ask anything about the stadium in your language.",
    es: "Pregunta lo que quieras sobre el estadio en tu idioma.",
    fr: "Posez n'importe quelle question sur le stade dans votre langue.",
    ar: "اسأل أي شيء عن الملعب بلغتك.",
  },
  fanPlaceholder: {
    en: "Ask about gates, food, accessible routes, transit…",
    es: "Pregunta por accesos, comida, rutas accesibles, transporte…",
    fr: "Portes, restauration, itinéraires accessibles, transports…",
    ar: "اسأل عن البوابات والطعام والمسارات الميسّرة والمواصلات…",
  },
  fanSend: {
    en: "Send",
    es: "Enviar",
    fr: "Envoyer",
    ar: "إرسال",
  },
  fanStop: {
    en: "Stop",
    es: "Detener",
    fr: "Arrêter",
    ar: "إيقاف",
  },
  fanThinking: {
    en: "Thinking…",
    es: "Pensando…",
    fr: "Réflexion…",
    ar: "جارٍ التفكير…",
  },
  fanError: {
    en: "Something went wrong. Please try again.",
    es: "Algo salió mal. Inténtalo de nuevo.",
    fr: "Une erreur s'est produite. Veuillez réessayer.",
    ar: "حدث خطأ ما. حاول مرة أخرى.",
  },
  fanRetry: {
    en: "Retry",
    es: "Reintentar",
    fr: "Réessayer",
    ar: "إعادة المحاولة",
  },
  fanEmpty: {
    en: "Start by asking a question, or tap a suggestion below.",
    es: "Empieza con una pregunta o toca una sugerencia.",
    fr: "Commencez par une question ou touchez une suggestion.",
    ar: "ابدأ بطرح سؤال أو اختر أحد الاقتراحات.",
  },
  fanRateLimited: {
    en: "You're sending messages quickly. Please wait a moment.",
    es: "Estás enviando mensajes muy rápido. Espera un momento.",
    fr: "Vous envoyez des messages trop vite. Patientez un instant.",
    ar: "أنت ترسل الرسائل بسرعة. انتظر لحظة من فضلك.",
  },
  fanStepFree: {
    en: "Step-free routes only",
    es: "Solo rutas sin escaleras",
    fr: "Itinéraires sans marches uniquement",
    ar: "المسارات الخالية من الدرج فقط",
  },
  fanLocation: {
    en: "Your location",
    es: "Tu ubicación",
    fr: "Votre position",
    ar: "موقعك",
  },
  fanLocationNone: {
    en: "Not set",
    es: "Sin definir",
    fr: "Non défini",
    ar: "غير محدد",
  },
  chipGate: {
    en: "Find my gate",
    es: "Encontrar mi acceso",
    fr: "Trouver ma porte",
    ar: "إيجاد بوابتي",
  },
  chipFood: {
    en: "Food near me",
    es: "Comida cerca",
    fr: "Restauration à proximité",
    ar: "طعام قريب",
  },
  chipAccessible: {
    en: "Accessible route",
    es: "Ruta accesible",
    fr: "Itinéraire accessible",
    ar: "مسار ميسّر",
  },
  chipTransit: {
    en: "Best way home",
    es: "Mejor forma de volver",
    fr: "Meilleur trajet retour",
    ar: "أفضل طريق للعودة",
  },
  chipRecycling: {
    en: "Recycling points",
    es: "Puntos de reciclaje",
    fr: "Points de recyclage",
    ar: "نقاط إعادة التدوير",
  },
  disclaimer: {
    en: "Unofficial demo. Not affiliated with FIFA or any real venue. All venue data is synthetic.",
    es: "Demostración no oficial. Sin afiliación con la FIFA ni con ningún recinto real. Todos los datos del estadio son ficticios.",
    fr: "Démonstration non officielle. Sans lien avec la FIFA ou un lieu réel. Toutes les données du stade sont fictives.",
    ar: "عرض توضيحي غير رسمي. لا صلة له بالفيفا أو بأي مكان حقيقي. جميع بيانات الملعب افتراضية.",
  },
  poweredBy: {
    en: "Grounded in stadium data. Generative AI never invents venue facts.",
    es: "Basado en datos del estadio. La IA generativa nunca inventa datos del recinto.",
    fr: "Basé sur les données du stade. L'IA générative n'invente jamais d'informations sur le lieu.",
    ar: "يعتمد على بيانات الملعب. الذكاء الاصطناعي التوليدي لا يختلق معلومات عن المكان.",
  },
} satisfies Record<string, Record<Locale, string>>;

type DictKey = keyof typeof TRANSLATIONS;
export type Dictionary = Record<DictKey, string>;
