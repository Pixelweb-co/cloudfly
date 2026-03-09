'use client'

import React from 'react'

import SubscriptionEditView from '@/views/administracion/subscriptions/edit'

const EditSubscriptionPage = ({ params }: { params: { id: string } }) => {
    return <SubscriptionEditView subscriptionId={params.id} />
}

export default EditSubscriptionPage
