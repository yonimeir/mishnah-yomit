import type { Seder } from './mishnah-structure';

function perakim(n: number): number[] {
  return Array(n).fill(1);
}

export const RAMBAM_STRUCTURE: Seder[] = [
  {
    id: 'r_madda',
    name: 'מדע',
    masechtot: [
      { id: 'r_yesodei_hatorah', name: 'יסודי התורה', sefariaName: 'Mishneh Torah, Foundations of the Torah', chapters: perakim(10) },
      { id: 'r_deot', name: 'דעות', sefariaName: 'Mishneh Torah, Human Dispositions', chapters: perakim(7) },
      { id: 'r_talmud_torah', name: 'תלמוד תורה', sefariaName: 'Mishneh Torah, Torah Study', chapters: perakim(7) },
      { id: 'r_avodah_zarah', name: 'עבודה זרה', sefariaName: 'Mishneh Torah, Foreign Worship and Customs of the Nations', chapters: perakim(12) },
      { id: 'r_teshuvah', name: 'תשובה', sefariaName: 'Mishneh Torah, Repentance', chapters: perakim(10) },
    ],
  },
  {
    id: 'r_ahavah',
    name: 'אהבה',
    masechtot: [
      { id: 'r_kriat_shema', name: 'קריאת שמע', sefariaName: 'Mishneh Torah, Reading the Shema', chapters: perakim(4) },
      { id: 'r_tefilah', name: 'תפילה וברכת כהנים', sefariaName: 'Mishneh Torah, Prayer and the Priestly Blessing', chapters: perakim(15) },
      { id: 'r_tefillin', name: 'תפילין ומזוזה וספר תורה', sefariaName: 'Mishneh Torah, Tefillin, Mezuzah and the Torah Scroll', chapters: perakim(10) },
      { id: 'r_tzitzit', name: 'ציצית', sefariaName: 'Mishneh Torah, Fringes', chapters: perakim(3) },
      { id: 'r_berakhot', name: 'ברכות', sefariaName: 'Mishneh Torah, Blessings', chapters: perakim(11) },
      { id: 'r_milah', name: 'מילה', sefariaName: 'Mishneh Torah, Circumcision', chapters: perakim(3) },
    ],
  },
  {
    id: 'r_zemanim',
    name: 'זמנים',
    masechtot: [
      { id: 'r_shabbat', name: 'שבת', sefariaName: 'Mishneh Torah, Shabbat', chapters: perakim(30) },
      { id: 'r_eruvin', name: 'עירובין', sefariaName: 'Mishneh Torah, Eruvin', chapters: perakim(8) },
      { id: 'r_shevitat_asor', name: 'שביתת עשור', sefariaName: 'Mishneh Torah, Rest on the Tenth of Tishrei', chapters: perakim(3) },
      { id: 'r_shevitat_yom_tov', name: 'שביתת יום טוב', sefariaName: 'Mishneh Torah, Rest on a Holiday', chapters: perakim(8) },
      { id: 'r_chametz_umatzah', name: 'חמץ ומצה', sefariaName: 'Mishneh Torah, Leavened and Unleavened Bread', chapters: perakim(8) },
      { id: 'r_shofar', name: 'שופר וסוכה ולולב', sefariaName: 'Mishneh Torah, Shofar, Sukkah and Lulav', chapters: perakim(8) },
      { id: 'r_shekalim', name: 'שקלים', sefariaName: 'Mishneh Torah, Sheqel Dues', chapters: perakim(4) },
      { id: 'r_kiddush_hachodesh', name: 'קידוש החודש', sefariaName: 'Mishneh Torah, Sanctification of the New Month', chapters: perakim(19) },
      { id: 'r_taaniyot', name: 'תעניות', sefariaName: 'Mishneh Torah, Fasts', chapters: perakim(5) },
      { id: 'r_megillah', name: 'מגילה וחנוכה', sefariaName: 'Mishneh Torah, Scroll of Esther and Hanukkah', chapters: perakim(4) },
    ],
  },
  {
    id: 'r_nashim',
    name: 'נשים',
    masechtot: [
      { id: 'r_ishut', name: 'אישות', sefariaName: 'Mishneh Torah, Marriage', chapters: perakim(25) },
      { id: 'r_gerushin', name: 'גירושין', sefariaName: 'Mishneh Torah, Divorce', chapters: perakim(13) },
      { id: 'r_yibum', name: 'ייבום וחליצה', sefariaName: 'Mishneh Torah, Levirate Marriage and Release', chapters: perakim(8) },
      { id: 'r_naarah', name: 'נערה בתולה', sefariaName: 'Mishneh Torah, Virgin Maiden', chapters: perakim(3) },
      { id: 'r_sotah', name: 'סוטה', sefariaName: 'Mishneh Torah, Woman Suspected of Infidelity', chapters: perakim(4) },
    ],
  },
  {
    id: 'r_kedushah',
    name: 'קדושה',
    masechtot: [
      { id: 'r_issurei_biah', name: 'איסורי ביאה', sefariaName: 'Mishneh Torah, Forbidden Intercourse', chapters: perakim(22) },
      { id: 'r_maakhalot_assurot', name: 'מאכלות אסורות', sefariaName: 'Mishneh Torah, Forbidden Foods', chapters: perakim(17) },
      { id: 'r_shechitah', name: 'שחיטה', sefariaName: 'Mishneh Torah, Ritual Slaughter', chapters: perakim(14) },
    ],
  },
  {
    id: 'r_haflaah',
    name: 'הפלאה',
    masechtot: [
      { id: 'r_shevuot', name: 'שבועות', sefariaName: 'Mishneh Torah, Oaths', chapters: perakim(12) },
      { id: 'r_nedarim', name: 'נדרים', sefariaName: 'Mishneh Torah, Vows', chapters: perakim(13) },
      { id: 'r_nezirut', name: 'נזירות', sefariaName: 'Mishneh Torah, Nazirite Vows', chapters: perakim(10) },
      { id: 'r_arakhin', name: 'ערכים וחרמין', sefariaName: 'Mishneh Torah, Valuations and Devoted Property', chapters: perakim(8) },
    ],
  },
  {
    id: 'r_zeraim',
    name: 'זרעים',
    masechtot: [
      { id: 'r_kilayim', name: 'כלאים', sefariaName: 'Mishneh Torah, Diverse Species', chapters: perakim(10) },
      { id: 'r_matnot_aniyim', name: 'מתנות עניים', sefariaName: 'Mishneh Torah, Gifts to the Poor', chapters: perakim(10) },
      { id: 'r_terumot', name: 'תרומות', sefariaName: 'Mishneh Torah, Heave Offerings', chapters: perakim(15) },
      { id: 'r_maaserot', name: 'מעשרות', sefariaName: 'Mishneh Torah, Tithes', chapters: perakim(14) },
      { id: 'r_maaser_sheni', name: 'מעשר שני ונטע רבעי', sefariaName: 'Mishneh Torah, Second Tithes and Fourth Year\'s Fruit', chapters: perakim(11) },
      { id: 'r_bikkurim', name: 'ביכורים', sefariaName: 'Mishneh Torah, First Fruits and other Priestly Dues', chapters: perakim(12) },
      { id: 'r_shemitah', name: 'שמיטה ויובל', sefariaName: 'Mishneh Torah, Sabbatical Year and the Jubilee', chapters: perakim(13) },
    ],
  },
  {
    id: 'r_avodah',
    name: 'עבודה',
    masechtot: [
      { id: 'r_beit_habechirah', name: 'בית הבחירה', sefariaName: 'Mishneh Torah, The Chosen Temple', chapters: perakim(8) },
      { id: 'r_klei_hamikdash', name: 'כלי המקדש', sefariaName: 'Mishneh Torah, Vessels of the Sanctuary and Those who Serve Therein', chapters: perakim(10) },
      { id: 'r_biat_hamikdash', name: 'ביאת המקדש', sefariaName: 'Mishneh Torah, Entering the Temple', chapters: perakim(9) },
      { id: 'r_issurei_mizbeiach', name: 'איסורי המזבח', sefariaName: 'Mishneh Torah, Things Forbidden on the Altar', chapters: perakim(7) },
      { id: 'r_maaseh_hakorbanot', name: 'מעשה הקרבנות', sefariaName: 'Mishneh Torah, Sacrificial Procedure', chapters: perakim(19) },
      { id: 'r_temidin', name: 'תמידין ומוספין', sefariaName: 'Mishneh Torah, Daily Offerings and Additional Offerings', chapters: perakim(10) },
      { id: 'r_pesulei_hamukdashin', name: 'פסולי המוקדשין', sefariaName: 'Mishneh Torah, Offerings Made Unfit', chapters: perakim(19) },
      { id: 'r_avodat_yom_hakippurim', name: 'עבודת יום הכיפורים', sefariaName: 'Mishneh Torah, Service on the Day of Atonement', chapters: perakim(5) },
      { id: 'r_meilah', name: 'מעילה', sefariaName: 'Mishneh Torah, Trespass', chapters: perakim(8) },
    ],
  },
  {
    id: 'r_korbanot',
    name: 'קרבנות',
    masechtot: [
      { id: 'r_korban_pesach', name: 'קרבן פסח', sefariaName: 'Mishneh Torah, Paschal Offering', chapters: perakim(10) },
      { id: 'r_chagigah', name: 'חגיגה', sefariaName: 'Mishneh Torah, Festal Offering', chapters: perakim(3) },
      { id: 'r_bechorot', name: 'בכורות', sefariaName: 'Mishneh Torah, Firstlings', chapters: perakim(8) },
      { id: 'r_shegagot', name: 'שגגות', sefariaName: 'Mishneh Torah, Offerings for Unintentional Transgressions', chapters: perakim(15) },
      { id: 'r_mechusarei_kapparah', name: 'מחוסרי כפרה', sefariaName: 'Mishneh Torah, Offerings for Those with Incomplete Atonement', chapters: perakim(5) },
      { id: 'r_temurah', name: 'תמורה', sefariaName: 'Mishneh Torah, Substitution', chapters: perakim(4) },
    ],
  },
  {
    id: 'r_taharah',
    name: 'טהרה',
    masechtot: [
      { id: 'r_tumat_met', name: 'טומאת מת', sefariaName: 'Mishneh Torah, Defilement by a Corpse', chapters: perakim(25) },
      { id: 'r_parah_adumah', name: 'פרה אדומה', sefariaName: 'Mishneh Torah, Red Heifer', chapters: perakim(15) },
      { id: 'r_tumat_tzaraat', name: 'טומאת צרעת', sefariaName: 'Mishneh Torah, Defilement by Leprosy', chapters: perakim(16) },
      { id: 'r_metamei_mishkav', name: 'מטמאי משכב ומושב', sefariaName: 'Mishneh Torah, Those Who Defile Bed or Seat', chapters: perakim(13) },
      { id: 'r_shear_avot_hatumah', name: 'שאר אבות הטומאות', sefariaName: 'Mishneh Torah, Other Sources of Defilement', chapters: perakim(20) },
      { id: 'r_tumat_okhalin', name: 'טומאת אוכלין', sefariaName: 'Mishneh Torah, Defilement of Foods', chapters: perakim(16) },
      { id: 'r_kelim', name: 'כלים', sefariaName: 'Mishneh Torah, Vessels', chapters: perakim(28) },
      { id: 'r_mikvaot', name: 'מקוואות', sefariaName: 'Mishneh Torah, Immersion Pools', chapters: perakim(11) },
    ],
  },
  {
    id: 'r_nezikin',
    name: 'נזיקין',
    masechtot: [
      { id: 'r_nizkei_mammon', name: 'נזקי ממון', sefariaName: 'Mishneh Torah, Damages to Property', chapters: perakim(14) },
      { id: 'r_genevah', name: 'גניבה', sefariaName: 'Mishneh Torah, Theft', chapters: perakim(9) },
      { id: 'r_gezelah', name: 'גזילה ואבידה', sefariaName: 'Mishneh Torah, Robbery and Lost Property', chapters: perakim(18) },
      { id: 'r_chovel', name: 'חובל ומזיק', sefariaName: 'Mishneh Torah, One Who Injures a Person or Property', chapters: perakim(8) },
      { id: 'r_rotzeach', name: 'רוצח ושמירת נפש', sefariaName: 'Mishneh Torah, Murderer and the Preservation of Life', chapters: perakim(13) },
    ],
  },
  {
    id: 'r_kinyan',
    name: 'קנין',
    masechtot: [
      { id: 'r_mechirah', name: 'מכירה', sefariaName: 'Mishneh Torah, Sales', chapters: perakim(30) },
      { id: 'r_zechiyah', name: 'זכייה ומתנה', sefariaName: 'Mishneh Torah, Ownerless Property and Gifts', chapters: perakim(12) },
      { id: 'r_shekhenim', name: 'שכנים', sefariaName: 'Mishneh Torah, Neighbors', chapters: perakim(14) },
      { id: 'r_sheluchin', name: 'שלוחין ושותפין', sefariaName: 'Mishneh Torah, Agents and Partners', chapters: perakim(10) },
      { id: 'r_avadim', name: 'עבדים', sefariaName: 'Mishneh Torah, Slaves', chapters: perakim(9) },
    ],
  },
  {
    id: 'r_mishpatim',
    name: 'משפטים',
    masechtot: [
      { id: 'r_sechirut', name: 'שכירות', sefariaName: 'Mishneh Torah, Hiring', chapters: perakim(13) },
      { id: 'r_sheelah', name: 'שאלה ופיקדון', sefariaName: 'Mishneh Torah, Borrowing and Deposit', chapters: perakim(8) },
      { id: 'r_malveh', name: 'מלווה ולווה', sefariaName: 'Mishneh Torah, Creditor and Debtor', chapters: perakim(27) },
      { id: 'r_toen', name: 'טוען ונטען', sefariaName: 'Mishneh Torah, Plaintiff and Defendant', chapters: perakim(16) },
      { id: 'r_nachalot', name: 'נחלות', sefariaName: 'Mishneh Torah, Inheritances', chapters: perakim(11) },
    ],
  },
  {
    id: 'r_shoftim',
    name: 'שופטים',
    masechtot: [
      { id: 'r_sanhedrin', name: 'סנהדרין', sefariaName: 'Mishneh Torah, The Sanhedrin and the Penalties within their Jurisdiction', chapters: perakim(26) },
      { id: 'r_edut', name: 'עדות', sefariaName: 'Mishneh Torah, Testimony', chapters: perakim(22) },
      { id: 'r_mamrim', name: 'ממרים', sefariaName: 'Mishneh Torah, Rebels', chapters: perakim(7) },
      { id: 'r_evel', name: 'אבל', sefariaName: 'Mishneh Torah, Mourning', chapters: perakim(14) },
      { id: 'r_melakhim', name: 'מלכים ומלחמות', sefariaName: 'Mishneh Torah, Kings and Wars', chapters: perakim(12) },
    ],
  },
];
