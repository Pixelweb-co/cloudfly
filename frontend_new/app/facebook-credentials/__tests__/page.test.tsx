import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FacebookCredentialsPage from '../page';

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: (function () {
    let store: Record<string, string> = {};
    return {
      getItem(key: string) {
        return store[key] || null;
      },
      setItem(key: string, value: string) {
        store[key] = value.toString();
      },
      clear() {
        store = {};
      },
    };
  })(),
  writable: true,
});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
) as jest.Mock;

describe('FacebookCredentialsPage', () => {
  beforeEach(() => {
    (window.localStorage as any).setItem('activeTenantId', 'tenant-123');
    (window.localStorage as any).setItem('activeCompanyId', 'company-456');
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders tenant and company from localStorage', () => {
    render(<FacebookCredentialsPage />);
    expect(screen.getByText(/Tenant: tenant-123/)).toBeInTheDocument();
    expect(screen.getByText(/Company: company-456/)).toBeInTheDocument();
  });

  it('saves credentials and shows success message', async () => {
    render(<FacebookCredentialsPage />);
    fireEvent.change(screen.getByLabelText(/App ID/), { target: { value: 'app-id' } });
    fireEvent.change(screen.getByLabelText(/App Secret/), { target: { value: 'secret' } });
    fireEvent.change(screen.getByLabelText(/Access Token/), { target: { value: 'token' } });
    fireEvent.change(screen.getByLabelText(/Page ID/), { target: { value: 'page-1' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith('/api/facebook/credentials', expect.objectContaining({
      method: 'POST',
    }));
    expect(screen.getByText(/Credentials saved successfully/)).toBeInTheDocument();
  });
});
