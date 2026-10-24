type Result = { data?: unknown; error?: { message: string } | null };

const results = new Map<string, Result[]>();

/** Queue results for a table. Each `from(table)` call consumes one (last one repeats). */
export function mockTable(table: string, ...queued: Result[]) {
  results.set(table, queued);
}

export function resetSupabaseMock() {
  results.clear();
  calls.length = 0;
  supabaseMock.from.mockClear();
  supabaseMock.rpc.mockReset().mockResolvedValue({ data: null, error: null });
  supabaseMock.functions.invoke.mockReset().mockResolvedValue({ data: {}, error: null });
  supabaseMock.storage.from.mockClear();
  storageBucket.upload.mockReset().mockResolvedValue({ data: {}, error: null });
  storageBucket.getPublicUrl.mockReset().mockReturnValue({ data: { publicUrl: "https://x.supabase.co/storage/v1/object/public/bucket/u1/file.jpg" } });
  storageBucket.remove.mockReset().mockResolvedValue({ data: [], error: null });
  Object.values(supabaseMock.auth).forEach((fn) => {
    fn.mockReset();
    fn.mockResolvedValue({ data: {}, error: null });
  });
}

export const calls: { table: string; method: string; args: unknown[] }[] = [];

function next(table: string): Result {
  const queue = results.get(table) ?? [{ data: null, error: null }];
  const result = queue.length > 1 ? queue.shift()! : queue[0];
  return { data: null, error: null, ...result };
}

function builder(table: string) {
  const result = next(table);
  const chain: any = new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === "then") {
          return (resolve: (v: Result) => unknown) => resolve(result);
        }
        return (...args: unknown[]) => {
          calls.push({ table, method: prop, args });
          return chain;
        };
      },
    },
  );
  return chain;
}

export const storageBucket = {
  upload: jest.fn(),
  getPublicUrl: jest.fn(),
  remove: jest.fn(),
};

export const supabaseMock = {
  from: jest.fn((table: string) => builder(table)),
  rpc: jest.fn(),
  functions: { invoke: jest.fn() },
  storage: { from: jest.fn(() => storageBucket) },
  auth: {
    getSession: jest.fn(),
    getUser: jest.fn(),
    signOut: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signInWithOtp: jest.fn(),
    verifyOtp: jest.fn(),
    updateUser: jest.fn(),
    resetPasswordForEmail: jest.fn(),
  } as Record<string, jest.Mock>,
};

export const supabaseModule = { supabase: supabaseMock };
