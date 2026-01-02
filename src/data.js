// FILE: data.js
// PURPOSE: Static data for Price List, Extra Expenses, and Calculation Schemes

window.Data = window.Data || {};

window.Data.priceList = [
    { id: 1, name: "МСК, 12/7", region: "Москва", weapon: false, shift: "Нет", hours: 12, hoursMonth: 365, rateHour: 760.00, rateMonth: 277400.00, salary: 5500, desc: "Ежедневно, полусуточно, один сотрудник охраны со сменным режимом работы (г. Москва)" },
    { id: 2, name: "МСК, 12/7, вахта (на объекте)", region: "Москва", weapon: false, shift: "На объекте", hours: 12, hoursMonth: 365, rateHour: 602.74, rateMonth: 220000.10, salary: 4000, desc: "Ежедневно, полусуточно, один сотрудник охраны с вахтовым режимом работы (г. Москва)" },
    { id: 3, name: "МСК, 12/7, вахта (хостел)", region: "Москва", weapon: false, shift: "Хостел", hours: 12, hoursMonth: 365, rateHour: 685.00, rateMonth: 250025.00, salary: 4700, desc: "Ежедневно, полусуточно, один сотрудник охраны с вахтовым режимом работы (хостел) (г. Москва)" },
    { id: 4, name: "МСК, 24/7", region: "Москва", weapon: false, shift: "Нет", hours: 24, hoursMonth: 730, rateHour: 534.25, rateMonth: 390002.50, salary: 7500, desc: "Ежедневно, круглосуточно, один сотрудник охраны со сменным режимом работы (г. Москва)" },
    { id: 5, name: "МСК, 24/7, вахта (на объекте) (х1.5)", region: "Москва", weapon: false, shift: "На объекте", hours: 24, hoursMonth: 1095, rateHour: 534.25, rateMonth: 585003.75, salary: 7500, desc: "" },
    { id: 6, name: "МСК, 24/7, вахта (на объекте) (х2)", region: "Москва", weapon: false, shift: "Хостел", hours: 24, hoursMonth: 1460, rateHour: 328.77, rateMonth: 480004.20, salary: 4700, desc: "Ежедневно, круглосуточно, один сотрудник охраны с вахтовым режимом работы (г. Москва)" },
    { id: 7, name: "МСК, 24/7, вахта (хостел) (х2)", region: "Москва", weapon: false, shift: "На объекте", hours: 24, hoursMonth: 1460, rateHour: 294.52, rateMonth: 429999.20, salary: 4000, desc: "Ежедневно, круглосуточно, один сотрудник охраны с вахтовым режимом работы (хостел) (г. Москва)" },
    { id: 8, name: "МСК, 24/7, с оружием", region: "Москва", weapon: true, shift: "Нет", hours: 24, hoursMonth: 730, rateHour: 664.38, rateMonth: 484997.40, salary: 9500, desc: "Ежедневно, круглосуточно, один сотрудник охраны со сменным режимом работы с оружием (г. Москва)" },
    { id: 9, name: "МСК, 24/7, вахта (на объекте), с оружием (х2)", region: "Москва", weapon: true, shift: "На объекте", hours: 24, hoursMonth: 1460, rateHour: 356.16, rateMonth: 519993.60, salary: 5000, desc: "Ежедневно, круглосуточно, один сотрудник охраны с вахтовым режимом работы с оружием (г. Москва)" },
    { id: 10, name: "СПб, 12/7", region: "СПб", weapon: false, shift: "Нет", hours: 12, hoursMonth: 365, rateHour: 602.74, rateMonth: 220000.10, salary: 4000, desc: "Ежедневно, полусуточно, один сотрудник охраны со сменным режимом работы (г. Санкт-Петербург)" },
    { id: 11, name: "СПб, 24/7", region: "СПб", weapon: false, shift: "Нет", hours: 24, hoursMonth: 730, rateHour: 383.56, rateMonth: 279998.80, salary: 5000, desc: "Ежедневно, круглосуточно, один сотрудник охраны со сменным режимом работы (г. Санкт-Петербург)" },
    { id: 12, name: "СПб, 24/7, с оружием", region: "СПб", weapon: true, shift: "Нет", hours: 24, hoursMonth: 730, rateHour: 534.25, rateMonth: 390002.50, salary: 7500, desc: "Ежедневно, круглосуточно, один сотрудник охраны со сменным режимом работы с оружем (г. Санкт-Петербург)" },
    { id: 13, name: "СПб, вахта", region: "СПб", weapon: false, shift: "На объекте", hours: 24, hoursMonth: 730, rateHour: 534.25, rateMonth: 390002.50, salary: 7500, desc: "" }
];

