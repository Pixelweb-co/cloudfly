import React from 'react';
import { MenuItem, Select, Checkbox, ListItemText } from '@mui/material';

const ColumnSelector = ({ table }:{table:any}) => {
  const allColumns = table.getAllColumns();
  const visibleColumns = allColumns.filter((col:any) => col.getIsVisible());

  const handleColumnChange = (event:any) => {
    const selectedColumns = event.target.value;

    allColumns.forEach((column:any) => {
      column.toggleVisibility(selectedColumns.includes(column.id));
    });
  };

  return (
    <Select
      multiple
      value={visibleColumns.map((col:any) => col.id)}
      onChange={handleColumnChange}
      renderValue={(selected) => (selected.length === 0 ? 'Ninguna columna' : selected.join(', '))}
      className="max-sm:is-full sm:is-[140px]"
    >
      <MenuItem value="all">
        <Checkbox
          checked={visibleColumns.length === allColumns.length}
          indeterminate={
            visibleColumns.length > 0 && visibleColumns.length < allColumns.length
          }
        />
        <ListItemText primary="Todas las columnas" />
      </MenuItem>
      {allColumns.map((column:any) => (
        <MenuItem key={column.id} value={column.id}>
          <Checkbox checked={column.getIsVisible()} />
          <ListItemText primary={column.id} />
        </MenuItem>
      ))}
    </Select>
  );
};

export default ColumnSelector;
