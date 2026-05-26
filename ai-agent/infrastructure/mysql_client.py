    async def get_contact_assigned_advisors(self, contact_id: int, tenant_id: int) -> List[str]:
        """Return phone numbers of advisors assigned to a contact.

        The `contacts.assigned_user_ids` column stores a comma‑separated list of
        user IDs. We join `users` to fetch the phone numbers of those users.
        """
        sql = """
            SELECT u.phone
            FROM users u
            JOIN contacts c ON u.id = CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(c.assigned_user_ids, ',', numbers.n), ',', -1) AS UNSIGNED)
            JOIN (
                SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
            ) numbers ON CHAR_LENGTH(c.assigned_user_ids) - CHAR_LENGTH(REPLACE(c.assigned_user_ids, ',', '')) >= numbers.n - 1
            WHERE c.id = %s AND c.tenant_id = %s
        """
        async with self.readonly() as cur:
            await cur.execute(sql, (contact_id, tenant_id))
            rows = await cur.fetchall()
        return [row["phone"] for row in rows]

    async def get_tenant_admins(self, tenant_id: int) -> List[str]:
        """Return phone numbers of users with ADMIN or MANAGER role for a tenant."""
        sql = """
            SELECT u.phone
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.tenant_id = %s AND r.id IN (2, 3)
        """
        async with self.readonly() as cur:
            await cur.execute(sql, (tenant_id,))
            rows = await cur.fetchall()
        return [row["phone"] for row in rows]
