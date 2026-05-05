const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

async function run() {
  try {
    console.log('Logging in...');
    const loginRes = await fetch('https://devdashboard.cloudfly.com.co/api/v1/users/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'manager',
        password: 'Password123!'
      })
    });
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Got token');

    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('Creating campaign for 00:00...');
    const campaignData = {
      name: "Campaña de Medianoche",
      description: "Prueba de ejecución a las 00:00",
      channelId: 1,
      audienceType: "LIST",
      sendingListId: 1,
      message: "¡Hola! Este es un mensaje de prueba de medianoche.",
      scheduledAt: "2026-05-05T00:00:00",
      status: "SCHEDULED",
      recurrence: "NONE",
      mediaType: "NONE",
      refType: "NONE"
    };

    const createRes = await fetch('https://devdashboard.cloudfly.com.co/api/v1/marketing/campaigns', {
      method: 'POST',
      headers,
      body: JSON.stringify(campaignData)
    });
    
    const createData = await createRes.json();
    const campaignId = createData.id;
    console.log(`Campaign created successfully! ID: ${campaignId}`);

    console.log('Updating campaign to trigger calendar sync...');
    const updateData = {
      ...createData,
      name: "Campaña de Medianoche (Actualizada)",
      message: "¡Hola! Este es un mensaje de prueba de medianoche (Actualizada)."
    };
    
    const updateRes = await fetch(`https://devdashboard.cloudfly.com.co/api/v1/marketing/campaigns/${campaignId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    });
    
    console.log('Campaign updated successfully!');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();
