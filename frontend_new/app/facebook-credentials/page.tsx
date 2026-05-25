import { useEffect, useState } from 'react';
import { Metadata } from 'next';
import { Button, Input, Card, Typography } from '@nextui-org/react';

export const metadata: Metadata = {
  title: 'Facebook API Credentials',
  description: 'Configure Facebook API credentials for marketing agent',
};

const getTenant = () => localStorage.getItem('activeTenantId') ?? 'unknown';
const getCompany = () => localStorage.getItem('activeCompanyId') ?? 'unknown';

export default function FacebookCredentialsPage() {
  const [tenant, setTenant] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [appId, setAppId] = useState<string>('');
  const [appSecret, setAppSecret] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [pageId, setPageId] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    setTenant(getTenant());
    setCompany(getCompany());
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/facebook/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant,
          companyId: company,
          appId,
          appSecret,
          accessToken,
          pageId,
        }),
      });
      if (!res.ok) throw new Error('Network response was not ok');
      setMessage('Credentials saved successfully');
    } catch (e) {
      setMessage(`Error: ${(e as Error).message}`);
    }
  };

  return (
    <Card css={{ mw: '600px', margin: 'auto', mt: 20 }}>
      <Card.Body>
        <Typography h3>Facebook API Credentials</Typography>
        <Typography>Tenant: {tenant}</Typography>
        <Typography>Company: {company}</Typography>
        <Input
          clearable
          bordered
          fullWidth
          label="App ID"
          placeholder="Enter Facebook App ID"
          value={appId}
          onChange={(e) => setAppId(e.target.value)}
        />
        <Input.Password
          clearable
          bordered
          fullWidth
          label="App Secret"
          placeholder="Enter Facebook App Secret"
          value={appSecret}
          onChange={(e) => setAppSecret(e.target.value)}
        />
        <Input.Password
          clearable
          bordered
          fullWidth
          label="Access Token"
          placeholder="Enter Facebook Access Token"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
        />
        <Input
          clearable
          bordered
          fullWidth
          label="Page ID"
          placeholder="Enter Facebook Page ID"
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
        />
        <Button auto color="primary" onClick={handleSave} css={{ mt: 10 }}>
          Save
        </Button>
        {message && <Typography css={{ mt: 10 }}>{message}</Typography>}
      </Card.Body>
    </Card>
  );
}
