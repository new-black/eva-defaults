const fs = require('fs');
const path = require('path');

test('validate appsettings.json for duplicate entries', () => {
  const appSettingsPath = path.join(__dirname, '../appsettings.json');
  const appSettings = JSON.parse(fs.readFileSync(appSettingsPath, 'utf8'));

  const nameSet = new Set();
  const duplicates = [];

  appSettings.forEach(setting => {
    if (nameSet.has(setting.Name)) {
      duplicates.push(setting.Name);
    } else {
      nameSet.add(setting.Name);
    }
  });

  expect(duplicates).toEqual([]);
});
