import assert from 'node:assert/strict';
import test from 'node:test';
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { clearSupabaseUserData, seedSampleDataForUser } from '../supabaseDataManagement.ts';

type DeleteErrorConfig = {
  eq?: PostgrestError | null;
  in?: PostgrestError | null;
};

interface MockOptions {
  taskIds?: string[];
  errors?: {
    select?: Record<string, PostgrestError | null>;
    delete?: Record<string, DeleteErrorConfig>;
    insert?: Record<string, PostgrestError | null>;
  };
}

const createMockSupabase = (options: MockOptions = {}) => {
  const operations: any[] = [];
  const { taskIds = [], errors = {} } = options;

  const makeResponse = <T>(data: T, error: PostgrestError | null = null) =>
    Promise.resolve({ data, error });

  return {
    operations,
    from(table: string) {
      operations.push({ type: 'from', table });
      return {
        select: (columns: string) => {
          operations.push({ type: 'select', table, columns });
          return {
            eq: (column: string, value: unknown) => {
              operations.push({ type: 'eq', stage: 'select', table, column, value });
              const error = errors.select?.[table] ?? null;
              const data = table === 'tasks' ? taskIds.map(id => ({ id })) : [];
              return makeResponse(data, error);
            }
          };
        },
        delete: () => {
          operations.push({ type: 'delete', table });
          return {
            eq: (column: string, value: unknown) => {
              operations.push({ type: 'eq', stage: 'delete', table, column, value });
              const tableErrors = errors.delete?.[table];
              const error = tableErrors?.eq ?? null;
              return makeResponse(null, error);
            },
            in: (column: string, values: unknown[]) => {
              operations.push({ type: 'in', table, column, values });
              const tableErrors = errors.delete?.[table];
              const error = tableErrors?.in ?? null;
              return makeResponse(null, error);
            }
          };
        },
        insert: (payload: unknown) => {
          operations.push({ type: 'insert', table, payload });
          const error = errors.insert?.[table] ?? null;
          return makeResponse(null, error);
        }
      };
    }
  };
};

test('clearSupabaseUserData clears user scoped tables and dependencies', async () => {
  const mock = createMockSupabase({ taskIds: ['task-1', 'task-2'] });

  await clearSupabaseUserData(mock as unknown as SupabaseClient, 'user-123');

  const dependencyDeletes = mock.operations.filter(op => op.type === 'in' && op.table === 'task_dependencies');
  assert.strictEqual(dependencyDeletes.length, 2);
  assert.strictEqual(dependencyDeletes[0].column, 'task_id');
  assert.deepStrictEqual(dependencyDeletes[0].values, ['task-1', 'task-2']);
  assert.strictEqual(dependencyDeletes[1].column, 'depends_on_task_id');

  const clearedTables = mock.operations
    .filter(op => op.type === 'eq' && op.stage === 'delete')
    .map(op => op.table)
    .sort();

  const expectedTables = [
    'app_settings',
    'categories',
    'daily_plans',
    'journal_entries',
    'projects',
    'recurring_tasks',
    'tasks',
    'work_schedules',
    'work_shifts'
  ].sort();

  assert.deepStrictEqual(clearedTables, expectedTables);
});

test('clearSupabaseUserData ignores missing table errors', async () => {
  const missingTableError = {
    code: 'PGRST106',
    message: 'relation "daily_plans" does not exist'
  } as PostgrestError;

  const mock = createMockSupabase({
    errors: {
      select: { tasks: missingTableError },
      delete: {
        daily_plans: { eq: missingTableError },
        task_dependencies: { in: missingTableError }
      }
    }
  });

  await assert.doesNotReject(() =>
    clearSupabaseUserData(mock as unknown as SupabaseClient, 'user-456')
  );
});

test('seedSampleDataForUser inserts curated starter records', async () => {
  const mock = createMockSupabase();

  await seedSampleDataForUser(mock as unknown as SupabaseClient, 'user-789');

  const insertOperations = mock.operations.filter(op => op.type === 'insert');
  assert.strictEqual(insertOperations.length, 3);

  const categoriesInsert = insertOperations.find(op => op.table === 'categories');
  assert.ok(categoriesInsert);
  assert.strictEqual(categoriesInsert.payload.length, 3);
  assert.ok(categoriesInsert.payload.every((cat: any) => cat.user_id === 'user-789'));

  const projectsInsert = insertOperations.find(op => op.table === 'projects');
  assert.ok(projectsInsert);
  assert.strictEqual(projectsInsert.payload.length, 2);
  assert.ok(projectsInsert.payload.every((project: any) => project.user_id === 'user-789'));

  const tasksInsert = insertOperations.find(op => op.table === 'tasks');
  assert.ok(tasksInsert);
  assert.strictEqual(tasksInsert.payload.length, 5);
  assert.ok((tasksInsert.payload as any[]).some(task => task.parent_task_id !== null));
});
