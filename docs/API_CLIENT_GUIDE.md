# API Client Usage Guide

## Overview

The `api-client.ts` provides a robust wrapper around `fetch` with automatic error handling for:
- ✅ Session expiration (single session enforcement)
- ✅ Authentication errors (401, 403)
- ✅ Network errors
- ✅ Non-JSON responses (HTML redirects)
- ✅ Server errors (500, etc)

## Basic Usage

### Import

```typescript
import api from '@/lib/api-client';
// or
import { apiClient } from '@/lib/api-client';
```

### GET Request

```typescript
// Before (old way - no error handling):
const response = await fetch('/api/doctor/patients');
const data = await response.json(); // ❌ Can crash with "Unexpected token '<'"

// After (with api client):
try {
  const patients = await api.get('/api/doctor/patients');
  console.log(patients); // ✅ Automatically handles errors
} catch (error) {
  // Error already handled (redirected to login if session expired)
  console.error('Failed to fetch patients:', error);
}
```

### POST Request

```typescript
// Create new patient
try {
  const newPatient = await api.post('/api/patients', {
    nama: 'John Doe',
    nik: '1234567890',
    tanggal_lahir: '1990-01-01',
  });
  
  console.log('Patient created:', newPatient);
} catch (error) {
  console.error('Failed to create patient:', error);
}
```

### PUT/PATCH Request

```typescript
// Update patient
try {
  const updated = await api.patch('/api/patients/123', {
    nama: 'Jane Doe',
  });
  
  console.log('Patient updated:', updated);
} catch (error) {
  console.error('Failed to update patient:', error);
}
```

### DELETE Request

```typescript
try {
  await api.delete('/api/patients/123');
  console.log('Patient deleted');
} catch (error) {
  console.error('Failed to delete patient:', error);
}
```

## React Component Example

### Before (Without Error Handling)

```typescript
// ❌ BAD - No error handling
function PatientList() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetch('/api/doctor/patients')
      .then(res => res.json()) // Can crash!
      .then(data => setPatients(data));
  }, []);

  return <div>{/* ... */}</div>;
}
```

### After (With API Client)

```typescript
// ✅ GOOD - Proper error handling
import api from '@/lib/api-client';

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/api/doctor/patients');
      setPatients(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* Render patients */}</div>;
}
```

## Error Handling

### Automatic Redirects

The API client automatically handles session expiration:

```typescript
// User's session expired (single session enforcement)
await api.get('/api/doctor/patients');
// → Automatically redirects to /login?reason=session_expired
// → Shows message: "Sesi Anda telah berakhir. Silakan login kembali."
```

### Manual Error Handling

```typescript
import { ApiClientError } from '@/lib/api-client';

try {
  const data = await api.get('/api/some-endpoint');
} catch (error) {
  if (error instanceof ApiClientError) {
    switch (error.code) {
      case 'SESSION_EXPIRED':
        // Already redirected to login
        break;
      case 'FORBIDDEN':
        alert('You do not have permission');
        break;
      case 'NOT_FOUND':
        alert('Resource not found');
        break;
      case 'SERVER_ERROR':
        alert('Server error - please try again');
        break;
      default:
        alert(error.message);
    }
  }
}
```

## Advanced Usage

### Custom Headers

```typescript
const data = await api.get('/api/endpoint', {
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

### Skip Auth (for public endpoints)

```typescript
// For public endpoints that don't need authentication
const data = await api.get('/api/public/data', {
  skipAuth: true,
});
```

### With TypeScript Types

```typescript
interface Patient {
  id: string;
  nama: string;
  nik: string;
}

// Type-safe API calls
const patients = await api.get<Patient[]>('/api/doctor/patients');
// patients is typed as Patient[]
```

## Migration Guide

### Migrating Existing Code

**Step 1:** Import the API client
```typescript
import api from '@/lib/api-client';
```

**Step 2:** Replace fetch calls

```typescript
// Before:
const response = await fetch('/api/endpoint');
const data = await response.json();

// After:
const data = await api.get('/api/endpoint');
```

**Step 3:** Add error handling

```typescript
try {
  const data = await api.get('/api/endpoint');
  // Use data
} catch (error) {
  // Handle error (session expiration is automatic)
  console.error('API Error:', error);
}
```

## Benefits

✅ **No more "Unexpected token '<'" errors**
- Automatically detects HTML responses and handles them

✅ **Automatic session expiration handling**
- Redirects to login when single session enforcement triggers

✅ **Consistent error handling**
- All API calls handle errors the same way

✅ **Better UX**
- User-friendly error messages
- Smooth redirects with context

✅ **Type-safe**
- Full TypeScript support

## Common Patterns

### Loading States

```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await api.post('/api/endpoint', data);
    alert('Success!');
  } catch (error) {
    // Error already handled
  } finally {
    setLoading(false);
  }
};
```

### Refresh Data After Action

```typescript
const handleDelete = async (id: string) => {
  try {
    await api.delete(`/api/patients/${id}`);
    // Refresh list
    await loadPatients();
  } catch (error) {
    console.error('Delete failed:', error);
  }
};
```

### Form Submission

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const result = await api.post('/api/patients', formData);
    router.push(`/patients/${result.id}`);
  } catch (error: any) {
    setError(error.message);
  }
};
```

## Testing

The API client makes testing easier:

```typescript
// Mock the api client in tests
jest.mock('@/lib/api-client', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

// In test:
import api from '@/lib/api-client';

(api.get as jest.Mock).mockResolvedValue({ data: 'test' });
```

## Summary

The API client provides:
- 🔒 **Security**: Automatic session validation
- 🛡️ **Reliability**: Comprehensive error handling
- 🎯 **Simplicity**: Clean, consistent API
- 📝 **Type Safety**: Full TypeScript support
- 🚀 **Better UX**: User-friendly error messages

**Use it for ALL API calls in your application!**