window.Data.extraPriceList = [
    { id: 101, name: "хостел", amount: 700.00, unit: "день", vatType: "б днс\\ ндс" },
    { id: 102, name: "питание", amount: 500.00, unit: "день", vatType: "б днс\\ ндс" },
    { id: 103, name: "связь", amount: 500.00, unit: "мес", vatType: "ндс" },
    { id: 104, name: "антиБПЛА", amount: 200000.00, unit: "шт", vatType: "бндс" },
    { id: 105, name: "обучение птм", amount: 2000.00, unit: "шт", vatType: "бндс" },
    { id: 106, name: "обучение от", amount: 2000.00, unit: "шт", vatType: "бндс" },
    { id: 107, name: "обучение иии", amount: 2000.00, unit: "шт", vatType: "бндс" },
    { id: 108, name: "обучение бпла", amount: 2000.00, unit: "шт", vatType: "бндс" },
    { id: 109, name: "обучение антитеррор", amount: 2000.00, unit: "шт", vatType: "бндс" },
    { id: 110, name: "газоанализатор", amount: 600000.00, unit: "шт", vatType: "ндс" },
    { id: 111, name: "телефон", amount: 20000.00, unit: "шт", vatType: "ндс" },
    { id: 112, name: "ноутбук", amount: 50000.00, unit: "шт", vatType: "ндс" },
    { id: 113, name: "интроскоп", amount: 750000.00, unit: "шт", vatType: "ндс" },
    { id: 114, name: "машина", amount: 1000000.00, unit: "шт", vatType: "" }
];

// Additional data from main_data.txt
window.Data.managers = [
    { id: 1, name: "Ломакин Владислав Алксандрович", position: "Руководитель тендерного отдела", phone: "+7 (925) 707-09-11", email: "tender@sigma-profi.com", role: "admin" },
    { id: 2, name: "Данилюк Елена Михайловна", position: "Коммерческий директор", phone: "+7 (916) 282-81-52", email: "help@sigma-profi.com", role: "manager" },
    { id: 3, name: "Меньщикова Оксана Петровна", position: "Менеджер отдела продаж", phone: "+7 (903) 247-96-76", email: "info@sigma-profi.com", role: "manager" },
    { id: 4, name: "Серова Виктория Игоревна", position: "Администратор отдела личной охраны", phone: "+7 (906) 033-37-89", email: "admin@sigma-profi.com", role: "manager" }
];

