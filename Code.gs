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

  // ប្រសិនបើបើកផ្ទាល់ក្នុង Google Apps Script Web App
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('ប្រព័ន្ធកត់ត្រាវត្តមាន និងអាហារសិស្ស - សាលាបឋមសិក្សាថ្លុកដង្កោ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

function doPost(e) {
  try {
    const rawData = e.postData.contents;
    const body = JSON.parse(rawData);
    const pin = body.pin || (e.parameter && e.parameter.pin);

    // ពិនិត្យលេខកូដសម្ងាត់ PIN 168
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

  // ពិនិត្យលេខកូដសម្ងាត់ PIN 168
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

// ស្វែងរក Sheet តាមខែដោយឆ្លាតវៃ
function getSheetForMonth(ss, type, month) {
  const khmerNums = { 1: '១', 2: '២', 3: '៣', 4: '៤', 5: '៥', 6: '៦', 7: '៧', 8: '៨', 9: '៩', 10: '១០', 11: '១១', 12: '១២' };
  const khMonth = khmerNums[month] || month;
  const baseName = (type === 'school') ? 'ទិន្នន័យសាលា' : 'ទិន្នន័យថ្នាក់';

  const candidateNames = [
    `${baseName}_ខែ${month}`,
    `${baseName}_ខែ${khMonth}`,
    `${baseName} ខែ${month}`,
    `${baseName} ខែ${khMonth}`,
    `${baseName}_${month}`,
    `${baseName}${month}`,
    `ខែ${month}`,
    `ខែ${khMonth}`,
    baseName
  ];

  for (let name of candidateNames) {
    const s = ss.getSheetByName(name);
    if (s) return s;
  }

  const template = ss.getSheetByName(baseName);
  if (template) {
    const newName = `${baseName}_ខែ${month}`;
    return template.copyTo(ss).setName(newName);
  }

  return ss.getSheets()[0];
}

// ស្វែងរកជួរដេកពិតប្រាកដដែលត្រូវនឹងថ្ងៃទីនោះ (Auto Scan Column A)
function findRowForDay(sheet, targetDay) {
  const lastRow = Math.min(sheet.getLastRow(), 45);
  if (lastRow < 7) return targetDay + 6;

  const colA = sheet.getRange(7, 1, lastRow - 6, 1).getValues();
  for (let i = 0; i < colA.length; i++) {
    const val = colA[i][0];
    if (Number(val) === Number(targetDay)) {
      return i + 7;
    }
    if (val instanceof Date && val.getDate() === Number(targetDay)) {
      return i + 7;
    }
    if (typeof val === 'string' && val.includes(String(targetDay))) {
      return i + 7;
    }
  }

  return targetDay + 6;
}

// ទាញយកបញ្ជីថ្នាក់ឱ្យជាប់ក្នុងប្រព័ន្ធជាអចិន្ត្រៃយ៍
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

  const targetRow = findRowForDay(sheetSchool, d);
  const maxClassCols = Math.max(sheetClass.getLastColumn(), 60);

  const todayClassData = sheetClass.getRange(targetRow, 1, 1, maxClassCols).getValues()[0];
  const todaySchoolData = sheetSchool.getRange(targetRow, 1, 1, 10).getValues()[0];

  let totalAttend = Number(todaySchoolData[2]) || 0;
  let femaleAttend = Number(todaySchoolData[3]) || 0;
  let totalEat = Number(todaySchoolData[4]) || 0;
  let femaleEat = Number(todaySchoolData[5]) || 0;
  let riceToday = Number(todaySchoolData[6]) || 0;
  let oilToday = Number(todaySchoolData[7]) || 0;
  let saltToday = Number(todaySchoolData[8]) || 0;
  const menu = todaySchoolData[9] || '';

  if (totalAttend === 0 && totalEat === 0 && todayClassData.length > 5) {
    classList.forEach((c, idx) => {
      const base = 1 + (idx * 4);
      if (todayClassData.length > base + 3) {
        totalAttend += Number(todayClassData[base]) || 0;
        femaleAttend += Number(todayClassData[base + 1]) || 0;
        totalEat += Number(todayClassData[base + 2]) || 0;
        femaleEat += Number(todayClassData[base + 3]) || 0;
      }
    });
  }

  if (totalEat > 0 && riceToday === 0) {
    riceToday = Number((totalEat * 0.115).toFixed(3));
    oilToday = Number((totalEat * 0.005).toFixed(3));
    saltToday = Number((totalEat * 0.001).toFixed(3));
  }

  const lastRow = Math.min(sheetSchool.getLastRow(), 37);
  let recordedDays = 0;
  let totalMonthRice = 0;
  let totalMonthOil = 0;
  let totalMonthSeasoning = 0;
  let totalStudentsSum = 0;

  if (lastRow >= 7) {
    const schoolDataRange = sheetSchool.getRange(7, 1, lastRow - 6, 10).getValues();
    schoolDataRange.forEach(row => {
      const att = Number(row[2]) || 0;
      const eat = Number(row[4]) || 0;
      const r = Number(row[6]) || 0;
      const o = Number(row[7]) || 0;
      const s = Number(row[8]) || 0;

      if (att > 0 || eat > 0 || r > 0) {
        recordedDays++;
        totalStudentsSum += att;
      }
      totalMonthRice += r;
      totalMonthOil += o;
      totalMonthSeasoning += s;
    });
  }

  const avgStudents = recordedDays > 0 ? Math.round(totalStudentsSum / recordedDays) : 0;

  return {
    month: m,
    day: d,
    spreadsheetId: ss.getId(),
    schoolSheetGid: sheetSchool.getSheetId(),
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
      menu: menu
    },
    monthSummary: {
      recordedDays: recordedDays,
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

    const row = findRowForDay(sheetSchool, d);
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

    sheetClass.getRange(row, 2, 1, classValues.length).setValues([classValues]);

    sheetSchool.getRange(row, 2, 1, 9).setValues([[
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
