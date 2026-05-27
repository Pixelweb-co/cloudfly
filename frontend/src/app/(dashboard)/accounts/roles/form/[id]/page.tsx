import RoleForm from '@/views/apps/roles/form/RoleForm'

const EditRolePage = ({ params }: { params: { id: string } }) => {
    return <RoleForm id={params.id} />
}

export default EditRolePage
