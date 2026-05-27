'use client';

// React Imports
import type { ReactElement } from 'react';

// Next Imports
import dynamic from 'next/dynamic';

// MUI Imports
import Grid from '@mui/material/Grid';

// Component Imports
import UserLeftOverview from '@views/apps/user/view/user-left-overview';
import UserRight from '@views/apps/user/view/user-right';

// Utils
import { userMethods } from '@/utils/userMethods';

// Dynamic Imports
const OverViewTab = dynamic(() => import('@views/apps/user/view/user-right/overview'));
const SecurityTab = dynamic(() => import('@views/apps/user/view/user-right/security'));
const SignatureTab = dynamic(() => import('@views/apps/user/view/user-right/signature'));

// Tab Content Function
const tabContentList = () => {
  const contentTabs: any = {
    overview: <OverViewTab />,
    security: <SecurityTab />,
  };

  if (userMethods.isRole('SUPERADMIN') || userMethods.isRole('BIOMEDICAL')) {
    contentTabs.signature = <SignatureTab />;
  }

  return contentTabs;
};

const UserViewTab = () => {
  const data: any = []; // Puedes agregar lógica aquí si es necesario

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} lg={4} md={5}>
        <UserLeftOverview />
      </Grid>
      <Grid item xs={12} lg={8} md={7}>
        <UserRight tabContentList={tabContentList()} />
      </Grid>
    </Grid>
  );
};

export default UserViewTab;
