// API configuration - using port 4000 instead of 4003
// perché il server proxy non è attualmente in esecuzione
const API_URL = 'http://localhost:4000';

// Generic fetch helpers
export async function getAll<T>(entity: string): Promise<T[]> {
  const res = await fetch(`${API_URL}/${entity}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getOne<T>(entity: string, id: string): Promise<T> {
  const res = await fetch(`${API_URL}/${entity}/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createOne<T>(entity: string, data: T): Promise<T> {
  const res = await fetch(`${API_URL}/${entity}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateOne<T>(entity: string, id: string, data: T): Promise<T> {
  const res = await fetch(`${API_URL}/${entity}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteOne(entity: string, id: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/${entity}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}