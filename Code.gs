/**
 * ប្រព័ន្ធគ្រប់គ្រងវត្តមាន និងអាហារពេលព្រឹកសិស្ស
 * សាលាបឋមសិក្សាថ្លុកដង្កោ - ឆ្នាំសិក្សា ២០២៥-២០២៦
 * API Protected with PIN: 168
 */

const API_PIN = "168"; // លេខកូដសម្ងាត់ការពារ API

function checkPin(pin) {
  return String(pin).trim() === API_PIN;
}

function doGet(e) {
  // ប្រសិនបើជា API Request ពី GitHub Pages (JSON)
  if (e && e.parameter && e.parameter.action) {
    return handleApiGet(e);
  }

  // ប្រសិនបើបើកផ្ទាល់ក្នុង Browser បញ្ជូនទៅកាន់ GitHub Pages ដោយស្វ័យប្រវត្តិ
  return HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=https://romperb9-byte.github.io/thlok-dangkaw-meals/"><script>window.location.replace("https://romperb9-byte.github.io/thlok-dangkaw-meals/");</script></head><body><div style="font-family:sans-serif;text-align:center;padding:50px;">កំពុងបញ្ជូនទៅកាន់ប្រព័ន្ធ... សូមរង់ចាំបន្តិច <br><br><a href="https://romperb9-byte.github.io/thlok-dangkaw-meals/">ចុចត្រង់នេះ ប្រសិនបើមិនដំណើរការស្វ័យប្រវត្តិ</a></div></body></html>'
  ).setTitle('ប្រព័ន្ធកត់ត្រាវត្តមាន និងអាហារសិស្ស - សាលាបឋមសិក្សាថ្លុកដង្កោ')
   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
   .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

