/**
 * Mock Prisma Client for Static Export Builds
 *
 * Uses JS Proxy to intercept all Prisma calls and return
 * sensible defaults so the static build succeeds without a database.
 */

const methodDefaults: Record<string, unknown> = {
  findMany: [],
  findFirst: null,
  findUnique: null,
  findFirstOrThrow: null,
  findUniqueOrThrow: null,
  create: {},
  createMany: { count: 0 },
  update: {},
  updateMany: { count: 0 },
  upsert: {},
  delete: {},
  deleteMany: { count: 0 },
  count: 0,
  aggregate: {},
  groupBy: [],
};

function createModelProxy() {
  return new Proxy(
    {},
    {
      get(_target, method: string) {
        if (method === 'then') return undefined;
        const defaultValue = methodDefaults[method] ?? null;
        return async () => defaultValue;
      },
    }
  );
}

export const prismaMock = new Proxy(
  {},
  {
    get(_target, prop: string) {
      if (prop === '$connect' || prop === '$disconnect') {
        return async () => {};
      }
      if (prop === '$transaction') {
        return async (fn: unknown) => {
          if (typeof fn === 'function') return fn(prismaMock);
          return [];
        };
      }
      if (prop === 'then') return undefined;
      return createModelProxy();
    },
  }
) as unknown;