window.Data.companies = [
    {
        id: "SP",
        name: "Общество с ограниченной ответственностью Частное охранное предприятие «СИГМА-ПРОФИ»",
        address: "129347, г. Москва, Огородный проезд, д. 20, стр. 27",
        phone: "+7 (495) 937-6000",
        website: "www.sigma-profi.com",
        okpo: "57035455",
        ogrn: "1037739060666",
        inn: "7707293185",
        kpp: "771501001",
        email: "client@sigma-profi.com",
        vatRate: 7,
        vatText: "в том числе НДС 7% (на основании пп. 1 п. 8 ст. 164 НК РФ) в размере:"
    },
    {
        id: "SP2",
        name: "Общество с ограниченной ответственностью «Частная охранная организация «Сигма-Профи 2»",
        address: "127322, г. Москва, Огородный пр-д, д. 20/27, этаж 5, пом. Х, комн. 14В",
        phone: "+7 (495) 937-6000",
        website: "www.sigma-profi.com",
        okpo: "13264255",
        ogrn: "1127747097323",
        inn: "7715940799",
        kpp: "771501001",
        email: "client@sigma-profi.com",
        vatRate: 20,
        vatText: "в том числе НДС 20% в размере:"
    },
    {
        id: "SP1",
        name: "Общество с ограниченной ответственностью «Частное охранное предприятие «Сигма-Профи 1»",
        address: "127322, г. Москва, Огородный проезд, д. 20, стр. 27, пом. 10А/5",
        phone: "+7 (495) 937-6000",
        website: "www.sigma-profi.com",
        okpo: "89582360",
        ogrn: "5087746667245",
        inn: "7716623545",
        kpp: "771501001",
        email: "client@sigma-profi.com",
        vatRate: 7,
        vatText: "в том числе НДС 7% (на основании пп. 1 п. 8 ст. 164 НК РФ) в размере:"
    },
    {
        id: "SP3",
        name: "Общество с ограниченной ответственностью «Частная охранная организация «Сигма-Профи 3»",
        address: "127322, г. Москва, Огородный проезд, д. 20, стр. 27, помещ. 1/5",
        phone: "+7 (495) 937-6000",
        website: "www.sigma-profi.com",
        okpo: "03859711",
        ogrn: "1166952065796",
        inn: "6950195609",
        kpp: "771501001",
        email: "client@sigma-profi.com",
        vatRate: 7,
        vatText: "в том числе НДС 7% (на основании пп. 1 п. 8 ст. 164 НК РФ) в размере:"
    },
    {
        id: "SPK",
        name: "Общество с ограниченной ответственностью Частное охранное предприятие «СИГМА-ПРОФИ КОНСАЛТИНГ»",
        address: "127322, г. Москва, Огородный проезд, д. 20 стр. 27, помещ. 2/5",
        phone: "+7 (495) 937-6000",
        website: "www.sigma-profi.com",
        okpo: "66386863",
        ogrn: "1107746348577",
        inn: "7716663410",
        kpp: "771601001",
        email: "consult@sigma-profi.com",
        vatRate: 7,
        vatText: "в том числе НДС 7% (на основании пп. 1 п. 8 ст. 164 НК РФ) в размере:"
    }
];

window.Data.uniforms = [
    { id: 1, name: "Костюм «Гарант»", url: "https://sigma-profi.com/forma-odezhdy/kostjum-garant/" },
    { id: 2, name: "Джемпер без рукавов", url: "https://sigma-profi.com/forma-odezhdy/forma-odezhdy-dzhemper-bez-rukavov/" },
    { id: 3, name: "Классический костюм", url: "https://sigma-profi.com/forma-odezhdy/klassicheskij-kostjum/" },
    { id: 4, name: "Черный спецназ", url: "https://sigma-profi.com/forma-odezhdy/chernyj-specnaz/" },
    { id: 5, name: "Зеленый спецназ", url: "https://sigma-profi.com/forma-odezhdy/zelenyj-specnaz/" },
    { id: 6, name: "Бежевый спецназ", url: "https://sigma-profi.com/forma-odezhdy/bezhevyj-specnaz/" },
    { id: 7, name: "Спецназ «Люкс»", url: "https://sigma-profi.com/forma-odezhdy/specnaz-ljuks/" },
    { id: 8, name: "Инкассатор", url: "https://sigma-profi.com/forma-odezhdy/inkassator/" }
];

window.Data.schemeMappings = {
    "БЕЛ УСН": ["SP", "SP1", "SPK"],
    "СЕР УСН": ["SP", "SP1", "SPK"],
    "БЕЛ НДС": ["SP2"],
    "СЕР НДС": ["SP2"],
    "ИП НДС": ["SP2"]
};

window.Data.schemes = {
    "BELUSN": { name: "БЕЛ УСН", type: "usn", taxRate: 0.07, ndsRateInt: 7, formulas: {} },
    "SERUSN": { name: "СЕР УСН", type: "usn", taxRate: 0.07, ndsRateInt: 7, formulas: {} },
    "BELNDS": { name: "БЕЛ НДС", type: "nds", taxRate: 0.20, ndsRateInt: 22, formulas: {} },
    "SERNDS": { name: "СЕР НДС", type: "nds", taxRate: 0.20, ndsRateInt: 22, formulas: {} },
    "IPNDS":  { name: "ИП НДС",  type: "nds", taxRate: 0.20, ndsRateInt: 22, formulas: {} }
};