function doPost(e) {
  try {
    const rawData = e.postData.contents;
    const body = JSON.parse(rawData);
    const pin = body.pin || (e.parameter && e.parameter.pin);

    if (!checkPin(pin)) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        message: 'លេខកូដសម្ងាត់មិនត្រឹមត្រូវ (PIN Invalid)!' 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const action = body.action || (e.parameter && e.parameter.action);
    let res = {};

    if (action === 'saveDailyRecord') {
      res = saveDailyRecord(body.data || body);
    } else if (action === 'addNewClass') {
      res = addNewClassToSystem(body.className || (body.data && body.data.className));
    } else {
      res = { success: false, message: 'សកម្មភាពមិនត្រឹមត្រូវ' };
    }

    return ContentService.createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleApiGet(e) {
  const pin = e.parameter.pin;

  if (!checkPin(pin)) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: 'លេខកូដសម្ងាត់មិនត្រឹមត្រូវ (PIN Invalid)!' 
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const action = e.parameter.action;
  let res = {};

  if (action === 'getInitialData') {
    res = getInitialData(e.parameter.month, e.parameter.day);
  } else if (action === 'addNewClass') {
    res = addNewClassToSystem(e.parameter.className);
  } else {
    res = { error: 'Unknown action' };
  }

  return ContentService.createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}

// ពិនិត្យមើលឈ្មោះ Sheet ថាត្រូវនឹងខែដែលបានជ្រើសរើសដែរឬទេ (ការពារមិនឱ្យច្រឡំខែ ១ ជាមួយ ១១ ឬ ១២)
function isSheetMatchingMonth(sheetName, primaryKeyword, m) {
  if (!sheetName.includes(primaryKeyword)) return false;

  const khmerNums = { 1: '១', 2: '២', 3: '៣', 4: '៤', 5: '៥', 6: '៦', 7: '៧', 8: '៨', 9: '៩', 10: '១០', 11: '១១', 12: '១២' };
  const monthWords = {
    11: ['វិច្ឆិកា'],
    12: ['ធ្នូ'],
    1:  ['មករា'],
    2:  ['កុម្ភៈ'],
    3:  ['មីនា'],
    4:  ['មេសា'],
    5:  ['ឧសភា'],
    6:  ['មិថុនា'],
    7:  ['កក្កដា'],
    8:  ['សីហា']
  };

  // ១. ពិនិត្យតាមពាក្យឈ្មោះខែ
  const words = monthWords[m] || [];
  for (let i = 0; i < words.length; i++) {
    if (sheetName.includes(words[i])) return true;
  }

  // ២. ពិនិត្យតាមលេខខែ ដោយមិនឱ្យច្រឡំលេខ ១ ជាមួយ ១១ ឬ ១២
  const khM = khmerNums[m] || String(m);
  const padM = m < 10 ? '0' + m : String(m);
  const padKhM = m < 10 ? '០' + khM : khM;

  const pattern = new RegExp('(?:^|[^0-9០-៩])(?:' + m + '|' + padM + '|' + khM + '|' + padKhM + ')(?:[^0-9០-៩]|$)', 'u');
  return pattern.test(sheetName);
}

// ស្វែងរក Sheet ដោយស្វ័យប្រវត្តិ ធានាចំសន្លឹកនៃខែនោះផ្ទាល់
function getSheetForMonth(ss, type, month) {
  const allSheets = ss.getSheets();
  const m = parseInt(month) || (new Date().getMonth() + 1);
  const isSchool = (type === 'school');
  const primaryKeyword = isSchool ? 'សាលា' : 'ថ្នាក់';

  // ១. ស្វែងរក Sheet ជាក់លាក់នៃខែនោះ (ឧ. ទិន្នន័យសាលា_ខែ11, ទិន្នន័យសាលា_ខែ12...)
  for (let s of allSheets) {
    if (isSheetMatchingMonth(s.getName(), primaryKeyword, m)) {
      return s;
    }
  }

  // ២. បើពុំទាន់មាន Sheet ដាច់ដោយឡែកនៃខែនោះ ស្វែងរក Sheet គំរូដើម "ទិន្នន័យសាលា" ឬ "ទិន្នន័យថ្នាក់"
  for (let s of allSheets) {
    const name = s.getName().trim();
    if (name === (isSchool ? 'ទិន្នន័យសាលា' : 'ទិន្នន័យថ្នាក់')) {
      return s;
    }
  }

  // ៣. បើគ្មានទៀត ស្វែងរក Sheet ណាដែលមានពាក្យ "សាលា" ឬ "ថ្នាក់"
  for (let s of allSheets) {
    const name = s.getName();
    if (name.includes(primaryKeyword)) {
      return s;
    }
  }

  return allSheets[0];
}

function parseDayNumber(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  if (val instanceof Date) return val.getDate();

  const khmerDigits = {'០':0, '១':1, '២':2, '៣':3, '៤':4, '៥':5, '៦':6, '៧':7, '៨':8, '៩':9};
  const str = String(val).trim();
  let converted = '';
  for (let ch of str) {
    if (khmerDigits[ch] !== undefined) {
      converted += khmerDigits[ch];
    } else if (ch >= '0' && ch <= '9') {
      converted += ch;
    }
  }
  const parsed = parseInt(converted, 10);
  return isNaN(parsed) ? null : parsed;
}

// ស្វែងរកជួរដេកពិតប្រាកដដែលត្រូវនឹងថ្ងៃទីនោះ (Auto Scan Row 5 ដល់ 45)
function findRowForDay(sheet, targetDay) {
  const lastRow = Math.min(sheet.getLastRow(), 45);
  const target = parseInt(targetDay, 10);

  if (lastRow >= 5) {
    const colA = sheet.getRange(5, 1, lastRow - 4, 1).getValues();
    for (let i = 0; i < colA.length; i++) {
      const parsedDay = parseDayNumber(colA[i][0]);
      if (parsedDay === target) {
        return i + 5;
      }
    }

    const colB = sheet.getRange(5, 2, lastRow - 4, 1).getValues();
    for (let i = 0; i < colB.length; i++) {
      const parsedDay = parseDayNumber(colB[i][0]);
      if (parsedDay === target) {
        return i + 5;
      }
    }
  }

  return target + 6;
}

// ពិនិត្យមើលថាតើសន្លឹកថ្នាក់មាន ៧ ឬ ៨ ថ្នាក់
function detectClassCountInSheet(sheetClass) {
  try {
    const valAD5 = String(sheetClass.getRange('AD5').getValue() || '').trim();
    const valAD6 = String(sheetClass.getRange('AD6').getValue() || '').trim();
    if (valAD5.includes('សរុប') || valAD6.includes('សរុប')) {
      return 7; // មាន ៧ ថ្នាក់ (Col B ដល់ AC)
    }
  } catch (e) {}
  return 8;
}

function getSystemClassList(ss) {
  let sheet = ss.getSheetByName('បញ្ជីថ្នាក់');
  const defaultList = [
    { key: 'kindergarten_mid', name: 'ថ្នាក់មត្តេយ្យមធ្យម' },
    { key: 'kindergarten_high', name: 'ថ្នាក់មត្តេយ្យខ្ពស់' },
    { key: 'grade1', name: 'ថ្នាក់ទី១' },
    { key: 'grade2', name: 'ថ្នាក់ទី២' },
    { key: 'grade3', name: 'ថ្នាក់ទី៣' },
    { key: 'grade4', name: 'ថ្នាក់ទី៤' },
    { key: 'grade5', name: 'ថ្នាក់ទី៥' },
    { key: 'grade6', name: 'ថ្នាក់ទី៦' }
  ];

  if (!sheet) {
    sheet = ss.insertSheet('បញ្ជីថ្នាក់');
    sheet.getRange('A1:B1').setValues([['Key', 'Class Name']]).setFontWeight('bold');
    const rows = defaultList.map(c => [c.key, c.name]);
    sheet.getRange(2, 1, rows.length, 2).setValues(rows);
    return defaultList;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return defaultList;

  const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const list = [];
  data.forEach(r => {
    if (r[0] && r[1]) {
      list.push({ key: String(r[0]), name: String(r[1]) });
    }
  });

  return list.length > 0 ? list : defaultList;
}

function addNewClassToSystem(className) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('បញ្ជីថ្នាក់');
    if (!sheet) {
      getSystemClassList(ss);
      sheet = ss.getSheetByName('បញ្ជីថ្នាក់');
    }

    const newKey = 'custom_' + Date.now();
    sheet.appendRow([newKey, className]);

    const updatedList = getSystemClassList(ss);
    return { success: true, newKey: newKey, classList: updatedList };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ទាញយកទិន្នន័យប្រចាំថ្ងៃ និងសង្ខេបប្រចាំខែ (Auto Live)
function getInitialData(month, day) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const m = parseInt(month) || (new Date().getMonth() + 1);
  const d = parseInt(day) || new Date().getDate();

  const classList = getSystemClassList(ss);
  const sheetClass = getSheetForMonth(ss, 'class', m);
  const sheetSchool = getSheetForMonth(ss, 'school', m);

  const targetRowSchool = findRowForDay(sheetSchool, d);
  const targetRowClass = findRowForDay(sheetClass, d);

  const maxClassCols = Math.max(sheetClass.getLastColumn(), 60);
  const todayClassData = sheetClass.getRange(targetRowClass, 1, 1, maxClassCols).getValues()[0];
  const todaySchoolData = sheetSchool.getRange(targetRowSchool, 1, 1, 10).getValues()[0];

  // បែងចែកទិន្នន័យតាមថ្នាក់នីមួយៗចូលទៅក្នុង Map
  const classCount = detectClassCountInSheet(sheetClass);
  const classDataMap = {};
  let sumClassAtt = 0, sumClassFAtt = 0, sumClassEat = 0, sumClassFEat = 0;

  if (classCount === 7) {
    // ករណី Sheet មាន ៧ ថ្នាក់ដើម
    const mapping7 = [
      { key: 'kindergarten_mid', baseCol: 1 },
      { key: 'kindergarten_high', baseCol: -1 }, // ពុំមានក្នុង Sheet ៧ ថ្នាក់
      { key: 'grade1', baseCol: 5 },
      { key: 'grade2', baseCol: 9 },
      { key: 'grade3', baseCol: 13 },
      { key: 'grade4', baseCol: 17 },
      { key: 'grade5', baseCol: 21 },
      { key: 'grade6', baseCol: 25 }
    ];

    mapping7.forEach(mItem => {
      if (mItem.baseCol !== -1 && todayClassData.length > mItem.baseCol + 3) {
        const att = Number(todayClassData[mItem.baseCol]) || 0;
        const fAtt = Number(todayClassData[mItem.baseCol + 1]) || 0;
        const eat = Number(todayClassData[mItem.baseCol + 2]) || 0;
        const fEat = Number(todayClassData[mItem.baseCol + 3]) || 0;

        classDataMap[mItem.key] = { attend: att, femaleAttend: fAtt, eat: eat, femaleEat: fEat };
        sumClassAtt += att; sumClassFAtt += fAtt; sumClassEat += eat; sumClassFEat += fEat;
      } else {
        classDataMap[mItem.key] = { attend: 0, femaleAttend: 0, eat: 0, femaleEat: 0 };
      }
    });
  } else {
    // ករណី Sheet មាន ៨ ថ្នាក់ឡើងទៅ
    classList.forEach((c, idx) => {
      const base = 1 + (idx * 4);
      // Col 33 (index 33, Col AH) ជាជួរឈរសរុប (Total) មិនត្រូវយកមកអានជាថ្នាក់រៀនទេ
      if (idx >= 8 && base >= 33) {
        classDataMap[c.key] = { attend: 0, femaleAttend: 0, eat: 0, femaleEat: 0 };
        return;
      }

      if (todayClassData.length > base + 3) {
        const att = Number(todayClassData[base]) || 0;
        const fAtt = Number(todayClassData[base + 1]) || 0;
        const eat = Number(todayClassData[base + 2]) || 0;
        const fEat = Number(todayClassData[base + 3]) || 0;

        classDataMap[c.key] = { attend: att, femaleAttend: fAtt, eat: eat, femaleEat: fEat };
        sumClassAtt += att; sumClassFAtt += fAtt; sumClassEat += eat; sumClassFEat += fEat;
      } else {
        classDataMap[c.key] = { attend: 0, femaleAttend: 0, eat: 0, femaleEat: 0 };
      }
    });
  }

  // ទិន្នន័យសាលា
  let totalAttend = Number(todaySchoolData[2]) || sumClassAtt;
  let femaleAttend = Number(todaySchoolData[3]) || sumClassFAtt;
  let totalEat = Number(todaySchoolData[4]) || sumClassEat;
  let femaleEat = Number(todaySchoolData[5]) || sumClassFEat;
  let riceToday = Number(todaySchoolData[6]) || 0;
  let oilToday = Number(todaySchoolData[7]) || 0;
  let saltToday = Number(todaySchoolData[8]) || 0;
  const menu = todaySchoolData[9] || '';

  // គណនាគ្រឿងឧបភោគបើពុំទាន់កត់ត្រា
  if (totalEat > 0 && riceToday === 0) {
    riceToday = Number((totalEat * 0.115).toFixed(3));
    oilToday = Number((totalEat * 0.005).toFixed(3));
    saltToday = Number((totalEat * 0.001).toFixed(3));
  }

  // សង្ខេបប្រចាំខែ
  const lastRow = Math.min(sheetSchool.getLastRow(), 40);
  let recordedDays = 0;
  let cookedDays = 0;
  let totalEatSum = 0; // ផលបូកសិស្សហូបសរុបក្នុងខែ
  let totalMonthRice = 0;
  let totalMonthOil = 0;
  let totalMonthSeasoning = 0;

  if (lastRow >= 7) {
    const schoolDataRange = sheetSchool.getRange(7, 1, lastRow - 6, 10).getValues();
    schoolDataRange.forEach(row => {
      const cookFlag = String(row[1] || '').trim();
      const att = Number(row[2]) || 0;
      const eat = Number(row[4]) || 0;
      const r = Number(row[6]) || 0;
      const o = Number(row[7]) || 0;
      const s = Number(row[8]) || 0;

      // ថ្ងៃបានចម្អិន (មានសិស្សហូប > 0 ឬ បានចម្អិន = "បាទ/ចាស" ឬ អង្ករ > 0)
      if (eat > 0 || cookFlag === 'បាទ/ចាស' || r > 0) {
        cookedDays++;
        totalEatSum += eat;
      }

      if (att > 0 || eat > 0 || r > 0) {
        recordedDays++;
      }

      totalMonthRice += r;
      totalMonthOil += o;
      totalMonthSeasoning += s;
    });
  }

  // មធ្យម/ថ្ងៃ = (ផលបូកសិស្សហូបសរុបក្នុងខែ / ចំនួនថ្ងៃបានចម្អិន)
  const daysCount = cookedDays > 0 ? cookedDays : (recordedDays > 0 ? recordedDays : 0);
  const avgStudents = daysCount > 0 ? Math.round(totalEatSum / daysCount) : 0;

  return {
    month: m,
    day: d,
    spreadsheetId: ss.getId(),
    schoolSheetGid: sheetSchool.getSheetId(),
    schoolSheetName: sheetSchool.getName(),
    classSheetGid: sheetClass.getSheetId(),
    classSheetName: sheetClass.getName(),
    classList: classList,
    todayData: {
      totalClassData: todayClassData,
      totalAttend: totalAttend,
      femaleAttend: femaleAttend,
      totalEat: totalEat,
      femaleEat: femaleEat,
      riceToday: riceToday,
      oilToday: oilToday,
      saltToday: saltToday,
      menu: menu,
      classes: classDataMap // បញ្ជូនទិន្នន័យថ្នាក់ជាក់លាក់មកផ្ទាល់
    },
    monthSummary: {
      recordedDays: recordedDays,
      cookedDays: cookedDays,
      totalEatSum: totalEatSum,
      totalRice: Number(totalMonthRice.toFixed(2)),
      totalOil: Number(totalMonthOil.toFixed(3)),
      totalSeasoning: Number(totalMonthSeasoning.toFixed(3)),
      avgStudents: avgStudents
    }
  };
}

// រក្សាទុកទិន្នន័យប្រចាំថ្ងៃចូលក្នុង Google Sheets
function saveDailyRecord(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const m = parseInt(data.month);
    const d = parseInt(data.day);

    const sheetClass = getSheetForMonth(ss, 'class', m);
    const sheetSchool = getSheetForMonth(ss, 'school', m);

    const rowClass = findRowForDay(sheetClass, d);
    const rowSchool = findRowForDay(sheetSchool, d);

    const classValues = [];
    const list = data.classList || getSystemClassList(ss);

    let sumTotalAttend = 0;
    let sumTotalFemaleAttend = 0;
    let sumTotalEat = 0;
    let sumTotalFemaleEat = 0;

    list.forEach(c => {
      const classData = (data.classes && data.classes[c.key]) || { attend: 0, femaleAttend: 0, eat: 0, femaleEat: 0 };
      const att = Number(classData.attend) || 0;
      const fAtt = Number(classData.femaleAttend) || 0;
      const eat = Number(classData.eat) || 0;
      const fEat = Number(classData.femaleEat) || 0;

      classValues.push(att, fAtt, eat, fEat);

      sumTotalAttend += att;
      sumTotalFemaleAttend += fAtt;
      sumTotalEat += eat;
      sumTotalFemaleEat += fEat;
    });

    classValues.push(sumTotalAttend, sumTotalFemaleAttend, sumTotalEat, sumTotalFemaleEat);

    sheetClass.getRange(rowClass, 2, 1, classValues.length).setValues([classValues]);

    sheetSchool.getRange(rowSchool, 2, 1, 9).setValues([[
      data.cookRice ? 'បាទ/ចាស' : 'ទេ',
      sumTotalAttend,
      sumTotalFemaleAttend,
      sumTotalEat,
      sumTotalFemaleEat,
      Number(data.rice) || 0,
      Number(data.oil) || 0,
      Number(data.seasoning) || 0,
      data.menuNote || ''
    ]]);

    return { success: true, message: `បានរក្សាទុកទិន្នន័យ ថ្ងៃទី ${d} ខែ ${m} ដោយជោគជ័យ!` };
  } catch (err) {
    return { success: false, message: 'មានបញ្ហាក្នុងការរក្សាទុក៖ ' + err.toString() };
  }
}
