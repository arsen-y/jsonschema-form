import { Box } from '@mui/material';

export default function JsonView({ data }: { data: unknown }) {
  return (
    <Box
      component="pre"
      sx={{
        p: 2,
        bgcolor: '#0b1021',
        color: '#d6deeb',
        borderRadius: 2,
        overflow: 'auto',
      }}
    >
      {JSON.stringify(data, null, 2)}
    </Box>
  );
}
