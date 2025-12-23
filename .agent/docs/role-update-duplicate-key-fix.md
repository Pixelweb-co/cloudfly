# Role Update Duplicate Key Error - FIXED

## Problem
When updating a role's permissions, the application was throwing this error:
```
SQL Error: 1062, SQLState: 23000
Duplicate entry '2-5' for key 'role_module_permissions.UK3hevfk4cc05y3et44d25bd5jp'
```

**Error Location:** `AL ACTUALIZAR EL ROL` (when updating role)

## Root Cause
The `RoleService.saveRole()` method was experiencing a **race condition** during role updates:

1. It called `role.getPermissions().clear()` to remove existing permissions
2. Then immediately added new permissions to the collection
3. **However**, Hibernate was not flushing the deletions to the database before attempting to insert the new permissions
4. This caused a unique constraint violation on the `(role_id, module_action_id)` combination

## The Fix
**File:** `backend/src/main/java/com/app/starter1/persistence/services/RoleService.java`

### Changes Made:
1. **Injected `EntityManager`** to access Hibernate's flush functionality:
```java
@PersistenceContext
private EntityManager entityManager;
```

2. **Added explicit flush** after clearing permissions:
```java
role.getPermissions().clear();

// CRITICAL: Flush to ensure deletions are committed to DB before new inserts
// This prevents duplicate key violations on the unique constraint (role_id, module_action_id)
entityManager.flush();
```

## How It Works Now
1. Fetch the existing role from database
2. Clear all existing permissions from the collection
3. **Flush changes to database** - ensures DELETE statements are executed immediately
4. Add new permissions to the collection
5. Save the role - Hibernate inserts the new permissions without constraint violations

## Database Constraint
The constraint that was being violated:
```sql
UNIQUE CONSTRAINT (role_id, module_action_id) 
-- Named: UK3hevfk4cc05y3et44d25bd5jp
```

This ensures each role can have only ONE permission record per module action.

## Testing
Try updating a role with the same or different permissions - the duplicate key error should no longer occur.

## Technical Notes
- The `Role` entity has `orphanRemoval = true` on the permissions relationship
- This triggers DELETE operations when items are removed from the collection
- However, without explicit flush, these DELETEs might not execute before INSERTs
- The `entityManager.flush()` forces immediate execution of pending SQL operations
