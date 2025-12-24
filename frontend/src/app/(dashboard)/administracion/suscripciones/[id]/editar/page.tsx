'use client'

import React from 'react'
import SubscriptionEditForm from '@/views/settings/subscriptions/edit/SubscriptionEditForm'

const EditSubscriptionPage = ({ params }: { params: { id: string } }) => {
    return <SubscriptionEditForm subscriptionId={params.id} />
}

export default EditSubscriptionPage
