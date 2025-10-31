import React, { useEffect, useState } from 'react';
import { TextField, Button, List, ListItem, ListItemButton, ListItemText, ListItemIcon, Collapse, Divider, IconButton } from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { any } from 'valibot';

const JsonTreeBuilder = ({groupsData,onUpdate}:{groupsData:any[],onUpdate:any}) => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [editingNode, setEditingNode] = useState<number | null>(null);
  const [editName, setEditName] = useState(''); // Para editar grupos
  const [editOptionName, setEditOptionName] = useState(''); // Para editar opciones
  const [openGroups, setOpenGroups] = useState<{[key: string]: boolean}>({}); // Para controlar la apertura de grupos


  // Función para agregar un grupo (nodo principal)
  const addGroup = () => {
    const newGroup = { id: Date.now(), name: '', options: [] }; // Grupo tiene un campo "options"
    setNodes([...nodes, newGroup]); // Agregamos el nuevo grupo a la lista existente
    setEditingNode(newGroup?.id); // Establecemos el nodo que estamos editando
  };

  // Función para agregar una opción dentro de un grupo
  const addOption = (groupId:any) => {
    const newOption = { id: Date.now(), name: '' }; // Nueva opción dentro del grupo
    const updateGroups = (items:any) =>
      items.map((item:any) =>
        item.id === groupId ? { ...item, options: [...item.options, newOption] } : item
      );
    setNodes(updateGroups(nodes)); // Actualizamos el grupo con la nueva opción
    setEditingNode(newOption.id); // Establecemos que estamos editando la nueva opción
  };

  // Función para guardar el nombre de un grupo u opción
  const saveName = (id:any, isOption = false) => {
    if (isOption) {
      if (editOptionName.trim() === '') return;
      const updateName = (items:any) =>
        items.map((item:any) => ({
          ...item,
          options: item.options.map((option:any) =>
            option.id === id ? { ...option, name: editOptionName } : option
          ),
        }));
      setNodes(updateName(nodes)); // Actualizamos el nombre de la opción
      setEditOptionName('');
    } else {
      if (editName.trim() === '') return;
      const updateName = (items:any) =>
        items.map((item:any) =>
          item.id === id
            ? { ...item, name: editName }
            : { ...item, options: item.options.map((option:any) => (option.id === id ? { ...option, name: editName } : option)) }
        );
      setNodes(updateName(nodes)); // Actualizamos el nombre del grupo
      setEditName('');

    }
    setEditingNode(null);
  };

  // Función para eliminar un grupo u opción
  const deleteNode = (id:any, isOption = false) => {
    const removeNode = (items:any) => {
      if (isOption) {
        return items.map((item:any) => ({
          ...item,
          options: item.options.filter((option:any) => option.id !== id),
        }));
      }
      return items.filter((item:any) => item.id !== id);
    };
    setNodes(removeNode(nodes)); // Eliminamos el grupo u opción
  };

  // Función para manejar la apertura de los grupos
  const handleClick = (groupId:any) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  useEffect(() => {
    console.log('groupsData:', nodes);
    //enviar los datos a equiment y actualizar la propiedad groupsData de el padre
    onUpdate(nodes)

  }, [nodes]);

  // Función para renderizar los grupos y sus opciones
  const renderGroups = (items:any) => (
    <List component="nav" aria-label="json-tree">
      {items.map((item:any) => (
        <div key={item.id}>
          <ListItem disablePadding className='bg-blue-100'>
            <ListItemButton onClick={() => handleClick(item.id)} >
              <ListItemIcon>
                <i className="tabler-folder text-xl" />
              </ListItemIcon>
              <ListItemText primary={`Grupo nombre: ${item.name}` || 'Nuevo Grupo'} />
              <i className={openGroups[item.id] ? 'tabler-chevron-up text-xl' : 'tabler-chevron-down text-xl'} />
            </ListItemButton>
          </ListItem>
          <Collapse in={openGroups[item.id]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {editingNode === item.id && item.name === '' ? (
                <>
                  <TextField value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nombre del grupo" fullWidth size="small" />
                  <Button onClick={() => saveName(item.id)} variant="contained" size="small">Guardar</Button>
                </>
              ) : (
                <>
                  
                  <div className='text-right'>
                  <Button className='mt-2' variant="outlined" size="small" onClick={() => addOption(item.id)}>Agregar Opción</Button>
                  <Button className='mt-2 ml-2' variant="outlined" size="small" onClick={() => deleteNode(item.id)}>Eliminar Grupo</Button>
                  </div>
                  
                  <Divider className='mt-4 mb-4'/>
                </>
              )}

              {/* Renderizar las opciones dentro del grupo */}
              {item.options.length > 0 && (
                <div className="ml-4">
                  <List component="div" disablePadding>
                    {item.options.map((option:any) => (
                      <ListItem key={option.id} disablePadding>
                        <ListItemButton>
                          <ListItemText primary={option.name || 'Nueva Opción'} />
                          <IconButton size="small" onClick={() => deleteNode(option.id, true)}><Delete fontSize="small" /></IconButton>
                          {editingNode === option.id && option.name === '' ? (
                            <>
                              <TextField value={editOptionName} onChange={(e) => setEditOptionName(e.target.value)} placeholder="Nombre de la opción" fullWidth size="small" />
                              <Button onClick={() => saveName(option.id, true)} variant="contained" size="small">Guardar</Button>
                            </>
                          ) : null}
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </div>
              )}
            </List>
          </Collapse>
          <Divider />
        </div>
      ))}
    </List>
  );

  return (
    <div className="p-4">
      
      <div className="mb-4 text-right">
      <Button startIcon={<Add />} onClick={addGroup} variant="outlined" size="small">Nuevo grupo de opciones</Button>
      </div>

      {renderGroups(nodes)}
    </div>
  );
};

export default JsonTreeBuilder;
