/**
 * API-level CRUD verification for Contacts module
 * Tests: Login -> Create -> Read -> Update -> Delete
 */
async function runCrudTest() {
    const API = 'https://api.cloudfly.com.co';
    const USER = 'pipe_1775608262000';
    const PASS = 'widowmaker';

    console.log('=== CONTACTS API CRUD TEST ===\n');

    // 1. LOGIN
    console.log('[1/5] Logging in...');
    const loginRes = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: USER, password: PASS })
    });
    const loginData = await loginRes.json();
    if (!loginData.jwt) {
        console.error('LOGIN FAILED:', loginData);
        return;
    }
    const token = loginData.jwt;
    const companyId = loginData.user?.activeCompanyId || loginData.user?.company_id;
    console.log(`  OK - Token obtained, companyId=${companyId}`);

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. CREATE
    console.log('\n[2/5] Creating contact...');
    const contactData = {
        name: 'API CRUD Test ' + Date.now(),
        email: 'api_test@cloudfly.com',
        phone: '3001234567',
        type: 'LEAD',
        stage: 'LEAD',
        documentType: 'CC',
        documentNumber: '12345678',
        isActive: true
    };
    const createUrl = `${API}/api/v1/contacts${companyId ? '?companyId=' + companyId : ''}`;
    const createRes = await fetch(createUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(contactData)
    });
    const createText = await createRes.text();
    console.log(`  Status: ${createRes.status}`);
    if (!createRes.ok) {
        console.error('  CREATE FAILED:', createText);
        return;
    }
    const created = JSON.parse(createText);
    console.log(`  OK - Created contact id=${created.id}, name="${created.name}"`);

    // 3. READ (list)
    console.log('\n[3/5] Reading contacts list...');
    const listUrl = `${API}/api/v1/contacts${companyId ? '?companyId=' + companyId : ''}`;
    const listRes = await fetch(listUrl, { headers });
    const contacts = await listRes.json();
    const found = contacts.find(c => c.id === created.id);
    console.log(`  Status: ${listRes.status}, Total: ${contacts.length}`);
    console.log(`  Found created contact in list: ${!!found}`);

    // 4. UPDATE
    console.log('\n[4/5] Updating contact...');
    const updateData = { ...contactData, name: contactData.name + ' UPDATED', phone: '3009999999' };
    const updateUrl = `${API}/api/v1/contacts/${created.id}${companyId ? '?companyId=' + companyId : ''}`;
    const updateRes = await fetch(updateUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
    });
    const updateText = await updateRes.text();
    console.log(`  Status: ${updateRes.status}`);
    if (updateRes.ok) {
        const updated = JSON.parse(updateText);
        console.log(`  OK - Updated name="${updated.name}", phone="${updated.phone}"`);
    } else {
        console.error('  UPDATE FAILED:', updateText);
    }

    // 5. DELETE
    console.log('\n[5/5] Deleting contact...');
    const deleteUrl = `${API}/api/v1/contacts/${created.id}${companyId ? '?companyId=' + companyId : ''}`;
    const deleteRes = await fetch(deleteUrl, { method: 'DELETE', headers });
    console.log(`  Status: ${deleteRes.status}`);
    if (deleteRes.ok || deleteRes.status === 204) {
        console.log('  OK - Contact deleted');
    } else {
        console.error('  DELETE FAILED:', await deleteRes.text());
    }

    // Verify deletion
    const verifyRes = await fetch(listUrl, { headers });
    const remaining = await verifyRes.json();
    const stillExists = remaining.find(c => c.id === created.id);
    console.log(`  Verified deleted: ${!stillExists}`);

    console.log('\n=== ALL CRUD OPERATIONS COMPLETED ===');
}

runCrudTest().catch(e => console.error('FATAL:', e));