const defaultFormulas = {
  10: {
    E: "=расчет_итого_вмес-E21",
    F: "=расчет_итого_вмес-F21",
    G: "=G13-G21-G29",
    H: "=H13-H21",
    I: "=расчет_итого_вмес-I21"
  },

  11: {
    E: "=E10*0.85",
    F: "=F10*0.85",
    G: "=G10*0.85",
    H: "=H10*0.85",
    I: "=I10*0.85"
  },

  12: {
    E: "=E11/расчет_итого_вмес",
    F: "=F11/расчет_итого_вмес",
    G: "=G11/G13",
    H: "=H11/H13",
    I: "=I11/расчет_итого_вмес"
  },

  13: {
    E: "=O4",
    F: "=O4",
    G: "=(O4-(O4*7/107))*1.22",
    H: "=O4",
    I: "=O4"
  },

  14: {
    E: "=(E13/(100+E15))*E15",
    F: "=F13/(100+F15)*F15",
    G: "=(G13/(100+G15))*G15-G28",
    H: "=(расчет_итого-(расчет_итого*7/107))*0.22",
    I: "=I13/(100+I15)*I15"
  },

  15: { E: "7", F: "7", G: "22", H: "22", I: "22" },

  16: {
    E: "=расчет_итого_зп_по_ср_ставке/расчет_итого_чел_по_ставке/30.5*расчет_итого_чел_по_ставке*30.5",
    F: "=расчет_итого_зп_по_ср_ставке/расчет_итого_чел_по_ставке/30.5*расчет_итого_чел_по_ставке*30.5",
    G: "=расчет_итого_зп_по_ср_ставке/расчет_итого_чел_по_ставке/30.5*расчет_итого_чел_по_ставке*30.5",
    H: "=расчет_итого_зп_по_ср_ставке/расчет_итого_чел_по_ставке/30.5*расчет_итого_чел_по_ставке*30.5",
    I: "=расчет_итого_зп_по_ср_ставке/расчет_итого_чел_по_ставке/30.5*расчет_итого_чел_по_ставке*30.5"
  },

  17: {
    E: "=E16/29.3*28/12",
    F: "=F16/29.3*28/12",
    G: "=G16/29.3*28/12",
    H: "=H16/29.3*28/12",
    I: "=I16/29.3*28/12"
  },

  18: {
    E: "=расчет_ноо_бух_олрр/29.3*28/12",
    F: "=расчет_ноо_бух_олрр/29.3*28/12",
    G: "=расчет_ноо_бух_олрр/29.3*28/12",
    H: "=расчет_ноо_бух_олрр/29.3*28/12",
    I: "=расчет_ноо_бух_олрр/29.3*28/12"
  },

  19: {
    E: "=SUM(E16:E18)+расчет_ноо_бух_олрр",
    F: "=F16+расчет_ноо_бух_олрр+F17+F18",
    G: "=G16+G17+G18+расчет_ноо_бух_олрр",
    H: "=H16+H17+H18+расчет_ноо_бух_олрр",
    I: "=I16+расчет_ноо_бух_олрр+I17+I18"
  },

  20: {
    E: "=E19/0.87",
    F: "=L9*расчет_итого_чел_по_ставке",
    G: "=G19/0.87",
    H: "=L9*расчет_итого_чел_по_ставке",
    I: "=L9*расчет_итого_чел_по_ставке"
  },

  21: {
    E: "=SUM(E22:E27)+E34+расчет_допрасходы+адм_расходы",
    F: "=SUM(F22:F27)+F34+расчет_допрасходы+адм_расходы",
    G: "=SUM(G22:G25)+G29+G34+расчет_допрасходы+адм_расходы",
    H: "=H22+H24+H25+H29+H30+H31+H34+расчет_допрасходы+адм_расходы",
    I: "=I22+I24+I25+I29+I30+I31+I34+расчет_допрасходы+адм_расходы"
  },

  22: {
    E: "=E14",
    F: "=F14",
    G: "=G14",
    H: "=(H13/(100+H15))*H15-H28-H32",
    I: "=(I13/(100+I15))*I15-I28-I32"
  },

  23: {
    E: "=(расчет_итого_вмес-E22)*0.06",
    F: "=(расчет_итого_вмес-E22)*0.06",
    G: "0",
    H: "0",
    I: "=O4*0.22"
  },

  24: {
    E: "=E20-E35",
    F: "=F20-F35",
    G: "=G20-G35",
    H: "=H20-H35",
    I: "=I20-I35"
  },

  25: { E: "0", F: "0", G: "0", H: "0", I: "0" },

  26: {
    E: "=E19-E24",
    F: "=F19-F24",
    G: "0",
    H: "0",
    I: "0"
  },

  27: {
    E: "=E26/85*15",
    F: "=F26/85*15",
    G: "0",
    H: "0",
    I: "0"
  },

  28: {
    E: "0",
    F: "0",
    G: "=(расчет_допрасходы+адм_расходы)/122*22",
    H: "=(расчет_допрасходы+адм_расходы)/122*22",
    I: "=(расчет_допрасходы+адм_расходы)/122*22"
  },

  29: {
    E: "0",
    F: "0",
    G: "=(G13/122*100-G34-G24-(расчет_допрасходы+адм_расходы)+G28)*0.25",
    H: "=IF((H13-H14-H20-H36-H25-H33-(расчет_допрасходы+адм_расходы)+H28)*0.2>0,(H13-H14-H20-H36-H25-H33-(расчет_допрасходы+адм_расходы)+H28)*0.25,0)",
    I: "=IF((I13-I14-I20-I36-I25-I33-(расчет_допрасходы+адм_расходы)+I28)*0.2>0,(I13-I14-I20-I36-I25-I33-(расчет_допрасходы+адм_расходы)+I28)*0.25,0)"
  },

  30: { E: "0", F: "0", G: "0", H: "=H19-H24", I: "=I19-I24" },

  31: { E: "0", F: "0", G: "0", H: "=H30/78*22", I: "=I30/85*100-I30" },

  32: { E: "0", F: "0", G: "0", H: "=(H30+H31)/122*22", I: "=(I31+I30)/105*5" },

  33: { E: "0", F: "0", G: "0", H: "=H30+H31-H32", I: "=I30+I31-I32" },

  34: {
    E: "=SUM(E35:E36)",
    F: "=SUM(F35:F36)",
    G: "=SUM(G35:G36)",
    H: "=SUM(H35:H36)",
    I: "=SUM(I35:I36)"
  },

  35: {
    E: "=E20*0.13",
    F: "=F20*0.13",
    G: "=G20*0.13",
    H: "=H20*0.13",
    I: "=I20*0.13"
  },

  36: {
    E: "=E20*0.302",
    F: "=F20*0.302",
    G: "=G20*0.302",
    H: "=H20*0.302",
    I: "=I20*0.302"
  }
};
// END_BLOCK_EXCEL_FORMULAS

// START_BLOCK_INIT_SCHEMES
Object.keys(window.Data.schemes).forEach(k => {
    window.Data.schemes[k].formulas = JSON.parse(JSON.stringify(defaultFormulas));
});
// END_BLOCK_INIT_SCHEMES

// START_BLOCK_CONSTANTS
window.Data.constants = {
    officialSalary: { "BELUSN": 609312, "SERUSN": 140000, "BELNDS": 609312, "SERNDS": 140000, "IPNDS": 140000 },
    bankCommissionFixed: { "BELUSN": 18554, "SERUSN": 4263, "BELNDS": 18554, "SERNDS": 4263, "IPNDS": 4263 },
    ndsInputFixed: { "BELNDS": 333, "SERNDS": 75041, "IPNDS": 333 },
    cashOutFixed: 369200
};
// END_BLOCK_CONSTANTS
