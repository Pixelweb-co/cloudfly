'use client'

import Grid from '@mui/material/Grid'
import ContactsListTable from './ContactsListTable'
import type { ContactType } from '@/types/apps/contactType'

const ContactsList = ({ reload, contactsData }: { reload: any; contactsData: ContactType[] }) => {
    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <ContactsListTable tableData={contactsData} reload={reload} />
            </Grid>
        </Grid>
    )
}

export default ContactsList
