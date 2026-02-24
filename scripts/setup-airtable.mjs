import fs from 'fs';
import path from 'path';

// Helper to load .env.local
const loadEnv = () => {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
      const [key, ...value] = line.split('=');
      if (key && value) {
        env[key.trim()] = value.join('=').trim();
      }
    });
    return env;
  } catch (e) {
    console.error('Error loading .env.local:', e.message);
    return {};
  }
};

const env = loadEnv();
const API_KEY = env.AIRTABLE_API_KEY;
const BASE_ID = env.AIRTABLE_BASE_ID;

if (!API_KEY || !BASE_ID) {
  console.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID in .env.local');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

const getTables = async (baseId) => {
  const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to fetch tables: ${JSON.stringify(data)}`);
  }
  return data.tables;
};

const createTable = async (baseId, tableConfig) => {
  console.log(`Creating table "${tableConfig.name}"...`);
  const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    method: 'POST',
    headers,
    body: JSON.stringify(tableConfig)
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('API Error:', JSON.stringify(data, null, 2));
    throw new Error(`Failed to create table ${tableConfig.name}`);
  }
  console.log(`Table "${tableConfig.name}" created successfully.`);
  return data;
};

async function setup() {
  try {
    const existingTables = await getTables(BASE_ID);
    let studentsTable = existingTables.find(t => t.name === "Students");
    let attendanceTable = existingTables.find(t => t.name === "Attendance");

    // 1. Create or verify Students Table
    if (!studentsTable) {
      const studentsConfig = {
        name: "Students",
        description: "Table des apprenants",
        fields: [
          { name: "firstName", type: "singleLineText" },
          { name: "lastName", type: "singleLineText" },
          {
            name: "classId",
            type: "singleSelect",
            options: {
              choices: [{ name: "morning" }, { name: "afternoon" }]
            }
          },
          {
            name: "createdAt",
            type: "dateTime",
            options: {
              timeZone: "utc",
              timeFormat: { name: "24hour" },
              dateFormat: { name: "iso" }
            }
          }
        ]
      };
      studentsTable = await createTable(BASE_ID, studentsConfig);
    } else {
      console.log('Table "Students" already exists.');
    }

    // 2. Create or verify Attendance Table
    if (!attendanceTable) {
      const attendanceConfig = {
        name: "Attendance",
        description: "Table des présences",
        fields: [
          {
            name: "id",
            type: "singleLineText"
          },
          {
            name: "studentId",
            type: "multipleRecordLinks",
            options: {
              linkedTableId: studentsTable.id
            }
          },
          { name: "date", type: "singleLineText" },
          {
            name: "classId",
            type: "singleSelect",
            options: {
              choices: [{ name: "morning" }, { name: "afternoon" }]
            }
          },
          {
            name: "present",
            type: "checkbox",
            options: { icon: "check", color: "greenBright" }
          },
          {
            name: "arrivalTime",
            type: "singleLineText"
          }
        ]
      };
      // Note: During table creation, some complex link options might fail. 
      // We try simple first, then we can add details if needed.
      attendanceTable = await createTable(BASE_ID, attendanceConfig);
    } else {
      console.log('Table "Attendance" already exists.');
    }

    // 3. Create or verify Settings Table
    let settingsTable = existingTables.find(t => t.name === "Settings");
    if (!settingsTable) {
      const settingsConfig = {
        name: "Settings",
        description: "Paramètres globaux de l'application",
        fields: [
          { name: "key", type: "singleLineText" },
          { name: "value", type: "singleLineText" },
          { name: "description", type: "singleLineText" }
        ]
      };
      settingsTable = await createTable(BASE_ID, settingsConfig);
      
      // Initial data for Settings (optional: we can't easily bulk add fields with initial data in one POST /tables call, 
      // but we can suggest the user to fill them or use another script).
      console.log('Table "Settings" created. Please add FORMATION_START and FORMATION_END records.');
    } else {
      console.log('Table "Settings" already exists.');
    }

    console.log('\nSetup completed successfully! \nYour Airtable base is now ready to use.');
  } catch (error) {
    console.error('\nSetup failed:');
    console.error(error.message);
  }
}

setup();
