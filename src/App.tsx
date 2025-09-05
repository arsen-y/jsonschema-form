import {
  Container,
  CssBaseline,
  ThemeProvider,
  Typography,
  Paper,
  Box,
} from '@mui/material';
import theme from './styles/theme';
import FormRenderer from './components/FormRenderer/FormRenderer';
import example from './schemas/example';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          JSON‑Schema Form Builder
        </Typography>
        <Paper sx={{ p: 2 }}>
          <FormRenderer schema={example} />
        </Paper>
        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            Схема подключена из src/schemas/example.schema.json
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
