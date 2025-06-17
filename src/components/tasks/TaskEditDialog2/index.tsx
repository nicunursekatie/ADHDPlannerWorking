import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Tab, Tabs, Box, Button } from '@mui/material';

export interface TaskEditDialog2Props {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  onSubmit: () => void;
}

const steps = [
  { id: 'what-why', label: 'What & Why' },
  { id: 'when-importance', label: 'When & How Important' },
  { id: 'energy-time', label: 'Energy & Time' },
  { id: 'advanced', label: 'Advanced' },
];

export const TaskEditDialog2: React.FC<TaskEditDialog2Props> = ({ open, onClose, onDelete, onSubmit }) => {
  const [activeStep, setActiveStep] = React.useState(0);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Task</DialogTitle>

      {/* Stepper / Tabs */}
      <Tabs
        value={activeStep}
        onChange={(_, idx) => setActiveStep(idx)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        {steps.map((step) => (
          <Tab key={step.id} label={step.label} />
        ))}
      </Tabs>

      <DialogContent dividers sx={{ minHeight: 300 }}>
        {/* Render the body for the current step.  Placeholder content for now. */}
        <Box>
          {activeStep === 0 && <Box>TODO: What & Why form fields</Box>}
          {activeStep === 1 && <Box>TODO: When & How Important form fields</Box>}
          {activeStep === 2 && <Box>TODO: Energy & Time form fields</Box>}
          {activeStep === 3 && <Box>TODO: Advanced form fields</Box>}
        </Box>
      </DialogContent>

      {/* Sticky footer actions */}
      <DialogActions sx={{ position: 'sticky', bottom: 0, bgcolor: 'background.paper' }}>
        <Button color="error" onClick={onDelete}>Delete</Button>
        <Box flexGrow={1} />
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskEditDialog2;
